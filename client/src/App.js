import React from "react";
import { Outlet } from "react-router-dom";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import { ThemeProvider } from "./context/ThemeContext";

import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Navbar";

import { useLocation } from "react-router-dom";
// PAGES
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import AccountsPage from "./pages/AccountsPage";
import RegisterPage from "./pages/RegisterPage";
import StatementPage from "./pages/StatementPage";
import DashboardPage from "./pages/DashboardPage";

import CreateInvoicePage from "./pages/CreateInvoicePage";

import InvoicePreviewPage from "./pages/InvoicePreviewPage";
import ReportsPage from "./pages/ReportsPage";
import BusinessProfilePage from "./pages/BusinessProfilePage";

import InventoryPage from "./pages/InventoryPage";
import ExpensePage from "./pages/ExpensePage";
const AppContent = () => {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background:
            "var(--bg)",
        }}
      >
        <Navbar />
<div
  className="flex flex-1"
  style={{
    minHeight: "calc(100vh - 88px)",
  }}
>
 {!isAuthPage && <Sidebar />}

<main
  className={`flex-1 flex-col ${
    !isAuthPage ? "ml-56" : ""
  }`}
>
  
  <div className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/register"
              element={
                <RegisterPage />
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
<Route
  path="/expenses"
  element={
    <ProtectedRoute>
      <ExpensePage />
    </ProtectedRoute>
  }    
/>    


<Route
  path="/accounts"
  element={
    <ProtectedRoute>
      <AccountsPage />
    </ProtectedRoute>
  }
/>
<Route
   path="/accounts/statement/:id"
   
   element={  <ProtectedRoute> <StatementPage />  </ProtectedRoute>}
/>
<Route
  path="/reports"
  element={<ReportsPage />}
/>
            <Route
              path="/invoices/create"
              element={
                <ProtectedRoute>
                  <CreateInvoicePage />
                </ProtectedRoute>
              }
            />
<Route
  path="/create-invoice"
  element={<CreateInvoicePage />}
/>
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute>
                  <InvoicePreviewPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/business"
              element={
                <ProtectedRoute>
                  <BusinessProfilePage />
                </ProtectedRoute>
              }
            />
          </Routes>
       
          </div>
          
        </main>
        
</div>
{!isAuthPage && <Footer />}
</div>

  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;