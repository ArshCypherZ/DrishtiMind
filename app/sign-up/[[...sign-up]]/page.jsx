'use client';

import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white shadow-2xl",
          }
        }}
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        afterSignInUrl="/"
        afterSignUpUrl="/"
      />
    </div>
  );
}
