'use client';

import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Tag, Calendar, PenTool } from 'lucide-react';
import GlassCard from '../GlassCard';

const JournalInsights = ({ data }) => {
  if (!data) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  const getMoodColor = (mood) => {
    if (mood === '😊' || mood === '🙂') return 'text-green-600';
    if (mood === '😐') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWordCountDisplay = (count) => {
    if (count >= 500) return '500+ words';
    if (count >= 200) return '200-500 words';
    if (count >= 100) return '100-200 words';
    return 'Under 100 words';
  };

  const getWritingFrequency = (totalEntries, period) => {
    const entriesPerDay = totalEntries / period;
    if (entriesPerDay >= 0.8) return { level: 'Daily', color: 'text-green-600' };
    if (entriesPerDay >= 0.5) return { level: 'Frequent', color: 'text-blue-600' };
    if (entriesPerDay >= 0.3) return { level: 'Regular', color: 'text-yellow-600' };
    return { level: 'Occasional', color: 'text-gray-600' };
  };

  const frequency = getWritingFrequency(data.totalEntries, 7); // Assuming 7-day period

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Journal Insights</h2>
          <p className="text-gray-600 text-sm">Your writing patterns and themes</p>
        </div>
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-blue-600" />
          <span className={"text-sm font-medium " + frequency.color}>
            {frequency.level}
          </span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-600">Total Entries</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.totalEntries}</p>
          <p className="text-xs text-gray-500 mt-1">Journal entries written</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-600">Avg Length</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{getWordCountDisplay(data.averageLength)}</p>
          <p className="text-xs text-gray-500 mt-1">Words per entry</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Tags */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Topics</h3>
          <div className="space-y-2">
            {data.topTags && data.topTags.length > 0 ? (
              data.topTags.map((tag, index) => (
                <motion.div
                  key={tag.tag}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">#{tag.tag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(tag.count / data.totalEntries) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{tag.count}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Tag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No tags found</p>
                <p className="text-xs text-gray-400 mt-1">Start adding tags to your entries</p>
              </div>
            )}
          </div>
        </div>

        {/* Mood Patterns */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Mood Patterns</h3>
          <div className="space-y-2">
            {data.moodPatterns && Object.keys(data.moodPatterns).length > 0 ? (
              Object.entries(data.moodPatterns).map(([mood, count], index) => (
                <motion.div
                  key={mood}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mood}</span>
                    <span className="text-sm text-gray-600 capitalize">
                      {mood === '😊' ? 'Happy' :
                       mood === '🙂' ? 'Good' :
                       mood === '😐' ? 'Neutral' :
                       mood === '😔' ? 'Sad' : 'Various'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={"h-2 rounded-full " + getMoodColor(mood).replace("text", "bg")}
                        style={{ width: String((count / data.totalEntries) * 100) + "%" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No mood data yet</p>
                <p className="text-xs text-gray-400 mt-1">Your moods will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Entries</h3>
        <div className="space-y-3">
          {data.recentEntries && data.recentEntries.length > 0 ? (
            data.recentEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{entry.moodEmoji}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {entry.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {new Date(entry.date).toLocaleDateString('en', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"text-sm " + getMoodColor(entry.moodEmoji)}>
                    {entry.moodEmoji}
                  </span>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium mb-1">No journal entries yet</p>
              <p className="text-xs text-gray-400">Start writing to see your insights here</p>
            </div>
          )}
        </div>
      </div>

      {/* Writing Insights */}
      {data.totalEntries > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <PenTool className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-gray-900">Writing Insights</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-gray-500">Frequency</p>
              <p className={"font-medium " + frequency.color}>{frequency.level} writer</p>
            </div>
            <div>
              <p className="text-gray-500">Avg Length</p>
              <p className="font-medium text-gray-900">{getWordCountDisplay(data.averageLength)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Words</p>
              <p className="font-medium text-gray-900">{(data.averageLength * data.totalEntries).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default JournalInsights;
