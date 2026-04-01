import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import Dashboard from '@/pages/Dashboard'
import Departments from '@/pages/Departments'
import Employees from '@/pages/Employees'
import Contracts from '@/pages/Contracts'
import Attendance from '@/pages/Attendance'
import Leaves from '@/pages/Leaves'
import Payroll from '@/pages/Payroll'
import Documents from '@/pages/Documents'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/documents" element={<Documents />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
