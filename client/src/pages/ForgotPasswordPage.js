import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Spinner } from "../components/UI";
import { authAPI } from "../services/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
const [emailSent, setEmailSent] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      // Backend API (enable later)
    await authAPI.forgotPassword(email);

      // Temporary Success
      setEmailSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell page-enter">
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />

      <div className="auth-grid">
        {/* LEFT PANEL */}

     <section className="auth-panel">
  <span className="auth-kicker">
    Invoice Hub Workspace
  </span>

  <h1 className="auth-title">
    Reset your password
  </h1>

  <p className="auth-subtitle">
    Enter the email associated with your account to receive
    a secure password reset link.
  </p>
</section>

        {/* RIGHT CARD */}
<section className="auth-card">
  {!emailSent ? (
    <>
      <h2>Forgot Password</h2>

      <p
        className="mb-6"
        style={{ color: "var(--text-muted)" }}
      >
        We'll email you a secure password reset link.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <Alert
          message={error}
          type="error"
        />

        <div>
          <label className="label">
            Email Address
          </label>

          <input
            type="email"
            className="input"
            placeholder="you@business.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn-primary auth-submit w-full mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner />
              Sending...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </form>

      <p
        className="text-sm mt-6 text-center"
        style={{
          color: "var(--text-muted)",
        }}
      >
        <Link
          to="/login"
          className="font-semibold"
          style={{
            color: "var(--accent)",
          }}
        >
          Back to Sign In
        </Link>
      </p>
    </>
  ) : (
    <>
      <h2>Check your email</h2>

      <p
        className="mt-4"
        style={{
          color: "var(--text-muted)",
          lineHeight: "1.7",
        }}
      >
        If an account exists for{" "}
        <strong>{email}</strong>,
        we've sent a password reset link.
      </p>

      <p
        className="mt-4"
        style={{
          color: "var(--text-muted)",
        }}
      >
        Please check your inbox and spam folder.
      </p>

     
    </>
  )}
</section>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;