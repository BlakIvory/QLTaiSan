import React, { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Card,
  Alert,
  Spin,
  Space,
  Typography,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { useOptions } from '../../hooks/useOptions'
import { filterOptionUnaccented } from '../../lib/utils'

const { Title, Text } = Typography
const { TextArea } = Input

export default function EquipmentFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  // Fetch Options from Backend
  const { getOptionList } = useOptions(['importance_level'])
  const importanceOptions = getOptionList('importance_level')

  // Fetch Equipment Types
  const { data: equipmentTypes } = useQuery({
    queryKey: ['equipment-types-list'],
    queryFn: () => api.get('/equipment-types').then((r) => r.data.data ?? r.data),
  })

  // Fetch Organizations
  const { data: organizations } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: () => api.get(API_ENDPOINTS.ORGANIZATIONS.BASE).then((r) => r.data.data),
  })

  // Fetch Equipment Data if Edit Mode
  const { data: existingEquipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment-detail', id],
    queryFn: () => api.get(`${API_ENDPOINTS.EQUIPMENT.BASE}/${id}`).then((r) => r.data.data),
    enabled: isEditMode,
  })

  useEffect(() => {
    if (existingEquipment && isEditMode) {
      form.setFieldsValue({
        name: existingEquipment.name,
        equipment_type_id: existingEquipment.equipment_type_id || existingEquipment.equipment_type?.id,
        asset_code: existingEquipment.asset_code,
        model: existingEquipment.model,
        serial: existingEquipment.serial || existingEquipment.serial_number,
        organization_id: existingEquipment.organization_id || existingEquipment.organization?.id,
        importance_level: existingEquipment.importance_level || 'MEDIUM',
        year_of_manufacture: existingEquipment.year_of_manufacture,
        purchase_date: existingEquipment.purchase_date ? dayjs(existingEquipment.purchase_date) : null,
        in_use_date: existingEquipment.in_use_date ? dayjs(existingEquipment.in_use_date) : null,
        original_price: existingEquipment.original_price,
        notes: existingEquipment.notes,
      })
    } else if (!isEditMode && orgs && orgs.length > 0) {
      const csvcOrg = orgs.find((o: any) => {
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
      if (csvcOrg) {
        form.setFieldValue('organization_id', csvcOrg.id)
      }
    }
  }, [existingEquipment, isEditMode, orgs, form])

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditMode) {
        return api.put(`${API_ENDPOINTS.EQUIPMENT.BASE}/${id}`, payload)
      } else {
        return api.post(API_ENDPOINTS.EQUIPMENT.BASE, payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      navigate('/equipment')
    },
  })

  const onFinish = (values: any) => {
    Modal.confirm({
      title: isEditMode ? 'Xác nhận cập nhật thông tin thiết bị' : 'Xác nhận thêm mới thiết bị',
      content: isEditMode
        ? 'Bạn có chắc chắn muốn lưu các thay đổi cho thiết bị này không?'
        : 'Bạn có chắc chắn muốn lưu thông tin và tạo mới thiết bị này vào hệ thống không?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: { type: 'primary' },
      onOk() {
        mutation.mutate(values)
      },
    })
  }

  if (isEditMode && isLoadingEquipment) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="Đang tải thông tin thiết bị..." />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 40 }} className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/equipment">
            <Button icon={<ArrowLeftOutlined />} size="large" />
          </Link>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {isEditMode ? 'Chỉnh sửa Thiết bị' : 'Thêm mới Thiết bị'}
            </Title>
            {/* <Text type="secondary">
              Form Ant Design kiểu Horizontal (Nhãn nằm ngang bên trái, khung nhập nét rõ ràng)
            </Text> */}
          </div>
        </div>
      </div>

      {mutation.isError && (
        <Alert
          type="error"
          message="Có lỗi xảy ra"
          description={(mutation.error as any)?.response?.data?.message || 'Lỗi khi lưu dữ liệu'}
          showIcon
        />
      )}

      {/* Antd Horizontal Form */}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        onFinish={onFinish}
        initialValues={{
          importance_level: 'MEDIUM',
          year_of_manufacture: new Date().getFullYear(),
        }}
        size="large"
      >
        <Card title="1. Thông tin chung" style={{ marginBottom: 24 }} className="shadow-xs">
          <Form.Item
            label="Tên thiết bị"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị' }]}
          >
            <Input placeholder="Ví dụ: Máy siêu âm màu 4D Voluson E10" />
          </Form.Item>

          <Form.Item
            label="Loại thiết bị"
            name="equipment_type_id"
            rules={[{ required: true, message: 'Vui lòng chọn loại thiết bị' }]}
          >
            <Select placeholder="-- Chọn loại thiết bị --" showSearch filterOption={filterOptionUnaccented}>
              {equipmentTypes?.map((t: any) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Mã tài sản cố định" name="asset_code">
            <Input placeholder="Ví dụ: TS-SA-01" />
          </Form.Item>

          <Form.Item label="Model" name="model">
            <Input placeholder="Ví dụ: Voluson E10" />
          </Form.Item>

          <Form.Item label="Số Serial" name="serial">
            <Input placeholder="Ví dụ: SN-GE-4D-9988" />
          </Form.Item>
        </Card>

        <Card title="2. Đơn vị quản lý & Mức độ quan trọng" style={{ marginBottom: 24 }} className="shadow-xs">
          <Form.Item label="Khoa / Phòng quản lý" name="organization_id" help="Mặc định: Phòng CSVC / Vật tư tiếp nhận (Cấp >= 1)">
            <Select placeholder="-- Mặc định: Phòng CSVC / Vật tư tiếp nhận --" allowClear showSearch filterOption={filterOptionUnaccented}>
              {organizations?.filter((org: any) => org.level === undefined || org.level >= 1).map((org: any) => (
                <Select.Option key={org.id} value={org.id}>
                  {org.name} {org.level !== undefined ? `(Cấp ${org.level})` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Mức độ quan trọng" name="importance_level">
            <Select placeholder="-- Chọn mức độ quan trọng --">
              {importanceOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Card title="3. Thông số kỹ thuật & Giá trị" style={{ marginBottom: 24 }} className="shadow-xs">
          <Form.Item label="Năm sản xuất" name="year_of_manufacture">
            <InputNumber style={{ width: '100%' }} placeholder="2024" min={1900} max={2100} />
          </Form.Item>

          <Form.Item label="Ngày mua" name="purchase_date">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày mua" />
          </Form.Item>

          <Form.Item label="Ngày đưa vào sử dụng" name="in_use_date">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày đưa vào sử dụng" />
          </Form.Item>

          <Form.Item label="Nguyên giá (VNĐ)" name="original_price">
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
              placeholder="1,200,000,000"
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="notes">
            <TextArea rows={3} placeholder="Nhập ghi chú chi tiết về thiết bị..." />
          </Form.Item>
        </Card>

        {/* Action buttons */}
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Link to="/equipment">
              <Button size="large">Hủy bỏ</Button>
            </Link>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SaveOutlined />}
              loading={mutation.isPending}
            >
              {isEditMode ? 'Lưu thay đổi' : 'Tạo mới thiết bị'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}
