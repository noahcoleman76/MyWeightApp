import { useGoalStore } from "../state/goalStore";
import { useLogStore } from "../state/logStore";
import { useOnboardingStore } from "../state/onboardingStore";
import { useProfileStore } from "../state/profileStore";
import { FirestoreService, FirestoreUserData, LogService } from "./firebase";

export class UserDataService {

  static collectUserDataFromStores(): Omit<FirestoreUserData, 'createdAt' | 'updatedAt'> {
    const profile = useProfileStore.getState().profile;
    const goal = useGoalStore.getState();
    const onboarding = useOnboardingStore.getState();

    const rawData = {
      name: profile.name || 'User',
      gender: profile.gender || 'male',
      age: profile.age || 25,
      height: profile.height || 175,
      currentWeightKg: profile.currentWeightKg || 70,
      activityLevel: profile.activityLevel || 'light',
      startDate: profile.startDate || new Date().toISOString(),

      goalMode: goal.mode || 'maintain',

      ...(profile.email && { email: profile.email }),
      ...(profile.startingWeightKg && { startingWeightKg: profile.startingWeightKg }),
      ...(profile.weightUnit && { weightUnit: profile.weightUnit }),
      ...(profile.heightUnit && { heightUnit: profile.heightUnit }),
      ...(profile.motivation && profile.motivation.length > 0 && { motivation: profile.motivation }),
      ...(profile.concerns && profile.concerns.length > 0 && { concerns: profile.concerns }),

      ...(goal.goalWeightKg && { goalWeightKg: goal.goalWeightKg }),
      ...(goal.targetDateISO && { targetDateISO: goal.targetDateISO }),
      ...(goal.dailyTargetOverride && { dailyTargetOverride: goal.dailyTargetOverride }),

      ...(onboarding.isUploadedToFirestore && { onboardingCompletedAt: new Date().toISOString() }),
    };

    return rawData as Omit<FirestoreUserData, 'createdAt' | 'updatedAt'>;
  }

  static async uploadUserDataToFirestore(userId: string): Promise<void> {
    try {
      const userData = this.collectUserDataFromStores();
      const dataWithTimestamp = {
        ...userData,
        onboardingCompletedAt: new Date().toISOString(),
      };

      await FirestoreService.saveUserData(userId, dataWithTimestamp);

      useOnboardingStore.getState().setUploadedToFirestore(true);

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

  static async loadUserDataFromFirestore(userId: string): Promise<boolean> {
    try {
      const userData = await FirestoreService.getUserData(userId);

      if (!userData) {
        return false;
      }

      const profileStore = useProfileStore.getState();
      profileStore.setName(userData.name);
      if (userData.email) profileStore.setEmail(userData.email);
      profileStore.setGender(userData.gender);

      const birthYear = new Date().getFullYear() - userData.age;
      profileStore.setAgeFromBirthYear(birthYear);

      profileStore.setHeightCm(userData.height);
      profileStore.setCurrentWeightKg(userData.currentWeightKg);
      if (userData.startingWeightKg) profileStore.setStartingWeightKg(userData.startingWeightKg);
      profileStore.setActivity(userData.activityLevel);
      if (userData.weightUnit && userData.heightUnit) {
        profileStore.setUnits(userData.weightUnit, userData.heightUnit);
      }
      if (userData.motivation) profileStore.setMotivation(userData.motivation);
      if (userData.concerns) profileStore.setConcerns(userData.concerns);

      if (userData.streak) {
        profileStore.setStreak(userData.streak);
      }

      const goalStore = useGoalStore.getState();
      goalStore.setMode(userData.goalMode);
      if (userData.goalWeightKg) goalStore.setGoalWeightKg(userData.goalWeightKg);
      if (userData.targetDateISO) goalStore.setTargetDateISO(userData.targetDateISO);
      if (userData.dailyTargetOverride) goalStore.setDailyTargetOverride(userData.dailyTargetOverride);

      const onboardingStore = useOnboardingStore.getState();
      onboardingStore.setUploadedToFirestore(true);
      onboardingStore.setShouldResumeOnboarding(false);
      onboardingStore.setCurrentScreen(null);
      return true;
    } catch (error) {
      console.error('❌ Failed to load user data from Firestore:', error);
      throw error;
    }
  }

  static async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      return await FirestoreService.userDataExists(userId);
    } catch (error) {
      console.error('❌ Error checking onboarding completion:', error);
      return false;
    }
  }

  static clearLocalUserData(): void {
    useProfileStore.getState().reset();
    useGoalStore.getState().reset();
    useLogStore.getState().reset();
    useOnboardingStore.getState().resetOnboarding();
  }

  static async deleteAllUserData(userId: string): Promise<void> {
    try {
      this.clearLocalUserData();

      await FirestoreService.deleteUserData(userId);

      await LogService.deleteAllUserLogEntries(userId);
    } catch (error) {
      console.error('❌ Failed to delete all user data:', error);
      throw error;
    }
  }

  static async syncToFirestore(userId: string): Promise<void> {
    try {
      const userData = this.collectUserDataFromStores();
      await FirestoreService.updateUserData(userId, userData);

    } catch (error) {
      console.error('❌ Failed to sync data to Firestore:', error);
      throw error;
    }
  }
}