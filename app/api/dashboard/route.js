import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuthenticatedUser } from '../../../lib/authUtils';

export async function GET(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'week';

    // Calculate date ranges based on timeRange
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch all data in parallel for better performance
    const [
      userStats,
      moodData,
      journalData,
      perspectiveData,
      dailySummaries,
      weeklySummaries,
      recentActivity
    ] = await Promise.all([
      // User stats
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          total_points: true,
          current_streak: true,
          longest_streak: true,
          sessions: true
        }
      }),

      // Mood data
      prisma.mood.findMany({
        where: {
          user_id: user.id,
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' },
        take: 100
      }),

      // Journal data
      prisma.journal.findMany({
        where: {
          user_id: user.id,
          created_at: { gte: startDate }
        },
        orderBy: { created_at: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          content: true,
          summary: true,
          mood_emoji: true,
          points_earned: true,
          created_at: true,
          tags: true
        }
      }),

      // Perspective sessions
      prisma.perspectiveSession.findMany({
        where: {
          user_id: user.id,
          date: { gte: startDate }
        },
        orderBy: { date: 'desc' },
        take: 30,
        include: {
          cards: true,
          quizzes: true
        }
      }),

      // Daily summaries for AI insights
      prisma.dailySummary.findMany({
        where: {
          user_id: user.id,
          date: { gte: startDate }
        },
        orderBy: { date: 'desc' },
        take: 30
      }),

      // Weekly summaries for broader insights
      prisma.weeklySummary.findMany({
        where: {
          user_id: user.id,
          week_start: { gte: startDate }
        },
        orderBy: { week_start: 'desc' },
        take: 12
      }),

      // Recent activity for engagement tracking
      prisma.$queryRaw`
        SELECT 
          'mood' as type,
          date as created_at,
          mood_rate as value
        FROM moods 
        WHERE user_id = ${user.id} AND date >= ${startDate}
        
        UNION ALL
        
        SELECT 
          'journal' as type,
          created_at,
          points_earned as value
        FROM journals 
        WHERE user_id = ${user.id} AND created_at >= ${startDate}
        
        UNION ALL
        
        SELECT 
          'perspective' as type,
          date as created_at,
          1 as value
        FROM perspective_sessions 
        WHERE user_id = ${user.id} AND date >= ${startDate}
        
        ORDER BY created_at DESC
        LIMIT 50
      `
    ]);

    // Calculate wellness overview
    const wellness = calculateWellnessOverview(userStats, moodData, dailySummaries);

    // Calculate mood analytics
    const moodAnalytics = calculateMoodAnalytics(moodData, dailySummaries);

    // Calculate activity metrics
    const activity = calculateActivityMetrics(recentActivity, journalData, perspectiveData);

    // Calculate journal insights
    const journalInsights = calculateJournalInsights(journalData);

    // Calculate streak information
    const streaks = calculateStreakInfo(userStats, recentActivity);

    // Generate personalized insights
    const insights = generatePersonalizedInsights(moodData, journalData, perspectiveData, dailySummaries);

    // Generate weekly highlights
    const highlights = generateWeeklyHighlights(weeklySummaries, journalData, moodData);

    return NextResponse.json({
      success: true,
      data: {
        wellness,
        moodAnalytics,
        activity,
        journalInsights,
        streaks,
        insights,
        highlights,
        timeRange
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateWellnessOverview(userStats, moodData, dailySummaries) {
  const averageMood = moodData.length > 0 
    ? moodData.reduce((sum, mood) => sum + mood.mood_rate, 0) / moodData.length 
    : 0;

  const overallWellness = dailySummaries.length > 0
    ? dailySummaries.reduce((sum, summary) => sum + (summary.overall_wellness || 0), 0) / dailySummaries.length
    : averageMood;

  const wellnessScore = Math.min(100, Math.max(0,
    (userStats?.total_points / 100) * 0.3 +
    (averageMood / 10) * 0.4 * 100 +
    (userStats?.current_streak / 7) * 0.3 * 100
  ));

  return {
    wellnessScore: Math.round(wellnessScore),
    averageMood: Math.round(averageMood * 100) / 100,
    overallWellness: Math.round(overallWellness * 100) / 100,
    totalPoints: userStats?.total_points || 0,
    trend: calculateTrend(moodData)
  };
}

function calculateMoodAnalytics(moodData, dailySummaries) {
  if (moodData.length === 0) {
    return {
      averageMood: 0,
      moodTrend: [],
      moodDistribution: {},
      insights: []
    };
  }

  const averageMood = moodData.reduce((sum, mood) => sum + mood.mood_rate, 0) / moodData.length;
  
  // Create mood trend data
  const moodTrend = moodData.map(mood => ({
    date: mood.date.toISOString().split('T')[0],
    mood: mood.mood_rate,
    emoji: mood.mood_emoji
  }));

  // Calculate mood distribution
  const moodDistribution = moodData.reduce((acc, mood) => {
    const range = getMoodRange(mood.mood_rate);
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {});

  // Generate mood insights
  const insights = [];
  if (dailySummaries.length > 0) {
    const latestSummary = dailySummaries[0];
    if (latestSummary.ai_summary) {
      insights.push({
        type: 'ai_insight',
        text: latestSummary.ai_summary,
        date: latestSummary.date
      });
    }
  }

  return {
    averageMood: Math.round(averageMood * 100) / 100,
    moodTrend,
    moodDistribution,
    insights
  };
}

function calculateActivityMetrics(recentActivity, journalData, perspectiveData) {
  const totalActivities = recentActivity?.length || 0;
  
  // Activity by type
  const activityByType = recentActivity?.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {}) || {};

  // Calculate engagement score
  const engagementScore = Math.min(100, 
    ((journalData?.length || 0) * 10) + 
    ((perspectiveData?.length || 0) * 15) + 
    ((activityByType.mood || 0) * 5)
  );

  // Most active day
  const activityByDay = recentActivity?.reduce((acc, activity) => {
    const day = new Date(activity.created_at).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {}) || {};

  const mostActiveDay = Object.entries(activityByDay)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  return {
    totalActivities,
    activityByType,
    engagementScore,
    mostActiveDay,
    journalsCount: journalData?.length || 0,
    perspectiveSessionsCount: perspectiveData?.length || 0,
    moodEntriesCount: activityByType.mood || 0
  };
}

function calculateJournalInsights(journalData) {
  if (!journalData || journalData.length === 0) {
    return {
      totalEntries: 0,
      averageLength: 0,
      topTags: [],
      recentThemes: [],
      moodPatterns: {}
    };
  }

  const totalEntries = journalData.length;
  const averageLength = journalData.reduce((sum, journal) => 
    sum + (journal.content?.length || 0), 0) / totalEntries;

  // Extract and count tags
  const tagCounts = {};
  journalData.forEach(journal => {
    if (journal.tags && Array.isArray(journal.tags)) {
      journal.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const topTags = Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // Analyze mood patterns from journals
  const moodPatterns = journalData.reduce((acc, journal) => {
    if (journal.mood_emoji) {
      acc[journal.mood_emoji] = (acc[journal.mood_emoji] || 0) + 1;
    }
    return acc;
  }, {});

  return {
    totalEntries,
    averageLength: Math.round(averageLength),
    topTags,
    moodPatterns,
    recentEntries: journalData.slice(0, 3).map(journal => ({
      id: journal.id,
      title: journal.title,
      moodEmoji: journal.mood_emoji,
      date: journal.created_at
    }))
  };
}

function calculateStreakInfo(userStats, recentActivity) {
  const currentStreak = userStats?.current_streak || 0;
  const longestStreak = userStats?.longest_streak || 0;

  // Calculate streak consistency
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toDateString());
  }

  const activeDays = recentActivity?.filter(activity => 
    last7Days.includes(new Date(activity.created_at).toDateString())
  ).length || 0;

  const consistency = (activeDays / 7) * 100;

  return {
    currentStreak,
    longestStreak,
    consistency: Math.round(consistency),
    activeDaysThisWeek: activeDays
  };
}

function generatePersonalizedInsights(moodData, journalData, perspectiveData, dailySummaries) {
  const insights = [];

  // Mood-based insights
  if (moodData.length > 0) {
    const recentMoods = moodData.slice(-7);
    const averageRecentMood = recentMoods.reduce((sum, mood) => sum + mood.mood_rate, 0) / recentMoods.length;
    
    if (averageRecentMood >= 8) {
      insights.push({
        type: 'positive',
        title: 'High Energy Detected',
        description: 'Your mood has been consistently positive lately. This is a great time to tackle new challenges!',
        icon: '⚡',
        priority: 'high'
      });
    } else if (averageRecentMood <= 4) {
      insights.push({
        type: 'support',
        title: 'Gentle Reminder',
        description: 'Consider some self-care activities. Your well-being matters, and taking breaks is perfectly okay.',
        icon: '💙',
        priority: 'high'
      });
    }
  }

  // Journal-based insights
  if (journalData && journalData.length > 0) {
    insights.push({
      type: 'achievement',
      title: 'Consistent Journaling',
      description: `You've written ${journalData.length} journal entries. Writing regularly helps process emotions effectively.`,
      icon: '📝',
      priority: 'medium'
    });
  }

  // Perspective session insights
  if (perspectiveData && perspectiveData.length > 0) {
    insights.push({
      type: 'growth',
      title: 'Growth Mindset',
      description: 'Your perspective sessions show commitment to personal growth. Keep exploring new viewpoints!',
      icon: '🌱',
      priority: 'medium'
    });
  }

  // AI-powered insights from daily summaries
  if (dailySummaries && dailySummaries.length > 0) {
    const latestSummary = dailySummaries[0];
    if (latestSummary.key_insights) {
      insights.push({
        type: 'ai_insight',
        title: 'Daily Reflection',
        description: latestSummary.ai_summary || 'Keep tracking your wellness journey for more personalized insights.',
        icon: '🤖',
        priority: 'low'
      });
    }
  }

  return insights.slice(0, 4); // Return top 4 insights
}

function generateWeeklyHighlights(weeklySummaries, journalData, moodData) {
  const highlights = [];

  if (weeklySummaries && weeklySummaries.length > 0) {
    const latestWeek = weeklySummaries[0];
    
    if (latestWeek.achievement_highlights && latestWeek.achievement_highlights.length > 0) {
      highlights.push({
        type: 'achievement',
        title: 'Weekly Achievements',
        items: latestWeek.achievement_highlights,
        icon: '🏆'
      });
    }

    if (latestWeek.dominant_theme) {
      highlights.push({
        type: 'theme',
        title: 'Theme of the Week',
        content: latestWeek.dominant_theme,
        icon: '🎯'
      });
    }
  }

  // Add mood highlights if available
  if (moodData && moodData.length > 0) {
    const bestMoodDay = moodData.reduce((best, mood) => 
      mood.mood_rate > best.mood_rate ? mood : best, moodData[0]);
    
    highlights.push({
      type: 'mood',
      title: 'Best Mood Day',
      content: `${bestMoodDay.mood_emoji} ${new Date(bestMoodDay.date).toLocaleDateString()}`,
      icon: '😊'
    });
  }

  return highlights;
}

function getMoodRange(moodRate) {
  if (moodRate >= 8) return 'Excellent';
  if (moodRate >= 6) return 'Good';
  if (moodRate >= 4) return 'Okay';
  if (moodRate >= 2) return 'Low';
  return 'Very Low';
}

function calculateTrend(moodData) {
  if (moodData.length < 2) return 'stable';
  
  const recent = moodData.slice(-3).reduce((sum, mood) => sum + mood.mood_rate, 0) / Math.min(3, moodData.length);
  const previous = moodData.slice(-6, -3).reduce((sum, mood) => sum + mood.mood_rate, 0) / Math.min(3, moodData.length - 3);
  
  if (recent > previous + 0.5) return 'improving';
  if (recent < previous - 0.5) return 'declining';
  return 'stable';
}
