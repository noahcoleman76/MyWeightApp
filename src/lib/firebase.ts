// src/lib/firebase.ts
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

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