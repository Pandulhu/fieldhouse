"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "../../lib/supabase-browser"

export default function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        const supabase = createSupabaseBrowserClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
        })
        if (signInError) {
                setError(signInError.message)
                setLoading(false)
                return
        }
        router.push("/admin")
        router.refresh()
  }

  return (
        <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                      <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                                Email
                      </label>label>
                      <input
                                  id="email"
                                  type="email"
                                  autoComplete="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                  placeholder="you@example.com"
                                />
              </div>div>
              <div>
                      <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
                                Password
                      </label>label>
                      <input
                                  id="password"
                                  type="password"
                                  autoComplete="current-password"
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                  placeholder="password"
                                />
              </div>div>
          {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>p>
              )}
              <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                      >
                {loading ? "Signing in..." : "Sign in"}
              </button>button>
        </form>form>
      )
}</form>
