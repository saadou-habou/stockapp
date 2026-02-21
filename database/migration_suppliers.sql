-- ============================================================
-- Migration : Table des fournisseurs
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_name ON suppliers(name);

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO suppliers (name, contact, phone, email) VALUES
    ('Fournisseur Général SA', 'Moussa Diallo', '+227 90 00 00 01', 'contact@fournisseur-general.ne'),
    ('Import Export Niger', 'Amadou Maiga', '+227 90 00 00 02', 'info@ie-niger.ne'),
    ('Grossiste du Sahel', 'Fatima Ouedraogo', '+227 90 00 00 03', 'grossiste@sahel.ne')
ON CONFLICT (name) DO NOTHING;
