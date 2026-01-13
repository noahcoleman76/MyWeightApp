import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

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
  static async signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email.trim(), password);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  static async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email.trim(), password);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  static getCurrentUser(): AuthUser | null {
    const user = auth().currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  static onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return auth().onAuthStateChanged((user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email.trim());
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

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

  static async updateDisplayName(displayName: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No authenticated user');

      await user.updateProfile({ displayName });
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  static async deleteUser(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No authenticated user');

      await user.delete();
    } catch (error) {
      throw this.mapAuthError(error as FirebaseAuthTypes.NativeFirebaseAuthError);
    }
  }

  private static mapFirebaseUser(user: FirebaseAuthTypes.User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    };
  }

  private static mapAuthError(error: FirebaseAuthTypes.NativeFirebaseAuthError): AuthError {
    let message = error.message;

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

export interface StreakData {
  current: number;
  longest: number;
  lastLoggedDateISO: string;
  updatedAt: string;
}

export interface FirestoreUserData {
  name: string;
  email?: string;
  gender: "male" | "female";
  age: number;
  height: number;
  currentWeightKg: number;
  startingWeightKg?: number;
  activityLevel: "sedentary" | "light" | "moderate" | "high";
  startDate: string;
  weightUnit?: "lb" | "kg";
  heightUnit?: "in" | "cm";
  motivation?: string[];
  concerns?: string[];

  goalMode: "lose" | "gain" | "maintain";
  goalWeightKg?: number;
  targetDateISO?: string;
  dailyTargetOverride?: number;

  streak?: StreakData;

  createdAt: string;
  updatedAt: string;
  onboardingCompletedAt?: string;
}

export interface FirestoreLogEntry {
  id: string;
  dateISO: string;
  calories?: number;
  weightKg?: number;
  notes?: string;
  createdAtISO: string;
  updatedAtISO: string;
  userId: string;
}

export class LogService {
  private static readonly LOGS_COLLECTION = 'logs';

  static async addLogEntry(userId: string, logEntry: Omit<FirestoreLogEntry, 'id' | 'userId' | 'createdAtISO' | 'updatedAtISO'>): Promise<string> {
    try {
      const now = new Date().toISOString();

      const cleanedEntry = Object.fromEntries(
        Object.entries(logEntry).filter(([_, value]) => value !== undefined)
      );

      const dataToSave = {
        ...cleanedEntry,
        userId,
        createdAtISO: now,
        updatedAtISO: now,
      };

      const docRef = await firestore()
        .collection(this.LOGS_COLLECTION)
        .add(dataToSave);

      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding log entry to Firestore:', error);
      throw new Error('Failed to save log entry');
    }
  }

  static async getUserLogEntries(userId: string): Promise<FirestoreLogEntry[]> {
    try {
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

      logEntries.sort((a, b) => {
        const dateCompare = b.dateISO.localeCompare(a.dateISO);
        if (dateCompare !== 0) return dateCompare;
        return (b.createdAtISO || '').localeCompare(a.createdAtISO || '');
      });

      return logEntries;
    } catch (error) {
      console.error('❌ Error getting log entries from Firestore:', error);
      throw new Error('Failed to fetch log entries');
    }
  }

  static async updateLogEntry(logId: string, userId: string, updates: Partial<Omit<FirestoreLogEntry, 'id' | 'userId' | 'createdAtISO' | 'updatedAtISO'>>): Promise<void> {
    try {
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      const updateData = {
        ...cleanedUpdates,
        updatedAtISO: new Date().toISOString(),
      };

      await firestore()
        .collection(this.LOGS_COLLECTION)
        .doc(logId)
        .update(updateData);

    } catch (error) {
      console.error('❌ Error updating log entry in Firestore:', error);
      throw new Error('Failed to update log entry');
    }
  }

  static async deleteLogEntry(logId: string, userId: string): Promise<void> {
    try {
      await firestore()
        .collection(this.LOGS_COLLECTION)
        .doc(logId)
        .delete();

    } catch (error) {
      console.error('❌ Error deleting log entry from Firestore:', error);
      throw new Error('Failed to delete log entry');
    }
  }

  static async getLogEntriesInDateRange(userId: string, startDateISO: string, endDateISO: string): Promise<FirestoreLogEntry[]> {
    try {
      const snapshot = await firestore()
        .collection(this.LOGS_COLLECTION)
        .where('userId', '==', userId)
        .get();

      const logEntries: FirestoreLogEntry[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<FirestoreLogEntry, 'id'>;
        if (data.dateISO >= startDateISO && data.dateISO <= endDateISO) {
          logEntries.push({
            id: doc.id,
            ...data
          } as FirestoreLogEntry);
        }
      });

      logEntries.sort((a, b) => {
        const dateCompare = b.dateISO.localeCompare(a.dateISO);
        if (dateCompare !== 0) return dateCompare;
        return (b.createdAtISO || '').localeCompare(a.createdAtISO || '');
      });
      return logEntries;
    } catch (error) {
      console.error('❌ Error getting log entries in date range:', error);
      throw new Error('Failed to fetch log entries for date range');
    }
  }

  static async deleteAllUserLogEntries(userId: string): Promise<void> {
    try {
      const snapshot = await firestore()
        .collection(this.LOGS_COLLECTION)
        .where('userId', '==', userId)
        .get();

      const batch = firestore().batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

    } catch (error) {
      console.error('❌ Error deleting all user log entries:', error);
      throw new Error('Failed to delete all log entries');
    }
  }
}

export class FirestoreService {
  private static readonly USERS_COLLECTION = 'users';

  static async saveUserData(userId: string, userData: Omit<FirestoreUserData, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const now = new Date().toISOString();

      const cleanedUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );

      const dataToSave: FirestoreUserData = {
        ...cleanedUserData,
        updatedAt: now,
        createdAt: userData.onboardingCompletedAt || now, // Use onboardingCompletedAt as createdAt if available
      } as FirestoreUserData;

      await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .set(dataToSave, { merge: true });

    } catch (error) {
      console.error('❌ Error saving user data to Firestore:', error);
      throw new Error('Failed to save user data');
    }
  }

  static async getUserData(userId: string): Promise<FirestoreUserData | null> {
    try {
      const doc = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      if (doc.exists()) {
        const data = doc.data() as FirestoreUserData;
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting user data from Firestore:', error);
      throw new Error('Failed to get user data');
    }
  }

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

  static async deleteUserData(userId: string): Promise<void> {
    try {
      await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .delete();

    } catch (error) {
      console.error('❌ Error deleting user data from Firestore:', error);
      throw new Error('Failed to delete user data');
    }
  }

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

    } catch (error) {
      console.error('❌ Error updating user data in Firestore:', error);
      throw new Error('Failed to update user data');
    }
  }
}

export class StreakService {
  static initializeStreak(): StreakData {
    return {
      current: 0,
      longest: 0,
      lastLoggedDateISO: '',
      updatedAt: new Date().toISOString(),
    };
  }

  static async updateStreakOnLog(userId: string, logDateISO: string): Promise<void> {
    try {
      const userData = await FirestoreService.getUserData(userId);

      if (!userData) {
        console.error('❌ User data not found for streak update');
        throw new Error('User data not found');
      }

      const currentStreak = userData.streak || this.initializeStreak();
      const today = dayjs().format('YYYY-MM-DD');
      const lastLogged = currentStreak.lastLoggedDateISO;

      if (lastLogged === today) {
        return;
      }

      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      let newStreakValue: number;

      if (!lastLogged || lastLogged === '') {
        newStreakValue = 1;
      } else if (lastLogged === yesterday) {
        newStreakValue = currentStreak.current + 1;
      } else {
        newStreakValue = 1;
      }

      const newLongest = Math.max(currentStreak.longest, newStreakValue);

      const updatedStreak: StreakData = {
        current: newStreakValue,
        longest: newLongest,
        lastLoggedDateISO: today,
        updatedAt: new Date().toISOString(),
      };

      await FirestoreService.updateUserData(userId, { streak: updatedStreak });

    } catch (error) {
      console.error('❌ Failed to update streak:', error);
      throw error;
    }
  }
}
