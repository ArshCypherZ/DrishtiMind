'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const ScaleSlider = ({
  min = 1,
  max = 5,
  value,
  onChange,
  label = '',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderChange = (e) => {
    onChange(Number(e.target.value));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <motion.div
      className={`space-y-3 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <p className="text-sm text-pink-100 mb-3">{label}</p>
      )}
      
      <div className="relative">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-pink-200">{min}</span>
          <span className="text-xs text-pink-200">{max}</span>
        </div>
        
        <div className="relative">
          {/* Track */}
          <div className="h-3 bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-400 rounded-full">
            {/* Thumb */}
            <motion.div
              className={`absolute top-0 h-3 w-6 bg-gray-800 rounded-full cursor-pointer shadow-lg ${
                isDragging ? 'scale-110' : ''
              }`}
              style={{ left: `calc(${percentage}% - 12px)` }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            />
          </div>
          
          {/* Hidden input for accessibility */}
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        <div className="text-center mt-2">
          <span className="text-white font-medium">{value}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ScaleSlider; 