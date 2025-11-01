'use client';

import { motion } from 'framer-motion';

const MoodTrendChart = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          7-Day Mood Trend
        </h3>
        <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          7-Day Mood Trend
        </h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No mood data available</p>
            <p className="text-sm text-gray-400 mt-1">Start tracking your mood to see trends</p>
            <p className="text-xs text-gray-300 mt-2">Use the mood selector above to log your daily mood</p>
          </div>
        </div>
      </div>
    );
  }

  const chartHeight = 180;
  const maxMoodRate = 10;
  

  // Generate path for the mood line
  const generatePath = (data) => {
    if (data.length === 0) return '';
    
    let path = '';
    let isFirstPoint = true;
    
    data.forEach((point, index) => {
      if (point.mood_rate === null) return; // Skip null values
      
      const x = (index / (data.length - 1)) * 100; // Use original index for consistency
      const y = 100 - (point.mood_rate / maxMoodRate) * 100;
      
      if (isFirstPoint) {
        path += `M ${x} ${y}`;
        isFirstPoint = false;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const pathData = generatePath(data);
  const hasValidData = data.some(d => d.mood_rate !== null);
  const validDataCount = data.filter(d => d.mood_rate !== null).length;

  // Check if we have AI analysis data (from daily summaries)
  const hasAIAnalysis = data.some(d => d.overall_wellness !== null);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          7-Day Mood Trend
        </h3>
        <div className="text-sm text-gray-500">
          {hasAIAnalysis ? 'AI Enhanced' : 'Last week'}
        </div>
      </div>

      <div className="relative">
        {/* Chart container with proper spacing and responsiveness */}
        <div className="h-48 relative mb-4 pl-8 pr-2">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {[2, 4, 6, 8, 10].map((value) => (
              <line
                key={value}
                x1="0"
                y1={100 - (value / maxMoodRate) * 100}
                x2="100"
                y2={100 - (value / maxMoodRate) * 100}
                stroke="#f3f4f6"
                strokeWidth="0.5"
              />
            ))}
            
            {/* Mood line */}
            {pathData && hasValidData && (
              <motion.path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            )}
            
            {/* Data points */}
            {data.map((point, index) => {
              if (point.mood_rate === null) return null;
              
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (point.mood_rate / maxMoodRate) * 100;
              
              return (
                <motion.g key={point.date}>
                  <circle
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  />
                  
                  {/* Mood emoji */}
                  {point.mood_emoji && (
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="8"
                      className="select-none"
                    >
                      {point.mood_emoji}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Day labels with better spacing */}
        <div className="flex justify-between text-xs text-gray-500 pl-8 pr-2">
          {data.map((point, index) => (
            <div key={point.date} className="text-center flex-1">
              <div className="font-medium text-gray-700">{point.day}</div>
              <div className="text-gray-400 text-xs">
                {new Date(point.date).getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Mood scale - positioned better for desktop */}
        <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span>😊</span>
            <span>10</span>
          </div>
          <div className="flex items-center gap-1">
            <span>😐</span>
            <span>5</span>
          </div>
          <div className="flex items-center gap-1">
            <span>😔</span>
            <span>1</span>
          </div>
        </div>
      </div>

      {/* Enhanced Summary with AI Analysis */}
      <div className="mt-4 text-sm text-gray-600">
        {(() => {
          const validMoods = data.filter(d => d.mood_rate !== null);
          if (validMoods.length === 0) return 'Start tracking your mood to see trends';
          
          const average = validMoods.reduce((sum, d) => sum + d.mood_rate, 0) / validMoods.length;
          const trend = validMoods.length >= 2 ? 
            validMoods[validMoods.length - 1].mood_rate - validMoods[0].mood_rate : 0;
          
          // If we have AI analysis, show more detailed insights
          if (hasAIAnalysis) {
            const recentData = validMoods[validMoods.length - 1];
            if (recentData && recentData.ai_summary) {
              return (
                <div>
                  <div className="font-medium text-gray-800 mb-1">AI Analysis:</div>
                  <div className="text-xs leading-relaxed">{recentData.ai_summary}</div>
                </div>
              );
            }
          }
          
          // Fallback to basic trend analysis
          if (trend > 1) return '📈 Your mood has been improving this week!';
          if (trend < -1) return ':) Consider some self-care activities';
          return '📊 Your mood has been relatively stable';
        })()}
      </div>

      {hasAIAnalysis && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs font-medium text-blue-800 mb-2">Wellness Breakdown:</div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {data.map((point, index) => {
              if (point.overall_wellness === null) return null;
              return (
                <div key={point.date} className="flex justify-between items-center">
                  <span className="text-gray-600">{point.day}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(point.overall_wellness / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-blue-700 w-6 text-right">{point.overall_wellness}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTrendChart;
