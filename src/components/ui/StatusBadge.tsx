interface StatusBadgeProps {
  status: string
  colorMap?: Record<string, string>
}

const defaultColors: Record<string, string> = {
  'Đang làm việc': 'bg-green-100 text-green-700',
  'Đã nghỉ việc': 'bg-gray-100 text-gray-600',
  'Thử việc': 'bg-blue-100 text-blue-700',
  'Nghỉ thai sản': 'bg-purple-100 text-purple-700',
  'Đang hiệu lực': 'bg-green-100 text-green-700',
  'Hết hạn': 'bg-red-100 text-red-700',
  'Đã thanh lý': 'bg-gray-100 text-gray-600',
}

export default function StatusBadge({ status, colorMap }: StatusBadgeProps) {
  const colors = colorMap ?? defaultColors
  const cls = colors[status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
