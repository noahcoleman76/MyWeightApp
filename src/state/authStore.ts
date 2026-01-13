import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";
import { AuthUser, AuthError, FirebaseAuthService } from "../lib/firebase";

type AuthState = {
  user: AuthUser | null;
  isLoggedIn: boolean;

  isLoading: boolean;
  isInitializing: boolean;

  loginError: AuthError | null;
  signupError: AuthError | null;
  generalError: AuthError | null;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInWithApple: () => Promise<void>;

  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearLoginError: () => void;
  clearSignupError: () => void;
  clearGeneralError: () => void;
  clearAllErrors: () => void;
  setInitializing: (initializing: boolean) => void;

  setLoggedIn: (v: boolean) => void;

  error: AuthError | null;
  setError: (error: AuthError | null) => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      isInitializing: true,
      loginError: null,
      signupError: null,
      generalError: null,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, loginError: null });

        try {
          const user = await FirebaseAuthService.signInWithEmailAndPassword(email, password);
          set({
            user,
            isLoggedIn: true,
            isLoading: false,
            loginError: null,
            error: null
          });

        } catch (error) {
          console.log('❌ Sign in failed:', error);
          const authError = error as AuthError;
          set({
            isLoading: false,
            loginError: authError,
            error: authError,
            user: null,
            isLoggedIn: false
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, username?: string) => {
        set({ isLoading: true, signupError: null });

        try {
          const user = await FirebaseAuthService.createUserWithEmailAndPassword(email, password);

          if (username) {
            await FirebaseAuthService.updateDisplayName(username);
            const updatedUser = FirebaseAuthService.getCurrentUser();
            if (updatedUser) {
              set({
                user: updatedUser,
                isLoggedIn: true,
                isLoading: false,
                signupError: null,
                error: null
              });
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

        } catch (error) {
          console.log('❌ Sign up failed:', error);
          const authError = error as AuthError;
          set({
            isLoading: false,
            signupError: authError,
            error: authError,
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
            error: authError
          });
          throw error;
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true, generalError: null });

        try {
          await FirebaseAuthService.deleteUser();
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
            error: authError
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
            error: authError
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
            error: authError
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

      setUser: (user: AuthUser | null) => {
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

      setError: (error: AuthError | null) => set({ error }),
      clearError: () => set({ error: null, loginError: null, signupError: null, generalError: null }),

      setLoggedIn: (isLoggedIn: boolean) => set({
        isLoggedIn,
        user: isLoggedIn ? get().user : null
      }),
    }),
    {
      name: "authStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 2,
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);