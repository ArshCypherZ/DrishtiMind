'use client';

import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, Brain } from 'lucide-react';
import GlassCard from '../GlassCard';

const MoodAnalytics = ({ data, timeRange }) => {
  if (!data) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Prepare data for mood distribution chart
  const distributionData = Object.entries(data.moodDistribution || {}).map(([mood, count]) => ({
    mood,
    count,
    percentage: Math.round((count / data.moodTrend.length) * 100)
  }));

  // Get mood color based on mood type
  const getMoodColor = (mood) => {
    const colors = {
      'Excellent': 'from-green-400 to-emerald-500',
      'Good': 'from-blue-400 to-cyan-500',
      'Okay': 'from-yellow-400 to-orange-500',
      'Low': 'from-orange-400 to-red-500',
      'Very Low': 'from-red-400 to-pink-500'
    };
    return colors[mood] || 'from-gray-400 to-gray-500';
  };

  // Simple bar chart component for mood trend
  const MoodTrendChart = () => {
    if (!data.moodTrend || data.moodTrend.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Brain className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No mood data available</p>
          </div>
        </div>
      );
    }

    const maxMood = 10;
    const chartHeight = 160;

    return (
      <div className="relative h-48">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 160"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[2, 4, 6, 8, 10].map((value) => (
            <line
              key={value}
              x1="0"
              y1={160 - (value / maxMood) * 160}
              x2="400"
              y2={160 - (value / maxMood) * 160}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Mood area chart */}
          <motion.path
            d={`M 0,${160} ${data.moodTrend.map((point, index) => {
              const x = (index / (data.moodTrend.length - 1)) * 400;
              const y = 160 - (point.mood / maxMood) * 160;
              return `L ${x} ${y}`;
            }).join(' ')} L 400,160 Z`}
            fill="url(#moodGradient)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Mood line */}
          <motion.path
            d={`M ${data.moodTrend.map((point, index) => {
              const x = (index / (data.moodTrend.length - 1)) * 400;
              const y = 160 - (point.mood / maxMood) * 160;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Data points */}
          {data.moodTrend.map((point, index) => {
            const x = (index / (data.moodTrend.length - 1)) * 400;
            const y = 160 - (point.mood / maxMood) * 160;
            
            return (
              <motion.g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                />
                {point.emoji && (
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fontSize="12"
                    className="select-none"
                  >
                    {point.emoji}
                  </text>
                )}
              </motion.g>
            );
          })}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="moodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-4">
          {[10, 8, 6, 4, 2].map(value => (
            <span key={value}>{value}</span>
          ))}
        </div>
      </div>
    );
  };

  // Simple pie chart for mood distribution
  const MoodDistributionChart = () => {
    if (distributionData.length === 0) {
      return (
        <div className="h-32 flex items-center justify-center text-gray-500">
          <p className="text-sm">No distribution data</p>
        </div>
      );
    }

    const total = distributionData.reduce((sum, item) => sum + item.count, 0);
    let currentAngle = 0;

    return (
      <div className="relative h-32 flex items-center justify-center">
        <svg className="w-32 h-32" viewBox="0 0 100 100">
          {distributionData.map((item, index) => {
            const percentage = (item.count / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle = endAngle;
            
            return (
              <motion.path
                key={item.mood}
                d={pathData}
                fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Mood Analytics</h2>
          <p className="text-gray-600 text-sm">Track your emotional patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-500 capitalize">{timeRange}</span>
        </div>
      </div>

      {/* Mood Trend Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Mood Trend</h3>
        <MoodTrendChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Mood Distribution</h3>
          <div className="flex items-center gap-4">
            <MoodDistributionChart />
            <div className="flex-1 space-y-2">
              {distributionData.map((item, index) => (
                <motion.div
                  key={item.mood}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    <div className={"w-3 h-3 rounded-full bg-gradient-to-r " + getMoodColor(item.mood)}></div>
                    <span className="text-sm text-gray-700">{item.mood}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({item.percentage}%)</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mood Insights */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Key Insights</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium text-gray-900">Average Mood</p>
              </div>
              <p className="text-xl font-bold text-blue-600">{data.averageMood}/10</p>
              <p className="text-xs text-gray-600 mt-1">
                {data.averageMood >= 7 ? 'Generally positive mood' :
                 data.averageMood >= 5 ? 'Balanced emotional state' :
                 'Room for improvement'}
              </p>
            </div>

            {data.insights && data.insights.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-900">AI Insight</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {data.insights[0].text}
                </p>
              </div>
            )}

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <p className="text-sm font-medium text-gray-900 mb-1">Data Points</p>
              <p className="text-lg font-bold text-purple-600">{data.moodTrend.length}</p>
              <p className="text-xs text-gray-600">Mood entries tracked</p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default MoodAnalytics;
