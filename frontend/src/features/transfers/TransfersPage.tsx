/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../../api/axios'
import { API_ENDPOINTS, DATE_TIME_FORMAT } from '../../lib/constants'
import { useOrganizations } from '../../hooks/useOrganizations'
import { DEFAULT_TABLE_PAGINATION } from '../../lib/pagination'

const states: any = { PENDING: ['Chờ duyệt', 'orange'], APPROVED: ['Đã duyệt - chờ giao', 'blue'], REJECTED: ['Từ chối', 'red'], DELIVERED: ['Đã giao - chờ nhận', 'cyan'], COMPLETED: ['Hoàn tất', 'green'] }

export default function TransfersPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number>()
  const [form] = Form.useForm()
  const { data = [], isLoading } = useQuery({ queryKey: ['transfers', search], queryFn: () => api.get(API_ENDPOINTS.TRANSFERS.BASE, { params: { search } }).then(r => r.data.data) })
  const { data: equipment = [] } = useQuery({ queryKey: ['equipment-transfer'], queryFn: () => api.get(API_ENDPOINTS.EQUIPMENT.BASE, { params: { per_page: 500 } }).then(r => r.data.data) })
  const { orgOptions } = useOrganizations()
  const selectedEquipment = equipment.find((item: any) => item.id === selectedEquipmentId)
  const sourceOrganization = selectedEquipment?.organization
  const refresh = () => { qc.invalidateQueries({ queryKey: ['transfers'] }); qc.invalidateQueries({ queryKey: ['equipment'] }) }
  const closeForm = () => { setOpen(false); setSelectedEquipmentId(undefined); form.resetFields() }
  const create = useMutation({
    mutationFn: (values: any) => api.post(API_ENDPOINTS.TRANSFERS.BASE, { ...values, requested_date: dayjs(values.requested_date).format(DATE_TIME_FORMAT.API_DATE) }),
    onSuccess: response => { message.success(response.data.message); closeForm(); refresh() },
    onError: (error: any) => message.error(error.response?.data?.message || 'Không thể tạo yêu cầu điều chuyển'),
  })
  const action = useMutation({
    mutationFn: ({ id, type, data: payload }: { id: number; type: string; data?: any }) => api.post(`${API_ENDPOINTS.TRANSFERS.BASE}/${id}/${type}`, payload),
    onSuccess: response => { message.success(response.data.message); refresh() },
    onError: (error: any) => message.error(error.response?.data?.message),
  })
  const reject = (id: number) => Modal.confirm({ title: 'Từ chối điều chuyển', content: <Input.TextArea id="reject-note" placeholder="Vui lòng nhập lý do từ chối" />, onOk: () => { const notes = (document.getElementById('reject-note') as HTMLTextAreaElement)?.value; if (!notes) { message.warning('Nhập lý do từ chối'); return Promise.reject() } return action.mutateAsync({ id, type: 'reject', data: { notes } }) } })
  const buttons = (record: any) => <Space wrap>{record.status === 'PENDING' && <><Button type="primary" onClick={() => action.mutate({ id: record.id, type: 'approve' })}>Duyệt</Button><Button danger onClick={() => reject(record.id)}>Từ chối</Button></>}{record.status === 'APPROVED' && <Button type="primary" onClick={() => action.mutate({ id: record.id, type: 'handover' })}>Bên giao xác nhận</Button>}{record.status === 'DELIVERED' && <Button type="primary" onClick={() => action.mutate({ id: record.id, type: 'complete' })}>Bên nhận hoàn tất</Button>}</Space>
  const columns: any[] = [
    { title: 'Mã phiếu', dataIndex: 'code' },
    { title: 'Tài sản', render: (_: any, record: any) => <><b>{record.equipment?.name}</b><div className="text-xs">{record.equipment?.equipment_code}</div></> },
    { title: 'Đơn vị giao', render: (_: any, record: any) => record.from_organization?.name },
    { title: 'Đơn vị nhận', render: (_: any, record: any) => record.to_organization?.name },
    { title: 'Lý do', dataIndex: 'reason' },
    { title: 'Trạng thái', render: (_: any, record: any) => <Tag color={(states[record.status] || [record.status, 'default'])[1]}>{(states[record.status] || [record.status])[0]}</Tag> },
    { title: 'Thao tác', render: (_: any, record: any) => buttons(record) },
  ]
  return <div className="space-y-5">
    <div className="flex justify-between"><div><h1 className="page-title">Luân chuyển tài sản</h1><p className="page-subtitle">Yêu cầu → phê duyệt → bàn giao → bên nhận xác nhận</p></div><Button type="primary" icon={<PlusOutlined />} onClick={() => { form.setFieldsValue({ requested_date: dayjs() }); setOpen(true) }}>Tạo yêu cầu</Button></div>
    <Card><Input.Search placeholder="Vui lòng nhập mã phiếu hoặc tài sản" onSearch={setSearch} /><Table className="mt-4" rowKey="id" loading={isLoading} dataSource={data} columns={columns} pagination={DEFAULT_TABLE_PAGINATION} /></Card>
    <Modal title="Tạo yêu cầu điều chuyển" open={open} onCancel={closeForm} onOk={() => form.submit()} confirmLoading={create.isPending}>
      <Form form={form} layout="vertical" onFinish={values => create.mutate(values)}>
        <Form.Item name="equipment_id" label="Tài sản" rules={[{ required: true, message: 'Vui lòng chọn tài sản' }]}>
          <Select showSearch optionFilterProp="label" placeholder="Vui lòng chọn tài sản cần điều chuyển" onChange={(id: number) => { setSelectedEquipmentId(id); form.setFieldValue('to_organization_id', undefined) }} options={equipment.filter((item: any) => item.organization_id).map((item: any) => ({ value: item.id, label: `${item.equipment_code} - ${item.name} (${item.organization?.name})` }))} />
        </Form.Item>
        <Form.Item label="Đơn vị đang thụ hưởng"><Input value={sourceOrganization?.name || ''} placeholder="Sẽ tự động xác định khi chọn tài sản" disabled /></Form.Item>
        <Form.Item name="to_organization_id" label="Đơn vị nhận" rules={[{ required: true, message: 'Vui lòng chọn đơn vị nhận' }]}>
          <Select showSearch optionFilterProp="label" disabled={!sourceOrganization} placeholder={sourceOrganization ? 'Vui lòng chọn đơn vị nhận' : 'Vui lòng chọn tài sản trước'} options={orgOptions.filter((o) => o.value !== sourceOrganization?.id)} />
        </Form.Item>
        <Form.Item name="requested_date" label="Ngày yêu cầu" rules={[{ required: true, message: 'Vui lòng chọn ngày yêu cầu' }]}><DatePicker className="w-full" placeholder="Vui lòng chọn ngày yêu cầu" /></Form.Item>
        <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}><Input.TextArea placeholder="Vui lòng nhập lý do" /></Form.Item>
        <Form.Item name="notes" label="Ghi chú"><Input.TextArea placeholder="Vui lòng nhập ghi chú" /></Form.Item>
      </Form>
    </Modal>
  </div>
}
