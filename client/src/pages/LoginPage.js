import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Spinner } from "../components/UI";
import { Eye, EyeOff } from "lucide-react";
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
  const backendMessage =
    err.response?.data?.message ||
    err.response?.data?.error?.message ||
    "";

  const isAccountMissing =
    /no account found/i.test(backendMessage);

  const message = isAccountMissing
    ? "No account found with this email. Please create an account first."
    : backendMessage || "Invalid email or password.";

  setError(message);
}
     finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell page-enter">
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />

      <div className="auth-grid">
        <section className="auth-panel">
          <span className="auth-kicker">Invoice Hub Workspace</span>
          <h1 className="auth-title">Manage invoices with a clean, simple workflow.</h1>
          <p className="auth-subtitle">
           Create professional invoices, track payments, and export PDFs instantly.
          </p>

          <div className="auth-metrics">
            <div className="auth-metric">
              <strong>Fast & Simple</strong>
              <span>Create invoices in minutes</span>
            </div>
            <div className="auth-metric">
              <strong>
Professional PDFs</strong>
              <span>Ready to download and share</span>
            </div>
            <div className="auth-metric">
              <strong>Payment Tracking</strong>
              <span>Monitor pending, partial, and paid invoices</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <h2>Login</h2>
          <p className="mb-6">Enter your account details to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert message={error} type="error" />

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="you@business.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
              />
            </div>

           <div>
  <label className="label">
    Password
  </label>

  <div className="relative">

    <input
      type={
        showPassword
          ? "text"
          : "password"
      }
      name="password"
      className="input"
      placeholder="Enter your password"
      value={form.password}
      onChange={handleChange}
      autoComplete="current-password"
      disabled={loading}
    />

    <button
      type="button"
      onClick={() =>
        setShowPassword(
          !showPassword
        )
      }
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      tabIndex={-1}
    >
      {showPassword ? (
        <EyeOff size={18} />
      ) : (
        <Eye size={18} />
      )}
    </button>

  </div>
</div>
<div className="flex justify-between items-center mt-2 mb-3">
  <div />

  <Link
    to="/forgot-password"
    className="text-sm font-medium hover:underline"
    style={{ color: "var(--accent)" }}
  >
    Forgot Password?
  </Link>
</div>
            <button
              type="submit"
              className="btn-primary auth-submit w-full mt-2"
              disabled={loading}
            >
              {loading ? <><Spinner /> Signing in...</> : "Sign in"}
            </button>
          </form>

          <p className="text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            New here?{" "}
            <Link
              to="/register"
              className="font-semibold"
              style={{ color: "var(--accent)" }}
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;