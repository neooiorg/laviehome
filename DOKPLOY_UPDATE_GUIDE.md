# Hướng dẫn Update Database trên Dokploy

## Option 1: Sử dụng Dokploy Web UI (Dễ nhất)

### Bước 1: Truy cập Dokploy
1. Đăng nhập vào Dokploy dashboard
2. Tìm đến PostgreSQL/Database section

### Bước 2: Mở Database Manager
1. Chọn database `lavie_home` (hoặc tên database của bạn)
2. Tìm "SQL Console" hoặc "Query Tool"

### Bước 3: Chạy SQL Script
1. Copy toàn bộ nội dung từ file `migrations/001_add_menu_items.sql`
2. Dán vào SQL Console
3. Chạy (Execute)

---

## Option 2: Sử dụng PostgreSQL CLI

### Bước 1: Lấy Database Connection String
```bash
# Từ Dokploy, lấy connection string, thường có dạng:
postgresql://username:password@host:port/database
```

### Bước 2: Kết nối và chạy migration
```bash
# Cách 1: Chạy script trực tiếp
psql "postgresql://username:password@host:port/database" < migrations/001_add_menu_items.sql

# Cách 2: Kết nối interactive
psql "postgresql://username:password@host:port/database"

# Sau đó copy-paste nội dung file SQL
```

---

## Option 3: Sử dụng DBeaver/pgAdmin từ Dokploy

### Nếu Dokploy hỗ trợ pgAdmin:
1. Truy cập pgAdmin Dashboard (thường port 5050)
2. Connect đến database
3. Chuột phải database → Query Tool
4. Copy-paste SQL script
5. Execute

---

## SQL Script để chạy

**File:** `migrations/001_add_menu_items.sql`

Nội dung:
- ✅ Tạo bảng `menu_items`
- ✅ Tạo bảng `booking_menu_items`
- ✅ Tạo indexes
- ✅ Thêm cột `menu_items_total` vào `bookings`

---

## Kiểm tra sau khi update

Chạy query này để xác nhận tables đã được tạo:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('menu_items', 'booking_menu_items', 'bookings');
```

**Kết quả mong đợi:**
```
menu_items
booking_menu_items
bookings
```

---

## Data Sample (Tùy chọn)

Sau khi tạo tables, bạn có thể thêm menu items mẫu:

```sql
-- Lấy branch_id từ branches table trước
SELECT id, name FROM branches LIMIT 1;

-- Thêm menu items (thay YOUR_BRANCH_ID)
INSERT INTO menu_items (branch_id, name, description, price, is_active)
VALUES 
  (YOUR_BRANCH_ID, 'Oleo Gel bôi trơn', 'Gel bôi trơn cao cấp', 79000, TRUE),
  (YOUR_BRANCH_ID, 'Durex (Hộp 3 cái)', 'Bao cao su Durex', 55000, TRUE),
  (YOUR_BRANCH_ID, 'Durex Invisible 2 cái', 'Bao cao su Invisible', 45000, TRUE),
  (YOUR_BRANCH_ID, 'Champagne', 'Rượu vang nổ', 250000, TRUE);
```

---

## Troubleshooting

### Lỗi: "table does not exist"
→ Kiểm tra connection string, chắc chắn kết nối đúng database

### Lỗi: "role does not have permission"
→ Cần user có quyền CREATE TABLE, liên hệ admin Dokploy

### Lỗi: "foreign key violation"
→ Kiểm tra `branches` table có tồn tại, run migration sau khi branches được tạo

---

## Cần giúp?

Nếu bạn cần:
1. **Database credentials** - Lấy từ Dokploy environment variables
2. **SSH access** - Hỏi admin Dokploy
3. **Script tùy chỉnh** - Cung cấp cho tôi DATABASE_URL

Cung cấp cho tôi **DATABASE_URL** hoặc **connection details** để tôi có thể giúp bạn chạy trực tiếp! 🚀
