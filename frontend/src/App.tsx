import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { PrivateRoute, PublicRoute } from './routes/Guards'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './features/auth/LoginPage'
import { lazy, Suspense } from 'react'

// Lazy-loaded pages
const Dashboard     = lazy(() => import('./features/dashboard/DashboardPage'))
const EquipmentList = lazy(() => import('./features/equipment/EquipmentListPage'))
const EquipmentDetail = lazy(() => import('./features/equipment/EquipmentDetailPage'))
const EquipmentForm = lazy(() => import('./features/equipment/EquipmentFormPage'))
const Receipts      = lazy(() => import('./features/receipts/ReceiptsPage'))
const Allocations   = lazy(() => import('./features/allocations/AllocationsPage'))
const Transfers     = lazy(() => import('./features/transfers/TransfersPage'))
const DamageReports = lazy(() => import('./features/damage-reports/DamageReportsPage'))
const Repairs       = lazy(() => import('./features/repairs/RepairsPage'))
const Maintenance   = lazy(() => import('./features/maintenance/MaintenancePage'))
const Inspections   = lazy(() => import('./features/inspections/InspectionsPage'))
const Loans         = lazy(() => import('./features/loans/LoansPage'))
const Inventories   = lazy(() => import('./features/inventories/InventoriesPage'))
const Recalls       = lazy(() => import('./features/recalls/RecallsPage'))
const Liquidations  = lazy(() => import('./features/liquidations/LiquidationsPage'))
const Suppliers     = lazy(() => import('./features/suppliers/SuppliersPage'))
const Contracts     = lazy(() => import('./features/contracts/ContractsPage'))
const Reports       = lazy(() => import('./features/reports/ReportsPage'))
const CategoriesOrgs = lazy(() => import('./features/categories/OrganizationsCategoryPage'))
const CategoriesTypes = lazy(() => import('./features/categories/EquipmentTypesCategoryPage'))
const CategoriesOptions = lazy(() => import('./features/categories/SystemOptionsCategoryPage'))
const Users         = lazy(() => import('./features/users/UsersPage'))
const Roles         = lazy(() => import('./features/roles/RolesPage'))
const AuditLogs     = lazy(() => import('./features/audit-logs/AuditLogsPage'))
const NotFound      = lazy(() => import('./features/NotFoundPage'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-slate-500 text-sm">Đang tải...</p>
    </div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected */}
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Equipment */}
                <Route path="/equipment" element={<EquipmentList />} />
                <Route path="/equipment/create" element={<EquipmentForm />} />
                <Route path="/equipment/:id" element={<EquipmentDetail />} />
                <Route path="/equipment/:id/edit" element={<EquipmentForm />} />

                {/* Operations */}
                <Route path="/receipts/*"        element={<Receipts />} />
                <Route path="/allocations/*"     element={<Allocations />} />
                <Route path="/transfers/*"       element={<Transfers />} />
                <Route path="/damage-reports/*"  element={<DamageReports />} />
                <Route path="/repairs/*"         element={<Repairs />} />
                <Route path="/maintenance/*"     element={<Maintenance />} />
                <Route path="/inspections/*"     element={<Inspections />} />
                <Route path="/loans/*"           element={<Loans />} />
                <Route path="/inventories/*"     element={<Inventories />} />
                <Route path="/recalls/*"         element={<Recalls />} />
                <Route path="/liquidations/*"    element={<Liquidations />} />

                {/* Supplier */}
                <Route path="/suppliers/*"  element={<Suppliers />} />
                <Route path="/contracts/*"  element={<Contracts />} />

                {/* Reports */}
                <Route path="/reports" element={<Reports />} />

                {/* Categories */}
                <Route path="/categories/organizations" element={<CategoriesOrgs />} />
                <Route path="/categories/equipment-types" element={<CategoriesTypes />} />
                <Route path="/categories/system-options" element={<CategoriesOptions />} />

                {/* Admin */}
                <Route path="/users/*"      element={<Users />} />
                <Route path="/roles/*"      element={<Roles />} />
                <Route path="/audit-logs"   element={<AuditLogs />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
