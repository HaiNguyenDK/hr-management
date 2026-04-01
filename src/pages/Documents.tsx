import { useState } from 'react'
import type { Document, DocumentCategory, DocumentStatus, Attachment } from '@/types'
import { documents as initialDocuments, departments } from '@/data/mockData'
import Modal from '@/components/ui/Modal'
import SearchBar from '@/components/ui/SearchBar'
import StatusBadge from '@/components/ui/StatusBadge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const categoryIcons: Record<DocumentCategory, string> = {
  'Biểu mẫu': '📋',
  'Công văn đến': '📨',
  'Công văn đi': '📤',
  'Quy định': '📖',
  'Hợp đồng mẫu': '📄',
}

const statusColors: Record<string, string> = {
  'Nháp': 'bg-gray-100 text-gray-600',
  'Hiệu lực': 'bg-green-100 text-green-700',
  'Hết hiệu lực': 'bg-red-100 text-red-600',
}

const categories: DocumentCategory[] = ['Biểu mẫu', 'Công văn đến', 'Công văn đi', 'Quy định', 'Hợp đồng mẫu']
const statuses: DocumentStatus[] = ['Nháp', 'Hiệu lực', 'Hết hiệu lực']

const emptyForm: Omit<Document, 'id'> = {
  code: '',
  title: '',
  category: 'Biểu mẫu',
  departmentName: '',
  issuedDate: '',
  effectiveDate: '',
  expiryDate: null,
  status: 'Nháp',
  createdBy: '',
  description: '',
  version: '1.0',
  attachments: [],
}

const fileTypeIcons: Record<string, string> = {
  'application/pdf': '📕',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📗',
  'image/png': '🖼️',
  'image/jpeg': '🖼️',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function getFileExt(name: string): string {
  return name.split('.').pop()?.toUpperCase() || ''
}

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>(initialDocuments)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [formModal, setFormModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [detailModal, setDetailModal] = useState<Document | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Document | null>(null)

  const filtered = docs.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || d.category === filterCategory
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchCategory && matchStatus
  })

  // Stats
  const countByCategory = categories.map((cat) => ({
    category: cat,
    icon: categoryIcons[cat],
    count: docs.filter((d) => d.category === cat).length,
  }))

  function openAdd() {
    setEditingDoc(null)
    setForm(emptyForm)
    setFormModal(true)
  }

  function openEdit(doc: Document) {
    setEditingDoc(doc)
    setForm({
      code: doc.code,
      title: doc.title,
      category: doc.category,
      departmentName: doc.departmentName,
      issuedDate: doc.issuedDate,
      effectiveDate: doc.effectiveDate,
      expiryDate: doc.expiryDate,
      status: doc.status,
      createdBy: doc.createdBy,
      description: doc.description,
      version: doc.version,
      attachments: doc.attachments,
    })
    setFormModal(true)
  }

  function handleSave() {
    if (!form.code || !form.title) return
    if (editingDoc) {
      setDocs((prev) => prev.map((d) => d.id === editingDoc.id ? { ...d, ...form } : d))
    } else {
      const newDoc: Document = { ...form, id: Date.now().toString() }
      setDocs((prev) => [...prev, newDoc])
    }
    setFormModal(false)
  }

  function handleDelete() {
    if (!deleteDialog) return
    setDocs((prev) => prev.filter((d) => d.id !== deleteDialog.id))
    setDeleteDialog(null)
  }

  function handleActivate(id: string) {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, status: 'Hiệu lực' as const } : d))
  }

  function handleExpire(id: string) {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, status: 'Hết hiệu lực' as const } : d))
  }

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newAttachments: Attachment[] = Array.from(files).map((f) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      type: f.type,
    }))
    setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] }))
    e.target.value = ''
  }

  function handleFileRemove(attachmentId: string) {
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.id !== attachmentId) }))
  }

  return (
    <div className="space-y-4">
      {/* Category stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {countByCategory.map((item) => (
          <button key={item.category} onClick={() => setFilterCategory(filterCategory === item.category ? '' : item.category)}
            className={`bg-white border rounded-xl p-4 shadow-sm text-left transition-colors ${
              filterCategory === item.category ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-gray-600">{item.category}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{item.count}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-64">
            <SearchBar value={search} onChange={setSearch} placeholder="Tìm theo tên, số hiệu..." />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả loại</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">Tất cả trạng thái</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={openAdd}
          className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shrink-0">
          + Thêm tài liệu
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Số hiệu</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tên tài liệu</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Loại</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Phòng ban</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ngày ban hành</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Hiệu lực</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Phiên bản</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">File</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">TT</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{doc.code}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailModal(doc)} className="text-left hover:text-indigo-600">
                      <p className="font-medium text-gray-800">{doc.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{doc.description}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <span>{categoryIcons[doc.category]}</span> {doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{doc.departmentName}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(doc.issuedDate).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(doc.effectiveDate).toLocaleDateString('vi-VN')}
                    {doc.expiryDate && <> → {new Date(doc.expiryDate).toLocaleDateString('vi-VN')}</>}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">v{doc.version}</td>
                  <td className="px-4 py-3 text-center">
                    {doc.attachments.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        {doc.attachments.length}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={doc.status} colorMap={statusColors} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetailModal(doc)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Chi tiết">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button onClick={() => openEdit(doc)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600" title="Sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {doc.status === 'Nháp' && (
                        <button onClick={() => handleActivate(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="Ban hành">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                      {doc.status === 'Hiệu lực' && (
                        <button onClick={() => handleExpire(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Thu hồi">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => setDeleteDialog(doc)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Xóa">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" /><path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">Không tìm thấy tài liệu nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          Hiển thị {filtered.length} / {docs.length} tài liệu
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Chi tiết tài liệu" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{categoryIcons[detailModal.category]}</span>
                  <span className="text-sm text-gray-500 font-mono">{detailModal.code}</span>
                  <span className="text-xs text-gray-400">v{detailModal.version}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{detailModal.title}</h3>
              </div>
              <StatusBadge status={detailModal.status} colorMap={statusColors} />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="text-gray-700">{detailModal.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Loại tài liệu</p>
                <p className="text-gray-700">{detailModal.category}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Phòng ban</p>
                <p className="text-gray-700">{detailModal.departmentName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Người tạo</p>
                <p className="text-gray-700">{detailModal.createdBy}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Ngày ban hành</p>
                <p className="text-gray-700">{new Date(detailModal.issuedDate).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Ngày hiệu lực</p>
                <p className="text-gray-700">{new Date(detailModal.effectiveDate).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Ngày hết hạn</p>
                <p className="text-gray-700">{detailModal.expiryDate ? new Date(detailModal.expiryDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}</p>
              </div>
            </div>

            {/* Attachments section */}
            {detailModal.attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">File đính kèm ({detailModal.attachments.length})</p>
                <div className="space-y-2">
                  {detailModal.attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg shrink-0">{fileTypeIcons[file.type] || '📎'}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">{getFileExt(file.name)} · {formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 shrink-0">
                        Tải xuống
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detailModal.attachments.length === 0 && (
              <div className="text-sm text-gray-400 italic">Không có file đính kèm</div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Form Modal */}
      <Modal open={formModal} onClose={() => setFormModal(false)} title={editingDoc ? 'Sửa tài liệu' : 'Thêm tài liệu mới'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số hiệu <span className="text-red-500">*</span></label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: BM-NS-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phiên bản</label>
              <input type="text" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1.0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài liệu <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập tên tài liệu..." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại tài liệu</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DocumentCategory })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
              <select value={form.departmentName} onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Chọn phòng ban</option>
                {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DocumentStatus })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ban hành</label>
              <input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hiệu lực</label>
              <input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
              <input type="date" value={form.expiryDate || ''} onChange={(e) => setForm({ ...form, expiryDate: e.target.value || null })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Người tạo</label>
            <input type="text" value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập tên người tạo..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Nhập mô tả tài liệu..." />
          </div>

          {/* File attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File đính kèm</label>
            {form.attachments.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{fileTypeIcons[file.type] || '📎'}</span>
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{formatFileSize(file.size)}</span>
                    </div>
                    <button type="button" onClick={() => handleFileRemove(file.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span className="text-sm text-gray-500">Chọn file đính kèm (PDF, DOCX, XLSX, ...)</span>
              <input type="file" multiple className="hidden" onChange={handleFileAdd}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setFormModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              {editingDoc ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Xóa tài liệu"
        message={`Bạn có chắc muốn xóa tài liệu "${deleteDialog?.title}"?`}
      />
    </div>
  )
}
