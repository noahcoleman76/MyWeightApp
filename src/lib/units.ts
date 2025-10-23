export const lbToKg = (lb: number) => lb * 0.45359237;
export const inToCm = (inch: number) => inch * 2.54;
export const safeNum = (s: string) => (s.trim() === "" ? NaN : Number(s));
export const birthYearToAge = (year: number) => {
  const now = new Date().getFullYear();
  const age = now - year;
  return age < 0 || age > 120 ? 0 : age;
};
