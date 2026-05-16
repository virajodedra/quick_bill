import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Zap, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { authApi } from "@/lib/api"

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

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "staff",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError("")
  }

  const validate = () => {
    if (!form.name.trim()) return "Full name is required."
    if (!form.username.trim()) return "Username is required."
    if (!/^[a-z0-9_]+$/i.test(form.username.trim())) return "Username can only contain letters, numbers and underscores."
    if (!form.email.trim()) return "Email address is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Invalid email format."
    if (!form.password) return "Password is required."
    if (form.password.length < 6) return "Password must be at least 6 characters."
    if (form.password !== form.confirmPassword) return "Passwords do not match."
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")

    try {
      await authApi.register({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      })

      setSuccess(true)
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      setError(
        err?.response?.data?.message || "Registration failed. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicator
  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  })()

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][strength]
  const strengthColor = ["", "bg-destructive", "bg-amber-400", "bg-yellow-400", "bg-green-400", "bg-green-500"][strength]

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden p-4 py-8">
      <GridPattern />
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
            <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fill in the details to get started
            </p>
          </CardHeader>

          <CardContent className="px-7 pb-7">

            {/* Success state */}
            {success ? (
              <div className="py-8 flex flex-col items-center gap-3 text-center animate-fade-in">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10">
                  <CheckCircle2 className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Account created!</p>
                  <p className="text-sm text-muted-foreground mt-1">Redirecting you to sign in…</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-4" noValidate>

                {error && (
                  <div className="animate-fade-in flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
                    <span className="mt-px shrink-0">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Full name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-foreground/80">Full name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    autoFocus
                    value={form.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-10 bg-background"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-foreground/80">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="johndoe"
                      autoComplete="username"
                      value={form.username}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-10 pl-7 bg-background lowercase"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-foreground/80">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-10 bg-background"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-foreground/80">Role</Label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={loading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-foreground/80">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-10 pr-10 bg-background"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength meter */}
                  {form.password && (
                    <div className="space-y-1 animate-fade-in">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all duration-300",
                              i < strength ? strengthColor : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-foreground/80">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      className={cn(
                        "h-10 pr-10 bg-background",
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? "border-destructive focus-visible:ring-destructive"
                          : form.confirmPassword && form.password === form.confirmPassword
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                      )}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  id="register-submit-btn"
                  disabled={loading}
                  size="lg"
                  className="w-full h-10 font-semibold group mt-2"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>
                  ) : (
                    <>Create account <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                  )}
                </Button>
              </form>
            )}

            {!success && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">Already have an account?</span>
                  </div>
                </div>

                <Button variant="outline" size="lg" className="w-full h-10" asChild>
                  <Link to="/login">Sign in instead</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
