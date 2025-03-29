"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("signin")

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      navigate("/dashboard")
    } catch (error) {
      alert("Error signing in: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      alert("Verification email sent! Please check your email to verify your account.")
    } catch (error) {
      alert("Error signing up: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      alert("Password reset email sent! Please check your email to reset your password.")
    } catch (error) {
      alert("Error resetting password: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title text-center">ATEM Safety Training App</h2>
            <p className="card-description text-center">Manage your safety training classes and educators</p>
          </div>

          <div className="border-b">
            <div className="grid w-full grid-cols-2">
              <button
                className={`py-2 text-center font-medium ${activeTab === "signin" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("signin")}
              >
                Sign In
              </button>
              <button
                className={`py-2 text-center font-medium ${activeTab === "signup" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("signup")}
              >
                Sign Up
              </button>
            </div>
          </div>

          {activeTab === "signin" ? (
            <form onSubmit={handleSignIn}>
              <div className="card-content space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="label">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={handleResetPassword}
                      disabled={loading || !email}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="card-footer">
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <div className="card-content space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email-signup" className="label">
                    Email
                  </label>
                  <input
                    id="email-signup"
                    type="email"
                    className="input"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password-signup" className="label">
                    Password
                  </label>
                  <input
                    id="password-signup"
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="card-footer">
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? "Signing up..." : "Sign Up"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login

