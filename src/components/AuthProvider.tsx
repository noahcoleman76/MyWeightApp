// src/components/AuthProvider.tsx
import React, { useEffect } from 'react';
import { FirebaseAuthService } from '../lib/firebase';
import { useAuthStore } from '../state/authStore';

/**
 * AuthProvider component that initializes Firebase auth state
 * and syncs it with our Zustand store
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setUser, setInitializing } = useAuthStore();

  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');
    
    // Set up Firebase auth state listener
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
      console.log('🔥 Firebase auth state changed:', {
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        } : null
      });
      
      setUser(user);
      setInitializing(false);
    });

    // Cleanup listener on component unmount
    return unsubscribe;
  }, [setUser, setInitializing]);

  return <>{children}</>;
};