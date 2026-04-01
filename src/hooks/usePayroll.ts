import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { PayrollRecord } from '@/types'

type DbRow = {
  id: string
  employee_id: string
  employee_code: string
  employee_name: string
  department_name: string
  position: string
  month: number
  year: number
  working_days: number
  actual_days: number
  basic_salary: number
  allowance: number
  overtime: number
  deduction: number
  insurance: number
  tax: number
  net_salary: number
  status: string
}

function fromDb(row: DbRow): PayrollRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code,
    employeeName: row.employee_name,
    departmentName: row.department_name,
    position: row.position,
    month: row.month,
    year: row.year,
    workingDays: row.working_days,
    actualDays: row.actual_days,
    basicSalary: row.basic_salary,
    allowance: row.allowance,
    overtime: row.overtime,
    deduction: row.deduction,
    insurance: row.insurance,
    tax: row.tax,
    netSalary: row.net_salary,
    status: row.status as PayrollRecord['status'],
  }
}

function toDb(item: Record<string, unknown>) {
  const db: Record<string, unknown> = {}
  if (item.employeeId !== undefined) db.employee_id = item.employeeId
  if (item.month !== undefined) db.month = item.month
  if (item.year !== undefined) db.year = item.year
  if (item.workingDays !== undefined) db.working_days = item.workingDays
  if (item.actualDays !== undefined) db.actual_days = item.actualDays
  if (item.basicSalary !== undefined) db.basic_salary = item.basicSalary
  if (item.allowance !== undefined) db.allowance = item.allowance
  if (item.overtime !== undefined) db.overtime = item.overtime
  if (item.deduction !== undefined) db.deduction = item.deduction
  if (item.insurance !== undefined) db.insurance = item.insurance
  if (item.tax !== undefined) db.tax = item.tax
  if (item.netSalary !== undefined) db.net_salary = item.netSalary
  if (item.status !== undefined) db.status = item.status
  return db
}

async function queryPayroll() {
  const { data: rows } = await supabase
    .from('payroll_view')
    .select('*')
    .order('employee_code')
  return (rows || []).map(fromDb)
}

export function usePayroll() {
  const [data, setData] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    queryPayroll().then((result) => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [])

  async function refresh() {
    setLoading(true)
    setData(await queryPayroll())
    setLoading(false)
  }

  async function create(item: Omit<PayrollRecord, 'id' | 'employeeCode' | 'employeeName' | 'departmentName' | 'position'>) {
    const { error } = await supabase.from('payroll_records').insert(toDb(item as Record<string, unknown>))
    if (!error) await refresh()
    return error
  }

  async function update(id: string, item: Partial<PayrollRecord>) {
    const { error } = await supabase.from('payroll_records').update(toDb(item as Record<string, unknown>)).eq('id', id)
    if (!error) await refresh()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('payroll_records').delete().eq('id', id)
    if (!error) await refresh()
    return error
  }

  return { data, loading, create, update, remove, refresh }
}
