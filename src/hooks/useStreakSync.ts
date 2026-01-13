/**
 * useStreakSync Hook
 * 
 * Automatically syncs streak data from Firestore to local store
 * when user is authenticated.
 */

import { useEffect } from 'react';
import { useAuthStore } from '../state/authStore';
import { useProfileStore } from '../state/profileStore';
import { FirestoreService } from '../lib/firebase';

export function useStreakSync() {
  const user = useAuthStore((s) => s.user);
  const setStreak = useProfileStore((s) => s.setStreak);
  
  useEffect(() => {
    if (!user) return;
    
    let isCancelled = false;
    
    const syncStreak = async () => {
      try {
        const userData = await FirestoreService.getUserData(user.uid);
        
        if (isCancelled) return;
        
        if (userData?.streak) {
          setStreak(userData.streak);
        }
      } catch (error) {
        console.error('❌ Failed to sync streak:', error);
      }
    };
    
    syncStreak();
    
    return () => {
      isCancelled = true;
    };
  }, [user, setStreak]);
}
