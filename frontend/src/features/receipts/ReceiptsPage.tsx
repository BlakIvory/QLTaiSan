import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Modal, Form, Select, DatePicker, Input, InputNumber, Button, Tag, Space, Card, Popconfirm, Upload, Tooltip, Popover, message
} from 'antd'
import {
  PlusOutlined, SearchOutlined, CalendarOutlined,
  BuildingOutlined, UserOutlined, DeleteOutlined, CheckCircleOutlined,
  UploadOutlined, PaperClipOutlined, FileTextOutlined, FileWordOutlined, PrinterOutlined,
  InfoCircleOutlined, QuestionCircleOutlined
} from '@ant-design/icons'
import { ClipboardList } from 'lucide-react'
import dayjs from 'dayjs'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { filterOptionUnaccented } from '../../lib/utils'

export default function ReceiptsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [printData, setPrintData] = useState<any>(null)
  const [fileList, setFileList] = useState<any[]>([])
  const [uploadFileList, setUploadFileList] = useState<any[]>([])
  const [form] = Form.useForm()

  // Fetch receipts list
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts', search],
    queryFn: () =>
      api.get(API_ENDPOINTS.RECEIPTS.BASE, { params: { search } }).then((r) => r.data.data),
  })

  // Fetch equipments list for select
  const { data: equipments } = useQuery({
    queryKey: ['equipment-select-all'],
    queryFn: () => api.get(API_ENDPOINTS.EQUIPMENT.BASE, { params: { per_page: 500 } }).then((r) => r.data.data),
  })

  // Fetch organizations list
  const { data: orgs } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: () => api.get(API_ENDPOINTS.ORGANIZATIONS.BASE).then((r) => r.data.data),
  })

  // Create Receipt & Handover mutation for multiple equipments
  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      const formData = new FormData()
      if (values.from_organization_id) formData.append('from_organization_id', values.from_organization_id)
      formData.append('to_organization_id', values.to_organization_id)
      formData.append('from_date', values.from_date ? dayjs(values.from_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))
      if (values.to_date) formData.append('to_date', dayjs(values.to_date).format('YYYY-MM-DD'))
      if (values.deliverer_name) formData.append('deliverer_name', values.deliverer_name)
      if (values.receiver_name) formData.append('receiver_name', values.receiver_name)
      if (values.notes) formData.append('notes', values.notes)

      // Append items array
      if (values.items && values.items.length > 0) {
        values.items.forEach((item: any, index: number) => {
          formData.append(`items[${index}][equipment_id]`, item.equipment_id)
          formData.append(`items[${index}][quantity]`, item.quantity || 1)
          formData.append(`items[${index}][unit]`, item.unit || 'Cái')
          if (item.notes) formData.append(`items[${index}][notes]`, item.notes)
        })
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('attachment', fileList[0].originFileObj)
      }

      return api.post(API_ENDPOINTS.RECEIPTS.BASE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      message.success('Tạo biên bản Tiếp nhận & Bàn giao thiết bị thành công!')
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setIsModalOpen(false)
      form.resetFields()
      setFileList([])
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu tiếp nhận.')
    },
  })

  // Upload signed file attachment for existing receipt
  const uploadMutation = useMutation({
    mutationFn: (receiptId: number) => {
      const formData = new FormData()
      if (uploadFileList.length > 0 && uploadFileList[0].originFileObj) {
        formData.append('attachment', uploadFileList[0].originFileObj)
      } else {
        return Promise.reject(new Error('Vui lòng chọn tập tin cần tải lên.'))
      }

      return api.post(`${API_ENDPOINTS.RECEIPTS.BASE}/${receiptId}/upload-attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      message.success('Tải lên bản ký biên bản bàn giao thành công!')
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      setIsUploadModalOpen(false)
      setSelectedReceipt(null)
      setUploadFileList([])
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tải tập tin.')
    },
  })

  // Delete Receipt mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${API_ENDPOINTS.RECEIPTS.BASE}/${id}`),
    onSuccess: () => {
      message.success('Xóa biên bản tiếp nhận thành công.')
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Không thể xóa biên bản này.')
    },
  })

  const handleOpenModal = () => {
    form.resetFields()
    setFileList([])
    const defaultOrg = orgs?.find((o: any) => {
      const nameLower = o.name?.toLowerCase() || ''
      return (
        nameLower.includes('cơ sở vật chất') ||
        nameLower.includes('csvc') ||
        nameLower.includes('vật tư') ||
        o.code === 'P-CSVC' ||
        o.code === 'P-VAT-TU' ||
        o.code === 'P-VT-TTBYT' ||
        o.type === 'WAREHOUSE'
      )
    })
    form.setFieldsValue({
      from_date: dayjs(),
      from_organization_id: defaultOrg ? defaultOrg.id : (orgs?.[0]?.id || undefined),
      items: [{ quantity: 1, unit: 'Cái' }],
    })
    setIsModalOpen(true)
  }

  const handleOpenUploadModal = (record: any) => {
    setSelectedReceipt(record)
    setUploadFileList([])
    setIsUploadModalOpen(true)
  }

  // Open Printable Preview Modal from current Form values
  const handlePreviewFromForm = () => {
    const values = form.getFieldsValue()
    if (!values.items || values.items.length === 0 || !values.to_organization_id) {
      message.warning('Vui lòng chọn Đơn vị bàn giao, Đơn vị tiếp nhận và ít nhất 1 Thiết bị.')
      return
    }

    const fromOrgObj = orgs?.find((o: any) => o.id === values.from_organization_id)
    const toOrgObj = orgs?.find((o: any) => o.id === values.to_organization_id)

    const itemsPreview = (values.items || []).map((item: any) => {
      const eqObj = equipments?.find((e: any) => e.id === item.equipment_id)
      return {
        name: eqObj?.name || '—',
        code: eqObj?.equipment_code || '—',
        quantity: item.quantity || 1,
        unit: item.unit || 'Cái',
        notes: item.notes || '',
      }
    })

    setPrintData({
      receipt_code: 'TN-PREVIEW',
      items: itemsPreview,
      from_organization_name: fromOrgObj?.name || 'Phòng Vật tư – Thiết bị y tế',
      to_organization_name: toOrgObj?.name || 'Chưa chọn khoa',
      from_date: values.from_date ? dayjs(values.from_date).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY'),
      to_date: values.to_date ? dayjs(values.to_date).format('DD/MM/YYYY') : 'Vô thời hạn',
      deliverer_name: values.deliverer_name || 'Đại diện Bên giao',
      receiver_name: values.receiver_name || 'Đại diện Bên nhận',
      notes: values.notes || 'Bàn giao sử dụng thiết bị y tế',
      receipt_id: null,
    })

    setIsPrintModalOpen(true)
  }

  // Open Printable Preview Modal from Table record
  const handlePreviewFromRecord = (record: any) => {
    const itemsPreview = (record.items && record.items.length > 0)
      ? record.items.map((item: any) => ({
          name: item.equipment?.name || '—',
          code: item.equipment?.equipment_code || '—',
          quantity: item.quantity || 1,
          unit: item.unit || 'Cái',
          notes: item.notes || '',
        }))
      : [{
          name: record.equipment?.name || '—',
          code: record.equipment?.equipment_code || '—',
          quantity: 1,
          unit: 'Cái',
          notes: record.notes || '',
        }]

    setPrintData({
      receipt_code: record.receipt_code,
      items: itemsPreview,
      from_organization_name: record.from_organization?.name || 'Phòng Vật tư – Thiết bị y tế',
      to_organization_name: record.to_organization?.name || '—',
      from_date: record.from_date ? dayjs(record.from_date).format('DD/MM/YYYY') : '—',
      to_date: record.to_date ? dayjs(record.to_date).format('DD/MM/YYYY') : 'Vô thời hạn',
      deliverer_name: record.deliverer_name || 'Đại diện Bên giao',
      receiver_name: record.receiver_name || 'Đại diện Bên nhận',
      notes: record.notes || '',
      receipt_id: record.id,
    })

    setIsPrintModalOpen(true)
  }

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'receipt_code',
      key: 'receipt_code',
      render: (code: string) => <span className="font-mono font-bold text-primary-700">{code}</span>,
    },
    {
      title: 'Danh mục Thiết bị Bàn giao (Số lượng)',
      key: 'equipment_items',
      render: (_: any, record: any) => {
        const itemList = (record.items && record.items.length > 0) ? record.items : null
        if (itemList) {
          return (
            <div className="space-y-1">
              <span className="badge badge-blue mb-1 inline-block">Gồm {itemList.length} thiết bị</span>
              {itemList.map((item: any, idx: number) => (
                <div key={idx} className="text-xs text-slate-800 flex items-center gap-1.5">
                  <span className="font-semibold text-primary-600">🔹 {item.equipment?.name}</span>
                  <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border text-slate-700">
                    SL: {item.quantity} {item.unit || 'Cái'}
                  </span>
                </div>
              ))}
            </div>
          )
        }

        // Single fallback
        return (
          <div>
            <p className="font-semibold text-slate-800 m-0">{record.equipment?.name || '—'}</p>
            <p className="text-xs text-slate-400 font-mono m-0">
              {record.equipment?.equipment_code} {record.equipment?.asset_code ? `· ${record.equipment.asset_code}` : ''}
            </p>
          </div>
        )
      },
    },
    {
      title: 'Đơn vị bàn giao',
      key: 'from_org',
      render: (_: any, record: any) => (
        <span className="text-xs font-medium text-slate-600">
          {record.from_organization?.name || 'Phòng Vật tư – TTBYT'}
        </span>
      ),
    },
    {
      title: 'Đơn vị tiếp nhận',
      key: 'to_org',
      render: (_: any, record: any) => (
        <Tag color="blue" className="font-semibold text-xs">
          {record.to_organization?.name || '—'}
        </Tag>
      ),
    },
    {
      title: 'Thời hạn bàn giao (Từ ➔ Đến)',
      key: 'dates',
      render: (_: any, record: any) => (
        <div className="text-xs text-slate-700">
          <p className="m-0">
            <span className="text-slate-400">Từ:</span> <strong className="text-emerald-700">{record.from_date ? dayjs(record.from_date).format('DD/MM/YYYY') : '—'}</strong>
          </p>
          <p className="m-0">
            <span className="text-slate-400">Đến:</span> <strong className="text-amber-700">{record.to_date ? dayjs(record.to_date).format('DD/MM/YYYY') : 'Vô thời hạn'}</strong>
          </p>
        </div>
      ),
    },
    {
      title: 'Biên bản đã ký (File Scan)',
      key: 'attachment',
      render: (_: any, record: any) => (
        record.attachment_path ? (
          <a
            href={`http://localhost:8000${record.attachment_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-xs font-medium transition-colors border border-emerald-200"
          >
            <PaperClipOutlined className="text-emerald-600" />
            <span>{record.attachment_name || 'Xem file biên bản đã ký'}</span>
          </a>
        ) : (
          <span className="text-xs text-amber-600 italic">Chưa tải file ký</span>
        )
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Nút In trực tiếp */}
          <Tooltip title="In trực tiếp biên bản bàn giao">
            <Button
              size="small"
              icon={<PrinterOutlined className="text-blue-600" />}
              onClick={() => handlePreviewFromRecord(record)}
              className="text-xs font-semibold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
            >
              In biên bản
            </Button>
          </Tooltip>

          {/* Nút Xuất file Word */}
          <Tooltip title="Xuất file Word Biên bản bàn giao (.doc)">
            <a
              href={`http://localhost:8000/api/v1/receipts/${record.id}/export-word`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-xs font-medium transition-colors border border-slate-300"
            >
              <FileWordOutlined className="text-blue-600 text-sm" />
              <span>Xuất Word</span>
            </a>
          </Tooltip>

          {/* Nút Upload bản ký scan */}
          <Tooltip title="Tải lên file scan biên bản đã ký">
            <Button
              size="small"
              icon={<UploadOutlined />}
              onClick={() => handleOpenUploadModal(record)}
              className="text-xs font-medium border-slate-300"
            >
              Upload bản ký
            </Button>
          </Tooltip>

          {/* Nút Xóa */}
          <Popconfirm
            title="Xóa biên bản tiếp nhận"
            description="Bạn có chắc chắn muốn xóa biên bản tiếp nhận này không?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined className="text-rose-600" />} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-600" />
            Quản lý Tiếp nhận & Bàn giao Thiết bị
          </h1>
          <p className="page-subtitle">
            Bàn giao đồng thời nhiều thiết bị y tế theo Đơn vị lưu giữ, in trực tiếp hoặc xuất file Word mẫu để ký duyệt
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenModal}
          className="shadow-sm"
        >
          Tạo Phiếu Tiếp nhận & Bàn giao
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <Card className="shadow-xs">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Tìm kiếm theo mã phiếu, tên thiết bị..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="large"
            allowClear
            className="max-w-md"
          />
        </div>
      </Card>

      {/* Receipts Table */}
      <Card className="shadow-xs">
        <Table
          columns={columns}
          dataSource={receipts}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* Modal Create Receipt / Handover (Multi-Equipment) */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 text-lg border-b pb-3">
            <ClipboardList className="text-primary-600 w-5 h-5" />
            <span>Tạo Phiếu Bàn giao Nhiều Thiết bị Y tế</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const fromOrgObj = orgs?.find((o: any) => o.id === values.from_organization_id)
            const toOrgObj = orgs?.find((o: any) => o.id === values.to_organization_id)
            const fromD = values.from_date ? dayjs(values.from_date).format('DD/MM/YYYY') : ''
            const toD = values.to_date ? dayjs(values.to_date).format('DD/MM/YYYY') : 'Vô thời hạn'
            const countItems = values.items?.length || 0

            Modal.confirm({
              title: 'Xác nhận Bàn giao Danh mục Thiết bị',
              content: (
                <div className="space-y-2 text-sm pt-2">
                  <p>Bạn có chắc chắn muốn bàn giao danh mục thiết bị này không?</p>
                  <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                    <p className="m-0"><strong>Đơn vị bàn giao (Đang giữ):</strong> {fromOrgObj?.name || 'Phòng Vật tư – TTBYT'}</p>
                    <p className="m-0"><strong>Đơn vị tiếp nhận:</strong> {toOrgObj?.name}</p>
                    <p className="m-0"><strong>Số loại thiết bị bàn giao:</strong> {countItems} loại</p>
                    <p className="m-0"><strong>Thời hạn:</strong> Từ {fromD} ➔ Đến {toD}</p>
                  </div>
                </div>
              ),
              okText: 'Xác nhận Bàn giao',
              cancelText: 'Hủy',
              okButtonProps: { type: 'primary' },
              onOk() {
                saveMutation.mutate(values)
              },
            })
          }}
          className="pt-4 space-y-4"
        >
          {/* STEP 1: Select Source & Target Organizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary-50/50 p-4 rounded-xl border border-primary-100">
            <Form.Item
              label={<span className="font-bold text-slate-800">1. Chọn Đơn vị bàn giao (Nơi đang giữ thiết bị)</span>}
              name="from_organization_id"
              rules={[{ required: true, message: 'Vui lòng chọn đơn vị bàn giao' }]}
              className="m-0"
              help="Lọc danh sách các thiết bị do đơn vị này quản lý"
            >
              <Select
                placeholder="-- Chọn Đơn vị bàn giao (gõ không dấu) --"
                size="large"
                showSearch
                filterOption={filterOptionUnaccented}
                onChange={() => {
                  // Reset equipment selections if department changes
                  const items = form.getFieldValue('items') || []
                  const resetItems = items.map((item: any) => ({ ...item, equipment_id: undefined }))
                  form.setFieldsValue({ items: resetItems })
                }}
              >
                {orgs?.filter((org: any) => org.level === undefined || org.level >= 1).map((org: any) => (
                  <Select.Option key={org.id} value={org.id}>
                    {org.name} {org.level !== undefined ? `(Cấp ${org.level})` : `(${org.type})`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-bold text-slate-800">2. Chọn Đơn vị / Khoa / Phòng tiếp nhận</span>}
              name="to_organization_id"
              rules={[{ required: true, message: 'Vui lòng chọn khoa/phòng tiếp nhận' }]}
              className="m-0"
            >
              <Select
                placeholder="-- Chọn Khoa/Phòng tiếp nhận (gõ không dấu) --"
                size="large"
                showSearch
                filterOption={filterOptionUnaccented}
              >
                {orgs?.filter((org: any) => org.level === undefined || org.level >= 1).map((org: any) => (
                  <Select.Option key={org.id} value={org.id}>
                    {org.name} {org.level !== undefined ? `(Cấp ${org.level})` : `(${org.type})`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* STEP 2: Dynamic List of Equipments Belonging to Selected from_organization_id */}
          <Form.List name="items" initialValue={[{ quantity: 1, unit: 'Cái' }]}>
            {(fields, { add, remove }) => (
              <div className="space-y-3 bg-slate-50/70 p-4 border rounded-xl">
                <div className="flex items-center justify-between border-b pb-2">
                  <label className="font-bold text-slate-800 text-sm">
                    3. Danh sách Thiết bị Y tế Bàn giao ({fields.length} loại thiết bị)
                  </label>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ quantity: 1, unit: 'Cái' })}
                    className="text-primary-600 border-primary-300 font-medium"
                  >
                    Thêm thiết bị vào bàn giao
                  </Button>
                </div>

                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="p-3.5 bg-white border rounded-lg space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded">
                        Mục #{index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          title="Xóa dòng này"
                        />
                      )}
                    </div>

                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const selectedFromOrgId = form.getFieldValue('from_organization_id')
                        const selectedEqId = form.getFieldValue(['items', name, 'equipment_id'])

                        // Filter equipments belonging to selectedFromOrgId
                        const availableEquipments = (equipments || []).filter((eq: any) => {
                          if (!selectedFromOrgId) return true
                          return eq.organization_id === selectedFromOrgId || eq.organization?.id === selectedFromOrgId
                        })

                        const selectedEq = equipments?.find((e: any) => e.id === selectedEqId)

                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                              <Form.Item
                                {...restField}
                                name={[name, 'equipment_id']}
                                rules={[{ required: true, message: 'Vui lòng chọn thiết bị' }]}
                                className="md:col-span-6 m-0"
                                label={
                                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                                    Thiết bị y tế
                                    {selectedEq && (
                                      <Popover
                                        title={
                                          <div className="flex items-center gap-1.5 text-primary-700 font-bold border-b pb-1">
                                            <InfoCircleOutlined className="text-blue-600" />
                                            <span>Thông tin chi tiết Thiết bị</span>
                                          </div>
                                        }
                                        content={
                                          <div className="space-y-1.5 text-xs max-w-xs p-1">
                                            <p className="m-0"><strong>Tên thiết bị:</strong> {selectedEq.name}</p>
                                            <p className="m-0"><strong>Mã quản lý:</strong> <span className="font-mono text-primary-700 font-bold">{selectedEq.equipment_code}</span></p>
                                            {selectedEq.asset_code && <p className="m-0"><strong>Mã tài sản:</strong> {selectedEq.asset_code}</p>}
                                            {selectedEq.model && <p className="m-0"><strong>Model:</strong> {selectedEq.model}</p>}
                                            {selectedEq.serial && <p className="m-0"><strong>Số Serial:</strong> {selectedEq.serial}</p>}
                                            {selectedEq.equipment_type?.name && <p className="m-0"><strong>Loại thiết bị:</strong> {selectedEq.equipment_type.name}</p>}
                                            {selectedEq.organization?.name && <p className="m-0"><strong>Đơn vị đang giữ:</strong> {selectedEq.organization.name}</p>}
                                            {selectedEq.importance_level && <p className="m-0"><strong>Mức quan trọng:</strong> {selectedEq.importance_level}</p>}
                                          </div>
                                        }
                                        trigger="click"
                                      >
                                        <Tooltip title="Bấm để xem đầy đủ thông tin thiết bị này">
                                          <Button type="text" shape="circle" size="small" icon={<QuestionCircleOutlined className="text-blue-600 font-bold" />} />
                                        </Tooltip>
                                      </Popover>
                                    )}
                                  </span>
                                }
                              >
                                <Select
                                  placeholder={
                                    availableEquipments.length === 0
                                      ? '-- Đơn vị này hiện không giữ thiết bị nào --'
                                      : '-- Tìm & Chọn thiết bị y tế (gõ không dấu) --'
                                  }
                                  size="large"
                                  showSearch
                                  filterOption={filterOptionUnaccented}
                                  notFoundContent={availableEquipments.length === 0 ? 'Đơn vị bàn giao chưa có thiết bị nào' : 'Không tìm thấy thiết bị'}
                                >
                                  {availableEquipments.map((eq: any) => (
                                    <Select.Option key={eq.id} value={eq.id}>
                                      {eq.name} ({eq.equipment_code})
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                {...restField}
                                name={[name, 'quantity']}
                                rules={[{ required: true, message: 'Nhập SL' }]}
                                className="md:col-span-3 m-0"
                                label="Số lượng"
                              >
                                <InputNumber min={1} size="large" style={{ width: '100%' }} placeholder="Số lượng" />
                              </Form.Item>

                              <Form.Item
                                {...restField}
                                name={[name, 'unit']}
                                className="md:col-span-3 m-0"
                                label="Đơn vị tính"
                              >
                                <Input size="large" placeholder="Cái / Bộ..." />
                              </Form.Item>
                            </div>

                            {/* Equipment Quick Info Card */}
                            {selectedEq && (
                              <div className="mt-2 p-2 bg-blue-50/90 border border-blue-200 rounded-md text-xs text-slate-700 flex items-center justify-between">
                                <div className="truncate space-x-1">
                                  <span className="font-bold text-blue-900">📍 {selectedEq.name}</span>
                                  <span className="text-slate-300">|</span>
                                  <span>Mã: <strong className="font-mono text-slate-900">{selectedEq.equipment_code}</strong></span>
                                  {selectedEq.model && <span> | Model: <strong>{selectedEq.model}</strong></span>}
                                  {selectedEq.serial && <span> | SN: <strong>{selectedEq.serial}</strong></span>}
                                  {selectedEq.organization && <span> | Nơi giữ: <strong className="text-emerald-700">{selectedEq.organization.name}</strong></span>}
                                </div>

                                <Popover
                                  title={<span className="font-bold text-slate-800">Thông tin chi tiết Thiết bị</span>}
                                  content={
                                    <div className="space-y-1 text-xs max-w-xs p-1">
                                      <p className="m-0"><strong>Tên thiết bị:</strong> {selectedEq.name}</p>
                                      <p className="m-0"><strong>Mã quản lý:</strong> <span className="font-mono text-primary-700 font-bold">{selectedEq.equipment_code}</span></p>
                                      {selectedEq.asset_code && <p className="m-0"><strong>Mã tài sản:</strong> {selectedEq.asset_code}</p>}
                                      {selectedEq.model && <p className="m-0"><strong>Model:</strong> {selectedEq.model}</p>}
                                      {selectedEq.serial && <p className="m-0"><strong>Số Serial:</strong> {selectedEq.serial}</p>}
                                      {selectedEq.equipment_type?.name && <p className="m-0"><strong>Loại thiết bị:</strong> {selectedEq.equipment_type.name}</p>}
                                      {selectedEq.organization?.name && <p className="m-0"><strong>Đơn vị giữ:</strong> {selectedEq.organization.name}</p>}
                                    </div>
                                  }
                                  trigger="click"
                                >
                                  <Button type="link" size="small" icon={<InfoCircleOutlined />} className="p-0 text-xs font-semibold shrink-0 ml-2">
                                    Chi tiết
                                  </Button>
                                </Popover>
                              </div>
                            )}
                          </>
                        )
                      }}
                    </Form.Item>
                  </div>
                ))}
              </div>
            )}
          </Form.List>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Từ ngày (Ngày bàn giao tiếp nhận)"
              name="from_date"
              rules={[{ required: true, message: 'Vui lòng chọn ngày bàn giao' }]}
            >
              <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>

            <Form.Item
              label="Đến ngày (Hạn bàn giao)"
              name="to_date"
            >
              <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" placeholder="Chọn ngày đến" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Người giao (Đại diện Đơn vị bàn giao)" name="deliverer_name">
              <Input placeholder="Ví dụ: Chu Văn Vinh" size="large" prefix={<UserOutlined className="text-slate-400" />} />
            </Form.Item>

            <Form.Item label="Người tiếp nhận (Đại diện Khoa/Phòng nhận)" name="receiver_name">
              <Input placeholder="Ví dụ: Phạm Thị Bích Phương" size="large" prefix={<UserOutlined className="text-slate-400" />} />
            </Form.Item>
          </div>

          {/* Attachment File Upload */}
          <Form.Item label="Đính kèm Tập tin Scan Biên bản (Không bắt buộc)">
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />} size="large">
                Tải lên Tập tin Scan Biên bản (.pdf, .docx, .png)
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item label="Ghi chú & Mục đích bàn giao" name="notes">
            <Input.TextArea rows={2} placeholder="Ví dụ: Bàn giao phục vụ khám bệnh chuyên khoa Nội..." />
          </Form.Item>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t gap-3">
            <Button
              type="default"
              icon={<PrinterOutlined className="text-blue-600" />}
              size="large"
              onClick={handlePreviewFromForm}
              className="text-blue-600 border-blue-300 hover:bg-blue-50 font-semibold"
            >
              🖨️ In / Xem trước Biên bản
            </Button>

            <div className="flex items-center gap-3">
              <Button size="large" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={saveMutation.isPending}
              >
                Tạo Phiếu & Bàn giao
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Modal Upload Signed File Attachment */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 text-lg border-b pb-3">
            <UploadOutlined className="text-primary-600 w-5 h-5" />
            <span>Tải lên Bản ký Scan Biên bản bàn giao ({selectedReceipt?.receipt_code})</span>
          </div>
        }
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <div className="py-4 space-y-4">
          <p className="text-sm text-slate-600 m-0">
            Chọn file scan biên bản đã có đầy đủ chữ ký của Đại diện Bên giao và Đại diện Bên nhận để đính kèm lưu trữ vào hệ thống:
          </p>

          <Upload
            maxCount={1}
            beforeUpload={() => false}
            fileList={uploadFileList}
            onChange={({ fileList }) => setUploadFileList(fileList)}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          >
            <Button icon={<UploadOutlined />} size="large" block>
              Chọn file scan biên bản đã ký (.pdf, .png, .jpg)
            </Button>
          </Upload>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button size="large" onClick={() => setIsUploadModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              loading={uploadMutation.isPending}
              onClick={() => {
                if (selectedReceipt) {
                  uploadMutation.mutate(selectedReceipt.id)
                }
              }}
            >
              Lưu bản ký đính kèm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Printable Handover Preview Window */}
      <Modal
        title="Xem trước & In Biên bản Bàn giao Trang thiết bị Y tế"
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        width={850}
        zIndex={1100}
        footer={
          <div className="flex items-center justify-between">
            {printData?.receipt_id ? (
              <a
                href={`http://localhost:8000/api/v1/receipts/${printData.receipt_id}/export-word`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-semibold border border-blue-200 hover:bg-blue-100"
              >
                <FileWordOutlined /> Tải file Word (.doc)
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic">Lưu phiếu để tải file Word chính thức</span>
            )}
            <div className="space-x-3">
              <Button size="large" onClick={() => setIsPrintModalOpen(false)}>
                Đóng
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
              >
                In biên bản ngay
              </Button>
            </div>
          </div>
        }
      >
        <div id="printable-handover-document" className="p-8 bg-white text-slate-900 space-y-6 font-serif border rounded-lg shadow-inner">
          {/* Header Table */}
          <div className="flex justify-between items-start text-center border-b pb-4">
            <div className="w-1/2 text-left space-y-0.5">
              <h4 className="font-bold text-sm uppercase m-0">BỆNH VIỆN ĐA KHOA HÒA HẢO</h4>
              <h4 className="font-bold text-sm uppercase m-0 text-blue-700">MEDIC CẦN THƠ</h4>
              <p className="text-xs text-slate-500 italic m-0">PHÒNG VẬT TƯ – THIẾT BỊ Y TẾ</p>
            </div>
            <div className="w-1/2 text-right space-y-0.5">
              <h4 className="font-bold text-sm uppercase m-0">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
              <p className="font-bold text-xs m-0">Độc lập - Tự do - Hạnh phúc</p>
              <p className="text-xs m-0 text-slate-400">-------------------</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold uppercase tracking-wide m-0">BIÊN BẢN BÀN GIAO VÀ TIẾP NHẬN<br/>TRANG THIẾT BỊ Y TẾ</h2>
            <p className="text-xs text-slate-500 italic m-0">
              Mã biên bản: <strong>{printData?.receipt_code || 'TN-PREVIEW'}</strong> · Ngày {dayjs().format('DD')} tháng {dayjs().format('MM')} năm {dayjs().format('YYYY')}
            </p>
          </div>

          {/* Parties Info */}
          <div className="space-y-3 text-sm">
            <p className="m-0 leading-relaxed">
              Hôm nay, tại Phòng Vật tư – Thiết bị y tế, Bệnh viện Đa khoa Hòa Hảo - Medic Cần Thơ, chúng tôi tiến hành bàn giao và tiếp nhận trang thiết bị y tế gồm các bên sau:
            </p>

            <div className="space-y-1">
              <h5 className="font-bold text-sm uppercase text-slate-800 m-0">I. BÊN GIAO (Đại diện Bên giao):</h5>
              <div className="pl-4 text-xs space-y-1">
                <p className="m-0"><strong>Họ và tên:</strong> {printData?.deliverer_name || 'Chu Văn Vinh'}</p>
                <p className="m-0"><strong>Chức vụ / Đơn vị:</strong> {printData?.from_organization_name || 'Phòng Vật tư – Thiết bị y tế'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-sm uppercase text-slate-800 m-0">II. BÊN NHẬN (Đơn vị tiếp nhận quản lý & sử dụng):</h5>
              <div className="pl-4 text-xs space-y-1">
                <p className="m-0"><strong>Họ và tên:</strong> {printData?.receiver_name || 'Phạm Thị Bích Phương'}</p>
                <p className="m-0"><strong>Đơn vị tiếp nhận:</strong> <strong className="text-blue-700">{printData?.to_organization_name}</strong></p>
              </div>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-sm uppercase text-slate-800 m-0">III. DANH MỤC THIẾT BỊ BÀN GIAO:</h5>
              <table className="w-full border-collapse border border-slate-300 text-xs mt-2">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <th className="border border-slate-300 p-2 text-center">STT</th>
                    <th className="border border-slate-300 p-2 text-left">Tên thiết bị y tế</th>
                    <th className="border border-slate-300 p-2 text-left">Mã quản lý</th>
                    <th className="border border-slate-300 p-2 text-center">Số lượng</th>
                    <th className="border border-slate-300 p-2 text-left">Thời gian bàn giao</th>
                    <th className="border border-slate-300 p-2 text-left">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {(printData?.items || []).map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-semibold">{item.name}</td>
                      <td className="border border-slate-300 p-2 font-mono text-slate-700">{item.code}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{item.quantity} {item.unit || 'Cái'}</td>
                      <td className="border border-slate-300 p-2">
                        Từ: <strong>{printData?.from_date}</strong> <br/>
                        Đến: <strong>{printData?.to_date}</strong>
                      </td>
                      <td className="border border-slate-300 p-2 text-slate-600">{item.notes || printData?.notes || 'Hoạt động bình thường'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs pt-2">
              <h5 className="font-bold uppercase m-0 text-slate-800">IV. CAM KẾT VÀ NGHĨA VỤ CỦA CÁC BÊN:</h5>
              <p className="m-0 text-slate-600">1. Bên nhận đã kiểm tra thực tế, thiết bị hoạt động ổn định và có trách nhiệm bảo quản đúng quy trình.</p>
              <p className="m-0 text-slate-600">2. Biên bản này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between text-center pt-8 text-xs">
            <div className="w-1/2 space-y-12">
              <div>
                <p className="font-bold uppercase m-0">ĐẠI DIỆN BÊN NHẬN</p>
                <p className="text-slate-400 italic m-0">(Ký, đóng dấu & ghi rõ họ tên)</p>
              </div>
              <p className="font-bold text-slate-800 m-0">{printData?.receiver_name || '................................'}</p>
            </div>
            <div className="w-1/2 space-y-12">
              <div>
                <p className="font-bold uppercase m-0">ĐẠI DIỆN BÊN GIAO</p>
                <p className="text-slate-400 italic m-0">(Ký, đóng dấu & ghi rõ họ tên)</p>
              </div>
              <p className="font-bold text-slate-800 m-0">{printData?.deliverer_name || '................................'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
