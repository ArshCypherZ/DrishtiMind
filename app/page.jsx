'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import HomeScreen from './home/page.jsx';
import PerspectiveScreen from './perspective/page.jsx';
import ProfileScreen from './profile/page.jsx';
import NotificationsScreen from './notification/page.jsx';
import JournalScreen from './journal/page.jsx';
import HistoryScreen from './history/page.jsx';
import DashboardScreen from './dashboard/page.jsx';

const AppContent = () => {
  const { state } = useApp();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Enable authentication check
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const renderScreen = () => {
    switch (state.currentView) {
      case 'home':
        return <HomeScreen />;
      case 'perspective':
        return <PerspectiveScreen />;
      case 'notifications':
        return <NotificationsScreen />
      case 'profile':
        return <ProfileScreen />
      case 'journal':
        return <JournalScreen />
      case 'history':
        return <HistoryScreen />
      case 'dashboard':
        return <DashboardScreen />
      default:
        return <HomeScreen />;
    }
  };

  const showBackButton = state.currentView !== 'home';

  return (
    <div className="min-h-screen relative">
      <Header 
        showBackButton={showBackButton}
        onBackClick={() => {
          // Add custom back navigation logic here if needed
        }}
      />

      {/* Main Content */}
      {renderScreen()}

      <Navigation />
    </div>
  );
};

export default function Home() {
  return (
    <ProtectedRoute>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ProtectedRoute>
  );
}
