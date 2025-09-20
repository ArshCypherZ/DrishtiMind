'use client';

import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ 
  children, 
  className = '', 
  onClick,
  animate = true 
}) => {
  const cardContent = (
    <div
      className={`bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-6 transition-all duration-200 hover:bg-white/25 ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={onClick ? { y: -2 } : undefined}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default GlassCard; 