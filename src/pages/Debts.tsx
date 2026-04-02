import { useState } from 'react'
import type { DebtRecord, DebtPayment, DebtTarget, DebtType, DebtStatus } from '@/types'
import { useDebts } from '@/hooks/useDebts'
import { useEmployees } from '@/hooks/useEmployees'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SearchBar from '@/components/ui/SearchBar'
import StatusBadge from '@/components/ui/StatusBadge'
import { PageSkeleton } from '@/components/ui/Skeleton'
import DateInput from '@/components/ui/DateInput'
import { formatDate } from '@/utils/date'

const targets: DebtTarget[] = ['Nhân viên', 'Đối tác']
const debtTypes: DebtType[] = ['Tạm ứng', 'Vay công ty', 'Trừ dần', 'Công nợ mua hàng', 'Công nợ dịch vụ', 'Khác']
const debtStatuses: DebtStatus[] = ['Đang nợ', 'Đã thanh toán', 'Quá hạn', 'Thanh toán một phần']

const statusColors: Record<string, string> = {
  'Đang nợ': 'bg-yellow-100 text-yellow-700',
  'Đã thanh toán': 'bg-green-100 text-green-700',
  'Quá hạn': 'bg-red-100 text-red-700',
  'Thanh toán một phần': 'bg-blue-100 text-blue-700',
}

const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Trừ lương', 'Khác']

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ'

type DebtForm = Omit<DebtRecord, 'id' | 'remainingAmount' | 'createdAt'>

const emptyForm: DebtForm = {
  code: '',
  target: 'Nhân viên',
  counterpartyName: '',
  employeeId: null,
  departmentName: '',
  type: 'Tạm ứng',
  description: '',
  totalAmount: 0,
  paidAmount: 0,
  issueDate: '',
  dueDate: null,
  status: 'Đang nợ',
  note: '',
}

type PaymentForm = { amount: number; paymentDate: string; method: string; note: string }
const emptyPayment: PaymentForm = { amount: 0, paymentDate: '', method: 'Chuyển khoản', note: '' }

export default function Debts() {
  const { data: debts, loading, create, update, remove, addPayment, getPayments } = useDebts()
  const { data: employees } = useEmployees()
  const [search, setSearch] = useState('')
  const [filterTarget, setFilterTarget] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DebtForm>(emptyForm)

  // Payment modal
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; debt: DebtRecord | null }>({ open: false, debt: null })
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyPayment)

  // Detail modal (history)
  const [detailModal, setDetailModal] = useState<{ open: boolean; debt: DebtRecord | null }>({ open: false, debt: null })
  const [payments, setPayments] = useState<DebtPayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  const filtered = debts.filter((d) => {
    const matchSearch =
      d.counterpartyName.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    const matchTarget = !filterTarget || d.target === filterTarget
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchTarget && matchStatus
  })

  // Stats
  const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0)
  const employeeDebt = debts.filter((d) => d.target === 'Nhân viên').reduce((s, d) => s + d.remainingAmount, 0)
  const partnerDebt = debts.filter((d) => d.target === 'Đối tác').reduce((s, d) => s + d.remainingAmount, 0)
  const overdueCount = debts.filter((d) => d.status === 'Quá hạn').length

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(debt: DebtRecord) {
    setEditingId(debt.id)
    setForm({
      code: debt.code, target: debt.target, counterpartyName: debt.counterpartyName,
      employeeId: debt.employeeId, departmentName: debt.departmentName, type: debt.type,
      description: debt.description, totalAmount: debt.totalAmount, paidAmount: debt.paidAmount,
      issueDate: debt.issueDate, dueDate: debt.dueDate, status: debt.status, note: debt.note,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.code || !form.counterpartyName || !form.totalAmount) return
    if (editingId) {
      await update(editingId, form)
    } else {
      await create(form)
    }
    setModalOpen(false)
  }

  async function handleDelete() {
    await remove(deleteDialog.id)
    setDeleteDialog({ open: false, id: '' })
  }

  function handleEmployeeChange(empId: string) {
    const emp = employees.find((e) => e.id === empId)
    if (emp) {
      setForm((prev) => ({
        ...prev,
        employeeId: empId,
        counterpartyName: emp.fullName,
        departmentName: emp.departmentName,
      }))
    }
  }

  function updateField<K extends keyof DebtForm>(key: K, value: DebtForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Payment
  function openPayment(debt: DebtRecord) {
    setPaymentModal({ open: true, debt })
    setPaymentForm({ ...emptyPayment, amount: debt.remainingAmount })
  }

  async function handleAddPayment() {
    const debt = paymentModal.debt
    if (!debt || !paymentForm.amount || !paymentForm.paymentDate) return
    await addPayment(debt.id, paymentForm)
    setPaymentModal({ open: false, debt: null })
  }

  // Detail/history
  async function openDetail(debt: DebtRecord) {
    setDetailModal({ open: true, debt })
    setLoadingPayments(true)
    const result = await getPayments(debt.id)
    setPayments(result)
    setLoadingPayments(false)
  }

  if (loading) return <PageSkeleton cards={4} cols={9} />

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-600">Tổng công nợ</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{fmt(totalDebt)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600">Công nợ nhân viên</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(employeeDebt)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-600">Công nợ đối tác</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{fmt(partnerDebt)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">Quá hạn</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{overdueCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-72">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm mã, tên, mô tả..." />
          </div>
          <select value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả đối tượng</option>
            {targets.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả trạng thái</option>
            {debtStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tạo công nợ
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Mã</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Đối tượng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Loại</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Tổng nợ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Đã trả</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Còn lại</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Hạn</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((debt) => (
                <tr key={debt.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{debt.code}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${debt.target === 'Nhân viên' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                      {debt.target}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{debt.counterpartyName}</p>
                    {debt.departmentName && <p className="text-xs text-gray-400">{debt.departmentName}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{debt.type}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{fmt(debt.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{fmt(debt.paidAmount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(debt.remainingAmount)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(debt.dueDate)}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={debt.status} colorMap={statusColors} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openDetail(debt)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Chi tiết">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </button>
                      {debt.status !== 'Đã thanh toán' && (
                        <button onClick={() => openPayment(debt)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="Thanh toán">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => openEdit(debt)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteDialog({ open: true, id: debt.id })}
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
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">Không có công nợ nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">Tổng cộng: {filtered.length} công nợ</p>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sửa công nợ' : 'Tạo công nợ'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã công nợ *</label>
              <input type="text" value={form.code} onChange={(e) => updateField('code', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="CN-006" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng</label>
              <select value={form.target} onChange={(e) => {
                const t = e.target.value as DebtTarget
                updateField('target', t)
                if (t === 'Đối tác') {
                  setForm((prev) => ({ ...prev, target: t, employeeId: null, departmentName: '' }))
                }
              }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {targets.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {form.target === 'Nhân viên' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên *</label>
                <select value={form.employeeId ?? ''} onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.filter((e) => e.status !== 'Đã nghỉ việc').map((e) => (
                    <option key={e.id} value={e.id}>{e.code} — {e.fullName}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đối tác *</label>
                <input type="text" value={form.counterpartyName} onChange={(e) => updateField('counterpartyName', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tên công ty / đối tác" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại công nợ</label>
              <select value={form.type} onChange={(e) => updateField('type', e.target.value as DebtType)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {debtTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số tiền *</label>
              <input type="number" min={0} value={form.totalAmount} onChange={(e) => updateField('totalAmount', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đã trả</label>
              <input type="number" min={0} value={form.paidAmount} onChange={(e) => updateField('paidAmount', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày phát sinh</label>
              <DateInput value={form.issueDate} onChange={(v) => updateField('issueDate', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạn thanh toán</label>
              <DateInput value={form.dueDate ?? ''} onChange={(v) => updateField('dueDate', v || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value as DebtStatus)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {debtStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <input type="text" value={form.description} onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mô tả công nợ..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.note} onChange={(e) => updateField('note', e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Ghi chú..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              {editingId ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={paymentModal.open} onClose={() => setPaymentModal({ open: false, debt: null })} title="Thanh toán công nợ" size="md">
        {paymentModal.debt && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-gray-500">Mã:</span> <span className="font-mono">{paymentModal.debt.code}</span></p>
              <p><span className="text-gray-500">Đối tượng:</span> <span className="font-medium">{paymentModal.debt.counterpartyName}</span></p>
              <p><span className="text-gray-500">Còn lại:</span> <span className="font-semibold text-red-600">{fmt(paymentModal.debt.remainingAmount)}</span></p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thanh toán *</label>
                <input type="number" min={0} max={paymentModal.debt.remainingAmount} value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thanh toán *</label>
                <DateInput value={paymentForm.paymentDate} onChange={(v) => setPaymentForm((p) => ({ ...p, paymentDate: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
                <select value={paymentForm.method} onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <input type="text" value={paymentForm.note} onChange={(e) => setPaymentForm((p) => ({ ...p, note: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setPaymentModal({ open: false, debt: null })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
              <button onClick={handleAddPayment} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailModal.open} onClose={() => setDetailModal({ open: false, debt: null })} title="Chi tiết công nợ" size="lg">
        {detailModal.debt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm bg-gray-50 rounded-lg p-4">
              <p><span className="text-gray-500">Mã:</span> <span className="font-mono">{detailModal.debt.code}</span></p>
              <p><span className="text-gray-500">Đối tượng:</span> {detailModal.debt.target}</p>
              <p><span className="text-gray-500">Tên:</span> <span className="font-medium">{detailModal.debt.counterpartyName}</span></p>
              <p><span className="text-gray-500">Loại:</span> {detailModal.debt.type}</p>
              <p><span className="text-gray-500">Tổng nợ:</span> <span className="font-semibold">{fmt(detailModal.debt.totalAmount)}</span></p>
              <p><span className="text-gray-500">Đã trả:</span> <span className="text-green-600">{fmt(detailModal.debt.paidAmount)}</span></p>
              <p><span className="text-gray-500">Còn lại:</span> <span className="font-semibold text-red-600">{fmt(detailModal.debt.remainingAmount)}</span></p>
              <p><span className="text-gray-500">Hạn:</span> {formatDate(detailModal.debt.dueDate)}</p>
              {detailModal.debt.description && <p className="col-span-2"><span className="text-gray-500">Mô tả:</span> {detailModal.debt.description}</p>}
              {detailModal.debt.note && <p className="col-span-2"><span className="text-gray-500">Ghi chú:</span> {detailModal.debt.note}</p>}
            </div>

            {/* Payment progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Tiến độ thanh toán</span>
                <span>{detailModal.debt.totalAmount > 0 ? Math.round((detailModal.debt.paidAmount / detailModal.debt.totalAmount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${detailModal.debt.totalAmount > 0 ? Math.min(100, (detailModal.debt.paidAmount / detailModal.debt.totalAmount) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Lịch sử thanh toán</h4>
              {loadingPayments ? (
                <p className="text-sm text-gray-400">Đang tải...</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-gray-400">Chưa có lịch sử thanh toán</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Ngày</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Số tiền</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Hình thức</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-600">{formatDate(p.paymentDate)}</td>
                        <td className="px-3 py-2 text-right font-medium text-green-600">{fmt(p.amount)}</td>
                        <td className="px-3 py-2 text-gray-600">{p.method}</td>
                        <td className="px-3 py-2 text-gray-500">{p.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '' })}
        onConfirm={handleDelete}
        title="Xóa công nợ"
        message="Bạn có chắc chắn muốn xóa công nợ này? Lịch sử thanh toán liên quan cũng sẽ bị xóa."
        confirmText="Xóa"
      />
    </div>
  )
}
