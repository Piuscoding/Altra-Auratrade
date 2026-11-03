import api from "./client"

export const strategiesApi = {
  list: async () => {
    const { data } = await api.get("/strategies")
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/strategies/${id}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post("/strategies", payload)
    return data
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/strategies/${id}`, payload)
    return data
  },
  uploadStepImages: async (id, stepOrder, files) => {
    const form = new FormData()
    form.append("stepOrder", String(stepOrder))
    files.forEach((f) => form.append("images", f))
    const { data } = await api.post(`/strategies/${id}/upload-step-images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data
  },
  uploadVideo: async (id, file) => {
    const form = new FormData()
    form.append("video", file)
    const { data } = await api.post(`/strategies/${id}/upload-video`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data
  },
  removeImage: async (id, stepOrder, imageIndex) => {
    const { data } = await api.delete(
      `/strategies/${id}/step/${stepOrder}/image/${imageIndex}`
    )
    return data
  },
  disable: async (id) => {
    const { data } = await api.post(`/strategies/${id}/disable`)
    return data
  },
  enable: async (id) => {
    const { data } = await api.post(`/strategies/${id}/enable`)
    return data
  },
  submitReview: async (id, payload = { runVision: true }) => {
    const { data } = await api.post(`/strategies/${id}/submit-review`, payload)
    return data
  },
  stepTemplates: async () => {
    const { data } = await api.get("/strategies/meta/step-templates")
    return data
  },
  updateMetricsTargets: async (id, payload) => {
    const { data } = await api.patch(`/strategies/${id}/metrics-targets`, payload)
    return data
  },
  recomputeDemoMetrics: async (id) => {
    const { data } = await api.post(`/strategies/${id}/recompute-demo-metrics`)
    return data
  },
  updateAutoSignal: async (id, payload) => {
    const { data } = await api.patch(`/strategies/${id}/auto-signal`, payload)
    return data
  },
  runAutoSignal: async (id) => {
    const { data } = await api.post(`/strategies/${id}/auto-signal/run`)
    return data
  },
  autoSignalHealth: async (id) => {
    const { data } = await api.get(`/strategies/${id}/auto-signal/health`)
    return data
  },
}