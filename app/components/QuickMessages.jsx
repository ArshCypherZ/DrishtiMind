'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const QuickMessages = ({ messages, onSelect, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Zap className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-medium text-gray-600">Quick messages</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {messages.map((msg, index) => (
          <motion.button
            key={index}
            onClick={() => onSelect(msg)}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-gray-700 text-sm rounded-full border border-blue-200 hover:border-blue-300 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {msg}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickMessages;
