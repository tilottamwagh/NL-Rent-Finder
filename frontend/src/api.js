import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.nlrentfinder.tilottamwagh.com'

const api = axios.create({ baseURL: API_URL, timeout: 30000 })

export const listingsAPI = {
  getAll:  (params) => api.get('/api/listings', { params }),
  create:  (data)   => api.post('/api/listings', data),
  delete:  (id)     => api.delete(`/api/listings/${id}`),
  parse:   (text)   => api.post('/api/listings/parse', { text }),
}
export const queriesAPI = {
  getAll:  ()     => api.get('/api/queries'),
  create:  (data) => api.post('/api/queries', data),
  delete:  (id)   => api.delete(`/api/queries/${id}`),
}
export const matchesAPI = {
  getForQuery: (id) => api.get(`/api/matches/${id}`),
  getAll:      ()   => api.get('/api/matches'),
}
export const statsAPI = {
  get: () => api.get('/api/stats'),
}
export const scraperAPI = {
  getLogs: () => api.get('/api/scraper/logs'),
  runNow:  () => api.post('/api/scraper/run'),
}
export const aiAPI = {
  getSettings:    ()     => api.get('/api/ai/settings'),
  updateSettings: (data) => api.post('/api/ai/settings', data),
  test:           (data) => api.post('/api/ai/test', data),
}

export default api
