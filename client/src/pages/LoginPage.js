import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Spinner } from "../components/UI";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const isAccountMissing =
        err.response?.status === 404 ||
        /no account found/i.test(String(err.response?.data?.message || ""));

      const message =
        isAccountMissing
          ? "No account found with this email. Please create an account first."
          :
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell page-enter">
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />

      <div className="auth-grid">
        <section className="auth-panel">
          <span className="auth-kicker">Invoice Workspace</span>
          <h1 className="auth-title">Welcome back to your billing command center.</h1>
          <p className="auth-subtitle">
            Sign in to create polished invoices, track payment status, and ship shareable PDFs in minutes.
          </p>

          <div className="auth-metrics">
            <div className="auth-metric">
              <strong>3 min</strong>
              <span>Average invoice creation</span>
            </div>
            <div className="auth-metric">
              <strong>PDF ready</strong>
              <span>One-click export quality</span>
            </div>
            <div className="auth-metric">
              <strong>Live status</strong>
              <span>Draft, sent, paid tracking</span>
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
              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
              />
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