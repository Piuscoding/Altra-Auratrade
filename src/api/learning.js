import api from "./client"

export const learningApi = {
  listSnapshots: async (params) => {
    const { data } = await api.get("/learning/snapshots", { params })
    return data
  },
  promotion: async (strategyId) => {
    const { data } = await api.get(`/learning/promotion/${strategyId}`)
    return data
  },
  getGates: async () => {
    const { data } = await api.get("/learning/gates")
    return data
  },
  updateGates: async (payload) => {
    const { data } = await api.patch("/learning/gates", payload)
    return data
  },
}
