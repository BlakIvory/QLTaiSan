import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Modal, Form, Input, Button, Card, Checkbox, Tag, message, Popconfirm, Spin
} from 'antd'
import {
  SafetyOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, SettingOutlined, KeyOutlined
} from '@ant-design/icons'
import api from '../../api/axios'

const PERMISSION_GROUPS: { groupName: string; permissions: { key: string; label: string }[] }[] = [
  {
    groupName: '1. Quản lý Thiết bị Y tế',
    permissions: [
      { key: 'equipment.view', label: 'Xem danh sách & chi tiết thiết bị' },
      { key: 'equipment.create', label: 'Thêm mới thiết bị' },
      { key: 'equipment.update', label: 'Chỉnh sửa thiết bị' },
      { key: 'equipment.delete', label: 'Xóa thiết bị' },
      { key: 'equipment.receive', label: 'Tiếp nhận thiết bị' },
      { key: 'equipment.allocate', label: 'Cấp phát thiết bị' },
      { key: 'equipment.transfer', label: 'Đề xuất điều chuyển' },
      { key: 'equipment.transfer.approve', label: 'Phê duyệt điều chuyển' },
      { key: 'equipment.recall', label: 'Thu hồi thiết bị' },
      { key: 'equipment.liquidate', label: 'Đề xuất thanh lý' },
      { key: 'equipment.liquidate.approve', label: 'Phê duyệt thanh lý' },
    ],
  },
  {
    groupName: '2. Báo hỏng & Sửa chữa',
    permissions: [
      { key: 'damage_report.view', label: 'Xem danh sách báo hỏng' },
      { key: 'damage_report.create', label: 'Gửi báo cáo sự cố / hỏng' },
      { key: 'damage_report.assign', label: 'Phân công kỹ thuật viên' },
      { key: 'repair.view', label: 'Xem hồ sơ sửa chữa' },
      { key: 'repair.update', label: 'Cập nhật tiến độ sửa chữa' },
      { key: 'repair.approve', label: 'Phê duyệt chi phí & báo giá' },
      { key: 'repair.complete', label: 'Nghiệm thu sửa chữa' },
    ],
  },
  {
    groupName: '3. Bảo trì & Kiểm định',
    permissions: [
      { key: 'maintenance.view', label: 'Xem lịch bảo trì' },
      { key: 'maintenance.create', label: 'Lập kế hoạch bảo trì' },
      { key: 'maintenance.update', label: 'Thực hiện bảo trì' },
      { key: 'maintenance.complete', label: 'Hoàn thành bảo trì' },
      { key: 'inspection.view', label: 'Xem lịch kiểm định' },
      { key: 'inspection.create', label: 'Tạo hồ sơ kiểm định' },
      { key: 'inspection.update', label: 'Cập nhật kết quả kiểm định' },
    ],
  },
  {
    groupName: '4. Vận hành, Mượn trả & Kiểm kê',
    permissions: [
      { key: 'loan.view', label: 'Xem danh sách mượn trả' },
      { key: 'loan.create', label: 'Tạo phiếu mượn' },
      { key: 'loan.approve', label: 'Duyệt cho mượn' },
      { key: 'loan.return', label: 'Xác nhận trả thiết bị' },
      { key: 'inventory.view', label: 'Xem đợt kiểm kê' },
      { key: 'inventory.create', label: 'Tạo đợt kiểm kê' },
      { key: 'inventory.execute', label: 'Quét mã kiểm kê' },
      { key: 'inventory.complete', label: 'Chốt kiểm kê' },
    ],
  },
  {
    groupName: '5. Nhà cung cấp & Báo cáo',
    permissions: [
      { key: 'supplier.view', label: 'Xem nhà cung cấp' },
      { key: 'supplier.create', label: 'Thêm nhà cung cấp' },
      { key: 'supplier.update', label: 'Sửa nhà cung cấp' },
      { key: 'contract.view', label: 'Xem hợp đồng' },
      { key: 'contract.create', label: 'Tạo hợp đồng' },
      { key: 'contract.update', label: 'Sửa hợp đồng' },
      { key: 'report.view', label: 'Xem báo cáo thống kê' },
      { key: 'report.export', label: 'Xuất file Excel báo cáo' },
    ],
  },
  {
    groupName: '6. Quản trị & Danh mục hệ thống',
    permissions: [
      { key: 'user.view', label: 'Xem danh sách người dùng' },
      { key: 'user.create', label: 'Thêm tài khoản người dùng' },
      { key: 'user.update', label: 'Sửa tài khoản người dùng' },
      { key: 'user.lock', label: 'Khóa / Mở khóa tài khoản' },
      { key: 'role.manage', label: 'Quản lý Vai trò & Phân quyền' },
      { key: 'system.audit.view', label: 'Xem Nhật ký hệ thống (Audit Logs)' },
      { key: 'organization.view', label: 'Xem danh mục Khoa / Phòng' },
      { key: 'organization.manage', label: 'Quản lý sơ đồ Khoa / Phòng' },
      { key: 'category.view', label: 'Xem Loại & Nhóm thiết bị' },
      { key: 'category.manage', label: 'Quản lý Loại & Nhóm thiết bị' },
    ],
  },
]

const ROLE_LABELS_VI: Record<string, string> = {
  admin: 'Quản trị viên hệ thống',
  pvtttby: 'Phòng Vật tư – TTBYT',
  department_staff: 'Nhân viên Khoa / Phòng',
  technician: 'Kỹ thuật viên Thiết bị',
  leader: 'Ban Lãnh đạo Bệnh viện',
}

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [form] = Form.useForm()

  // Fetch Roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const res = await api.get('/roles')
      return res.data.data
    },
  })

  // Save Role Mutation
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        name: values.name,
        permissions: selectedPermissions,
      }
      if (editingRole) {
        return api.put(`/roles/${editingRole.id}`, payload)
      } else {
        return api.post('/roles', payload)
      }
    },
    onSuccess: () => {
      message.success(editingRole ? 'Cập nhật nhóm quyền thành công!' : 'Tạo nhóm quyền mới thành công!')
      queryClient.invalidateQueries({ queryKey: ['roles-list'] })
      setIsModalOpen(false)
      form.resetFields()
      setEditingRole(null)
      setSelectedPermissions([])
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhóm quyền.')
    },
  })

  // Delete Role Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/roles/${id}`)
    },
    onSuccess: () => {
      message.success('Xóa nhóm quyền thành công!')
      queryClient.invalidateQueries({ queryKey: ['roles-list'] })
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Không thể xóa nhóm quyền này.')
    },
  })

  const handleOpenModal = (role: any = null) => {
    setEditingRole(role)
    if (role) {
      form.setFieldsValue({ name: role.name })
      const permKeys = role.permissions?.map((p: any) => (typeof p === 'string' ? p : p.name)) || []
      setSelectedPermissions(permKeys)
    } else {
      form.resetFields()
      setSelectedPermissions([])
    }
    setIsModalOpen(true)
  }

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleGroupPermissions = (groupPerms: { key: string }[]) => {
    const groupKeys = groupPerms.map((p) => p.key)
    const isAllChecked = groupKeys.every((k) => selectedPermissions.includes(k))

    if (isAllChecked) {
      setSelectedPermissions((prev) => prev.filter((k) => !groupKeys.includes(k)))
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupKeys])))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <SafetyOutlined className="text-primary-600" />
            Quản lý Nhóm quyền & Ma trận Quyền hạn
          </h1>
          <p className="page-subtitle">Định nghĩa các nhóm quyền (Roles) và ma trận quyền hạn (Permissions) cho toàn hệ thống</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => handleOpenModal()}
        >
          Thêm Nhóm quyền mới
        </Button>
      </div>

      {isLoadingRoles ? (
        <div className="text-center py-20">
          <Spin size="large" tip="Đang tải danh sách nhóm quyền..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles?.map((role: any) => {
            const rolePerms = role.permissions || []
            const titleVi = ROLE_LABELS_VI[role.name] || role.name

            return (
              <Card
                key={role.id}
                className="shadow-xs hover:shadow-card-md transition-shadow rounded-2xl border-slate-200"
                actions={[
                  <Button
                    type="text"
                    key="edit"
                    icon={<EditOutlined className="text-blue-600" />}
                    onClick={() => handleOpenModal(role)}
                  >
                    Chỉnh sửa quyền
                  </Button>,
                  role.name !== 'admin' ? (
                    <Popconfirm
                      key="delete"
                      title="Xóa nhóm quyền"
                      description="Bạn có chắc chắn muốn xóa nhóm quyền này không?"
                      onConfirm={() => deleteMutation.mutate(role.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />}>
                        Xóa
                      </Button>
                    </Popconfirm>
                  ) : (
                    <span key="disabled" className="text-xs text-slate-400 font-medium cursor-not-allowed">
                      Hệ thống mặc định
                    </span>
                  ),
                ]}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SafetyCertificateOutlined className="text-primary-600 text-lg" />
                      <h3 className="font-bold text-slate-800 text-base m-0">{titleVi}</h3>
                    </div>
                    <Tag color={role.name === 'admin' ? 'red' : 'blue'} className="font-mono text-xs font-semibold">
                      {role.name}
                    </Tag>
                  </div>

                  <p className="text-xs text-slate-500 min-h-[32px]">
                    Được gán <strong className="text-primary-700">{rolePerms.length}</strong> quyền chi tiết trên hệ thống.
                  </p>

                  <div className="border-t border-slate-100 pt-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                      <KeyOutlined className="text-amber-500" /> Một số quyền tiêu biểu:
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {rolePerms.slice(0, 6).map((p: any) => {
                        const permKey = typeof p === 'string' ? p : p.name
                        return (
                          <span
                            key={permKey}
                            className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200"
                          >
                            {permKey}
                          </span>
                        )
                      })}
                      {rolePerms.length > 6 && (
                        <span className="text-[11px] text-primary-600 font-semibold px-1">
                          +{rolePerms.length - 6} quyền khác...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Add / Edit Role Matrix */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 text-lg border-b pb-3">
            <SettingOutlined className="text-primary-600" />
            <span>{editingRole ? `Phân quyền cho nhóm: ${ROLE_LABELS_VI[editingRole.name] || editingRole.name}` : 'Thêm mới Nhóm quyền'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={850}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
          className="pt-3 space-y-6"
        >
          <Form.Item
            label="Mã tên nhóm quyền (Role Key)"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập mã tên nhóm quyền' }]}
          >
            <Input
              placeholder="Vui lòng nhập tên vai trò"
              size="large"
              disabled={editingRole?.name === 'admin'}
              className="font-mono"
            />
          </Form.Item>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircleOutlined className="text-emerald-600" />
                Ma trận Quyền hạn (Đã chọn {selectedPermissions.length} quyền)
              </label>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  const allKeys = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))
                  if (selectedPermissions.length === allKeys.length) {
                    setSelectedPermissions([])
                  } else {
                    setSelectedPermissions(allKeys)
                  }
                }}
              >
                {selectedPermissions.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả quyền'}
              </Button>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.permissions.map((p) => p.key)
                const isAllChecked = groupKeys.every((k) => selectedPermissions.includes(k))
                const isSomeChecked = groupKeys.some((k) => selectedPermissions.includes(k)) && !isAllChecked

                return (
                  <div key={group.groupName} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <Checkbox
                        indeterminate={isSomeChecked}
                        checked={isAllChecked}
                        onChange={() => toggleGroupPermissions(group.permissions)}
                        className="font-bold text-slate-800"
                      >
                        {group.groupName}
                      </Checkbox>
                      <Tag color="blue" className="text-xs">
                        {groupKeys.filter((k) => selectedPermissions.includes(k)).length} / {groupKeys.length}
                      </Tag>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {group.permissions.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.key)
                        return (
                          <div
                            key={perm.key}
                            onClick={() => togglePermission(perm.key)}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-2 ${
                              isChecked
                                ? 'bg-primary-50 border-primary-300 text-primary-900 font-medium'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Checkbox checked={isChecked} onChange={() => {}} className="mt-0.5 shrink-0" />
                            <div>
                              <div>{perm.label}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.key}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button size="large" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={saveMutation.isPending}
            >
              {editingRole ? 'Lưu cập nhật ma trận quyền' : 'Tạo nhóm quyền mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
