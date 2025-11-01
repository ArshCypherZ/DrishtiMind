'use client';

import { motion } from 'framer-motion';
import { Flame, Target, Calendar, Award, Zap } from 'lucide-react';
import GlassCard from '../GlassCard';

const StreakTracker = ({ data }) => {
  if (!data) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  const getStreakEmoji = (streak) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '🌟';
    return '📍';
  };

  const getStreakMessage = (streak) => {
    if (streak >= 30) return 'Unstoppable! You\'re on fire!';
    if (streak >= 14) return 'Amazing consistency!';
    if (streak >= 7) return 'Great job, keep it up!';
    if (streak >= 3) return 'Good momentum building!';
    if (streak >= 1) return 'Nice start!';
    return 'Begin your journey today';
  };

  const getConsistencyColor = (consistency) => {
    if (consistency >= 80) return 'text-green-600';
    if (consistency >= 60) return 'text-blue-600';
    if (consistency >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConsistencyBg = (consistency) => {
    if (consistency >= 80) return 'bg-green-50 border-green-200';
    if (consistency >= 60) return 'bg-blue-50 border-blue-200';
    if (consistency >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Create week calendar view
  const createWeekDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      const isToday = i === 0;
      const hasActivity = Math.random() > 0.3; // Simulate activity data
      
      days.push({
        dayName: dayName.substring(0, 3),
        date: date.getDate(),
        isToday,
        hasActivity
      });
    }
    
    return days;
  };

  const weekDays = createWeekDays();

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Streak Tracker</h2>
          <p className="text-gray-600 text-sm">Your consistency journey</p>
        </div>
        <div className="text-2xl">{getStreakEmoji(data.currentStreak)}</div>
      </div>

      {/* Current Streak */}
      <motion.div
        className="relative mb-6"
        whileHover={{ scale: 1.02 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl opacity-10"></div>
        <div className="relative bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-orange-600" />
                <p className="text-sm font-medium text-gray-700">Current Streak</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.currentStreak}</p>
              <p className="text-sm text-gray-600 mt-1">{getStreakMessage(data.currentStreak)}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl mb-2">🔥</div>
              <p className="text-sm text-gray-600">days</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Week Activity */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">This Week's Activity</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={'w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center text-xs font-medium ' + (
                  day.isToday 
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                    : day.hasActivity 
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-400'
                )}>
                  {day.date}
                </div>
                <p className="text-xs text-gray-500">{day.dayName}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-600">Longest Streak</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.longestStreak}</p>
          <p className="text-xs text-gray-500 mt-1">Personal best</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className={'p-4 rounded-xl border ' + getConsistencyBg(data.consistency)}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-600">Consistency</p>
          </div>
          <p className={'text-2xl font-bold ' + getConsistencyColor(data.consistency)}>
            {data.consistency}%
          </p>
          <p className="text-xs text-gray-500 mt-1">This week</p>
        </motion.div>
      </div>

      {/* Progress to Next Milestone */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Next Milestone</h3>
        <div className="space-y-3">
          {[
            { days: 7, label: '1 Week', icon: '🌟', achieved: data.currentStreak >= 7 },
            { days: 14, label: '2 Weeks', icon: '💪', achieved: data.currentStreak >= 14 },
            { days: 30, label: '1 Month', icon: '🔥', achieved: data.currentStreak >= 30 },
            { days: 100, label: '100 Days', icon: '🏆', achieved: data.currentStreak >= 100 }
          ].map((milestone, index) => (
            <motion.div
              key={milestone.days}
              className={'flex items-center justify-between p-3 rounded-lg border ' + (
                milestone.achieved 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className={'w-8 h-8 rounded-lg flex items-center justify-center text-sm ' + (
                  milestone.achieved 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-400'
                )}>
                  {milestone.icon}
                </div>
                <div>
                  <p className={'text-sm font-medium ' + (
                    milestone.achieved ? 'text-green-700' : 'text-gray-700'
                  )}>
                    {milestone.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {milestone.achieved 
                      ? 'Achieved!' 
                      : `${Math.max(0, milestone.days - data.currentStreak)} days to go`
                    }
                  </p>
                </div>
              </div>
              {milestone.achieved && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Keep the momentum going!</p>
            <p className="text-xs opacity-90 mt-1">
              {data.currentStreak === 0 
                ? 'Start your streak today with a simple check-in'
                : `You've been active for ${data.currentStreak} day${data.currentStreak !== 1 ? 's' : ''} straight!`
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Active Days Summary */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{data.activeDaysThisWeek}</span> of 7 days active this week
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: ((data.activeDaysThisWeek / 7) * 100) + '%' }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default StreakTracker;
