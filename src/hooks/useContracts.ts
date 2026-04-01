import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contract } from '@/types'

type DbRow = {
  id: string
  contract_number: string
  employee_id: string
  employee_name: string
  type: string
  start_date: string
  end_date: string | null
  basic_salary: number
  status: string
  sign_date: string
  note: string
}

function fromDb(row: DbRow): Contract {
  return {
    id: row.id,
    contractNumber: row.contract_number,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    type: row.type as Contract['type'],
    startDate: row.start_date,
    endDate: row.end_date,
    basicSalary: row.basic_salary,
    status: row.status as Contract['status'],
    signDate: row.sign_date,
    note: row.note,
  }
}

function toDb(item: Record<string, unknown>) {
  const db: Record<string, unknown> = {}
  if (item.contractNumber !== undefined) db.contract_number = item.contractNumber
  if (item.employeeId !== undefined) db.employee_id = item.employeeId
  if (item.type !== undefined) db.type = item.type
  if (item.startDate !== undefined) db.start_date = item.startDate
  if (item.endDate !== undefined) db.end_date = item.endDate
  if (item.basicSalary !== undefined) db.basic_salary = item.basicSalary
  if (item.status !== undefined) db.status = item.status
  if (item.signDate !== undefined) db.sign_date = item.signDate
  if (item.note !== undefined) db.note = item.note
  return db
}

async function queryContracts() {
  const { data: rows } = await supabase
    .from('contracts_view')
    .select('*')
    .order('created_at', { ascending: false })
  return (rows || []).map(fromDb)
}

export function useContracts() {
  const [data, setData] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    queryContracts().then((result) => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [])

  async function refresh() {
    setLoading(true)
    setData(await queryContracts())
    setLoading(false)
  }

  async function create(item: Omit<Contract, 'id' | 'employeeName'>) {
    const { error } = await supabase.from('contracts').insert(toDb(item as Record<string, unknown>))
    if (!error) await refresh()
    return error
  }

  async function update(id: string, item: Partial<Contract>) {
    const { error } = await supabase.from('contracts').update(toDb(item as Record<string, unknown>)).eq('id', id)
    if (!error) await refresh()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('contracts').delete().eq('id', id)
    if (!error) await refresh()
    return error
  }

  return { data, loading, create, update, remove, refresh }
}
