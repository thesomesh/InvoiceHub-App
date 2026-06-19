import React from "react";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

import {
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  FileText,
  FilePlus2,
  Building2,
  Wallet
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const navLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
     {
      to: "/invoices/create",
      label: "New Invoice",
      icon:FilePlus2 ,
    },
    {
      to: "/inventory",
      label: "Inventory",
      icon: Package,
    },
    {
      to: "/expenses",
      label: "Expenses",
      icon: Receipt,
    },
    {
      to: "/reports",
      label: "Reports",
      icon: BarChart3 ,
    },
   {
  to: "/accounts",
  label: "Accounts",
  icon: Wallet,
},
    {
      to: "/profile/business",
      label: "Business Profile",
      icon: Building2,
    },
  ];

  return (
<aside
  className="
    fixed
    left-0
    w-56
    top-[88px]
h-[calc(100vh-88px)]
    border-r
    bg-white
    flex
    flex-col
    overflow-y-auto
  "

  style={{
    borderColor: "var(--border)",
    background: "var(--surface)",
  }}
>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navLinks.map(
          ({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                font-medium
                transition-all duration-200
                ${
                  location.pathname === to
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          )
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;