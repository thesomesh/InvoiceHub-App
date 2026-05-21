import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Spinner } from "../components/UI";

const initialForm = {
  name: "",
  email: "",
  password: "",
  businessName: "",
  phone: "",
  address: "",
  gstin: "",
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setGlobalError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password || form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!form.businessName.trim()) newErrors.businessName = "Business name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.gstin) delete payload.gstin;
      await register(payload);
      navigate("/dashboard");
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        serverErrors.forEach(({ field, message }) => {
          mapped[field] = message;
        });
        setErrors(mapped);
      } else {
        setGlobalError(
          err.response?.data?.message ||
            err.response?.data?.error?.message ||
            err.message ||
            "Registration failed"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = "text", placeholder = "", required = true) => (
    <div>
      <label className="label">{label}{required && " *"}</label>
      <input
        type={type}
        name={name}
        className={`input ${errors[name] ? "border-[var(--danger)]" : ""}`}
        placeholder={placeholder}
        value={form[name]}
        onChange={handleChange}
        disabled={loading}
      />
      {errors[name] && (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="auth-shell page-enter">
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />

      <div className="auth-grid">
        <section className="auth-panel">
          <span className="auth-kicker">Create Workspace</span>
          <h1 className="auth-title">Build Professional Invoices Easily</h1>
          <p className="auth-subtitle">
           Manage your business invoices quickly with a simple and secure invoicing platform.
          </p>

          <div className="auth-metrics">
            <div className="auth-metric">
              <strong>Secure & Simple</strong>
              <span>Built for smooth business invoicing.</span>
            </div>
            <div className="auth-metric">
              <strong>Professional Experience</strong>
              <span>Manage your work with a clean and modern experience.</span>
            </div>
            <div className="auth-metric">
              <strong>Easy Sharing</strong>
              <span>Download and send invoices instantly.</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <h2>Register</h2>
          <p className="mb-6">Create your account to begin invoicing.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert message={globalError} type="error" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("name", "Full Name", "text", "Enter your full name")}
              {field("businessName", "Business Name", "text", "Enter your business name.")}
            </div>

            {field("email", "Email Address", "email", "you@business.com")}
            {field("password", "Password", "password", "Create a strong password")}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("phone", "Phone", "tel", "Enter your phone number")}
              <div>
                <label className="label">GSTIN (optional)</label>
                <input
                  type="text"
                  name="gstin"
                  className={`input font-mono text-xs tracking-wider ${errors.gstin ? "border-[var(--danger)]" : ""}`}
                  placeholder="GSTIN (Optional)"
                  value={form.gstin}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.gstin && (
                  <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                    {errors.gstin}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Business Address *</label>
              <textarea
                name="address"
                className={`input resize-none h-20 ${errors.address ? "border-[var(--danger)]" : ""}`}
                placeholder="Enter your business address"
                value={form.address}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.address && (
                <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                  {errors.address}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit w-full mt-2"
              disabled={loading}
            >
              {loading ? <><Spinner /> Creating account...</> : "Create account"}
            </button>
          </form>

          <p className="text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
