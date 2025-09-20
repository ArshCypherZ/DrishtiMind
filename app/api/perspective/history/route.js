import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/authUtils';

export async function GET(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    // Fetch perspective sessions with related data
    const sessions = await prisma.perspectiveSession.findMany({
      where: {
        user_id: user.id
      },
      include: {
        cards: {
          select: {
            id: true,
            title: true,
            content: true,
            card_type: true
          }
        },
        quizzes: {
          select: {
            id: true,
            question_text: true,
            answer_text: true,
            question_type: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.perspectiveSession.count({
      where: {
        user_id: user.id
      }
    });

    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      date: session.date,
      userInput: session.user_input,
      status: session.status,
      completedAt: session.completed_at,
      savedToJournal: session.saved_to_journal,
      cardsCount: session.cards.length,
      quizzesCount: session.quizzes.length,
      cards: session.cards,
      quizzes: session.quizzes
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching perspective sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
