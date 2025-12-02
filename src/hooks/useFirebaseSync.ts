import { useEffect } from 'react';
import { useAuthStore } from '../state/authStore';
import { useLogStore } from '../state/logStore';

/**
 * Hook to automatically sync logs with Firebase when user logs in
 */
export const useFirebaseSync = () => {
  const { user, isLoggedIn } = useAuthStore();
  const { syncWithFirebase, lastSyncISO } = useLogStore();

  useEffect(() => {
    if (isLoggedIn && user?.uid && !lastSyncISO) {
      console.log('🔄 Auto-syncing logs with Firebase for authenticated user...');
      
      syncWithFirebase(user.uid).catch(error => {
        console.error('❌ Auto-sync failed:', error);
      });
    }
  }, [isLoggedIn, user?.uid, lastSyncISO, syncWithFirebase]);
};