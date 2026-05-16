import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { authApi } from "@/lib/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore user from token payload on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUser(payload)
      } catch {
        localStorage.removeItem("accessToken")
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    const { accessToken, user: userData } = data.data
    localStorage.setItem("accessToken", accessToken)
    const payload = JSON.parse(atob(accessToken.split(".")[1]))
    setUser(payload)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      localStorage.removeItem("accessToken")
      setUser(null)
    }
  }, [])

  const isAdmin = user?.role === "admin"

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
