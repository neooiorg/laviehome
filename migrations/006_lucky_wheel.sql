ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS recipient_phone_hash TEXT;
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS source VARCHAR(40);

CREATE TABLE IF NOT EXISTS lucky_wheel_spins (
  id UUID PRIMARY KEY,
  spin_date DATE NOT NULL,
  device_hash CHAR(64) NOT NULL,
  phone_hash CHAR(64) NOT NULL,
  phone_masked VARCHAR(20) NOT NULL,
  prize_key VARCHAR(40) NOT NULL,
  prize_label VARCHAR(100) NOT NULL,
  prize_percent INTEGER NOT NULL DEFAULT 0,
  voucher_code VARCHAR(50) REFERENCES discount_codes(code) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_hash, spin_date)
);

CREATE INDEX IF NOT EXISTS idx_lucky_wheel_spins_created_at
  ON lucky_wheel_spins(created_at DESC);

