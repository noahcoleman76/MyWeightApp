import dayjs from "dayjs";

export type Sex = "male" | "female";
export type Mode = "lose" | "gain" | "maintain";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";
const ACTIVITY: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

export function kgToLb(kg: number) { return kg / 0.45359237; }
export function lbToKg(lb: number) { return lb * 0.45359237; }
export function cmToIn(cm: number) { return cm / 2.54; }
export function inToCm(inches: number) { return inches * 2.54; }

export function bmrMifflinStJeor(
  sex: Sex,
  age: number,
  heightCm: number,
  weightKg: number
) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function tdee(
  sex: Sex,
  age: number,
  heightCm: number,
  weightKg: number,
  activity: ActivityLevel
) {
  return Math.round(bmrMifflinStJeor(sex, age, heightCm, weightKg) * ACTIVITY[activity]);
}

/**
 * Compute target calories based on mode and (optional) target date.
 * If targetDate provided and goalWeight differs, compute needed daily deficit/surplus.
 * Caps to safe/realistic bands. Otherwise uses default: lose=-500, gain=+250, maintain=0.
 */
export function computeDailyTarget({
  sex,
  age,
  heightCm,
  currentWeightKg,
  activity,
  mode,
  goalWeightKg,
  targetDateISO,
}: {
  sex: Sex;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  activity: ActivityLevel;
  mode: Mode;
  goalWeightKg?: number;
  targetDateISO?: string;
}) {
  const base = tdee(sex, age, heightCm, currentWeightKg, activity);

  let delta = 0;

  if (mode === "maintain") {
    delta = 0;
  } else if (goalWeightKg != null && targetDateISO) {
    const now = dayjs();
    const end = dayjs(targetDateISO);
    const days = Math.max(1, end.diff(now, "day"));

    const kgDiff = goalWeightKg - currentWeightKg;
    const kcalNeeded = kgDiff * 7700;
    const perDay = kcalNeeded / days;

    delta = perDay;
  } else if (mode === "lose") {
    delta = -500;
  } else if (mode === "gain") {
    delta = +250;
  }

  const target = Math.round(base + delta);
  return { maintenance: base, target };
}


export function estimateCompletionDate({
  mode, currentWeightKg, goalWeightKg, avgDailyDeltaKcal,
}: {
  mode: Mode;
  currentWeightKg: number;
  goalWeightKg?: number;
  avgDailyDeltaKcal: number;
}) {
  if (!goalWeightKg || mode === "maintain" || avgDailyDeltaKcal === 0) return undefined;
  const kgRemaining = goalWeightKg - currentWeightKg;
  const kcalNeeded = kgRemaining * 7700;
  const days = kcalNeeded / avgDailyDeltaKcal;
  if (!isFinite(days) || days <= 0) return undefined;
  return dayjs().add(Math.round(days), "day").format("YYYY-MM-DD");
}
