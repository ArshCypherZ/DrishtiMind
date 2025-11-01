'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Heart,
  Brain,
  Users,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from "../context/AuthContext";
import MoodTrendChart from '../components/MoodTrendChart';
import EnhancedMoodSelector from '../components/EnhancedMoodSelector';

export const dynamic = 'force-dynamic';

const HomeScreen = () => {
  const { setCurrentView } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [homeData, setHomeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayMood, setTodayMood] = useState(null);

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

  // Load home page data
  useEffect(() => {
    if (user && isAuthenticated) {
      loadHomeData();
    }
  }, [user, isAuthenticated]);

  const loadHomeData = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping home data load');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/home", {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setHomeData(data);
        setTodayMood(data.todayMood);
      } else {
        console.error("Failed to load home data:", response.status);
      }
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleMoodSave = (mood) => {
    setTodayMood(mood);
    // Refresh data to update recommendations and chart
    if (isAuthenticated) {
      loadHomeData();
    }
  };

  // Generate mood-based inspirational cards
  const getInspirationalCards = () => {
    const baseCards = [
      {
        text: "Take a deep breath. You're doing your best today.",
        gradient: "from-blue-400 to-indigo-500",
        icon: Heart
      },
      {
        text: "Every small step forward is progress worth celebrating.",
        gradient: "from-indigo-400 to-purple-500",
        icon: Sparkles
      },
      {
        text: "You have the strength to overcome today's challenges.",
        gradient: "from-emerald-400 to-cyan-500",
        icon: Brain
      },
      {
        text: "Your feelings are valid and you deserve compassion.",
        gradient: "from-rose-400 to-pink-500",
        icon: Heart
      }
    ];

    // Add mood-based recommendations
    if (homeData?.recommendations && homeData.recommendations.length > 0) {
      const moodBasedCards = homeData.recommendations.slice(0, 2).map(rec => ({
        text: rec.description,
        gradient: getGradientForType(rec.type),
        icon: getIconForType(rec.type)
      }));
      
      return [...moodBasedCards, ...baseCards].slice(0, 4);
    }

    return baseCards;
  };

  const getGradientForType = (type) => {
    const gradients = {
      mindfulness: "from-purple-400 to-pink-500",
      reflection: "from-blue-400 to-cyan-500",
      wellness: "from-green-400 to-emerald-500",
      social: "from-yellow-400 to-orange-500",
      creative: "from-pink-400 to-rose-500",
      mood: "from-indigo-400 to-purple-500",
      support: "from-red-400 to-pink-500",
      journal: "from-teal-400 to-cyan-500",
      perspective: "from-violet-400 to-purple-500"
    };
    return gradients[type] || "from-gray-400 to-gray-500";
  };

  const getIconForType = (type) => {
    const icons = {
      mindfulness: Brain,
      reflection: BookOpen,
      wellness: Heart,
      social: Users,
      creative: Sparkles,
      mood: Heart,
      support: Heart,
      journal: BookOpen,
      perspective: Brain
    };
    return icons[type] || Heart;
  };

  const inspirationalCards = getInspirationalCards();

  const nextCarousel = () => {
    setCurrentCarouselIndex((prev) => 
      prev === inspirationalCards.length - 1 ? 0 : prev + 1
    );
  };

  const prevCarousel = () => {
    setCurrentCarouselIndex((prev) => 
      prev === 0 ? inspirationalCards.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Sidebar - Quick Actions & Stats */}
            <div className="lg:col-span-3">
              <motion.div 
                className="pt-12 pb-6"
                {...fadeInUp}
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {homeData?.greeting || "Good day"}, {user?.first_name || "there"}! 👋
                </h1>
                <p className="text-gray-600 text-base mb-6">
                  How are you feeling today?
                </p>
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                className="space-y-3 mb-8"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                {[
                  { icon: Clock, label: 'History', onClick: () => setCurrentView('history') },
                  { icon: BookOpen, label: 'Journal', onClick: () => setCurrentView('journal') },
                  { icon: RefreshCw, label: 'Refresh', onClick: () => loadHomeData() }
                ].map((action, index) => (
                  <motion.button
                    key={action.label}
                    onClick={action.onClick}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <action.icon className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </motion.div>

              {/* Mood Check-in */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <EnhancedMoodSelector
                  onMoodSave={handleMoodSave}
                  initialMood={todayMood}
                />
              </motion.div>
            </div>

            {/* Main Content - Inspirational Carousel */}
            <div className="lg:col-span-6">
              <motion.div 
                className="relative overflow-hidden rounded-2xl shadow-lg mt-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${currentCarouselIndex * 100}%)` }}
                >
                  {inspirationalCards.map((card, index) => {
                    const IconComponent = card.icon;
                    return (
                      <div
                        key={index}
                        className={`min-w-full h-80 bg-gradient-to-br ${card.gradient} relative flex items-center justify-center p-8`}
                      >
                        <div className="text-center max-w-lg">
                          <motion.div
                            className="mb-4"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                          >
                            <IconComponent className="w-16 h-16 text-white/90 mx-auto" />
                          </motion.div>
                          <h3 className="text-2xl font-semibold text-white mb-4 leading-relaxed">
                            {card.text}
                          </h3>
                          <div className="text-white/80 text-base">
                            {index < 2 && homeData?.recommendations?.[index] ? 
                              `Based on your current mood` : 
                              `Daily inspiration`
                            }
                          </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute top-6 right-6 opacity-20">
                          <div className="w-20 h-20 bg-white/20 rounded-full"></div>
                        </div>
                        <div className="absolute bottom-6 left-6 opacity-10">
                          <div className="w-10 h-10 bg-white/30 rounded-full"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced Carousel Controls */}
                <motion.button
                  onClick={prevCarousel}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all shadow-lg"
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>
                <motion.button
                  onClick={nextCarousel}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all shadow-lg"
                  whileHover={{ scale: 1.1, x: 2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>

                {/* Enhanced Carousel Indicators */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {inspirationalCards.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentCarouselIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentCarouselIndex ? 'bg-white w-8' : 'bg-white/60 w-2'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Daily Reflection */}
              <motion.div
                className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Daily Reflection</h3>
                <p className="text-gray-600 text-base mb-6">
                  Take a moment to reflect on your day and find new perspectives
                </p>
                <div className="flex gap-4">
                  <motion.button 
                    onClick={() => setCurrentView('perspective')}
                    className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Reflection
                  </motion.button>
                  <motion.button 
                    onClick={() => setCurrentView('journal')}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Write Journal
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Right Sidebar - Mood Chart & Recommendations */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
              >
                <MoodTrendChart
                  data={homeData?.moodTrends || []}
                  isLoading={isLoading}
                />
              </motion.div>

              {/* View Full Analytics Card */}
              <motion.div
                className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => setCurrentView('dashboard')}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold">Full Analytics</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    Dive deeper into your wellness journey with comprehensive analytics and personalized insights
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-xs font-medium">
                      View Dashboard
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-6 right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              </motion.div>

              {/* Recommendations Sidebar */}
              {homeData?.recommendations && homeData.recommendations.length > 0 && (
                <motion.div
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mt-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Recommended for You</h3>
                  <div className="space-y-4">
                    {homeData.recommendations.slice(2).map((rec, index) => {
                      const IconComponent = getIconForType(rec.type);
                      return (
                        <motion.div
                          key={index}
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconComponent className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm mb-1">{rec.title}</h4>
                              <p className="text-gray-600 text-xs leading-relaxed">{rec.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Keep existing */}
      <div className="block lg:hidden">
        <div className="px-4 sm:px-6 lg:px-8 pb-24 max-w-md mx-auto">
          
          {/* Simple Header */}
          <motion.div 
            className="pt-12 pb-6"
            {...fadeInUp}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {homeData?.greeting || "Good day"}, {user?.first_name || "there"}! 👋
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              How are you feeling today?
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {[
              { icon: Clock, label: 'History', onClick: () => setCurrentView('history') },
              { icon: BookOpen, label: 'Journal', onClick: () => setCurrentView('journal') },
              { icon: RefreshCw, label: 'Refresh', onClick: () => loadHomeData() }
            ].map((action, index) => (
              <motion.button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all whitespace-nowrap shadow-sm"
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <action.icon className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700 text-sm font-medium">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Mood Check-in Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <EnhancedMoodSelector
              onMoodSave={handleMoodSave}
              initialMood={todayMood}
            />
          </motion.div>

          {/* Mood Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <MoodTrendChart
              data={homeData?.moodTrends || []}
              isLoading={isLoading}
            />
          </motion.div>

          {/* Enhanced Inspirational Carousel with Recommendations */}
          <motion.div 
            className="relative mb-6 overflow-hidden rounded-2xl shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentCarouselIndex * 100}%)` }}
            >
              {inspirationalCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={index}
                    className={`min-w-full h-48 sm:h-56 bg-gradient-to-br ${card.gradient} relative flex items-center justify-center p-6`}
                  >
                    <div className="text-center max-w-sm">
                      <motion.div
                        className="mb-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <IconComponent className="w-10 h-10 text-white/90 mx-auto" />
                      </motion.div>
                      <h3 className="text-lg sm:text-md px-6 font-semibold text-white mb-3 leading-relaxed">
                        {card.text}
                      </h3>
                      <div className="text-white/80 text-sm">
                        {index < 2 && homeData?.recommendations?.[index] ? 
                          `Based on your current mood` : 
                          `Daily inspiration`
                        }
                      </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 opacity-20">
                      <div className="w-16 h-16 bg-white/20 rounded-full"></div>
                    </div>
                    <div className="absolute bottom-4 left-4 opacity-10">
                      <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Carousel Controls */}
            <motion.button
              onClick={prevCarousel}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all shadow-lg"
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              onClick={nextCarousel}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all shadow-lg"
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>

            {/* Enhanced Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {inspirationalCards.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentCarouselIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentCarouselIndex ? 'bg-white w-8' : 'bg-white/60 w-2'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Daily Reflection */}
          <motion.div
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Daily Reflection</h3>
            <p className="text-gray-600 text-sm mb-4">
              Take a moment to reflect on your day and find new perspectives
            </p>
            <div className="flex gap-3">
              <motion.button 
                onClick={() => setCurrentView('perspective')}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Reflection
              </motion.button>
              <motion.button 
                onClick={() => setCurrentView('journal')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Write Journal
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component to handle context availability
const HomePageWrapper = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <HomeScreen />;
};

export default HomePageWrapper;
