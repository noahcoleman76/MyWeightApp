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
}

type LogStore = {
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
      add: (e) => set((s) => ({ logs: [...s.logs, { id: nanoid(8), ...e }] })),
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
        let sCount = 0;
        for (let i = 0; i < 365; i++) {
          const day = dayjs().subtract(i, "day").format("YYYY-MM-DD");
          const had = get().logs.some((l) => l.dateISO === day && ((l.calories ?? 0) > 0 || typeof l.weightKg === "number"));
          if (had) sCount++;
          else break;
        }
        return sCount;
      },
    }),
    {
      name: "logStore",
      storage: createJSONStorage(() => ({ getItem, setItem, removeItem })),
      version: 1,
    }
  )
);
