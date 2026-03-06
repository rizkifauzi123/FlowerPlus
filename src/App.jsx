import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import DashboardCards from "./assets/components/DashboardCard";
import InvoiceDashboard from "./assets/components/Invoice/InvoiceManagement";
import InvoiceTable from "./assets/components/InvoiceTable";
import CreateInvoice from "./assets/components/Invoice/CreateInvoice";
import InvoicePreview from "./assets/components/Invoice/InvoicePreview"; // ← satu file merged
import PaymentTracker from "./assets/components/Payment/paymentTracker";
import ReportsAnalytics from "./assets/components/ReportAnalisis/ReportAnalisis";
import Settings from "./assets/components/Profile/setting";
import Profile from "./assets/components/Profile/Profile";

import Login from "./assets/components/Autentikasi/Login";
import ProtectedRoute from "./assets/routes/ProtectedRoute";

import { AppProvider } from "./context/AppContext";

import "./App.css";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>

          {/* Default Root -> Login */}
          <Route
            path="/"
            element={
              localStorage.getItem("isLoggedIn")
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/login" replace />
            }
          />

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED ROUTE */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >

            {/* DASHBOARD */}
            <Route
              path="/dashboard"
              element={
                <>
                  <DashboardCards />
                  <InvoiceTable />
                </>
              }
            />

            {/* INVOICE */}
            <Route path="/invoice" element={<InvoiceDashboard />} />
            <Route path="/invoice/create" element={<CreateInvoice />} />
            <Route path="/invoice/edit/:id" element={<CreateInvoice />} />
            {/* 
              Satu route untuk preview — handle signed & normal via ?type=
              ?type=signed  → tampil dengan TTD & stamp
              ?type=normal  → tampil tanpa TTD
            */}
            <Route path="/invoice/preview/:id" element={<InvoicePreview />} />

            {/* PAYMENT */}
            <Route path="/payment" element={<PaymentTracker />} />

            {/* REPORT */}
            <Route path="/reports" element={<ReportsAnalytics />} />

            {/* PROFILE */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

          </Route>

          {/* DEFAULT REDIRECT */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;