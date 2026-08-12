import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Popconfirm, message } from 'antd'
import api from '../../api/axios'
import { API_ENDPOINTS, ORGANIZATION_TYPE_LABELS } from '../../lib/constants'
import {
  Building2, Plus, Search, Edit, Trash2, CheckCircle2,
  XCircle, Filter, X, Save
} from 'lucide-react'

interface Organization {
  id: number
  code: string
  name: string
  type: string
  parent_id?: number | null
  parent?: { id: number; name: string } | null
  is_active: boolean
  equipment_count?: number
  created_at: string
}

export default function OrganizationsCategoryPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)

  // Form State
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('DEPARTMENT')
  const [parentId, setParentId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch Organizations list
  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ['organizations-all'],
    queryFn: () => api.get(API_ENDPOINTS.ORGANIZATIONS.BASE).then((r) => r.data.data),
  })

  // Open Modal for Create or Edit
  const handleOpenModal = (org?: Organization) => {
    setFormError(null)
    if (org) {
      setEditingOrg(org)
      setCode(org.code)
      setName(org.name)
      setType(org.type)
      setParentId(org.parent_id?.toString() || '')
    } else {
      setEditingOrg(null)
      setCode('')
      setName('')
      setType('DEPARTMENT')
      setParentId('')
    }
    setIsModalOpen(true)
  }

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingOrg) {
        return api.put(`${API_ENDPOINTS.ORGANIZATIONS.BASE}/${editingOrg.id}`, payload)
      } else {
        return api.post(API_ENDPOINTS.ORGANIZATIONS.BASE, payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations-all'] })
      queryClient.invalidateQueries({ queryKey: ['organizations-list'] })
      setIsModalOpen(false)
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin Khoa/Phòng.')
    },
  })

  // Toggle Active Status
  const toggleMutation = useMutation({
    mutationFn: (orgId: number) => api.put(`${API_ENDPOINTS.ORGANIZATIONS.BASE}/${orgId}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations-all'] })
    },
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (orgId: number) => api.delete(`${API_ENDPOINTS.ORGANIZATIONS.BASE}/${orgId}`),
    onSuccess: () => {
      message.success('Xóa Khoa/Phòng thành công.')
      queryClient.invalidateQueries({ queryKey: ['organizations-all'] })
      queryClient.invalidateQueries({ queryKey: ['organizations-list'] })
    },
    onError: (err: any) => {
      Modal.error({
        title: 'Không thể xóa Khoa/Phòng',
        content: err.response?.data?.message || 'Có lỗi xảy ra khi xóa Khoa/Phòng.',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) {
      setFormError('Vui lòng điền đầy đủ Mã và Tên Khoa/Phòng.')
      return
    }

    Modal.confirm({
      title: editingOrg ? 'Xác nhận cập nhật Khoa/Phòng' : 'Xác nhận thêm mới Khoa/Phòng',
      content: editingOrg
        ? `Bạn có chắc chắn muốn cập nhật thông tin đơn vị "${name}" không?`
        : `Bạn có chắc chắn muốn tạo mới đơn vị "${name}" không?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: { type: 'primary' },
      onOk() {
        saveMutation.mutate({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          type,
          parent_id: parentId ? Number(parentId) : null,
        })
      },
    })
  }

  // Filtered List
  const filteredOrgs = (organizations ?? []).filter((org) => {
    const matchSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.code.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter ? org.type === typeFilter : true
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" />
            Danh mục Khoa / Phòng ban / Cơ sở
          </h1>
          <p className="page-subtitle">Quản lý cơ cấu tổ chức, khoa, phòng, kho bãi bệnh viện</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Thêm Khoa / Phòng mới</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã đơn vị..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-48 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          >
            <option value="">Tất cả loại đơn vị</option>
            {Object.entries(ORGANIZATION_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Mã đơn vị</th>
                <th className="py-3 px-4">Tên đơn vị / Khoa / Phòng</th>
                <th className="py-3 px-4">Loại đơn vị</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Đang tải danh sách Khoa/Phòng...
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Chưa có dữ liệu phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{org.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{org.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {ORGANIZATION_TYPE_LABELS[org.type] ?? org.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {org.is_active ? (
                        <span className="badge badge-green inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="badge badge-gray inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Tạm ngừng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(org)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            Modal.confirm({
                              title: org.is_active ? 'Xác nhận khóa đơn vị' : 'Xác nhận mở lại đơn vị',
                              content: org.is_active
                                ? `Bạn có chắc chắn muốn khóa đơn vị "${org.name}" không?`
                                : `Bạn có chắc chắn muốn mở lại đơn vị "${org.name}" không?`,
                              okText: 'Xác nhận',
                              cancelText: 'Hủy',
                              okButtonProps: { type: 'primary' },
                              onOk() {
                                toggleMutation.mutate(org.id)
                              },
                            })
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            org.is_active
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={org.is_active ? 'Khóa đơn vị' : 'Mở lại đơn vị'}
                        >
                          {org.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </button>

                        <Popconfirm
                          title="Xác nhận xóa Khoa/Phòng"
                          description={`Bạn có chắc chắn muốn xóa đơn vị "${org.name}" không?`}
                          onConfirm={() => deleteMutation.mutate(org.id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <button
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa đơn vị"
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
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-slate-800 text-lg">
                {editingOrg ? 'Chỉnh sửa Khoa / Phòng' : 'Thêm mới Khoa / Phòng'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="label">Mã đơn vị / Mã Khoa (*)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ví dụ: K-NOI-TONG-HOP"
                  className="input-field uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="label">Tên đơn vị / Khoa / Phòng (*)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Khoa Nội Tổng hợp"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Loại đơn vị</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="form-select"
                >
                  {Object.entries(ORGANIZATION_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Thuộc đơn vị cấp trên (Parent)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Trực thuộc Bệnh viện (Cấp cao nhất) --</option>
                  {(organizations ?? [])
                    .filter((o) => o.id !== editingOrg?.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({ORGANIZATION_TYPE_LABELS[o.type] ?? o.type})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu thông tin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
