import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { saveAs } from 'file-saver'
import { formatDate } from '@/utils/date'

export interface LeaveDocData {
  employeeName: string
  position: string
  departmentName: string
  phone: string
  startDate: string   // ISO
  endDate: string      // ISO
  reason: string
  leaveType: string
  totalDays: number
  // Các field bổ sung khi xuất
  companyName: string
  city: string
  timeStart: string
  timeEnd: string
  substitute: string
}

const LEAVE_TYPE_MAP: Record<string, string> = {
  'Nghỉ việc riêng': 'VIEC_RIENG',
  'Nghỉ phép năm': 'PHEP_NAM',
  'Nghỉ ốm': 'NGHI_OM',
  'Nghỉ thai sản': 'NGHI_CHE_DO',
  'Nghỉ không lương': 'VIEC_RIENG',
}

function buildTemplateData(data: LeaveDocData) {
  const now = new Date()
  const typeKey = LEAVE_TYPE_MAP[data.leaveType] ?? ''

  return {
    CAMPANY_NAME: data.companyName,
    CITY: data.city,
    DAY: String(now.getDate()).padStart(2, '0'),
    MONTH: String(now.getMonth() + 1).padStart(2, '0'),
    YEAR: String(now.getFullYear()),
    FULL_NAME: data.employeeName,
    POSITION: data.position,
    PART: data.departmentName,
    TIME_START: data.timeStart,
    DAY_START: formatDate(data.startDate),
    TIME_END: data.timeEnd,
    DAY_END: formatDate(data.endDate),
    REASON: data.reason,
    NUMBER_OF_DAYS_OFF: String(data.totalDays),
    SUBSTITUTE: data.substitute,
    PHONE_NUMBER: data.phone,
    // Checkbox replacements
    CHECK_VIEC_RIENG: typeKey === 'VIEC_RIENG' ? '☑' : '☐',
    CHECK_PHEP_NAM: typeKey === 'PHEP_NAM' ? '☑' : '☐',
    CHECK_NGHI_OM: typeKey === 'NGHI_OM' ? '☑' : '☐',
    CHECK_NGHI_CHE_DO: typeKey === 'NGHI_CHE_DO' ? '☑' : '☐',
  }
}

export async function exportLeaveDoc(data: LeaveDocData) {
  const res = await fetch('/templates/phieu-nghi-phep.docx')
  if (!res.ok) throw new Error('Không tìm thấy file template. Hãy đặt file tại public/templates/phieu-nghi-phep.docx')

  const buf = await res.arrayBuffer()
  const zip = new PizZip(buf)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  })

  doc.render(buildTemplateData(data))

  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  const fileName = `Phieu_nghi_phep_${data.employeeName.replace(/\s+/g, '_')}_${formatDate(data.startDate).replace(/\//g, '-')}.docx`
  saveAs(out, fileName)
}
