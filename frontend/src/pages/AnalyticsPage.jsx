import { useState, useEffect, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts"
import { TrendingUp, TrendingDown, Package, ShoppingCart, IndianRupee, AlertTriangle } from "lucide-react"
import { dashboardApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import Layout from "@/components/Layout"

// ── Toast ─────────────────────────────────────────────────────────────────────
function LowStockToast({ items, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000)
    return () => clearTimeout(t)
  }, [onClose])

  if (!items?.length) return null
  return (
    <div className="fixed top-4 right-4 z-50 w-80 rounded-xl border border-amber-200 bg-amber-50 shadow-lg p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">Low Stock Alert</p>
          <p className="text-xs text-amber-700 mt-0.5">{items.length} product{items.length > 1 ? "s" : ""} need restocking</p>
          <ul className="mt-2 space-y-1">
            {items.slice(0, 4).map((p) => (
              <li key={p._id} className="text-xs text-amber-800">
                • {p.name} — {p.stock} left (min: {p.lowStockThreshold})
              </li>
            ))}
            {items.length > 4 && <li className="text-xs text-amber-600">+{items.length - 4} more…</li>}
          </ul>
        </div>
        <button onClick={onClose} className="text-amber-400 hover:text-amber-600 text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, growth }) {
  const isPositive = growth > 0
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          {growth != null && (
            <div className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", isPositive ? "text-green-600" : "text-red-500")}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(growth)}% vs last month
            </div>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

const formatINR = (v) => `₹${Number(v).toLocaleString("en-IN")}`

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
          {p.name}: {p.dataKey === "orders" ? p.value : formatINR(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [weekly, setWeekly] = useState([])
  const [yearCompare, setYearCompare] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showToast, setShowToast] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, m, w, y, l, r] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.monthlySales(),
        dashboardApi.weeklySales(),
        dashboardApi.yearCompare(),
        dashboardApi.lowStock(),
        dashboardApi.recentOrders(8),
      ])
      setSummary(s.data.data)
      setMonthly(m.data.data)
      setWeekly(w.data.data)
      setYearCompare(y.data.data)
      setLowStock(l.data.data)
      setRecentOrders(r.data.data)
      if (l.data.data?.length > 0) setShowToast(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const statusColor = { confirmed: "bg-green-500", draft: "bg-amber-400", cancelled: "bg-red-400" }

  return (
    <Layout>
      {showToast && <LowStockToast items={lowStock} onClose={() => setShowToast(false)} />}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sales overview and analytics</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Revenue This Month"
            value={summary ? formatINR(summary.thisMonthRevenue) : "—"}
            icon={IndianRupee}
            growth={summary?.revenueGrowth}
          />
          <StatCard label="Confirmed Orders" value={summary?.totalOrders ?? "—"} icon={ShoppingCart} />
          <StatCard label="Total Products" value={summary?.totalProducts ?? "—"} icon={Package} />
          <StatCard
            label="Low Stock"
            value={summary?.lowStockCount ?? "—"}
            sub="Need restocking"
            icon={AlertTriangle}
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Sales */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekly} barSize={24}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--foreground))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Sales */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Monthly Revenue ({new Date().getFullYear()})</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly} barSize={18}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--foreground))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Year Comparison */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Year Comparison</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={yearCompare}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="thisYear" name={`${new Date().getFullYear()}`} stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lastYear" name={`${new Date().getFullYear() - 1}`} stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Low Stock */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Low Stock Products</h2>
              <span className="text-xs text-muted-foreground">{lowStock.length} items</span>
            </div>
            {lowStock.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">All products are well-stocked ✓</p>
            ) : (
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {lowStock.map((p) => (
                  <div key={p._id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category || p.itemType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">{p.stock} left</p>
                      <p className="text-xs text-muted-foreground">min: {p.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="rounded-xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Recent Orders</h2>
            </div>
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No orders yet</p>
            ) : (
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {recentOrders.map((o) => (
                  <div key={o._id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.customer?.name || "Walk-in"} · {o.createdBy?.username}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-medium">{formatINR(o.grandTotal)}</p>
                      <span className={cn("inline-flex h-1.5 w-1.5 rounded-full", statusColor[o.status] || "bg-muted-foreground")} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
