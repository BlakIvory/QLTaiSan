/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button, Card, DatePicker, Form, Input, InputNumber,
  Modal, Select, Space, Table, Tag, message, Popconfirm, Descriptions
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, RollbackOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../../api/axios'
import { API_ENDPOINTS, DATE_TIME_FORMAT } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { useOrganizations } from '../../hooks/useOrganizations'
import { useAuth } from '../auth/AuthContext'
import { DEFAULT_TABLE_PAGINATION } from '../../lib/pagination'

const statusMap: Record<string, [string, string]> = {
  DRAFT:        ['Nháp', 'default'],
  SUBMITTED:    ['Đã gửi - chờ tổng hợp', 'blue'],
  CONSOLIDATED: ['Đã tổng hợp', 'cyan'],
  REJECTED:     ['Bị từ chối', 'red'],
}

const priorityMap: Record<string, [string, string]> = {
  LOW:    ['Thấp', 'default'],
  NORMAL: ['Bình thường', 'blue'],
  HIGH:   ['Cao', 'orange'],
  URGENT: ['Khẩn cấp', 'red'],
}

export default function PurchaseRequestsPage() {
  const qc = useQueryClient()
  const { user, hasRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>()
  const [detail, setDetail] = useState<any>()
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()

  const { data = [], isLoading } = useQuery({
    queryKey: ['purchase-requests', search],
    queryFn: () => api.get(API_ENDPOINTS.PURCHASE_REQUESTS.BASE, { params: { search } }).then(r => r.data.data),
  })
  const { orgs } = useOrganizations()
  // Lấy danh mục nhóm thiết bị do Quản trị viên (Admin) cấu hình trong hệ thống
  const { data: dbGroups = [] } = useQuery({
    queryKey: ['equipment-groups-all'],
    queryFn: () =>
      api
        .get(API_ENDPOINTS.CATEGORIES.EQUIPMENT_GROUPS)
        .then(r => (Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [])),
  })

  // Lấy trực tiếp danh sách nhóm thiết bị từ danh mục Admin quản trị
  const categoryOptions = useMemo(() => {
    const list = dbGroups
      .filter((g: any) => g.is_active !== false)
      .map((g: any) => ({
        value: g.name,
        label: g.name,
      }))

    if (editing?.category && !list.some((opt: any) => opt.value === editing.category)) {
      list.unshift({ value: editing.category, label: editing.category })
    }
    return list
  }, [dbGroups, editing])

  // Chỉ lấy những khoa/phòng thuộc tài khoản của người dùng (Admin được chọn tất cả)
  const userOrgs = useMemo(() => {
    if (!user) return []
    if (hasRole('admin')) {
      return orgs.filter((o: any) => o.type !== 'HOSPITAL')
    }
    if (user.organization && user.organization.type !== 'HOSPITAL') {
      const userOrgId = user.organization.id
      const filtered = orgs.filter((o: any) => o.id === userOrgId || o.parent_id === userOrgId)
      return filtered.length > 0 ? filtered : [user.organization]
    }
    return orgs.filter((o: any) => o.type !== 'HOSPITAL')
  }, [user, orgs, hasRole])

  const selectOptions = useMemo(() => {
    const list = [...userOrgs]
    if (editing?.organization && !list.some((o: any) => o.id === editing.organization.id)) {
      list.push(editing.organization)
    }
    return list.map((o: any) => ({
      value: o.id,
      label: o.name + (o.code ? ` (${o.code})` : ''),
    }))
  }, [userOrgs, editing])

  const refresh = () => qc.invalidateQueries({ queryKey: ['purchase-requests'] })

  const save = useMutation({
    mutationFn: (v: any) => {
      const payload = {
        ...v,
        needed_by: v.needed_by ? dayjs(v.needed_by).format(DATE_TIME_FORMAT.API_DATE) : undefined,
      }
      if (editing) return api.put(`${API_ENDPOINTS.PURCHASE_REQUESTS.BASE}/${editing.id}`, payload)
      return api.post(API_ENDPOINTS.PURCHASE_REQUESTS.BASE, payload)
    },
    onSuccess: r => { message.success(r.data.message); setOpen(false); setEditing(undefined); form.resetFields(); refresh() },
    onError: (e: any) => message.error(e.response?.data?.message || 'Không thể lưu đề nghị'),
  })

  const doAction = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      api.post(`${API_ENDPOINTS.PURCHASE_REQUESTS.BASE}/${id}/${action}`),
    onSuccess: r => { message.success(r.data.message); refresh() },
    onError: (e: any) => message.error(e.response?.data?.message),
  })

  const doDelete = useMutation({
    mutationFn: (id: number) => api.delete(`${API_ENDPOINTS.PURCHASE_REQUESTS.BASE}/${id}`),
    onSuccess: r => { message.success(r.data.message); refresh() },
    onError: (e: any) => message.error(e.response?.data?.message),
  })

  const openCreate = () => {
    setEditing(undefined)
    form.resetFields()
    const defaultOrgId = user?.organization?.id || (userOrgs.length === 1 ? userOrgs[0].id : undefined)
    form.setFieldsValue({
      priority: 'NORMAL',
      quantity: 1,
      unit: 'Cái',
      organization_id: defaultOrgId,
    })
    setOpen(true)
  }

  // Tự động chọn khoa/phòng khi form tạo mới mở và user/userOrgs sẵn sàng
  useEffect(() => {
    if (open && !editing && !form.getFieldValue('organization_id')) {
      const defaultOrgId = user?.organization?.id || (userOrgs.length === 1 ? userOrgs[0].id : undefined)
      if (defaultOrgId) {
        form.setFieldValue('organization_id', defaultOrgId)
      }
    }
  }, [open, editing, userOrgs, user, form])

  const openEdit = (r: any) => {
    setEditing(r)
    form.setFieldsValue({
      organization_id: r.organization_id,
      item_name: r.item_name,
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      estimated_price: r.estimated_price ? Number(r.estimated_price) : null,
      reason: r.reason,
      specifications: r.specifications,
      priority: r.priority,
      needed_by: r.needed_by ? dayjs(r.needed_by) : null,
    })
    setOpen(true)
  }

  const columns: any[] = [
    { title: 'Mã ĐN', dataIndex: 'code', width: 120 },
    { title: 'Tên tài sản đề nghị', dataIndex: 'item_name' },
    { title: 'SL', dataIndex: 'quantity', width: 60 },
    { title: 'Đơn vị', render: (_: any, r: any) => r.organization?.name },
    { title: 'Người đề nghị', render: (_: any, r: any) => r.requester?.name },
    {
      title: 'Ưu tiên', width: 110, render: (_: any, r: any) => {
        const [label, color] = priorityMap[r.priority] || [r.priority, 'default']
        return <Tag color={color}>{label}</Tag>
      }
    },
    {
      title: 'Trạng thái', width: 160, render: (_: any, r: any) => {
        const [label, color] = statusMap[r.status] || [r.status, 'default']
        return <Tag color={color}>{label}</Tag>
      }
    },
    { title: 'Ngày tạo', dataIndex: 'created_at', render: formatDate, width: 110 },
    {
      title: 'Thao tác', width: 280, render: (_: any, r: any) => (
        <Space wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>Chi tiết</Button>
          {r.status === 'DRAFT' && <>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Sửa</Button>
            <Button size="small" type="primary" icon={<SendOutlined />}
              onClick={() => doAction.mutate({ id: r.id, action: 'submit' })}>Gửi</Button>
            <Popconfirm title="Xóa đề nghị này?" okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
              onConfirm={() => doDelete.mutate(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
            </Popconfirm>
          </>}
          {r.status === 'SUBMITTED' && (
            <Button size="small" icon={<RollbackOutlined />}
              onClick={() => doAction.mutate({ id: r.id, action: 'recall' })}>Rút lại</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <div>
          <h1 className="page-title">Đề nghị mua tài sản</h1>
          <p className="page-subtitle">Cá nhân / khoa phòng lập đề nghị mua thiết bị → gửi lên phòng tổng hợp</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Lập đề nghị mua</Button>
      </div>

      <Card>
        <Input.Search
          placeholder="Vui lòng nhập mã hoặc tên tài sản đề nghị"
          onSearch={setSearch} allowClear className="mb-4"
        />
        <Table rowKey="id" loading={isLoading} dataSource={data} columns={columns} pagination={DEFAULT_TABLE_PAGINATION} />
      </Card>

      {/* Modal tạo/sửa */}
      <Modal
        title={editing ? `Sửa đề nghị ${editing.code}` : 'Lập đề nghị mua tài sản'}
        open={open} width={660}
        onCancel={() => { setOpen(false); setEditing(undefined) }}
        onOk={() => form.submit()}
        okText={editing ? 'Lưu thay đổi' : 'Lưu đề nghị'}
        confirmLoading={save.isPending}
      >
        <Form form={form} layout="vertical" onFinish={v => save.mutate(v)}>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="organization_id"
              label="Khoa / Phòng đề nghị"
              rules={[{ required: true, message: 'Vui lòng chọn khoa/phòng đề nghị' }]}
              className="col-span-2"
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={selectOptions}
                placeholder="Vui lòng chọn khoa/phòng"
              />
            </Form.Item>
            <Form.Item name="item_name" label="Tên tài sản / thiết bị đề nghị mua" rules={[{ required: true, message: 'Vui lòng nhập tên tài sản' }]} className="col-span-2">
              <Input placeholder="Vui lòng nhập tên tài sản / thiết bị đề nghị mua" />
            </Form.Item>
            <Form.Item name="category" label="Nhóm thiết bị">
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder="Vui lòng chọn nhóm thiết bị"
                options={categoryOptions}
              />
            </Form.Item>
            <Form.Item name="priority" label="Mức độ ưu tiên">
              <Select options={[
                { value: 'LOW', label: 'Thấp' },
                { value: 'NORMAL', label: 'Bình thường' },
                { value: 'HIGH', label: 'Cao' },
                { value: 'URGENT', label: 'Khẩn cấp' },
              ]} placeholder="Vui lòng chọn mức độ ưu tiên" />
            </Form.Item>
            <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}>
              <InputNumber min={1} precision={0} className="w-full" placeholder="Vui lòng nhập số lượng" />
            </Form.Item>
            <Form.Item name="unit" label="Đơn vị tính">
              <Input placeholder="Vui lòng nhập đơn vị tính" />
            </Form.Item>
            <Form.Item name="estimated_price" label="Đơn giá ước tính (VNĐ)">
              <InputNumber<number>
                min={0} precision={0} className="w-full"
                placeholder="Vui lòng nhập đơn giá ước tính"
                formatter={v => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={v => Number(v?.replace(/\./g, '') || 0)}
              />
            </Form.Item>
            <Form.Item name="needed_by" label="Ngày cần có">
              <DatePicker className="w-full" format={DATE_TIME_FORMAT.DATE} placeholder="Vui lòng chọn ngày cần có" />
            </Form.Item>
          </div>
          <Form.Item name="reason" label="Lý do / Mục đích đề nghị" rules={[{ required: true, message: 'Vui lòng nhập lý do / mục đích đề nghị' }]}>
            <Input.TextArea rows={3} placeholder="Vui lòng nhập lý do / mục đích đề nghị" />
          </Form.Item>
          <Form.Item name="specifications" label="Yêu cầu kỹ thuật / Thông số">
            <Input.TextArea rows={2} placeholder="Vui lòng nhập yêu cầu kỹ thuật / thông số" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal title={`Chi tiết đề nghị ${detail?.code || ''}`}
        open={!!detail} onCancel={() => setDetail(undefined)}
        footer={<Button onClick={() => setDetail(undefined)}>Đóng</Button>} width={640}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Mã đề nghị">{detail.code}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={(statusMap[detail.status] || [detail.status, 'default'])[1]}>
                {(statusMap[detail.status] || [detail.status])[0]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tên tài sản" span={2}>{detail.item_name}</Descriptions.Item>
            <Descriptions.Item label="Nhóm thiết bị">{detail.category || '—'}</Descriptions.Item>
            <Descriptions.Item label="Khoa/Phòng">{detail.organization?.name}</Descriptions.Item>
            <Descriptions.Item label="Số lượng">{detail.quantity} {detail.unit}</Descriptions.Item>
            <Descriptions.Item label="Đơn giá ước tính">
              {detail.estimated_price ? `${Number(detail.estimated_price).toLocaleString('vi-VN')} ₫` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Người đề nghị">{detail.requester?.name}</Descriptions.Item>
            <Descriptions.Item label="Mức ưu tiên">
              <Tag color={(priorityMap[detail.priority] || ['', 'default'])[1]}>
                {(priorityMap[detail.priority] || [detail.priority])[0]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cần có">{formatDate(detail.needed_by) || '—'}</Descriptions.Item>
            <Descriptions.Item label="Lý do đề nghị" span={2}>{detail.reason}</Descriptions.Item>
            {detail.specifications && (
              <Descriptions.Item label="Yêu cầu kỹ thuật" span={2}>{detail.specifications}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
