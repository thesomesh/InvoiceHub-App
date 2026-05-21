import React from "react";

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

import Footer from "./components/Footer";

// PAGES

import LoginPage from "./pages/LoginPage";

import RegisterPage from "./pages/RegisterPage";

import DashboardPage from "./pages/DashboardPage";

import CreateInvoicePage from "./pages/CreateInvoicePage";

import InvoicePreviewPage from "./pages/InvoicePreviewPage";

import BusinessProfilePage from "./pages/BusinessProfilePage";

import InventoryPage from "./pages/InventoryPage";

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

        <main className="flex-1">
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
        </main>

        <Footer />
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