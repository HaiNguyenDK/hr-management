import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Document, Attachment } from '@/types'

type DbDocRow = {
  id: string
  code: string
  title: string
  category: string
  department_name: string
  issued_date: string
  effective_date: string
  expiry_date: string | null
  status: string
  created_by: string
  description: string
  version: string
}

type DbAttachmentRow = {
  id: string
  document_id: string
  name: string
  size: number
  type: string
  storage_path: string
}

function fromDb(row: DbDocRow, attachments: Attachment[]): Document {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    category: row.category as Document['category'],
    departmentName: row.department_name,
    issuedDate: row.issued_date,
    effectiveDate: row.effective_date,
    expiryDate: row.expiry_date,
    status: row.status as Document['status'],
    createdBy: row.created_by,
    description: row.description,
    version: row.version,
    attachments,
  }
}

function toDb(item: Record<string, unknown>) {
  const db: Record<string, unknown> = {}
  if (item.code !== undefined) db.code = item.code
  if (item.title !== undefined) db.title = item.title
  if (item.category !== undefined) db.category = item.category
  if (item.departmentName !== undefined) db.department_name = item.departmentName
  if (item.issuedDate !== undefined) db.issued_date = item.issuedDate
  if (item.effectiveDate !== undefined) db.effective_date = item.effectiveDate
  if (item.expiryDate !== undefined) db.expiry_date = item.expiryDate
  if (item.status !== undefined) db.status = item.status
  if (item.createdBy !== undefined) db.created_by = item.createdBy
  if (item.description !== undefined) db.description = item.description
  if (item.version !== undefined) db.version = item.version
  return db
}

async function queryDocuments(): Promise<Document[]> {
  const [docsRes, attachRes] = await Promise.all([
    supabase.from('documents').select('*').order('created_at', { ascending: false }),
    supabase.from('attachments').select('*'),
  ])

  const attachmentsByDoc = new Map<string, Attachment[]>()
  for (const a of (attachRes.data || []) as DbAttachmentRow[]) {
    if (!attachmentsByDoc.has(a.document_id)) attachmentsByDoc.set(a.document_id, [])
    attachmentsByDoc.get(a.document_id)!.push({ id: a.id, name: a.name, size: a.size, type: a.type })
  }

  return (docsRes.data || []).map((row: DbDocRow) => fromDb(row, attachmentsByDoc.get(row.id) || []))
}

export function useDocuments() {
  const [data, setData] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    queryDocuments().then((result) => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [])

  async function refresh() {
    setLoading(true)
    setData(await queryDocuments())
    setLoading(false)
  }

  async function create(item: Omit<Document, 'id'>) {
    const { attachments, ...rest } = item
    const { data: newDoc, error } = await supabase.from('documents').insert(toDb(rest as Record<string, unknown>)).select('id').single()
    if (!error && newDoc && attachments.length > 0) {
      await supabase.from('attachments').insert(
        attachments.map((a) => ({ document_id: newDoc.id, name: a.name, size: a.size, type: a.type }))
      )
    }
    if (!error) await refresh()
    return error
  }

  async function update(id: string, item: Partial<Document>) {
    const { attachments, ...rest } = item
    const dbData = toDb(rest as Record<string, unknown>)
    if (Object.keys(dbData).length > 0) {
      await supabase.from('documents').update(dbData).eq('id', id)
    }
    if (attachments !== undefined) {
      await supabase.from('attachments').delete().eq('document_id', id)
      if (attachments.length > 0) {
        await supabase.from('attachments').insert(
          attachments.map((a) => ({ document_id: id, name: a.name, size: a.size, type: a.type }))
        )
      }
    }
    await refresh()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (!error) await refresh()
    return error
  }

  return { data, loading, create, update, remove, refresh }
}
