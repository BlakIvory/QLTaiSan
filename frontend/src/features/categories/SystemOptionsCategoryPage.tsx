import { useState } from 'react'
import { useOptions } from '../../hooks/useOptions'
import { Sliders, Search, CheckCircle, ShieldAlert, Tag, Code, RefreshCw } from 'lucide-react'

export default function SystemOptionsCategoryPage() {
  const { options, isLoading, refetch } = useOptions()
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('importance_level')

  const optionTypeKeys = Object.keys(options)

  const typeLabels: Record<string, string> = {
    importance_level: 'Mức độ quan trọng (Importance Level)',
    equipment_status: 'Trạng thái thiết bị (Equipment Status)',
    organization_type: 'Loại đơn vị tổ chức (Organization Type)',
    repair_status: 'Trạng thái sửa chữa (Repair Status)',
    damage_report_status: 'Trạng thái báo hỏng (Damage Report Status)',
    damage_priority: 'Độ ưu tiên hỏng hóc (Damage Priority)',
    transfer_status: 'Trạng thái điều chuyển (Transfer Status)',
    allocation_status: 'Trạng thái cấp phát (Allocation Status)',
    loan_status: 'Trạng thái mượn/trả (Loan Status)',
    inventory_status: 'Trạng thái kiểm kê (Inventory Status)',
    contract_status: 'Trạng thái hợp đồng (Contract Status)',
    liquidation_status: 'Trạng thái thanh lý (Liquidation Status)',
    roles: 'Vai trò người dùng (User Roles)',
  }

  const currentOptionsList = options[selectedType] ?? []

  const filteredList = currentOptionsList.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.value.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sliders className="w-6 h-6 text-primary-600" />
            Cấu hình Danh mục Option hệ thống (Backend Options API)
          </h1>
          <p className="page-subtitle">
            Toàn bộ giá trị Combobox, Mức độ quan trọng, Trạng thái do Backend quản lý và cung cấp tập trung
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-outline flex items-center gap-2 text-xs"
        >
          <RefreshCw className="w-4 h-4 text-primary-600" />
          <span>Làm mới danh mục</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Side: Option Categories List */}
        <div className="card p-3 space-y-1 md:col-span-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
            Nhóm Danh mục Backend
          </p>
          {isLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">Đang tải...</div>
          ) : (
            optionTypeKeys.map((key) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                  selectedType === key
                    ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{typeLabels[key] ?? key}</span>
                <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                  {options[key]?.length ?? 0}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Right Side: Options List Detail */}
        <div className="md:col-span-3 space-y-4">
          <div className="card p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-800 text-sm">
                {typeLabels[selectedType] ?? selectedType}
              </h2>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Vui lòng nhập tùy chọn cần lọc"
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã hằng số (Value / Enum)</th>
                  <th className="py-3 px-4">Nhãn hiển thị (Label)</th>
                  <th className="py-3 px-4">Màu định dạng (Badge Color)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-primary-700 text-xs">
                      {item.value}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {item.label}
                    </td>
                    <td className="py-3 px-4">
                      {item.color ? (
                        <span className={`badge badge-${item.color}`}>
                          {item.color}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
