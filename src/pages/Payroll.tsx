import { useState } from 'react'
import type { PayrollRecord } from '@/types'
import { usePayroll } from '@/hooks/usePayroll'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import SearchBar from '@/components/ui/SearchBar'
import StatusBadge from '@/components/ui/StatusBadge'
import { PageSkeleton } from '@/components/ui/Skeleton'

const payrollStatusColors: Record<string, string> = {
  'Nháp': 'bg-gray-100 text-gray-600',
  'Đã duyệt': 'bg-green-100 text-green-700',
  'Đã chi': 'bg-blue-100 text-blue-700',
}

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export default function Payroll() {
  const { data: records, loading, update, refresh } = usePayroll()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [month, setMonth] = useState(3)
  const [year, setYear] = useState(2026)
  const [detailModal, setDetailModal] = useState<PayrollRecord | null>(null)

  const filtered = records.filter((r) => {
    const matchSearch =
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || r.status === filterStatus
    const matchPeriod = r.month === month && r.year === year
    return matchSearch && matchStatus && matchPeriod
  })

  const totalNet = filtered.reduce((sum, r) => sum + r.netSalary, 0)
  const totalGross = filtered.reduce((sum, r) => sum + r.basicSalary + r.allowance + r.overtime, 0)

  async function handleApprove(id: string) {
    await update(id, { status: 'Đã duyệt' })
  }

  async function handleMarkPaid(id: string) {
    await update(id, { status: 'Đã chi' })
  }

  async function handleApproveAll() {
    const ids = records.filter((r) => r.month === month && r.year === year && r.status === 'Nháp').map((r) => r.id)
    if (ids.length) {
      await supabase.from('payroll_records').update({ status: 'Đã duyệt' }).in('id', ids)
      await refresh()
    }
  }

  if (loading) return <PageSkeleton cards={4} cols={8} />

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Tổng nhân viên</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Tổng lương Gross</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{formatVND(totalGross)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Tổng lương Net</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">{formatVND(totalNet)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Chờ duyệt</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{filtered.filter((r) => r.status === 'Nháp').length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-64">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, mã NV..." />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả trạng thái</option>
            <option value="Nháp">Nháp</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Đã chi">Đã chi</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handleApproveAll}
            className="px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shrink-0">
            Duyệt tất cả
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Mã NV</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Họ và tên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Phòng ban</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Ngày công</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Lương CB</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Phụ cấp</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Khấu trừ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">BHXH</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Thuế</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Thực lãnh</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">TT</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.employeeCode}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailModal(r)} className="text-left hover:text-indigo-600">
                      <p className="font-medium text-gray-800">{r.employeeName}</p>
                      <p className="text-xs text-gray-400">{r.position}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.departmentName}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.actualDays}/{r.workingDays}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatVND(r.basicSalary)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatVND(r.allowance + r.overtime)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{r.deduction > 0 ? `-${formatVND(r.deduction)}` : '0'}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatVND(r.insurance)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatVND(r.tax)}</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatVND(r.netSalary)}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={r.status} colorMap={payrollStatusColors} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetailModal(r)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Chi tiết">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      {r.status === 'Nháp' && (
                        <button onClick={() => handleApprove(r.id)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="Duyệt">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                      {r.status === 'Đã duyệt' && (
                        <button onClick={() => handleMarkPaid(r.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Đánh dấu đã chi">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-400">Chưa có dữ liệu bảng lương</td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200 font-medium">
                  <td colSpan={4} className="px-4 py-3 text-gray-700">Tổng cộng</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatVND(filtered.reduce((s, r) => s + r.basicSalary, 0))}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatVND(filtered.reduce((s, r) => s + r.allowance + r.overtime, 0))}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatVND(filtered.reduce((s, r) => s + r.deduction, 0))}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatVND(filtered.reduce((s, r) => s + r.insurance, 0))}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatVND(filtered.reduce((s, r) => s + r.tax, 0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatVND(totalNet)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiết bảng lương">
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{detailModal.employeeName}</h4>
                <p className="text-sm text-gray-500">{detailModal.employeeCode} · {detailModal.position} · {detailModal.departmentName}</p>
              </div>
              <StatusBadge status={detailModal.status} colorMap={payrollStatusColors} />
            </div>

            <div className="text-sm">
              <p className="font-medium text-gray-700 mb-2">Kỳ lương: Tháng {detailModal.month}/{detailModal.year}</p>

              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Ngày công chuẩn / Thực tế</td>
                    <td className="py-2 text-right text-gray-700 font-medium">{detailModal.actualDays} / {detailModal.workingDays} ngày</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Lương cơ bản</td>
                    <td className="py-2 text-right text-gray-700">{formatVND(detailModal.basicSalary)}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Phụ cấp</td>
                    <td className="py-2 text-right text-green-600">+ {formatVND(detailModal.allowance)}</td>
                  </tr>
                  {detailModal.overtime > 0 && (
                    <tr className="border-b border-gray-50">
                      <td className="py-2 text-gray-500">Tăng ca</td>
                      <td className="py-2 text-right text-green-600">+ {formatVND(detailModal.overtime)}</td>
                    </tr>
                  )}
                  {detailModal.deduction > 0 && (
                    <tr className="border-b border-gray-50">
                      <td className="py-2 text-gray-500">Khấu trừ (nghỉ không phép)</td>
                      <td className="py-2 text-right text-red-600">- {formatVND(detailModal.deduction)}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">BHXH, BHYT, BHTN (10.5%)</td>
                    <td className="py-2 text-right text-orange-600">- {formatVND(detailModal.insurance)}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Thuế TNCN</td>
                    <td className="py-2 text-right text-orange-600">- {formatVND(detailModal.tax)}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-3 font-semibold text-gray-800">THỰC LÃNH</td>
                    <td className="py-3 text-right text-xl font-bold text-indigo-600">{formatVND(detailModal.netSalary)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
