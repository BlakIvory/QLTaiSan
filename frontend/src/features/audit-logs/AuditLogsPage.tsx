import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { Activity, Search, Shield, User, Globe } from 'lucide-react'

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', search],
    queryFn: () => api.get(API_ENDPOINTS.AUDIT_LOGS.BASE, { params: { search } }).then((r) => r.data.data),
  })

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
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Hành động</th>
                <th>Module</th>
                <th>Người thực hiện</th>
                <th>Địa chỉ IP</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5}><div className="skeleton h-8 w-full" /></td></tr>
                ))
              ) : !logs?.length ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Chưa có nhật ký hoạt động nào.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className={`badge ${
                        log.action === 'LOGIN' ? 'badge-green' :
                        log.action === 'CREATE' ? 'badge-blue' :
                        log.action === 'UPDATE' ? 'badge-yellow' : 'badge-gray'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-700">{log.module}</td>
                    <td className="text-sm font-semibold text-slate-900">{log.user?.name || 'Hệ thống'}</td>
                    <td className="font-mono text-xs text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                    <td className="text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
