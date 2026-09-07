import type { TablePaginationConfig } from 'antd'

/**
 * Cấu hình phân trang mặc định cho tất cả các bảng trong hệ thống.
 * - Luôn hiển thị tổng số dòng và dải dòng đang xem (Hiển thị 1–10 trên tổng số 25 dòng)
 * - Cho phép chọn số lượng dòng trên mỗi trang (10, 20, 50, 100 dòng / trang)
 * - hideOnSinglePage: false để luôn hiển thị phân trang và số dòng ngay cả khi chỉ có 1 trang
 */
export const DEFAULT_TABLE_PAGINATION: TablePaginationConfig = {
  defaultPageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total: number, range: [number, number]) =>
    `Hiển thị ${range[0]}–${range[1]} trên tổng số ${total} dòng`,
  locale: { items_per_page: 'dòng / trang' },
  hideOnSinglePage: false,
}
