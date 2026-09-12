import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import LandingPage from './pages/LandingPage.jsx';
import NewOrderPage from './pages/NewOrderPage.jsx';
import OrderTrackingPage from './pages/OrderTrackingPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import StaffLoginPage from './pages/StaffLoginPage.jsx';
import StaffDashboardPage from './pages/StaffDashboardPage.jsx';
import StaffOrderDetailPage from './pages/StaffOrderDetailPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/order/new" element={<NewOrderPage />} />
            <Route path="/order/:orderId" element={<OrderTrackingPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute>
                  <StaffDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/orders/:orderId"
              element={
                <ProtectedRoute>
                  <StaffOrderDetailPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
