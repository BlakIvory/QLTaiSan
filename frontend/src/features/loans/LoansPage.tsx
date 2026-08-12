import { Stethoscope, Search } from 'lucide-react'

export default function LoansPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary-600" />
            Mượn & Trả Thiết bị Y tế
          </h1>
          <p className="page-subtitle">Quản lý mượn/trả thiết bị dùng chung giữa các Khoa/Phòng cấp cứu</p>
        </div>
      </div>
      <div className="card p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm theo mã mượn, tên khoa mượn..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
        </div>
      </div>
      <div className="card p-12 text-center text-slate-400">
        Không có thiết bị nào đang mượn quá hạn.
      </div>
    </div>
  )
}
