'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const EnhancedMoodSelector = ({ 
  onMoodSave, 
  initialMood = null,
  className = ""
}) => {
  const [selectedMood, setSelectedMood] = useState(initialMood?.mood_emoji || '');
  const [selectedRating, setSelectedRating] = useState(initialMood?.mood_rate || 5);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(initialMood?.date || null);

  const moods = [
    { emoji: '😊', label: 'Happy', color: 'bg-green-100 border-green-300' },
    { emoji: '😁', label: 'Excited', color: 'bg-yellow-100 border-yellow-300' },
    { emoji: '😐', label: 'Neutral', color: 'bg-gray-100 border-gray-300' },
    { emoji: '🤔', label: 'Thoughtful', color: 'bg-blue-100 border-blue-300' },
    { emoji: '😔', label: 'Sad', color: 'bg-blue-100 border-blue-400' },
    { emoji: '😟', label: 'Worried', color: 'bg-red-100 border-red-300' },
    { emoji: '😴', label: 'Tired', color: 'bg-purple-100 border-purple-300' },
    { emoji: '😤', label: 'Frustrated', color: 'bg-orange-100 border-orange-300' }
  ];

  const handleMoodSelect = (emoji) => {
    setSelectedMood(emoji);
  };

  const handleSaveMood = async () => {
    if (!selectedMood) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mood_emoji: selectedMood,
          mood_rate: selectedRating
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLastSaved(new Date().toISOString());
        onMoodSave?.(data.mood);
      } else {
        console.error('Failed to save mood');
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isAlreadySavedToday = lastSaved && 
    new Date(lastSaved).toDateString() === new Date().toDateString();

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Quick Mood Check
        </h3>
      </div>

      {/* Mood Selection */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {moods.map((mood) => (
          <motion.button
            key={mood.emoji}
            onClick={() => handleMoodSelect(mood.emoji)}
            className={`relative p-3 rounded-xl border-2 transition-all ${
              selectedMood === mood.emoji 
                ? `${mood.color} scale-105 shadow-md` 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            whileHover={{ scale: selectedMood === mood.emoji ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: moods.indexOf(mood) * 0.05 }}
          >
            <div className="text-2xl mb-1">{mood.emoji}</div>
            <div className="text-[10px] md:text-[9px] font-medium text-gray-600 text-center break-words leading-tight">
              {mood.label}
            </div>
            
            {selectedMood === mood.emoji && (
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>


      {/* Intensity Rating */}
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              How intense? ({selectedRating}/10)
            </label>
          </div>
          
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <motion.button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  rating <= selectedRating
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={handleSaveMood}
            disabled={isSaving || isAlreadySavedToday}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
              isAlreadySavedToday
                ? 'bg-green-100 text-green-700 border border-green-200'
                : isSaving
                ? 'bg-gray-100 text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            whileHover={{ scale: isSaving || isAlreadySavedToday ? 1 : 1.02 }}
            whileTap={{ scale: isSaving || isAlreadySavedToday ? 1 : 0.98 }}
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : isAlreadySavedToday ? (
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Mood saved for today!
              </div>
            ) : (
              'Save Mood Check'
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Helpful Message */}
      {selectedMood && !isAlreadySavedToday && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-gray-500 text-center mt-3"
        >
          Your mood helps us provide better recommendations for you
        </motion.p>
      )}
    </div>
  );
};

export default EnhancedMoodSelector;
