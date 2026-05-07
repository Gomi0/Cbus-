
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import Toast from './components/Toast'
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
              <Route path="/"          element={<ImportExcel />} />
              <Route path="/dashboard" element={<CheckReserved />} />
              <Route path="/import"    element={<Navigate to="/" replace />} />
              <Route path="/building"  element={<BuildingControl />} />

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

