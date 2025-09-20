'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, 
  Calendar, 
  Search, 
  Filter,
  BookOpen,
  Smile,
  Frown,
  Meh,
  Trash2,
  ChevronRight,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import JournalDetailModal from '../components/JournalDetailModal';
import { useAuth } from '../context/AuthContext';

const JournalScreen = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Data states
  const [journalEntries, setJournalEntries] = useState([]);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    favoriteEntries: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  };

  const moodEmojis = {
    '😊': { emoji: '😊', color: 'text-green-500', bg: 'bg-green-50', label: 'Happy' },
    '😐': { emoji: '😐', color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Neutral' },
    '😔': { emoji: '😔', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Sad' },
    '😟': { emoji: '😟', color: 'text-red-500', bg: 'bg-red-50', label: 'Stressed' },
    '🧠': { emoji: '🧠', color: 'text-purple-500', bg: 'bg-purple-50', label: 'Thoughtful' },
    '❤️': { emoji: '❤️', color: 'text-red-500', bg: 'bg-red-50', label: 'Loved' },
    '✨': { emoji: '✨', color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Inspired' }
  };


  // Fetch journal entries
  const fetchJournals = useCallback(async (pageNum = 1, reset = false) => {
    if (!isAuthenticated) return;

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        search: searchQuery,
        mood: selectedMood === 'all' ? '' : selectedMood
      });

      const response = await fetch(`/api/journal?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch journals');
      }

      const data = await response.json();
      
      if (reset || pageNum === 1) {
        setJournalEntries(data.journals);
      } else {
        setJournalEntries(prev => [...prev, ...data.journals]);
      }
      
      setHasMore(data.pagination.hasNext);
      setPage(pageNum);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching journals:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedMood, isAuthenticated]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/journal/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalEntries: data.totalEntries,
          currentStreak: data.currentStreak,
          favoriteEntries: data.favoriteEntries
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchJournals(1, true);
      fetchStats();
    }
  }, [isAuthenticated, fetchJournals, fetchStats]);

  // Handle search and filter changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = setTimeout(() => {
      setLoading(true);
      fetchJournals(1, true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedMood, isAuthenticated, fetchJournals]);

  const handleNewEntry = async () => {
    if (!isAuthenticated) {
      setError('Not authenticated');
      return;
    }

    if (!newEntryContent.trim() || !newEntryTitle.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newEntryTitle.trim(),
          content: newEntryContent.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create journal entry');
      }

      // Add new entry to the beginning of the list
      setJournalEntries(prev => [data.journal, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalEntries: prev.totalEntries + 1
      }));

      // Reset form
      setNewEntryContent('');
      setNewEntryTitle('');
      setShowNewEntry(false);

      // Show success message
      alert(`Journal entry created! You earned ${data.pointsEarned} points.`);

    } catch (err) {
      setError(err.message);
      console.error('Error creating journal entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEntry = async (id) => {
    if (!isAuthenticated) {
      setError('Not authenticated');
      return;
    }

    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete entry');
      }

      // Remove from list immediately for better UX
      setJournalEntries(prev => prev.filter(entry => entry.id !== id));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalEntries: Math.max(0, prev.totalEntries - 1)
      }));

      // Close detail modal if the deleted entry is currently open
      if (selectedEntry && selectedEntry.id === id) {
        setShowDetailModal(false);
        setSelectedEntry(null);
      }

      // Show success message
      alert('Journal entry deleted successfully');

    } catch (err) {
      setError(err.message);
      console.error('Error deleting journal entry:', err);
    }
  };

  const loadMore = () => {
    if (!isAuthenticated || loading || !hasMore) return;
    setLoading(true);
    fetchJournals(page + 1, false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMoodData = (moodEmoji) => {
    return moodEmojis[moodEmoji] || { 
      emoji: moodEmoji, 
      color: 'text-gray-500', 
      bg: 'bg-gray-50',
      label: 'Unknown' 
    };
  };

  const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${readTime} min read`;
  };

  const refreshData = () => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetchJournals(1, true);
    fetchStats();
  };

  const handleReadMore = (entry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Sidebar - Stats & Filters */}
              <div className="lg:col-span-3">
                <motion.div 
                  className="pt-12 pb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Journal
                      </h1>
                      <p className="text-gray-600 text-sm">
                        Your thoughts and reflections
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Search and Filter */}
                <motion.div 
                  className="space-y-4 mb-8"
                  {...fadeInUp}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search your entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Mood</h3>
                    {[
                      { key: 'all', label: 'All', icon: Filter },
                      { key: '😊', label: 'Happy', icon: Smile },
                      { key: '😐', label: 'Neutral', icon: Meh },
                      { key: '😔', label: 'Sad', icon: Frown },
                    ].map((filter) => (
                      <motion.button
                        key={filter.key}
                        onClick={() => setSelectedMood(filter.key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          selectedMood === filter.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <filter.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{filter.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-white rounded-xl p-6 border border-gray-200 text-center shadow-sm">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalEntries}</div>
                    <div className="text-sm text-gray-500">Total Entries</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 text-center shadow-sm">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.currentStreak}</div>
                    <div className="text-sm text-gray-500">Day Streak</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 text-center shadow-sm">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.favoriteEntries}</div>
                    <div className="text-sm text-gray-500">High Quality</div>
                  </div>
                </motion.div>
              </div>

              {/* Main Content - Journal Entries */}
              <div className="lg:col-span-9">
                <motion.div 
                  className="pt-12 pb-6 flex items-center justify-between"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Recent Entries</h2>
                    <p className="text-gray-600 text-sm">Your latest thoughts and reflections</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <motion.button
                      onClick={refreshData}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-white/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => setShowNewEntry(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span className="font-medium">New Entry</span>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Error Display */}
                {error && (
                  <motion.div 
                    className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Loading Indicator */}
                {loading && journalEntries.length === 0 && (
                  <motion.div 
                    className="flex items-center justify-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
                    />
                  </motion.div>
                )}

                {/* Journal Entries Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {journalEntries.map((entry, index) => {
                      const moodData = getMoodData(entry.mood_emoji);
                      
                      return (
                        <motion.div
                          key={entry.id}
                          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          layout
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 ${moodData.bg} rounded-xl flex items-center justify-center`}>
                                <span className="text-xl">{moodData.emoji}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-base">
                                  {entry.title}
                                </h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(entry.date)}</span>
                                  {entry.points_earned > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-green-600 font-medium">
                                        +{entry.points_earned} pts
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <motion.button
                                onClick={() => deleteEntry(entry.id)}
                                className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
                            {entry.summary || entry.content}
                          </p>
                          
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {entry.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{calculateReadTime(entry.content)}</span>
                            </div>
                            <motion.button
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleReadMore(entry)}
                            >
                              <span>Read more</span>
                              <ChevronRight className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Load More Button */}
                {hasMore && !loading && journalEntries.length > 0 && (
                  <motion.div 
                    className="flex justify-center mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.button
                      onClick={loadMore}
                      className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Load More</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}

                {/* Loading More Indicator */}
                {loading && journalEntries.length > 0 && (
                  <motion.div 
                    className="flex items-center justify-center py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
                    />
                  </motion.div>
                )}

                {/* Empty State */}
                {!loading && journalEntries.length === 0 && (
                  <motion.div 
                    className="text-center py-16"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-10 h-10 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchQuery || selectedMood !== 'all' ? 'No entries found' : 'Start your journal'}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto mb-4">
                      {searchQuery || selectedMood !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Begin documenting your thoughts, feelings, and daily reflections'
                      }
                    </p>
                    {!searchQuery && selectedMood === 'all' && (
                      <motion.button
                        onClick={() => setShowNewEntry(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Write your first entry
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div className="px-4 sm:px-6 lg:px-8 pb-24 max-w-md mx-auto">
            
            {/* Header */}
            <motion.div 
              className="pt-12 pb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                {/* Left Side: Icon and Title */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Journal
                    </h1>
                    <p className="text-gray-600 text-sm">
                      Your thoughts and reflections
                    </p>
                  </div>
                </div>
                
                {/* Right Side: Action Buttons */}
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={refreshData}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-white/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setShowNewEntry(true)}
                    className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlusCircle className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div 
                className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Search and Filter */}
            <motion.div 
              className="mb-6 space-y-3"
              {...fadeInUp}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search your entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { key: 'all', label: 'All', icon: Filter },
                  { key: '😊', label: 'Happy', icon: Smile },
                  { key: '😐', label: 'Neutral', icon: Meh },
                  { key: '😔', label: 'Sad', icon: Frown },
                ].map((filter) => (
                  <motion.button
                    key={filter.key}
                    onClick={() => setSelectedMood(filter.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${
                      selectedMood === filter.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <filter.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{filter.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              className="grid grid-cols-3 gap-3 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stats.totalEntries}</div>
                <div className="text-xs text-gray-500">Total Entries</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stats.currentStreak}</div>
                <div className="text-xs text-gray-500">Day Streak</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stats.favoriteEntries}</div>
                <div className="text-xs text-gray-500">High Quality</div>
              </div>
            </motion.div>

            {/* Loading Indicator */}
            {loading && journalEntries.length === 0 && (
              <motion.div 
                className="flex items-center justify-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
                />
              </motion.div>
            )}

            {/* Journal Entries */}
            <div className="space-y-4">
              <AnimatePresence>
                {journalEntries.map((entry, index) => {
                  const moodData = getMoodData(entry.mood_emoji);
                  
                  return (
                    <motion.div
                      key={entry.id}
                      className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${moodData.bg} rounded-xl flex items-center justify-center`}>
                            <span className="text-lg">{moodData.emoji}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {entry.title}
                            </h3>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(entry.date)}</span>
                              {entry.points_earned > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 font-medium">
                                    +{entry.points_earned} pts
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-3">
                        {entry.summary || entry.content}
                      </p>
                      
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {entry.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{calculateReadTime(entry.content)}</span>
                        </div>
                        <motion.button
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReadMore(entry)}
                        >
                          <span>Read more</span>
                          <ChevronRight className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {hasMore && !loading && journalEntries.length > 0 && (
              <motion.div 
                className="flex justify-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.button
                  onClick={loadMore}
                  className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Load More</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* Loading More Indicator */}
            {loading && journalEntries.length > 0 && (
              <motion.div 
                className="flex items-center justify-center py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
                />
              </motion.div>
            )}

            {/* Empty State */}
            {!loading && journalEntries.length === 0 && (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery || selectedMood !== 'all' ? 'No entries found' : 'Start your journal'}
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mb-4">
                  {searchQuery || selectedMood !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Begin documenting your thoughts, feelings, and daily reflections'
                  }
                </p>
                {!searchQuery && selectedMood === 'all' && (
                  <motion.button
                    onClick={() => setShowNewEntry(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Write your first entry
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* New Entry Modal */}
        <AnimatePresence>
          {showNewEntry && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">New Entry</h3>
                  <button
                    onClick={() => setShowNewEntry(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newEntryTitle}
                      onChange={(e) => setNewEntryTitle(e.target.value)}
                      placeholder="Give your entry a title..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength="200"
                    />
                    <div className="mt-1 text-xs text-gray-400">
                      {newEntryTitle.length}/200 characters
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your thoughts *
                    </label>
                    <textarea
                      value={newEntryContent}
                      onChange={(e) => setNewEntryContent(e.target.value)}
                      placeholder="What's on your mind? Share your thoughts, feelings, or reflections from today..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      maxLength="5000"
                    />
                    <div className="mt-1 text-xs text-gray-400">
                      {newEntryContent.length}/5000 characters
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-xs">ℹ</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">AI-Powered Enhancement</p>
                        <p className="text-xs">We'll automatically generate a mood emoji, summary, and tags based on your content to help you better organize and understand your thoughts.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <motion.button
                    onClick={() => setShowNewEntry(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleNewEntry}
                    disabled={!newEntryContent.trim() || !newEntryTitle.trim() || submitting}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 ${
                      newEntryContent.trim() && newEntryTitle.trim() && !submitting
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={newEntryContent.trim() && newEntryTitle.trim() && !submitting ? { scale: 1.02 } : {}}
                    whileTap={newEntryContent.trim() && newEntryTitle.trim() && !submitting ? { scale: 0.98 } : {}}
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Entry</span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Journal Detail Modal */}
        <JournalDetailModal
          entry={selectedEntry}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
};

export default JournalScreen;