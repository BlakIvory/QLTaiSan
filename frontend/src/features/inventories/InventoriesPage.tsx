import { BookOpen, Search } from 'lucide-react'

export default function InventoriesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600" />
            Kiểm kê Tài sản Thiết bị
          </h1>
          <p className="page-subtitle">Đợt kiểm kê tài sản hàng năm, quét tem QR đối soát thông tin</p>
        </div>
      </div>
      <div className="card p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm theo tên đợt kiểm kê..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
        </div>
      </div>
      <div className="card p-12 text-center text-slate-400">
        Chưa mở đợt kiểm kê mới.
      </div>
    </div>
  )
}
