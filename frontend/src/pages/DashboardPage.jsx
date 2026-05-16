import { useState, useEffect } from "react"
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { productApi } from "@/lib/api"
import Layout from "@/components/Layout"

// ─── Badge ───────────────────────────────────────────────────────────────────
function Badge({ children, variant = "default", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-secondary text-secondary-foreground",
        variant === "outline" && "border border-border text-foreground",
        variant === "destructive" && "bg-destructive/10 text-destructive",
        variant === "warning" && "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
        className
      )}
    >
      {children}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

// ─── Product Row ──────────────────────────────────────────────────────────────
function ProductRow({ product, isAdmin, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isLowStock = product.stock <= product.lowStockThreshold

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium">{product.name}</p>
          {product.brand && (
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <Badge variant="outline">{product.itemType}</Badge>
      </td>
      <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
        {product.category || "—"}
      </td>
      <td className="px-4 py-3 text-sm font-medium">
        ₹{product.price.toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{product.stock}</span>
          {isLowStock && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              product.isActive ? "bg-foreground" : "bg-muted-foreground"
            )}
          />
          <span className="text-xs text-muted-foreground">
            {product.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </td>
      {isAdmin && (
        <td className="px-4 py-3">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 min-w-[120px] rounded-lg border border-border bg-card shadow-lg py-1 animate-fade-in">
                <button
                  onClick={() => { onEdit(product); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => { onDelete(product); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductModal({ open, onClose, product, onSaved }) {
  const [form, setForm] = useState({
    name: "", brand: "", category: "", itemType: "stationery",
    price: "", costPrice: "", stock: "", lowStockThreshold: "5",
    sku: "", barcode: "", unit: "", description: "", isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "",
        itemType: product.itemType || "stationery",
        price: product.price ?? "",
        costPrice: product.costPrice ?? "",
        stock: product.stock ?? "",
        lowStockThreshold: product.lowStockThreshold ?? 5,
        sku: product.sku || "",
        barcode: product.barcode || "",
        unit: product.unit || "",
        description: product.description || "",
        isActive: product.isActive ?? true,
      })
    } else {
      setForm({
        name: "", brand: "", category: "", itemType: "stationery",
        price: "", costPrice: "", stock: "", lowStockThreshold: "5",
        sku: "", barcode: "", unit: "", description: "", isActive: true,
      })
    }
    setError("")
  }, [product, open])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const payload = {
        name: form.name.trim(),
        itemType: form.itemType,
        price: Number(form.price),
        ...(form.brand && { brand: form.brand.trim() }),
        ...(form.category && { category: form.category.trim() }),
        ...(form.costPrice !== "" && { costPrice: Number(form.costPrice) }),
        ...(form.stock !== "" && { stock: Number(form.stock) }),
        ...(form.lowStockThreshold !== "" && { lowStockThreshold: Number(form.lowStockThreshold) }),
        ...(form.sku && { sku: form.sku.trim() }),
        ...(form.barcode && { barcode: form.barcode.trim() }),
        ...(form.unit && { unit: form.unit.trim() }),
        ...(form.description && { description: form.description.trim() }),
        isActive: form.isActive,
      }
      if (product) {
        await productApi.update(product._id, payload)
      } else {
        await productApi.create(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save product.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">
            {product ? "Edit Product" : "New Product"}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Product name" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Brand</label>
              <Input name="brand" value={form.brand} onChange={handleChange} placeholder="Brand" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Input name="category" value={form.category} onChange={handleChange} placeholder="Category" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Item Type *</label>
              <select
                name="itemType"
                value={form.itemType}
                onChange={handleChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="stationery">Stationery</option>
                <option value="electronics">Electronics</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Unit</label>
              <Input name="unit" value={form.unit} onChange={handleChange} placeholder="pcs, kg, box…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Selling Price *</label>
              <Input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cost Price</label>
              <Input name="costPrice" type="number" min="0" step="0.01" value={form.costPrice} onChange={handleChange} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stock</label>
              <Input name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Low Stock Alert</label>
              <Input name="lowStockThreshold" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={handleChange} placeholder="5" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">SKU</label>
              <Input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU-001" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Barcode</label>
              <Input name="barcode" value={form.barcode} onChange={handleChange} placeholder="1234567890" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Product description…"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Active</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                product ? "Save Changes" : "Create Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteDialog({ open, product, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  if (!open || !product) return null

  const handleDelete = async () => {
    setLoading(true)
    try {
      await productApi.remove(product._id)
      onDeleted()
      onClose()
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl p-6 space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Delete Product</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Products Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { isAdmin } = useAuth()

  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [itemType, setItemType] = useState("")
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (search) params.search = search
      if (category) params.category = category
      if (itemType) params.itemType = itemType
      const { data } = await productApi.list(params)
      setProducts(data.data.products || [])
      setMeta(data.meta || { page: 1, limit: 15, total: 0, totalPages: 1 })
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [page, search, category, itemType])

  const openCreate = () => { setEditProduct(null); setModalOpen(true) }
  const openEdit = (p) => { setEditProduct(p); setModalOpen(true) }
  const openDelete = (p) => { setDeleteTarget(p); setDeleteOpen(true) }

  const lowStockCount = products.filter((p) => p.isLowStock).length

  return (
    <Layout>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Page title + action */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Product Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {meta.total} products total
              {lowStockCount > 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  · {lowStockCount} low stock
                </span>
              )}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Products" value={meta.total} icon={Package} />
          <StatCard label="Low Stock" value={lowStockCount} icon={AlertTriangle} sub="Need restocking" />
          <StatCard label="Active" value={products.filter(p => p.isActive).length} icon={Filter} />
          <StatCard label="Page" value={`${meta.page} / ${meta.totalPages}`} icon={ChevronRight} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 h-9"
            />
          </div>
          <select
            value={itemType}
            onChange={(e) => { setItemType(e.target.value); setPage(1) }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All types</option>
            <option value="stationery">Stationery</option>
            <option value="electronics">Electronics</option>
          </select>
          <Input
            placeholder="Category…"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="h-9 w-36"
          />
          {(search || itemType || category) && (
            <button
              onClick={() => { setSearch(""); setItemType(""); setCategory(""); setPage(1) }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="px-4 py-3 w-10" />}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                      {isAdmin && <td className="px-4 py-3" />}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-16 text-center text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No products found</p>
                      <p className="text-xs mt-0.5">
                        {search || itemType || category ? "Try adjusting your filters" : "Add your first product"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <ProductRow
                      key={p._id}
                      product={p}
                      isAdmin={isAdmin}
                      onEdit={openEdit}
                      onDelete={openDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2">
                  {meta.page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} product={editProduct} onSaved={fetchProducts} />
      <DeleteDialog open={deleteOpen} product={deleteTarget} onClose={() => setDeleteOpen(false)} onDeleted={fetchProducts} />
    </Layout>
  )
}
