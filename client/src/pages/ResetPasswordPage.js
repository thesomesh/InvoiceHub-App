import React, {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  Alert,
  Spinner,
} from "../components/UI";
import {
    Eye,
    EyeOff
} from "lucide-react";
import { authAPI } from "../services/api";

const ResetPasswordPage = () => {
  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    verifying,
    setVerifying,
  ] = useState(true);

  const [validToken, setValidToken] =
    useState(false);

  const [passwordUpdated,
    setPasswordUpdated] =
    useState(false);

  const [showPassword,
    setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  // Password Strength

  const getPasswordStrength = () => {

    if (!password)
      return {
        label: "",
        color: "",
      };

    let score = 0;

    if (password.length >= 8)
      score++;

    if (/[A-Z]/.test(password))
      score++;

    if (/[a-z]/.test(password))
      score++;

    if (/\d/.test(password))
      score++;

   if (
  /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(password)
)
  score++;
    if (score <= 2)
      return {
        label: "Weak",
        color: "var(--danger)",
      };

    if (score === 3 || score === 4)
      return {
        label: "Medium",
        color: "var(--warning)",
      };

    return {
      label: "Strong",
      color: "var(--success)",
    };
  };

  const strength =
    getPasswordStrength();
const passwordChecks = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(password),
};
  // Verify Token

  useEffect(() => {

    const verifyToken =
      async () => {

      if (!token) {
        setError(
          "Invalid password reset link."
        );

        setVerifying(false);

        return;
      }

      try {

        await authAPI.verifyResetToken(
          token
        );

        setValidToken(true);

      } catch (err) {

        setError(
          err.response?.data?.message ||
          "This password reset link is invalid or has expired."
        );

      } finally {

        setVerifying(false);

      }

    };

    verifyToken();

  }, [token]);

  // Submit

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");

      if (!password.trim()) {

        setError(
          "Please enter a new password."
        );

        return;
      }

     if (password.length < 8) {
  setError(
    "Password must contain at least 8 characters."
  );
  return;
}

if (!/[A-Z]/.test(password)) {
  setError(
    "Password must contain at least one uppercase letter."
  );
  return;
}

if (!/[a-z]/.test(password)) {
  setError(
    "Password must contain at least one lowercase letter."
  );
  return;
}

if (!/\d/.test(password)) {
  setError(
    "Password must contain at least one number."
  );
  return;
}

if (
  !/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(password)
) {
  setError(
    "Password must contain at least one special character."
  );
  return;
}

      if (
        password !==
        confirmPassword
      ) {

        setError(
          "Passwords do not match."
        );

        return;
      }

      try {

        setLoading(true);

        await authAPI.resetPassword(
          token,
          password
        );

        setPasswordUpdated(true);

      } catch (err) {

        setError(
          err.response?.data?.message ||
          "Unable to reset password."
        );

      } finally {

        setLoading(false);

      }

    };

  return (

    <div className="auth-shell page-enter">

      <div className="auth-orb auth-orb-1" />

      <div className="auth-orb auth-orb-2" />

      <div className="auth-grid">

        <section className="auth-panel">

          <span className="auth-kicker">
            Invoice Hub Workspace
          </span>

          <h1 className="auth-title">
            Create a new password
          </h1>

          <p className="auth-subtitle">
          Create a new password to restore secure
           access to your Invoice Hub workspace.
          </p>

        </section>

        <section className="auth-card">

          {verifying ? (

            <div
              style={{
                textAlign: "center",
                padding: "3rem 0",
              }}
            >
              <Spinner />

              <p
                style={{
                  marginTop: "1rem",
                  color:
                    "var(--text-muted)",
                }}
              >
                Verifying reset link...
              </p>

            </div>

          ) : passwordUpdated ? (
<>
  <h2>Password Updated Successfully</h2>

  <p
    className="mt-4"
    style={{
      color: "var(--text-muted)",
      lineHeight: "1.7",
    }}
  >
    Your password has been updated successfully.
    You can now sign in using your new password.
  </p>

  <Link
    to="/login"
    className="btn-primary auth-submit w-full mt-6"
    style={{
      display: "block",
      textAlign: "center",
      textDecoration: "none",
    }}
  >
    Back to Sign In
  </Link>
</>

) : !validToken ? (

<>
  <h2>Reset Link Expired</h2>

  <p
    className="mt-4"
    style={{
      color: "var(--text-muted)",
      lineHeight: "1.7",
    }}
  >
    This password reset link is invalid or has
    expired.

    <br />
    <br />

    Please request a new password reset link.
  </p>

  <Link
    to="/forgot-password"
    className="btn-primary auth-submit w-full mt-6"
    style={{
      display: "block",
      textAlign: "center",
      textDecoration: "none",
    }}
  >
Request New Link
  </Link>

  <Link
    to="/login"
    style={{
      display: "block",
      marginTop: "1rem",
      textAlign: "center",
      color: "var(--text-muted)",
      textDecoration: "none",
    }}
  >
    Back to Sign In
  </Link>
</>

) : (

<>

<h2>Reset Password</h2>

<p
  className="mb-6"
  style={{
    color: "var(--text-muted)",
  }}
>
  Enter your new password below.
</p>

<Alert
  message={error}
  type="error"
/>


<form
  onSubmit={handleSubmit}
  className="space-y-4"
>

<div>

<label className="label">
New Password
</label>

<div className="relative">

<input
  type={
    showPassword
      ? "text"
      : "password"
  }
  className="input"
  placeholder="Create a new password"
  value={password}
  onChange={(e) =>
    setPassword(e.target.value)
  }autoComplete="new-password"
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
>
{showPassword ? (
    <EyeOff size={18} />
) : (
    <Eye size={18} />
)}
</button>

</div>

{password && (
  <div className="mt-3 space-y-2">

    <div
      className="text-sm font-medium"
      style={{ color: strength.color }}
    >
      Password Strength: {strength.label}
    </div>

    <div className="text-xs space-y-1">

      <div
        style={{
          color: passwordChecks.length
            ? "var(--success)"
            : "var(--text-muted)",
        }}
      >
        {passwordChecks.length ? "✓" : "○"} At least 8 characters
      </div>

      <div
        style={{
          color: passwordChecks.uppercase
            ? "var(--success)"
            : "var(--text-muted)",
        }}
      >
        {passwordChecks.uppercase ? "✓" : "○"} One uppercase letter
      </div>

      <div
        style={{
          color: passwordChecks.lowercase
            ? "var(--success)"
            : "var(--text-muted)",
        }}
      >
        {passwordChecks.lowercase ? "✓" : "○"} One lowercase letter
      </div>

      <div
        style={{
          color: passwordChecks.number
            ? "var(--success)"
            : "var(--text-muted)",
        }}
      >
        {passwordChecks.number ? "✓" : "○"} One number
        </div>
        <div
  style={{
    color: passwordChecks.special
      ? "var(--success)"
      : "var(--text-muted)",
  }}
>
  {passwordChecks.special ? "✓" : "○"} One special character
</div>


    </div>

  </div>
)}

</div>

<div>

<label className="label">
Confirm Password
</label>

<div className="relative">
<input
  type={
    showConfirmPassword
      ? "text"
      : "password"
  }
  className="input"
  placeholder="Re-enter your password"
  value={confirmPassword}
  onChange={(e) =>
    setConfirmPassword(
      e.target.value
    )
  }
  onPaste={(e) => e.preventDefault()}
  autoComplete="new-password"
  disabled={loading}
/>

<button
  type="button"
  onClick={() =>
    setShowConfirmPassword(
      !showConfirmPassword
    )
  }
className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
>
{showConfirmPassword ? (
    <EyeOff size={18} />
) : (
    <Eye size={18} />
)}
</button>

</div>

</div>

<button
  type="submit"
  className="btn-primary auth-submit w-full mt-2"
  disabled={loading}
>
  {loading ? (
    <>
      <Spinner />
      Updating...
    </>
  ) : (
    "Reset Password"
  )}
</button>

</form>

<p
  className="text-sm mt-6 text-center"
  style={{
    color:
      "var(--text-muted)",
  }}
>
  <Link
    to="/login"
    style={{
      color:
        "var(--accent)",
      textDecoration: "none",
      fontWeight: 600,
    }}
  >
    Back to Sign In
  </Link>
</p>

</>

)}

</section>

</div>

</div>

);

};

export default ResetPasswordPage;