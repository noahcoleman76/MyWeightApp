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
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {      
      setUser(user);
      setInitializing(false);
    });

    return unsubscribe;
  }, [setUser, setInitializing]);

  return <>{children}</>;
};