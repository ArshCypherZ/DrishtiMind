import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function syncUser(clerkUser) {
  try {
    const userData = {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0].emailAddress,
      username: clerkUser.username || `${clerkUser.firstName || ''}${clerkUser.lastName || ''}`.toLowerCase().replace(/\s/g, ''),
      first_name: clerkUser.firstName || '',
      last_name: clerkUser.lastName || '',
      avatar_url: clerkUser.imageUrl,
      is_verified: clerkUser.emailAddresses[0].verification.status === 'verified',
    };
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: userData,
      create: {
        ...userData,
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        push_notification: true,
        dark_mode: false,
        wellness_reminders: true,
        weekly_summary: true,
        sessions: 0,
      },
    });
    return user;
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
}
