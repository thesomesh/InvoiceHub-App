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
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

// PAGES

import LoginPage from "./pages/LoginPage";

import RegisterPage from "./pages/RegisterPage";

import DashboardPage from "./pages/DashboardPage";

import CreateInvoicePage from "./pages/CreateInvoicePage";

import InvoicePreviewPage from "./pages/InvoicePreviewPage";
import ReportsPage from "./pages/ReportsPage";
import BusinessProfilePage from "./pages/BusinessProfilePage";

import InventoryPage from "./pages/InventoryPage";
import ExpensePage from "./pages/ExpensePage";
const AppContent = () => {
  return (
    <BrowserRouter>
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
  <Sidebar />

 <main className="flex-1 ml-56 flex-col">
  
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
/><Route
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
<Footer/>
</div>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;