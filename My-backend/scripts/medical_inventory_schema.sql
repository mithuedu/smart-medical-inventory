-- Medical Inventory Database Schema

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
                                          id SERIAL PRIMARY KEY,
                                          name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category_type VARCHAR(50) DEFAULT 'general' CHECK (category_type IN ('medicine', 'supply', 'equipment', 'general')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
                                         id SERIAL PRIMARY KEY,
                                         name VARCHAR(150) NOT NULL,
    company_type VARCHAR(50) DEFAULT 'manufacturer',
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'India',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- 3. Medical Items Table
CREATE TABLE IF NOT EXISTS medical_items (
                                             id SERIAL PRIMARY KEY,
                                             name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    brand_name VARCHAR(200),
    description TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(20) DEFAULT 'pieces',
    minimum_stock_level INTEGER DEFAULT 10,
    maximum_stock_level INTEGER DEFAULT 1000,
    requires_prescription BOOLEAN DEFAULT false,
    expiry_tracking BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- 4. Inventory Stock Table
CREATE TABLE IF NOT EXISTS inventory_stock (
                                               id SERIAL PRIMARY KEY,
                                               item_id INTEGER REFERENCES medical_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(50) NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    manufacturing_date DATE,
    expiry_date DATE,
    purchase_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, batch_number)
    );

-- 5. Stock Movements Table
CREATE TABLE IF NOT EXISTS stock_movements (
                                               id SERIAL PRIMARY KEY,
                                               item_id INTEGER REFERENCES medical_items(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES inventory_stock(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'EXPIRED', 'DAMAGED')),
    quantity INTEGER NOT NULL,
    quantity_before INTEGER,
    quantity_after INTEGER,
    reference_number VARCHAR(100),
    reason VARCHAR(200),
    user_id INTEGER DEFAULT 1,
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- 6. Inventory Alerts Table
CREATE TABLE IF NOT EXISTS inventory_alerts (
                                                id SERIAL PRIMARY KEY,
                                                item_id INTEGER REFERENCES medical_items(id) ON DELETE CASCADE,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY_WARNING', 'EXPIRED')),
    message TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    current_stock INTEGER,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_medical_items_sku ON medical_items(sku);
CREATE INDEX IF NOT EXISTS idx_medical_items_category ON medical_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_item ON inventory_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_expiry ON inventory_stock(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);

-- Insert Sample Data (only if tables are empty)
INSERT INTO categories (name, description, category_type)
SELECT 'Antibiotics', 'Antibiotic medications', 'medicine'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Antibiotics');

INSERT INTO categories (name, description, category_type)
SELECT 'Pain Relief', 'Pain management medications', 'medicine'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pain Relief');

INSERT INTO categories (name, description, category_type)
SELECT 'Medical Supplies', 'General medical supplies', 'supply'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Medical Supplies');

INSERT INTO categories (name, description, category_type)
SELECT 'Emergency Medicine', 'Emergency medications', 'medicine'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Emergency Medicine');

INSERT INTO categories (name, description, category_type)
SELECT 'Surgical Equipment', 'Surgical tools', 'equipment'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Surgical Equipment');

INSERT INTO suppliers (name, contact_person, phone, email, city, state, country)
SELECT 'Cipla Limited', 'Rajesh Kumar', '+91-9876543210', 'rajesh@cipla.com', 'Mumbai', 'Maharashtra', 'India'
    WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Cipla Limited');

INSERT INTO suppliers (name, contact_person, phone, email, city, state, country)
SELECT 'Sun Pharmaceutical', 'Priya Sharma', '+91-9876543211', 'priya@sunpharma.com', 'Mumbai', 'Maharashtra', 'India'
    WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Sun Pharmaceutical');

INSERT INTO suppliers (name, contact_person, phone, email, city, state, country)
SELECT 'MedSupply India', 'Suresh Reddy', '+91-9876543214', 'suresh@medsupply.in', 'Chennai', 'Tamil Nadu', 'India'
    WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'MedSupply India');

INSERT INTO medical_items (name, sku, category_id, supplier_id, unit_price, minimum_stock_level, requires_prescription)
SELECT 'Paracetamol 500mg Tablets', 'PARA500', 2, 1, 0.50, 500, false
    WHERE NOT EXISTS (SELECT 1 FROM medical_items WHERE sku = 'PARA500');

INSERT INTO medical_items (name, sku, category_id, supplier_id, unit_price, minimum_stock_level, requires_prescription)
SELECT 'Amoxicillin 250mg Capsules', 'AMOX250', 1, 1, 2.50, 100, true
    WHERE NOT EXISTS (SELECT 1 FROM medical_items WHERE sku = 'AMOX250');

INSERT INTO medical_items (name, sku, category_id, supplier_id, unit_price, minimum_stock_level, requires_prescription)
SELECT 'Disposable Syringes 5ml', 'SYR5ML', 3, 3, 2.50, 1000, false
    WHERE NOT EXISTS (SELECT 1 FROM medical_items WHERE sku = 'SYR5ML');

INSERT INTO medical_items (name, sku, category_id, supplier_id, unit_price, minimum_stock_level, requires_prescription)
SELECT 'Ibuprofen 400mg Tablets', 'IBU400', 2, 2, 1.20, 300, false
    WHERE NOT EXISTS (SELECT 1 FROM medical_items WHERE sku = 'IBU400');

INSERT INTO medical_items (name, sku, category_id, supplier_id, unit_price, minimum_stock_level, requires_prescription)
SELECT 'Medical Gloves (Latex)', 'GLOVE-LAT', 3, 3, 1.20, 2000, false
    WHERE NOT EXISTS (SELECT 1 FROM medical_items WHERE sku = 'GLOVE-LAT');

INSERT INTO inventory_stock (item_id, batch_number, quantity_available, expiry_date, purchase_price, selling_price, location)
SELECT 1, 'PARA2024001', 800, '2026-12-31', 0.45, 0.50, 'Pharmacy-A1'
    WHERE NOT EXISTS (SELECT 1 FROM inventory_stock WHERE item_id = 1 AND batch_number = 'PARA2024001');

INSERT INTO inventory_stock (item_id, batch_number, quantity_available, expiry_date, purchase_price, selling_price, location)
SELECT 2, 'AMOX2024001', 150, '2025-11-30', 2.25, 2.50, 'Pharmacy-A2'
    WHERE NOT EXISTS (SELECT 1 FROM inventory_stock WHERE item_id = 2 AND batch_number = 'AMOX2024001');

INSERT INTO inventory_stock (item_id, batch_number, quantity_available, expiry_date, purchase_price, selling_price, location)
SELECT 3, 'SYR2024001', 2500, '2027-06-30', 2.25, 2.50, 'Supply-Room-A'
    WHERE NOT EXISTS (SELECT 1 FROM inventory_stock WHERE item_id = 3 AND batch_number = 'SYR2024001');

INSERT INTO inventory_stock (item_id, batch_number, quantity_available, expiry_date, purchase_price, selling_price, location)
SELECT 4, 'IBU2024001', 500, '2025-10-31', 1.10, 1.20, 'Pharmacy-B1'
    WHERE NOT EXISTS (SELECT 1 FROM inventory_stock WHERE item_id = 4 AND batch_number = 'IBU2024001');

INSERT INTO inventory_stock (item_id, batch_number, quantity_available, expiry_date, purchase_price, selling_price, location)
SELECT 5, 'GLOVE2024001', 5000, '2027-03-31', 1.10, 1.20, 'Supply-Room-B'
    WHERE NOT EXISTS (SELECT 1 FROM inventory_stock WHERE item_id = 5 AND batch_number = 'GLOVE2024001');