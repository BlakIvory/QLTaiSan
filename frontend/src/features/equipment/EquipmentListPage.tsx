import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Popconfirm, message } from 'antd'
import api from '../../api/axios'
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_COLORS,
  IMPORTANCE_LABELS,
  API_ENDPOINTS,
} from '../../lib/constants'
import {
  Search, Plus, QrCode, Eye, Edit, Trash2,
  FileSpreadsheet, SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react'

import { useOptions } from '../../hooks/useOptions'

interface Equipment {
  id: number
  equipment_code: string
  asset_code?: string
  name: string
  model?: string
  serial_number?: string
  manufacturer?: string
  origin_country?: string
  manufacturing_year?: number
  status: string
  importance_level: string
  current_location?: string
  organization?: { id: number; name: string }
  equipment_type?: { id: number; name: string }
  created_at: string
}

export default function EquipmentListPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [orgFilter, setOrgFilter]       = useState('')
  const [page, setPage]                 = useState(1)
  const [selectedQr, setSelectedQr]     = useState<Equipment | null>(null)

  // Delete Equipment Mutation with Confirmation
  const deleteMutation = useMutation({
    mutationFn: (eqId: number) => api.delete(`${API_ENDPOINTS.EQUIPMENT.BASE}/${eqId}`),
    onSuccess: () => {
      message.success('Xóa thiết bị thành công.')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa thiết bị.')
    },
  })

  // Fetch combobox options from Backend API
  const { getOptionList } = useOptions(['equipment_status'])
  const statusOptions = getOptionList('equipment_status')

  // Fetch equipment list
  const { data, isLoading } = useQuery({
    queryKey: ['equipment', search, statusFilter, orgFilter, page],
    queryFn: () =>
      api
        .get(API_ENDPOINTS.EQUIPMENT.BASE, {
          params: {
            search,
            status: statusFilter,
            organization_id: orgFilter,
            page,
            per_page: 15,
          },
        })
        .then((r) => r.data),
  })

  // Fetch organizations for filter dropdown
  const { data: orgs } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: () => api.get(API_ENDPOINTS.ORGANIZATIONS.BASE).then((r) => r.data.data),
  })

  const equipments: Equipment[] = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Quản lý Trang thiết bị</h1>
          <p className="page-subtitle">
            Danh sách tất cả thiết bị y tế trong hệ thống bệnh viện
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <Link to="/equipment/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Thêm thiết bị mới</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search bar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Vui lòng nhập tên, mã thiết bị, model hoặc serial"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full md:w-48 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Organization Filter */}
            <select
              value={orgFilter}
              onChange={(e) => {
                setOrgFilter(e.target.value)
                setPage(1)
              }}
              className="w-full md:w-48 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="">Tất cả khoa/phòng</option>
              {orgs?.map((org: any) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Mã / Tên thiết bị</th>
                <th>Loại thiết bị</th>
                <th>Khoa / Phòng</th>
                <th>Model / Serial</th>
                <th>Trạng thái</th>
                <th>Mức độ quan trọng</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div className="skeleton h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : equipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Chưa có thiết bị nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                equipments.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedQr(eq)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="Xem mã QR"
                        >
                          <QrCode className="w-4 h-4 text-blue-600" />
                        </button>
                        <div>
                          <Link
                            to={`/equipment/${eq.id}`}
                            className="font-medium text-slate-900 hover:text-primary-600 transition-colors"
                          >
                            {eq.name}
                          </Link>
                          <p className="text-xs text-slate-500 font-mono">
                            {eq.equipment_code} {eq.asset_code ? `· ${eq.asset_code}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 text-sm">
                      {eq.equipment_type?.name ?? '—'}
                    </td>
                    <td className="text-slate-600 text-sm">
                      {eq.organization?.name ?? 'Chưa phân bổ'}
                    </td>
                    <td>
                      <p className="text-xs text-slate-700 font-mono">{eq.model || '—'}</p>
                      <p className="text-xs text-slate-400 font-mono">{eq.serial_number || '—'}</p>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          EQUIPMENT_STATUS_COLORS[eq.status] ?? 'badge-gray'
                        }`}
                      >
                        {EQUIPMENT_STATUS_LABELS[eq.status] ?? eq.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-medium text-slate-700">
                        {IMPORTANCE_LABELS[eq.importance_level] ?? eq.importance_level}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/equipment/${eq.id}`}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Link>
                        <Link
                          to={`/equipment/${eq.id}/edit`}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Link>

                        <Popconfirm
                          title="Xác nhận xóa thiết bị"
                          description={`Bạn có chắc chắn muốn xóa thiết bị "${eq.name}" không?`}
                          onConfirm={() => deleteMutation.mutate(eq.id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <button
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </Popconfirm>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Hiển thị {meta.from}–{meta.to} trên tổng số {meta.total} thiết bị
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-3 text-slate-700">
                Trang {page} / {meta.last_page}
              </span>
              <button
                disabled={page === meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost p-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Mã QR Thiết bị</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedQr.name}</p>

            <div className="bg-slate-100 p-6 rounded-xl flex items-center justify-center mb-4 border border-slate-200">
              {/* QR display canvas placeholder / SVG */}
              <div className="w-40 h-40 bg-white p-2 rounded-lg border flex flex-col items-center justify-center shadow-inner">
                <QrCode className="w-28 h-28 text-slate-800" />
                <span className="text-[10px] font-mono text-slate-600 mt-1">
                  {selectedQr.equipment_code}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-mono mb-6">
              Mã: {selectedQr.equipment_code}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="btn-primary flex-1 text-sm py-2"
              >
                In tem QR
              </button>
              <button
                onClick={() => setSelectedQr(null)}
                className="btn-outline flex-1 text-sm py-2"
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
