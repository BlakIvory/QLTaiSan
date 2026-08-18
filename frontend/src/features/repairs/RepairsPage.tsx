import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import {
  Wrench, Plus, Search, CheckCircle, Clock,
  Eye, SlidersHorizontal, UserCheck, DollarSign
} from 'lucide-react'

interface Repair {
  id: number
  code: string
  equipment?: { id: number; name: string; equipment_code: string }
  technician?: { id: number; name: string }
  repair_unit?: string
  total_cost: number
  start_date?: string
  completion_date?: string
  status: string
  created_at: string
}

const REPAIR_STATUS_LABELS: Record<string, { label: string; class: string }> = {
  NEW:              { label: 'Mới tạo', class: 'badge-gray' },
  RECEIVED:         { label: 'Đã tiếp nhận', class: 'badge-blue' },
  INSPECTING:       { label: 'Đang kiểm tra', class: 'badge-yellow' },
  WAITING_QUOTE:    { label: 'Chờ báo giá', class: 'badge-yellow' },
  WAITING_APPROVAL: { label: 'Chờ phê duyệt', class: 'badge-orange' },
  REPAIRING:        { label: 'Đang sửa chữa', class: 'badge-purple' },
  WAITING_PARTS:    { label: 'Chờ linh kiện', class: 'badge-purple' },
  COMPLETED:        { label: 'Đã hoàn thành', class: 'badge-green' },
  HANDED_OVER:      { label: 'Đã bàn giao', class: 'badge-green font-bold' },
  UNREPAIRABLE:     { label: 'Không thể sửa', class: 'badge-red' },
  CANCELLED:        { label: 'Đã hủy', class: 'badge-gray' },
}

export default function RepairsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form state
  const [equipmentId, setEquipmentId] = useState('')
  const [repairUnit, setRepairUnit]   = useState('Nội bộ')
  const [partsCost, setPartsCost]     = useState('0')
  const [laborCost, setLaborCost]     = useState('0')

  const { data: repairs, isLoading } = useQuery<Repair[]>({
    queryKey: ['repairs', search, statusFilter],
    queryFn: () =>
      api.get(API_ENDPOINTS.REPAIRS.BASE, { params: { search, status: statusFilter } }).then((r) => r.data.data),
  })

  const { data: equipments } = useQuery({
    queryKey: ['equipments-simple'],
    queryFn: () => api.get(API_ENDPOINTS.EQUIPMENT.BASE, { params: { per_page: 100 } }).then((r) => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(API_ENDPOINTS.REPAIRS.BASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setIsCreateOpen(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipmentId) return
    const pCost = parseFloat(partsCost) || 0
    const lCost = parseFloat(laborCost) || 0
    createMutation.mutate({
      equipment_id: equipmentId,
      repair_unit: repairUnit,
      parts_cost: pCost,
      labor_cost: lCost,
      total_cost: pCost + lCost,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Wrench className="w-6 h-6 text-purple-600" />
            Quản lý Sửa chữa Thiết bị
          </h1>
          <p className="page-subtitle">
            Theo dõi tiến độ, chi phí sửa chữa và nghiệm thu bàn giao thiết bị
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phiếu sửa chữa</span>
        </button>
      </div>

      {/* Filter */}
      <div className="card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vui lòng nhập mã phiếu hoặc tên thiết bị"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(REPAIR_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Thiết bị</th>
                <th>Đơn vị thực hiện</th>
                <th>Tổng chi phí (VNĐ)</th>
                <th>Trạng thái</th>
                <th>Ngày bắt đầu</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div className="skeleton h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : !repairs?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Chưa có phiếu sửa chữa nào.
                  </td>
                </tr>
              ) : (
                repairs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-xs font-bold text-slate-800">{r.code}</td>
                    <td>
                      <p className="font-semibold text-slate-900 text-sm">{r.equipment?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400 font-mono">{r.equipment?.equipment_code}</p>
                    </td>
                    <td className="text-sm text-slate-600">{r.repair_unit || 'Nội bộ'}</td>
                    <td className="font-mono text-sm font-semibold text-slate-900">
                      {(r.total_cost ?? 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          REPAIR_STATUS_LABELS[r.status]?.class ?? 'badge-gray'
                        }`}
                      >
                        {REPAIR_STATUS_LABELS[r.status]?.label ?? r.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {r.start_date ? new Date(r.start_date).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="text-right">
                      <button
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

      {/* Modal Create */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-600" />
                Tạo phiếu sửa chữa mới
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn thiết bị *</label>
                <select
                  required
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị sửa chữa</label>
                <input
                  type="text"
                  value={repairUnit}
                  onChange={(e) => setRepairUnit(e.target.value)}
                  placeholder="Vui lòng nhập đơn vị sửa chữa"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chi phí linh kiện (₫)</label>
                  <input
                    type="number"
                    value={partsCost}
                    onChange={(e) => setPartsCost(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chi phí nhân công (₫)</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1 py-2 text-sm"
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo phiếu sửa chữa'}
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
    </div>
  )
}
