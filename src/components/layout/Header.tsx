import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/departments': 'Quản lý phòng ban',
  '/employees': 'Quản lý nhân viên',
  '/contracts': 'Hợp đồng lao động',
  '/attendance': 'Chấm công',
  '/leaves': 'Quản lý nghỉ phép',
  '/payroll': 'Bảng lương',
  '/documents': 'Quản lý tài liệu',
}

export default function Header() {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'HR Management'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-600">A</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">Admin</p>
            <p className="text-xs text-gray-400">Hành chính nhân sự</p>
          </div>
        </div>
      </div>
    </header>
  )
}
