'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Calendar,
  BookOpen,
  Brain,
  Heart,
  Target,
  Activity,
  Award,
  Clock,
  BarChart3,
  PieChart,
  Zap,
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from "../context/AuthContext";
import GlassCard from '../components/GlassCard';

// Import dashboard components
import WellnessOverview from '../components/dashboard/WellnessOverview';
import MoodAnalytics from '../components/dashboard/MoodAnalytics';
import ActivityTracker from '../components/dashboard/ActivityTracker';
import JournalInsights from '../components/dashboard/JournalInsights';
import StreakTracker from '../components/dashboard/StreakTracker';
import PersonalizedInsights from '../components/dashboard/PersonalizedInsights';
import WeeklyHighlights from '../components/dashboard/WeeklyHighlights';

export const dynamic = 'force-dynamic';

const DashboardPage = () => {
  const { setCurrentView } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Load dashboard data
  useEffect(() => {
    if (user && isAuthenticated) {
      loadDashboardData();
    }
  }, [user, isAuthenticated, selectedTimeRange]);

  const loadDashboardData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/dashboard?timeRange=${selectedTimeRange}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
      } else {
        console.error("Failed to load dashboard data:", response.status);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFullAnalytics = () => {
    // This will be expanded later for full analytics dashboard
    setCurrentView('analytics');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Wellness Dashboard
            </h1>
            <p className="text-gray-600">
              Track your journey to mental clarity and emotional well-being
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
            
            {/* Refresh Button */}
            <motion.button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </motion.button>
          </div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Insights */}
          <div className="lg:col-span-8 space-y-6">
            {/* Wellness Overview */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              <WellnessOverview 
                data={dashboardData?.wellness} 
                user={user}
              />
            </motion.div>

            {/* Mood Analytics */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <MoodAnalytics 
                data={dashboardData?.moodAnalytics}
                timeRange={selectedTimeRange}
              />
            </motion.div>

            {/* Activity Tracker */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <ActivityTracker 
                data={dashboardData?.activity}
              />
            </motion.div>

            {/* Journal Insights */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            >
              <JournalInsights 
                data={dashboardData?.journalInsights}
              />
            </motion.div>
          </div>

          {/* Right Column - Quick Stats & Insights */}
          <div className="lg:col-span-4 space-y-6">
            {/* Streak Tracker */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
            >
              <StreakTracker 
                data={dashboardData?.streaks}
              />
            </motion.div>

            {/* Personalized Insights */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.5 }}
            >
              <PersonalizedInsights 
                insights={dashboardData?.insights}
              />
            </motion.div>

            {/* Weekly Highlights */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.6 }}
            >
              <WeeklyHighlights 
                highlights={dashboardData?.highlights}
              />
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
