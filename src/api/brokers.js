import api from "./client"

export const brokersApi = {
  list: async () => {
    const { data } = await api.get("/brokers")
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/brokers/${id}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post("/brokers", payload)
    return data
  },
  connect: async (id) => {
    const { data } = await api.post(`/brokers/${id}/connect`)
    return data
  },
  disconnect: async (id) => {
    const { data } = await api.post(`/brokers/${id}/disconnect`)
    return data
  },
  assignStrategy: async (id, strategyId) => {
    const { data } = await api.post(`/brokers/${id}/assign-strategy`, { strategyId })
    return data
  },
  unassignStrategy: async (id) => {
    const { data } = await api.post(`/brokers/${id}/unassign-strategy`)
    return data
  },
  updateSettings: async (id, payload) => {
    const { data } = await api.patch(`/brokers/${id}/settings`, payload)
    return data
  },
  sync: async (id) => {
    const { data } = await api.post(`/brokers/${id}/sync`)
    return data
  },
  syncOrders: async (id) => {
    const { data } = await api.post(`/brokers/${id}/sync-orders`)
    return data
  },
}
