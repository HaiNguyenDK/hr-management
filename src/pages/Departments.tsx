import { useState } from 'react'
import type { Department } from '@/types'
import { departments as initialDepartments } from '@/data/mockData'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchBar from '@/components/ui/SearchBar'

const emptyDepartment: Omit<Department, 'id'> = {
  name: '',
  manager: '',
  employeeCount: 0,
  phone: '',
  email: '',
  description: '',
  createdAt: new Date().toISOString().split('T')[0],
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyDepartment)

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.manager.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditingId(null)
    setForm(emptyDepartment)
    setModalOpen(true)
  }

  function openEdit(dept: Department) {
    setEditingId(dept.id)
    setForm({ name: dept.name, manager: dept.manager, employeeCount: dept.employeeCount, phone: dept.phone, email: dept.email, description: dept.description, createdAt: dept.createdAt })
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) return

    if (editingId) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === editingId ? { ...d, ...form } : d)),
      )
    } else {
      const newDept: Department = {
        ...form,
        id: crypto.randomUUID(),
      }
      setDepartments((prev) => [...prev, newDept])
    }
    setModalOpen(false)
  }

  function handleDelete() {
    setDepartments((prev) => prev.filter((d) => d.id !== deleteDialog.id))
    setDeleteDialog({ open: false, id: '' })
  }

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="w-full sm:w-80">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm phòng ban, trưởng phòng..." />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm phòng ban
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tên phòng ban</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Trưởng phòng</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Số nhân viên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Điện thoại</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dept) => (
                <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{dept.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{dept.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{dept.manager}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                      {dept.employeeCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{dept.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{dept.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(dept)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                        title="Sửa"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, id: dept.id })}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                        title="Xóa"
                      >
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Không tìm thấy phòng ban nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">Tổng cộng: {filtered.length} phòng ban</p>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sửa phòng ban' : 'Thêm phòng ban mới'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên phòng ban *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: Phòng Kỹ thuật"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng phòng</label>
              <input
                type="text"
                value={form.manager}
                onChange={(e) => updateField('manager', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="024-xxxx-xxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="phongban@company.vn"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Mô tả chức năng phòng ban..."
            />
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
        title="Xóa phòng ban"
        message="Bạn có chắc chắn muốn xóa phòng ban này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
      />
    </div>
  )
}
