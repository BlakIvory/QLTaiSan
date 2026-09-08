/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button, Card, DatePicker, Descriptions, Form, Input, InputNumber,
  Modal, Select, Space, Table, Tag, Upload, message, Popconfirm
} from 'antd'
import {
  PlusOutlined, SendOutlined, CheckOutlined, CloseOutlined,
  EyeOutlined, DeleteOutlined, UploadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../../api/axios'
import { API_ENDPOINTS, DATE_TIME_FORMAT } from '../../lib/constants'
import { formatDate, formatCurrency } from '../../lib/utils'
import { useAuth } from '../auth/AuthContext'
import { DEFAULT_TABLE_PAGINATION } from '../../lib/pagination'

const statusMap: Record<string, [string, string]> = {
  DRAFT:     ['Nháp', 'default'],
  SUBMITTED: ['Đã trình BGĐ - chờ duyệt', 'blue'],
  APPROVED:  ['BGĐ đã phê duyệt', 'green'],
  REJECTED:  ['BGĐ từ chối', 'red'],
}

export default function ProposalsPage() {
  const qc = useQueryClient()
  const { hasAnyRole } = useAuth()
  const canApprove = hasAnyRole(['leader', 'admin'])
  const canCreate = hasAnyRole(['pvtttby', 'admin'])

  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<any>()
  const [boardNoteModal, setBoardNoteModal] = useState<{ id: number; type: 'approve' | 'reject' } | null>(null)
  const [boardNoteForm] = Form.useForm()
  const [file, setFile] = useState<any>()
  const [form] = Form.useForm()

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => api.get(API_ENDPOINTS.PROPOSALS.BASE).then(r => r.data.data),
  })

  // Bảng tổng hợp đã hoàn thiện, chưa có tờ trình
  const { data: summaries = [] } = useQuery({
    queryKey: ['purchase-summaries-finalized'],
    queryFn: () => api.get(API_ENDPOINTS.PURCHASE_SUMMARIES.BASE, { params: { status: 'FINALIZED' } }).then(r => r.data.data),
    enabled: open,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['proposals'] })
    qc.invalidateQueries({ queryKey: ['purchase-summaries-finalized'] })
    qc.invalidateQueries({ queryKey: ['purchase-summaries'] })
  }

  const create = useMutation({
    mutationFn: (v: any) => {
      const fd = new FormData()
      Object.entries(v).forEach(([k, val]) => {
        if (val != null && k !== 'attachment') {
          if (k === 'proposal_date') fd.append(k, dayjs(val as any).format(DATE_TIME_FORMAT.API_DATE))
          else fd.append(k, String(val))
        }
      })
      if (file) fd.append('attachment', file)
      return api.post(API_ENDPOINTS.PROPOSALS.BASE, fd)
    },
    onSuccess: r => { message.success(r.data.message); setOpen(false); form.resetFields(); setFile(undefined); refresh() },
    onError: (e: any) => message.error(e.response?.data?.message || 'Không thể lập tờ trình'),
  })

  const doAction = useMutation({
    mutationFn: ({ id, action, data }: { id: number; action: string; data?: any }) =>
      api.post(`${API_ENDPOINTS.PROPOSALS.BASE}/${id}/${action}`, data),
    onSuccess: r => { message.success(r.data.message); setBoardNoteModal(null); boardNoteForm.resetFields(); refresh() },
    onError: (e: any) => message.error(e.response?.data?.message),
  })

  const doDelete = useMutation({
    mutationFn: (id: number) => api.delete(`${API_ENDPOINTS.PROPOSALS.BASE}/${id}`),
    onSuccess: r => { message.success(r.data.message); refresh() },
    onError: (e: any) => message.error(e.response?.data?.message),
  })

  const columns: any[] = [
    { title: 'Mã TT', dataIndex: 'code', width: 120 },
    { title: 'Tiêu đề tờ trình', dataIndex: 'title' },
    { title: 'Ngày trình', dataIndex: 'proposal_date', render: formatDate, width: 110 },
    {
      title: 'Tổng kinh phí', width: 140,
      render: (_: any, r: any) => r.total_amount ? formatCurrency(r.total_amount) : '—'
    },
    {
      title: 'Trạng thái', width: 180, render: (_: any, r: any) => {
        const [label, color] = statusMap[r.status] || [r.status, 'default']
        return <Tag color={color}>{label}</Tag>
      }
    },
    {
      title: 'Thao tác', width: 300, render: (_: any, r: any) => (
        <Space wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() =>
            api.get(`${API_ENDPOINTS.PROPOSALS.BASE}/${r.id}`).then(res => setDetail(res.data.data))
          }>Chi tiết</Button>
          {r.status === 'DRAFT' && canCreate && <>
            <Button size="small" type="primary" icon={<SendOutlined />}
              onClick={() => doAction.mutate({ id: r.id, action: 'submit' })}>Trình BGĐ</Button>
            <Popconfirm title="Xóa tờ trình?" okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
              onConfirm={() => doDelete.mutate(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
            </Popconfirm>
          </>}
          {r.status === 'SUBMITTED' && canApprove && <>
            <Button size="small" type="primary" icon={<CheckOutlined />}
              onClick={() => setBoardNoteModal({ id: r.id, type: 'approve' })}>Duyệt</Button>
            <Button size="small" danger icon={<CloseOutlined />}
              onClick={() => setBoardNoteModal({ id: r.id, type: 'reject' })}>Từ chối</Button>
          </>}
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Tờ trình chủ trương mua sắm</h1>
          <p className="page-subtitle">Lập tờ trình từ bảng tổng hợp → trình Ban giám đốc phê duyệt</p>
        </div>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { form.setFieldsValue({ proposal_date: dayjs() }); setOpen(true) }}
            className="w-full sm:w-auto self-start sm:self-auto shrink-0">
            Lập tờ trình
          </Button>
        )}
      </div>

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={proposals} columns={columns} pagination={DEFAULT_TABLE_PAGINATION} scroll={{ x: 800 }} />
      </Card>

      {/* Modal lập tờ trình */}
      <Modal
        title="Lập tờ trình chủ trương mua sắm"
        open={open} width={680}
        onCancel={() => { setOpen(false); setFile(undefined) }}
        onOk={() => form.submit()}
        okText="Lập tờ trình"
        confirmLoading={create.isPending}
      >
        <Form form={form} layout="vertical" onFinish={v => create.mutate(v)}>
          <Form.Item name="summary_id" label="Bảng tổng hợp đề nghị" rules={[{ required: true, message: 'Vui lòng chọn bảng tổng hợp' }]}>
            <Select
              showSearch optionFilterProp="label"
              placeholder="Vui lòng chọn bảng tổng hợp"
              options={summaries.map((s: any) => ({ value: s.id, label: `[${s.code}] ${s.title}` }))}
            />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề tờ trình" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề tờ trình' }]}>
            <Input placeholder="Vui lòng nhập tiêu đề tờ trình" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="proposal_date" label="Ngày tờ trình" rules={[{ required: true, message: 'Vui lòng chọn ngày tờ trình' }]}>
              <DatePicker className="w-full" format={DATE_TIME_FORMAT.DATE} placeholder="Vui lòng chọn ngày tờ trình" />
            </Form.Item>
            <Form.Item name="total_amount" label="Tổng kinh phí đề xuất (VNĐ)">
              <InputNumber<number>
                min={0} precision={0} className="w-full"
                placeholder="Vui lòng nhập tổng kinh phí đề xuất"
                formatter={v => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={v => Number(v?.replace(/\./g, '') || 0)}
              />
            </Form.Item>
          </div>
          <Form.Item name="justification" label="Căn cứ / Cơ sở pháp lý">
            <Input.TextArea rows={2} placeholder="Vui lòng nhập căn cứ / cơ sở pháp lý" />
          </Form.Item>
          <Form.Item name="content" label="Nội dung tờ trình">
            <Input.TextArea rows={4} placeholder="Vui lòng nhập nội dung tờ trình" />
          </Form.Item>
          <Form.Item label="File tờ trình (PDF/Word)">
            <Upload beforeUpload={f => { setFile(f); return false }} maxCount={1} accept=".pdf,.doc,.docx">
              <Button icon={<UploadOutlined />}>Đính kèm file</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal BGĐ duyệt/từ chối */}
      <Modal
        title={boardNoteModal?.type === 'approve' ? 'Phê duyệt tờ trình' : 'Từ chối tờ trình'}
        open={!!boardNoteModal}
        onCancel={() => { setBoardNoteModal(null); boardNoteForm.resetFields() }}
        onOk={() => boardNoteForm.submit()}
        okText={boardNoteModal?.type === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
        okButtonProps={{ danger: boardNoteModal?.type === 'reject' }}
        confirmLoading={doAction.isPending}
      >
        <Form form={boardNoteForm} layout="vertical"
          onFinish={v => doAction.mutate({ id: boardNoteModal!.id, action: boardNoteModal!.type, data: v })}>
          <Form.Item
            name="board_notes"
            label={boardNoteModal?.type === 'approve' ? 'Ý kiến phê duyệt' : 'Lý do từ chối'}
            rules={boardNoteModal?.type === 'reject' ? [{ required: true, message: 'Vui lòng nhập lý do từ chối' }] : []}
          >
            <Input.TextArea rows={3}
              placeholder={boardNoteModal?.type === 'approve'
                ? 'Vui lòng nhập ý kiến phê duyệt'
                : 'Vui lòng nhập lý do từ chối'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết tờ trình */}
      <Modal
        title={`Chi tiết tờ trình: ${detail?.code || ''}`}
        open={!!detail} width={760}
        onCancel={() => setDetail(undefined)}
        footer={<Button onClick={() => setDetail(undefined)}>Đóng</Button>}
      >
        {detail && (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã TT">{detail.code}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={(statusMap[detail.status] || [detail.status, 'default'])[1]}>
                  {(statusMap[detail.status] || [detail.status])[0]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu đề" span={2}>{detail.title}</Descriptions.Item>
              <Descriptions.Item label="Ngày tờ trình">{formatDate(detail.proposal_date)}</Descriptions.Item>
              <Descriptions.Item label="Tổng kinh phí">
                {detail.total_amount ? formatCurrency(detail.total_amount) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Bảng TH tham chiếu" span={2}>{detail.summary?.title || '—'}</Descriptions.Item>
              {detail.content && <Descriptions.Item label="Nội dung" span={2}>{detail.content}</Descriptions.Item>}
              {detail.justification && <Descriptions.Item label="Căn cứ" span={2}>{detail.justification}</Descriptions.Item>}
              {detail.submitted_by && <Descriptions.Item label="Người trình">{detail.submitted_by?.name}</Descriptions.Item>}
              {detail.submitted_at && <Descriptions.Item label="Ngày trình BGĐ">{formatDate(detail.submitted_at)}</Descriptions.Item>}
              {detail.approved_by && <Descriptions.Item label="BGĐ xử lý">{detail.approved_by?.name}</Descriptions.Item>}
              {detail.board_notes && <Descriptions.Item label="Ý kiến BGĐ" span={2}>{detail.board_notes}</Descriptions.Item>}
            </Descriptions>
            {detail.attachment_path && (
              <Button icon={<EyeOutlined />}
                onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${detail.attachment_path}`, '_blank')}>
                Xem file tờ trình
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
