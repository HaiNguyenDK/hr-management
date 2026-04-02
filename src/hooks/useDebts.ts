import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { DebtRecord, DebtPayment } from '@/types'

type DbRow = {
  id: string
  code: string
  target: string
  counterparty_name: string
  employee_id: string | null
  department_name: string
  type: string
  description: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  issue_date: string
  due_date: string | null
  status: string
  note: string
  created_at: string
}

type PaymentDbRow = {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  method: string
  note: string
  created_at: string
}

function fromDb(row: DbRow): DebtRecord {
  return {
    id: row.id,
    code: row.code,
    target: row.target as DebtRecord['target'],
    counterpartyName: row.counterparty_name,
    employeeId: row.employee_id,
    departmentName: row.department_name,
    type: row.type as DebtRecord['type'],
    description: row.description,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    remainingAmount: row.remaining_amount,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: row.status as DebtRecord['status'],
    note: row.note,
    createdAt: row.created_at,
  }
}

function paymentFromDb(row: PaymentDbRow): DebtPayment {
  return {
    id: row.id,
    debtId: row.debt_id,
    amount: row.amount,
    paymentDate: row.payment_date,
    method: row.method,
    note: row.note,
    createdAt: row.created_at,
  }
}

function toDb(item: Record<string, unknown>) {
  const db: Record<string, unknown> = {}
  if (item.code !== undefined) db.code = item.code
  if (item.target !== undefined) db.target = item.target
  if (item.counterpartyName !== undefined) db.counterparty_name = item.counterpartyName
  if (item.employeeId !== undefined) db.employee_id = item.employeeId
  if (item.departmentName !== undefined) db.department_name = item.departmentName
  if (item.type !== undefined) db.type = item.type
  if (item.description !== undefined) db.description = item.description
  if (item.totalAmount !== undefined) db.total_amount = item.totalAmount
  if (item.paidAmount !== undefined) db.paid_amount = item.paidAmount
  if (item.issueDate !== undefined) db.issue_date = item.issueDate
  if (item.dueDate !== undefined) db.due_date = item.dueDate
  if (item.status !== undefined) db.status = item.status
  if (item.note !== undefined) db.note = item.note
  return db
}

async function queryDebts() {
  const { data: rows } = await supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false })
  return (rows || []).map(fromDb)
}

async function queryPayments(debtId: string) {
  const { data: rows } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('debt_id', debtId)
    .order('payment_date', { ascending: false })
  return (rows || []).map(paymentFromDb)
}

export function useDebts() {
  const [data, setData] = useState<DebtRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    queryDebts().then((result) => {
      if (!ignore) {
        setData(result)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [])

  async function refresh() {
    setLoading(true)
    setData(await queryDebts())
    setLoading(false)
  }

  async function create(item: Omit<DebtRecord, 'id' | 'remainingAmount' | 'createdAt'>) {
    const { error } = await supabase.from('debts').insert(toDb(item as Record<string, unknown>))
    if (!error) await refresh()
    return error
  }

  async function update(id: string, item: Partial<DebtRecord>) {
    const { error } = await supabase.from('debts').update(toDb(item as Record<string, unknown>)).eq('id', id)
    if (!error) await refresh()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (!error) await refresh()
    return error
  }

  async function addPayment(debtId: string, payment: { amount: number; paymentDate: string; method: string; note: string }) {
    // Thêm thanh toán
    const { error } = await supabase.from('debt_payments').insert({
      debt_id: debtId,
      amount: payment.amount,
      payment_date: payment.paymentDate,
      method: payment.method,
      note: payment.note,
    })
    if (error) return error

    // Cập nhật paid_amount + status
    const debt = data.find((d) => d.id === debtId)
    if (debt) {
      const newPaid = debt.paidAmount + payment.amount
      const newRemaining = debt.totalAmount - newPaid
      let newStatus: DebtRecord['status'] = 'Thanh toán một phần'
      if (newRemaining <= 0) newStatus = 'Đã thanh toán'
      await supabase.from('debts').update({ paid_amount: newPaid, status: newStatus }).eq('id', debtId)
    }
    await refresh()
    return null
  }

  async function getPayments(debtId: string) {
    return queryPayments(debtId)
  }

  return { data, loading, create, update, remove, addPayment, getPayments, refresh }
}
