import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";
import { AuthUser, AuthError, FirebaseAuthService } from "../lib/firebase";

type AuthState = {
  // User state
  user: AuthUser | null;
  isLoggedIn: boolean;
  
  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  
  // Separate error states for different screens
  loginError: AuthError | null;
  signupError: AuthError | null;
  generalError: AuthError | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  
  // State management
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearLoginError: () => void;
  clearSignupError: () => void;
  clearGeneralError: () => void;
  clearAllErrors: () => void;
  setInitializing: (initializing: boolean) => void;
  
  // Legacy support
  setLoggedIn: (v: boolean) => void;
  
  // Legacy error support (for backward compatibility)
  error: AuthError | null;
  setError: (error: AuthError | null) => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoggedIn: false,
      isLoading: false,
      isInitializing: true,
      loginError: null,
      signupError: null,
      generalError: null,
      error: null, // Legacy support
      
      // Actions
      signIn: async (email: string, password: string) => {
        console.log('🔑 Starting sign in process...', { email });
        set({ isLoading: true, loginError: null });
        
        try {
          const user = await FirebaseAuthService.signInWithEmailAndPassword(email, password);
          console.log('✅ Sign in successful:', { 
            uid: user.uid, 
            email: user.email,
            displayName: user.displayName 
          });
          
          set({ 
            user, 
            isLoggedIn: true, 
            isLoading: false, 
            loginError: null,
            error: null 
          });
          
          console.log('📱 Auth store updated, isLoggedIn: true');
        } catch (error) {
          console.log('❌ Sign in failed:', error);
          const authError = error as AuthError;
          set({ 
            isLoading: false, 
            loginError: authError,
            error: authError, // Legacy support
            user: null,
            isLoggedIn: false 
          });
          throw error;
        }
      },
      
      signUp: async (email: string, password: string, username?: string) => {
        console.log('📝 Starting sign up process...', { email, username });
        set({ isLoading: true, signupError: null });
        
        try {
          const user = await FirebaseAuthService.createUserWithEmailAndPassword(email, password);
          console.log('✅ Sign up successful:', { 
            uid: user.uid, 
            email: user.email 
          });
          
          // Update display name if username provided
          if (username) {
            console.log('👤 Updating display name...', { username });
            await FirebaseAuthService.updateDisplayName(username);
            // Refresh user data to include the display name
            const updatedUser = FirebaseAuthService.getCurrentUser();
            if (updatedUser) {
              console.log('✅ Display name updated:', { displayName: updatedUser.displayName });
              set({ 
                user: updatedUser, 
                isLoggedIn: true, 
                isLoading: false, 
                signupError: null,
                error: null 
              });
              console.log('📱 Auth store updated after signup, isLoggedIn: true');
              return;
            }
          }
          
          set({ 
            user, 
            isLoggedIn: true, 
            isLoading: false, 
            signupError: null,
            error: null 
          });
          
          console.log('📱 Auth store updated after signup, isLoggedIn: true');
        } catch (error) {
          console.log('❌ Sign up failed:', error);
          const authError = error as AuthError;
          set({ 
            isLoading: false, 
            signupError: authError,
            error: authError, // Legacy support
            user: null,
            isLoggedIn: false 
          });
          throw error;
        }
      },
      
      signOut: async () => {
        set({ isLoading: true, generalError: null });
        
        try {
          await FirebaseAuthService.signOut();
          set({ 
            user: null, 
            isLoggedIn: false, 
            isLoading: false, 
            generalError: null,
            loginError: null,
            signupError: null,
            error: null 
          });
        } catch (error) {
          const authError = error as AuthError;
          set({ 
            isLoading: false, 
            generalError: authError,
            error: authError // Legacy support
          });
          throw error;
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true, generalError: null });
        
        try {
          await FirebaseAuthService.deleteUser();
          // After successful deletion, clear all user data
          set({ 
            user: null, 
            isLoggedIn: false, 
            isLoading: false, 
            generalError: null,
            loginError: null,
            signupError: null,
            error: null 
          });
        } catch (error) {
          const authError = error as AuthError;
          set({ 
            isLoading: false, 
            generalError: authError,
            error: authError // Legacy support
          });
          throw error;
        }
      },
      
      updateDisplayName: async (displayName: string) => {
        set({ isLoading: true, generalError: null });
        
        try {
          await FirebaseAuthService.updateDisplayName(displayName);
          const updatedUser = FirebaseAuthService.getCurrentUser();
          set({ 
            user: updatedUser, 
            isLoading: false, 
            generalError: null,
            error: null 
          });
        } catch (error) {
          const authError = error as AuthError;
          set({ 
            isLoading: false, 
            generalError: authError,
            error: authError // Legacy support
          });
          throw error;
        }
      },
      
      sendPasswordReset: async (email: string) => {
        set({ isLoading: true, generalError: null });
        
        try {
          await FirebaseAuthService.sendPasswordResetEmail(email);
          set({ isLoading: false, generalError: null, error: null });
        } catch (error) {
          const authError = error as AuthError;
          set({ 
            isLoading: false, 
            generalError: authError,
            error: authError // Legacy support
          });
          throw error;
        }
      },

      signInWithApple: async () => {
        set({ isLoading: true, generalError: null, loginError: null, signupError: null });
        try {
          const user = await FirebaseAuthService.signInWithApple();
          set({ user, isLoggedIn: true, isLoading: false });
        } catch (error) {
          const authError = error as AuthError;
          set({ isLoading: false, generalError: authError, loginError: authError, error: authError });
          throw error;
        }
      },
      
      // State management
      setUser: (user: AuthUser | null) => {
        console.log('👤 setUser called:', {
          user: user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          } : null,
          willSetLoggedIn: !!user
        });
        
        set({ 
          user, 
          isLoggedIn: !!user 
        });
      },
      
      setLoading: (isLoading: boolean) => set({ isLoading }),
      
      clearLoginError: () => set({ loginError: null }),
      clearSignupError: () => set({ signupError: null }),
      clearGeneralError: () => set({ generalError: null }),
      clearAllErrors: () => set({ 
        loginError: null, 
        signupError: null, 
        generalError: null, 
        error: null 
      }),
      
      setInitializing: (isInitializing: boolean) => set({ isInitializing }),
      
      // Legacy support
      setError: (error: AuthError | null) => set({ error }),
      clearError: () => set({ error: null, loginError: null, signupError: null, generalError: null }),
      
      setLoggedIn: (isLoggedIn: boolean) => set({ 
        isLoggedIn,
        // If setting logged in to false, also clear user
        user: isLoggedIn ? get().user : null
      }),
    }),
    {
      name: "authStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 2,
      // Only persist essential data
      partialize: (state) => ({ 
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);