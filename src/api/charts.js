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
}
