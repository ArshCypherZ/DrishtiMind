import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/authUtils';
import { generatePerspectiveJournalContent } from '../../../../lib/aiService';

export async function POST(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get session with cards and quizzes
    const session = await prisma.perspectiveSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      },
      include: {
        cards: true,
        quizzes: true
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if already saved to journal
    if (session.saved_to_journal) {
      return NextResponse.json({ 
        error: 'This perspective session has already been saved to your journal',
        alreadySaved: true 
      }, { status: 400 });
    }

    // Generate AI-powered journal content
    const sessionData = {
      userInput: session.user_input,
      quizzes: session.quizzes,
      cards: session.cards
    };

    const aiGeneratedContent = await generatePerspectiveJournalContent(sessionData);

    // Calculate points based on content length and session completion
    const basePoints = 25; // Base points for saving to journal
    const contentBonus = Math.min(Math.floor(aiGeneratedContent.content.length / 20), 25);
    const totalPoints = basePoints + contentBonus;

    // Use transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Create journal entry
      const journal = await tx.journal.create({
        data: {
          user_id: user.id,
          date: session.date,
          mood_emoji: aiGeneratedContent.mood_emoji,
          title: aiGeneratedContent.title,
          content: aiGeneratedContent.content,
          summary: aiGeneratedContent.summary,
          points_earned: totalPoints,
          tags: JSON.stringify(aiGeneratedContent.tags)
        }
      });

      // Update session to mark as saved
      await tx.perspectiveSession.update({
        where: { id: sessionId },
        data: { saved_to_journal: true }
      });

      // Award additional points
      await tx.user.update({
        where: { id: user.id },
        data: {
          total_points: { increment: totalPoints }
        }
      });

      return journal;
    });

    // Generate notifications based on milestones (journal milestones since it creates a journal)
    try {
      const notificationService = (await import('../../../../lib/notificationService')).default;
      await notificationService.checkJournalMilestones(user.id);
      await notificationService.checkStreakMilestones(user.id);
    } catch (notificationError) {
      console.error('Error generating notifications:', notificationError);
    }

    return NextResponse.json({
      success: true,
      journalId: result.id,
      pointsEarned: totalPoints,
      message: 'Perspective session saved to journal successfully',
      journal: {
        ...result,
        tags: aiGeneratedContent.tags,
        date: result.date.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error saving session to journal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
