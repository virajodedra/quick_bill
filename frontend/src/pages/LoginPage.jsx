import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Zap, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

function GridPattern() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ username: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.username.trim()) {
      setError("Username or Email is required.")
      return
    }
    if (!form.password) {
      setError("Password is required.")
      return
    }

    setLoading(true)
    setError("")

    try {
      await login({ username: form.username.trim().toLowerCase(), password: form.password })
      navigate("/analytics")
    } catch (err) {
      setError(
        err?.response?.data?.message || "Invalid credentials. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden p-4">
      <GridPattern />

      {/* Subtle orbs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-foreground/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-foreground/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
            <Zap className="h-5 w-5 text-background" fill="currentColor" />
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-none tracking-tight">QuickBill</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sales System</p>
          </div>
        </div>

        <Card className="border border-border/60 shadow-2xl shadow-foreground/5 bg-card/80 backdrop-blur-xl">
          <CardHeader className="pb-2 pt-7 px-7">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your account to continue
            </p>
          </CardHeader>

          <CardContent className="px-7 pb-7">
            <form onSubmit={handleSubmit} className="space-y-5 mt-4" noValidate>

              {error && (
                <div className="animate-fade-in flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
                  <span className="mt-px shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Username/Email */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-foreground/80">
                  Username or Email
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe or john@example.com"
                  autoComplete="username"
                  autoFocus
                  value={form.username}
                  onChange={handleChange}
                  disabled={loading}
                  className={cn(
                    "h-10 bg-background",
                    error && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground/80">
                    Password
                  </Label>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className={cn(
                      "h-10 pr-10 bg-background",
                      error && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                id="login-submit-btn"
                disabled={loading}
                size="lg"
                className="w-full h-10 font-semibold group"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
                ) : (
                  <>Sign in <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  Don't have an account?
                </span>
              </div>
            </div>

            <Button variant="outline" size="lg" className="w-full h-10" asChild>
              <Link to="/register">Create an account</Link>
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Terms of Service</span>
          {" "}and{" "}
          <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
