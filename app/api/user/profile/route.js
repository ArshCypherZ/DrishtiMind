import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ['first_name', 'last_name', 'username', 'email'];
    const updateData = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return NextResponse.json(
            { error: `${key} must be a non-empty string` }, 
            { status: 400 }
          );
        }
        
        if (key === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return NextResponse.json(
              { error: 'Invalid email format' }, 
              { status: 400 }
            );
          }
        }
        
        if (key === 'username') {
          const usernameRegex = /^[a-zA-Z0-9_-]+$/;
          if (!usernameRegex.test(value) || value.length < 3 || value.length > 20) {
            return NextResponse.json(
              { error: 'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores' }, 
              { status: 400 }
            );
          }
        }
        
        updateData[key] = value.trim();
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' }, 
        { status: 400 }
      );
    }

    // Check for unique constraints if email or username is being updated
    if (updateData.email || updateData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: localUser.id } },
            {
              OR: [
                updateData.email ? { email: updateData.email } : {},
                updateData.username ? { username: updateData.username } : {}
              ].filter(obj => Object.keys(obj).length > 0)
            }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === updateData.email) {
          return NextResponse.json(
            { error: 'Email already in use' }, 
            { status: 409 }
          );
        }
        if (existingUser.username === updateData.username) {
          return NextResponse.json(
            { error: 'Username already taken' }, 
            { status: 409 }
          );
        }
      }
    }

    // If email is being updated, set is_verified to false
    if (updateData.email && updateData.email !== localUser.email) {
      updateData.is_verified = false;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: localUser.id },
      data: {
        ...updateData,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_verified: true,
        total_points: true,
        current_streak: true,
        longest_streak: true,
        sessions: true,
        push_notification: true,
        dark_mode: true,
        wellness_reminders: true,
        weekly_summary: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        { error: `${field} already exists` }, 
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
