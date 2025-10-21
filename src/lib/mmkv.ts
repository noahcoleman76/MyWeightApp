import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "myweight-storage" });

export const getItem = (key: string) => {
  const value = storage.getString(key);
  return value ?? null;
};

export const setItem = (key: string, value: string) => {
  storage.set(key, value);
};

export const removeItem = (key: string) => {
  storage.delete(key);
};
