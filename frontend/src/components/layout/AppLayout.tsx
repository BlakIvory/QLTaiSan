import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import Header from './Header'

/**
 * Mỗi khi chuyển sang menu/trang mới, invalidate tất cả active queries
 * để combobox và danh sách dữ liệu của trang mới luôn được lấy lại từ server.
 */
function RouteChangeWatcher() {
  const location = useLocation()
  const qc = useQueryClient()
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    // Chỉ invalidate khi pathname thực sự thay đổi (không phải lần mount đầu)
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname
      qc.invalidateQueries()
    }
  }, [location.pathname, qc])

  return null
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <Header />
        <RouteChangeWatcher />
        <main className="flex-1 pt-[var(--header-height)] bg-slate-50">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
