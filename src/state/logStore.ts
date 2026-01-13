import dayjs from "dayjs";
import { nanoid } from "nanoid/non-secure";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LogService, StreakService } from "../lib/firebase";
import { getItem, removeItem, setItem } from "../lib/mmkv";

export interface LogEntry {
  id: string;
  dateISO: string;
  calories?: number;
  weightKg?: number;
  notes?: string;
  createdAtISO?: string;
  updatedAtISO?: string;
  synced?: boolean;
}

type LogStore = {
  reset: any;
  logs: LogEntry[];

  isLoading: boolean;
  lastSyncISO?: string;

  add: (e: Omit<LogEntry, "id">, userId?: string) => Promise<void>;
  update: (id: string, patch: Partial<LogEntry>, userId?: string) => Promise<void>;
  remove: (id: string, userId?: string) => Promise<void>;

  syncWithFirebase: (userId: string) => Promise<void>;
  loadFromFirebase: (userId: string) => Promise<void>;
  syncPendingEntries: (userId: string) => Promise<void>;

  addLocal: (e: Omit<LogEntry, "id">) => void;
  updateLocal: (id: string, patch: Partial<LogEntry>) => void;
  removeLocal: (id: string) => void;

  dailyTotals: (dateISO: string) => { calories: number; weightKg?: number };
  avgDailyDeltaKcalLast14: (target: number) => number;
  streak: () => number;

  setLoading: (loading: boolean) => void;
};

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      logs: [],
      isLoading: false,
      lastSyncISO: undefined,

      add: async (e, userId) => {
        const now = dayjs().toISOString();
        const tempId = `temp_${nanoid(8)}`;
        const newEntry: LogEntry = {
          id: tempId,
          createdAtISO: now,
          updatedAtISO: now,
          synced: false,
          ...e,
        };

        set((s) => ({
          logs: [...s.logs, newEntry].sort((a, b) => {
            const dateCompare = b.dateISO.localeCompare(a.dateISO);
            if (dateCompare !== 0) return dateCompare;
            return (b.createdAtISO || '').localeCompare(a.createdAtISO || '');
          }),
        }));

        if (userId) {
          try {
            const firebaseId = await LogService.addLogEntry(userId, {
              dateISO: newEntry.dateISO,
              calories: newEntry.calories,
              weightKg: newEntry.weightKg,
              notes: newEntry.notes,
            });

            set((s) => ({
              logs: s.logs.map(l =>
                l.id === tempId
                  ? { ...l, id: firebaseId, synced: true }
                  : l
              ),
            }));

            try {
              await StreakService.updateStreakOnLog(userId, newEntry.dateISO);

              const { FirestoreService } = await import('../lib/firebase');
              const userData = await FirestoreService.getUserData(userId);
              if (userData?.streak) {
                const { useProfileStore } = await import('./profileStore');
                useProfileStore.getState().setStreak(userData.streak);
              }
            } catch (streakError) {
              console.error('❌ Failed to update streak:', streakError);
            }
          } catch (error) {
            console.error('❌ Failed to sync entry to Firebase:', error);
          }
        }
      },

      update: async (id, patch, userId) => {
        const now = dayjs().toISOString();
        const updateData = { ...patch, updatedAtISO: now, synced: false };

        set((s) => ({
          logs: s.logs.map((l) => (l.id === id ? { ...l, ...updateData } : l)),
        }));

        if (userId) {
          try {
            await LogService.updateLogEntry(id, userId, patch);

            set((s) => ({
              logs: s.logs.map(l =>
                l.id === id
                  ? { ...l, synced: true }
                  : l
              ),
            }));

          } catch (error) {
            console.error('❌ Failed to sync entry update to Firebase:', error);
          }
        }
      },

      remove: async (id, userId) => {
        set((s) => ({ logs: s.logs.filter((l) => l.id !== id) }));

        if (userId) {
          try {
            await LogService.deleteLogEntry(id, userId);

          } catch (error) {
            console.error('❌ Failed to remove entry from Firebase:', error);
          }
        }
      },

      syncWithFirebase: async (userId: string) => {
        set({ isLoading: true });

        try {
          const currentLogs = get().logs;

          const firebaseEntries = await LogService.getUserLogEntries(userId);

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

          const firebaseLogsById = new Map(firebaseLogsConverted.map(log => [log.id, log]));

          const mergedLogs: LogEntry[] = [];

          mergedLogs.push(...firebaseLogsConverted);

          for (const localLog of currentLogs) {
            if (!localLog.synced && !firebaseLogsById.has(localLog.id)) {
              mergedLogs.push(localLog);
            }
          }

          const sortedLogs = mergedLogs.sort((a, b) => {
            const dateCompare = b.dateISO.localeCompare(a.dateISO);
            if (dateCompare !== 0) return dateCompare;
            return (b.createdAtISO || '').localeCompare(a.createdAtISO || '');
          });

          set({
            logs: sortedLogs,
            lastSyncISO: dayjs().toISOString(),
            isLoading: false,
          });

        } catch (error) {
          console.error('❌ Firebase sync failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      loadFromFirebase: async (userId: string) => {
        return get().syncWithFirebase(userId);
      },

      syncPendingEntries: async (userId: string) => {
        const currentLogs = get().logs;
        const unsyncedEntries = currentLogs.filter(log => !log.synced && log.id.startsWith('temp_'));

        if (unsyncedEntries.length === 0) {
          return;
        }

        for (const entry of unsyncedEntries) {
          try {
            const firebaseId = await LogService.addLogEntry(userId, {
              dateISO: entry.dateISO,
              calories: entry.calories,
              weightKg: entry.weightKg,
              notes: entry.notes,
            });

            set((s) => ({
              logs: s.logs.map(l =>
                l.id === entry.id
                  ? { ...l, id: firebaseId, synced: true }
                  : l
              ),
            }));

          } catch (error) {
            console.error('❌ Failed to sync pending entry:', error);
          }
        }
      },

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

        const countsDay = (dayISO: string) => {
          const entries = logs.filter((l) => norm(l.dateISO) === dayISO);
          if (!entries.length) return false;

          return entries.some((l) => {
            const createdDay = norm(l.createdAtISO) ?? norm(l.dateISO);
            return createdDay === dayISO;
          });
        };

        if (!countsDay(today)) return 0;

        let count = 1;
        for (let i = 1; i < 730; i++) {
          const d = dayjs(today).subtract(i, "day").format("YYYY-MM-DD");
          if (countsDay(d)) count++;
          else break;
        }
        return count;
      },

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
      version: 3,
      migrate: (state: any, fromVersion) => {
        if (fromVersion < 2 && state?.state?.logs) {
          state.state.logs = state.state.logs.map((l: any) => ({
            ...l,
            createdAtISO: l.createdAtISO ?? dayjs(l.dateISO).toISOString(),
          }));
        }

        if (fromVersion < 3 && state?.state?.logs) {
          state.state.logs = state.state.logs.map((l: any) => ({
            ...l,
            updatedAtISO: l.updatedAtISO ?? l.createdAtISO ?? dayjs(l.dateISO).toISOString(),
            synced: false,
          }));

          state.state.isLoading = false;
          state.state.lastSyncISO = undefined;
        }

        return state;
      },
    }
  )
);
