import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { analyzeDailyMood } from '../../../../lib/aiService';
import { getDateNumbers } from '../../../../lib/journalUtils';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = localUser;

    const body = await request.json();
    const { date } = body;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check if summary already exists
    const existingSummary = await prisma.dailySummary.findFirst({
      where: {
        user_id: user.id,
        date: {
          gte: targetDate,
          lt: nextDay
        }
      }
    });

    if (existingSummary) {
      return NextResponse.json({
        success: true,
        summary: existingSummary,
        message: 'Daily summary already exists for this date',
        isNew: false
      });
    }

    // Get data for the target date
    const [moodData, journalData, sessionData] = await Promise.all([
      prisma.mood.findFirst({
        where: {
          user_id: user.id,
          date: {
            gte: targetDate,
            lt: nextDay
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.journal.findMany({
        where: {
          user_id: user.id,
          date: {
            gte: targetDate,
            lt: nextDay
          }
        },
        select: {
          id: true,
          content: true,
          mood_emoji: true,
          title: true
        }
      }),
      prisma.perspectiveSession.findMany({
        where: {
          user_id: user.id,
          date: {
            gte: targetDate,
            lt: nextDay
          }
        },
        select: {
          id: true,
          user_input: true,
          status: true
        }
      })
    ]);

    // Only create summary if there's some activity
    if (!moodData && journalData.length === 0 && sessionData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No activity found for this date. Create some mood entries, journals, or perspective sessions first.',
        isNew: false
      });
    }

    // Generate AI analysis
    const aiAnalysis = await analyzeDailyMood(moodData, journalData, sessionData);

    // Get date numbers
    const { day, week, month } = getDateNumbers(targetDate);
    const year = targetDate.getFullYear();

    // Create daily summary
    const summary = await prisma.dailySummary.create({
      data: {
        user_id: user.id,
        date: targetDate,
        day,
        week,
        month,
        year,
        mood_emoji: moodData?.mood_emoji || null,
        mood_rate: moodData?.mood_rate || null,
        happiness_score: aiAnalysis.happiness_score,
        sadness_score: aiAnalysis.sadness_score,
        anxiety_score: aiAnalysis.anxiety_score,
        energy_score: aiAnalysis.energy_score,
        loneliness_score: aiAnalysis.loneliness_score,
        overall_wellness: aiAnalysis.overall_wellness,
        ai_summary: aiAnalysis.ai_summary,
        key_insights: aiAnalysis.key_insights,
        journal_count: journalData.length,
        perspective_count: sessionData.length,
        mood_ids: moodData ? [moodData.id] : [],
        journal_ids: journalData.map(j => j.id),
        session_ids: sessionData.map(s => s.id)
      }
    });

    return NextResponse.json({
      success: true,
      summary,
      message: 'Daily summary generated successfully',
      isNew: true
    });

  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily summary' },
      { status: 500 }
    );
  }
}
