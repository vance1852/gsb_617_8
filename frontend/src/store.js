import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: "",
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: "", user: null }),
    }),
    { name: "shortlink-auth" },
  ),
);
