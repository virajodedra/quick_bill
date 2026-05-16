import { Link, useLocation, useNavigate } from "react-router-dom"
import { Zap, LayoutDashboard, Package, ShoppingCart, LogOut, Store } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/analytics", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
]

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Brand + Nav */}
            <div className="flex items-center gap-5">
              <Link to="/analytics" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
                  <Zap className="h-3.5 w-3.5 text-background" fill="currentColor" />
                </div>
                <span className="text-sm font-bold tracking-tight">QuickBill</span>
              </Link>

              {/* Internal nav links */}
              <nav className="hidden sm:flex items-center gap-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                      location.pathname === to
                        ? "bg-foreground text-background font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                ))}

                {/* External store link */}
                <a
                  href="/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Store className="h-3.5 w-3.5" />
                  Store ↗
                </a>
              </nav>
            </div>

            {/* User info + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <span>{user?.username}</span>
                {isAdmin && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">Admin</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background flex">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
              location.pathname === to ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <a
          href="/store"
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground"
        >
          <Store className="h-5 w-5" />
          Store
        </a>
      </nav>

      {/* Page content */}
      <main className="flex-1 pb-16 sm:pb-0">
        {children}
      </main>
    </div>
  )
}
