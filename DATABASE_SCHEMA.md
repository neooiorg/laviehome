# Database Schema - Menu Items Feature

## Tables to Create

### 1. `menu_items` Table
Store menu items/add-ons that customers can select when booking.

```sql
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_branch_id ON menu_items(branch_id);
CREATE INDEX idx_menu_items_is_active ON menu_items(is_active);
```

### 2. `booking_menu_items` Junction Table (Optional)
Link bookings to their selected menu items. Use if you need to query booking history.

```sql
CREATE TABLE IF NOT EXISTS booking_menu_items (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(50) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(booking_id, menu_item_id)
);

CREATE INDEX idx_booking_menu_items_booking_id ON booking_menu_items(booking_id);
CREATE INDEX idx_booking_menu_items_menu_item_id ON booking_menu_items(menu_item_id);
```

### 3. Alternative: Add JSON Column to `bookings` Table
If you prefer to store menu items as JSON (simpler approach):

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS menu_item_ids INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS menu_items_total DECIMAL(10, 2) DEFAULT 0;
```

## Migration Steps

1. **Option A (Using junction table):**
   - Create `menu_items` table
   - Create `booking_menu_items` junction table
   - Update `createBookingAdmin` to insert into junction table

2. **Option B (Using JSON array):**
   - Add columns to `bookings` table
   - Update `createBookingAdmin` to store menu item IDs and calculate total

## Current Implementation Status

✅ **Completed:**
- Menu items CRUD actions (`src/lib/menu-actions.ts`)
- Admin pages for managing menu items
- Menu items selector component for admin
- Menu options component for customer interface
- Sidebar navigation updated

⏳ **Pending:**
- Database schema creation (choose Option A or B above)
- Update `createBookingAdmin` to save menu items to database
- Update booking detail display to show selected menu items
- Update customer checkout flow to pass menu items

## Notes

- Menu items are branch-specific (each branch can have different menu)
- Only active menu items are shown to customers
- Admin can toggle menu item status without deleting
- Prices are stored separately for audit trail
