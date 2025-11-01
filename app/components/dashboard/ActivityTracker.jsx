'use client';

import { motion } from 'framer-motion';
import { Activity, BookOpen, Brain, Heart, Calendar, Target } from 'lucide-react';
import GlassCard from '../GlassCard';

const ActivityTracker = ({ data }) => {
  if (!data) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </GlassCard>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'journal':
        return <BookOpen className="w-4 h-4" />;
      case 'perspective':
        return <Brain className="w-4 h-4" />;
      case 'mood':
        return <Heart className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'journal':
        return 'from-blue-500 to-cyan-600';
      case 'perspective':
        return 'from-purple-500 to-pink-600';
      case 'mood':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getActivityBgColor = (type) => {
    switch (type) {
      case 'journal':
        return 'bg-blue-50 border-blue-200';
      case 'perspective':
        return 'bg-purple-50 border-purple-200';
      case 'mood':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getEngagementLevel = (score) => {
    if (score >= 80) return { level: 'Highly Engaged', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 60) return { level: 'Engaged', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 40) return { level: 'Moderately Active', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const engagement = getEngagementLevel(data.engagementScore);

  // Create a simple activity heatmap (last 7 days)
  const createHeatmapData = () => {
    const heatmap = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en', { weekday: 'short' });
      
      // Simulate activity count for each day (in real app, this would come from API)
      const activityCount = Math.floor(Math.random() * 10);
      
      heatmap.push({
        day: dateStr,
        count: activityCount,
        intensity: activityCount === 0 ? 0 : activityCount <= 3 ? 1 : activityCount <= 6 ? 2 : 3
      });
    }
    
    return heatmap;
  };

  const heatmapData = createHeatmapData();

  const getHeatmapColor = (intensity) => {
    switch (intensity) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-blue-200';
      case 2: return 'bg-blue-400';
      case 3: return 'bg-blue-600';
      default: return 'bg-gray-100';
    }
  };

  const getCombinedClassName = (base, dynamic) => {
    return base + ' ' + dynamic;
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Activity Tracker</h2>
          <p className="text-gray-600 text-sm">Monitor your engagement and progress</p>
        </div>
        <div className={getCombinedClassName('px-3 py-1 rounded-full text-xs font-medium', engagement.bg + ' ' + engagement.color)}>
          {engagement.level}
        </div>
      </div>

      {/* Activity Overview Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className={getCombinedClassName('p-4 rounded-xl border', getActivityBgColor('journal'))}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-600">Journals</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.journalsCount}</p>
          <p className="text-xs text-gray-500 mt-1">This period</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className={getCombinedClassName('p-4 rounded-xl border', getActivityBgColor('perspective'))}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white">
              <Brain className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-600">Perspectives</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.perspectiveSessionsCount}</p>
          <p className="text-xs text-gray-500 mt-1">Sessions completed</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className={getCombinedClassName('p-4 rounded-xl border', getActivityBgColor('mood'))}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-white">
              <Heart className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-600">Mood Check-ins</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.moodEntriesCount}</p>
          <p className="text-xs text-gray-500 mt-1">Moods tracked</p>
        </motion.div>
      </div>

      {/* Engagement Score */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-gray-700">Engagement Score</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{data.engagementScore}/100</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"
            initial={{ width: 0 }}
            animate={{ width: data.engagementScore + '%' }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {data.engagementScore >= 80 ? 'Excellent engagement!' :
           data.engagementScore >= 60 ? 'Good consistency' :
           data.engagementScore >= 40 ? 'Room for improvement' :
           'Try to be more active'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Heatmap */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Weekly Activity</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-7 gap-2">
              {heatmapData.map((day, index) => (
                <motion.div
                  key={day.day}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={getCombinedClassName('w-8 h-8 rounded mx-auto mb-1', getHeatmapColor(day.intensity))}></div>
                  <p className="text-xs text-gray-600">{day.day}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span className="text-xs text-gray-500">None</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span className="text-xs text-gray-500">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span className="text-xs text-gray-500">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-xs text-gray-500">High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Breakdown */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Activity Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(data.activityByType || {}).map(([type, count], index) => (
              <motion.div
                key={type}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className={getCombinedClassName('w-8 h-8 bg-gradient-to-r rounded-lg flex items-center justify-center text-white', getActivityColor(type))}>
                    {getActivityIcon(type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{type}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round((count / data.totalActivities) * 100)}% of total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">activities</p>
                </div>
              </motion.div>
            ))}
            
            {data.mostActiveDay && (
              <motion.div
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Most Active Day</p>
                    <p className="text-xs text-gray-500">Peak engagement</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-blue-600">{data.mostActiveDay}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Total Activities Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Total Activities</p>
            <p className="text-xs text-gray-600 mt-1">All tracked activities this period</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{data.totalActivities}</p>
        </div>
      </div>
    </GlassCard>
  );
};

export default ActivityTracker;
