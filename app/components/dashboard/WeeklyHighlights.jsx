'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, Heart, Target, Calendar, Sparkles } from 'lucide-react';
import GlassCard from '../GlassCard';

const WeeklyHighlights = ({ highlights }) => {
  if (!highlights) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  const getHighlightIcon = (type) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-4 h-4" />;
      case 'theme':
        return <Target className="w-4 h-4" />;
      case 'mood':
        return <Heart className="w-4 h-4" />;
      case 'milestone':
        return <Star className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getHighlightColor = (type) => {
    switch (type) {
      case 'achievement':
        return 'from-amber-50 to-orange-50 border-amber-200';
      case 'theme':
        return 'from-blue-50 to-indigo-50 border-blue-200';
      case 'mood':
        return 'from-green-50 to-emerald-50 border-green-200';
      case 'milestone':
        return 'from-purple-50 to-pink-50 border-purple-200';
      default:
        return 'from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const getHighlightBgColor = (type) => {
    switch (type) {
      case 'achievement':
        return 'from-amber-500 to-orange-600';
      case 'theme':
        return 'from-blue-500 to-indigo-600';
      case 'mood':
        return 'from-green-500 to-emerald-600';
      case 'milestone':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  // Generate sample weekly highlights if none provided
  const defaultHighlights = [
    {
      type: 'achievement',
      title: 'Weekly Achievements',
      icon: '🏆',
      items: ['Completed 5 journal entries', 'Maintained 7-day streak', 'Explored new perspectives']
    },
    {
      type: 'mood',
      title: 'Best Mood Day',
      icon: '😊',
      content: 'Friday with excellent energy'
    },
    {
      type: 'theme',
      title: 'Theme of the Week',
      icon: '🎯',
      content: 'Growth and self-reflection'
    }
  ];

  const displayHighlights = highlights.length > 0 ? highlights : defaultHighlights;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Weekly Highlights</h2>
          <p className="text-gray-600 text-sm">Your recent achievements and moments</p>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs text-gray-500">This week</span>
        </div>
      </div>

      <div className="space-y-4">
        {displayHighlights.map((highlight, index) => {
          const colors = getHighlightColor(highlight.type);
          
          return (
            <motion.div
              key={index}
              className={"p-4 rounded-xl border bg-gradient-to-br " + colors}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-start gap-3">
                <div className={"w-10 h-10 bg-gradient-to-r " + getHighlightBgColor(highlight.type) + " rounded-lg flex items-center justify-center text-white flex-shrink-0"}>
                  {getHighlightIcon(highlight.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {highlight.title}
                  </h3>
                  
                  {highlight.items && Array.isArray(highlight.items) ? (
                    <ul className="space-y-2">
                      {highlight.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{highlight.icon}</span>
                      <p className="text-sm text-gray-700">{highlight.content}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Week Summary</p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date().toLocaleDateString('en', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <Star className="w-4 h-4 text-yellow-500" />
              <Star className="w-4 h-4 text-yellow-500" />
              <Star className="w-4 h-4 text-gray-300" />
              <Star className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Great week!</p>
          </div>
        </div>
      </motion.div>

      {/* Upcoming Week Preview */}
      <motion.div
        className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Next Week's Focus</p>
            <p className="text-xs text-gray-600 mt-1">
              Continue your journaling streak and explore new perspective sessions
            </p>
          </div>
        </div>
      </motion.div>
    </GlassCard>
  );
};

export default WeeklyHighlights;
