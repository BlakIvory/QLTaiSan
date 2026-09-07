import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table, Tag } from 'antd'
import api from '../../api/axios'
import { formatDateTime } from '../../lib/utils'
import { API_ENDPOINTS } from '../../lib/constants'
import { Activity, Search } from 'lucide-react'
import { DEFAULT_TABLE_PAGINATION } from '../../lib/pagination'

const actionColors: Record<string, string> = {
  LOGIN: 'green',
  CREATE: 'blue',
  UPDATE: 'orange',
  DELETE: 'red',
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', search],
    queryFn: () => api.get(API_ENDPOINTS.AUDIT_LOGS.BASE, { params: { search } }).then((r) => r.data.data),
  })

  const columns = [
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={actionColors[action] || 'default'}>{action}</Tag>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      render: (module: string) => <span className="font-mono text-xs text-slate-700">{module}</span>,
    },
    {
      title: 'Người thực hiện',
      key: 'user',
      render: (_: any, r: any) => <span className="text-sm font-semibold text-slate-900">{r.user?.name || 'Hệ thống'}</span>,
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string) => <span className="font-mono text-xs text-slate-500">{ip || '127.0.0.1'}</span>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span className="text-xs text-slate-500">{formatDateTime(date)}</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-600" />
            Nhật ký Hệ thống (Audit Logs)
          </h1>
          <p className="page-subtitle">Ghi lại toàn bộ lịch sử thao tác, tác động dữ liệu và đăng nhập hệ thống</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vui lòng nhập hành động, module hoặc người thực hiện"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={logs || []}
          columns={columns}
          pagination={DEFAULT_TABLE_PAGINATION}
        />
      </div>
    </div>
  )
}
