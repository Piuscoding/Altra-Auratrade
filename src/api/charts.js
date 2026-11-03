import api from "./client"

export const chartsApi = {
  workspace: async (params) => {
    const { data } = await api.get("/charts/workspace", { params })
    return data
  },
  ohlc: async (params) => {
    const { data } = await api.get("/charts/ohlc", { params })
    return data
  },
  newsMarkers: async (params) => {
    const { data } = await api.get("/charts/news-markers", { params })
    return data
  },
  getDrawings: async (params) => {
    const { data } = await api.get("/charts/drawings", { params })
    return data
  },
  saveDrawings: async (payload) => {
    const { data } = await api.put("/charts/drawings", payload)
    return data
  },
  getAiAnnotation: async (params) => {
    const { data } = await api.get("/charts/ai-annotation", { params })
    return data
  },
  aiAnnotate: async (payload) => {
    const { data } = await api.post("/charts/ai-annotate", payload)
    return data
  },
}
