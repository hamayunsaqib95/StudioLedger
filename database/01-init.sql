CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    department VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    profit_share_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    profit_share_status VARCHAR(30) NOT NULL DEFAULT 'Active',
    effective_from DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    po_id INT NOT NULL REFERENCES product_owners(id),
    name VARCHAR(150) NOT NULL,
    platform VARCHAR(30) NOT NULL,
    genre VARCHAR(100),
    status VARCHAR(30) NOT NULL,
    launch_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    monthly_salary_pkr NUMERIC(14,2) NOT NULL DEFAULT 0,
    employment_type VARCHAR(30) NOT NULL,
    assigned_po INT REFERENCES product_owners(id),
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_game_allocations (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    employee_id INT NOT NULL REFERENCES employees(id),
    po_id INT NOT NULL REFERENCES product_owners(id),
    game_id INT REFERENCES games(id),
    allocation_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    allocation_type VARCHAR(30) NOT NULL DEFAULT 'Direct Game',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_costs (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    po_id INT NOT NULL REFERENCES product_owners(id),
    tool_name VARCHAR(150) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    billing_type VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS office_expenses (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    po_id INT NOT NULL REFERENCES product_owners(id),
    expense_type VARCHAR(150) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ua_spends (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    game_id INT NOT NULL REFERENCES games(id),
    channel VARCHAR(100),
    campaign_name VARCHAR(150),
    amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revenues (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    game_id INT NOT NULL REFERENCES games(id),
    platform VARCHAR(30) NOT NULL,
    ad_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    iap_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    subscription_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(month_key, game_id)
);

CREATE TABLE IF NOT EXISTS exchange_rates (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL UNIQUE,
    usd_to_pkr NUMERIC(14,4) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_locks (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL UNIQUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by VARCHAR(100),
    locked_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_transfers (
    id SERIAL PRIMARY KEY,
    game_id INT NOT NULL REFERENCES games(id),
    from_po INT NOT NULL REFERENCES product_owners(id),
    to_po INT NOT NULL REFERENCES product_owners(id),
    effective_month VARCHAR(7) NOT NULL,
    transfer_reason TEXT,
    approved_by VARCHAR(100),
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_transfers (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id),
    from_po INT NOT NULL REFERENCES product_owners(id),
    to_po INT NOT NULL REFERENCES product_owners(id),
    effective_month VARCHAR(7) NOT NULL,
    transfer_reason TEXT,
    approved_by VARCHAR(100),
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    action_detail TEXT NOT NULL,
    actor VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name) VALUES
('COO'),
('Team Lead'),
('Admin'),
('HR'),
('PO')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (full_name, email, password_hash, role_id, status, created_by)
SELECT 'Zeeshan', 'coo@studio.com', '$2a$10$7aJwYHj5VQ0mW0W4Q6nP6OkXv8m5S8l0eJx5P0yR0X8m7L2k1YxkK', r.id, 'Active', 'System'
FROM roles r WHERE r.name = 'COO'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, password_hash, role_id, status, created_by)
SELECT 'Hamza', 'lead@studio.com', '$2a$10$7aJwYHj5VQ0mW0W4Q6nP6OkXv8m5S8l0eJx5P0yR0X8m7L2k1YxkK', r.id, 'Active', 'COO'
FROM roles r WHERE r.name = 'Team Lead'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, password_hash, role_id, status, created_by)
SELECT 'Raza', 'admin@studio.com', '$2a$10$7aJwYHj5VQ0mW0W4Q6nP6OkXv8m5S8l0eJx5P0yR0X8m7L2k1YxkK', r.id, 'Active', 'COO'
FROM roles r WHERE r.name = 'Admin'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, password_hash, role_id, status, created_by)
SELECT 'Nadia', 'hr@studio.com', '$2a$10$7aJwYHj5VQ0mW0W4Q6nP6OkXv8m5S8l0eJx5P0yR0X8m7L2k1YxkK', r.id, 'Active', 'Team Lead'
FROM roles r WHERE r.name = 'HR'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, password_hash, role_id, status, created_by)
SELECT 'Ali Khan', 'ali@studio.com', '$2a$10$7aJwYHj5VQ0mW0W4Q6nP6OkXv8m5S8l0eJx5P0yR0X8m7L2k1YxkK', r.id, 'Active', 'COO'
FROM roles r WHERE r.name = 'PO'
ON CONFLICT (email) DO NOTHING;

INSERT INTO product_owners (name, email, department, status, profit_share_percent, profit_share_status, effective_from)
VALUES
('Ali Khan', 'ali@studio.com', 'Casual Games', 'Active', 6.00, 'Active', '2026-01-01'),
('Sara Ahmed', 'sara@studio.com', 'Action Games', 'Active', 5.00, 'Active', '2026-01-01')
ON CONFLICT DO NOTHING;

INSERT INTO games (po_id, name, platform, genre, status, launch_date)
VALUES
(1, 'Body Cam Ops', 'Both', 'Shooter', 'Live', '2025-06-01'),
(1, 'Fast Food Sim', 'Android', 'Simulator', 'Soft Launch', '2026-01-15'),
(2, 'Demolition Story', 'Both', 'Simulator', 'In Development', '2026-05-01')
ON CONFLICT DO NOTHING;

INSERT INTO employees (full_name, role, monthly_salary_pkr, employment_type, assigned_po, status)
VALUES
('Ahsan', 'Dev', 250000, 'Full-time', 1, 'Active'),
('Hira', 'Art', 180000, 'Full-time', 1, 'Active'),
('Bilal', 'QA', 120000, 'Full-time', 1, 'Active'),
('Usman', 'Dev', 230000, 'Full-time', 2, 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO employee_game_allocations (month_key, employee_id, po_id, game_id, allocation_percent, allocation_type)
VALUES
('2026-03', 1, 1, 1, 70, 'Direct Game'),
('2026-03', 1, 1, 2, 30, 'Direct Game'),
('2026-03', 2, 1, 1, 50, 'Direct Game'),
('2026-03', 2, 1, 2, 30, 'Direct Game'),
('2026-03', 2, 1, NULL, 20, 'PO Shared'),
('2026-03', 3, 1, 1, 100, 'Direct Game'),
('2026-03', 4, 2, 3, 100, 'Direct Game')
ON CONFLICT DO NOTHING;

INSERT INTO tool_costs (month_key, po_id, tool_name, amount, currency, billing_type, notes)
VALUES
('2026-03', 1, 'Sensor Tower', 299, 'USD', 'Flat', 'Market intelligence'),
('2026-03', 1, 'MMP', 450, 'USD', 'Flat', 'Attribution'),
('2026-03', 2, 'Firebase Pro', 200, 'USD', 'Flat', 'Analytics')
ON CONFLICT DO NOTHING;

INSERT INTO office_expenses (month_key, po_id, expense_type, amount, currency, notes)
VALUES
('2026-03', 1, 'Rent Share', 240000, 'PKR', 'Studio rent'),
('2026-03', 1, 'Internet & Utilities', 60000, 'PKR', 'Monthly office cost'),
('2026-03', 2, 'Rent Share', 160000, 'PKR', 'Studio rent')
ON CONFLICT DO NOTHING;

INSERT INTO ua_spends (month_key, game_id, channel, campaign_name, amount, currency, notes)
VALUES
('2026-03', 1, 'Meta', 'Body Cam Scale', 2000, 'USD', 'Main scale campaign'),
('2026-03', 2, 'Google Ads', 'Fast Food Test', 500, 'USD', 'Testing creatives')
ON CONFLICT DO NOTHING;

INSERT INTO revenues (month_key, game_id, platform, ad_revenue, iap_revenue, subscription_revenue, other_revenue, currency)
VALUES
('2026-03', 1, 'Both', 4200, 1800, 0, 0, 'USD'),
('2026-03', 2, 'Android', 600, 90, 0, 0, 'USD'),
('2026-03', 3, 'Both', 0, 0, 0, 0, 'USD')
ON CONFLICT (month_key, game_id) DO NOTHING;

INSERT INTO exchange_rates (month_key, usd_to_pkr)
VALUES
('2026-02', 278),
('2026-03', 280)
ON CONFLICT (month_key) DO NOTHING;

INSERT INTO monthly_locks (month_key, is_locked, locked_by, locked_at)
VALUES
('2026-02', TRUE, 'COO', NOW()),
('2026-03', FALSE, NULL, NULL)
ON CONFLICT (month_key) DO NOTHING;

INSERT INTO game_transfers (game_id, from_po, to_po, effective_month, transfer_reason, approved_by, created_by)
VALUES
(3, 1, 2, '2026-03', 'Portfolio balancing', 'COO', 'Team Lead')
ON CONFLICT DO NOTHING;

INSERT INTO employee_transfers (employee_id, from_po, to_po, effective_month, transfer_reason, approved_by, created_by)
VALUES
(4, 1, 2, '2026-03', 'Dedicated simulator support', 'COO', 'Admin')
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (action_type, action_detail, actor)
VALUES
('User Created', 'HR user Nadia was created', 'Team Lead'),
('Game Transfer', 'Demolition Story transferred to Sara Ahmed', 'COO')
ON CONFLICT DO NOTHING;