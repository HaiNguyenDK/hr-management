-- =============================================
-- Công nợ - Debt Tracking Schema
-- Chạy file này trong Supabase SQL Editor
-- =============================================

-- 9. Công nợ
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  target TEXT CHECK (target IN ('Nhân viên', 'Đối tác')) NOT NULL,
  counterparty_name TEXT NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  department_name TEXT DEFAULT '',
  type TEXT CHECK (type IN ('Tạm ứng', 'Vay công ty', 'Trừ dần', 'Công nợ mua hàng', 'Công nợ dịch vụ', 'Khác')) NOT NULL,
  description TEXT DEFAULT '',
  total_amount NUMERIC(15,0) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,0) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(15,0) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT CHECK (status IN ('Đang nợ', 'Đã thanh toán', 'Quá hạn', 'Thanh toán một phần')) DEFAULT 'Đang nợ',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Lịch sử thanh toán công nợ
CREATE TABLE debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,0) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View: debts kèm thông tin nhân viên
CREATE OR REPLACE VIEW debts_view AS
SELECT
  d.*,
  e.full_name AS employee_full_name,
  e.code AS employee_code,
  dep.name AS dept_name
FROM debts d
LEFT JOIN employees e ON d.employee_id = e.id
LEFT JOIN departments dep ON e.department_id = dep.id;

-- RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all debts" ON debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all debt_payments" ON debt_payments FOR ALL USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO debts (code, target, counterparty_name, employee_id, department_name, type, description, total_amount, paid_amount, issue_date, due_date, status, note) VALUES
  ('CN-001', 'Nhân viên', 'Nguyễn Văn A', NULL, 'Phòng Kỹ thuật', 'Tạm ứng', 'Tạm ứng lương tháng 3', 5000000, 2000000, '2026-03-01', '2026-04-01', 'Thanh toán một phần', 'Trừ dần qua lương'),
  ('CN-002', 'Đối tác', 'Công ty TNHH ABC', NULL, '', 'Công nợ mua hàng', 'Mua văn phòng phẩm Q1/2026', 12000000, 0, '2026-01-15', '2026-04-15', 'Đang nợ', ''),
  ('CN-003', 'Nhân viên', 'Trần Thị B', NULL, 'Phòng HCNS', 'Vay công ty', 'Vay mua xe', 20000000, 5000000, '2025-12-01', '2026-12-01', 'Thanh toán một phần', 'Trừ 2tr/tháng'),
  ('CN-004', 'Đối tác', 'Công ty Dịch vụ XYZ', NULL, '', 'Công nợ dịch vụ', 'Dịch vụ bảo trì PCCC', 8000000, 8000000, '2026-02-01', '2026-03-01', 'Đã thanh toán', ''),
  ('CN-005', 'Đối tác', 'Nhà cung cấp DEF', NULL, '', 'Công nợ mua hàng', 'Mua thiết bị văn phòng', 35000000, 0, '2026-01-10', '2026-03-10', 'Quá hạn', 'Cần liên hệ thanh toán');
