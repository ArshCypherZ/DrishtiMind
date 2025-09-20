import { prisma } from './prisma';

class NotificationService {
  // Create a notification for a user
  async createNotification(userId, title, message, type, scheduledFor = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          user_id: userId,
          title,
          message,
          type,
          scheduled_for: scheduledFor ? new Date(scheduledFor) : null,
          sent_at: scheduledFor ? null : new Date(),
        }
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Check and create milestone notifications
  async checkMilestones(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          perspective_sessions: true,
          journals: true,
          moods: true
        }
      });

      if (!user) return;

      const notifications = [];

      // Check perspective session milestones
      const sessionCount = user.perspective_sessions.length;
      const thisWeekSessions = user.perspective_sessions.filter(session => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(session.created_at) >= weekAgo;
      }).length;

      // First session milestone
      if (sessionCount === 1) {
        notifications.push({
          title: "Welcome to Your Journey! 🌟",
          message: "Congratulations on completing your first perspective session! You're taking an important step towards self-discovery.",
          type: "milestone"
        });
      }

      // 5 sessions in a week milestone
      if (thisWeekSessions === 5) {
        notifications.push({
          title: "Weekly Achievement Unlocked! 🎉",
          message: "Amazing! You've completed 5 perspective sessions this week. Your dedication to self-reflection is inspiring!",
          type: "milestone"
        });
      }

      // 10 total sessions milestone
      if (sessionCount === 10) {
        notifications.push({
          title: "Double Digits! 🚀",
          message: "You've completed 10 perspective sessions! Your consistency is building a strong foundation for personal growth.",
          type: "milestone"
        });
      }

      // 30-day streak milestone
      if (user.current_streak >= 30) {
        notifications.push({
          title: "30-Day Streak! 🔥",
          message: "Incredible! You've maintained a 30-day streak. Your commitment to daily reflection is truly remarkable!",
          type: "milestone"
        });
      }

      // Check journal milestones
      const journalCount = user.journals.length;
      if (journalCount === 1) {
        notifications.push({
          title: "First Journal Entry! 📝",
          message: "Great start! You've created your first journal entry. Keep writing to track your emotional journey.",
          type: "milestone"
        });
      }

      // Check mood tracking milestones
      const moodCount = user.moods.length;
      if (moodCount === 7) {
        notifications.push({
          title: "Week of Mood Tracking! 📊",
          message: "You've tracked your mood for a full week! This data will help you understand your emotional patterns.",
          type: "milestone"
        });
      }

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(userId, notification.title, notification.message, notification.type);
      }

      return notifications.length;
    } catch (error) {
      console.error('Error checking milestones:', error);
      throw error;
    }
  }

  // Create daily reflection reminder
  async createDailyReflectionReminder(userId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0); // 8 PM

    return await this.createNotification(
      userId,
      "Daily Reflection Time 🌅",
      "Take a moment to reflect on your day and practice gratitude. How are you feeling?",
      "daily_reflection",
      tomorrow
    );
  }

  // Create weekly check-in reminder
  async createWeeklyCheckInReminder(userId) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(19, 0, 0, 0); // 7 PM

    return await this.createNotification(
      userId,
      "Weekly Check-in 📅",
      "How are you feeling this week? Time for your weekly mood check and reflection.",
      "check_in",
      nextWeek
    );
  }

  // Create mindfulness tip
  async createMindfulnessTip(userId) {
    const tips = [
      {
        title: "Breathing Exercise 💨",
        message: "Try the 4-7-8 breathing technique: Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 times."
      },
      {
        title: "Gratitude Practice 🙏",
        message: "Write down 3 things you're grateful for today. This simple practice can shift your perspective positively."
      },
      {
        title: "Body Scan Meditation 🧘",
        message: "Take 5 minutes to scan your body from head to toe, noticing any tension and consciously relaxing each area."
      },
      {
        title: "Mindful Walking 🚶",
        message: "Go for a 10-minute walk and focus on each step, the ground beneath your feet, and your surroundings."
      },
      {
        title: "Digital Detox 📱",
        message: "Take a 30-minute break from all screens. Use this time for reflection, reading, or simply being present."
      }
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    return await this.createNotification(
      userId,
      randomTip.title,
      randomTip.message,
      "tip"
    );
  }

  // Create achievement notification
  async createAchievementNotification(userId, achievement) {
    return await this.createNotification(
      userId,
      achievement.title,
      achievement.message,
      "achievement"
    );
  }

  // Create task reminder
  async createTaskReminder(userId, task, scheduledFor) {
    return await this.createNotification(
      userId,
      `Reminder: ${task}`,
      "Don't forget to complete this important task for your wellness journey.",
      "task_reminder",
      scheduledFor
    );
  }

  // Process scheduled notifications (to be called by a cron job)
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await prisma.notification.findMany({
        where: {
          scheduled_for: {
            lte: now
          },
          sent_at: null
        }
      });

      for (const notification of scheduledNotifications) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { sent_at: now }
        });
      }

      return scheduledNotifications.length;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      throw error;
    }
  }

  // Get notification statistics for a user
  async getNotificationStats(userId) {
    try {
      const stats = await prisma.notification.groupBy({
        by: ['type', 'is_read'],
        where: { user_id: userId },
        _count: { id: true }
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
