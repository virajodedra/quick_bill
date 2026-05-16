import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = data.data.accessToken
        localStorage.setItem("accessToken", newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.removeItem("accessToken")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (creds) => api.post("/auth/login", creds),
  register: (payload) => api.post("/auth/register", payload),
  logout: () => api.post("/auth/logout"),
}

export const productApi = {
  list: (params) => api.get("/products", { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post("/products", payload),
  update: (id, payload) => api.patch(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
}

export const orderApi = {
  list: (params) => api.get("/orders", { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (payload) => api.post("/orders", payload),
  confirm: (id) => api.patch(`/orders/${id}/confirm`),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
  publicCreate: (payload) => api.post("/orders/public", payload),
}

export const publicProductApi = {
  list: (params) => api.get("/products", { params }),
}

export const dashboardApi = {
  summary: () => api.get("/dashboard/summary"),
  monthlySales: (year) => api.get("/dashboard/monthly-sales", { params: { year } }),
  weeklySales: () => api.get("/dashboard/weekly-sales"),
  yearCompare: () => api.get("/dashboard/year-compare"),
  lowStock: () => api.get("/dashboard/low-stock"),
  recentOrders: (limit) => api.get("/dashboard/recent-orders", { params: { limit } }),
}

export default api
