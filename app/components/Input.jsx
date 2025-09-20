'use client';

import React from 'react';
import { motion } from 'framer-motion';

const Input = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  rows = 4,
  className = '',
  disabled = false,
}) => {
  const baseClasses = `
    w-full bg-transparent border border-white/30 rounded-xl p-4 text-white 
    placeholder-pink-200 resize-none focus:outline-none focus:border-white/50 
    focus:ring-2 focus:ring-white/20 transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const Component = type === 'textarea' ? 'textarea' : 'input';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Component
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={type === 'textarea' ? rows : undefined}
        className={`${baseClasses} ${className}`}
        disabled={disabled}
      />
    </motion.div>
  );
};

export default Input; 