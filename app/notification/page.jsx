'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Clock, AlertCircle, Trash2, Settings, RefreshCw } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setRefreshing(true);

      const response = await fetch('/api/notifications', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  const getNotificationColors = (type, read) => {
    const baseColors = {
      reminder: {
        bg: read ? 'bg-blue-50' : 'bg-blue-100',
        icon: 'bg-blue-100 text-blue-600',
        border: read ? 'border-blue-100' : 'border-blue-200'
      },
      achievement: {
        bg: read ? 'bg-emerald-50' : 'bg-emerald-100',
        icon: 'bg-emerald-100 text-emerald-600',
        border: read ? 'border-emerald-100' : 'border-emerald-200'
      },
      tip: {
        bg: read ? 'bg-purple-50' : 'bg-purple-100',
        icon: 'bg-purple-100 text-purple-600',
        border: read ? 'border-purple-100' : 'border-purple-200'
      },
      milestone: {
        bg: read ? 'bg-yellow-50' : 'bg-yellow-100',
        icon: 'bg-yellow-100 text-yellow-600',
        border: read ? 'border-yellow-100' : 'border-yellow-200'
      },
      check_in: {
        bg: read ? 'bg-indigo-50' : 'bg-indigo-100',
        icon: 'bg-indigo-100 text-indigo-600',
        border: read ? 'border-indigo-100' : 'border-indigo-200'
      },
      daily_reflection: {
        bg: read ? 'bg-orange-50' : 'bg-orange-100',
        icon: 'bg-orange-100 text-orange-600',
        border: read ? 'border-orange-100' : 'border-orange-200'
      },
      task_reminder: {
        bg: read ? 'bg-red-50' : 'bg-red-100',
        icon: 'bg-red-100 text-red-600',
        border: read ? 'border-red-100' : 'border-red-200'
      }
    };
    return baseColors[type] || baseColors.reminder;
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      reminder: Clock,
      achievement: CheckCircle,
      tip: AlertCircle,
      milestone: CheckCircle,
      check_in: Clock,
      daily_reflection: Clock,
      task_reminder: AlertCircle
    };
    return iconMap[type] || Clock;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Sidebar - Stats & Actions */}
              <div className="lg:col-span-3">
                <motion.div 
                  className="pt-12 pb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      {unreadCount > 0 && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <span className="text-white text-xs font-bold">{unreadCount}</span>
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Updates
                      </h1>
                      <p className="text-gray-600 text-sm">
                        {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div 
                  className="space-y-3 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button
                    onClick={fetchNotifications}
                    disabled={refreshing}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className={`w-5 h-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-gray-700 font-medium">Refresh</span>
                  </motion.button>

                  {unreadCount > 0 && (
                    <motion.button
                      onClick={markAllAsRead}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Mark All Read</span>
                    </motion.button>
                  )}

                  <motion.button
                    onClick={() => window.location.href = '/email-settings'}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">Email Settings</span>
                  </motion.button>
                </motion.div>

                {/* Notification Stats */}
                <motion.div
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total</span>
                      <span className="font-semibold text-gray-900">{notifications.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Unread</span>
                      <span className="font-semibold text-blue-600">{unreadCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Read</span>
                      <span className="font-semibold text-green-600">{notifications.length - unreadCount}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Main Content - Notifications List */}
              <div className="lg:col-span-9">
                <motion.div 
                  className="pt-12 pb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Recent Notifications</h2>
                  <p className="text-gray-600 text-sm">Stay updated with your wellness journey</p>
                </motion.div>

                {/* Notifications Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {notifications.map((notification, index) => {
                      const IconComponent = getNotificationIcon(notification.type);
                      const colors = getNotificationColors(notification.type, notification.is_read);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          className={`${colors.bg} ${colors.border} border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden group`}
                          variants={fadeInUp}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          layout
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                          whileHover={{ scale: 1.01, y: -1 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {/* Unread indicator */}
                          {!notification.is_read && (
                            <motion.div 
                              className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ delay: index * 0.1 }}
                            />
                          )}
                          
                          <div className="flex items-start space-x-4">
                            <motion.div 
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon} flex-shrink-0`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 400 }}
                            >
                              <IconComponent className="w-6 h-6" />
                            </motion.div>
                            
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className={`font-semibold text-gray-900 text-base ${!notification.is_read ? 'font-bold' : ''}`}>
                                  {notification.title}
                                </h3>
                                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                  <span className="text-sm text-gray-500">
                                    {formatTimeAgo(notification.created_at)}
                                  </span>
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 leading-relaxed pr-2">
                                {notification.message}
                              </p>
                              
                              {!notification.is_read && (
                                <motion.div 
                                  className="flex items-center space-x-2 pt-1"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: index * 0.1 + 0.4 }}
                                >
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-xs text-blue-600 font-medium">New</span>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Empty State */}
                {notifications.length === 0 && (
                  <motion.div 
                    className="text-center py-16"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      You're all caught up. We'll notify you when there's something new to check out.
                    </p>
                  </motion.div>
                )}

                {/* Quick Actions Footer */}
                {notifications.length > 0 && (
                  <motion.div 
                    className="mt-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        className="p-3 bg-blue-50 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Notification Settings
                      </motion.button>
                      <motion.button
                        className="p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View All History
                      </motion.button>
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
            
            {/* Header */}
            <motion.div 
              className="pt-12 pb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    {unreadCount > 0 && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <span className="text-white text-xs font-bold">{unreadCount}</span>
                      </motion.div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Updates
                    </h1>
                    <p className="text-gray-600 text-sm">
                      {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={fetchNotifications}
                    disabled={refreshing}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </motion.button>
                  {unreadCount > 0 && (
                    <motion.button
                      onClick={markAllAsRead}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Mark all read
                    </motion.button>
                  )}
                  <motion.button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Notifications List */}
            <div className="space-y-3">
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  const colors = getNotificationColors(notification.type, notification.is_read);
                  
                  return (
                    <motion.div
                      key={notification.id}
                      className={`${colors.bg} ${colors.border} border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden group`}
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <motion.div 
                          className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: index * 0.1 }}
                        />
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <motion.div 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon} flex-shrink-0`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 400 }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between">
                            <h3 className={`font-semibold text-gray-900 text-sm ${!notification.is_read ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 leading-relaxed pr-2">
                            {notification.message}
                          </p>
                          
                          {!notification.is_read && (
                            <motion.div 
                              className="flex items-center space-x-2 pt-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.4 }}
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-blue-600 font-medium">New</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {notifications.length === 0 && (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  You're all caught up. We'll notify you when there's something new to check out.
                </p>
              </motion.div>
            )}

            {/* Quick Actions */}
            {notifications.length > 0 && (
              <motion.div 
                className="mt-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    className="p-3 bg-blue-50 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Notification Settings
                  </motion.button>
                  <motion.button
                    className="p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View All History
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default NotificationsScreen;
