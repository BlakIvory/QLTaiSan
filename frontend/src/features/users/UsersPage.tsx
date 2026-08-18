import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Modal, Form, Input, Select, Button, Tag, Space, Table, Tooltip, message, Popconfirm, Badge, Switch
} from 'antd'
import {
  UserOutlined, UserAddOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { filterOptionUnaccented } from '../../lib/utils'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Quản trị viên', color: 'red' },
  pvtttby: { label: 'Phòng Vật tư – TTBYT', color: 'blue' },
  department_staff: { label: 'Nhân viên Khoa/Phòng', color: 'green' },
  technician: { label: 'Kỹ thuật viên', color: 'orange' },
  leader: { label: 'Ban Lãnh đạo', color: 'purple' },
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [form] = Form.useForm()

  // Fetch Users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-list', search, roleFilter],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.USERS.BASE, {
        params: { search: search || undefined, role: roleFilter || undefined },
      })
      return res.data.data
    },
  })

  // Fetch Roles for Dropdown
  const { data: roles } = useQuery({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const res = await api.get('/roles')
      return res.data.data
    },
  })

  // Fetch Organizations for Dropdown
  const { data: organizations } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ORGANIZATIONS.BASE)
      return res.data.data
    },
  })

  // Save (Create/Update) User Mutation
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingUser) {
        return api.put(`${API_ENDPOINTS.USERS.BASE}/${editingUser.id}`, values)
      } else {
        return api.post(API_ENDPOINTS.USERS.BASE, values)
      }
    },
    onSuccess: () => {
      message.success(editingUser ? 'Cập nhật người dùng thành công!' : 'Tạo người dùng thành công!')
      queryClient.invalidateQueries({ queryKey: ['users-list'] })
      setIsModalOpen(false)
      form.resetFields()
      setEditingUser(null)
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu người dùng.')
    },
  })

  // Lock / Unlock Mutation
  const toggleLockMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const endpoint = isActive ? `${API_ENDPOINTS.USERS.BASE}/${id}/lock` : `${API_ENDPOINTS.USERS.BASE}/${id}/unlock`
      return api.put(endpoint)
    },
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã khóa tài khoản thành công.' : 'Mở khóa tài khoản thành công.')
      queryClient.invalidateQueries({ queryKey: ['users-list'] })
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra.')
    },
  })

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`${API_ENDPOINTS.USERS.BASE}/${id}`)
    },
    onSuccess: () => {
      message.success('Xóa người dùng thành công!')
      queryClient.invalidateQueries({ queryKey: ['users-list'] })
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Không thể xóa người dùng.')
    },
  })

  const handleOpenModal = (user: any = null) => {
    setEditingUser(user)
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        employee_code: user.employee_code,
        organization_id: user.organization_id || user.organization?.id,
        roles: user.roles?.map((r: any) => (typeof r === 'string' ? r : r.name)) || [],
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ roles: ['department_staff'] })
    }
    setIsModalOpen(true)
  }

  const columns = [
    {
      title: 'Họ tên / Mã NV',
      key: 'user',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
            {record.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{record.name}</div>
            <div className="text-xs text-slate-500 font-mono">{record.employee_code || 'Chưa có mã'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email / SĐT',
      key: 'contact',
      render: (_: any, record: any) => (
        <div className="text-xs space-y-0.5">
          <div className="text-slate-700 font-mono flex items-center gap-1">
            <MailOutlined className="text-slate-400" /> {record.email}
          </div>
          {record.phone && (
            <div className="text-slate-500 flex items-center gap-1">
              <PhoneOutlined className="text-slate-400" /> {record.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Khoa / Phòng',
      dataIndex: ['organization', 'name'],
      key: 'organization',
      render: (name: string) => (
        <span className="text-sm text-slate-700 font-medium">
          {name || 'Chưa phân bổ'}
        </span>
      ),
    },
    {
      title: 'Nhóm quyền (Roles)',
      key: 'roles',
      render: (_: any, record: any) => (
        <div className="flex flex-wrap gap-1">
          {record.roles?.map((r: any) => {
            const roleName = typeof r === 'string' ? r : r.name
            const roleMeta = ROLE_LABELS[roleName] || { label: roleName, color: 'default' }
            return (
              <Tag key={roleName} color={roleMeta.color} className="font-medium">
                {roleMeta.label}
              </Tag>
            )
          })}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'is_active',
      render: (_: any, record: any) => (
        <Badge
          status={record.is_active ? 'success' : 'error'}
          text={
            <span className={`text-xs font-semibold ${record.is_active ? 'text-emerald-700' : 'text-rose-600'}`}>
              {record.is_active ? 'Đang hoạt động' : 'Đã khóa'}
            </span>
          }
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title={record.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
            <Switch
              size="small"
              checked={record.is_active}
              onChange={() => toggleLockMutation.mutate({ id: record.id, isActive: record.is_active })}
              loading={toggleLockMutation.isPending}
            />
          </Tooltip>

          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined className="text-blue-600" />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc chắn muốn xóa người dùng này không?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <SafetyCertificateOutlined className="text-primary-600" />
            Quản lý Người dùng & Phân quyền
          </h1>
          <p className="page-subtitle">Quản lý danh sách tài khoản, thông tin cán bộ và gán nhóm quyền truy cập</p>
        </div>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          size="large"
          onClick={() => handleOpenModal()}
        >
          Thêm người dùng mới
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Vui lòng nhập họ tên, email hoặc mã nhân viên"
          prefix={<SearchOutlined className="text-slate-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="max-w-md"
          size="large"
        />

        <Select
          placeholder="Vui lòng chọn nhóm quyền"
          value={roleFilter || undefined}
          onChange={(val) => setRoleFilter(val || '')}
          allowClear
          className="w-full md:w-64"
          size="large"
        >
          {roles?.map((r: any) => (
            <Select.Option key={r.id} value={r.name}>
              {ROLE_LABELS[r.name]?.label || r.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          className="custom-table"
        />
      </div>

      {/* Modal Add / Edit User */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 text-lg border-b pb-3">
            <UserOutlined className="text-primary-600" />
            <span>{editingUser ? 'Chỉnh sửa tài khoản Người dùng' : 'Thêm mới tài khoản Người dùng'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            Modal.confirm({
              title: editingUser ? 'Xác nhận cập nhật tài khoản' : 'Xác nhận thêm mới tài khoản',
              content: editingUser
                ? `Bạn có chắc chắn muốn cập nhật thông tin cho người dùng "${values.name}" không?`
                : `Bạn có chắc chắn muốn tạo mới tài khoản cho người dùng "${values.name}" không?`,
              okText: 'Xác nhận',
              cancelText: 'Hủy',
              okButtonProps: { type: 'primary' },
              onOk() {
                saveMutation.mutate(values)
              },
            })
          }}
          className="pt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Họ và tên"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input placeholder="Vui lòng nhập họ và tên" size="large" />
            </Form.Item>

            <Form.Item
              label="Mã nhân viên"
              name="employee_code"
            >
              <Input placeholder="Vui lòng nhập mã nhân viên" size="large" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Email đăng nhập"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input placeholder="Vui lòng nhập email" size="large" />
            </Form.Item>

            <Form.Item
              label={editingUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu'}
              name="password"
              rules={editingUser ? [] : [{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password placeholder="Vui lòng nhập mật khẩu" size="large" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Số điện thoại" name="phone">
              <Input placeholder="Vui lòng nhập số điện thoại" size="large" />
            </Form.Item>

            <Form.Item label="Khoa / Phòng trực thuộc" name="organization_id">
              <Select placeholder="Vui lòng chọn khoa phòng" allowClear size="large" showSearch filterOption={filterOptionUnaccented}>
                {organizations?.map((org: any) => (
                  <Select.Option key={org.id} value={org.id}>
                    {org.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Gán Nhóm quyền (Có thể chọn nhiều nhóm)"
            name="roles"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 nhóm quyền' }]}
          >
            <Select
              mode="multiple"
              placeholder="Vui lòng chọn nhóm quyền"
              size="large"
              optionFilterProp="children"
            >
              {roles?.map((r: any) => (
                <Select.Option key={r.id} value={r.name}>
                  {ROLE_LABELS[r.name]?.label || r.name} ({r.name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
              {editingUser ? 'Lưu thay đổi' : 'Tạo người dùng'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
