import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <AuthProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
