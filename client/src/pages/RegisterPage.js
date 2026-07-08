import React, { useState, useEffect ,useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Spinner } from "../components/UI";
import { authAPI } from "../services/api";

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
const [otp, setOtp] = useState(["","","","","",""]);
const otpRef = useRef(null);
const otpRefs = useRef([]);
const [otpSent,setOtpSent]=useState(false);
const [emailVerified, setEmailVerified] = useState(false);

const [verifyingOTP, setVerifyingOTP] = useState(false);
const [sendingOTP,setSendingOTP]=useState(false);

const [timer, setTimer] = useState(0);

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
     const payload = {
  ...form,
     otp: otp.join(""),
  timezone:
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone
};   
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
const sendOTP = async ()=>{

    if(!form.email){

        setGlobalError("Enter email first");

        return;
    }

    try{

        setSendingOTP(true);

        await authAPI.sendOTP(form.email);

       setOtpSent(true);
setTimer(120);

     setTimeout(() => {
    otpRef.current?.focus();
}, 100);

    }catch(err){

        setGlobalError(
            err.response?.data?.message ||
            "Unable to send OTP"
        );

    }finally{

        setSendingOTP(false);

    }

};


useEffect(() => {
  let interval;

  if (timer > 0) {
    interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
  }

  return () => clearInterval(interval);
}, [timer]);

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};


const handleOtpChange = async (value, index) => {

    if (!/^\d*$/.test(value)) return;

    const updated = [...otp];

    updated[index] = value.slice(-1);

    setOtp(updated);
    const enteredOTP = updated.join("");

if (enteredOTP.length === 6) {

    try {

        setVerifyingOTP(true);

        await authAPI.verifyOTP({
            email: form.email,
            otp: enteredOTP,
        });

        setEmailVerified(true);

        document
            .querySelector('input[name="password"]')
            ?.focus();

    } catch (err) {

        setGlobalError(
            err.response?.data?.message ||
            "Invalid OTP"
        );

        setOtp(["","","","","",""]);

        otpRefs.current[0]?.focus();

    } finally {

        setVerifyingOTP(false);

    }

}

    if (value && index < 5) {
        otpRefs.current[index + 1].focus();
    }

};

const handleOtpKeyDown = (e,index)=>{

    if(e.key==="Backspace" && !otp[index] && index>0){

        otpRefs.current[index-1].focus();

    }

};








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

           <div>
  <label className="label">Email Address *</label>

  <div className="relative">
    <input
      type="email"
      name="email"
    className={`input pr-36 ${errors.email ? "border-[var(--danger)]" : ""}`}
      placeholder="you@business.com"
      value={form.email}
      onChange={handleChange}
     disabled={
    loading ||
    timer > 0 ||
    emailVerified
}
    />
<div className="absolute right-2 inset-y-0 flex items-center">

{emailVerified ? (

<div className="w-10 h-10 rounded-full
bg-green-500/20
border border-green-500/30
flex items-center justify-center">

<svg
xmlns="http://www.w3.org/2000/svg"
className="w-5 h-5 text-green-400"
fill="none"
viewBox="0 0 24 24"
stroke="currentColor"
>
<path
strokeLinecap="round"
strokeLinejoin="round"
strokeWidth="2"
d="M5 13l4 4L19 7"
/>
</svg>

</div>

) : otpSent ? (

<div
className="px-4 py-2 rounded-lg text-sm font-medium"
style={{
    background: "rgba(59,130,246,.12)",
    color: "#60A5FA",
}}
>
OTP Sent
</div>

) : (

<button
type="button"
onClick={sendOTP}
disabled={sendingOTP}
className="btn-primary text-sm px-4 py-2 rounded-lg"
>
{sendingOTP ? "Sending..." : "Send OTP"}
</button>

)}

</div>
  </div>
{otpSent && (

<div
className="mt-3
rounded-xl
border border-green-500/20
bg-green-500/5
px-4 py-3
flex justify-between items-center"
>

<div>

{emailVerified ? (

<>
<p className="text-green-400 font-medium">
✓ Email verified successfully
</p>


</>

) : (

<>
<p className="text-green-400 font-medium">
✓ OTP sent successfully
</p>

<p className="text-xs text-gray-400 mt-1">
We've sent a verification code to
<span className="ml-1 font-medium">
    {form.email}
</span>
</p>
</>

)}

</div>

<div>

{emailVerified ? (

<div className="text-right">
<p
className="font-semibold text-green-400"
>
Verified
</p>
</div>

) : timer > 0 ? (

<div className="text-right">

<p
className="text-xs"
style={{ color: "var(--text-muted)" }}
>
Resend in
</p>

<p
className="font-semibold"
style={{ color: "var(--text-primary)" }}
>
{formatTime(timer)}
</p>

</div>

) : (

<button
type="button"
onClick={sendOTP}
className="text-blue-400 hover:text-blue-300 font-medium"
>
Resend
</button>

)}

</div>
</div>

)}
  {errors.email && (
    <p className="text-xs mt-1 text-red-500">{errors.email}</p>
  )}
</div>
           {otpSent && !emailVerified && (

<div>

<label className="label">
Email OTP
</label>

<div className="flex gap-3 mt-3">

{otp.map((digit,index)=>(

<input
key={index}
ref={(el)=>otpRefs.current[index]=el}
type="text"
inputMode="numeric"
maxLength={1}
value={digit}
onChange={(e)=>handleOtpChange(e.target.value,index)}
onKeyDown={(e)=>handleOtpKeyDown(e,index)}
className={`
input
!w-14
!h-14
!p-0
!text-center
!text-xl
font-bold
transition-all
${digit ? "border-[var(--accent)]" : ""}
`}
style={{
    color: "var(--text-primary)",
    background: "var(--surface)",
}}
/>

))}

</div>



</div>
)}
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
