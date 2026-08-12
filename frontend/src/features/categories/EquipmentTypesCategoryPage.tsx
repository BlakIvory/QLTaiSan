import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { Layers, Plus, Search, Edit, X, Save, Tag } from 'lucide-react'

interface EquipmentType {
  id: number
  code: string
  name: string
  equipment_group_id?: number | null
  equipment_group?: { id: number; name: string } | null
  requires_maintenance?: boolean
  requires_inspection?: boolean
  maintenance_cycle_days?: number
  inspection_cycle_days?: number
  is_active: boolean
}

interface EquipmentGroup {
  id: number
  code: string
  name: string
  is_active: boolean
}

export default function EquipmentTypesCategoryPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'types' | 'groups'>('types')
  const [search, setSearch] = useState('')

  // Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<EquipmentType | null>(null)
  const [typeCode, setTypeCode] = useState('')
  const [typeName, setTypeName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [maintCycle, setMaintCycle] = useState('180')
  const [inspCycle, setInspCycle] = useState('365')
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch Types & Groups
  const { data: types, isLoading: isLoadingTypes } = useQuery<EquipmentType[]>({
    queryKey: ['equipment-types-all'],
    queryFn: () => api.get(API_ENDPOINTS.CATEGORIES.EQUIPMENT_TYPES).then((r) => r.data.data ?? r.data),
  })

  const { data: groups, isLoading: isLoadingGroups } = useQuery<EquipmentGroup[]>({
    queryKey: ['equipment-groups-all'],
    queryFn: () => api.get(API_ENDPOINTS.CATEGORIES.EQUIPMENT_GROUPS).then((r) => r.data.data ?? r.data),
  })

  const handleOpenTypeModal = (typeObj?: EquipmentType) => {
    setFormError(null)
    if (typeObj) {
      setEditingType(typeObj)
      setTypeCode(typeObj.code)
      setTypeName(typeObj.name)
      setGroupId(typeObj.equipment_group_id?.toString() || typeObj.equipment_group?.id?.toString() || '')
      setMaintCycle(typeObj.maintenance_cycle_days?.toString() || '180')
      setInspCycle(typeObj.inspection_cycle_days?.toString() || '365')
    } else {
      setEditingType(null)
      setTypeCode('')
      setTypeName('')
      setGroupId('')
      setMaintCycle('180')
      setInspCycle('365')
    }
    setIsTypeModalOpen(true)
  }

  const saveTypeMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingType) {
        return api.put(`${API_ENDPOINTS.CATEGORIES.EQUIPMENT_TYPES}/${editingType.id}`, payload)
      } else {
        return api.post(API_ENDPOINTS.CATEGORIES.EQUIPMENT_TYPES, payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-types-all'] })
      setIsTypeModalOpen(false)
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu Loại thiết bị.')
    },
  })

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeCode.trim() || !typeName.trim()) {
      setFormError('Vui lòng nhập Mã và Tên loại thiết bị.')
      return
    }

    saveTypeMutation.mutate({
      code: typeCode.trim().toUpperCase(),
      name: typeName.trim(),
      equipment_group_id: groupId ? Number(groupId) : null,
      maintenance_cycle_days: Number(maintCycle),
      inspection_cycle_days: Number(inspCycle),
    })
  }

  const filteredTypes = (types ?? []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase())
  )

  const filteredGroups = (groups ?? []).filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-600" />
            Danh mục Loại & Nhóm thiết bị Y tế
          </h1>
          <p className="page-subtitle">Quản lý phân loại chủng loại trang thiết bị trong bệnh viện</p>
        </div>
        <button onClick={() => handleOpenTypeModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Thêm Loại thiết bị mới</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('types')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'types'
                ? 'border-primary-600 text-primary-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Loại thiết bị ({types?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'groups'
                ? 'border-primary-600 text-primary-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Nhóm thiết bị ({groups?.length ?? 0})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hoặc tên..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Types Table */}
      {activeTab === 'types' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã loại</th>
                  <th className="py-3 px-4">Tên loại thiết bị</th>
                  <th className="py-3 px-4">Nhóm thiết bị</th>
                  <th className="py-3 px-4">Chu kỳ bảo trì</th>
                  <th className="py-3 px-4">Chu kỳ kiểm định</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoadingTypes ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Đang tải Loại thiết bị...
                    </td>
                  </tr>
                ) : filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Chưa có loại thiết bị nào.
                    </td>
                  </tr>
                ) : (
                  filteredTypes.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{t.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{t.name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.equipment_group?.name ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.maintenance_cycle_days ? `${t.maintenance_cycle_days} ngày` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.inspection_cycle_days ? `${t.inspection_cycle_days} ngày` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenTypeModal(t)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Groups Table */}
      {activeTab === 'groups' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã nhóm</th>
                  <th className="py-3 px-4">Tên nhóm thiết bị</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoadingGroups ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      Đang tải Nhóm thiết bị...
                    </td>
                  </tr>
                ) : filteredGroups.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{g.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{g.name}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-green">Hoạt động</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Type */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-slate-800 text-lg">
                {editingType ? 'Chỉnh sửa Loại thiết bị' : 'Thêm mới Loại thiết bị'}
              </h3>
              <button
                onClick={() => setIsTypeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleTypeSubmit} className="space-y-4 text-sm">
              <div>
                <label className="label">Mã loại thiết bị (*)</label>
                <input
                  type="text"
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  placeholder="Ví dụ: MAY-SIEU-AM"
                  className="input-field uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="label">Tên loại thiết bị (*)</label>
                <input
                  type="text"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="Ví dụ: Máy siêu âm 4D"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Thuộc nhóm thiết bị</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Chọn nhóm thiết bị --</option>
                  {groups?.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Chu kỳ bảo trì (ngày)</label>
                  <input
                    type="number"
                    value={maintCycle}
                    onChange={(e) => setMaintCycle(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Chu kỳ kiểm định (ngày)</label>
                  <input
                    type="number"
                    value={inspCycle}
                    onChange={(e) => setInspCycle(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="btn-outline text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saveTypeMutation.isPending}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveTypeMutation.isPending ? 'Đang lưu...' : 'Lưu thông tin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
