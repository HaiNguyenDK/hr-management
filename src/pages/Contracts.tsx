import { useState } from 'react'
import type { Contract } from '@/types'
import { useContracts } from '@/hooks/useContracts'
import { useEmployees } from '@/hooks/useEmployees'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchBar from '@/components/ui/SearchBar'
import StatusBadge from '@/components/ui/StatusBadge'
import { PageSkeleton } from '@/components/ui/Skeleton'
import DateInput from '@/components/ui/DateInput'
import { formatDate } from '@/utils/date'

type ContractForm = Omit<Contract, 'id'>

const contractTypes: Contract['type'][] = ['Thử việc', 'Xác định thời hạn', 'Không xác định thời hạn']
const contractStatuses: Contract['status'][] = ['Đang hiệu lực', 'Hết hạn', 'Đã thanh lý']

const emptyForm: ContractForm = {
  contractNumber: '',
  employeeId: '',
  employeeName: '',
  type: 'Xác định thời hạn',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  basicSalary: 0,
  status: 'Đang hiệu lực',
  signDate: new Date().toISOString().split('T')[0],
  note: '',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export default function Contracts() {
  const { data: contracts, loading, create, update, remove } = useContracts()
  const { data: employees } = useEmployees()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ContractForm>(emptyForm)

  const filtered = contracts.filter((c) => {
    const matchSearch =
      c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || c.type === filterType
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(contract: Contract) {
    setEditingId(contract.id)
    setForm({
      contractNumber: contract.contractNumber, employeeId: contract.employeeId,
      employeeName: contract.employeeName, type: contract.type,
      startDate: contract.startDate, endDate: contract.endDate ?? '',
      basicSalary: contract.basicSalary, status: contract.status,
      signDate: contract.signDate, note: contract.note,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.contractNumber.trim() || !form.employeeId) return

    const data = { ...form, endDate: form.endDate || null }

    if (editingId) {
      await update(editingId, data)
    } else {
      await create(data)
    }
    setModalOpen(false)
  }

  async function handleDelete() {
    await remove(deleteDialog.id)
    setDeleteDialog({ open: false, id: '' })
  }

  function updateField<K extends keyof ContractForm>(key: K, value: ContractForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleEmployeeChange(empId: string) {
    const emp = employees.find((e) => e.id === empId)
    setForm((prev) => ({ ...prev, employeeId: empId, employeeName: emp?.fullName ?? '' }))
  }

  if (loading) return <PageSkeleton cols={7} />

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-72">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm số HĐ, tên nhân viên..." />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả loại HĐ</option>
            {contractTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả trạng thái</option>
            {contractStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm hợp đồng
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Số hợp đồng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nhân viên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Loại HĐ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Thời hạn</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Lương cơ bản</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.contractNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.employeeName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.type}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {formatDate(c.startDate)} → {c.endDate ? formatDate(c.endDate) : 'Vô thời hạn'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 font-medium">{formatCurrency(c.basicSalary)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteDialog({ open: true, id: c.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Xóa">
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Không tìm thấy hợp đồng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">Tổng cộng: {filtered.length} hợp đồng</p>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sửa hợp đồng' : 'Thêm hợp đồng mới'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số hợp đồng *</label>
              <input type="text" value={form.contractNumber} onChange={(e) => updateField('contractNumber', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="HD-2026-xxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên *</label>
              <select value={form.employeeId} onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.code} — {e.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại hợp đồng</label>
              <select value={form.type} onChange={(e) => updateField('type', e.target.value as Contract['type'])}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {contractTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lương cơ bản (VNĐ)</label>
              <input type="number" value={form.basicSalary} onChange={(e) => updateField('basicSalary', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ký</label>
              <DateInput value={form.signDate} onChange={(v) => updateField('signDate', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value as Contract['status'])}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {contractStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
              <DateInput value={form.startDate} onChange={(v) => updateField('startDate', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
              <DateInput value={form.endDate ?? ''} onChange={(v) => updateField('endDate', v)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.note} onChange={(e) => updateField('note', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Ghi chú thêm..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
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
        title="Xóa hợp đồng"
        message="Bạn có chắc chắn muốn xóa hợp đồng này?"
        confirmText="Xóa"
      />
    </div>
  )
}
