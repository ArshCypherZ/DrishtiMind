import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/authUtils';

export async function POST(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { sessionId, answers } = body;

    if (!sessionId || !answers) {
      return NextResponse.json({ error: 'Session ID and answers are required' }, { status: 400 });
    }

    // Verify session belongs to user
    const session = await prisma.perspectiveSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update quiz answers
    for (const answer of answers) {
      await prisma.perspectiveQuizz.update({
        where: { id: answer.questionId },
        data: {
          answer_text: answer.value ? String(answer.value) : null
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Answers submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting quiz answers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
