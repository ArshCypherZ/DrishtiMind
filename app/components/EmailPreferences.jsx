'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Settings, Check, X, Save } from 'lucide-react';

const EmailPreferences = () => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    weekly_summary: true,
    monthly_summary: true,
    milestones: true,
    daily_reminders: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        
        // Fetch email preferences
        const prefResponse = await fetch('/api/user/email-preferences', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (prefResponse.ok) {
          const prefData = await prefResponse.json();
          if (prefData.preferences) {
            setPreferences(prefData.preferences);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(newPreferences);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      const response = await fetch('/api/user/email-preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences })
      });
      
      if (response.ok) {
        setMessage('Email preferences saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const emailOptions = [
    {
      key: 'weekly_summary',
      title: 'Weekly Wellness Summary',
      description: 'Get a detailed weekly report of your wellness journey',
      icon: '📊',
      color: 'blue'
    },
    {
      key: 'monthly_summary',
      title: 'Monthly Wellness Report',
      description: 'Comprehensive monthly analysis with deep insights',
      icon: '📈',
      color: 'purple'
    },
    {
      key: 'milestones',
      title: 'Achievement Notifications',
      description: 'Celebrate your wellness milestones and achievements',
      icon: '🏆',
      color: 'yellow'
    },
    {
      key: 'daily_reminders',
      title: 'Daily Reminders',
      description: 'Gentle reminders for daily wellness activities',
      icon: '⏰',
      color: 'green'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Preferences</h3>
            <p className="text-sm text-gray-600">Choose which emails you'd like to receive</p>
          </div>
        </div>

        <div className="space-y-4">
          {emailOptions.map((option, index) => {
            const isEnabled = preferences[option.key];
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600',
              purple: 'from-purple-500 to-purple-600',
              yellow: 'from-yellow-500 to-yellow-600',
              green: 'from-green-500 to-green-600'
            };

            return (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-xl border ${
                  isEnabled 
                    ? 'border-gray-200 bg-white shadow-sm' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[option.color]} flex items-center justify-center text-white text-xl`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold text-gray-900 ${!isEnabled ? 'opacity-60' : ''}`}>
                          {option.title}
                        </h4>
                        <p className={`text-sm ${!isEnabled ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => handleToggle(option.key)}
                      disabled={saving}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      } ${saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      whileHover={{ scale: saving ? 1 : 1.05 }}
                      whileTap={{ scale: saving ? 1 : 0.95 }}
                    >
                      <motion.div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm ${
                          isEnabled ? 'left-7' : 'left-1'
                        }`}
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {isEnabled && (
                          <Check className="w-2 h-2 text-blue-600 absolute top-1 left-1" />
                        )}
                      </motion.div>
                    </motion.button>
                  </div>
                </div>

                {isEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-100 bg-gray-50 px-6 py-3"
                  >
                    <p className="text-xs text-gray-500 flex items-center">
                      <Check className="w-3 h-3 mr-1" />
                      You'll receive {option.title.toLowerCase()} emails
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 text-sm">Privacy & Control</h4>
              <p className="text-blue-700 text-xs mt-1">
                We respect your inbox. You can change these preferences anytime and we'll never share your email address with third parties.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${
              message.includes('successfully') 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.includes('successfully') ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
          </motion.div>
        )}

        <motion.button
          onClick={savePreferences}
          disabled={saving}
          className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          whileHover={{ scale: saving ? 1 : 1.02 }}
          whileTap={{ scale: saving ? 1 : 0.98 }}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </>
          )}
        </motion.button>

        {user && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Current email:</strong> {user.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPreferences;
