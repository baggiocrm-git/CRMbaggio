-- Create tables for BuildFlow CRM

-- 1. Contacts (Clients, Suppliers, Partners)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Client', 'Supplier', 'Partner')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Inactive')),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'Delayed', 'Completed')),
  budget NUMERIC(15, 2) NOT NULL,
  spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(15, 2) GENERATED ALWAYS AS (budget - spent) STORED,
  liquidity INTEGER NOT NULL DEFAULT 0 CHECK (liquidity >= 0 AND liquidity <= 100),
  location TEXT NOT NULL,
  phase TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Staff
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emp_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Inactive')),
  img_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  color_class TEXT NOT NULL,
  bg_class TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Finances (Transactions)
CREATE TABLE IF NOT EXISTS finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Critical', 'Scheduled', 'Completed', 'Paid')),
  amount NUMERIC(15, 2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  icon_name TEXT NOT NULL,
  color_class TEXT NOT NULL,
  bg_class TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sample Data

-- Contacts
INSERT INTO contacts (company, contact_person, category, status, email, phone, initials, color)
VALUES 
('Acme Construction', 'Commercial Infrastructure', 'Client', 'Active', 'contact@acme.com', '+1 555-0101', 'AC', 'bg-blue-100 text-blue-600'),
('BuildRight Supplies', 'Raw Materials & Concrete', 'Supplier', 'Pending', 'sales@buildright.com', '+1 555-0202', 'BS', 'bg-amber-100 text-amber-600'),
('Steel & Iron Co.', 'Structural Components', 'Supplier', 'Active', 'info@steeliron.com', '+1 555-0303', 'SI', 'bg-slate-100 text-slate-600'),
('Design Partners LLC', 'Architectural Services', 'Partner', 'Inactive', 'hello@designparts.com', '+1 555-0404', 'DP', 'bg-purple-100 text-purple-600');

-- Projects
INSERT INTO projects (name, contract_id, status, budget, spent, liquidity, location, phase)
VALUES 
('Skyline Office Tower', '#299-A', 'In Progress', 2450000, 1840000, 85, 'Downtown District', 'Structural Phase'),
('Riverfront Bridge Expansion', '#102', 'Delayed', 850000, 820000, 12, 'East River Crossing', 'Foundation Phase'),
('Metro Station Upgrade', '#405', 'Planning', 1200000, 0, 100, 'Central Station', 'Design Phase');

-- Staff
INSERT INTO staff (name, emp_id, role, department, status, img_url)
VALUES 
('Robert Jackson', 'E294', 'Sr. Civil Engineer', 'Structural Division', 'Active', 'https://picsum.photos/seed/staff1/100/100'),
('Sarah Jenkins', 'E302', 'Safety Inspector', 'Compliance', 'Active', 'https://picsum.photos/seed/staff2/100/100'),
('Michael Vance', 'E112', 'Project Coordinator', 'Logistics', 'On Leave', 'https://picsum.photos/seed/staff3/100/100');

-- Documents
INSERT INTO documents (name, file_type, file_size, icon_name, color_class, bg_class)
VALUES 
('Project Alpha Master Contract', 'PDF', '4.2 MB', 'FileText', 'text-blue-500', 'bg-blue-500/10'),
('Environmental Permit 2024', 'DOCX', '1.8 MB', 'ShieldCheck', 'text-emerald-500', 'bg-emerald-500/10'),
('OSHA Safety Certifications', 'ZIP', '22 MB', 'HardHat', 'text-red-500', 'bg-red-500/10');

-- Finances
INSERT INTO finances (title, status, amount, due_date, icon_name, color_class, bg_class)
VALUES 
('Concrete Supply - #204', 'Pending', 8450.00, now() + interval '2 days', 'FileText', 'text-blue-500', 'bg-blue-500/10'),
('Staff Payroll - June', 'Critical', 12200.00, now() - interval '1 day', 'AlertCircle', 'text-rose-500', 'bg-rose-500/10'),
('Site Equipment Rental', 'Scheduled', 3150.00, now() + interval '15 days', 'TrendingDown', 'text-blue-500', 'bg-blue-500/10'),
('Permit Fees - Phase 1', 'Completed', 1200.00, now() - interval '1 day', 'CheckCircle2', 'text-emerald-500', 'bg-emerald-500/10');
