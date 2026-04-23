import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Toast from './components/Toast'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import CheckReserved from './pages/CheckReserved'
import ImportExcel from './pages/ImportExcel'
import BuildingControl from './pages/BuildingControl'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login"           element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected */}
              <Route path="/"         element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><CheckReserved /></ProtectedRoute>} />
              <Route path="/import"    element={<ProtectedRoute><ImportExcel /></ProtectedRoute>} />
              <Route path="/building"  element={<ProtectedRoute adminOnly><BuildingControl /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toast />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
