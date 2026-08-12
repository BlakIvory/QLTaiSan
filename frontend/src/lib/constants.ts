// Equipment Status mapping for frontend
export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_RECEIPT:        'Chờ tiếp nhận',
  IN_STOCK:               'Trong kho',
  AVAILABLE:              'Sẵn sàng sử dụng',
  IN_USE:                 'Đang sử dụng',
  TEMPORARILY_SUSPENDED:  'Tạm ngừng sử dụng',
  UNDER_MAINTENANCE:      'Đang bảo trì',
  UNDER_REPAIR:           'Đang sửa chữa',
  WAITING_FOR_PARTS:      'Chờ linh kiện',
  UNDER_INSPECTION:       'Đang kiểm định',
  ON_LOAN:                'Đang cho mượn',
  RECALLED:               'Đã thu hồi',
  BROKEN_BEYOND_REPAIR:   'Hỏng không thể sửa',
  LOST:                   'Mất',
  PENDING_LIQUIDATION:    'Chờ thanh lý',
  LIQUIDATED:             'Đã thanh lý',
  DESTROYED:              'Đã hủy',
}

export const EQUIPMENT_STATUS_COLORS: Record<string, string> = {
  PENDING_RECEIPT:        'badge-gray',
  IN_STOCK:               'badge-blue',
  AVAILABLE:              'badge-green',
  IN_USE:                 'badge-teal',
  TEMPORARILY_SUSPENDED:  'badge-yellow',
  UNDER_MAINTENANCE:      'badge-orange',
  UNDER_REPAIR:           'badge-purple',
  WAITING_FOR_PARTS:      'badge-purple',
  UNDER_INSPECTION:       'badge-blue',
  ON_LOAN:                'badge-blue',
  RECALLED:               'badge-red',
  BROKEN_BEYOND_REPAIR:   'badge-red',
  LOST:                   'badge-red',
  PENDING_LIQUIDATION:    'badge-yellow',
  LIQUIDATED:             'badge-gray',
  DESTROYED:              'badge-gray',
}

export const IMPORTANCE_LABELS: Record<string, string> = {
  LOW:      'Thấp',
  MEDIUM:   'Trung bình',
  HIGH:     'Cao',
  CRITICAL: 'Thiết yếu',
}

export const ORGANIZATION_TYPE_LABELS: Record<string, string> = {
  HOSPITAL:   'Bệnh viện',
  CAMPUS:     'Cơ sở',
  BLOCK:      'Khối',
  DEPARTMENT: 'Khoa',
  ROOM:       'Phòng',
  WAREHOUSE:  'Kho',
}

export const ROLE_LABELS: Record<string, string> = {
  admin:            'Quản trị viên',
  pvtttby:          'Phòng Vật tư – TTBYT',
  department_staff: 'Nhân viên khoa/phòng',
  technician:       'Kỹ thuật viên',
  leader:           'Ban lãnh đạo',
}

// Pagination default
export const PAGE_SIZE = 20

// File upload constraints
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
export const MAX_FILE_SIZE_MB = 10

// API Router Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    CHARTS: '/dashboard/charts',
    ALERTS: '/dashboard/alerts',
  },
  EQUIPMENT: {
    BASE: '/equipment',
  },
  ORGANIZATIONS: {
    BASE: '/organizations',
  },
  USERS: {
    BASE: '/users',
  },
  TRANSFERS: {
    BASE: '/transfers',
  },
  SUPPLIERS: {
    BASE: '/suppliers',
  },
  REPORTS: {
    EXPORT: '/reports/export',
  },
  REPAIRS: {
    BASE: '/repairs',
  },
  MAINTENANCE: {
    PLANS: '/maintenance-plans',
  },
  DAMAGE_REPORTS: {
    BASE: '/damage-reports',
  },
  AUDIT_LOGS: {
    BASE: '/audit-logs',
  },
  RECEIPTS: {
    BASE: '/receipts',
  },
  ALLOCATIONS: {
    BASE: '/allocations',
  },
  INSPECTIONS: {
    BASE: '/inspections',
  },
  LOANS: {
    BASE: '/loans',
  },
  INVENTORIES: {
    BASE: '/inventories',
  },
  RECALLS: {
    BASE: '/recalls',
  },
  LIQUIDATIONS: {
    BASE: '/liquidations',
  },
  CONTRACTS: {
    BASE: '/contracts',
  },
  ROLES: {
    BASE: '/roles',
  },
  OPTIONS: {
    BASE: '/options',
  },
  CATEGORIES: {
    EQUIPMENT_TYPES: '/equipment-types',
    EQUIPMENT_GROUPS: '/equipment-groups',
    MANUFACTURERS: '/manufacturers',
    COUNTRIES: '/countries',
    FUNDING_SOURCES: '/funding-sources',
  },
} as const

