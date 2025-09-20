import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/authUtils';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Journal ID is required' }, { status: 400 });
    }

    // Check if journal exists and belongs to user
    const journal = await prisma.journal.findFirst({
      where: {
        id: id,
        user_id: user.id
      }
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    // Delete the journal entry
    await prisma.journal.delete({
      where: { id: id }
    });

    return NextResponse.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const { id } = params;
    const body = await request.json();
    const { title, content, mood_emoji, tags } = body;

    if (!id) {
      return NextResponse.json({ error: 'Journal ID is required' }, { status: 400 });
    }

    // Validation
    if (!title || !content || !mood_emoji) {
      return NextResponse.json(
        { error: 'Title, content, and mood are required' },
        { status: 400 }
      );
    }

    // Check if journal exists and belongs to user
    const existingJournal = await prisma.journal.findFirst({
      where: {
        id: id,
        user_id: user.id
      }
    });

    if (!existingJournal) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    // Generate new summary
    const summary = content.length > 100 ? content.substring(0, 100) + '...' : content;

    // Update journal entry
    const updatedJournal = await prisma.journal.update({
      where: { id: id },
      data: {
        title: title.trim(),
        content: content.trim(),
        mood_emoji,
        summary,
        tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
        updated_at: new Date()
      }
    });

    // Format response
    const formattedJournal = {
      ...updatedJournal,
      tags: updatedJournal.tags ? JSON.parse(updatedJournal.tags) : [],
      date: updatedJournal.date.toISOString().split('T')[0]
    };

    return NextResponse.json({
      success: true,
      journal: formattedJournal,
      message: 'Journal entry updated successfully'
    });

  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
