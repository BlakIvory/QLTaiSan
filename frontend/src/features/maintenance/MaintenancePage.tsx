import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table, Tag } from 'antd'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { Calendar, Search } from 'lucide-react'
import { DEFAULT_TABLE_PAGINATION } from '../../lib/pagination'

export default function MaintenancePage() {
  const [search, setSearch] = useState('')

  const { data: plans, isLoading } = useQuery({
    queryKey: ['maintenance-plans', search],
    queryFn: () => api.get(API_ENDPOINTS.MAINTENANCE.PLANS, { params: { search } }).then((r) => r.data.data),
  })

  const columns = [
    {
      title: 'Thiết bị',
      key: 'equipment',
      render: (_: any, p: any) => (
        <div>
          <p className="font-semibold text-slate-900 text-sm">{p.equipment?.name}</p>
          <p className="text-xs text-slate-400 font-mono">{p.equipment?.equipment_code}</p>
        </div>
      ),
    },
    {
      title: 'Khoa / Phòng',
      key: 'organization',
      render: (_: any, p: any) => <span className="text-sm text-slate-600">{p.equipment?.organization?.name || '—'}</span>,
    },
    {
      title: 'Chu kỳ (Ngày)',
      dataIndex: 'cycle_days',
      key: 'cycle_days',
      render: (days: number) => <span className="font-mono text-sm font-semibold">{days || 180} ngày</span>,
    },
    {
      title: 'Lần bảo trì gần nhất',
      dataIndex: 'last_maintenance_date',
      key: 'last_maintenance_date',
      render: (d: string) => <span className="text-xs text-slate-500">{d ? formatDate(d) : 'Chưa thực hiện'}</span>,
    },
    {
      title: 'Lần bảo trì tiếp theo',
      dataIndex: 'next_maintenance_date',
      key: 'next_maintenance_date',
      render: (d: string) => <span className="text-xs font-semibold text-slate-800">{formatDate(d)}</span>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: () => <Tag color="warning">Đã lên lịch</Tag>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            Lịch & Kế hoạch Bảo trì Định kỳ
          </h1>
          <p className="page-subtitle">
            Theo dõi chu kỳ bảo trì, lên lịch nhắc nhở và ghi nhận kết quả bảo trì thiết bị
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vui lòng nhập mã hoặc tên thiết bị"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={plans || []}
          columns={columns}
          pagination={DEFAULT_TABLE_PAGINATION}
        />
      </div>
    </div>
  )
}
