/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Button, Card, DatePicker, Form, Input,
  Modal, Space, Table, Tag, Transfer, message, Descriptions
} from 'antd'
import { PlusOutlined, CheckOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../../api/axios'
import { API_ENDPOINTS, DATE_TIME_FORMAT } from '../../lib/constants'
import { formatDate, formatCurrency } from '../../lib/utils'
import { DEFAULT_TABLE_PAGINATION } from '../../lib/pagination'

const statusMap: Record<string, [string, string]> = {
  DRAFT:            ['Nháp', 'default'],
  FINALIZED:        ['Đã hoàn thiện', 'blue'],
  SUBMITTED_TO_BOARD: ['Đã trình BGĐ', 'purple'],
}

export default function PurchaseSummariesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<any>()
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [form] = Form.useForm()

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['purchase-summaries'],
    queryFn: () => api.get(API_ENDPOINTS.PURCHASE_SUMMARIES.BASE).then(r => r.data.data),
  })

  // Đề nghị đang chờ tổng hợp (SUBMITTED)
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['purchase-requests-submitted'],
    queryFn: () => api.get(API_ENDPOINTS.PURCHASE_REQUESTS.BASE, { params: { status: 'SUBMITTED', per_page: 500 } }).then(r => r.data.data),
    enabled: open,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['purchase-summaries'] })
    qc.invalidateQueries({ queryKey: ['purchase-requests-submitted'] })
  }

  const create = useMutation({
    mutationFn: (v: any) => api.post(API_ENDPOINTS.PURCHASE_SUMMARIES.BASE, {
      ...v,
      summary_date: dayjs(v.summary_date).format(DATE_TIME_FORMAT.API_DATE),
      request_ids: selectedRequestIds.map(Number),
    }),
    onSuccess: r => { message.success(r.data.message); setOpen(false); form.resetFields(); setSelectedRequestIds([]); refresh() },
    onError: (e: any) => message.error(e.response?.data?.message || 'Không thể lập bảng tổng hợp'),
  })

  const finalize = useMutation({
    mutationFn: (id: number) => api.post(`${API_ENDPOINTS.PURCHASE_SUMMARIES.BASE}/${id}/finalize`),
    onSuccess: r => { message.success(r.data.message); refresh() },
    onError: (e: any) => message.error(e.response?.data?.message),
  })

  const transferData = pendingRequests.map((r: any) => ({
    key: String(r.id),
    title: `[${r.code}] ${r.item_name} – ${r.organization?.name || ''} (${r.quantity} ${r.unit})`,
    description: r.reason,
  }))

  const columns: any[] = [
    { title: 'Mã TH', dataIndex: 'code', width: 130 },
    { title: 'Tiêu đề', dataIndex: 'title' },
    { title: 'Kỳ', dataIndex: 'period', width: 100 },
    { title: 'Số ĐN', render: (_: any, r: any) => r.requests?.length ?? 0, width: 70 },
    {
      title: 'Tổng ước tính', width: 140,
      render: (_: any, r: any) => r.total_estimated ? formatCurrency(r.total_estimated) : '—'
    },
    { title: 'Ngày TH', dataIndex: 'summary_date', render: formatDate, width: 110 },
    {
      title: 'Trạng thái', width: 160, render: (_: any, r: any) => {
        const [label, color] = statusMap[r.status] || [r.status, 'default']
        return <Tag color={color}>{label}</Tag>
      }
    },
    {
      title: 'Thao tác', width: 200, render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() =>
            api.get(`${API_ENDPOINTS.PURCHASE_SUMMARIES.BASE}/${r.id}`).then(res => setDetail(res.data.data))
          }>Chi tiết</Button>
          {r.status === 'DRAFT' && (
            <Button size="small" type="primary" icon={<CheckOutlined />}
              onClick={() => finalize.mutate(r.id)}>Hoàn thiện</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Bảng tổng hợp đề nghị mua</h1>
          <p className="page-subtitle">Gộp các đề nghị mua từ các khoa/phòng → lập bảng tổng hợp → lập tờ trình BGĐ</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.setFieldsValue({ summary_date: dayjs() }); setOpen(true) }} className="w-full sm:w-auto self-start sm:self-auto shrink-0">
          Lập bảng tổng hợp
        </Button>
      </div>

      <Card>
        <Table rowKey="id" loading={isLoading} dataSource={summaries} columns={columns} pagination={DEFAULT_TABLE_PAGINATION} scroll={{ x: 800 }} />
      </Card>

      {/* Modal lập bảng tổng hợp */}
      <Modal
        title="Lập bảng tổng hợp đề nghị mua"
        open={open} width={820}
        onCancel={() => { setOpen(false); setSelectedRequestIds([]) }}
        onOk={() => form.submit()}
        okText="Lập bảng tổng hợp"
        confirmLoading={create.isPending}
        okButtonProps={{ disabled: selectedRequestIds.length === 0 }}
      >
        <Form form={form} layout="vertical" onFinish={v => create.mutate(v)}>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="title" label="Tiêu đề bảng tổng hợp" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bảng tổng hợp' }]} className="col-span-2">
              <Input placeholder="Vui lòng nhập tiêu đề bảng tổng hợp" />
            </Form.Item>
            <Form.Item name="period" label="Kỳ tổng hợp">
              <Input placeholder="Vui lòng nhập kỳ tổng hợp" />
            </Form.Item>
            <Form.Item name="summary_date" label="Ngày lập" rules={[{ required: true, message: 'Vui lòng chọn ngày lập' }]}>
              <DatePicker className="w-full" format={DATE_TIME_FORMAT.DATE} placeholder="Vui lòng chọn ngày lập" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Vui lòng nhập ghi chú" />
          </Form.Item>

          <div className="mb-2 font-medium">Chọn đề nghị mua để tổng hợp:</div>
          {pendingRequests.length === 0
            ? <Alert type="warning" showIcon message="Hiện không có đề nghị mua nào đang chờ tổng hợp." />
            : <Transfer
                dataSource={transferData}
                targetKeys={selectedRequestIds}
                onChange={keys => setSelectedRequestIds(keys as string[])}
                render={item => item.title ?? ''}
                listStyle={{ flex: 1, height: 260 }}
                titles={['Đề nghị chờ tổng hợp', 'Đã chọn vào bảng TH']}
                showSearch
                style={{ width: '100%' }}
              />
          }
          {selectedRequestIds.length > 0 && (
            <div className="mt-2 text-slate-500 text-sm">Đã chọn {selectedRequestIds.length} đề nghị</div>
          )}
        </Form>
      </Modal>

      {/* Modal chi tiết bảng tổng hợp */}
      <Modal
        title={`Chi tiết bảng tổng hợp: ${detail?.code || ''}`}
        open={!!detail} width={800}
        onCancel={() => setDetail(undefined)}
        footer={<Button onClick={() => setDetail(undefined)}>Đóng</Button>}
      >
        {detail && (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã TH">{detail.code}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={(statusMap[detail.status] || [detail.status, 'default'])[1]}>
                  {(statusMap[detail.status] || [detail.status])[0]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu đề" span={2}>{detail.title}</Descriptions.Item>
              <Descriptions.Item label="Kỳ tổng hợp">{detail.period || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày lập">{formatDate(detail.summary_date)}</Descriptions.Item>
              <Descriptions.Item label="Tổng ước tính" span={2}>
                {detail.total_estimated ? formatCurrency(detail.total_estimated) : '—'}
              </Descriptions.Item>
            </Descriptions>
            <div className="font-medium">Danh sách đề nghị mua ({detail.requests?.length || 0})</div>
            <Table
              size="small" rowKey="id" pagination={false}
              dataSource={detail.requests || []}
              columns={[
                { title: 'Mã ĐN', dataIndex: 'code', width: 110 },
                { title: 'Tên tài sản', dataIndex: 'item_name' },
                { title: 'SL', dataIndex: 'quantity', width: 50 },
                { title: 'Khoa/Phòng', render: (_: any, r: any) => r.organization?.name },
                { title: 'Ước tính', render: (_: any, r: any) => r.estimated_total ? formatCurrency(r.estimated_total) : '—', width: 130 },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
