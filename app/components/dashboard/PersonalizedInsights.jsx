'use client';

import { motion } from 'framer-motion';
import { Brain, Heart, Lightbulb, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import GlassCard from '../GlassCard';

const PersonalizedInsights = ({ insights }) => {
  if (!insights) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      case 'support':
        return <Heart className="w-4 h-4" />;
      case 'achievement':
        return <Sparkles className="w-4 h-4" />;
      case 'growth':
        return <Lightbulb className="w-4 h-4" />;
      case 'ai_insight':
        return <Brain className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
        return 'from-green-50 to-emerald-50 border-green-200 text-green-700';
      case 'support':
        return 'from-blue-50 to-cyan-50 border-blue-200 text-blue-700';
      case 'achievement':
        return 'from-purple-50 to-pink-50 border-purple-200 text-purple-700';
      case 'growth':
        return 'from-amber-50 to-orange-50 border-amber-200 text-amber-700';
      case 'ai_insight':
        return 'from-indigo-50 to-violet-50 border-indigo-200 text-indigo-700';
      case 'warning':
        return 'from-red-50 to-rose-50 border-red-200 text-red-700';
      default:
        return 'from-gray-50 to-slate-50 border-gray-200 text-gray-700';
    }
  };

  const getInsightBgColor = (type) => {
    switch (type) {
      case 'positive':
        return 'from-green-500 to-emerald-600';
      case 'support':
        return 'from-blue-500 to-cyan-600';
      case 'achievement':
        return 'from-purple-500 to-pink-600';
      case 'growth':
        return 'from-amber-500 to-orange-600';
      case 'ai_insight':
        return 'from-indigo-500 to-violet-600';
      case 'warning':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return { label: 'High Priority', color: 'text-red-600', bg: 'bg-red-50' };
      case 'medium':
        return { label: 'Important', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'low':
        return { label: 'Tip', color: 'text-blue-600', bg: 'bg-blue-50' };
      default:
        return { label: 'Insight', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  // Filter insights by priority and sort
  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Personalized Insights</h2>
          <p className="text-gray-600 text-sm">AI-powered recommendations for you</p>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-600" />
          <span className="text-xs text-gray-500">AI Generated</span>
        </div>
      </div>

      {sortedInsights.length > 0 ? (
        <div className="space-y-4">
          {sortedInsights.map((insight, index) => {
            const priority = getPriorityLabel(insight.priority);
            const colors = getInsightColor(insight.type);
            
            return (
              <motion.div
                key={index}
                className={'relative p-4 rounded-xl border bg-gradient-to-br ' + colors}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-start gap-3">
                  <div className={'w-8 h-8 bg-gradient-to-r ' + getInsightBgColor(insight.type) + ' rounded-lg flex items-center justify-center text-white flex-shrink-0'}>
                    {getInsightIcon(insight.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                        {insight.title}
                      </h3>
                      <span className={'px-2 py-1 rounded-full text-xs font-medium ' + priority.bg + ' ' + priority.color + ' flex-shrink-0'}>
                        {priority.label}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                      {insight.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{insight.icon}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {insight.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {insight.type === 'ai_insight' && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600">Live</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium mb-1">No insights available</p>
          <p className="text-xs text-gray-400">
            Continue tracking to receive personalized recommendations
          </p>
        </div>
      )}

      {/* AI Processing Status */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg border border-indigo-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">AI Analysis Active</p>
            <p className="text-xs text-gray-600 mt-1">
              Your data is being analyzed to provide personalized insights and recommendations
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600">Active</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      {sortedInsights.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {sortedInsights.slice(0, 2).map((insight, index) => (
              <motion.button
                key={index}
                className="p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {insight.type === 'support' ? 'Get Support' :
                 insight.type === 'growth' ? 'Learn More' :
                 insight.type === 'positive' ? 'Set Goals' :
                 insight.type === 'achievement' ? 'View Progress' :
                 'Explore Insights'}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default PersonalizedInsights;
