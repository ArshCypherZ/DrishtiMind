'use client';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500">
          {children}
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

export default ProtectedRoute;