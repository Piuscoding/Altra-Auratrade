import api from "./client"

export const journalApi = {
  trades: async (params) => {
    const { data } = await api.get("/journal/trades", { params })
    return data
  },
  calendar: async (params) => {
    const { data } = await api.get("/journal/calendar", { params })
    return data
  },
  updateTrade: async (id, payload) => {
    const { data } = await api.patch(`/journal/trades/${id}`, payload)
    return data
  },
  signals: async (params) => {
    const { data } = await api.get("/journal/signals", { params })
    return data
  },
  exportCsvUrl: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    const base = api.defaults?.baseURL || "/api"
    return `${base}/journal/export.csv${q ? `?${q}` : ""}`
  },
}
