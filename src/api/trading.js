import api from "./client"

export const tradingApi = {
  createSignal: async (payload) => {
    const { data } = await api.post("/trading/signals", payload)
    return data
  },
  listSignals: async () => {
    const { data } = await api.get("/trading/signals")
    return data
  },
  listTrades: async (status) => {
    const { data } = await api.get("/trading/trades", { params: status ? { status } : {} })
    return data
  },
  openTrade: async (id) => {
    const { data } = await api.post(`/trading/trades/${id}/open`)
    return data
  },
  closeTrade: async (id, pnl = 0) => {
    const { data } = await api.post(`/trading/trades/${id}/close`, { pnl })
    return data
  },
  setMark: async (id, markPrice) => {
    const { data } = await api.post(`/trading/trades/${id}/mark`, { markPrice })
    return data
  },
  riskAdjust: async (id) => {
    const { data } = await api.post(`/trading/trades/${id}/risk-adjust`)
    return data
  },
  killSwitch: async () => {
    const { data } = await api.post("/trading/kill-switch")
    return data
  },
  upcomingNews: async () => {
    const { data } = await api.get("/trading/news/upcoming")
    return data
  },
  seedDemoNews: async (payload) => {
    const { data } = await api.post("/trading/news/demo-seed", payload)
    return data
  },
  clearDemoNews: async () => {
    const { data } = await api.delete("/trading/news/demo")
    return data
  },
}

export const accountConfigApi = {
  currentSessions: async () => {
    const { data } = await api.get("/account-config/sessions/current")
    return data
  },
  list: async () => {
    const { data } = await api.get("/account-config")
    return data
  },
  getForStrategy: async (strategyId) => {
    const { data } = await api.get(`/account-config/strategy/${strategyId}`)
    return data
  },
  saveForStrategy: async (strategyId, payload) => {
    const { data } = await api.put(`/account-config/strategy/${strategyId}`, payload)
    return data
  },
  saveRiskAdjustment: async (strategyId, payload) => {
    const { data } = await api.patch(
      `/account-config/strategy/${strategyId}/risk-adjustment`,
      payload
    )
    return data
  },
}
