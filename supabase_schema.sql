-- ==========================================
-- ARADHANA GOLD HOUSE - SUPABASE SCHEMA SQL
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kxnsgrytvigymczwaay/sql/new
-- ==========================================

-- 1. Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  upi_id TEXT DEFAULT '7202921222@okbizaxis',
  qr_code_url TEXT DEFAULT '/assets/logo_badge.png',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default store settings if empty
INSERT INTO public.store_settings (id, upi_id, qr_code_url)
VALUES (1, '7202921222@okbizaxis', '/assets/logo_badge.png')
ON CONFLICT (id) DO NOTHING;


-- 2. Live Gold & Silver Rates Table
CREATE TABLE IF NOT EXISTS public.hardik_rates (
  id BIGINT PRIMARY KEY DEFAULT 1,
  gold24k NUMERIC NOT NULL DEFAULT 7350,
  gold22k NUMERIC NOT NULL DEFAULT 6737,
  silver1kg NUMERIC NOT NULL DEFAULT 85500,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default live rates if empty
INSERT INTO public.hardik_rates (id, gold24k, gold22k, silver1kg)
VALUES (1, 7350, 6737, 85500)
ON CONFLICT (id) DO NOTHING;


-- 3. Custom Users Table (Customers)
CREATE TABLE IF NOT EXISTS public.custom_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT,
  city TEXT DEFAULT 'ADIPUR (KUTCH)',
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. Digital Gold Harvest Saving Schemes Table
CREATE TABLE IF NOT EXISTS public.harvest_schemes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.custom_users(id) ON DELETE CASCADE,
  monthly_amount NUMERIC NOT NULL,
  total_months INT DEFAULT 11,
  bonus_months INT DEFAULT 1,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. Payments Table (Installments & Proofs)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  scheme_id TEXT REFERENCES public.harvest_schemes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.custom_users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  installment_no INT NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_proof_url TEXT,
  status TEXT DEFAULT 'VERIFIED',
  transaction_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. Custom Showcase Products Catalog Table
CREATE TABLE IF NOT EXISTS public.hardik_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  purity TEXT DEFAULT '22K Hallmarked Gold',
  weight TEXT,
  url TEXT NOT NULL,
  description TEXT,
  is_bestseller BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 7. Enable Row Level Security (RLS) & Public Read Access Policies
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardik_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardik_products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings, rates & products
CREATE POLICY "Public Read Store Settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Live Rates" ON public.hardik_rates FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.hardik_products FOR SELECT USING (true);
CREATE POLICY "Public Read Custom Users" ON public.custom_users FOR SELECT USING (true);
CREATE POLICY "Public Read Harvest Schemes" ON public.harvest_schemes FOR SELECT USING (true);
CREATE POLICY "Public Read Payments" ON public.payments FOR SELECT USING (true);

-- Allow public insert/update for local operations & admin updates
CREATE POLICY "Public All Store Settings" ON public.store_settings FOR ALL USING (true);
CREATE POLICY "Public All Live Rates" ON public.hardik_rates FOR ALL USING (true);
CREATE POLICY "Public All Custom Users" ON public.custom_users FOR ALL USING (true);
CREATE POLICY "Public All Harvest Schemes" ON public.harvest_schemes FOR ALL USING (true);
CREATE POLICY "Public All Payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Public All Products" ON public.hardik_products FOR ALL USING (true);


-- 8. Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_screenshots', 'payment_screenshots', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Security Policies
CREATE POLICY "Public Access Storage Objects" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public Insert Storage Objects" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Storage Objects" ON storage.objects FOR UPDATE USING (true);
