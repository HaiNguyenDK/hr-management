const stats = [
  { label: 'Tổng nhân viên', value: '128', change: '+3', color: 'bg-blue-500' },
  { label: 'Phòng ban', value: '8', change: '', color: 'bg-emerald-500' },
  { label: 'Nghỉ phép hôm nay', value: '5', change: '', color: 'bg-amber-500' },
  { label: 'HĐ sắp hết hạn', value: '12', change: '', color: 'bg-rose-500' },
]

const recentActivities = [
  { action: 'Nguyễn Văn A đã nộp đơn xin nghỉ phép', time: '10 phút trước' },
  { action: 'Hợp đồng của Trần Thị B sắp hết hạn (15/04/2026)', time: '1 giờ trước' },
  { action: 'Phòng Kỹ thuật thêm 2 nhân viên mới', time: '2 giờ trước' },
  { action: 'Bảng lương tháng 3/2026 đã được duyệt', time: '1 ngày trước' },
  { action: 'Lê Văn C hoàn thành thử việc', time: '2 ngày trước' },
]

const upcomingTasks: { task: string; priority: 'high' | 'medium' | 'low' }[] = [
  { task: 'Duyệt đơn nghỉ phép (3 đơn)', priority: 'high' },
  { task: 'Chuẩn bị hợp đồng cho nhân viên mới', priority: 'medium' },
  { task: 'Tổng hợp chấm công tháng 3', priority: 'high' },
  { task: 'Cập nhật danh sách BHXH quý 2', priority: 'low' },
]

const priorityColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const priorityLabels = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-lg font-bold">{stat.value.charAt(0)}</span>
              </div>
            </div>
            {stat.change && (
              <p className="text-xs text-emerald-600 mt-2">
                {stat.change} so với tháng trước
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activities */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Hoạt động gần đây</h2>
          </div>
          <div className="p-5">
            <ul className="space-y-4">
              {recentActivities.map((activity, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-700">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Công việc cần làm</h2>
          </div>
          <div className="p-5">
            <ul className="space-y-3">
              {upcomingTasks.map((item, i) => (
                <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{item.task}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[item.priority]}`}>
                    {priorityLabels[item.priority]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Tổng quan nhân sự theo phòng ban</h2>
        <div className="space-y-3">
          {[
            { dept: 'Phòng Kỹ thuật', count: 35, percent: 27 },
            { dept: 'Phòng Kinh doanh', count: 28, percent: 22 },
            { dept: 'Phòng Nhân sự', count: 15, percent: 12 },
            { dept: 'Phòng Marketing', count: 20, percent: 16 },
            { dept: 'Phòng Kế toán', count: 12, percent: 9 },
            { dept: 'Phòng Hành chính', count: 18, percent: 14 },
          ].map((d) => (
            <div key={d.dept} className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-40 shrink-0">{d.dept}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-indigo-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${d.percent}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-500 w-16 text-right">{d.count} người</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
