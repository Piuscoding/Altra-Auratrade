import api from "./client"

export const propApi = {
  list: async () => {
    const { data } = await api.get("/prop")
    return data
  },
  create: async (payload) => {
    const { data } = await api.post("/prop", payload)
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/prop/${id}`)
    return data
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/prop/${id}`, payload)
    return data
  },
  refresh: async (id) => {
    const { data } = await api.post(`/prop/${id}/refresh`)
    return data
  },
  pause: async (id, reason) => {
    const { data } = await api.post(`/prop/${id}/pause`, { reason })
    return data
  },
  resume: async (id) => {
    const { data } = await api.post(`/prop/${id}/resume`)
    return data
  },
  fail: async (id, reason) => {
    const { data } = await api.post(`/prop/${id}/fail`, { reason })
    return data
  },
}
