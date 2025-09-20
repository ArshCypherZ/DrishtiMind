import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { analyzeDailyMood } from '../../../../lib/aiService';
import { getDateNumbers } from '../../../../lib/journalUtils';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all users who have activity in the last 7 days
    const activeUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            moods: {
              some: {
                date: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            }
          },
          {
            journals: {
              some: {
                date: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            }
          },
          {
            perspective_sessions: {
              some: {
                date: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        ]
      },
      select: { id: true }
    });

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      errorDetails: []
    };

    for (const user of activeUsers) {
      try {
        // Check if summary already exists for today
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
          results.processed++;
          continue;
        }

        // Get user's data for the target date
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
          results.processed++;
          continue;
        }

        // Generate AI analysis
        const aiAnalysis = await analyzeDailyMood(moodData, journalData, sessionData);

        // Get date numbers
        const { day, week, month } = getDateNumbers(targetDate);
        const year = targetDate.getFullYear();

        // Create daily summary
        await prisma.dailySummary.create({
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

        results.created++;
        results.processed++;

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.errors++;
        results.errorDetails.push({
          userId: user.id,
          error: error.message
        });
        results.processed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Batch daily summary generation completed',
      results
    });

  } catch (error) {
    console.error('Error in batch daily summary generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily summaries' },
      { status: 500 }
    );
  }
}
