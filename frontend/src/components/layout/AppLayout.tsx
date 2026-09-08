import { useEffect, useRef, useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Tự động đóng sidebar drawer khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-slate-50 w-full max-w-full overflow-x-hidden">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden transition-all duration-300 ml-0 lg:ml-[var(--sidebar-width)]">
        <Header onToggleSidebar={() => setMobileMenuOpen((prev) => !prev)} />
        <RouteChangeWatcher />
        <main className="flex-1 pt-[var(--header-height)] bg-slate-50 min-w-0 w-full max-w-full">
          <div className="page-container w-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
