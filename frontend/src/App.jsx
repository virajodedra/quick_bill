import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { ProtectedRoute, GuestRoute } from "@/components/ProtectedRoute"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import DashboardPage from "@/pages/DashboardPage"
import AnalyticsPage from "@/pages/AnalyticsPage"
import OrdersPage from "@/pages/OrdersPage"
import InvoicePrintPage from "@/pages/InvoicePrintPage"
import StorePage from "@/pages/StorePage"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Fully public — no auth needed */}
          <Route path="/store" element={<StorePage />} />

          {/* Guest-only */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected */}
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/invoice/:orderId" element={<ProtectedRoute><InvoicePrintPage /></ProtectedRoute>} />

          {/* Redirects */}
          <Route path="/dashboard" element={<Navigate to="/analytics" replace />} />
          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
