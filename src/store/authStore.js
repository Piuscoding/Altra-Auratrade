import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true, isLoading: false }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "altra-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
