'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  Star, 
  Heart,
  Smile,
  Frown,
  Meh,
  Brain,
  Sparkles,
  Moon,
  Angry,
  Lightbulb
} from 'lucide-react';

const JournalDetailModal = ({ entry, isOpen, onClose }) => {
  if (!isOpen || !entry) return null;

  const moodIcons = {
    '😊': { icon: Smile, color: 'text-green-500', bg: 'bg-green-50' },
    '😐': { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    '😔': { icon: Frown, color: 'text-blue-500', bg: 'bg-blue-50' },
    '😟': { icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    '🧠': { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
    '❤️': { icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    '✨': { icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    '😴': { icon: Moon, color: 'text-blue-500', bg: 'bg-blue-50' },
    '😤': { icon: Angry, color: 'text-red-500', bg: 'bg-red-50' },
    '🤔': { icon: Lightbulb, color: 'text-gray-500', bg: 'bg-gray-50' }
  };

  const moodData = moodIcons[entry.mood_emoji] || { 
    icon: Meh, 
    color: 'text-gray-500', 
    bg: 'bg-gray-50' 
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${readTime} min read`;
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${moodData.bg} rounded-xl flex items-center justify-center`}>
                <moodData.icon className={`w-6 h-6 ${moodData.color}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                  {entry.title}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(entry.date)}</span>
                  {entry.points_earned > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-600 font-medium">
                          +{entry.points_earned} pts
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {entry.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Summary */}
            {entry.summary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {entry.summary}
                </p>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{calculateReadTime(entry.content)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <moodData.icon className={`w-4 h-4 ${moodData.color}`} />
                  <span className="capitalize">
                    {entry.mood_emoji === '😊' ? 'Happy' :
                     entry.mood_emoji === '😐' ? 'Neutral' :
                     entry.mood_emoji === '��' ? 'Sad' :
                     entry.mood_emoji === '😟' ? 'Stressed' :
                     entry.mood_emoji === '🧠' ? 'Thoughtful' :
                     entry.mood_emoji === '❤️' ? 'Loved' :
                     entry.mood_emoji === '✨' ? 'Inspired' :
                     entry.mood_emoji === '😴' ? 'Tired' :
                     entry.mood_emoji === '😤' ? 'Frustrated' :
                     entry.mood_emoji === '🤔' ? 'Lightbulb' : 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-gray-400">
                Created {new Date(entry.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JournalDetailModal;
