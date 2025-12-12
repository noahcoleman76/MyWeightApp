// src/lib/firebase.ts
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with UTC plugin
dayjs.extend(utc);

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}

export class FirebaseAuthService {
  /**
   * Sign in with email and password
   */
  static async signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email.trim(), password);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  /**
   * Create account with email and password
   */
  static async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email.trim(), password);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): AuthUser | null {
    const user = auth().currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return auth().onAuthStateChanged((user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email.trim());
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  /**
   * Sign in with Apple (creates account on first sign-in)
   */
  static async signInWithApple(): Promise<AuthUser> {
    try {
      const rawNonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const appleCred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCred.identityToken) {
        throw { code: 'auth/invalid-credential', message: 'Apple identity token missing' } as FirebaseAuthTypes.NativeFirebaseAuthError;
      }

      const credential = auth.AppleAuthProvider.credential(appleCred.identityToken, rawNonce);
      const userCredential = await auth().signInWithCredential(credential);

      const fullName = appleCred.fullName;
      if (fullName) {
        const displayName = `${fullName.givenName ?? ''} ${fullName.familyName ?? ''}`.trim();
        if (displayName) {
          await userCredential.user.updateProfile({ displayName });
        }
      }

      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  /**
   * Update user display name
   */
  static async updateDisplayName(displayName: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No authenticated user');
      
      await user.updateProfile({ displayName });
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  /**
   * Delete current user account
   */
  static async deleteUser(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No authenticated user');
      
      await user.delete();
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  /**
   * Map Firebase user to our AuthUser interface
   */
  private static mapFirebaseUser(user: FirebaseAuthTypes.User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    };
  }

  /**
   * Map Firebase auth errors to our AuthError interface
   */
  private static mapAuthError(error: FirebaseAuthTypes.NativeFirebaseAuthError): AuthError {
    let message = error.message;

    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please try again.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account already exists with this email address.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters long.';
        break;
      case 'auth/invalid-credential':
        message = 'Invalid email or password. Please check your credentials.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
      case 'auth/requires-recent-login':
        message = 'For security reasons, please sign in again before deleting your account.';
        break;
      case 'auth/user-token-expired':
        message = 'Your session has expired. Please sign in again.';
        break;
      default:
        message = 'An error occurred. Please try again.';
    }

    return {
      code: error.code,
      message,
    };
  }
}

// Input validation utilities
export class AuthValidation {
  static validateEmail(email: string): string | null {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      return 'Email is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  }

  static validatePassword(password: string): string | null {
    if (!password) {
      return 'Password is required';
    }
    
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    
    return null;
  }

  static getPasswordStrength(password: string): { score: number; feedback: string } {
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 8) score++;
    else feedback.push('Use at least 8 characters');
    
    if (/(?=.*[a-z])/.test(password)) score++;
    else feedback.push('Add lowercase letters');
    
    if (/(?=.*[A-Z])/.test(password)) score++;
    else feedback.push('Add uppercase letters');
    
    if (/(?=.*\d)/.test(password)) score++;
    else feedback.push('Add numbers');
    
    if (/(?=.*[@$!%*?&])/.test(password)) score++;
    else feedback.push('Add special characters (@$!%*?&)');
    
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthLabel = strengthLabels[Math.min(score, 4)];
    
    return {
      score,
      feedback: feedback.length > 0 ? feedback.join(', ') : `${strengthLabel} password`
    };
  }

  static validateUsername(username: string): string | null {
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      return 'Username is required';
    }
    
    if (trimmedUsername.length < 2) {
      return 'Username must be at least 2 characters long';
    }
    
    if (trimmedUsername.length > 30) {
      return 'Username must be less than 30 characters';
    }
    
    return null;
  }
}

// Streak data interface
export interface StreakData {
  current: number;              // Current consecutive days
  longest: number;              // All-time best streak
  lastLoggedDateISO: string;    // YYYY-MM-DD (last day user logged)
  updatedAt: string;            // ISO timestamp
}

// User data types for Firestore
export interface FirestoreUserData {
  // Profile data
  name: string;
  email?: string;
  gender: "male" | "female";
  age: number;
  height: number; // cm
  currentWeightKg: number;
  startingWeightKg?: number;
  activityLevel: "sedentary" | "light" | "moderate" | "high";
  startDate: string; // ISO
  weightUnit?: "lb" | "kg";
  heightUnit?: "in" | "cm";
  motivation?: string[];
  concerns?: string[];
  
  // Goal data
  goalMode: "lose" | "gain" | "maintain";
  goalWeightKg?: number;
  targetDateISO?: string;
  dailyTargetOverride?: number;
  
  // Streak data (NEW)
  streak?: StreakData;
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  onboardingCompletedAt?: string; // ISO timestamp
}

/**
 * Firebase Firestore Service for user data management
 */
// Log entry types for Firestore
export interface FirestoreLogEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  calories?: number;
  weightKg?: number;
  notes?: string;
  createdAtISO: string; // full ISO timestamp
  updatedAtISO: string; // full ISO timestamp
  userId: string; // Firebase user ID
}

/**
 * Firebase Firestore Service for log entries
 */
export class LogService {
  private static readonly LOGS_COLLECTION = 'logs';
  
  /**
   * Add a new log entry to Firestore
   */
  static async addLogEntry(userId: string, logEntry: Omit<FirestoreLogEntry, 'id' | 'userId' | 'createdAtISO' | 'updatedAtISO'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      // Filter out undefined values as Firestore doesn't support them
      const cleanedEntry = Object.fromEntries(
        Object.entries(logEntry).filter(([_, value]) => value !== undefined)
      );
      
      const dataToSave = {
        ...cleanedEntry,
        userId,
        createdAtISO: now,
        updatedAtISO: now,
      };
      
      console.log('💾 Adding log entry to Firestore:', { 
        userId, 
        dateISO: logEntry.dateISO,
        hasWeight: logEntry.weightKg !== undefined,
        hasCalories: logEntry.calories !== undefined
      });
      
      const docRef = await firestore()
        .collection(this.LOGS_COLLECTION)
        .add(dataToSave);
        
      console.log('✅ Log entry added to Firestore successfully:', { docId: docRef.id });
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding log entry to Firestore:', error);
      throw new Error('Failed to save log entry');
    }
  }
  
  /**
   * Get all log entries for a user from Firestore
   */
  static async getUserLogEntries(userId: string): Promise<FirestoreLogEntry[]> {
    try {
      console.log('📥 Fetching log entries from Firestore:', { userId });
      
      const snapshot = await firestore()
        .collection(this.LOGS_COLLECTION)
        .where('userId', '==', userId)
        .get();
      
      const logEntries: FirestoreLogEntry[] = [];
      snapshot.forEach(doc => {
        logEntries.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreLogEntry);
      });
      
      // Sort on client side instead of using Firestore orderBy to avoid composite index
      logEntries.sort((a, b) => {
        const dateCompare = b.dateISO.localeCompare(a.dateISO);
        if (dateCompare !== 0) return dateCompare;
        // For same dates, sort by creation time (newest first)
        return (b.createdAtISO || '').localeCompare(a.createdAtISO || '');
      });
      
      console.log('✅ Log entries retrieved from Firestore:', { count: logEntries.length });
      return logEntries;
    } catch (error) {
      console.error('❌ Error getting log entries from Firestore:', error);
      throw new Error('Failed to fetch log entries');
    }
  }
  
  /**
   * Update a log entry in Firestore
   */
  static async updateLogEntry(logId: string, userId: string, updates: Partial<Omit<FirestoreLogEntry, 'id' | 'userId' | 'createdAtISO' | 'updatedAtISO'>>): Promise<void> {
    try {
      // Filter out undefined values as Firestore doesn't support them
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updateData = {
        ...cleanedUpdates,
        updatedAtISO: new Date().toISOString(),
      };
      
      console.log('🔄 Updating log entry in Firestore:', { 
        logId, 
        userId,
        hasWeight: updates.weightKg !== undefined,
        hasCalories: updates.calories !== undefined
      });
      
      await firestore()
        .collection(this.LOGS_COLLECTION)
        .doc(logId)
        .update(updateData);
        
      console.log('✅ Log entry updated in Firestore successfully');
    } catch (error) {
      console.error('❌ Error updating log entry in Firestore:', error);
      throw new Error('Failed to update log entry');
    }
  }
  
  /**
   * Delete a log entry from Firestore
   */
  static async deleteLogEntry(logId: string, userId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting log entry from Firestore:', { logId, userId });
      
      await firestore()
        .collection(this.LOGS_COLLECTION)
        .doc(logId)
        .delete();
        
      console.log('✅ Log entry deleted from Firestore successfully');
    } catch (error) {
      console.error('❌ Error deleting log entry from Firestore:', error);
      throw new Error('Failed to delete log entry');
    }
  }
  
  /**
   * Get log entries for a specific date range
   */
  static async getLogEntriesInDateRange(userId: string, startDateISO: string, endDateISO: string): Promise<FirestoreLogEntry[]> {
    try {
      console.log('📅 Fetching log entries in date range:', { userId, startDateISO, endDateISO });
      
      // Get all user entries and filter on client side to avoid composite index
      const snapshot = await firestore()
        .collection(this.LOGS_COLLECTION)
        .where('userId', '==', userId)
        .get();
      
      const logEntries: FirestoreLogEntry[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<FirestoreLogEntry, 'id'>;
        // Filter by date range on client side
        if (data.dateISO >= startDateISO && data.dateISO <= endDateISO) {
          logEntries.push({
            id: doc.id,
            ...data
          } as FirestoreLogEntry);
        }
      });
      
      // Sort on client side
      logEntries.sort((a, b) => {
        const dateCompare = b.dateISO.localeCompare(a.dateISO);
        if (dateCompare !== 0) return dateCompare;
        return (b.createdAtISO || '').localeCompare(a.createdAtISO || '');
      });
      
      console.log('✅ Log entries in date range retrieved:', { count: logEntries.length });
      return logEntries;
    } catch (error) {
      console.error('❌ Error getting log entries in date range:', error);
      throw new Error('Failed to fetch log entries for date range');
    }
  }
  
  /**
   * Delete all log entries for a user (when deleting account)
   */
  static async deleteAllUserLogEntries(userId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting all log entries for user:', { userId });
      
      const snapshot = await firestore()
        .collection(this.LOGS_COLLECTION)
        .where('userId', '==', userId)
        .get();
      
      const batch = firestore().batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log('✅ All user log entries deleted from Firestore:', { deletedCount: snapshot.size });
    } catch (error) {
      console.error('❌ Error deleting all user log entries:', error);
      throw new Error('Failed to delete all log entries');
    }
  }
}

export class FirestoreService {
  private static readonly USERS_COLLECTION = 'users';
  
  /**
   * Save user data to Firestore
   */
  static async saveUserData(userId: string, userData: Omit<FirestoreUserData, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Remove any undefined values as a safety measure
      const cleanedUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );
      
      const dataToSave: FirestoreUserData = {
        ...cleanedUserData,
        updatedAt: now,
        createdAt: userData.onboardingCompletedAt || now, // Use onboardingCompletedAt as createdAt if available
      } as FirestoreUserData;
      
      console.log('💾 Saving to Firestore:', { 
        userId, 
        fieldsCount: Object.keys(dataToSave).length,
        hasUndefined: Object.values(dataToSave).some(v => v === undefined)
      });
      
      await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .set(dataToSave, { merge: true });
        
      console.log('✅ User data saved to Firestore successfully');
    } catch (error) {
      console.error('❌ Error saving user data to Firestore:', error);
      throw new Error('Failed to save user data');
    }
  }
  
  /**
   * Get user data from Firestore
   */
  static async getUserData(userId: string): Promise<FirestoreUserData | null> {
    try {
      const doc = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();
        
      if (doc.exists()) {
        const data = doc.data() as FirestoreUserData;
        console.log('✅ User data retrieved from Firestore successfully');
        return data;
      } else {
        console.log('ℹ️ No user data found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting user data from Firestore:', error);
      throw new Error('Failed to get user data');
    }
  }
  
  /**
   * Check if user data exists in Firestore
   */
  static async userDataExists(userId: string): Promise<boolean> {
    try {
      const doc = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();
        
      return doc.exists();
    } catch (error) {
      console.error('❌ Error checking if user data exists:', error);
      return false;
    }
  }
  
  /**
   * Delete user data from Firestore
   */
  static async deleteUserData(userId: string): Promise<void> {
    try {
      await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .delete();
        
      console.log('✅ User data deleted from Firestore successfully');
    } catch (error) {
      console.error('❌ Error deleting user data from Firestore:', error);
      throw new Error('Failed to delete user data');
    }
  }
  
  /**
   * Update specific fields in user data
   */
  static async updateUserData(userId: string, updates: Partial<Omit<FirestoreUserData, 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .update(updateData);
        
      console.log('✅ User data updated in Firestore successfully');
    } catch (error) {
      console.error('❌ Error updating user data in Firestore:', error);
      throw new Error('Failed to update user data');
    }
  }
}

/**
 * Firebase Streak Service
 * Handles streak calculations and updates
 */
export class StreakService {
  /**
   * Initialize streak data for new users
   */
  static initializeStreak(): StreakData {
    return {
      current: 0,
      longest: 0,
      lastLoggedDateISO: '',
      updatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Update user's streak when they create a log entry
   * Simple calculation: consecutive days only, no grace period
   */
  static async updateStreakOnLog(userId: string, logDateISO: string): Promise<void> {
    try {
      console.log('🔥 Updating streak for user:', { userId, logDateISO });
      
      // Get current user data
      const userData = await FirestoreService.getUserData(userId);
      
      if (!userData) {
        console.error('❌ User data not found for streak update');
        throw new Error('User data not found');
      }
      
      const currentStreak = userData.streak || this.initializeStreak();
      const today = dayjs().format('YYYY-MM-DD');
      const lastLogged = currentStreak.lastLoggedDateISO;
      
      // Don't update if already logged today
      if (lastLogged === today) {
        console.log('ℹ️ Already logged today, streak unchanged');
        return;
      }
      
      // Calculate new streak value
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      let newStreakValue: number;
      
      if (!lastLogged || lastLogged === '') {
        // First log ever
        newStreakValue = 1;
      } else if (lastLogged === yesterday) {
        // Logged yesterday - continue streak
        newStreakValue = currentStreak.current + 1;
      } else {
        // Gap > 1 day - start new streak
        newStreakValue = 1;
      }
      
      // Update longest streak if needed
      const newLongest = Math.max(currentStreak.longest, newStreakValue);
      
      // Update streak data in Firestore
      const updatedStreak: StreakData = {
        current: newStreakValue,
        longest: newLongest,
        lastLoggedDateISO: today,
        updatedAt: new Date().toISOString(),
      };
      
      await FirestoreService.updateUserData(userId, { streak: updatedStreak });
      
      console.log('✅ Streak updated:', { current: newStreakValue, longest: newLongest });
    } catch (error) {
      console.error('❌ Failed to update streak:', error);
      throw error;
    }
  }
  

}
