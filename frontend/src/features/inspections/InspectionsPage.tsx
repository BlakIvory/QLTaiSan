import { ShieldCheck, Plus, Search } from 'lucide-react'

export default function InspectionsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Kiểm định & Hiệu chuẩn Thiết bị
          </h1>
          <p className="page-subtitle">Theo dõi hạn kiểm định an toàn và giấy chứng nhận kiểm định y tế</p>
        </div>
      </div>
      <div className="card p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Vui lòng nhập mã thiết bị hoặc số tem kiểm định" className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
        </div>
      </div>
      <div className="card p-12 text-center text-slate-400">
        Tất cả thiết bị có yêu cầu kiểm định đều đang trong hạn hiệu lực.
      </div>
    </div>
  )
}
