import { NextResponse } from 'next/server';
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/authUtils';

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export async function POST(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify session belongs to user and fetch all related data
    const session = await prisma.perspectiveSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      },
      include: {
        quizzes: true, // Include quiz questions and their answers
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Construct the context for Gemini based on user input and quiz answers
    let context = `User's initial situation: "${session.user_input}"\n\n`;
    context += "User's answers to understanding questions:\n";
    session.quizzes.forEach(quiz => {
      context += `- Question: "${quiz.question_text}"\n`;
      context += `  Answer: "${quiz.answer_text || quiz.emojis_option || quiz.scale_min || quiz.mcq_options}"\n`;
    });

    // Schema for perspective cards
    const cardsSchema = {
      name: "generatePerspectiveCards",
      description: "Generates perspective cards for a perspective session",
      parametersJsonSchema: {
        type: "object",
        properties: {
          cards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                card_type: { 
                  type: "string",
                  enum: ["growth", "compassion", "action", "insight"]
                }
              },
              required: ["title", "content", "card_type"]
            },
            minItems: 3,
            maxItems: 3
          }
        },
        required: ["cards"]
      }
    };
    
    const prompt = `
    Based on the following context, write 3 short, supportive perspective cards. 

    Make them:
    - Conversational and easy to read (like advice from a friend, not a textbook).
    - No jargon or long sentences.
    - Each card should have a clear, catchy title and 3-5 sentences of content.
    - Tone: encouraging, natural, and empathetic.
    - Each card should offer a different angle: growth, compassion, action, or insight.

    Context:
    ${context}

    Now generate exactly 3 perspective cards in this structure:
    `;


    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [cardsSchema]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY
          }
        }
      }
    });
    
    let cardsData;
    try {
      cardsData = { cards: result.functionCalls[0].args.cards };
    } catch (parseError) {
      console.error('Failed to parse Gemini response for cards:', parseError);
      return NextResponse.json({ error: 'Failed to generate perspective cards' }, { status: 500 });
    }

    // Save cards to database
    const savedCards = [];
    for (const card of cardsData.cards) {
      const savedCard = await prisma.perspectiveCard.create({
        data: {
          session_id: sessionId,
          title: card.title,
          content: card.content,
          card_type: card.card_type || 'insight' // Default to 'insight' if not provided
        }
      });
      savedCards.push(savedCard);
    }

    // Update session status to completed
    await prisma.perspectiveSession.update({
      where: { id: sessionId },
      data: { status: 'completed', completed_at: new Date() }
    });

    // Award points for completing the session
    const pointsEarned = 50;
    await prisma.user.update({
      where: { id: user.id },
      data: { total_points: { increment: pointsEarned } }
    });

    return NextResponse.json({
      success: true,
      cards: savedCards,
      pointsEarned: pointsEarned,
      message: 'Perspective cards generated successfully'
    });

  } catch (error) {
    console.error('Error generating perspective cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
