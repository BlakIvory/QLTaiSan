import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'
import { API_ENDPOINTS } from '../../lib/constants'
import { Building2, Plus, Search, Phone, Mail, MapPin } from 'lucide-react'

export default function SuppliersPage() {
  const [search, setSearch] = useState('')

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => api.get(API_ENDPOINTS.SUPPLIERS.BASE, { params: { search } }).then((r) => r.data.data),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" />
            Nhà cung cấp & Đối tác
          </h1>
          <p className="page-subtitle">Danh mục nhà cung cấp thiết bị y tế và đơn vị bảo hành bảo trì</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên nhà cung cấp, mã số thuế, số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5"><div className="skeleton h-20 w-full" /></div>
          ))
        ) : !suppliers?.length ? (
          <div className="col-span-2 card p-12 text-center text-slate-400">
            Chưa có thông tin nhà cung cấp nào.
          </div>
        ) : (
          suppliers.map((s: any) => (
            <div key={s.id} className="card p-5 hover:shadow-md transition-all border border-slate-200/80">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">{s.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Mã: {s.code}</p>
                  </div>
                </div>
                <span className="badge badge-green">Hoạt động</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.phone || 'Chưa cập nhật SĐT'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.email || 'Chưa cập nhật Email'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.address || 'Việt Nam'}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
