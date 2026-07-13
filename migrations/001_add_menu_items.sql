-- Migration: Add Menu Items feature for room booking
-- Date: 2024
-- Description: Create menu_items and booking_menu_items tables for add-on products

-- 1. Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for menu_items
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_id ON menu_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON menu_items(is_active);

-- 2. Create booking_menu_items junction table (to track which menu items were selected for each booking)
CREATE TABLE IF NOT EXISTS booking_menu_items (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(50) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(booking_id, menu_item_id)
);

-- Create indexes for booking_menu_items
CREATE INDEX IF NOT EXISTS idx_booking_menu_items_booking_id ON booking_menu_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_menu_items_menu_item_id ON booking_menu_items(menu_item_id);

-- 3. Optional: Add menu items summary columns to bookings table (for quick access)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS menu_items_total DECIMAL(10, 2) DEFAULT 0;

-- Verify tables were created
SELECT
  table_name
FROM
  information_schema.tables
WHERE
  table_schema = 'public'
  AND table_name IN ('menu_items', 'booking_menu_items');
