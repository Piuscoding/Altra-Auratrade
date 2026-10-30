import api from "./client"

export const authApi = {
  login: async (payload) => {
    const { data } = await api.post("/auth/login", payload)
    return data
  },
  register: async (payload) => {
    const { data } = await api.post("/auth/register", payload)
    return data
  },
  forgotPassword: async (payload) => {
    const { data } = await api.post("/auth/forgot-password", payload)
    return data
  },
  resetPassword: async (payload) => {
    const { data } = await api.post("/auth/reset-password", payload)
    return data
  },
  me: async () => {
    const { data } = await api.get("/auth/me")
    return data
  },
  logout: async () => {
    await api.post("/auth/logout")
  },
}
