import { useState, useEffect } from 'react'
import type { AttendanceStatus } from '@/types'
import { useAttendance } from '@/hooks/useAttendance'
import { useDepartments } from '@/hooks/useDepartments'
import SearchBar from '@/components/ui/SearchBar'
import { PageSkeleton } from '@/components/ui/Skeleton'

const statusColors: Record<AttendanceStatus, string> = {
  'Đi làm': 'bg-green-100 text-green-700',
  'Vắng': 'bg-red-100 text-red-700',
  'Nghỉ phép': 'bg-blue-100 text-blue-700',
  'Nửa ngày': 'bg-amber-100 text-amber-700',
  'Đi trễ': 'bg-orange-100 text-orange-700',
  '': '',
}

const statusShort: Record<AttendanceStatus, string> = {
  'Đi làm': '✓',
  'Vắng': '✗',
  'Nghỉ phép': 'P',
  'Nửa ngày': '½',
  'Đi trễ': 'T',
  '': '',
}

const allStatuses: AttendanceStatus[] = ['Đi làm', 'Vắng', 'Nghỉ phép', 'Nửa ngày', 'Đi trễ']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getDayOfWeek(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay()
}

const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default function Attendance() {
  const { data: records, loading, fetch: fetchAttendance, updateStatus: updateAttendanceStatus } = useAttendance()
  const { data: departments } = useDepartments()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [month, setMonth] = useState(3)
  const [year, setYear] = useState(2026)
  const [editingCell, setEditingCell] = useState<{ empId: string; day: number } | null>(null)

  useEffect(() => {
    fetchAttendance(month, year)
  }, [month, year, fetchAttendance])

  const daysCount = getDaysInMonth(year, month)
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)

  const filtered = records.filter((r) => {
    const matchSearch =
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(search.toLowerCase())
    const matchDept = !filterDept || r.departmentName === filterDept
    return matchSearch && matchDept
  })

  async function updateStatus(empId: string, day: number, status: AttendanceStatus) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    await updateAttendanceStatus(empId, dateStr, status)
    await fetchAttendance(month, year)
    setEditingCell(null)
  }

  function countStatus(days: Record<number, AttendanceStatus>, status: AttendanceStatus) {
    return Object.values(days).filter((s) => s === status).length
  }

  if (loading) return <PageSkeleton variant="grid" />

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-64">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, mã NV..." />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả phòng ban</option>
            {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
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
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {allStatuses.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${statusColors[s]}`}>
              {statusShort[s]}
            </span>
            <span className="text-xs text-gray-500">{s}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded text-xs bg-gray-50 text-gray-300">—</span>
          <span className="text-xs text-gray-500">Cuối tuần</span>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-medium text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[180px]">Nhân viên</th>
                {days.map((d) => {
                  const dow = getDayOfWeek(year, month, d)
                  const isWeekend = dow === 0 || dow === 6
                  return (
                    <th key={d} className={`px-1 py-2 text-center font-medium min-w-[32px] ${isWeekend ? 'bg-gray-100 text-gray-400' : 'text-gray-500'}`}>
                      <div>{d}</div>
                      <div className="text-[10px] font-normal">{dayLabels[dow]}</div>
                    </th>
                  )
                })}
                <th className="px-2 py-2 text-center font-medium text-gray-500 min-w-[40px]">Đ.làm</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500 min-w-[40px]">Vắng</th>
                <th className="px-2 py-2 text-center font-medium text-gray-500 min-w-[40px]">Phép</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.employeeId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10">
                    <p className="font-medium text-gray-800">{record.employeeName}</p>
                    <p className="text-gray-400">{record.employeeCode} · {record.departmentName}</p>
                  </td>
                  {days.map((d) => {
                    const dow = getDayOfWeek(year, month, d)
                    const isWeekend = dow === 0 || dow === 6
                    const status = record.days[d] ?? ''
                    const isEditing = editingCell?.empId === record.employeeId && editingCell?.day === d

                    if (isWeekend) {
                      return <td key={d} className="px-1 py-2 text-center bg-gray-50"><span className="text-gray-300">—</span></td>
                    }

                    return (
                      <td key={d} className="px-0.5 py-1 text-center relative">
                        {isEditing ? (
                          <div className="absolute top-full left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[100px]">
                            {allStatuses.map((s) => (
                              <button key={s} onClick={() => updateStatus(record.employeeId, d, s)}
                                className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-50 rounded">
                                <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-medium ${statusColors[s]} mr-1`}>
                                  {statusShort[s]}
                                </span>
                                {s}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <button
                          onClick={() => setEditingCell(isEditing ? null : { empId: record.employeeId, day: d })}
                          className={`w-7 h-7 rounded text-[11px] font-medium ${status ? statusColors[status] : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                        >
                          {status ? statusShort[status] : '·'}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-2 py-2 text-center font-medium text-green-600">{countStatus(record.days, 'Đi làm')}</td>
                  <td className="px-2 py-2 text-center font-medium text-red-600">{countStatus(record.days, 'Vắng')}</td>
                  <td className="px-2 py-2 text-center font-medium text-blue-600">{countStatus(record.days, 'Nghỉ phép')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={days.length + 4} className="px-4 py-8 text-center text-gray-400">
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">Bảng chấm công tháng {month}/{year} — {filtered.length} nhân viên</p>
    </div>
  )
}
