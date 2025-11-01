import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuthenticatedUser } from '../../../lib/authUtils';
import { getDateNumbers } from '../../../lib/journalUtils';

export async function GET(request) {
  try {
    
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'recent'; // recent, trends, today
    const days = parseInt(searchParams.get('days')) || 7;

    switch (type) {
      case 'today':
        // Get today's mood
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayMood = await prisma.mood.findFirst({
          where: {
            user_id: user.id,
            date: {
              gte: today,
              lt: tomorrow
            }
          },
          orderBy: { date: 'desc' }
        });

        return NextResponse.json({ mood: todayMood });

      case 'trends':
        // Get mood trends for the last N days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const moodTrends = await prisma.mood.findMany({
          where: {
            user_id: user.id,
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { date: 'asc' }
        });

        // Process data for chart
        const trendData = [];
        for (let i = 0; i < days; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          
          const dayMood = moodTrends.find(mood => {
            const moodDate = new Date(mood.date);
            return moodDate.toDateString() === currentDate.toDateString();
          });

          trendData.push({
            date: currentDate.toISOString().split('T')[0],
            mood_rate: dayMood ? dayMood.mood_rate : null,
            mood_emoji: dayMood ? dayMood.mood_emoji : null
          });
        }

        return NextResponse.json({ trends: trendData });

      case 'recent':
      default:
        // Get recent mood entries
        const recentMoods = await prisma.mood.findMany({
          where: { user_id: user.id },
          orderBy: { date: 'desc' },
          take: 10
        });

        return NextResponse.json({ moods: recentMoods });
    }

  } catch (error) {
    console.error('Error fetching mood data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood data' },
      { status: 500 }
    );
  }
}

// POST /api/mood - Save daily mood check
export async function POST(request) {
  try {
    
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;
    const body = await request.json();
    const { mood_emoji, mood_rate } = body;

    if (!mood_emoji) {
      return NextResponse.json(
        { error: 'Mood emoji is required' },
        { status: 400 }
      );
    }

    const currentDate = new Date();
    const { day, week, month } = getDateNumbers(currentDate);

    // Check if mood already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingMood = await prisma.mood.findFirst({
      where: {
        user_id: user.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    let savedMood;

    if (existingMood) {
      // Update existing mood
      savedMood = await prisma.mood.update({
        where: { id: existingMood.id },
        data: {
          mood_emoji,
          mood_rate: mood_rate || 5
        }
      });
    } else {
      // Create new mood entry
      savedMood = await prisma.mood.create({
        data: {
          user_id: user.id,
          date: currentDate,
          day,
          week,
          month,
          mood_emoji,
          mood_rate: mood_rate || 5
        }
      });
    }

    // Generate notifications based on milestones
    try {
      const notificationService = (await import('../../../lib/notificationService')).default;
      await notificationService.checkMoodMilestones(user.id);
      await notificationService.checkStreakMilestones(user.id);
    } catch (notificationError) {
      console.error('Error generating notifications:', notificationError);
    }

    return NextResponse.json({ 
      success: true, 
      mood: savedMood,
      message: existingMood ? 'Mood updated successfully' : 'Mood saved successfully'
    });

  } catch (error) {
    console.error('Error saving mood:', error);
    return NextResponse.json(
      { error: 'Failed to save mood' },
      { status: 500 }
    );
  }
}
