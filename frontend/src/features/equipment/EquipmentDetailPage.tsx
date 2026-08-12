import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS, EQUIPMENT_STATUS_COLORS, EQUIPMENT_STATUS_LABELS } from '../../lib/constants'
import {
  Package, ArrowLeft, Edit, Building, Calendar,
  ShieldCheck, Wrench
} from 'lucide-react'

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: equipment, isLoading, isError } = useQuery({
    queryKey: ['equipment-detail', id],
    queryFn: () => api.get(`${API_ENDPOINTS.EQUIPMENT.BASE}/${id}`).then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Đang tải thông tin chi tiết thiết bị...</p>
      </div>
    )
  }

  if (isError || !equipment) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto space-y-4">
        <p className="text-rose-600 font-semibold">Không tìm thấy thông tin thiết bị hoặc đã bị xóa.</p>
        <Link to="/equipment" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/equipment"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{equipment.name}</h1>
              <span className={`badge ${EQUIPMENT_STATUS_COLORS[equipment.status] ?? 'badge-gray'}`}>
                {EQUIPMENT_STATUS_LABELS[equipment.status] ?? equipment.status}
              </span>
            </div>
            <p className="page-subtitle font-mono">
              Mã hệ thống: {equipment.equipment_code} {equipment.asset_code ? `· Mã TS: ${equipment.asset_code}` : ''}
            </p>
          </div>
        </div>

        <Link to={`/equipment/${id}/edit`} className="btn-primary flex items-center gap-2">
          <Edit className="w-4 h-4" />
          <span>Chỉnh sửa thiết bị</span>
        </Link>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 border-b pb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Thông tin kỹ thuật
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Loại thiết bị:</span>
                <span className="font-medium text-slate-800">{equipment.equipment_type?.name ?? '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Model:</span>
                <span className="font-medium text-slate-800">{equipment.model || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Số Serial:</span>
                <span className="font-mono text-slate-800">{equipment.serial || equipment.serial_number || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Năm sản xuất:</span>
                <span className="font-medium text-slate-800">{equipment.year_of_manufacture || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Nhà sản xuất:</span>
                <span className="font-medium text-slate-800">{equipment.manufacturer?.name ?? '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Xuất xứ (Quốc gia):</span>
                <span className="font-medium text-slate-800">{equipment.country?.name ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 border-b pb-3 flex items-center gap-2">
              <Building className="w-5 h-5 text-primary-600" />
              Phân bổ & Giá trị
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Khoa / Phòng quản lý:</span>
                <span className="font-medium text-slate-800">{equipment.organization?.name ?? 'Chưa phân bổ (Lưu kho)'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Vị trí lắp đặt:</span>
                <span className="font-medium text-slate-800">{equipment.location?.name ?? '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Nguyên giá:</span>
                <span className="font-semibold text-emerald-600">
                  {equipment.original_price ? Number(equipment.original_price).toLocaleString('vi-VN') + ' ₫' : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Mức độ quan trọng:</span>
                <span className="font-medium text-slate-800">{equipment.importance_level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 border-b pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Mốc thời gian
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Ngày mua:</span>
                <span className="font-medium text-slate-700">{equipment.purchase_date || '—'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Đưa vào sử dụng:</span>
                <span className="font-medium text-slate-700">{equipment.in_use_date || '—'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Hạn bảo hành:</span>
                <span className="font-medium text-slate-700">{equipment.warranty_end || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bảo trì tiếp theo:</span>
                <span className="font-medium text-amber-600">{equipment.next_maintenance_date || '—'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Thao tác nhanh</h3>
            <Link to="/damage-reports" className="btn-outline w-full justify-center text-xs py-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Báo hỏng thiết bị này</span>
            </Link>
            <Link to="/repairs" className="btn-outline w-full justify-center text-xs py-2 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-500" />
              <span>Yêu cầu sửa chữa</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
