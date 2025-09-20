'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import GlassCard from './GlassCard.jsx';

const PerspectiveCard = ({
  title,
  content,
  relatedQuestions = [],
  index,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <GlassCard className="space-y-4">
        <div className="bg-white/30 rounded-lg px-4 py-2 inline-block">
          <h3 className="font-medium text-white">{title}</h3>
        </div>
        
        <p className="text-sm text-pink-100 leading-relaxed">
          {content}
        </p>
        
        {relatedQuestions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <h4 className="text-sm font-medium text-white mb-3">Related Questions</h4>
            <div className="space-y-2">
              {relatedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  className="flex items-center justify-between w-full text-left text-sm text-pink-100 hover:text-white transition-colors py-2 hover:bg-white/10 rounded-lg px-2"
                >
                  <span className="flex-1">{question}</span>
                  <Plus className="w-4 h-4 ml-2 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default PerspectiveCard; 