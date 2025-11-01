import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { perspectiveSessionId, persona, personaTraits, goal, conversationContext } = await request.json();

    if (!perspectiveSessionId || !persona || !goal || !personaTraits || personaTraits.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const perspectiveSession = await prisma.perspectiveSession.findUnique({
      where: { id: perspectiveSessionId },
      include: { cards: true }
    });

    if (!perspectiveSession) {
      return NextResponse.json({ error: 'Perspective session not found' }, { status: 404 });
    }

    const practiceSession = await prisma.practiceSession.create({
      data: {
        user_id: user.id,
        perspective_session_id: perspectiveSessionId,
        persona,
        persona_traits: personaTraits,
        goal,
        context: conversationContext,
        status: 'pending'
      }
    });

    const systemPrompt = `You are roleplaying as ${persona}. Your personality traits are: ${personaTraits.join(', ')}.

The user is practicing a difficult conversation with you. Their goal is: ${goal}

Context of the situation: ${conversationContext}

Key perspectives they've learned:
${perspectiveSession.cards.map(card => `- ${card.title}: ${card.content}`).join('\n')}

IMPORTANT INSTRUCTIONS:
- Stay in character as ${persona} with the traits: ${personaTraits.join(', ')}
- Respond naturally as this person would in this situation
- Be realistic - show the emotions and reactions this person would have
- Don't make it too easy - challenge the user appropriately
- Keep responses conversational and brief (2-3 sentences)
- If the user communicates well, acknowledge it naturally
- End the conversation naturally when it reaches a good conclusion`;

    const dialmateResponse = await fetch(process.env.VOICE_BACKEND_URL + '/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: practiceSession.id,
        systemPrompt
      })
    });

    if (!dialmateResponse.ok) {
      throw new Error('Failed to create practice room');
    }

    const { room_url, token } = await dialmateResponse.json();

    await prisma.practiceSession.update({
      where: { id: practiceSession.id },
      data: { room_url, status: 'active' }
    });

    return NextResponse.json({ 
      practiceSessionId: practiceSession.id,
      roomUrl: room_url,
      token 
    });

  } catch (error) {
    console.error('Error creating practice session:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
