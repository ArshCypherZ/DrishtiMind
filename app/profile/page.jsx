'use client';
 
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  LogOut, 
  Bell, 
  Moon, 
  Sun, 
  Target, 
  Calendar, 
  Shield, 
  FileText, 
  HelpCircle,
  ChevronRight,
  Settings,
  X,
  Loader2
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userStats, setUserStats] = useState({
    completedSessions: 0,
    currentStreak: 0,
    totalPoints: 0
  });
  
  // User preferences states (synced with user data)
  const [preferences, setPreferences] = useState({
    push_notification: user?.push_notification || false,
    dark_mode: user?.dark_mode || false,
    wellness_reminders: user?.wellness_reminders || false,
    weekly_summary: user?.weekly_summary || false
  });
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    email: user?.email || ''
  });

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Update preferences when user data changes
  useEffect(() => {
    if (user) {
      setPreferences({
        push_notification: user.push_notification,
        dark_mode: user.dark_mode,
        wellness_reminders: user.wellness_reminders,
        weekly_summary: user.weekly_summary
      });
      setEditForm({
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email
      });
    }
  }, [user]);

  // Fetch stats when component mounts
  useEffect(() => {
    fetchUserStats();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  };

  // Update user preferences with debouncing
  const updatePreference = async (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [key]: value
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
      } else {
        console.error('Failed to update preference');
        setPreferences(prev => ({
          ...prev,
          [key]: !value
        }));
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      setPreferences(prev => ({
        ...prev,
        [key]: !value
      }));
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        setShowEditModal(false);
      } else {
        const error = await response.json();
        console.error('Failed to update profile:', error.message);
        alert(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const SwitchToggle = ({ isOn, onToggle, label, icon: Icon, disabled = false }) => (
    <motion.div 
      className={`flex items-center justify-between py-4 px-4 bg-white rounded-xl border border-gray-200 shadow-sm ${
        disabled ? 'opacity-50' : ''
      }`}
      whileHover={!disabled ? { scale: 1.01, y: -1 } : {}}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <span className="text-gray-900 font-medium">{label}</span>
      </div>
      <motion.button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isOn ? 'bg-blue-600' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm"
          animate={{ x: isOn ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </motion.div>
  );

  const MenuItem = ({ icon: Icon, label, onClick, showArrow = true, variant = 'default' }) => (
    <motion.button
      onClick={onClick}
      className={`flex items-center justify-between w-full py-4 px-4 rounded-xl border transition-all ${
        variant === 'danger' 
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
          : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm hover:shadow-md'
      }`}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-100' : 'bg-gray-100'
        }`}>
          <Icon className={`w-5 h-5 ${variant === 'danger' ? 'text-red-600' : 'text-gray-600'}`} />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      {showArrow && <ChevronRight className="w-5 h-5 text-gray-400" />}
    </motion.button>
  );

  const EditProfileModal = () => (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
          <button
            onClick={() => setShowEditModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={editForm.first_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={editForm.last_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="flex space-x-3 mt-8">
          <motion.button
            onClick={() => setShowEditModal(false)}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleProfileUpdate}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Sidebar - Profile Info & Stats */}
              <div className="lg:col-span-4">
                <motion.div 
                  className="pt-12 pb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Profile
                  </h1>
                  <p className="text-gray-600 text-base">
                    Manage your account and preferences
                  </p>
                </motion.div>

                {/* Profile Card */}
                <motion.div
                  className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-8"
                  {...fadeInUp}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-3xl font-bold text-white">
                            {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        {user.is_verified && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </h2>
                        <p className="text-gray-500 text-sm">
                          @{user.username}
                        </p>
                        {!user.is_verified && (
                          <p className="text-orange-500 text-xs mt-1">
                            Email not verified
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setShowEditModal(true)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Edit
                    </motion.button>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {userStats.completedSessions}
                      </div>
                      <div className="text-sm text-gray-500">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {userStats.currentStreak}
                      </div>
                      <div className="text-sm text-gray-500">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {userStats.totalPoints}
                      </div>
                      <div className="text-sm text-gray-500">Points</div>
                    </div>
                  </div>
                </motion.div>

                {/* Account Info */}
                <motion.div
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 py-3 px-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-500 text-sm">Email</span>
                        <p className="text-gray-900 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Main Content - Settings & Preferences */}
              <div className="lg:col-span-8">
                <motion.div 
                  className="pt-12 pb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Settings & Preferences</h2>
                  <p className="text-gray-600 text-base">Customize your experience</p>
                </motion.div>

                {/* Preferences Section */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Preferences</h3>
                  <div className="space-y-4">
                    <SwitchToggle
                      isOn={preferences.push_notification}
                      onToggle={() => updatePreference('push_notification', !preferences.push_notification)}
                      label="Push Notifications"
                      icon={Bell}
                    />
                    
                    <SwitchToggle
                      isOn={preferences.dark_mode}
                      onToggle={() => updatePreference('dark_mode', !preferences.dark_mode)}
                      label="Dark Mode"
                      icon={preferences.dark_mode ? Moon : Sun}
                    />
                    
                    <SwitchToggle
                      isOn={preferences.wellness_reminders}
                      onToggle={() => updatePreference('wellness_reminders', !preferences.wellness_reminders)}
                      label="Wellness Reminders"
                      icon={Target}
                    />
                    
                    <SwitchToggle
                      isOn={preferences.weekly_summary}
                      onToggle={() => updatePreference('weekly_summary', !preferences.weekly_summary)}
                      label="Weekly Summary"
                      icon={Calendar}
                    />
                  </div>
                </motion.section>

                {/* Account Actions */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Account Actions</h3>
                  <div className="space-y-4">
                    <MenuItem
                      icon={Lock}
                      label="Change Password"
                      onClick={() => console.log('Navigate to password change')}
                    />
                    
                    <MenuItem
                      icon={LogOut}
                      label="Sign Out"
                      onClick={handleLogout}
                      variant="danger"
                    />
                  </div>
                </motion.section>

                {/* Support Section */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-8"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Support & Legal</h3>
                  <div className="space-y-4">
                    <MenuItem
                      icon={HelpCircle}
                      label="Help Center"
                      onClick={() => console.log('Navigate to Help Center')}
                    />
                    
                    <MenuItem
                      icon={Shield}
                      label="Privacy Policy"
                      onClick={() => console.log('Navigate to Privacy Policy')}
                    />
                    
                    <MenuItem
                      icon={FileText}
                      label="Terms of Service"
                      onClick={() => console.log('Navigate to Terms of Service')}
                    />
                    
                    <MenuItem
                      icon={Settings}
                      label="App Settings"
                      onClick={() => console.log('Navigate to App Settings')}
                    />
                  </div>
                </motion.section>

                {/* App Info */}
                <motion.div 
                  className="bg-gray-100 rounded-2xl p-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="text-gray-500 text-sm">
                    <p className="mb-1">Drishti App v1.0.0</p>
                    <p>Made with care for your wellbeing</p>
                  </div>
                </motion.div>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Profile
              </h1>
              <p className="text-gray-600 text-sm">
                Manage your account and preferences
              </p>
            </motion.div>

            <div className="space-y-8">
              {/* Profile Info */}
              <motion.section
                {...fadeInUp}
              >
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold text-white">
                            {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        {user.is_verified && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </h2>
                        <p className="text-gray-500 text-sm">
                          @{user.username}
                        </p>
                        {!user.is_verified && (
                          <p className="text-orange-500 text-xs mt-1">
                            Email not verified
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setShowEditModal(true)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Edit
                    </motion.button>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {userStats.completedSessions}
                      </div>
                      <div className="text-xs text-gray-500">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {userStats.currentStreak}
                      </div>
                      <div className="text-xs text-gray-500">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {userStats.totalPoints}
                      </div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Account Section */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 py-4 px-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-500 text-sm">Email</span>
                      <p className="text-gray-900 font-medium">{user.email}</p>
                    </div>
                  </div>
                  
                  <MenuItem
                    icon={Lock}
                    label="Change Password"
                    onClick={() => console.log('Navigate to password change')}
                  />
                  
                  <MenuItem
                    icon={LogOut}
                    label="Sign Out"
                    onClick={handleLogout}
                    variant="danger"
                  />
                </div>
              </motion.section>

              {/* Preferences Section */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Preferences</h2>
                <div className="space-y-3">
                  <SwitchToggle
                    isOn={preferences.push_notification}
                    onToggle={() => updatePreference('push_notification', !preferences.push_notification)}
                    label="Push Notifications"
                    icon={Bell}
                  />
                  
                  <SwitchToggle
                    isOn={preferences.dark_mode}
                    onToggle={() => updatePreference('dark_mode', !preferences.dark_mode)}
                    label="Dark Mode"
                    icon={preferences.dark_mode ? Moon : Sun}
                  />
                  
                  <SwitchToggle
                    isOn={preferences.wellness_reminders}
                    onToggle={() => updatePreference('wellness_reminders', !preferences.wellness_reminders)}
                    label="Wellness Reminders"
                    icon={Target}
                  />
                  
                  <SwitchToggle
                    isOn={preferences.weekly_summary}
                    onToggle={() => updatePreference('weekly_summary', !preferences.weekly_summary)}
                    label="Weekly Summary"
                    icon={Calendar}
                  />
                </div>
              </motion.section>

              {/* Support Section */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Support & Legal</h2>
                <div className="space-y-3">
                  <MenuItem
                    icon={HelpCircle}
                    label="Help Center"
                    onClick={() => console.log('Navigate to Help Center')}
                  />
                  
                  <MenuItem
                    icon={Shield}
                    label="Privacy Policy"
                    onClick={() => console.log('Navigate to Privacy Policy')}
                  />
                  
                  <MenuItem
                    icon={FileText}
                    label="Terms of Service"
                    onClick={() => console.log('Navigate to Terms of Service')}
                  />
                  
                  <MenuItem
                    icon={Settings}
                    label="App Settings"
                    onClick={() => console.log('Navigate to App Settings')}
                  />
                </div>
              </motion.section>

              {/* App Info */}
              <motion.div 
                className="bg-gray-100 rounded-2xl p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="text-gray-500 text-sm">
                  <p className="mb-1">Drishti App v1.0.0</p>
                  <p>Made with care for your wellbeing</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditModal && <EditProfileModal />}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
};

export default ProfileScreen;
