import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../../lib/authUtils';

export async function GET(request, { params }) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const sessionId = params.id;

    // Fetch session with all related data
    const session = await prisma.perspectiveSession.findFirst({
      where: {
        id: sessionId,
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
            question_type: true,
            answer_type: true,
            text_option: true,
            emojis_option: true,
            scale_min: true,
            scale_max: true,
            mcq_options: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Format quiz questions for frontend - match the exact structure expected by perspective page
    const formattedQuizzes = session.quizzes.map(quiz => {
      const baseQuestion = {
        id: quiz.id,
        question: quiz.question_text,
        type: quiz.question_type
      };

      // Add type-specific properties
      switch (quiz.question_type) {
        case 'text':
          return {
            ...baseQuestion,
            placeholder: quiz.text_option || 'Please share your thoughts...'
          };
        
        case 'multiple_choice':
          return {
            ...baseQuestion,
            options: quiz.mcq_options ? JSON.parse(quiz.mcq_options) : []
          };
        
        case 'scale':
          return {
            ...baseQuestion,
            min: quiz.scale_min || 1,
            max: quiz.scale_max || 5,
            minLabel: 'Low',
            maxLabel: 'High'
          };
        
        case 'emoji':
          return {
            ...baseQuestion,
            options: quiz.emojis_option ? JSON.parse(quiz.emojis_option) : []
          };
        
        default:
          return baseQuestion;
      }
    });

    // Create quiz answers object from existing answers
    const quizAnswers = {};
    session.quizzes.forEach(quiz => {
      if (quiz.answer_text) {
        // For scale questions, convert string back to number
        if (quiz.question_type === 'scale') {
          quizAnswers[quiz.id] = parseInt(quiz.answer_text);
        } else {
          quizAnswers[quiz.id] = quiz.answer_text;
        }
      }
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        userInput: session.user_input,
        status: session.status,
        date: session.date,
        completedAt: session.completed_at,
        savedToJournal: session.saved_to_journal,
        quizzes: formattedQuizzes,
        quizAnswers: quizAnswers,
        cards: session.cards
      }
    });

  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
