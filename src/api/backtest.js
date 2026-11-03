import api from "./client"

export const backtestApi = {
  run: async (payload) => {
    const { data } = await api.post("/backtest/run", payload)
    return data
  },
  list: async (params) => {
    const { data } = await api.get("/backtest", { params })
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/backtest/${id}`)
    return data
  },
}
