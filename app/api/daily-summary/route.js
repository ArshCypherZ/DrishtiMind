import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { analyzeDailyMood } from '../../../lib/aiService';
import { getDateNumbers } from '../../../lib/journalUtils';

export async function GET(request) {
  try {
    const { userId } = auth();
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause = { user_id: user.id };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      // Get last N days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const summaries = await prisma.dailySummary.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        mood_emoji: true,
        mood_rate: true,
        happiness_score: true,
        sadness_score: true,
        anxiety_score: true,
        energy_score: true,
        loneliness_score: true,
        overall_wellness: true,
        ai_summary: true,
        key_insights: true,
        journal_count: true,
        perspective_count: true,
        created_at: true
      }
    });

    return NextResponse.json({ summaries });

  } catch (error) {
    console.error('Error fetching daily summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily summaries' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = auth();
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
        message: 'Daily summary already exists for this date'
      });
    }

    // Get data for the target date
    const [moodData, journalData, sessionData] = await Promise.all([
      // Get mood data
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
      // Get journal entries
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
      // Get perspective sessions
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
      message: 'Daily summary generated successfully'
    });

  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily summary' },
      { status: 500 }
    );
  }
}
