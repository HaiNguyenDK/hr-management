export interface Department {
  id: string
  name: string
  manager: string
  employeeCount: number
  phone: string
  email: string
  description: string
  createdAt: string
}

export interface Employee {
  id: string
  code: string
  fullName: string
  gender: 'Nam' | 'Nữ'
  dateOfBirth: string
  phone: string
  email: string
  address: string
  departmentId: string
  departmentName: string
  position: string
  startDate: string
  status: 'Đang làm việc' | 'Đã nghỉ việc' | 'Thử việc' | 'Nghỉ thai sản'
  avatar?: string
}

export interface Contract {
  id: string
  contractNumber: string
  employeeId: string
  employeeName: string
  type: 'Thử việc' | 'Xác định thời hạn' | 'Không xác định thời hạn'
  startDate: string
  endDate: string | null
  basicSalary: number
  status: 'Đang hiệu lực' | 'Hết hạn' | 'Đã thanh lý'
  signDate: string
  note: string
}

export type AttendanceStatus = 'Đi làm' | 'Vắng' | 'Nghỉ phép' | 'Nửa ngày' | 'Đi trễ' | ''

export interface AttendanceRecord {
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentName: string
  days: Record<number, AttendanceStatus>
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentName: string
  type: 'Nghỉ phép năm' | 'Nghỉ ốm' | 'Nghỉ việc riêng' | 'Nghỉ thai sản' | 'Nghỉ không lương'
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối'
  createdAt: string
  remainingDays: number
}

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  departmentName: string
  position: string
  month: number
  year: number
  workingDays: number
  actualDays: number
  basicSalary: number
  allowance: number
  overtime: number
  deduction: number
  insurance: number
  tax: number
  netSalary: number
  status: 'Nháp' | 'Đã duyệt' | 'Đã chi'
}

export type DocumentCategory = 'Biểu mẫu' | 'Công văn đến' | 'Công văn đi' | 'Quy định' | 'Hợp đồng mẫu'
export type DocumentStatus = 'Nháp' | 'Hiệu lực' | 'Hết hiệu lực'

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
}

export interface Document {
  id: string
  code: string
  title: string
  category: DocumentCategory
  departmentName: string
  issuedDate: string
  effectiveDate: string
  expiryDate: string | null
  status: DocumentStatus
  createdBy: string
  description: string
  version: string
  attachments: Attachment[]
}
