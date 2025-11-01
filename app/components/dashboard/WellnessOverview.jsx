'use client';

import { motion } from 'framer-motion';
import { Heart, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import GlassCard from '../GlassCard';

const WellnessOverview = ({ data, user }) => {
  if (!data) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  const getWellnessColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getMoodEmoji = (mood) => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 4) return '😐';
    if (mood >= 2) return '😔';
    return '😢';
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wellness Overview</h2>
          <p className="text-gray-600 text-sm">Your overall mental health snapshot</p>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon(data.trend)}
          <span className={'text-sm font-medium ' + getTrendColor(data.trend)}>
            {data.trend === 'improving' ? 'Improving' : data.trend === 'declining' ? 'Needs Attention' : 'Stable'}
          </span>
        </div>
      </div>

      {/* Wellness Score - Hero Metric */}
      <div className="mb-8">
        <div className="relative">
          <div className={'absolute inset-0 bg-gradient-to-r ' + getWellnessColor(data.wellnessScore) + ' rounded-2xl opacity-10'}></div>
          <div className="relative bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={'w-12 h-12 bg-gradient-to-r ' + getWellnessColor(data.wellnessScore) + ' rounded-full flex items-center justify-center'}>
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Wellness Score</p>
                    <p className="text-3xl font-bold text-gray-900">{data.wellnessScore}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {data.wellnessScore >= 80 ? 'Excellent mental well-being!' :
                   data.wellnessScore >= 60 ? 'Good progress, keep it up!' :
                   data.wellnessScore >= 40 ? 'Room for improvement' :
                   'Consider additional support'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl mb-2">{getMoodEmoji(data.averageMood)}</div>
                <p className="text-sm text-gray-600">Avg Mood: {data.averageMood}/10</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600">Avg Mood</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{data.averageMood}</p>
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon(data.trend)}
            <p className={'text-xs ' + getTrendColor(data.trend)}>{data.trend}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-600">Total Points</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{data.totalPoints}</p>
          <p className="text-xs text-gray-500 mt-1">Lifetime earned</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600">Wellness</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{data.overallWellness}</p>
          <p className="text-xs text-gray-500 mt-1">Overall score</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-gray-600">Streak</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{user?.current_streak || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Current streak</p>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-600">Wellness Progress</p>
          <p className="text-sm font-medium text-gray-900">{data.wellnessScore}/100</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={'h-2 rounded-full bg-gradient-to-r ' + getWellnessColor(data.wellnessScore)}
            initial={{ width: 0 }}
            animate={{ width: `${data.wellnessScore}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default WellnessOverview;
