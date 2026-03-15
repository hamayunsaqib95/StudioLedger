BEGIN;

-- =========================================================
-- 1. Extend roles
-- =========================================================
INSERT INTO roles (name) VALUES
('CEO'),
('COO'),
('Team Lead'),
('PO'),
('Admin'),
('HR')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- 2. Employee roles master table
-- =========================================================
CREATE TABLE IF NOT EXISTS employee_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    level_rank INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO employee_roles (role_name, department, level_rank, status) VALUES
('Dev', 'Engineering', 1, 'Active'),
('Senior Dev', 'Engineering', 2, 'Active'),
('Technical Lead', 'Engineering', 3, 'Active'),
('3D Artist', 'Art', 1, 'Active'),
('Senior 3D Artist', 'Art', 2, 'Active'),
('Lead 3D Artist', 'Art', 3, 'Active'),
('Video Artist', 'Art', 2, 'Active'),
('Senior Artist', 'Art', 2, 'Active'),
('UI', 'Design', 1, 'Active'),
('Senior UI', 'Design', 2, 'Active'),
('QA', 'QA', 1, 'Active'),
('Game Designer', 'Production', 1, 'Active'),
('Marketing', 'Marketing', 1, 'Active'),
('Senior Marketing', 'Marketing', 2, 'Active'),
('Product Owner', 'Production', 3, 'Active')
ON CONFLICT (role_name) DO NOTHING;

-- =========================================================
-- 3. Extend employees table
-- =========================================================
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS email VARCHAR(150),
ADD COLUMN IF NOT EXISTS role_id INT REFERENCES employee_roles(id),
ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(14,2),
ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'PKR',
ADD COLUMN IF NOT EXISTS assigned_po_id INT REFERENCES product_owners(id),
ADD COLUMN IF NOT EXISTS is_shared_resource BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sharing_scope VARCHAR(30) DEFAULT 'DirectGame',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Map old salary/po if present
UPDATE employees
SET monthly_salary = monthly_salary_pkr
WHERE monthly_salary IS NULL AND monthly_salary_pkr IS NOT NULL;

UPDATE employees
SET assigned_po_id = assigned_po
WHERE assigned_po_id IS NULL AND assigned_po IS NOT NULL;

-- =========================================================
-- 4. Employee role history
-- =========================================================
CREATE TABLE IF NOT EXISTS employee_role_history (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id),
    old_role_id INT REFERENCES employee_roles(id),
    new_role_id INT REFERENCES employee_roles(id),
    changed_by_user_id INT REFERENCES users(id),
    effective_from DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 5. Team lead profiles
-- =========================================================
CREATE TABLE IF NOT EXISTS team_lead_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    employee_id INT REFERENCES employees(id),
    full_name VARCHAR(150) NOT NULL,
    profit_share_pool_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 6. Team lead to PO assignments
-- =========================================================
CREATE TABLE IF NOT EXISTS team_lead_po_assignments (
    id SERIAL PRIMARY KEY,
    team_lead_profile_id INT NOT NULL REFERENCES team_lead_profiles(id),
    po_id INT NOT NULL REFERENCES product_owners(id),
    effective_from DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 7. Extend product owners
-- =========================================================
ALTER TABLE product_owners
ADD COLUMN IF NOT EXISTS employee_id INT REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS team_lead_profile_id INT REFERENCES team_lead_profiles(id),
ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'PKR',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE product_owners
SET full_name = name
WHERE full_name IS NULL AND name IS NOT NULL;

-- =========================================================
-- 8. New allocation table for V2
-- =========================================================
CREATE TABLE IF NOT EXISTS employee_allocations (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    employee_id INT NOT NULL REFERENCES employees(id),
    allocation_scope VARCHAR(30) NOT NULL,
    po_id INT REFERENCES product_owners(id),
    game_id INT REFERENCES games(id),
    allocation_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optional one-time migration from old allocation table
INSERT INTO employee_allocations (
    month_key, employee_id, allocation_scope, po_id, game_id, allocation_percent, notes
)
SELECT
    month_key,
    employee_id,
    CASE
        WHEN allocation_type = 'PO Shared' THEN 'POShared'
        ELSE 'DirectGame'
    END,
    po_id,
    game_id,
    allocation_percent,
    allocation_type
FROM employee_game_allocations
WHERE NOT EXISTS (
    SELECT 1
    FROM employee_allocations ea
    WHERE ea.month_key = employee_game_allocations.month_key
      AND ea.employee_id = employee_game_allocations.employee_id
      AND COALESCE(ea.game_id, -1) = COALESCE(employee_game_allocations.game_id, -1)
      AND COALESCE(ea.po_id, -1) = COALESCE(employee_game_allocations.po_id, -1)
);

-- =========================================================
-- 9. Extend finance cost tables
-- =========================================================
ALTER TABLE tool_costs
ADD COLUMN IF NOT EXISTS scope_type VARCHAR(30) DEFAULT 'SinglePO';

ALTER TABLE office_expenses
ADD COLUMN IF NOT EXISTS scope_type VARCHAR(30) DEFAULT 'SinglePO';

-- =========================================================
-- 10. Snapshot tables
-- =========================================================
CREATE TABLE IF NOT EXISTS game_financial_snapshots (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    game_id INT NOT NULL REFERENCES games(id),
    dev_count INT NOT NULL DEFAULT 0,
    artist_count INT NOT NULL DEFAULT 0,
    qa_count INT NOT NULL DEFAULT 0,
    marketing_count INT NOT NULL DEFAULT 0,
    total_team_members INT NOT NULL DEFAULT 0,
    direct_team_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    po_shared_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    studio_shared_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    tool_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    office_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    ua_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    po_salary_share NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    ad_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    iap_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    subscription_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    profit NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(month_key, game_id)
);

CREATE TABLE IF NOT EXISTS po_financial_snapshots (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    po_id INT NOT NULL REFERENCES product_owners(id),
    game_count INT NOT NULL DEFAULT 0,
    po_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
    team_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    shared_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    tool_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    office_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    ua_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    profit_before_incentive NUMERIC(14,2) NOT NULL DEFAULT 0,
    profit_share_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    profit_share_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    final_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(month_key, po_id)
);

CREATE TABLE IF NOT EXISTS team_lead_profit_pool_snapshots (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    team_lead_profile_id INT NOT NULL REFERENCES team_lead_profiles(id),
    pool_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    assigned_po_percent_total NUMERIC(5,2) NOT NULL DEFAULT 0,
    remaining_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(month_key, team_lead_profile_id)
);

-- =========================================================
-- 11. Approval logs
-- =========================================================
CREATE TABLE IF NOT EXISTS approval_logs (
    id SERIAL PRIMARY KEY,
    approval_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    requested_by_user_id INT REFERENCES users(id),
    approved_by_user_id INT REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP
);

-- =========================================================
-- 12. Useful indexes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_assigned_po_id ON employees(assigned_po_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

CREATE INDEX IF NOT EXISTS idx_product_owners_team_lead_profile_id ON product_owners(team_lead_profile_id);
CREATE INDEX IF NOT EXISTS idx_games_po_id ON games(po_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

CREATE INDEX IF NOT EXISTS idx_employee_allocations_month_key ON employee_allocations(month_key);
CREATE INDEX IF NOT EXISTS idx_employee_allocations_employee_id ON employee_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_allocations_po_id ON employee_allocations(po_id);
CREATE INDEX IF NOT EXISTS idx_employee_allocations_game_id ON employee_allocations(game_id);

CREATE INDEX IF NOT EXISTS idx_tool_costs_month_key ON tool_costs(month_key);
CREATE INDEX IF NOT EXISTS idx_tool_costs_po_id ON tool_costs(po_id);

CREATE INDEX IF NOT EXISTS idx_office_expenses_month_key ON office_expenses(month_key);
CREATE INDEX IF NOT EXISTS idx_office_expenses_po_id ON office_expenses(po_id);

CREATE INDEX IF NOT EXISTS idx_ua_spends_month_key ON ua_spends(month_key);
CREATE INDEX IF NOT EXISTS idx_ua_spends_game_id ON ua_spends(game_id);

CREATE INDEX IF NOT EXISTS idx_revenues_month_key ON revenues(month_key);
CREATE INDEX IF NOT EXISTS idx_revenues_game_id ON revenues(game_id);

COMMIT;