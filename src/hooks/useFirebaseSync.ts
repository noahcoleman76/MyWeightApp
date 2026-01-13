import { useEffect } from 'react';
import { useAuthStore } from '../state/authStore';
import { useLogStore } from '../state/logStore';

export const useFirebaseSync = () => {
  const { user, isLoggedIn } = useAuthStore();
  const { syncWithFirebase, lastSyncISO } = useLogStore();

  useEffect(() => {
    if (isLoggedIn && user?.uid && !lastSyncISO) {      
      syncWithFirebase(user.uid).catch(error => {
        console.error('❌ Auto-sync failed:', error);
      });
    }
  }, [isLoggedIn, user?.uid, lastSyncISO, syncWithFirebase]);
};
