import { NextResponse } from 'next/server';
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/authUtils';

export async function POST(request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing from environment variables');
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
    
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { sessionId, userInput } = body;

    if (!sessionId || !userInput) {
      return NextResponse.json({ error: 'Session ID and user input are required' }, { status: 400 });
    }

    const session = await prisma.perspectiveSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const quizSchema = {
      name: "generateQuizQuestions",
      description: "Generates quiz questions for a perspective session",
      parametersJsonSchema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              oneOf: [
                {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["text"] },
                    question: { type: "string" },
                    placeholder: { type: "string" }
                  },
                  required: ["type", "question", "placeholder"]
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["multiple_choice"] },
                    question: { type: "string" },
                    options: { 
                      type: "array", 
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4
                    }
                  },
                  required: ["type", "question", "options"]
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["scale"] },
                    question: { type: "string" },
                    min: { type: "number" },
                    max: { type: "number" },
                    minLabel: { type: "string" },
                    maxLabel: { type: "string" }
                  },
                  required: ["type", "question", "min", "max", "minLabel", "maxLabel"]
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["emoji"] },
                    question: { type: "string" },
                    options: { 
                      type: "array", 
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4
                    }
                  },
                  required: ["type", "question", "options"]
                }
              ]
            },
            minItems: 4,
            maxItems: 4
          }
        },
        required: ["questions"]
      }
    };
    
    const prompt = `
    Based on this user's situation: "${userInput}"
    
    Generate 4 different types of questions to better understand their situation:
    
    1. A text input question asking for more details
    2. A multiple choice question with 4 options about their feelings/situation
    3. A scale question (1-5) about intensity/frequency
    4. An emoji multiple choice question with 4 emoji options
    
    Return ONLY a valid JSON object with this exact structure:
    {
      "questions": [
        {
          "type": "text",
          "question": "question text",
          "placeholder": "placeholder text"
        },
        {
          "type": "multiple_choice",
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"]
        },
        {
          "type": "scale",
          "question": "question text",
          "min": 1,
          "max": 5,
          "minLabel": "low label",
          "maxLabel": "high label"
        },
        {
          "type": "emoji",
          "question": "question text", 
          "options": ["😞", "😤", "😊", "😌"]
        }
      ]
    }`;

    const stream = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [quizSchema]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY
          }
        }
      }
    });
    
    let generatedQuiz = { questions: [] };
    let fullText = '';
    
    for await (const chunk of stream) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        const data = chunk.functionCalls[0].args;
        if (data.questions) {
          generatedQuiz.questions = data.questions;
        }
      }
    }
    
    if (generatedQuiz.questions.length === 0) {
      console.log('No structured data received, parsing raw text');
      try {
        // Try to parse raw text output
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in AI response');
        }
        generatedQuiz = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        console.error('Raw response:', fullText);
        return NextResponse.json({ error: 'Failed to generate quiz questions' }, { status: 500 });
      }
    }

    // Save questions to database
    const savedQuestions = [];
    for (const question of generatedQuiz.questions) {
      const savedQuestion = await prisma.perspectiveQuizz.create({
        data: {
          session_id: sessionId,
          question_type: question.type,
          question_text: question.question,
          answer_type: question.type,
          text_option: question.type === 'text' ? question.placeholder : null,
          emojis_option: question.type === 'emoji' ? JSON.stringify(question.options) : null,
          scale_min: question.type === 'scale' ? question.min : null,
          scale_max: question.type === 'scale' ? question.max : null,
          mcq_options: question.type === 'multiple_choice' ? JSON.stringify(question.options) : null
        }
      });
      
      savedQuestions.push({
        id: savedQuestion.id,
        type: question.type,
        question: question.question,
        placeholder: question.placeholder,
        options: question.options,
        min: question.min,
        max: question.max,
        minLabel: question.minLabel,
        maxLabel: question.maxLabel
      });
    }

    // Update session status
    await prisma.perspectiveSession.update({
      where: { id: sessionId },
      data: { status: 'understanding' }
    });

    return NextResponse.json({
      success: true,
      questions: savedQuestions,
      message: 'Quiz questions generated successfully'
    });

  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
