import { useState } from 'react'
import type { Employee } from '@/types'
import { employees as initialEmployees, departments } from '@/data/mockData'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchBar from '@/components/ui/SearchBar'
import StatusBadge from '@/components/ui/StatusBadge'

type EmployeeForm = Omit<Employee, 'id' | 'departmentName'>

const emptyForm: EmployeeForm = {
  code: '',
  fullName: '',
  gender: 'Nam',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  departmentId: '',
  position: '',
  startDate: new Date().toISOString().split('T')[0],
  status: 'Đang làm việc',
}

const statuses: Employee['status'][] = ['Đang làm việc', 'Thử việc', 'Nghỉ thai sản', 'Đã nghỉ việc']

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModal, setDetailModal] = useState<Employee | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EmployeeForm>(emptyForm)

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search)
    const matchDept = !filterDept || e.departmentId === filterDept
    const matchStatus = !filterStatus || e.status === filterStatus
    return matchSearch && matchDept && matchStatus
  })

  function getDeptName(deptId: string) {
    return departments.find((d) => d.id === deptId)?.name ?? ''
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditingId(emp.id)
    setForm({
      code: emp.code, fullName: emp.fullName, gender: emp.gender,
      dateOfBirth: emp.dateOfBirth, phone: emp.phone, email: emp.email,
      address: emp.address, departmentId: emp.departmentId, position: emp.position,
      startDate: emp.startDate, status: emp.status,
    })
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.fullName.trim() || !form.code.trim()) return

    if (editingId) {
      setEmployees((prev) =>
        prev.map((e) => e.id === editingId ? { ...e, ...form, departmentName: getDeptName(form.departmentId) } : e),
      )
    } else {
      const newEmp: Employee = {
        ...form,
        id: crypto.randomUUID(),
        departmentName: getDeptName(form.departmentId),
      }
      setEmployees((prev) => [...prev, newEmp])
    }
    setModalOpen(false)
  }

  function handleDelete() {
    setEmployees((prev) => prev.filter((e) => e.id !== deleteDialog.id))
    setDeleteDialog({ open: false, id: '' })
  }

  function updateField<K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-72">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm tên, mã NV, SĐT..." />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm nhân viên
        </button>
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">Chức vụ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">SĐT</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{emp.code}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailModal(emp)} className="text-left hover:text-indigo-600">
                      <p className="font-medium text-gray-800">{emp.fullName}</p>
                      <p className="text-xs text-gray-400">{emp.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.departmentName}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.position}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetailModal(emp)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Xem">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteDialog({ open: true, id: emp.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Xóa">
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">Tổng cộng: {filtered.length} nhân viên</p>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Thông tin nhân viên">
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">{detailModal.fullName.charAt(0)}</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{detailModal.fullName}</h4>
                <p className="text-sm text-gray-500">{detailModal.position} — {detailModal.departmentName}</p>
                <StatusBadge status={detailModal.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Mã NV:</span> <span className="text-gray-700 ml-1">{detailModal.code}</span></div>
              <div><span className="text-gray-400">Giới tính:</span> <span className="text-gray-700 ml-1">{detailModal.gender}</span></div>
              <div><span className="text-gray-400">Ngày sinh:</span> <span className="text-gray-700 ml-1">{detailModal.dateOfBirth}</span></div>
              <div><span className="text-gray-400">Ngày vào làm:</span> <span className="text-gray-700 ml-1">{detailModal.startDate}</span></div>
              <div><span className="text-gray-400">SĐT:</span> <span className="text-gray-700 ml-1">{detailModal.phone}</span></div>
              <div><span className="text-gray-400">Email:</span> <span className="text-gray-700 ml-1">{detailModal.email}</span></div>
              <div className="col-span-2"><span className="text-gray-400">Địa chỉ:</span> <span className="text-gray-700 ml-1">{detailModal.address}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sửa nhân viên' : 'Thêm nhân viên mới'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên *</label>
              <input type="text" value={form.code} onChange={(e) => updateField('code', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: NV013" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
              <input type="text" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <select value={form.gender} onChange={(e) => updateField('gender', e.target.value as Employee['gender'])}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="text" value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0901234xxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="email@company.vn" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
              <select value={form.departmentId} onChange={(e) => updateField('departmentId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">-- Chọn phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
              <input type="text" value={form.position} onChange={(e) => updateField('position', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: Kỹ sư phần mềm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày vào làm</label>
              <input type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value as Employee['status'])}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Hà Nội" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Hủy
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '' })}
        onConfirm={handleDelete}
        title="Xóa nhân viên"
        message="Bạn có chắc chắn muốn xóa nhân viên này? Tất cả dữ liệu liên quan sẽ bị mất."
        confirmText="Xóa"
      />
    </div>
  )
}
