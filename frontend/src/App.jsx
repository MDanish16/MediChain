import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PublicVerifyPage from './pages/PublicVerifyPage';
import BlockchainExplorerPage from './pages/BlockchainExplorerPage';
import DashboardLayout from './layouts/DashboardLayout';
import ManufacturerDashboard from './dashboards/ManufacturerDashboard';
import DistributorDashboard from './dashboards/DistributorDashboard';
import WholesalerDashboard from './dashboards/WholesalerDashboard';
import PharmacyDashboard from './dashboards/PharmacyDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<PublicVerifyPage />} />
          <Route path="/verify/:batchId" element={<PublicVerifyPage />} />
          <Route path="/explorer" element={<BlockchainExplorerPage />} />

          {/* Protected Dashboard Layouts */}
          <Route path="/admin" element={<DashboardLayout allowedRoles={['SUPER_ADMIN']} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="*" element={<AdminDashboard />} />
          </Route>

          <Route path="/manufacturer" element={<DashboardLayout allowedRoles={['MANUFACTURER']} />}>
            <Route index element={<ManufacturerDashboard />} />
            <Route path="*" element={<ManufacturerDashboard />} />
          </Route>

          <Route path="/distributor" element={<DashboardLayout allowedRoles={['DISTRIBUTOR']} />}>
            <Route index element={<DistributorDashboard />} />
            <Route path="*" element={<DistributorDashboard />} />
          </Route>

          <Route path="/wholesaler" element={<DashboardLayout allowedRoles={['WHOLESALER']} />}>
            <Route index element={<WholesalerDashboard />} />
            <Route path="*" element={<WholesalerDashboard />} />
          </Route>

          <Route path="/pharmacy" element={<DashboardLayout allowedRoles={['PHARMACY']} />}>
            <Route index element={<PharmacyDashboard />} />
            <Route path="*" element={<PharmacyDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

