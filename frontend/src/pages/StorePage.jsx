import { useState, useEffect, useCallback } from "react"
import { ShoppingCart, Search, X, Plus, Minus, Trash2, Package, Zap, CheckCircle, Loader2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { orderApi } from "@/lib/api"
import api from "@/lib/api"

const formatINR = (v) => `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }) {
  const outOfStock = product.stock <= 0
  const isLow = product.stock > 0 && product.stock <= product.lowStockThreshold

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden hover:shadow-md transition-shadow group">
      {/* Type badge strip */}
      <div className={cn("h-1", product.itemType === "electronics" ? "bg-foreground" : "bg-muted-foreground/50")} />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
              {product.brand && <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>}
            </div>
            <span className="inline-flex shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {product.itemType}
            </span>
          </div>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{product.description}</p>
          )}
          {product.category && (
            <p className="text-[11px] text-muted-foreground/70 mt-1">📁 {product.category}</p>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-end justify-between">
            <p className="text-lg font-bold">{formatINR(product.price)}</p>
            <p className={cn("text-xs", isLow ? "text-amber-600 font-medium" : "text-muted-foreground")}>
              {outOfStock ? "Out of stock" : isLow ? `Only ${product.stock} left!` : `${product.stock} in stock`}
            </p>
          </div>

          <button
            onClick={() => onAdd(product)}
            disabled={outOfStock}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
              outOfStock
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-foreground text-background hover:bg-foreground/90 active:scale-95"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            {outOfStock ? "Unavailable" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────
function CartDrawer({ open, cart, onClose, onUpdateQty, onRemove, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart ({cart.length})</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-12 w-12 opacity-20 mb-3" />
              <p className="text-sm">Your cart is empty</p>
            </div>
          ) : cart.map((item) => (
            <div key={item.product._id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">{formatINR(item.product.price)} each</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onUpdateQty(item.product._id, item.quantity - 1)} className="h-7 w-7 rounded border border-border hover:bg-muted flex items-center justify-center">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.product._id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="h-7 w-7 rounded border border-border hover:bg-muted flex items-center justify-center disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button onClick={() => onRemove(item.product._id)} className="ml-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm font-semibold w-16 text-right">{formatINR(item.product.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-border p-5 space-y-3">
            <div className="flex justify-between font-bold text-base">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
            <Button className="w-full" onClick={onCheckout}>Proceed to Checkout</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Checkout Modal ────────────────────────────────────────────────────────────
function CheckoutModal({ open, cart, onClose, onSuccess }) {
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const { data } = await orderApi.publicCreate({
        items: cart.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
        customer: { name: customer.name.trim(), email: customer.email.trim(), phone: customer.phone.trim() },
      })
      onSuccess(data.data.order)
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Checkout</h2>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</div>}

          <div>
            <h3 className="text-sm font-medium mb-3">Your Details</h3>
            <div className="space-y-2.5">
              <Input required placeholder="Your name *" value={customer.name} onChange={(e) => setCustomer(p => ({ ...p, name: e.target.value }))} className="h-9" />
              <Input type="email" placeholder="Email (optional)" value={customer.email} onChange={(e) => setCustomer(p => ({ ...p, email: e.target.value }))} className="h-9" />
              <Input placeholder="Phone (optional)" value={customer.phone} onChange={(e) => setCustomer(p => ({ ...p, phone: e.target.value }))} className="h-9" />
            </div>
          </div>

          {/* Order summary */}
          <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Order Summary</p>
            {cart.map((item) => (
              <div key={item.product._id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.product.name} × {item.quantity}</span>
                <span className="font-medium">{formatINR(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-sm border-t border-border pt-1.5 mt-1.5">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Back</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Placing…</> : "Place Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Success Screen ────────────────────────────────────────────────────────────
function OrderSuccess({ order, onContinue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl p-8 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Order Placed!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your order has been received and is being processed.</p>
        </div>
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-sm">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">Order Number</p>
          <p className="font-bold text-base mt-0.5 font-mono">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground mt-1">Total: {formatINR(order.grandTotal)}</p>
        </div>
        <p className="text-xs text-muted-foreground">Please keep your order number for reference. Our staff will process your order shortly.</p>
        <Button className="w-full" onClick={onContinue}>Continue Shopping</Button>
      </div>
    </div>
  )
}

// ── Main Store Page ───────────────────────────────────────────────────────────
export default function StorePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [itemType, setItemType] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qb_cart") || "[]") } catch { return [] }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [successOrder, setSuccessOrder] = useState(null)

  // Persist cart to localStorage
  useEffect(() => { localStorage.setItem("qb_cart", JSON.stringify(cart)) }, [cart])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12, isActive: true }
      if (search) params.search = search
      if (itemType) params.itemType = itemType
      const { data } = await api.get("/products", { params })
      setProducts(data.data.products || [])
      setMeta(data.meta || { total: 0, totalPages: 1 })
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }, [page, search, itemType])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product._id === product._id)
      if (exists) {
        if (exists.quantity >= product.stock) return prev
        return prev.map((i) => i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId)
    setCart((prev) => prev.map((i) => i.product._id === productId ? { ...i, quantity: qty } : i))
  }

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.product._id !== productId))

  const handleOrderSuccess = (order) => {
    setSuccessOrder(order)
    setCart([])
    setCheckoutOpen(false)
    setCartOpen(false)
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
                <Zap className="h-3.5 w-3.5 text-background" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">QuickBill Store</p>
                <p className="text-[10px] text-muted-foreground">Stationery & Electronics</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search products…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-9"
              />
            </div>

            {/* Cart + Login */}
            <div className="flex items-center gap-2 shrink-0">
              <a href="/login" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors">Staff Login</a>
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Our Catalogue</h1>
          <p className="text-sm text-muted-foreground mt-1">{meta.total} products available</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
          </div>
          {["", "stationery", "electronics"].map((type) => (
            <button
              key={type}
              onClick={() => { setItemType(type); setPage(1) }}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-all border",
                itemType === type
                  ? "bg-foreground text-background border-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {type === "" ? "All Products" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
          {(search || itemType) && (
            <button onClick={() => { setSearch(""); setItemType(""); setPage(1) }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card h-52 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Package className="h-12 w-12 opacity-20 mb-3" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p._id} product={p} onAdd={addToCart} />)}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">{page} / {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </main>

      {/* Floating cart on mobile */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 sm:hidden z-40 flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-3 shadow-lg font-medium text-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          {cartCount} items
        </button>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen}
        cart={cart}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleOrderSuccess}
      />

      {/* Success */}
      {successOrder && <OrderSuccess order={successOrder} onContinue={() => setSuccessOrder(null)} />}
    </div>
  )
}
