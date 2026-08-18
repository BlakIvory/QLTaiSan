/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, DatePicker, Descriptions, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Upload, message } from 'antd'
import { DeleteOutlined, EditOutlined, EyeOutlined, FileTextOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'

const status = { DRAFT: ['Chờ nhập kho', 'orange'], CONFIRMED: ['Đã nhập kho', 'green'] } as Record<string, [string, string]>

export default function ReceiptsPage() {
  const qc = useQueryClient(); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<any>(); const [detail, setDetail] = useState<any>(); const [search, setSearch] = useState(''); const [file, setFile] = useState<any>(); const [form] = Form.useForm()
  const { data = [], isLoading } = useQuery({ queryKey: ['receipts', search], queryFn: () => api.get(API_ENDPOINTS.RECEIPTS.BASE, { params: { search } }).then(r => r.data.data) })
  const { data: equipment = [] } = useQuery({ queryKey: ['equipment-receipt'], queryFn: () => api.get(API_ENDPOINTS.EQUIPMENT.BASE, { params: { per_page: 500, status: 'PENDING_RECEIPT' } }).then(r => r.data.data) })
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get(API_ENDPOINTS.SUPPLIERS.BASE).then(r => r.data.data) })
  const { data: orgs = [] } = useQuery({ queryKey: ['organizations-list'], queryFn: () => api.get(API_ENDPOINTS.ORGANIZATIONS.BASE).then(r => r.data.data) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['receipts'] }); qc.invalidateQueries({ queryKey: ['equipment'] }); qc.invalidateQueries({ queryKey: ['equipment-receipt'] }) }
  const save = useMutation({ mutationFn: (v: any) => { const fd = new FormData(); ['supplier_id','contract_number','invoice_number','organization_id','total_amount','notes'].forEach(k => v[k] != null && fd.append(k, v[k])); fd.append('invoice_date', dayjs(v.invoice_date).format('YYYY-MM-DD')); fd.append('receipt_date', dayjs(v.receipt_date).format('YYYY-MM-DD')); v.equipment_ids.forEach((id: number, i: number) => { fd.append(`items[${i}][equipment_id]`, String(id)); fd.append(`items[${i}][quantity]`, '1'); fd.append(`items[${i}][unit]`, 'Cái') }); if (file) fd.append('attachment', file); if (editing) { fd.append('_method', 'PUT'); return api.post(`${API_ENDPOINTS.RECEIPTS.BASE}/${editing.id}`, fd) } return api.post(API_ENDPOINTS.RECEIPTS.BASE, fd) }, onSuccess: (r) => { message.success(r.data.message); setOpen(false); setEditing(undefined); form.resetFields(); setFile(undefined); refresh() }, onError: (e:any) => message.error(e.response?.data?.message || 'Không thể lưu phiếu nhập') })
  const confirm = useMutation({ mutationFn: (id:number) => api.post(`${API_ENDPOINTS.RECEIPTS.BASE}/${id}/confirm`), onSuccess: r => { message.success(r.data.message); refresh() }, onError: (e:any) => message.error(e.response?.data?.message) })
  const remove = useMutation({ mutationFn: (id:number) => api.delete(`${API_ENDPOINTS.RECEIPTS.BASE}/${id}`), onSuccess: r => { message.success(r.data.message); refresh() }, onError: (e:any) => message.error(e.response?.data?.message) })
  const deleteReceipt = (r:any) => Modal.confirm({ title:'Xóa phiếu nhập?', content:`Phiếu ${r.code} sẽ bị xóa và không thể khôi phục.`, okText:'Xóa', cancelText:'Hủy', okButtonProps:{danger:true}, onOk:()=>remove.mutateAsync(r.id) })
  const openCreate = () => { setEditing(undefined); setFile(undefined); form.resetFields(); form.setFieldsValue({ invoice_date:dayjs(), receipt_date:dayjs() }); setOpen(true) }
  const openEdit = (r:any) => { setEditing(r); setFile(undefined); form.setFieldsValue({ supplier_id:r.supplier_id, contract_number:r.contract_number, invoice_number:r.invoice_number, invoice_date:r.invoice_date ? dayjs(r.invoice_date) : null, receipt_date:r.receipt_date ? dayjs(r.receipt_date) : null, organization_id:r.organization_id, total_amount:r.total_amount ? Number(r.total_amount) : null, notes:r.notes, equipment_ids:r.items?.map((x:any)=>x.equipment_id) || [] }); setOpen(true) }
  const columns:any[] = [
    { title:'Mã phiếu', dataIndex:'code' }, { title:'Hóa đơn', render:(_:any,r:any)=><><b>{r.invoice_number}</b><div className="text-xs text-slate-500">{r.invoice_date}</div></> },
    { title:'Nhà cung cấp', render:(_:any,r:any)=>r.supplier?.name || '—' }, { title:'Kho nhập', render:(_:any,r:any)=>r.organization?.name },
    { title:'Tài sản', render:(_:any,r:any)=>r.items?.map((i:any)=>i.equipment?.equipment_code).join(', ') },
    { title:'Trạng thái', render:(_:any,r:any)=><Tag color={(status[r.status]||[r.status,'default'])[1]}>{(status[r.status]||[r.status])[0]}</Tag> },
    { title:'Thao tác', width:330, render:(_:any,r:any)=><Space wrap>
      <Button icon={<EyeOutlined/>} onClick={()=>setDetail(r)}>Chi tiết</Button>
      {r.attachment_path && <Button icon={<FileTextOutlined/>} onClick={()=>window.open(`http://localhost:8000${r.attachment_path}`,'_blank')}>Chứng từ</Button>}
      {r.status==='DRAFT' && <><Button icon={<EditOutlined/>} onClick={()=>openEdit(r)}>Sửa</Button><Button type="primary" onClick={()=>confirm.mutate(r.id)}>Xác nhận nhập kho</Button><Button danger icon={<DeleteOutlined/>} onClick={()=>deleteReceipt(r)}>Xóa</Button></>}
    </Space> },
  ]
  return <div className="space-y-5"><div className="flex justify-between"><div><h1 className="page-title">Hóa đơn & Phiếu nhập tài sản</h1><p className="page-subtitle">Ghi nhận chứng từ mua và xác nhận tài sản vào kho</p></div><Button type="primary" icon={<PlusOutlined/>} onClick={openCreate}>Lập phiếu nhập</Button></div>
    <Card><Input.Search placeholder="Vui lòng nhập mã phiếu, số hóa đơn hoặc nhà cung cấp" onSearch={setSearch} allowClear/><Table className="mt-4" rowKey="id" loading={isLoading} dataSource={data} columns={columns}/></Card>
    <Modal title={editing ? `Cập nhật phiếu nhập ${editing.code}` : 'Lập phiếu nhập theo hóa đơn'} open={open} onCancel={()=>{setOpen(false);setEditing(undefined)}} onOk={()=>form.submit()} okText={editing ? 'Lưu thay đổi' : 'Lập phiếu nhập'} width={720} confirmLoading={save.isPending}><Form form={form} layout="vertical" onFinish={v=>save.mutate(v)}>
      <div className="grid grid-cols-2 gap-3"><Form.Item name="invoice_number" label="Số hóa đơn" rules={[{required:true}]}><Input/></Form.Item><Form.Item name="invoice_date" label="Ngày hóa đơn" rules={[{required:true}]}><DatePicker className="w-full"/></Form.Item>
      <Form.Item name="supplier_id" label="Nhà cung cấp"><Select showSearch optionFilterProp="label" options={suppliers.map((x:any)=>({value:x.id,label:x.name}))}/></Form.Item><Form.Item name="contract_number" label="Số hợp đồng"><Input/></Form.Item>
      <Form.Item name="receipt_date" label="Ngày nhập" rules={[{required:true}]}><DatePicker className="w-full"/></Form.Item><Form.Item name="organization_id" label="Kho tiếp nhận" rules={[{required:true}]}><Select options={orgs.map((x:any)=>({value:x.id,label:x.name}))}/></Form.Item>
      <Form.Item name="total_amount" label="Tổng tiền hóa đơn"><InputNumber min={0} className="w-full" formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,'.')}/></Form.Item><Form.Item label="File hóa đơn"><Upload beforeUpload={f=>{setFile(f);return false}} maxCount={1}><Button icon={<UploadOutlined/>}>Chọn file</Button></Upload></Form.Item></div>
      <Form.Item name="equipment_ids" label="Tài sản trên hóa đơn" rules={[{required:true}]}><Select mode="multiple" optionFilterProp="label" options={equipment.map((x:any)=>({value:x.id,label:`${x.equipment_code} - ${x.name}`}))}/></Form.Item><Form.Item name="notes" label="Ghi chú"><Input.TextArea/></Form.Item>
    </Form></Modal>
    <Modal title={`Chi tiết phiếu nhập ${detail?.code || ''}`} open={!!detail} onCancel={()=>setDetail(undefined)} footer={<Button onClick={()=>setDetail(undefined)}>Đóng</Button>} width={760}>
      {detail && <div className="space-y-4"><Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Mã phiếu">{detail.code}</Descriptions.Item><Descriptions.Item label="Trạng thái"><Tag color={(status[detail.status]||[detail.status,'default'])[1]}>{(status[detail.status]||[detail.status])[0]}</Tag></Descriptions.Item>
        <Descriptions.Item label="Số hóa đơn">{detail.invoice_number || '—'}</Descriptions.Item><Descriptions.Item label="Ngày hóa đơn">{detail.invoice_date || '—'}</Descriptions.Item>
        <Descriptions.Item label="Nhà cung cấp">{detail.supplier?.name || '—'}</Descriptions.Item><Descriptions.Item label="Số hợp đồng">{detail.contract_number || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày nhập">{detail.receipt_date}</Descriptions.Item><Descriptions.Item label="Kho nhập">{detail.organization?.name || '—'}</Descriptions.Item>
        <Descriptions.Item label="Tổng tiền">{detail.total_amount ? `${Number(detail.total_amount).toLocaleString('vi-VN')} ₫` : '—'}</Descriptions.Item><Descriptions.Item label="Ghi chú">{detail.notes || '—'}</Descriptions.Item>
      </Descriptions><Table size="small" pagination={false} rowKey="id" dataSource={detail.items || []} columns={[{title:'Mã tài sản',render:(_:any,x:any)=>x.equipment?.equipment_code},{title:'Tên tài sản',render:(_:any,x:any)=>x.equipment?.name},{title:'Số lượng',render:(_:any,x:any)=>`${x.quantity} ${x.unit || 'Cái'}`}]} /></div>}
    </Modal></div>
}
