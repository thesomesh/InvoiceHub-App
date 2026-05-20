import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const BrandLogo = () => {
  const [logoMissing, setLogoMissing] = useState(false);
  const { dark } = useTheme();

  return (
    <Link
      to="/dashboard"
      className="flex items-center py-1"
      style={{ color: "var(--accent)" }}
      aria-label="InvoiceHub home"
    >
      {!logoMissing && (
        <img
          src={dark ? "/logo-dark.png" : "/logo.png"}
          alt="InvoiceHub"
          className="h-14 md:h-16 w-auto object-contain"
          onError={() => setLogoMissing(true)}
        />
      )}

      {logoMissing && (
        <>
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
            style={{ background: "var(--accent)" }}
          >
            OB
          </span>
          <span>InvoiceHub</span>
        </>
      )}
    </Link>
  );
};

export default BrandLogo;