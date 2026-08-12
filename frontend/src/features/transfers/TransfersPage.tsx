import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { ArrowRightLeft, Plus, Search, CheckCircle, Clock } from 'lucide-react'

export default function TransfersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]             = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [equipmentId, setEquipmentId]     = useState('')
  const [toOrgId, setToOrgId]             = useState('')
  const [reason, setReason]               = useState('')

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['transfers', search],
    queryFn: () => api.get(API_ENDPOINTS.TRANSFERS.BASE, { params: { search } }).then((r) => r.data.data),
  })

  const { data: equipments } = useQuery({
    queryKey: ['equipments-simple'],
    queryFn: () => api.get(API_ENDPOINTS.EQUIPMENT.BASE, { params: { per_page: 100 } }).then((r) => r.data.data),
  })

  const { data: orgs } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: () => api.get(API_ENDPOINTS.ORGANIZATIONS.BASE).then((r) => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(API_ENDPOINTS.TRANSFERS.BASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setIsCreateOpen(false)
      setReason('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipmentId || !toOrgId || !reason) return
    createMutation.mutate({
      equipment_id: equipmentId,
      to_organization_id: toOrgId,
      reason,
      requested_date: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-primary-600" />
            Điều chuyển Thiết bị
          </h1>
          <p className="page-subtitle">Quản lý điều chuyển tài sản thiết bị y tế giữa các Khoa/Phòng</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Tạo phiếu điều chuyển</span>
        </button>
      </div>

      <div className="card p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã điều chuyển, tên thiết bị..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Thiết bị</th>
                <th>Khoa/Phòng nguồn</th>
                <th>Khoa/Phòng đích</th>
                <th>Lý do điều chuyển</th>
                <th>Trạng thái</th>
                <th>Ngày yêu cầu</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={7}><div className="skeleton h-8 w-full" /></td></tr>
                ))
              ) : !transfers?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Chưa có phiếu điều chuyển nào.
                  </td>
                </tr>
              ) : (
                transfers.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-xs font-bold text-slate-800">{t.code}</td>
                    <td>
                      <p className="font-semibold text-slate-900 text-sm">{t.equipment?.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{t.equipment?.equipment_code}</p>
                    </td>
                    <td className="text-sm text-slate-600">{t.from_organization?.name || 'Chưa phân bổ'}</td>
                    <td className="text-sm font-semibold text-primary-700">{t.to_organization?.name}</td>
                    <td className="text-sm text-slate-700">{t.reason}</td>
                    <td><span className="badge badge-blue">{t.status || 'Chờ duyệt'}</span></td>
                    <td className="text-xs text-slate-500">{t.requested_date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary-600" />
                Tạo phiếu điều chuyển mới
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
                      {eq.equipment_code} - {eq.name} ({eq.organization?.name || 'Kho'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Khoa/Phòng chuyển đến *</label>
                <select
                  required
                  value={toOrgId}
                  onChange={(e) => setToOrgId(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">-- Chọn Khoa/Phòng đích --</option>
                  {orgs?.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do điều chuyển *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ghi rõ lý do điều chuyển thiết bị..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 py-2 text-sm">
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo điều chuyển'}
                </button>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-outline flex-1 py-2 text-sm">
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
