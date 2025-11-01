'use client';

import EmailPreferences from '../components/EmailPreferences';
import ProtectedRoute from '../components/ProtectedRoute';

const EmailSettingsPage = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <EmailPreferences />
      </div>
    </ProtectedRoute>
  );
};

export default EmailSettingsPage;
