import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AttendanceRecord, AttendanceStatus } from '@/types'

type DbRow = {
  id: string
  employee_id: string
  employee_code: string
  employee_name: string
  department_name: string
  date: string
  status: string
}

export function useAttendance() {
  const [data, setData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async (month: number, year: number) => {
    setLoading(true)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0) // last day of month
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    const { data: rows } = await supabase
      .from('attendance_view')
      .select('*')
      .gte('date', startDate)
      .lte('date', endStr)
      .order('employee_code')

    // Group by employee
    const map = new Map<string, AttendanceRecord>()
    for (const row of (rows || []) as DbRow[]) {
      if (!map.has(row.employee_id)) {
        map.set(row.employee_id, {
          employeeId: row.employee_id,
          employeeCode: row.employee_code,
          employeeName: row.employee_name,
          departmentName: row.department_name,
          days: {},
        })
      }
      const day = new Date(row.date).getDate()
      map.get(row.employee_id)!.days[day] = row.status as AttendanceStatus
    }
    setData(Array.from(map.values()))
    setLoading(false)
  }, [])

  async function updateStatus(employeeId: string, date: string, status: AttendanceStatus) {
    if (!status) {
      await supabase.from('attendance_records').delete()
        .eq('employee_id', employeeId)
        .eq('date', date)
    } else {
      await supabase.from('attendance_records').upsert(
        { employee_id: employeeId, date, status },
        { onConflict: 'employee_id,date' }
      )
    }
  }

  return { data, loading, fetch, updateStatus }
}
