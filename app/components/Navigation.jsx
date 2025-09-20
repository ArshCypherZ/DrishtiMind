'use client';

import { Home, Edit3, Bell, Settings, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const navigationItems = [
  { icon: Home, key: 'home', label: 'Home' },
  { icon: BookOpen, key: 'journal', label: 'Journal' },
  { icon: Edit3, key: 'perspective', label: 'Perspective' },
  { icon: Bell, key: 'notifications', label: 'Notifications' },
  { icon: Settings, key: 'profile', label: 'Profile' }
];

const Navigation = () => {
  const { state, setCurrentView } = useApp();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-lg">
      <div className="flex justify-around py-2 px-2 max-w-md mx-auto">
        {navigationItems.map(({ icon: Icon, key, label }) => {
          const isActive = state.currentView === key;
          
          return (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 min-w-0 ${
                isActive 
                  ? 'bg-blue-100 text-blue-600 scale-105' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-white/90" />
    </div>
  );
};

export default Navigation;
