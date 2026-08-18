import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import {
  AlertTriangle, Plus, Search, CheckCircle, Clock,
  UserCheck, SlidersHorizontal, Eye, Wrench
} from 'lucide-react'

interface DamageReport {
  id: number
  code: string
  equipment?: { id: number; name: string; equipment_code: string }
  organization?: { id: number; name: string }
  reported_by_user?: { id: number; name: string }
  detected_at: string
  description: string
  priority: string
  status: string
  created_at: string
}

const PRIORITY_LABELS: Record<string, { label: string; class: string }> = {
  LOW:      { label: 'Thấp', class: 'bg-slate-100 text-slate-700' },
  MEDIUM:   { label: 'Trung bình', class: 'bg-blue-100 text-blue-700' },
  HIGH:     { label: 'Cao', class: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Khẩn cấp', class: 'bg-red-100 text-red-700 font-bold' },
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  NEW:       { label: 'Mới báo', class: 'badge-red' },
  ASSIGNED:  { label: 'Đã giao kỹ thuật', class: 'badge-yellow' },
  IN_REPAIR: { label: 'Đang sửa chữa', class: 'badge-purple' },
  RESOLVED:  { label: 'Đã giải quyết', class: 'badge-green' },
  CLOSED:    { label: 'Đã đóng', class: 'badge-gray' },
}

export default function DamageReportsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null)

  // Form state
  const [equipmentId, setEquipmentId] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState('MEDIUM')

  // Fetch reports
  const { data: reports, isLoading } = useQuery<DamageReport[]>({
    queryKey: ['damage-reports', search, statusFilter],
    queryFn: () =>
      api
        .get(API_ENDPOINTS.DAMAGE_REPORTS.BASE, { params: { search, status: statusFilter } })
        .then((r) => r.data.data),
  })

  // Fetch equipments list for select
  const { data: equipments } = useQuery({
    queryKey: ['equipments-simple'],
    queryFn: () => api.get(API_ENDPOINTS.EQUIPMENT.BASE, { params: { per_page: 100 } }).then((r) => r.data.data),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newReport: any) => api.post(API_ENDPOINTS.DAMAGE_REPORTS.BASE, newReport),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setIsCreateOpen(false)
      setDescription('')
      setEquipmentId('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipmentId || !description) return
    createMutation.mutate({
      equipment_id: equipmentId,
      description,
      priority,
      detected_at: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Báo hỏng Thiết bị
          </h1>
          <p className="page-subtitle">
            Tiếp nhận sự cố, sự cố hư hỏng thiết bị và phân công kỹ thuật xử lý
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo báo hỏng mới</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vui lòng nhập mã sự cố hoặc tên thiết bị"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Mã báo hỏng</th>
                <th>Thiết bị sự cố</th>
                <th>Khoa / Phòng</th>
                <th>Mô tả sự cố</th>
                <th>Mức ưu tiên</th>
                <th>Trạng thái</th>
                <th>Ngày báo</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}>
                      <div className="skeleton h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : !reports?.length ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Chưa có báo hỏng nào.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-xs font-bold text-slate-800">
                      {report.code}
                    </td>
                    <td>
                      <p className="font-semibold text-slate-900 text-sm">
                        {report.equipment?.name ?? '—'}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {report.equipment?.equipment_code}
                      </p>
                    </td>
                    <td className="text-sm text-slate-600">
                      {report.organization?.name ?? '—'}
                    </td>
                    <td className="text-sm text-slate-700 max-w-xs truncate">
                      {report.description}
                    </td>
                    <td>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          PRIORITY_LABELS[report.priority]?.class ?? ''
                        }`}
                      >
                        {PRIORITY_LABELS[report.priority]?.label ?? report.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          STATUS_LABELS[report.status]?.class ?? 'badge-gray'
                        }`}
                      >
                        {STATUS_LABELS[report.status]?.label ?? report.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(report.detected_at || report.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Damage Report */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Tạo báo hỏng thiết bị mới
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn thiết bị sự cố *
                </label>
                <select
                  required
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Chọn thiết bị --</option>
                  {equipments?.map((eq: any) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.equipment_code} - {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức độ ưu tiên *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="LOW">Thấp (Không ảnh hưởng ngay)</option>
                  <option value="MEDIUM">Trung bình (Ảnh hưởng một phần)</option>
                  <option value="HIGH">Cao (Không thể hoạt động)</option>
                  <option value="CRITICAL">Khẩn cấp (Cấp cứu / Hồi sức)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả hiện tượng sự cố *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vui lòng nhập mô tả hư hỏng"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1 py-2 text-sm"
                >
                  {createMutation.isPending ? 'Đang gửi...' : 'Gửi báo hỏng'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-outline flex-1 py-2 text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Chi tiết Báo hỏng #{selectedReport.code}
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(selectedReport.detected_at || selectedReport.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
                <div>
                  <p className="text-xs text-slate-400">Thiết bị</p>
                  <p className="font-semibold text-slate-800">{selectedReport.equipment?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Mã thiết bị</p>
                  <p className="font-mono text-slate-800">{selectedReport.equipment?.equipment_code}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">Mô tả sự cố</p>
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-slate-800 text-xs">
                  {selectedReport.description}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span
                  className={`badge ${
                    STATUS_LABELS[selectedReport.status]?.class ?? 'badge-gray'
                  }`}
                >
                  {STATUS_LABELS[selectedReport.status]?.label ?? selectedReport.status}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    PRIORITY_LABELS[selectedReport.priority]?.class ?? ''
                  }`}
                >
                  Ưu tiên: {PRIORITY_LABELS[selectedReport.priority]?.label}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="btn-outline w-full py-2 text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
