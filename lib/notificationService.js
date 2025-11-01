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

  // Check if user has received a specific milestone notification recently (last 7 days)
  async hasRecentMilestoneNotification(userId, title) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const existingNotification = await prisma.notification.findFirst({
        where: {
          user_id: userId,
          type: 'milestone',
          title: title,
          created_at: {
            gte: sevenDaysAgo
          }
        }
      });

      return !!existingNotification;
    } catch (error) {
      console.error('Error checking recent milestone notification:', error);
      return false;
    }
  }

  // Check perspective session milestones
  async checkPerspectiveMilestones(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          perspective_sessions: true
        }
      });

      if (!user) return;

      const notifications = [];
      const sessionCount = user.perspective_sessions.length;
      const thisWeekSessions = user.perspective_sessions.filter(session => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(session.created_at) >= weekAgo;
      }).length;

      // First session milestone
      if (sessionCount === 1) {
        const hasNotification = await this.hasRecentMilestoneNotification(userId, "Welcome to Your Journey!");
        if (!hasNotification) {
          notifications.push({
            title: "Welcome to Your Journey! 🌟",
            message: "Congratulations on completing your first perspective session! You're taking an important step towards self-discovery.",
            type: "milestone"
          });
        }
      }

      // 5 sessions in a week milestone
      if (thisWeekSessions === 5) {
        const hasNotification = await this.hasRecentMilestoneNotification(userId, "Weekly Achievement Unlocked!");
        if (!hasNotification) {
          notifications.push({
            title: "Weekly Achievement Unlocked! 🎉",
            message: "Amazing! You've completed 5 perspective sessions this week. Your dedication to self-reflection is inspiring!",
            type: "milestone"
          });
        }
      }

      // 10 total sessions milestone
      if (sessionCount === 10) {
        const hasNotification = await this.hasRecentMilestoneNotification(userId, "Double Digits!");
        if (!hasNotification) {
          notifications.push({
            title: "Double Digits! 🚀",
            message: "You've completed 10 perspective sessions! Your consistency is building a strong foundation for personal growth.",
            type: "milestone"
          });
        }
      }

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(userId, notification.title, notification.message, notification.type);
      }

      return notifications.length;
    } catch (error) {
      console.error('Error checking perspective milestones:', error);
      throw error;
    }
  }

  // Check journal milestones
  async checkJournalMilestones(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          journals: true
        }
      });

      if (!user) return;

      const notifications = [];
      const journalCount = user.journals.length;

      // First journal milestone
      if (journalCount === 1) {
        const hasNotification = await this.hasRecentMilestoneNotification(userId, "First Journal Entry!");
        if (!hasNotification) {
          notifications.push({
            title: "First Journal Entry! 📝",
            message: "Great start! You've created your first journal entry. Keep writing to track your emotional journey.",
            type: "milestone"
          });
        }
      }

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(userId, notification.title, notification.message, notification.type);
      }

      return notifications.length;
    } catch (error) {
      console.error('Error checking journal milestones:', error);
      throw error;
    }
  }

  // Check mood tracking milestones
  async checkMoodMilestones(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          moods: true
        }
      });

      if (!user) return;

      const notifications = [];
      const moodCount = user.moods.length;

      // First journal milestone
      if (moodCount === 7) {
        const hasNotification = await this.hasRecentMilestoneNotification(userId, "Week of Mood Tracking!");
        if (!hasNotification) {
          notifications.push({
            title: "Week of Mood Tracking! 📊",
            message: "You've tracked your mood for a full week! This data will help you understand your emotional patterns.",
            type: "milestone"
          });
        }
      }

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(userId, notification.title, notification.message, notification.type);
      }

      return notifications.length;
    } catch (error) {
      console.error('Error checking mood milestones:', error);
      throw error;
    }
  }

  // Check streak milestones (can be called from any context)
  async checkStreakMilestones(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return;

      const notifications = [];

      // 30-day streak milestone
      if (user.current_streak >= 30) {
        const hasNotification = await this.hasRecentMilestoneNotification(userId, "30-Day Streak!");
        if (!hasNotification) {
          notifications.push({
            title: "30-Day Streak! 🔥",
            message: "Incredible! You've maintained a 30-day streak. Your commitment to daily reflection is truly remarkable!",
            type: "milestone"
          });
        }
      }

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(userId, notification.title, notification.message, notification.type);
      }

      return notifications.length;
    } catch (error) {
      console.error('Error checking streak milestones:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility - calls all milestone checks
  async checkMilestones(userId) {
    try {
      const [perspectiveCount, journalCount, moodCount, streakCount] = await Promise.all([
        this.checkPerspectiveMilestones(userId),
        this.checkJournalMilestones(userId),
        this.checkMoodMilestones(userId),
        this.checkStreakMilestones(userId)
      ]);
      
      return perspectiveCount + journalCount + moodCount + streakCount;
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

  // Create weekly summary notification
  async createWeeklySummaryNotification(userId, weeklySummary) {
    console.log(`Creating weekly summary notification for user ${userId}`);
    
    // Create in-app notification
    const notification = await this.createNotification(
      userId,
      "Your Weekly Summary is Ready! 📊",
      weeklySummary.short_summary || "Here's your weekly wellness summary with insights and growth patterns.",
      "achievement",
      new Date() // Send immediately
    );

    try {
      console.log(`Attempting to send weekly summary email for user ${userId}`);
      const { default: emailService } = await import('./emailService');
      const emailResult = await emailService.sendWeeklySummaryEmail(userId, weeklySummary);
      console.log(`Email result for user ${userId}:`, emailResult);
    } catch (emailError) {
      console.error('Failed to send weekly summary email:', emailError);
    }

    return notification;
  }

  // Create weekly summary generation reminder
  async createWeeklySummaryReminder(userId) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(19, 0, 0, 0); // 7 PM

    return await this.createNotification(
      userId,
      "Weekly Summary Processing 🔄",
      "We're analyzing your week's data to generate your personalized wellness summary.",
      "reminder",
      nextWeek
    );
  }

  // Create monthly summary notification
  async createMonthlySummaryNotification(userId, monthlySummary) {
    const notification = await this.createNotification(
      userId,
      "Your Monthly Summary is Ready! 📈",
      monthlySummary.short_summary || "Here's your comprehensive monthly wellness summary with deep insights and long-term growth patterns.",
      "achievement",
      new Date()
    );
    try {
      const { default: emailService } = await import('./emailService');
      await emailService.sendMonthlySummaryEmail(userId, monthlySummary);
    } catch (emailError) {
      console.error('Failed to send monthly summary email:', emailError);
    }

    return notification;
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

  // Setup automatic reminders for a user
  async setupAutomaticReminders(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { wellness_reminders: true }
      });

      if (!user) return;

      const notifications = [];

      // Create daily reflection reminder if enabled
      if (user.wellness_reminders) {
        // Check if daily reminder already exists for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const existingDailyReminder = await prisma.notification.findFirst({
          where: {
            user_id: userId,
            type: 'daily_reflection',
            scheduled_for: {
              gte: tomorrow,
              lt: dayAfter
            }
          }
        });

        if (!existingDailyReminder) {
          await this.createDailyReflectionReminder(userId);
          notifications.push('daily_reflection');
        }
      }
      return notifications;
    } catch (error) {
      console.error('Error setting up automatic reminders:', error);
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
