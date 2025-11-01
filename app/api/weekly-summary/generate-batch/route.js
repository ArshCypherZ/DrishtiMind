import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { generateWeeklySummary } from '../../../../lib/aiService';
import { getDateNumbers } from '../../../../lib/journalUtils';
import notificationService from '../../../../lib/notificationService';

export async function POST(request) {
  try {
    // Authenticate cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: 0,
      errorDetails: [],
      weeklySummaryNotifications: 0
    };

    try {
      // Get all users who have activity in the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const activeUsers = await prisma.user.findMany({
        where: {
          OR: [
            {
              moods: {
                some: {
                  date: {
                    gte: oneWeekAgo
                  }
                }
              }
            },
            {
              journals: {
                some: {
                  date: {
                    gte: oneWeekAgo
                  }
                }
              }
            },
            {
              perspective_sessions: {
                some: {
                  date: {
                    gte: oneWeekAgo
                  }
                }
              }
            }
          ]
        },
        select: { id: true }
      });

      for (const user of activeUsers) {
        try {
          // Calculate the week date range (last completed week)
          const now = new Date();
          const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
          
          // Calculate the start of the last completed week
          let weekStart = new Date(now);
          weekStart.setDate(now.getDate() - currentDay); // Go to start of current week
          
          // If it's Sunday (0), go back 7 days to get previous week
          if (currentDay === 0) {
            weekStart.setDate(now.getDate() - 7);
          }
          
          // Set to start of that week (Sunday)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // Saturday
          
          const { week, month, year } = getDateNumbers(weekStart);

          // Check if weekly summary already exists
          const existingSummary = await prisma.WeeklySummary.findFirst({
            where: {
              user_id: user.id,
              week: week,
              month: month,
              year: year
            }
          });

          if (existingSummary) {
            results.processed++;
            continue;
          }

          // Get all data for this week
          const [dailySummaries, journals, perspectiveSessions, moods] = await Promise.all([
            prisma.dailySummary.findMany({
              where: {
                user_id: user.id,
                date: {
                  gte: weekStart,
                  lte: weekEnd
                }
              },
              orderBy: { date: 'asc' }
            }),
            prisma.journal.findMany({
              where: {
                user_id: user.id,
                date: {
                  gte: weekStart,
                  lte: weekEnd
                }
              },
              orderBy: { date: 'asc' }
            }),
            prisma.perspectiveSession.findMany({
              where: {
                user_id: user.id,
                date: {
                  gte: weekStart,
                  lte: weekEnd
                }
              },
              orderBy: { date: 'asc' }
            }),
            prisma.mood.findMany({
              where: {
                user_id: user.id,
                date: {
                  gte: weekStart,
                  lte: weekEnd
                }
              },
              orderBy: { date: 'asc' }
            })
          ]);

          // Skip if no activity for the week
          if (dailySummaries.length === 0 && journals.length === 0 && perspectiveSessions.length === 0 && moods.length === 0) {
            results.processed++;
            continue;
          }

          // Generate AI weekly summary
          const weeklyData = {
            dailySummaries,
            journals,
            perspectiveSessions,
            moods,
            weekStart,
            weekEnd
          };

          const aiSummary = await generateWeeklySummary(weeklyData);

          // Calculate averages and totals
          const avgMoodRate = moods.length > 0 
            ? moods.reduce((sum, mood) => sum + (mood.mood_rate || 5), 0) / moods.length 
            : null;

          const overallWellnessScore = dailySummaries.length > 0
            ? dailySummaries.reduce((sum, ds) => sum + (ds.overall_wellness || 5), 0) / dailySummaries.length
            : null;

          // Create weekly summary
          const weeklySummary = await prisma.WeeklySummary.create({
            data: {
              user_id: user.id,
              week_start: weekStart,
              week_end: weekEnd,
              week,
              month,
              year,
              avg_mood_emoji: moods.length > 0 ? 
                moods.sort((a, b) => (b.mood_rate || 5) - (a.mood_rate || 5))[0].mood_emoji : null,
              avg_mood_rate: avgMoodRate,
              overall_wellness_score: overallWellnessScore,
              total_journals: journals.length,
              total_perspective_sessions: perspectiveSessions.length,
              total_mood_entries: moods.length,
              dominant_theme: aiSummary.dominant_theme,
              growth_insights: aiSummary.growth_insights,
              achievement_highlights: aiSummary.achievement_highlights,
              challenges_faced: aiSummary.challenges_faced,
              ai_summary: aiSummary.detailed_summary,
              short_summary: aiSummary.short_summary,
              detailed_summary: aiSummary.detailed_summary,
              recommendations: aiSummary.recommendations,
              journal_ids: journals.map(j => j.id),
              session_ids: perspectiveSessions.map(s => s.id),
              mood_ids: moods.map(m => m.id),
              daily_summary_ids: dailySummaries.map(ds => ds.id)
            }
          });

          // Send notification for the weekly summary
          try {
            await notificationService.createWeeklySummaryNotification(user.id, weeklySummary);
            results.weeklySummaryNotifications++;
          } catch (notificationError) {
            console.error(`Error sending weekly summary notification for user ${user.id}:`, notificationError);
            // Don't fail the whole process if notification fails, just log it
          }

          results.created++;
          results.processed++;

        } catch (error) {
          console.error(`Error processing weekly summary for user ${user.id}:`, error);
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
        message: 'Weekly summary generation completed',
        results
      });

    } catch (error) {
      console.error('Error in batch weekly summary generation:', error);
      return NextResponse.json(
        { error: 'Failed to generate weekly summaries' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}