import dayjs from "dayjs";
import { nanoid } from "nanoid/non-secure";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LogService } from "../lib/firebase";
import { getItem, removeItem, setItem } from "../lib/mmkv";

export interface LogEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  calories?: number;
  weightKg?: number;
  notes?: string;
  createdAtISO?: string; // full ISO timestamp
  updatedAtISO?: string; // full ISO timestamp
  synced?: boolean; // whether this entry is synced with Firebase
}

type LogStore = {
  reset: any;
  logs: LogEntry[];
  
  // Firebase sync state
  isLoading: boolean;
  lastSyncISO?: string;
  
  // Local actions (will sync to Firebase)
  add: (e: Omit<LogEntry, "id">, userId?: string) => Promise<void>;
  update: (id: string, patch: Partial<LogEntry>, userId?: string) => Promise<void>;
  remove: (id: string, userId?: string) => Promise<void>;
  
  // Firebase sync actions
  syncWithFirebase: (userId: string) => Promise<void>;
  loadFromFirebase: (userId: string) => Promise<void>;
  syncPendingEntries: (userId: string) => Promise<void>;
  
  // Local-only actions (for offline support)
  addLocal: (e: Omit<LogEntry, "id">) => void;
  updateLocal: (id: string, patch: Partial<LogEntry>) => void;
  removeLocal: (id: string) => void;
  
  // Utility methods
  dailyTotals: (dateISO: string) => { calories: number; weightKg?: number };
  avgDailyDeltaKcalLast14: (target: number) => number; // actual-target average
  streak: () => number; // consecutive days with any log, ending today
  
  // State management
  setLoading: (loading: boolean) => void;
};

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      logs: [],
      isLoading: false,
      lastSyncISO: undefined,
      
      // Firebase-integrated actions
      add: async (e, userId) => {
        const now = dayjs().toISOString();
        const tempId = `temp_${nanoid(8)}`; // Use temp prefix to avoid conflicts
        const newEntry: LogEntry = {
          id: tempId,
          createdAtISO: now,
          updatedAtISO: now,
          synced: false,
          ...e,
        };
        
        // Add to local state immediately
        set((s) => ({
          logs: [...s.logs, newEntry].sort((a, b) => {
            // Sort by date (newest first), then by creation time for same dates
            const dateCompare = b.dateISO.localeCompare(a.dateISO);
            if (dateCompare !== 0) return dateCompare;
            return (b.createdAtISO || '').localeCompare(a.createdAtISO || '');
          }),
        }));
        
        // Sync to Firebase if userId provided
        if (userId) {
          try {
            console.log('🔄 Syncing new entry to Firebase...', { 
              tempId: newEntry.id,
              dateISO: newEntry.dateISO,
              hasCalories: newEntry.calories !== undefined,
              hasWeight: newEntry.weightKg !== undefined
            });
            
            const firebaseId = await LogService.addLogEntry(userId, {
              dateISO: newEntry.dateISO,
              calories: newEntry.calories,
              weightKg: newEntry.weightKg,
              notes: newEntry.notes,
            });
            
            // Update local entry with Firebase ID and mark as synced
            set((s) => ({
              logs: s.logs.map(l => 
                l.id === tempId 
                  ? { ...l, id: firebaseId, synced: true }
                  : l
              ),
            }));
            
            console.log('✅ Entry synced to Firebase successfully', { 
              tempId, 
              firebaseId 
            });
          } catch (error) {
            console.error('❌ Failed to sync entry to Firebase:', error);
            // Entry remains in local state but marked as not synced
            // Could implement retry logic here
          }
        }
      },
      
      update: async (id, patch, userId) => {
        const now = dayjs().toISOString();
        const updateData = { ...patch, updatedAtISO: now, synced: false };
        
        // Update local state immediately
        set((s) => ({
          logs: s.logs.map((l) => (l.id === id ? { ...l, ...updateData } : l)),
        }));
        
        // Sync to Firebase if userId provided
        if (userId) {
          try {
            console.log('🔄 Syncing updated entry to Firebase...', { entryId: id });
            
            await LogService.updateLogEntry(id, userId, patch);
            
            // Mark as synced
            set((s) => ({
              logs: s.logs.map(l => 
                l.id === id 
                  ? { ...l, synced: true }
                  : l
              ),
            }));
            
            console.log('✅ Entry update synced to Firebase successfully');
          } catch (error) {
            console.error('❌ Failed to sync entry update to Firebase:', error);
            // Entry remains updated locally but marked as not synced
          }
        }
      },
      
      remove: async (id, userId) => {
        // Remove from local state immediately
        set((s) => ({ logs: s.logs.filter((l) => l.id !== id) }));
        
        // Remove from Firebase if userId provided
        if (userId) {
          try {
            console.log('🔄 Removing entry from Firebase...', { entryId: id });
            
            await LogService.deleteLogEntry(id, userId);
            
            console.log('✅ Entry removed from Firebase successfully');
          } catch (error) {
            console.error('❌ Failed to remove entry from Firebase:', error);
            // Entry is already removed from local state
            // Could implement a "pending deletion" queue here if needed
          }
        }
      },
      
      // Firebase sync methods
      syncWithFirebase: async (userId: string) => {
        set({ isLoading: true });
        
        try {
          console.log('🔄 Starting Firebase sync...', { userId });
          
          // Get current local logs
          const currentLogs = get().logs;
          
          // Get all entries from Firebase
          const firebaseEntries = await LogService.getUserLogEntries(userId);
          
          // Convert Firebase entries to local format
          const firebaseLogsConverted: LogEntry[] = firebaseEntries.map(entry => ({
            id: entry.id,
            dateISO: entry.dateISO,
            calories: entry.calories,
            weightKg: entry.weightKg,
            notes: entry.notes,
            createdAtISO: entry.createdAtISO,
            updatedAtISO: entry.updatedAtISO,
            synced: true,
          }));
          
          // Create a map of Firebase entries by ID for quick lookup
          const firebaseLogsById = new Map(firebaseLogsConverted.map(log => [log.id, log]));
          
          // Keep local entries that are not synced yet, update synced ones with Firebase data
          const mergedLogs: LogEntry[] = [];
          
          // First, add all Firebase entries (these are the source of truth for synced data)
          mergedLogs.push(...firebaseLogsConverted);
          
          // Then, add any local entries that haven't been synced yet (and aren't already in Firebase)
          for (const localLog of currentLogs) {
            if (!localLog.synced && !firebaseLogsById.has(localLog.id)) {
              mergedLogs.push(localLog);
            }
          }
          
          // Sort by date (newest first) and then by creation time for same dates
          const sortedLogs = mergedLogs.sort((a, b) => {
            const dateCompare = b.dateISO.localeCompare(a.dateISO);
            if (dateCompare !== 0) return dateCompare;
            // For same dates, sort by creation time (newest first)
            return (b.createdAtISO || '').localeCompare(a.createdAtISO || '');
          });
          
          set({
            logs: sortedLogs,
            lastSyncISO: dayjs().toISOString(),
            isLoading: false,
          });
          
          console.log('✅ Firebase sync completed successfully', { 
            firebaseCount: firebaseLogsConverted.length,
            localUnsyncedCount: currentLogs.filter(l => !l.synced).length,
            totalMergedCount: sortedLogs.length
          });
        } catch (error) {
          console.error('❌ Firebase sync failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      loadFromFirebase: async (userId: string) => {
        // Alias for syncWithFirebase for clarity
        return get().syncWithFirebase(userId);
      },
      
      // Sync pending local entries to Firebase
      syncPendingEntries: async (userId: string) => {
        const currentLogs = get().logs;
        const unsyncedEntries = currentLogs.filter(log => !log.synced && log.id.startsWith('temp_'));
        
        if (unsyncedEntries.length === 0) {
          console.log('📋 No pending entries to sync');
          return;
        }
        
        console.log('🔄 Syncing pending entries to Firebase...', { count: unsyncedEntries.length });
        
        for (const entry of unsyncedEntries) {
          try {
            const firebaseId = await LogService.addLogEntry(userId, {
              dateISO: entry.dateISO,
              calories: entry.calories,
              weightKg: entry.weightKg,
              notes: entry.notes,
            });
            
            // Update local entry with Firebase ID and mark as synced
            set((s) => ({
              logs: s.logs.map(l => 
                l.id === entry.id 
                  ? { ...l, id: firebaseId, synced: true }
                  : l
              ),
            }));
            
            console.log('✅ Pending entry synced:', { tempId: entry.id, firebaseId });
          } catch (error) {
            console.error('❌ Failed to sync pending entry:', error);
            // Continue with next entry
          }
        }
      },
      
      // Local-only actions (for offline support)
      addLocal: (e) => {
        const now = dayjs().toISOString();
        const newEntry: LogEntry = {
          id: nanoid(8),
          createdAtISO: now,
          updatedAtISO: now,
          synced: false,
          ...e,
        };
        
        set((s) => ({
          logs: [...s.logs, newEntry],
        }));
      },
      
      updateLocal: (id, patch) => {
        const now = dayjs().toISOString();
        const updateData = { ...patch, updatedAtISO: now, synced: false };
        
        set((s) => ({
          logs: s.logs.map((l) => (l.id === id ? { ...l, ...updateData } : l)),
        }));
      },
      
      removeLocal: (id) => {
        set((s) => ({ logs: s.logs.filter((l) => l.id !== id) }));
      },
      dailyTotals: (dateISO) => {
        const sameDay = get().logs.filter((l) => l.dateISO === dateISO);
        const calories = sameDay.reduce((a, b) => a + (b.calories ?? 0), 0);
        const latestWeight = sameDay
          .filter((l) => typeof l.weightKg === "number")
          .sort((a, b) => (a.id < b.id ? 1 : -1))[0]?.weightKg;
        return { calories, weightKg: latestWeight };
      },
      avgDailyDeltaKcalLast14: (target) => {
        const days = [...Array(14)].map((_, i) => dayjs().subtract(i, "day").format("YYYY-MM-DD"));
        const diffs = days.map((d) => get().dailyTotals(d).calories - target);
        if (!diffs.length) return 0;
        const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        return Math.round(avg);
      },
      streak: () => {
        const logs = get().logs;
        if (!logs?.length) return 0;

        const norm = (v?: string) => (v ? dayjs(v).format("YYYY-MM-DD") : undefined);
        const today = dayjs().format("YYYY-MM-DD");

        // Does a specific day count toward streak?
        const countsDay = (dayISO: string) => {
          // Must have at least one log whose target day is dayISO…
          const entries = logs.filter((l) => norm(l.dateISO) === dayISO);
          if (!entries.length) return false;

          // …and at least one of those must have been CREATED on that same local day
          // For legacy entries with no createdAtISO, we’ll assume it was logged same-day.
          return entries.some((l) => {
            const createdDay = norm(l.createdAtISO) ?? norm(l.dateISO);
            return createdDay === dayISO;
          });
        };

        // If today doesn’t count, streak is 0 by your rules
        if (!countsDay(today)) return 0;

        // Count back consecutive days
        let count = 1; // today already counted
        for (let i = 1; i < 730; i++) {
          const d = dayjs(today).subtract(i, "day").format("YYYY-MM-DD");
          if (countsDay(d)) count++;
          else break;
        }
        return count;
      },
      
      // State management
      setLoading: (isLoading: boolean) => set({ isLoading }),
      
      reset: () => set({ 
        logs: [], 
        isLoading: false, 
        lastSyncISO: undefined 
      }),
    }),
    {
      name: "logStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 3, // Bumped for Firebase integration
      migrate: (state: any, fromVersion) => {
        if (fromVersion < 2 && state?.state?.logs) {
          // Backfill createdAtISO = the log's date (best-effort)
          state.state.logs = state.state.logs.map((l: any) => ({
            ...l,
            createdAtISO: l.createdAtISO ?? dayjs(l.dateISO).toISOString(),
          }));
        }
        
        if (fromVersion < 3 && state?.state?.logs) {
          // Add Firebase sync fields
          state.state.logs = state.state.logs.map((l: any) => ({
            ...l,
            updatedAtISO: l.updatedAtISO ?? l.createdAtISO ?? dayjs(l.dateISO).toISOString(),
            synced: false, // Mark existing entries as not synced
          }));
          
          // Add new state fields
          state.state.isLoading = false;
          state.state.lastSyncISO = undefined;
        }
        
        return state;
      },
    }
  )
);
