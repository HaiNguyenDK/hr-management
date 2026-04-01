import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types'

type DbRow = {
  id: string
  code: string
  full_name: string
  gender: string
  date_of_birth: string
  phone: string
  email: string
  address: string
  department_id: string
  department_name: string
  position: string
  start_date: string
  status: string
  avatar: string | null
}

function fromDb(row: DbRow): Employee {
  return {
    id: row.id,
    code: row.code,
    fullName: row.full_name,
    gender: row.gender as Employee['gender'],
    dateOfBirth: row.date_of_birth,
    phone: row.phone,
    email: row.email,
    address: row.address,
    departmentId: row.department_id,
    departmentName: row.department_name,
    position: row.position,
    startDate: row.start_date,
    status: row.status as Employee['status'],
    avatar: row.avatar || undefined,
  }
}

function toDb(item: Record<string, unknown>) {
  const db: Record<string, unknown> = {}
  if (item.code !== undefined) db.code = item.code
  if (item.fullName !== undefined) db.full_name = item.fullName
  if (item.gender !== undefined) db.gender = item.gender
  if (item.dateOfBirth !== undefined) db.date_of_birth = item.dateOfBirth
  if (item.phone !== undefined) db.phone = item.phone
  if (item.email !== undefined) db.email = item.email
  if (item.address !== undefined) db.address = item.address
  if (item.departmentId !== undefined) db.department_id = item.departmentId
  if (item.position !== undefined) db.position = item.position
  if (item.startDate !== undefined) db.start_date = item.startDate
  if (item.status !== undefined) db.status = item.status
  if (item.avatar !== undefined) db.avatar = item.avatar
  return db
}

async function queryEmployees() {
  const { data: rows } = await supabase
    .from('employees_view')
    .select('*')
    .order('code')
  return (rows || []).map(fromDb)
}

export function useEmployees() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    queryEmployees().then((result) => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [])

  async function refresh() {
    setLoading(true)
    setData(await queryEmployees())
    setLoading(false)
  }

  async function create(item: Omit<Employee, 'id' | 'departmentName'>) {
    const { error } = await supabase.from('employees').insert(toDb(item as Record<string, unknown>))
    if (!error) await refresh()
    return error
  }

  async function update(id: string, item: Partial<Employee>) {
    const { error } = await supabase.from('employees').update(toDb(item as Record<string, unknown>)).eq('id', id)
    if (!error) await refresh()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (!error) await refresh()
    return error
  }

  return { data, loading, create, update, remove, refresh }
}
