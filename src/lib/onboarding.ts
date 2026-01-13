import { GoalMode } from "../state/goalStore";
import { Profile } from "../state/profileStore";

export function isOnboardingComplete(opts: {
  profile: Profile;
  mode: GoalMode;
  goalWeightKg?: number;
}) {
  const { profile, mode, goalWeightKg } = opts;

  const hasGender = profile.gender === "male" || profile.gender === "female";
  const hasAge = Number.isFinite(profile.age) && profile.age > 0;
  const hasHeight = Number.isFinite(profile.height) && profile.height > 0;
  
  const hasStartOrCurrent =
    Number.isFinite(profile.startingWeightKg) && (profile.startingWeightKg as number) > 0
    || Number.isFinite(profile.currentWeightKg) && profile.currentWeightKg > 0;

  const goalOk =
    mode === "maintain" ? true : Number.isFinite(goalWeightKg) && (goalWeightKg as number) > 0;

  return hasGender && hasAge && hasHeight && hasStartOrCurrent && goalOk;
}
