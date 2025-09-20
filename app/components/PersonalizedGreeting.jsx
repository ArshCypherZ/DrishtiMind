'use client';

import { motion } from 'framer-motion';
import { 
  Flame, 
  Star, 
  Heart, 
  Bell,
  TrendingUp
} from 'lucide-react';

const PersonalizedGreeting = ({ 
  greeting = "Good morning", 
  userName = "there", 
  userStats = {}, 
  isLoading = false 
}) => {
  const { current_streak, total_points, sessions, unreadNotifications } = userStats;

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
      </div>
    );
  }

  const getStreakEmoji = (streak) => {
    if (streak === 0) return '🌱';
    if (streak < 7) return '🔥';
    if (streak < 30) return '🚀';
    return '⭐';
  };

  const getStreakMessage = (streak) => {
    if (streak === 0) return 'Ready to start your journey?';
    if (streak === 1) return 'Great start! Keep it up!';
    if (streak < 7) return `${streak} day streak going strong!`;
    if (streak < 30) return `Amazing ${streak} day streak! 🎉`;
    return `Incredible ${streak} day streak! You're a wellness champion! 🏆`;
  };

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Main Greeting */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {greeting}, {userName}! 👋
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          {getStreakMessage(current_streak || 0)}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {/* Streak Card */}
        <motion.div
          className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-1">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="text-lg">{getStreakEmoji(current_streak || 0)}</span>
          </div>
          <div className="text-lg font-bold text-orange-700">
            {current_streak || 0}
          </div>
          <div className="text-xs text-orange-600 font-medium">
            Day Streak
          </div>
        </motion.div>

        {/* Points Card */}
        <motion.div
          className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-1">
            <Star className="w-4 h-4 text-yellow-600" />
            <span className="text-lg">✨</span>
          </div>
          <div className="text-lg font-bold text-yellow-700">
            {total_points || 0}
          </div>
          <div className="text-xs text-yellow-600 font-medium">
            Points
          </div>
        </motion.div>

        {/* Sessions Card */}
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-lg">🧠</span>
          </div>
          <div className="text-lg font-bold text-blue-700">
            {sessions || 0}
          </div>
          <div className="text-xs text-blue-600 font-medium">
            Sessions
          </div>
        </motion.div>

        {/* Notifications Card */}
        <motion.div
          className={`bg-gradient-to-br border rounded-xl p-3 ${
            unreadNotifications > 0 
              ? 'from-purple-50 to-pink-50 border-purple-200' 
              : 'from-gray-50 to-gray-100 border-gray-200'
          }`}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-1">
            <Bell className={`w-4 h-4 ${
              unreadNotifications > 0 ? 'text-purple-600' : 'text-gray-500'
            }`} />
            <span className="text-lg">
              {unreadNotifications > 0 ? '🔔' : '🔕'}
            </span>
          </div>
          <div className={`text-lg font-bold ${
            unreadNotifications > 0 ? 'text-purple-700' : 'text-gray-600'
          }`}>
            {unreadNotifications || 0}
          </div>
          <div className={`text-xs font-medium ${
            unreadNotifications > 0 ? 'text-purple-600' : 'text-gray-500'
          }`}>
            {unreadNotifications > 0 ? 'New' : 'Updates'}
          </div>
        </motion.div>
      </motion.div>

      {/* Achievement Message */}
      {(current_streak >= 7 || total_points >= 100) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {current_streak >= 30 ? "You're on fire! 🔥" :
               current_streak >= 7 ? "Great consistency! 🌟" :
               "Keep up the good work! 💪"}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PersonalizedGreeting;
