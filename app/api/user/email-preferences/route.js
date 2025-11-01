import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/authUtils';
import { prisma } from '../../../../lib/prisma';

// GET /api/user/email-preferences - Get user's email preferences
export async function GET(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const userWithPrefs = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        email: true,
        email_preferences: true
      }
    });

    if (!userWithPrefs) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse email preferences or return defaults
    let emailPrefs = {
      weekly_summary: true,
      monthly_summary: true,
      milestones: true,
      daily_reminders: false,
      enabled: true
    };

    if (userWithPrefs.email_preferences) {
      try {
        const parsedPrefs = typeof userWithPrefs.email_preferences === 'string' 
          ? JSON.parse(userWithPrefs.email_preferences)
          : userWithPrefs.email_preferences;
        
        emailPrefs = { ...emailPrefs, ...parsedPrefs };
      } catch (parseError) {
        console.error('Error parsing email preferences:', parseError);
      }
    }

    return NextResponse.json({
      email: userWithPrefs.email,
      preferences: emailPrefs
    });

  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/user/email-preferences - Update user's email preferences
export async function PUT(request) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (error) return error;

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Valid preferences object is required' },
        { status: 400 }
      );
    }

    // Validate preference fields
    const validFields = ['weekly_summary', 'monthly_summary', 'milestones', 'daily_reminders', 'enabled'];
    const filteredPrefs = {};
    
    for (const [key, value] of Object.entries(preferences)) {
      if (validFields.includes(key)) {
        filteredPrefs[key] = Boolean(value);
      }
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email_preferences: filteredPrefs,
        updated_at: new Date()
      },
      select: {
        email: true,
        email_preferences: true
      }
    });

    // Parse updated preferences for response
    let emailPrefs = filteredPrefs;
    if (typeof updatedUser.email_preferences === 'string') {
      try {
        emailPrefs = JSON.parse(updatedUser.email_preferences);
      } catch (parseError) {
        console.error('Error parsing updated email preferences:', parseError);
      }
    }

    return NextResponse.json({
      message: 'Email preferences updated successfully',
      email: updatedUser.email,
      preferences: emailPrefs
    });

  } catch (error) {
    console.error('Error updating email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update email preferences' },
      { status: 500 }
    );
  }
}