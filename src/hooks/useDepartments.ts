import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Department } from '@/types'

type DbRow = {
  id: string
  name: string
  manager: string
  employee_count: number
  phone: string
  email: string
  description: string
  created_at: string
}

function fromDb(row: DbRow): Department {
  return {
    id: row.id,
    name: row.name,
    manager: row.manager,
    employeeCount: row.employee_count,
    phone: row.phone,
    email: row.email,
    description: row.description,
    createdAt: row.created_at,
  }
}

function toDb(item: Omit<Department, 'id' | 'createdAt'>) {
  return {
    name: item.name,
    manager: item.manager,
    employee_count: item.employeeCount,
    phone: item.phone,
    email: item.email,
    description: item.description,
  }
}

async function queryDepartments() {
  const { data: rows } = await supabase
    .from('departments')
    .select('*')
    .order('created_at')
  return (rows || []).map(fromDb)
}

export function useDepartments() {
  const [data, setData] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    queryDepartments().then((result) => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [])

  async function refresh() {
    setLoading(true)
    setData(await queryDepartments())
    setLoading(false)
  }

  async function create(item: Omit<Department, 'id' | 'createdAt'>) {
    const { error } = await supabase.from('departments').insert(toDb(item))
    if (!error) await refresh()
    return error
  }

  async function update(id: string, item: Partial<Omit<Department, 'id' | 'createdAt'>>) {
    const dbItem: Record<string, unknown> = {}
    if (item.name !== undefined) dbItem.name = item.name
    if (item.manager !== undefined) dbItem.manager = item.manager
    if (item.employeeCount !== undefined) dbItem.employee_count = item.employeeCount
    if (item.phone !== undefined) dbItem.phone = item.phone
    if (item.email !== undefined) dbItem.email = item.email
    if (item.description !== undefined) dbItem.description = item.description
    const { error } = await supabase.from('departments').update(dbItem).eq('id', id)
    if (!error) await refresh()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (!error) await refresh()
    return error
  }

  return { data, loading, create, update, remove, refresh }
}
