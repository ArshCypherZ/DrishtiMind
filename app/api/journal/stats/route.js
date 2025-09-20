import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const authStatus = request.headers.get('x-clerk-auth-status');
    const authToken = request.headers.get('x-clerk-auth-token');
    
    if (authStatus !== 'signed-in') {
      console.log('User not signed in according to Clerk headers');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Try currentUser() first as it's more reliable
    let clerkUser;
    let userId;
    
    try {
      clerkUser = await currentUser();

      if (clerkUser) {
        userId = clerkUser.id;
      }
    } catch (error) {
      console.log('Error getting currentUser():', error.message);
    }
    
    if (!userId) {
      try {
        const authResult = auth();
        userId = authResult?.userId;
      } catch (error) {
        console.log('Error with auth():', error.message);
      }
    }
    
    if (!userId && authToken) {
      try {
        const tokenPayload = JSON.parse(atob(authToken.split('.')[1]));
        userId = tokenPayload.sub;
      } catch (error) {
        console.log('Error parsing JWT token:', error.message);
      }
    }

    if (!userId) {
      console.log('No userId found after all attempts');
      return NextResponse.json({ error: 'Unauthorized - No user ID found' }, { status: 401 });
    }

    const localUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      console.log('User not found in local database with clerkId:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = localUser;

    // Get current date info
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get various stats
    const [
      totalEntries,
      favoriteEntries,
      weeklyEntries,
      monthlyEntries,
      recentEntries
    ] = await Promise.all([
      // Total entries
      prisma.journal.count({
        where: { user_id: user.id }
      }),
      
      // Favorite entries (entries with high points or specific tags)
      prisma.journal.count({
        where: {
          user_id: user.id,
          points_earned: { gte: 30 }
        }
      }),
      
      // Weekly entries
      prisma.journal.count({
        where: {
          user_id: user.id,
          created_at: { gte: startOfWeek }
        }
      }),
      
      // Monthly entries
      prisma.journal.count({
        where: {
          user_id: user.id,
          created_at: { gte: startOfMonth }
        }
      }),
      
      // Recent entries for streak calculation
      prisma.journal.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        take: 30,
        select: {
          created_at: true,
          date: true
        }
      })
    ]);

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const uniqueDates = [...new Set(recentEntries.map(entry => 
      entry.date.toISOString().split('T')[0]
    ))].sort().reverse();

    if (uniqueDates.length > 0) {
      let currentDate = new Date(today);
      let streakDate = uniqueDates[0];
      
      if (streakDate === today) {
        currentStreak = 1;
        currentDate.setDate(currentDate.getDate() - 1);
        
        for (let i = 1; i < uniqueDates.length; i++) {
          const expectedDate = currentDate.toISOString().split('T')[0];
          if (uniqueDates[i] === expectedDate) {
            currentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      } else {
        // Check if yesterday has an entry
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (streakDate === yesterdayStr) {
          currentStreak = 1;
          currentDate.setDate(currentDate.getDate() - 2);
          
          for (let i = 1; i < uniqueDates.length; i++) {
            const expectedDate = currentDate.toISOString().split('T')[0];
            if (uniqueDates[i] === expectedDate) {
              currentStreak++;
              currentDate.setDate(currentDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }
    }

    return NextResponse.json({
      totalEntries,
      favoriteEntries,
      weeklyEntries,
      monthlyEntries,
      currentStreak,
      stats: {
        thisWeek: weeklyEntries,
        thisMonth: monthlyEntries,
        allTime: totalEntries
      }
    });

  } catch (error) {
    console.error('Error fetching journal stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
