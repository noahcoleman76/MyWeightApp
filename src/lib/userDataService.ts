import { useGoalStore } from "../state/goalStore";
import { useOnboardingStore } from "../state/onboardingStore";
import { useProfileStore } from "../state/profileStore";
import { FirestoreService, FirestoreUserData } from "./firebase";

/**
 * User Data Service
 * Handles synchronization between local stores and Firestore
 */
export class UserDataService {
  /**
   * Helper function to remove undefined values from an object
   */
  private static cleanUndefinedValues<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key as keyof T] = value;
      }
    }
    return cleaned;
  }

  /**
   * Collect all user data from local stores and prepare for Firestore
   */
  static collectUserDataFromStores(): Omit<FirestoreUserData, 'createdAt' | 'updatedAt'> {
    const profile = useProfileStore.getState().profile;
    const goal = useGoalStore.getState();
    const onboarding = useOnboardingStore.getState();
    
    console.log('📊 Collecting user data from stores:', {
      profile: { ...profile, email: profile.email ? 'SET' : 'UNDEFINED' },
      goal: { mode: goal.mode, goalWeightKg: goal.goalWeightKg },
      onboarding: { isUploadedToFirestore: onboarding.isUploadedToFirestore }
    });
    
    const rawData = {
      // Profile data (required fields)
      name: profile.name || 'User',
      gender: profile.gender || 'male',
      age: profile.age || 25,
      height: profile.height || 175,
      currentWeightKg: profile.currentWeightKg || 70,
      activityLevel: profile.activityLevel || 'light',
      startDate: profile.startDate || new Date().toISOString(),
      
      // Goal data (required field)
      goalMode: goal.mode || 'maintain',
      
      // Optional profile fields
      ...(profile.email && { email: profile.email }),
      ...(profile.startingWeightKg && { startingWeightKg: profile.startingWeightKg }),
      ...(profile.weightUnit && { weightUnit: profile.weightUnit }),
      ...(profile.heightUnit && { heightUnit: profile.heightUnit }),
      ...(profile.motivation && profile.motivation.length > 0 && { motivation: profile.motivation }),
      ...(profile.concerns && profile.concerns.length > 0 && { concerns: profile.concerns }),
      
      // Optional goal fields
      ...(goal.goalWeightKg && { goalWeightKg: goal.goalWeightKg }),
      ...(goal.targetDateISO && { targetDateISO: goal.targetDateISO }),
      ...(goal.dailyTargetOverride && { dailyTargetOverride: goal.dailyTargetOverride }),
      
      // Onboarding completion timestamp
      ...(onboarding.isUploadedToFirestore && { onboardingCompletedAt: new Date().toISOString() }),
    };
    
    console.log('📤 Final data to save (cleaned):', rawData);
    return rawData as Omit<FirestoreUserData, 'createdAt' | 'updatedAt'>;
  }
  
  /**
   * Upload all user data to Firestore from local stores
   */
  static async uploadUserDataToFirestore(userId: string): Promise<void> {
    try {
      console.log('🔄 Uploading user data to Firestore for user:', userId);
      
      const userData = this.collectUserDataFromStores();
      const dataWithTimestamp = {
        ...userData,
        onboardingCompletedAt: new Date().toISOString(),
      };
      
      console.log('📋 Data prepared for Firestore:', {
        fieldsCount: Object.keys(dataWithTimestamp).length,
        hasUndefined: Object.values(dataWithTimestamp).some(v => v === undefined),
        requiredFields: {
          name: dataWithTimestamp.name,
          gender: dataWithTimestamp.gender,
          goalMode: dataWithTimestamp.goalMode
        }
      });
      
      await FirestoreService.saveUserData(userId, dataWithTimestamp);
      
      // Mark as uploaded in onboarding store
      useOnboardingStore.getState().setUploadedToFirestore(true);
      
      console.log('✅ User data uploaded to Firestore successfully');
    } catch (error) {
      console.error('❌ Failed to upload user data to Firestore:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw new Error('Failed to save user data');
    }
  }
  
  /**
   * Load user data from Firestore and populate local stores
   */
  static async loadUserDataFromFirestore(userId: string): Promise<boolean> {
    try {
      console.log('🔄 Loading user data from Firestore...');
      
      const userData = await FirestoreService.getUserData(userId);
      
      if (!userData) {
        console.log('ℹ️ No user data found in Firestore');
        return false;
      }
      
      // Populate profile store
      const profileStore = useProfileStore.getState();
      profileStore.setName(userData.name);
      if (userData.email) profileStore.setEmail(userData.email);
      profileStore.setGender(userData.gender);
      profileStore.setAgeFromBirthYear(new Date().getFullYear() - userData.age);
      profileStore.setHeightCm(userData.height);
      profileStore.setCurrentWeightKg(userData.currentWeightKg);
      if (userData.startingWeightKg) profileStore.setStartingWeightKg(userData.startingWeightKg);
      profileStore.setActivity(userData.activityLevel);
      if (userData.weightUnit && userData.heightUnit) {
        profileStore.setUnits(userData.weightUnit, userData.heightUnit);
      }
      if (userData.motivation) profileStore.setMotivation(userData.motivation);
      if (userData.concerns) profileStore.setConcerns(userData.concerns);
      
      // Populate goal store
      const goalStore = useGoalStore.getState();
      goalStore.setMode(userData.goalMode);
      if (userData.goalWeightKg) goalStore.setGoalWeightKg(userData.goalWeightKg);
      if (userData.targetDateISO) goalStore.setTargetDateISO(userData.targetDateISO);
      if (userData.dailyTargetOverride) goalStore.setDailyTargetOverride(userData.dailyTargetOverride);
      
      // Update onboarding store
      const onboardingStore = useOnboardingStore.getState();
      onboardingStore.setUploadedToFirestore(true);
      onboardingStore.setShouldResumeOnboarding(false);
      onboardingStore.setCurrentScreen(null);
      
      console.log('✅ User data loaded from Firestore and populated in stores');
      return true;
    } catch (error) {
      console.error('❌ Failed to load user data from Firestore:', error);
      throw error;
    }
  }
  
  /**
   * Check if user has completed onboarding (data exists in Firestore)
   */
  static async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      return await FirestoreService.userDataExists(userId);
    } catch (error) {
      console.error('❌ Error checking onboarding completion:', error);
      return false;
    }
  }
  
  /**
   * Clear all local user data and reset stores
   */
  static clearLocalUserData(): void {
    console.log('🔄 Clearing local user data...');
    
    // Reset all stores
    useProfileStore.getState().reset();
    useGoalStore.getState().reset();
    useOnboardingStore.getState().resetOnboarding();
    
    console.log('✅ Local user data cleared');
  }
  
  /**
   * Delete all user data from both local storage and Firestore
   */
  static async deleteAllUserData(userId: string): Promise<void> {
    try {
      console.log('🔄 Deleting all user data...');
      
      // Clear local data first
      this.clearLocalUserData();
      
      // Delete from Firestore
      await FirestoreService.deleteUserData(userId);
      
      console.log('✅ All user data deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete all user data:', error);
      throw error;
    }
  }
  
  /**
   * Sync local data to Firestore (useful for periodic updates)
   */
  static async syncToFirestore(userId: string): Promise<void> {
    try {
      console.log('🔄 Syncing local data to Firestore...');
      
      const userData = this.collectUserDataFromStores();
      await FirestoreService.updateUserData(userId, userData);
      
      console.log('✅ Data synced to Firestore successfully');
    } catch (error) {
      console.error('❌ Failed to sync data to Firestore:', error);
      throw error;
    }
  }
}