import React from "react";

const Footer = () => {
  return (
    <Footer
      className="border-t ml-56"
      style={{
        borderColor:
          "var(--border)",

        background:
          "var(--surface)",
      }}
    >
   <div className="px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* LEFT */}

          <div>
            <h2
              className="text-lg font-extrabold tracking-tight"
              style={{
                color:
                  "var(--text)",
              }}
            >
              InvoiceHub
            </h2>

            <p
              className="text-sm mt-1"
              style={{
                color:
                  "var(--text-muted)",
              }}
            >
              Smart  billing &
              inventory platform.
            </p>
          </div>

          {/* RIGHT */}

          <div
            className="flex flex-wrap items-center gap-3 text-xs"
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            <span>
             Fast Billing
            </span>

            <span>•</span>

            <span>
              Reports
            </span>

            <span>•</span>

            <span>
              Inventory
            </span>
          </div>
        </div>

        {/* BOTTOM */}

        <div
          className="border-t mt-5 pt-4 text-center text-xs"
          style={{
            borderColor:
              "var(--border)",

            color:
              "var(--text-muted)",
          }}
        >
          ©{" "}
          {new Date().getFullYear()}{" "}
          InvoiceHub • Modern invoicing made simple.
        </div>
      </div>
    </Footer>
  );
};

export default Footer;