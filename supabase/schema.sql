-- =============================================
-- HR Management - Supabase Schema
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- 1. Phòng ban
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manager TEXT NOT NULL DEFAULT '',
  employee_count INT DEFAULT 0,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Nhân viên
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Nam', 'Nữ')) DEFAULT 'Nam',
  date_of_birth DATE,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  position TEXT DEFAULT '',
  start_date DATE,
  status TEXT DEFAULT 'Đang làm việc',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Hợp đồng
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  basic_salary BIGINT DEFAULT 0,
  status TEXT DEFAULT 'Đang hiệu lực',
  sign_date DATE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Chấm công (mỗi dòng = 1 nhân viên + 1 ngày)
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Đi làm',
  UNIQUE(employee_id, date)
);

-- 5. Nghỉ phép
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT DEFAULT 1,
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'Chờ duyệt',
  remaining_days INT DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng lương
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  working_days INT DEFAULT 22,
  actual_days INT DEFAULT 22,
  basic_salary BIGINT DEFAULT 0,
  allowance BIGINT DEFAULT 0,
  overtime BIGINT DEFAULT 0,
  deduction BIGINT DEFAULT 0,
  insurance BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  net_salary BIGINT DEFAULT 0,
  status TEXT DEFAULT 'Nháp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- 7. Tài liệu
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  department_name TEXT DEFAULT '',
  issued_date DATE,
  effective_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'Nháp',
  created_by TEXT DEFAULT '',
  description TEXT DEFAULT '',
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. File đính kèm
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INT DEFAULT 0,
  type TEXT DEFAULT '',
  storage_path TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Views (để join dữ liệu, trả về đúng format)
-- =============================================

-- View nhân viên kèm tên phòng ban
CREATE OR REPLACE VIEW employees_view AS
SELECT
  e.*,
  COALESCE(d.name, '') AS department_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- View hợp đồng kèm tên nhân viên
CREATE OR REPLACE VIEW contracts_view AS
SELECT
  c.*,
  COALESCE(e.full_name, '') AS employee_name
FROM contracts c
LEFT JOIN employees e ON c.employee_id = e.id;

-- View nghỉ phép kèm thông tin nhân viên
CREATE OR REPLACE VIEW leave_requests_view AS
SELECT
  lr.*,
  COALESCE(e.code, '') AS employee_code,
  COALESCE(e.full_name, '') AS employee_name,
  COALESCE(d.name, '') AS department_name
FROM leave_requests lr
LEFT JOIN employees e ON lr.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id;

-- View bảng lương kèm thông tin nhân viên
CREATE OR REPLACE VIEW payroll_view AS
SELECT
  pr.*,
  COALESCE(e.code, '') AS employee_code,
  COALESCE(e.full_name, '') AS employee_name,
  COALESCE(e.position, '') AS position,
  COALESCE(d.name, '') AS department_name
FROM payroll_records pr
LEFT JOIN employees e ON pr.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id;

-- View chấm công kèm thông tin nhân viên
CREATE OR REPLACE VIEW attendance_view AS
SELECT
  ar.*,
  COALESCE(e.code, '') AS employee_code,
  COALESCE(e.full_name, '') AS employee_name,
  COALESCE(d.name, '') AS department_name
FROM attendance_records ar
LEFT JOIN employees e ON ar.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id;

-- =============================================
-- Row Level Security (cho phép truy cập public với anon key)
-- =============================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy: cho phép mọi thao tác với anon key (app cá nhân)
CREATE POLICY "Allow all" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON payroll_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON attachments FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Seed Data
-- =============================================

-- Phòng ban
INSERT INTO departments (id, name, manager, employee_count, phone, email, description) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Phòng Kỹ thuật', 'Nguyễn Văn An', 35, '024-1234-001', 'kythuat@company.vn', 'Phụ trách phát triển sản phẩm và hạ tầng kỹ thuật'),
  ('d1000000-0000-0000-0000-000000000002', 'Phòng Kinh doanh', 'Trần Thị Bình', 28, '024-1234-002', 'kinhdoanh@company.vn', 'Phụ trách bán hàng và phát triển khách hàng'),
  ('d1000000-0000-0000-0000-000000000003', 'Phòng Nhân sự', 'Lê Văn Cường', 15, '024-1234-003', 'nhansu@company.vn', 'Phụ trách tuyển dụng, đào tạo và chính sách nhân sự'),
  ('d1000000-0000-0000-0000-000000000004', 'Phòng Marketing', 'Phạm Thị Dung', 20, '024-1234-004', 'marketing@company.vn', 'Phụ trách truyền thông và thương hiệu'),
  ('d1000000-0000-0000-0000-000000000005', 'Phòng Kế toán', 'Hoàng Văn Em', 12, '024-1234-005', 'ketoan@company.vn', 'Phụ trách tài chính và kế toán'),
  ('d1000000-0000-0000-0000-000000000006', 'Phòng Hành chính', 'Vũ Thị Phương', 18, '024-1234-006', 'hanhchinh@company.vn', 'Phụ trách hành chính và quản lý văn phòng');

-- Nhân viên
INSERT INTO employees (id, code, full_name, gender, date_of_birth, phone, email, address, department_id, position, start_date, status) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'NV001', 'Nguyễn Văn An', 'Nam', '1985-05-12', '0901234001', 'an.nv@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000001', 'Trưởng phòng', '2020-01-15', 'Đang làm việc'),
  ('e1000000-0000-0000-0000-000000000002', 'NV002', 'Trần Thị Bình', 'Nữ', '1990-08-23', '0901234002', 'binh.tt@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000002', 'Trưởng phòng', '2020-01-15', 'Đang làm việc'),
  ('e1000000-0000-0000-0000-000000000003', 'NV003', 'Lê Văn Cường', 'Nam', '1988-11-05', '0901234003', 'cuong.lv@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000003', 'Trưởng phòng', '2020-01-15', 'Đang làm việc'),
  ('e1000000-0000-0000-0000-000000000004', 'NV004', 'Phạm Thị Dung', 'Nữ', '1992-03-17', '0901234004', 'dung.pt@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000004', 'Trưởng phòng', '2020-03-01', 'Đang làm việc'),
  ('e1000000-0000-0000-0000-000000000005', 'NV005', 'Hoàng Văn Em', 'Nam', '1987-07-30', '0901234005', 'em.hv@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000005', 'Trưởng phòng', '2020-01-15', 'Đang làm việc'),
  ('e1000000-0000-0000-0000-000000000006', 'NV006', 'Vũ Thị Phương', 'Nữ', '1991-12-08', '0901234006', 'phuong.vt@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000006', 'Trưởng phòng', '2020-01-15', 'Đang làm việc'),
  ('e1000000-0000-0000-0000-000000000007', 'NV007', 'Đỗ Minh Tuấn', 'Nam', '1995-02-14', '0901234007', 'tuan.dm@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000001', 'Kỹ sư phần mềm', '2021-06-01', 'Đang làm việc'),
  ('e1000000-0000-0000-0000-000000000008', 'NV008', 'Ngô Thị Hạnh', 'Nữ', '1993-09-25', '0901234008', 'hanh.nt@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000002', 'Nhân viên kinh doanh', '2021-03-15', 'Đang làm việc'),
  ('e1000000-0000-0000-0000-000000000009', 'NV009', 'Bùi Quang Huy', 'Nam', '1996-06-10', '0901234009', 'huy.bq@company.vn', 'Hồ Chí Minh', 'd1000000-0000-0000-0000-000000000001', 'Kỹ sư phần mềm', '2022-01-10', 'Thử việc'),
  ('e1000000-0000-0000-0000-000000000010', 'NV010', 'Trịnh Thị Lan', 'Nữ', '1994-04-18', '0901234010', 'lan.tt@company.vn', 'Đà Nẵng', 'd1000000-0000-0000-0000-000000000003', 'Chuyên viên tuyển dụng', '2021-08-20', 'Nghỉ thai sản'),
  ('e1000000-0000-0000-0000-000000000011', 'NV011', 'Mai Đức Thắng', 'Nam', '1989-01-22', '0901234011', 'thang.md@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000004', 'Chuyên viên Marketing', '2020-06-01', 'Đã nghỉ việc'),
  ('e1000000-0000-0000-0000-000000000012', 'NV012', 'Phan Thị Ngọc', 'Nữ', '1997-10-03', '0901234012', 'ngoc.pt@company.vn', 'Hà Nội', 'd1000000-0000-0000-0000-000000000005', 'Nhân viên kế toán', '2023-02-01', 'Đang làm việc');

-- Hợp đồng
INSERT INTO contracts (id, contract_number, employee_id, type, start_date, end_date, basic_salary, status, sign_date, note) VALUES
  (gen_random_uuid(), 'HD-2020-001', 'e1000000-0000-0000-0000-000000000001', 'Không xác định thời hạn', '2020-01-15', NULL, 35000000, 'Đang hiệu lực', '2020-01-10', ''),
  (gen_random_uuid(), 'HD-2020-002', 'e1000000-0000-0000-0000-000000000002', 'Không xác định thời hạn', '2020-01-15', NULL, 32000000, 'Đang hiệu lực', '2020-01-10', ''),
  (gen_random_uuid(), 'HD-2020-003', 'e1000000-0000-0000-0000-000000000003', 'Xác định thời hạn', '2024-01-15', '2026-01-14', 30000000, 'Hết hạn', '2024-01-10', 'Cần gia hạn'),
  (gen_random_uuid(), 'HD-2021-004', 'e1000000-0000-0000-0000-000000000007', 'Xác định thời hạn', '2023-06-01', '2026-05-31', 22000000, 'Đang hiệu lực', '2023-05-25', ''),
  (gen_random_uuid(), 'HD-2022-005', 'e1000000-0000-0000-0000-000000000009', 'Thử việc', '2026-01-10', '2026-03-10', 12000000, 'Đang hiệu lực', '2026-01-08', 'Thử việc 2 tháng'),
  (gen_random_uuid(), 'HD-2023-006', 'e1000000-0000-0000-0000-000000000012', 'Xác định thời hạn', '2025-02-01', '2027-01-31', 15000000, 'Đang hiệu lực', '2025-01-28', ''),
  (gen_random_uuid(), 'HD-2020-007', 'e1000000-0000-0000-0000-000000000011', 'Xác định thời hạn', '2020-06-01', '2024-05-31', 18000000, 'Đã thanh lý', '2020-05-28', 'Nghỉ việc');

-- Nghỉ phép
INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, total_days, reason, status, remaining_days) VALUES
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', 'Nghỉ phép năm', '2026-04-05', '2026-04-06', 2, 'Việc gia đình', 'Chờ duyệt', 10),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000003', 'Nghỉ ốm', '2026-03-25', '2026-03-26', 2, 'Khám bệnh', 'Đã duyệt', 8),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000008', 'Nghỉ phép năm', '2026-03-20', '2026-03-21', 2, 'Đi du lịch', 'Đã duyệt', 6),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000004', 'Nghỉ việc riêng', '2026-04-10', '2026-04-10', 1, 'Đám cưới người thân', 'Chờ duyệt', 11),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', 'Nghỉ phép năm', '2026-04-15', '2026-04-17', 3, 'Nghỉ ngơi', 'Chờ duyệt', 9),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000007', 'Nghỉ không lương', '2026-03-10', '2026-03-10', 1, 'Việc cá nhân', 'Từ chối', 12);

-- Bảng lương
INSERT INTO payroll_records (id, employee_id, month, year, working_days, actual_days, basic_salary, allowance, overtime, deduction, insurance, tax, net_salary, status) VALUES
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000001', 3, 2026, 22, 22, 35000000, 5000000, 0, 0, 3675000, 3632500, 32692500, 'Đã duyệt'),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000002', 3, 2026, 22, 21, 32000000, 4000000, 0, 1454545, 3360000, 2718545, 28466910, 'Đã duyệt'),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000003', 3, 2026, 22, 20, 30000000, 3000000, 0, 2727273, 3150000, 2212727, 24910000, 'Đã duyệt'),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000007', 3, 2026, 22, 22, 22000000, 2000000, 1500000, 0, 2310000, 1219000, 21971000, 'Đã duyệt'),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000008', 3, 2026, 22, 20, 18000000, 1500000, 0, 1636364, 1890000, 597636, 15376000, 'Nháp'),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000009', 3, 2026, 22, 22, 12000000, 1000000, 500000, 0, 1260000, 0, 12240000, 'Nháp'),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000012', 3, 2026, 22, 22, 15000000, 1000000, 0, 0, 1575000, 225000, 14200000, 'Nháp'),
  (gen_random_uuid(), 'e1000000-0000-0000-0000-000000000005', 3, 2026, 22, 22, 28000000, 3000000, 0, 0, 2940000, 2306000, 25754000, 'Đã chi');

-- Chấm công (tháng 3/2026 - mẫu cho vài nhân viên)
DO $$
DECLARE
  emp_id UUID;
  d INT;
  dow INT;
  statuses TEXT[] := ARRAY['Đi làm', 'Đi làm', 'Đi làm', 'Đi làm', 'Đi làm'];
BEGIN
  FOR emp_id IN
    SELECT id FROM employees WHERE status != 'Đã nghỉ việc' ORDER BY code LIMIT 10
  LOOP
    FOR d IN 1..31 LOOP
      dow := EXTRACT(DOW FROM DATE '2026-03-01' + (d-1) * INTERVAL '1 day');
      IF dow != 0 AND dow != 6 THEN
        INSERT INTO attendance_records (employee_id, date, status)
        VALUES (emp_id, ('2026-03-' || LPAD(d::TEXT, 2, '0'))::DATE, statuses[1 + (d % 5)])
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Tài liệu
INSERT INTO documents (id, code, title, category, department_name, issued_date, effective_date, expiry_date, status, created_by, description, version) VALUES
  (gen_random_uuid(), 'BM-NS-001', 'Đơn xin nghỉ phép', 'Biểu mẫu', 'Phòng Nhân sự', '2024-01-10', '2024-01-15', NULL, 'Hiệu lực', 'Lê Văn Cường', 'Mẫu đơn xin nghỉ phép năm, nghỉ ốm, nghỉ việc riêng dành cho toàn bộ nhân viên', '2.0'),
  (gen_random_uuid(), 'BM-NS-002', 'Phiếu đánh giá nhân viên', 'Biểu mẫu', 'Phòng Nhân sự', '2024-06-01', '2024-07-01', NULL, 'Hiệu lực', 'Lê Văn Cường', 'Biểu mẫu đánh giá hiệu suất nhân viên hàng quý', '1.1'),
  (gen_random_uuid(), 'BM-KT-001', 'Phiếu đề nghị tạm ứng', 'Biểu mẫu', 'Phòng Kế toán', '2024-03-15', '2024-04-01', NULL, 'Hiệu lực', 'Hoàng Văn Em', 'Mẫu đề nghị tạm ứng tiền mặt cho công tác, mua sắm', '1.0'),
  (gen_random_uuid(), 'QD-2026-001', 'Nội quy lao động 2026', 'Quy định', 'Phòng Hành chính', '2026-01-02', '2026-01-15', NULL, 'Hiệu lực', 'Vũ Thị Phương', 'Nội quy lao động, kỷ luật và giờ giấc làm việc năm 2026', '3.0'),
  (gen_random_uuid(), 'QD-2026-002', 'Quy chế lương thưởng 2026', 'Quy định', 'Phòng Nhân sự', '2026-01-10', '2026-02-01', NULL, 'Hiệu lực', 'Lê Văn Cường', 'Quy chế lương thưởng, phúc lợi áp dụng cho năm 2026', '1.0'),
  (gen_random_uuid(), 'HD-MAU-001', 'Mẫu hợp đồng lao động xác định thời hạn', 'Hợp đồng mẫu', 'Phòng Nhân sự', '2024-01-10', '2024-01-15', NULL, 'Hiệu lực', 'Lê Văn Cường', 'Mẫu HĐLĐ xác định thời hạn dùng cho tuyển dụng mới', '2.1'),
  (gen_random_uuid(), 'HD-MAU-002', 'Mẫu hợp đồng thử việc', 'Hợp đồng mẫu', 'Phòng Nhân sự', '2024-01-10', '2024-01-15', NULL, 'Hiệu lực', 'Lê Văn Cường', 'Mẫu hợp đồng thử việc 2 tháng cho nhân viên mới', '1.2');

-- Storage bucket cho file đính kèm
-- Chạy riêng trong Supabase Dashboard > Storage > New Bucket
-- Tên: documents
-- Public: false
