import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import {
  Activity, LayoutDashboard, Package, ClipboardList,
  ArrowRightLeft, Wrench, ShieldCheck, Calendar, Stethoscope,
  HandshakeIcon, FileText, Users, Settings, AlertTriangle,
  Building2, ChevronRight, BookOpen, BarChart3, Trash2,
  RotateCcw, LogOut, Layers, Network, Sliders, Shield
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  roles?: string[]
  permissions?: string[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

const ROLE_NAMES_VI: Record<string, string> = {
  admin: 'Quản trị viên',
  pvtttby: 'Phòng Vật tư – TTBYT',
  department_staff: 'Khoa / Phòng',
  technician: 'Kỹ thuật viên',
  leader: 'Ban Lãnh đạo',
}

const navSections: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        to: '/dashboard',
      },
    ],
  },
  {
    title: 'Quản lý thiết bị',
    items: [
      {
        label: 'Danh sách thiết bị',
        icon: Package,
        to: '/equipment',
        roles: ['admin', 'pvtttby', 'department_staff', 'leader'],
        permissions: ['equipment.view'],
      },
      {
        label: 'Quản lý Tiếp nhận & Bàn giao Thiết bị',
        icon: ClipboardList,
        to: '/receipts',
        roles: ['admin', 'pvtttby'],
        permissions: ['equipment.receive'],
      },
      {
        label: 'Cấp phát thiết bị',
        icon: HandshakeIcon,
        to: '/allocations',
        roles: ['admin', 'pvtttby'],
        permissions: ['equipment.allocate'],
      },
      {
        label: 'Điều chuyển thiết bị',
        icon: ArrowRightLeft,
        to: '/transfers',
        roles: ['admin', 'pvtttby', 'leader'],
        permissions: ['equipment.transfer'],
      },
    ],
  },
  {
    title: 'Kỹ thuật & bảo dưỡng',
    items: [
      {
        label: 'Báo hỏng thiết bị',
        icon: AlertTriangle,
        to: '/damage-reports',
        roles: ['admin', 'pvtttby', 'department_staff', 'technician'],
        permissions: ['damage_report.view', 'damage_report.create'],
      },
      {
        label: 'Sửa chữa thiết bị',
        icon: Wrench,
        to: '/repairs',
        roles: ['admin', 'pvtttby', 'technician', 'leader'],
        permissions: ['repair.view'],
      },
      {
        label: 'Bảo trì định kỳ',
        icon: Calendar,
        to: '/maintenance',
        roles: ['admin', 'pvtttby', 'technician'],
        permissions: ['maintenance.view'],
      },
      {
        label: 'Kiểm định thiết bị',
        icon: ShieldCheck,
        to: '/inspections',
        roles: ['admin', 'pvtttby', 'technician'],
        permissions: ['inspection.view'],
      },
    ],
  },
  {
    title: 'Vận hành & Kiểm kê',
    items: [
      {
        label: 'Mượn / Trả thiết bị',
        icon: Stethoscope,
        to: '/loans',
        roles: ['admin', 'pvtttby', 'department_staff'],
        permissions: ['loan.view'],
      },
      {
        label: 'Kiểm kê tài sản',
        icon: BookOpen,
        to: '/inventories',
        roles: ['admin', 'pvtttby'],
        permissions: ['inventory.view'],
      },
      {
        label: 'Thu hồi thiết bị',
        icon: RotateCcw,
        to: '/recalls',
        roles: ['admin', 'pvtttby'],
        permissions: ['equipment.recall'],
      },
      {
        label: 'Thanh lý thiết bị',
        icon: Trash2,
        to: '/liquidations',
        roles: ['admin', 'pvtttby', 'leader'],
        permissions: ['equipment.liquidate'],
      },
    ],
  },
  {
    title: 'Nhà cung cấp & Hợp đồng',
    items: [
      {
        label: 'Nhà cung cấp',
        icon: Building2,
        to: '/suppliers',
        roles: ['admin', 'pvtttby'],
        permissions: ['supplier.view'],
      },
      {
        label: 'Hợp đồng bảo trì',
        icon: FileText,
        to: '/contracts',
        roles: ['admin', 'pvtttby'],
        permissions: ['contract.view'],
      },
    ],
  },
  {
    title: 'Báo cáo & Thống kê',
    items: [
      {
        label: 'Báo cáo tổng hợp',
        icon: BarChart3,
        to: '/reports',
        roles: ['admin', 'pvtttby', 'leader'],
        permissions: ['report.view'],
      },
    ],
  },
  {
    title: 'Danh mục hệ thống',
    items: [
      {
        label: 'Khoa / Phòng / Cơ sở',
        icon: Network,
        to: '/categories/organizations',
        roles: ['admin', 'pvtttby'],
        permissions: ['organization.view'],
      },
      {
        label: 'Loại & Nhóm thiết bị',
        icon: Layers,
        to: '/categories/equipment-types',
        roles: ['admin', 'pvtttby'],
        permissions: ['category.view'],
      },
      {
        label: 'Cấu hình System Options',
        icon: Sliders,
        to: '/categories/system-options',
        roles: ['admin', 'pvtttby'],
      },
    ],
  },
  {
    title: 'Quản trị hệ thống',
    items: [
      {
        label: 'Quản lý Người dùng',
        icon: Users,
        to: '/users',
        roles: ['admin'],
        permissions: ['user.view'],
      },
      {
        label: 'Vai trò & Quyền hạn',
        icon: Settings,
        to: '/roles',
        roles: ['admin'],
        permissions: ['role.manage'],
      },
      {
        label: 'Nhật ký hệ thống',
        icon: Activity,
        to: '/audit-logs',
        roles: ['admin'],
        permissions: ['system.audit.view'],
      },
    ],
  },
]

export default function Sidebar() {
  const { hasPermission, hasRole, logout, user } = useAuth()
  const location = useLocation()

  /**
   * Check menu access by combining user's assigned roles & permissions.
   * If a user belongs to multiple roles, all allowed menus are automatically merged!
   */
  const canShow = (item: NavItem) => {
    // Admin has full access to all menus
    if (hasRole('admin')) return true

    // If item defines roles, check if user has at least ONE of them
    const hasRoleAccess = item.roles ? item.roles.some((r) => hasRole(r)) : false

    // If item defines permissions, check if user has at least ONE permission
    const hasPermissionAccess = item.permissions
      ? item.permissions.some((p) => hasPermission(p))
      : false

    // If no roles or permissions specified, anyone logged in can view
    if (!item.roles && !item.permissions) return true

    return hasRoleAccess || hasPermissionAccess
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate">Quản lý TTBYT</p>
          <p className="text-slate-400 text-xs truncate">BV ĐK Hòa Hảo - Medic Cần Thơ</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(canShow)
          if (!visibleItems.length) return null

          return (
            <div key={section.title}>
              <p className="sidebar-section-title">{section.title}</p>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="w-4.5 h-4.5" />
                  <span className="flex-1">{item.label}</span>
                  {location.pathname.startsWith(item.to) && item.to !== '/dashboard' && (
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  )}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* User Footer & Merged Roles */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        {/* User Roles Badges */}
        {user?.roles && user.roles.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {user.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
              >
                <Shield className="w-2.5 h-2.5 text-primary-400" />
                {ROLE_NAMES_VI[role] || role}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            className="text-slate-500 hover:text-red-400 transition-colors opacity-80 group-hover:opacity-100 p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
