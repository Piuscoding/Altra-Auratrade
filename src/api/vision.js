import api from "./client"

export const visionApi = {
  analyze: async (strategyId, { force = false } = {}) => {
    const { data } = await api.post(`/vision/analyze/${strategyId}`, { force })
    return data
  },
  getJob: async (strategyId) => {
    const { data } = await api.get(`/vision/jobs/${strategyId}`)
    return data
  },
  history: async (strategyId) => {
    const { data } = await api.get(`/vision/jobs/${strategyId}/history`)
    return data
  },
  saveReview: async (strategyId, payload) => {
    const { data } = await api.post(`/vision/review/${strategyId}`, payload)
    return data
  },
  models: async () => {
    const { data } = await api.get("/vision/models")
    return data
  },
  setPreference: async (modelId) => {
    const { data } = await api.patch("/vision/models/preference", { modelId })
    return data
  },
  adminSettings: async () => {
    const { data } = await api.get("/vision/admin/settings")
    return data
  },
  updateAdminSettings: async (payload) => {
    const { data } = await api.patch("/vision/admin/settings", payload)
    return data
  },
  addModel: async (payload) => {
    const { data } = await api.post("/vision/admin/models", payload)
    return data
  },
}
