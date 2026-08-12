-- Advanced Admin booking ranges and editable room availability windows.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS room_availability_slots (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  price BIGINT NOT NULL DEFAULT 0,
  customer_visible BOOLEAN NOT NULL DEFAULT TRUE,
  source_booking_id VARCHAR(50),
  label VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_at > start_at),
  CHECK (status IN ('available', 'blocked', 'custom'))
);

CREATE INDEX IF NOT EXISTS idx_room_availability_room_time
  ON room_availability_slots(room_id, start_at, end_at);
