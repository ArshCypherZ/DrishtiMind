'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  BookOpen, 
  Lightbulb, 
  Target,
  ChevronRight,
  Filter,
  Search,
  Eye,
  EyeOff,
  Play
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useApp } from '../context/AppContext';

const HistoryScreen = () => {
  const { setCurrentView, setContinueSession } = useApp();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchSessions = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/perspective/history?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSessions(1, searchTerm, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    fetchSessions(1, searchTerm, status);
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setShowModal(true);
  };

  const handleContinueSession = async (session) => {
    try {
      const token = getAuthToken();
      
      // Fetch detailed session data including quiz questions
      const response = await fetch(`/api/perspective/session/${session.id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }

      const sessionData = await response.json();
      console.log("🔍 Session data from API:", sessionData);
      console.log("🔍 Quizzes from API:", sessionData.session?.quizzes);
      
      // Set continue session data
      setContinueSession({
        sessionId: session.id,
        userInput: session.userInput,
        quizQuestions: sessionData.session.quizzes || [],
        quizAnswers: sessionData.session.quizAnswers || {},
        sessionData: sessionData
      });

      // Navigate to perspective page
      setCurrentView('perspective');
    } catch (error) {
      console.error('Error continuing session:', error);
      alert('Failed to continue session. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'understanding': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'understanding': return 'In Progress';
      default: return 'Unknown';
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.userInput.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Sidebar - Filters & Stats */}
              <div className="lg:col-span-3">
                <motion.div 
                  className="pt-12 pb-6"
                  {...fadeInUp}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Session History
                      </h1>
                      <p className="text-gray-600 text-sm">
                        Your perspective journey
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Search */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search sessions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors"
                      />
                    </div>
                  </form>
                </motion.div>

                {/* Filter Buttons */}
                <motion.div 
                  className="space-y-2 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Status</h3>
                  {[
                    { key: 'all', label: 'All Sessions' },
                    { key: 'completed', label: 'Completed' },
                    { key: 'understanding', label: 'In Progress' }
                  ].map((filter) => (
                    <motion.button
                      key={filter.key}
                      onClick={() => handleFilterChange(filter.key)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        filterStatus === filter.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {filter.label}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Stats Summary */}
                <motion.div
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Sessions</span>
                      <span className="font-semibold text-gray-900">{sessions.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-green-600">
                        {sessions.filter(s => s.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">In Progress</span>
                      <span className="font-semibold text-yellow-600">
                        {sessions.filter(s => s.status === 'understanding').length}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Main Content - Sessions List */}
              <div className="lg:col-span-9">
                <motion.div 
                  className="pt-12 pb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Recent Sessions</h2>
                  <p className="text-gray-600 text-sm">Your latest perspective exploration sessions</p>
                </motion.div>

                {/* Sessions Grid */}
                <motion.div
                  variants={staggerChildren}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                >
                  {loading ? (
                    <div className="col-span-full space-y-4">
                      {[...Array(4)].map((_, index) => (
                        <motion.div
                          key={index}
                          className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="flex justify-between items-center">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <motion.div
                      className="col-span-full text-center py-16"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        No sessions found
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Try adjusting your search or filter'
                          : 'Start your first perspective session to see it here'
                        }
                      </p>
                    </motion.div>
                  ) : (
                    filteredSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        variants={fadeInUp}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-gray-900 font-semibold text-base mb-2 line-clamp-2">
                              {session.userInput}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(session.date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(session.date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                              {getStatusText(session.status)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Lightbulb className="w-4 h-4" />
                              <span>{session.cardsCount} cards</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>{session.quizzesCount} quizzes</span>
                            </div>
                          </div>
                          {session.savedToJournal && (
                            <div className="flex items-center gap-1 text-green-600">
                              <BookOpen className="w-4 h-4" />
                              <span>Saved</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2">
                          <motion.button
                            onClick={() => handleSessionClick(session)}
                            className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            View Details
                          </motion.button>
                          {session.status === 'understanding' && (
                            <motion.button
                              onClick={() => handleContinueSession(session)}
                              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Play className="w-4 h-4" />
                              Continue Session
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div 
                    className="flex justify-center gap-2 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {[...Array(totalPages)].map((_, index) => (
                      <motion.button
                        key={index}
                        onClick={() => fetchSessions(index + 1, searchTerm, filterStatus)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                          currentPage === index + 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {index + 1}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Keep existing */}
        <div className="block lg:hidden">
          <div className="px-4 sm:px-6 lg:px-8 pb-24 max-w-md mx-auto">
            
            {/* Header */}
            <motion.div 
              className="pt-12 pb-6"
              {...fadeInUp}
            >
              <div className="flex items-center gap-4 mb-4">
                <motion.button
                  onClick={() => window.history.back()}
                  className="p-2 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </motion.button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Session History
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Your perspective journey
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Search and Filter */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </form>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'understanding', label: 'In Progress' }
                ].map((filter) => (
                  <motion.button
                    key={filter.key}
                    onClick={() => handleFilterChange(filter.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      filterStatus === filter.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Sessions List */}
            <motion.div
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <motion.div
                      key={index}
                      className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : filteredSessions.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No sessions found
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filter'
                      : 'Start your first perspective session to see it here'
                    }
                  </p>
                </motion.div>
              ) : (
                filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-semibold text-sm mb-1 line-clamp-2">
                          {session.userInput}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(session.date)}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{formatTime(session.date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          <span>{session.cardsCount} cards</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{session.quizzesCount} quizzes</span>
                        </div>
                      </div>
                      {session.savedToJournal && (
                        <div className="flex items-center gap-1 text-green-600">
                          <BookOpen className="w-3 h-3" />
                          <span>Saved</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2">
                      <motion.button
                        onClick={() => handleSessionClick(session)}
                        className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View Details
                      </motion.button>
                      {session.status === 'understanding' && (
                        <motion.button
                          onClick={() => handleContinueSession(session)}
                          className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play className="w-3 h-3" />
                          Continue
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div 
                className="flex justify-center gap-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[...Array(totalPages)].map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => fetchSessions(index + 1, searchTerm, filterStatus)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      currentPage === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {index + 1}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Session Detail Modal */}
        <AnimatePresence>
          {showModal && selectedSession && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Session Details</h2>
                    <motion.button
                      onClick={() => setShowModal(false)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(selectedSession.date)} at {formatTime(selectedSession.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                      {getStatusText(selectedSession.status)}
                    </span>
                    {selectedSession.savedToJournal && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Saved to Journal
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-96">
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Input</h3>
                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                      {selectedSession.userInput}
                    </p>
                  </div>

                  {selectedSession.cards.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Perspective Cards ({selectedSession.cards.length})</h3>
                      <div className="space-y-3">
                        {selectedSession.cards.map((card, index) => (
                          <div key={card.id} className="bg-blue-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 mb-1">{card.title}</h4>
                            <p className="text-xs text-blue-700 leading-relaxed">{card.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSession.quizzes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Quiz Questions ({selectedSession.quizzes.length})</h3>
                      <div className="space-y-3">
                        {selectedSession.quizzes.map((quiz, index) => (
                          <div key={quiz.id} className="bg-yellow-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-yellow-900 mb-1">Q{index + 1}: {quiz.question_text}</h4>
                            {quiz.answer_text && (
                              <p className="text-xs text-yellow-700 leading-relaxed">
                                <strong>Answer:</strong> {quiz.answer_text}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
};

export default HistoryScreen;
