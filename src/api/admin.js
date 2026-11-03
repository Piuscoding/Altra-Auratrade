import api from "./client"

export const adminApi = {
  overview: async () => {
    const { data } = await api.get("/admin/overview")
    return data
  },
  settings: async () => {
    const { data } = await api.get("/admin/settings")
    return data
  },
  updateFeatureToggles: async (payload) => {
    const { data } = await api.patch("/admin/settings/feature-toggles", payload)
    return data
  },
  updateModelSwitching: async (payload) => {
    const { data } = await api.patch("/admin/settings/model-switching", payload)
    return data
  },
  updateDataProviders: async (payload) => {
    const { data } = await api.patch("/admin/settings/data-providers", payload)
    return data
  },
  updateDefaultModels: async (payload) => {
    const { data } = await api.patch("/admin/settings/default-models", payload)
    return data
  },
  users: async (q) => {
    const { data } = await api.get("/admin/users", { params: q ? { q } : {} })
    return data
  },
  blockUser: async (id, reason) => {
    const { data } = await api.post(`/admin/users/${id}/block`, { reason })
    return data
  },
  unblockUser: async (id, reason) => {
    const { data } = await api.post(`/admin/users/${id}/unblock`, { reason })
    return data
  },
  setUserModel: async (id, modelId) => {
    const { data } = await api.patch(`/admin/users/${id}/model-preference`, { modelId })
    return data
  },
  strategies: async (status) => {
    const { data } = await api.get("/admin/strategies", {
      params: status ? { status } : {},
    })
    return data
  },
  deleteStrategy: async (id) => {
    const { data } = await api.delete(`/admin/strategies/${id}`)
    return data
  },
  bestStrategies: async () => {
    const { data } = await api.get("/admin/best-strategies")
    return data
  },
  updatePreSignal: async (payload) => {
    const { data } = await api.patch("/admin/settings/pre-signal-validation", payload)
    return data
  },
  updateAiChart: async (payload) => {
    const { data } = await api.patch("/admin/settings/ai-chart-assist", payload)
    return data
  },
}
