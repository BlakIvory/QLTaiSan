import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { Calendar, Search, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react'

export default function MaintenancePage() {
  const [search, setSearch] = useState('')

  const { data: plans, isLoading } = useQuery({
    queryKey: ['maintenance-plans', search],
    queryFn: () => api.get(API_ENDPOINTS.MAINTENANCE.PLANS, { params: { search } }).then((r) => r.data.data),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            Lịch & Kế hoạch Bảo trì Định kỳ
          </h1>
          <p className="page-subtitle">
            Theo dõi chu kỳ bảo trì, lên lịch nhắc nhở và ghi nhận kết quả bảo trì thiết bị
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kế hoạch bảo trì theo mã thiết bị, tên..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Thiết bị</th>
                <th>Khoa / Phòng</th>
                <th>Chu kỳ (Ngày)</th>
                <th>Lần bảo trì gần nhất</th>
                <th>Lần bảo trì tiếp theo</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={6}><div className="skeleton h-8 w-full" /></td></tr>
                ))
              ) : !plans?.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Hiện tại tất cả thiết bị đều tuân thủ lịch bảo trì.
                  </td>
                </tr>
              ) : (
                plans.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <p className="font-semibold text-slate-900 text-sm">{p.equipment?.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.equipment?.equipment_code}</p>
                    </td>
                    <td className="text-sm text-slate-600">{p.equipment?.organization?.name || '—'}</td>
                    <td className="font-mono text-sm font-semibold">{p.cycle_days || 180} ngày</td>
                    <td className="text-xs text-slate-500">{p.last_maintenance_date || 'Chưa thực hiện'}</td>
                    <td className="text-xs font-semibold text-slate-800">{p.next_maintenance_date || '—'}</td>
                    <td><span className="badge badge-amber">Đã lên lịch</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
