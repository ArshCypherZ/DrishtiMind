import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { generateManualJournalContent } from '../../../lib/aiService';
import notificationService from '../../../lib/notificationService';
import { getAuthenticatedUser } from '../../../lib/authUtils';

export async function GET(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const mood = searchParams.get('mood') || '';
    
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = {
      user_id: user.id
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ];
    }

    if (mood && mood !== 'all') {
      whereClause.mood_emoji = mood;
    }

    // Get journals with pagination
    const [journals, totalCount] = await Promise.all([
      prisma.journal.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          mood_emoji: true,
          date: true,
          created_at: true,
          updated_at: true,
          points_earned: true,
          tags: true,
          summary: true
        }
      }),
      prisma.journal.count({ where: whereClause })
    ]);

    // Parse tags JSON for each journal
    const processedJournals = journals.map(journal => ({
      ...journal,
      tags: journal.tags ? JSON.parse(journal.tags) : [],
      date: journal.date.toISOString().split('T')[0] // Format date as YYYY-MM-DD
    }));

    return NextResponse.json({
      journals: processedJournals,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching journals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { title, content } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be less than 200 characters' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content must be less than 5000 characters' },
        { status: 400 }
      );
    }

    // Generate AI-powered content
    const aiGeneratedContent = await generateManualJournalContent(title, content);

    // Calculate points based on content length
    const pointsEarned = Math.min(Math.floor(content.length / 10), 50);

    // Create journal entry
    const journal = await prisma.journal.create({
      data: {
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        mood_emoji: aiGeneratedContent.mood_emoji,
        summary: aiGeneratedContent.summary,
        points_earned: pointsEarned,
        tags: JSON.stringify(aiGeneratedContent.tags),
        date: new Date()
      }
    });

    // Award points to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        total_points: { increment: pointsEarned }
      }
    });

    // Generate notifications based on milestones
    try {
      await notificationService.checkMilestones(user.id);
    } catch (notificationError) {
      console.error('Error generating notifications:', notificationError);
    }

    // Format response
    const formattedJournal = {
      ...journal,
      tags: aiGeneratedContent.tags,
      date: journal.date.toISOString().split('T')[0]
    };

    return NextResponse.json({
      success: true,
      journal: formattedJournal,
      pointsEarned,
      message: 'Journal entry created successfully'
    });

  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
