import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { LeaveRequest } from '@/types'

type DbRow = {
  id: string
  employee_id: string
  employee_code: string
  employee_name: string
  department_name: string
  type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: string
  created_at: string
  remaining_days: number
}

function fromDb(row: DbRow): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    departmentName: row.department_name,
    type: row.type as LeaveRequest['type'],
    startDate: row.start_date,
    endDate: row.end_date,
    totalDays: row.total_days,
    reason: row.reason,
    status: row.status as LeaveRequest['status'],
    createdAt: row.created_at,
    remainingDays: row.remaining_days,
  }
}

function toDb(item: Record<string, unknown>) {
  const db: Record<string, unknown> = {}
  if (item.employeeId !== undefined) db.employee_id = item.employeeId
  if (item.type !== undefined) db.type = item.type
  if (item.startDate !== undefined) db.start_date = item.startDate
  if (item.endDate !== undefined) db.end_date = item.endDate
  if (item.totalDays !== undefined) db.total_days = item.totalDays
  if (item.reason !== undefined) db.reason = item.reason
  if (item.status !== undefined) db.status = item.status
  if (item.remainingDays !== undefined) db.remaining_days = item.remainingDays
  return db
}

async function queryLeaves() {
  const { data: rows } = await supabase
    .from('leave_requests_view')
    .select('*')
    .order('created_at', { ascending: false })
  return (rows || []).map(fromDb)
}

export function useLeaves() {
  const [data, setData] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    queryLeaves().then((result) => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [])

  async function refresh() {
    setLoading(true)
    setData(await queryLeaves())
    setLoading(false)
  }

  async function create(item: Omit<LeaveRequest, 'id' | 'employeeCode' | 'employeeName' | 'departmentName' | 'createdAt'>) {
    const { error } = await supabase.from('leave_requests').insert(toDb(item as Record<string, unknown>))
    if (!error) await refresh()
    return error
  }

  async function update(id: string, item: Partial<LeaveRequest>) {
    const { error } = await supabase.from('leave_requests').update(toDb(item as Record<string, unknown>)).eq('id', id)
    if (!error) await refresh()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('leave_requests').delete().eq('id', id)
    if (!error) await refresh()
    return error
  }

  return { data, loading, create, update, remove, refresh }
}
