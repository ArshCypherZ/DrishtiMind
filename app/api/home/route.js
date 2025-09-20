import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuthenticatedUser } from '../../../lib/authUtils';

export async function GET(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const localUserId = user.id;

    // Personalized greeting
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';

    // Today’s mood
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMood = await prisma.mood.findFirst({
      where: {
        user_id: localUserId,
        date: { gte: today, lt: tomorrow }
      },
      orderBy: { date: 'desc' }
    });

    // Recent activities
    const [recentJournals, recentSessions, unreadNotifications] = await Promise.all([
      prisma.journal.findMany({
        where: { user_id: localUserId },
        orderBy: { created_at: 'desc' },
        take: 3,
        select: { id: true, title: true, mood_emoji: true, created_at: true }
      }),
      prisma.perspectiveSession.findMany({
        where: { user_id: localUserId },
        orderBy: { created_at: 'desc' },
        take: 3,
        select: { id: true, user_input: true, status: true, created_at: true }
      }),
      prisma.notification.count({
        where: { user_id: localUserId, is_read: false }
      })
    ]);

    // Mood trends (7 days) - using mood data since dailySummary doesn't exist
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let moodTrends = [];
    try {
      const rawMoodTrends = await prisma.mood.findMany({
        where: { user_id: localUserId, date: { gte: sevenDaysAgo, lte: now } },
        orderBy: { date: 'asc' },
        select: { date: true, mood_rate: true, mood_emoji: true }
      });

      // Group by date and get the latest mood for each day
      const moodByDate = {};
      rawMoodTrends.forEach(mood => {
        const dateKey = mood.date.toISOString().split('T')[0];
        if (!moodByDate[dateKey] || mood.date > moodByDate[dateKey].date) {
          moodByDate[dateKey] = mood;
        }
      });

      moodTrends = Object.values(moodByDate).map(mood => ({
        date: mood.date,
        mood_rate: mood.mood_rate,
        mood_emoji: mood.mood_emoji,
        // Add default values for missing fields
        overall_wellness: mood.mood_rate,
        ai_summary: `Mood: ${mood.mood_emoji || 'N/A'}`,
        happiness_score: mood.mood_rate >= 4 ? mood.mood_rate : 2,
        sadness_score: mood.mood_rate <= 2 ? 5 - mood.mood_rate : 1,
        anxiety_score: Math.max(1, 6 - mood.mood_rate),
        energy_score: mood.mood_rate,
        loneliness_score: mood.mood_rate <= 2 ? 4 : 1
      }));
    } catch (error) {
      console.error('Error fetching mood trends:', error);
      moodTrends = [];
    }

    // Normalize to 7 days chart
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(sevenDaysAgo);
      currentDate.setDate(sevenDaysAgo.getDate() + i);

      const dayMood = moodTrends.find(mood => {
        return mood.date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0];
      });

      chartData.push({
        date: currentDate.toISOString().split('T')[0],
        day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        mood_rate: dayMood?.mood_rate ?? null,
        mood_emoji: dayMood?.mood_emoji ?? null,
        overall_wellness: dayMood?.overall_wellness ?? null,
        ai_summary: dayMood?.ai_summary ?? null,
        happiness_score: dayMood?.happiness_score ?? null,
        sadness_score: dayMood?.sadness_score ?? null,
        anxiety_score: dayMood?.anxiety_score ?? null,
        energy_score: dayMood?.energy_score ?? null,
        loneliness_score: dayMood?.loneliness_score ?? null
      });
    }

    const recommendations = generateSmartRecommendations(todayMood, recentJournals.length, recentSessions.length);

    return NextResponse.json({
      greeting,
      user: { name: user.first_name },
      todayMood,
      recentActivity: {
        journals: recentJournals,
        sessions: recentSessions,
        unreadNotifications
      },
      moodTrends: chartData,
      recommendations
    });

  } catch (error) {
    console.error('Error fetching home data:', error);
    return NextResponse.json({ error: 'Failed to fetch home data' }, { status: 500 });
  }
}

function generateSmartRecommendations(todayMood, journalCount, sessionCount) {
  const recommendations = [];

  if (!todayMood) {
    recommendations.push({
      title: "Check in with yourself",
      description: "Take a moment to reflect on how you're feeling right now",
      type: "mood"
    });
  } else if (todayMood.mood_rate <= 3) {
    recommendations.push({
      title: "Self-care reminder",
      description: "You're having a tough day. Be gentle with yourself",
      type: "support"
    });
  } else if (todayMood.mood_rate >= 8) {
    recommendations.push({
      title: "Share your positive energy",
      description: "Reach out to someone who might need a boost",
      type: "social"
    });
  } else if (todayMood.mood_emoji === '🤔') {
    recommendations.push({
      title: "Mindful reflection",
      description: "Perfect time for some quiet contemplation or journaling",
      type: "reflection"
    });
  }

  if (journalCount === 0) {
    recommendations.push({
      title: "Start your journaling journey",
      description: "Writing thoughts can help process emotions",
      type: "journal"
    });
  }

  if (sessionCount === 0) {
    recommendations.push({
      title: "Begin perspective work",
      description: "A fresh perspective can help you see challenges differently",
      type: "perspective"
    });
  }

  const generalRecommendations = [
    { title: "Mindful breathing", description: "Take 5 deep breaths", type: "mindfulness" },
    { title: "Gratitude practice", description: "Think of three things you’re grateful for", type: "wellness" },
    { title: "Gentle movement", description: "Go for a short walk or stretch", type: "wellness" }
  ];

  return [...recommendations, ...generalRecommendations].slice(0, 2);
}
