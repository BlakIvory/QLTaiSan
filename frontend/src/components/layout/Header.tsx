import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Menu } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

interface HeaderProps {
  onToggleSidebar?: () => void
}

const routeLabels: Record<string, string> = {
  dashboard:              'Trang chủ',
  equipment:              'Thiết bị',
  receipts:               'Tiếp nhận',
  allocations:            'Cấp phát',
  transfers:              'Điều chuyển',
  'damage-reports':       'Báo hỏng',
  repairs:                'Sửa chữa',
  maintenance:            'Bảo trì',
  'maintenance-plans':    'Kế hoạch bảo trì',
  inspections:            'Kiểm định',
  loans:                  'Mượn / Trả',
  inventories:            'Kiểm kê',
  recalls:                'Thu hồi',
  liquidations:           'Thanh lý',
  suppliers:              'Nhà cung cấp',
  contracts:              'Hợp đồng',
  reports:                'Báo cáo',
  users:                  'Người dùng',
  roles:                  'Vai trò & quyền',
  'audit-logs':           'Nhật ký hệ thống',
  'purchase-requests':    'Đề nghị mua tài sản',
  'purchase-summaries':   'Tổng hợp đề nghị',
  proposals:              'Tờ trình chủ trương (BGĐ)',
  create:                 'Tạo mới',
  edit:                   'Chỉnh sửa',
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const location = useLocation()
  const { user } = useAuth()

  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <header className="main-header">
      {/* Left: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          aria-label="Mở menu điều hướng"
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <nav className="breadcrumb overflow-x-auto whitespace-nowrap py-1 scrollbar-none min-w-0">
          <Link to="/dashboard" className="breadcrumb-item shrink-0">Trang chủ</Link>
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1
            const label = routeLabels[seg] || seg
            const to = '/' + segments.slice(0, i + 1).join('/')

            return (
              <span key={i} className="inline-flex items-center gap-1.5 shrink-0">
                <ChevronRight className="w-3 h-3 breadcrumb-sep shrink-0" />
                {isLast ? (
                  <span className="breadcrumb-current truncate max-w-[140px] sm:max-w-xs">{label}</span>
                ) : (
                  <Link to={to} className="breadcrumb-item shrink-0">{label}</Link>
                )}
              </span>
            )
          })}
        </nav>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search button */}
        {/* <button className="btn-ghost p-2 rounded-lg relative" title="Tìm kiếm">
          <Search className="w-4 h-4" />
        </button> */}

        {/* Notifications */}
        {/* <button className="btn-ghost p-2 rounded-lg relative" id="notification-btn">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button> */}

        {/* User avatar & info */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-[11px] text-slate-500 leading-tight font-mono">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
