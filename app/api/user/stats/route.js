import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/authUtils';

export async function GET(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const localUserId = user.id;

    const journalsCount = await prisma.journal.count({
      where: { user_id: localUserId }
    });

    const moodsCount = await prisma.mood.count({
      where: { user_id: localUserId }
    });

    const notificationsCount = await prisma.notification.count({
      where: { user_id: localUserId }
    });

    const totalSessions = user.sessions;
    const totalJournals = journalsCount;
    const totalMoods = moodsCount;
    const totalNotifications = notificationsCount;

    const totalActivity = totalSessions + totalJournals + totalMoods;

    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentActivity = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as activity_count
      FROM (
        SELECT id FROM moods WHERE user_id = ${localUserId} AND date >= ${oneWeekAgo}
        UNION ALL
        SELECT id FROM journals WHERE user_id = ${localUserId} AND date >= ${oneWeekAgo}
        UNION ALL
        SELECT id FROM perspective_sessions WHERE user_id = ${localUserId} AND date >= ${oneWeekAgo}
      ) as recent
    `;

    const recentActivityCount = parseInt(recentActivity[0].activity_count) || 0;

    const avgMoodResult = await prisma.mood.aggregate({
      where: { user_id: localUserId },
      _avg: { mood_rate: true }
    });
    const averageMood = avgMoodResult._avg.mood_rate || 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const recentMoods = await prisma.mood.aggregate({
      where: { 
        user_id: localUserId,
        date: { gte: sevenDaysAgo }
      },
      _avg: { mood_rate: true }
    });
    
    const previousMoods = await prisma.mood.aggregate({
      where: { 
        user_id: localUserId,
        date: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
      },
      _avg: { mood_rate: true }
    });
    
    const recentAvg = recentMoods._avg.mood_rate || 0;
    const previousAvg = previousMoods._avg.mood_rate || 0;
    const moodTrend = recentAvg - previousAvg;
    const totalActivities = totalSessions + totalJournals + totalMoods;
    const completionRate = totalActivities > 0 ? Math.min(100, (totalActivities / 30) * 100) : 0;

    const wellnessScore = Math.min(100, Math.max(0, 
      (user.total_points / 100) * 0.3 + 
      (averageMood / 5) * 0.4 * 100 + 
      (user.current_streak / 7) * 0.3 * 100
    ));

    const stats = {
      total_points: user.total_points,
      current_streak: user.current_streak,
      longest_streak: user.longest_streak,
      total_sessions: totalSessions,
      total_journals: totalJournals,
      total_moods: totalMoods,
      total_notifications: totalNotifications,
      total_activity: totalActivity,
      recent_activity: recentActivityCount,
      average_mood: Math.round(averageMood * 100) / 100,
      mood_trend: Math.round(moodTrend * 100) / 100,
      completion_rate: Math.round(completionRate * 100) / 100,
      wellness_score: Math.round(wellnessScore * 100) / 100,
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
