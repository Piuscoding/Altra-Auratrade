import api from "./client"

export const notificationsApi = {
  list: async (params) => {
    const { data } = await api.get("/notifications", { params })
    return data
  },
  unreadCount: async () => {
    const { data } = await api.get("/notifications/unread-count")
    return data
  },
  markRead: async (id) => {
    const { data } = await api.post(`/notifications/${id}/read`)
    return data
  },
  markAllRead: async () => {
    const { data } = await api.post("/notifications/read-all")
    return data
  },
  preferences: async () => {
    const { data } = await api.get("/notifications/preferences")
    return data
  },
  savePreferences: async (payload) => {
    const { data } = await api.put("/notifications/preferences", payload)
    return data
  },
  test: async (channel) => {
    const { data } = await api.post("/notifications/test", { channel })
    return data
  },
  audit: async (params) => {
    const { data } = await api.get("/notifications/audit", { params })
    return data
  },
  auditAll: async (params) => {
    const { data } = await api.get("/notifications/audit/all", { params })
    return data
  },
}
