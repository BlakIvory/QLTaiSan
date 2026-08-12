import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import {
  Package, Wrench, Calendar, AlertTriangle,
  TrendingUp, Activity, Clock, CheckCircle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface DashboardStats {
  total_equipment: number
  in_use: number
  under_repair: number
  under_maintenance: number
  pending_liquidation: number
  warranty_expiring_soon: number
  maintenance_overdue: number
  inspection_expired: number
  pending_repairs: number
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280']

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get(API_ENDPOINTS.DASHBOARD.STATS).then(r => r.data.data),
  })

  const { data: charts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => api.get(API_ENDPOINTS.DASHBOARD.CHARTS).then(r => r.data.data),
  })

  if (isLoading) return <DashboardSkeleton />

  const statCards = [
    { label: 'Tổng thiết bị',         value: stats?.total_equipment ?? 0, icon: Package,     color: 'bg-blue-100 text-blue-700',   change: null },
    { label: 'Đang sử dụng',           value: stats?.in_use ?? 0,          icon: Activity,    color: 'bg-emerald-100 text-emerald-700', change: null },
    { label: 'Đang sửa chữa',          value: stats?.under_repair ?? 0,    icon: Wrench,      color: 'bg-purple-100 text-purple-700', change: null },
    { label: 'Đang bảo trì',           value: stats?.under_maintenance ?? 0, icon: Calendar,  color: 'bg-amber-100 text-amber-700',  change: null },
    { label: 'Chờ thanh lý',           value: stats?.pending_liquidation ?? 0, icon: AlertTriangle, color: 'bg-red-100 text-red-700', change: null },
    { label: 'Sắp hết bảo hành',       value: stats?.warranty_expiring_soon ?? 0, icon: Clock, color: 'bg-orange-100 text-orange-700', change: null },
    { label: 'Quá hạn bảo trì',        value: stats?.maintenance_overdue ?? 0, icon: TrendingUp, color: 'bg-rose-100 text-rose-700', change: null },
    { label: 'Hết hạn kiểm định',      value: stats?.inspection_expired ?? 0, icon: CheckCircle, color: 'bg-slate-100 text-slate-700', change: null },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Tổng quan hệ thống quản lý trang thiết bị bệnh viện</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value.toLocaleString('vi-VN')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repair costs chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">Chi phí sửa chữa theo tháng</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts?.repair_costs ?? []}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 1e6).toFixed(0) + 'M'} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? v.toLocaleString('vi-VN') + ' ₫' : v)} />
                <Area type="monotone" dataKey="total_cost" stroke="#3b82f6" fill="url(#costGrad)" strokeWidth={2} name="Chi phí" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment by status */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">Thiết bị theo trạng thái</h3>
          </div>
          <div className="card-body flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts?.by_status ?? []}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="label"
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(charts?.by_status ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Equipment by organization */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">Số thiết bị theo khoa/phòng</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.by_organization ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Số thiết bị" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <AlertsPanel />
    </div>
  )
}

function AlertsPanel() {
  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => api.get(API_ENDPOINTS.DASHBOARD.ALERTS).then(r => r.data.data),
  })

  if (!alerts?.length) return null

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Cảnh báo gần nhất
        </h3>
        <span className="badge badge-red">{alerts.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {alerts.slice(0, 10).map((alert: any, i: number) => (
          <div key={i} className="flex items-start gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
              alert.severity === 'critical' ? 'bg-red-500' :
              alert.severity === 'warning'  ? 'bg-amber-500' : 'bg-blue-500'
            }`} />
            <div>
              <p className="text-sm text-slate-800">{alert.message}</p>
              <p className="text-xs text-slate-500 mt-0.5">{alert.equipment_name} · {alert.organization_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-7 w-40 mb-2" />
        <div className="skeleton h-4 w-60" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-12 w-12 rounded-xl mb-3" />
            <div className="skeleton h-4 w-24 mb-1" />
            <div className="skeleton h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
