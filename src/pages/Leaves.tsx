import { useState } from 'react'
import type { LeaveRequest } from '@/types'
import { leaveRequests as initialRequests, employees } from '@/data/mockData'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchBar from '@/components/ui/SearchBar'
import StatusBadge from '@/components/ui/StatusBadge'

const leaveTypes: LeaveRequest['type'][] = ['Nghỉ phép năm', 'Nghỉ ốm', 'Nghỉ việc riêng', 'Nghỉ thai sản', 'Nghỉ không lương']
const leaveStatuses: LeaveRequest['status'][] = ['Chờ duyệt', 'Đã duyệt', 'Từ chối']

const leaveStatusColors: Record<string, string> = {
  'Chờ duyệt': 'bg-yellow-100 text-yellow-700',
  'Đã duyệt': 'bg-green-100 text-green-700',
  'Từ chối': 'bg-red-100 text-red-700',
}

type LeaveForm = Omit<LeaveRequest, 'id' | 'createdAt'>

const emptyForm: LeaveForm = {
  employeeId: '',
  employeeCode: '',
  employeeName: '',
  departmentName: '',
  type: 'Nghỉ phép năm',
  startDate: '',
  endDate: '',
  totalDays: 1,
  reason: '',
  status: 'Chờ duyệt',
  remainingDays: 12,
}

export default function Leaves() {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LeaveForm>(emptyForm)

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const pendingCount = requests.filter((r) => r.status === 'Chờ duyệt').length

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(req: LeaveRequest) {
    setEditingId(req.id)
    setForm({
      employeeId: req.employeeId, employeeCode: req.employeeCode, employeeName: req.employeeName,
      departmentName: req.departmentName, type: req.type, startDate: req.startDate,
      endDate: req.endDate, totalDays: req.totalDays, reason: req.reason,
      status: req.status, remainingDays: req.remainingDays,
    })
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.employeeId || !form.startDate || !form.endDate) return

    if (editingId) {
      setRequests((prev) => prev.map((r) => r.id === editingId ? { ...r, ...form } : r))
    } else {
      const newReq: LeaveRequest = {
        ...form,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().split('T')[0],
      }
      setRequests((prev) => [...prev, newReq])
    }
    setModalOpen(false)
  }

  function handleDelete() {
    setRequests((prev) => prev.filter((r) => r.id !== deleteDialog.id))
    setDeleteDialog({ open: false, id: '' })
  }

  function handleApprove(id: string) {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Đã duyệt' as const } : r))
  }

  function handleReject(id: string) {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'Từ chối' as const } : r))
  }

  function handleEmployeeChange(empId: string) {
    const emp = employees.find((e) => e.id === empId)
    if (emp) {
      setForm((prev) => ({
        ...prev,
        employeeId: empId,
        employeeCode: emp.code,
        employeeName: emp.fullName,
        departmentName: emp.departmentName,
      }))
    }
  }

  function updateField<K extends keyof LeaveForm>(key: K, value: LeaveForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-600">Chờ duyệt</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600">Đã duyệt tháng này</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{requests.filter((r) => r.status === 'Đã duyệt').length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">Từ chối</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{requests.filter((r) => r.status === 'Từ chối').length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-72">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, mã NV..." />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả trạng thái</option>
            {leaveStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tạo đơn nghỉ phép
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nhân viên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Phòng ban</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Loại nghỉ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Thời gian</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Số ngày</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Lý do</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Phép còn</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{req.employeeName}</p>
                    <p className="text-xs text-gray-400">{req.employeeCode}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{req.departmentName}</td>
                  <td className="px-4 py-3 text-gray-600">{req.type}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {req.startDate} → {req.endDate}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">{req.totalDays}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{req.reason}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                      {req.remainingDays}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={req.status} colorMap={leaveStatusColors} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {req.status === 'Chờ duyệt' && (
                        <>
                          <button onClick={() => handleApprove(req.id)}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="Duyệt">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button onClick={() => handleReject(req.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Từ chối">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button onClick={() => openEdit(req)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteDialog({ open: true, id: req.id })}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Xóa">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">Không có đơn nghỉ phép nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">Tổng cộng: {filtered.length} đơn nghỉ phép</p>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sửa đơn nghỉ phép' : 'Tạo đơn nghỉ phép'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên *</label>
              <select value={form.employeeId} onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">-- Chọn nhân viên --</option>
                {employees.filter((e) => e.status !== 'Đã nghỉ việc').map((e) => (
                  <option key={e.id} value={e.id}>{e.code} — {e.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại nghỉ</label>
              <select value={form.type} onChange={(e) => updateField('type', e.target.value as LeaveRequest['type'])}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày *</label>
              <input type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày *</label>
              <input type="date" value={form.endDate} onChange={(e) => updateField('endDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày nghỉ</label>
              <input type="number" min={0.5} step={0.5} value={form.totalDays} onChange={(e) => updateField('totalDays', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value as LeaveRequest['status'])}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {leaveStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
            <textarea value={form.reason} onChange={(e) => updateField('reason', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Lý do nghỉ phép..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              {editingId ? 'Cập nhật' : 'Tạo đơn'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '' })}
        onConfirm={handleDelete}
        title="Xóa đơn nghỉ phép"
        message="Bạn có chắc chắn muốn xóa đơn nghỉ phép này?"
        confirmText="Xóa"
      />
    </div>
  )
}
