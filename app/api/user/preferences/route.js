import { getAuthenticatedUser } from '../../../../lib/authUtils';
import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { user: localUser, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const preferences = {
      push_notification: localUser.push_notification,
      dark_mode: localUser.dark_mode,
      wellness_reminders: localUser.wellness_reminders,
      weekly_summary: localUser.weekly_summary
    };

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {

    const { user: localUser, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const allowedFields = ['push_notification', 'dark_mode', 'wellness_reminders', 'weekly_summary'];
    const updateData = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && typeof value === 'boolean') {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' }, 
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: localUser.id },
      data: {
        ...updateData,
        updated_at: new Date()
      },
      select: {
        push_notification: true,
        dark_mode: true,
        wellness_reminders: true,
        weekly_summary: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedUser
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
