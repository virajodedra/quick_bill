import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Trash2, X, Loader2, ShoppingCart, CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { orderApi, productApi } from "@/lib/api"
import Layout from "@/components/Layout"

const statusBadge = {
  draft:     "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

const formatINR = (v) => `₹${Number(v).toLocaleString("en-IN")}`

// ── New Order Modal ──────────────────────────────────────────────────────────
function NewOrderModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1) // 1=select products, 2=customer info
  const [productSearch, setProductSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [cartItems, setCartItems] = useState([]) // { product, quantity }
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" })
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) { setStep(1); setCartItems([]); setCustomer({ name: "", email: "", phone: "" }); setNotes(""); setError(""); setProductSearch(""); setSearchResults([]) }
  }, [open])

  useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await productApi.list({ search: productSearch, limit: 8 })
        setSearchResults(data.data.products || [])
      } catch { setSearchResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  if (!open) return null

  const addToCart = (product) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.product._id === product._id)
      if (exists) return prev.map((i) => i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
    setProductSearch("")
    setSearchResults([])
  }

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId)
    setCartItems((prev) => prev.map((i) => i.product._id === productId ? { ...i, quantity: qty } : i))
  }

  const removeFromCart = (productId) => setCartItems((prev) => prev.filter((i) => i.product._id !== productId))

  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0)

  const handleCreate = async () => {
    if (!cartItems.length) { setError("Add at least one product"); return }
    setLoading(true); setError("")
    try {
      const { data } = await orderApi.create({
        items: cartItems.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
        customer: { name: customer.name, email: customer.email, phone: customer.phone },
        notes,
      })
      const orderId = data.data.order._id
      // Confirm immediately (atomic stock deduction)
      setConfirming(true)
      await orderApi.confirm(orderId)
      onCreated(orderId)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create order")
    } finally {
      setLoading(false); setConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> New Bill
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</div>
            )}

            {/* Product Search */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Add Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search product name, SKU…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 h-9"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                    {searchResults.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => addToCart(p)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted text-left transition-colors"
                      >
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku || p.brand || p.itemType} · Stock: {p.stock}</p>
                        </div>
                        <p className="font-semibold text-sm shrink-0 ml-4">{formatINR(p.price)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            {cartItems.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Product</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Price</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                      <th className="px-4 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cartItems.map((item) => (
                      <tr key={item.product._id}>
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {item.product.stock}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right">{formatINR(item.product.price)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => updateQty(item.product._id, item.quantity - 1)} className="h-6 w-6 rounded border border-border hover:bg-muted text-center leading-none">−</button>
                            <input
                              type="number"
                              min={1}
                              max={item.product.stock}
                              value={item.quantity}
                              onChange={(e) => updateQty(item.product._id, parseInt(e.target.value) || 1)}
                              className="w-12 h-6 text-center text-sm border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <button onClick={() => updateQty(item.product._id, item.quantity + 1)} className="h-6 w-6 rounded border border-border hover:bg-muted text-center leading-none">+</button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatINR(item.product.price * item.quantity)}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => removeFromCart(item.product._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/20">
                      <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-right">Grand Total</td>
                      <td className="px-4 py-2.5 text-right font-bold">{formatINR(subtotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground text-sm">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Search and add products above
              </div>
            )}

            {/* Customer Info */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Customer Info <span className="text-muted-foreground font-normal">(optional)</span></label>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Input placeholder="Customer name" value={customer.name} onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))} className="h-9" />
                </div>
                <Input placeholder="Email" type="email" value={customer.email} onChange={(e) => setCustomer((p) => ({ ...p, email: e.target.value }))} className="h-9" />
                <Input placeholder="Phone" value={customer.phone} onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))} className="h-9" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any notes…" className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="flex-1" onClick={handleCreate} disabled={loading || !cartItems.length}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{confirming ? "Confirming…" : "Creating…"}</>
            ) : (
              <>Confirm & Bill &nbsp;{cartItems.length > 0 && `(${formatINR(subtotal)})`}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ open, order, onClose, onCancelled }) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  if (!open || !order) return null

  const handle = async () => {
    setLoading(true)
    try {
      await orderApi.cancel(order._id, reason)
      onCancelled()
      onClose()
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to cancel")
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl p-6 space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold">Cancel Order {order.orderNumber}?</h3>
          <p className="text-sm text-muted-foreground mt-1">Stock will be restored automatically.</p>
        </div>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason for cancellation…" className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Keep</Button>
          <Button className="flex-1 bg-foreground text-background hover:bg-foreground/90" onClick={handle} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Order"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Orders Page ──────────────────────────────────────────────────────────
export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await orderApi.list(params)
      setOrders(data.data.orders)
      setMeta(data.meta)
    } catch { setOrders([]) }
    finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleCreated = (orderId) => {
    fetchOrders()
    navigate(`/invoice/${orderId}`)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Orders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{meta.total} total orders</p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Bill
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search order no, customer…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9 h-9" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 w-20 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse w-24" /></td>)}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No orders found
                  </td></tr>
                ) : orders.map((o) => (
                  <tr key={o._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium">{o.orderNumber}</p>
                      {o.isGuestOrder && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-1.5 py-0.5">Online</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm">{o.customer?.name || <span className="text-muted-foreground">Walk-in</span>}</td>
                    <td className="px-4 py-3 font-medium">{formatINR(o.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", statusBadge[o.status])}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{o.createdBy?.username}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {o.status === "draft" && (
                          <button
                            onClick={async () => {
                              try {
                                await orderApi.confirm(o._id)
                                fetchOrders()
                              } catch (err) {
                                alert(err?.response?.data?.message || "Failed to confirm")
                              }
                            }}
                            className="p-1 rounded hover:bg-green-50 text-muted-foreground hover:text-green-700 transition-colors"
                            title="Confirm Order"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {o.status === "confirmed" && (
                          <button onClick={() => navigate(`/invoice/${o._id}`)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View Invoice">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {o.status !== "cancelled" && (
                          <button onClick={() => setCancelTarget(o)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors" title="Cancel">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs px-2">{meta.page} / {meta.totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewOrderModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
      <CancelModal open={!!cancelTarget} order={cancelTarget} onClose={() => setCancelTarget(null)} onCancelled={fetchOrders} />
    </Layout>
  )
}
