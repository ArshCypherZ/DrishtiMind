'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, User, Target } from 'lucide-react';

export default function PracticeRoomSetup({ sessionId, userInput, onStart }) {
  const [persona, setPersona] = useState('');
  const [personaTraits, setPersonaTraits] = useState([]);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const traits = ['Strict', 'Supportive', 'Anxious', 'Practical', 'Busy', 'Emotional'];

  const handleStart = async () => {
    setLoading(true);
    const response = await fetch('/api/practice-room/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        perspectiveSessionId: sessionId,
        persona,
        personaTraits,
        goal,
        conversationContext: userInput
      })
    });

    const data = await response.json();
    onStart(data.roomUrl);
    setLoading(false);
  };

  const toggleTrait = (trait) => {
    setPersonaTraits(prev => 
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
    );
  };

  const isDisabled = !persona || !goal || personaTraits.length === 0 || loading;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 bg-white rounded-2xl p-6 border shadow-lg"
    >
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Mic className="w-5 h-5 text-purple-600" />
        Setup Your Practice Session
      </h3>

      <div>
        <label className="block text-sm font-medium mb-2">
          <User className="w-4 h-4 inline mr-1" />
          Who are you talking to?
        </label>
        <input
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="e.g., My mother, My professor"
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">What's their personality like?</label>
        <div className="flex flex-wrap gap-2">
          {traits.map(trait => (
            <button
              key={trait}
              onClick={() => toggleTrait(trait)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                personaTraits.includes(trait) 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {trait}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          <Target className="w-4 h-4 inline mr-1" />
          What's your goal for this conversation?
        </label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., To calmly explain my decision without getting defensive"
          rows={3}
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <button
        onClick={handleStart}
        disabled={isDisabled}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
      >
        {loading ? 'Creating Practice Room...' : 'Enter Practice Room'}
      </button>
    </motion.div>
  );
}
