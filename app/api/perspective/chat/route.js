import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/authUtils';

export const runtime = 'nodejs';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { sessionId, message, history = [] } = body;

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'Session ID and message are required' }, { status: 400 });
    }

    // Fetch session and perspective cards
    const session = await prisma.perspectiveSession.findFirst({
      where: { id: sessionId, user_id: user.id },
      include: { cards: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Build context from perspective cards
    const cardsContext = session.cards.map(card => 
      `Card: "${card.title}"\nContent: ${card.content}\nType: ${card.card_type}`
    ).join('\n\n');

    const chatHistory = [];
    for (const h of history) {
      // Support either { role, content } or { user, assistant }
      if (h?.role && h?.content) {
        if (h.role === 'user') {
          chatHistory.push({ role: 'user', parts: [{ text: String(h.content) }] });
        } else if (h.role === 'assistant' || h.role === 'model') {
          chatHistory.push({ role: 'model', parts: [{ text: String(h.content) }] });
        }
        continue;
      }
      if (h?.user) {
        // Skip if this equals current message to avoid duplication
        if (String(h.user) !== String(message)) {
          chatHistory.push({ role: 'user', parts: [{ text: String(h.user) }] });
        }
      }
      if (h?.assistant) {
        chatHistory.push({ role: 'model', parts: [{ text: String(h.assistant) }] });
      }
    }

    // If no history provided, reconstruct from DB so the model knows prior turns
    if (chatHistory.length === 0) {
      const previous = await prisma.conversation.findMany({
        where: { session_id: sessionId, user_id: user.id },
        orderBy: { created_at: 'asc' },
        take: 20,
      });
      for (const turn of previous) {
        if (turn.message) {
          chatHistory.push({ role: 'user', parts: [{ text: String(turn.message) }] });
        }
        if (turn.response) {
          chatHistory.push({ role: 'model', parts: [{ text: String(turn.response) }] });
        }
      }
    }

    const systemInstruction = `
You are a compassionate AI coach helping users explore their perspective cards.
Focus on the user's situation and insights from their cards.
Keep responses: empathetic, supportive, actionable, encouraging, under 150 words, conversational.

User's perspective cards:\n${cardsContext}\n\nUser's original situation: "${session.user_input}"`;

    const chatSession = genAI.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory,
      config: {
        systemInstruction,
        // Keep outputs concise
        maxOutputTokens: 300,
        temperature: 0.6,
      },
    });

    // Send only the current user message
    const result = await chatSession.sendMessage({ message: message });
    const responseText = result?.text ?? '';

    // Save conversation to database
    const conversation = await prisma.conversation.create({
      data: {
        user_id: user.id,
        session_id: sessionId,
        message: message,
        response: responseText,
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: responseText,
      conversationId: conversation.id
    });

  } catch (error) {
    console.error('Error in chatbot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
