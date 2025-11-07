import dayjs from "dayjs";
import { nanoid } from "nanoid/non-secure";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItem, removeItem, setItem } from "../lib/mmkv";

export interface LogEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  calories?: number;
  weightKg?: number;
  notes?: string;
  createdAtISO?: string; // full ISO timestamp
}

type LogStore = {
  reset: any;
  logs: LogEntry[];
  add: (e: Omit<LogEntry, "id">) => void;
  update: (id: string, patch: Partial<LogEntry>) => void;
  remove: (id: string) => void;
  dailyTotals: (dateISO: string) => { calories: number; weightKg?: number };
  avgDailyDeltaKcalLast14: (target: number) => number; // actual-target average
  streak: () => number; // consecutive days with any log, ending today
};

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      logs: [],
      add: (e) =>
        set((s) => ({
          logs: [...s.logs, { id: nanoid(8), createdAtISO: dayjs().toISOString(), ...e }],
        })),
      update: (id, patch) =>
        set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      remove: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
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


      reset: () => set({ logs: [] }),
    }),
    {
      name: "logStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 2, // ⬅️ bump
      migrate: (state: any, fromVersion) => {
        if (fromVersion < 2 && state?.state?.logs) {
          // Backfill createdAtISO = the log's date (best-effort)
          state.state.logs = state.state.logs.map((l: any) => ({
            ...l,
            createdAtISO: l.createdAtISO ?? dayjs(l.dateISO).toISOString(),
          }));
        }
        return state;
      },
    }
  )
);
