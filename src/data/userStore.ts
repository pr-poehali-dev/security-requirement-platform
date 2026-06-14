export type UserRole = "admin" | "user";

export interface CurrentUser {
  name: string;
  initials: string;
  role: UserRole;
}

const STORAGE_KEY = "secarch_role";

let current: CurrentUser = {
  name: "А. Петров",
  initials: "АП",
  role: (localStorage.getItem(STORAGE_KEY) as UserRole) ?? "user",
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());

export const userStore = {
  get: () => current,
  isAdmin: () => current.role === "admin",
  setRole: (role: UserRole) => {
    current = { ...current, role };
    localStorage.setItem(STORAGE_KEY, role);
    notify();
  },
  sub: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); },
};
