import { GoalMode } from "../state/goalStore";
import { Profile } from "../state/profileStore";

export function isOnboardingComplete(opts: {
  profile: Profile;
  mode: GoalMode;
  goalWeightKg?: number;
}) {
  const { profile, mode, goalWeightKg } = opts;

  // Required profile fields gathered in your flow
  const hasGender = profile.gender === "male" || profile.gender === "female";
  const hasAge = Number.isFinite(profile.age) && profile.age > 0;
  const hasHeight = Number.isFinite(profile.height) && profile.height > 0; // cm
  
  const hasStartOrCurrent =
    Number.isFinite(profile.startingWeightKg) && (profile.startingWeightKg as number) > 0
    || Number.isFinite(profile.currentWeight) && profile.currentWeight > 0;

  // Goal: goalWeight is required for lose/gain; optional for maintain
  const goalOk =
    mode === "maintain" ? true : Number.isFinite(goalWeightKg) && (goalWeightKg as number) > 0;

  return hasGender && hasAge && hasHeight && hasStartOrCurrent && goalOk;
}
