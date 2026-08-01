-- ============================================================================
-- Wird Admin - Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ADMIN PROFILES (extends Supabase auth.users with admin role)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. CATEGORIES (multilingual)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  label_en TEXT NOT NULL,
  label_ar TEXT,
  label_ur TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. DHIKR / ZIKR (main content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dhikr (
  id TEXT PRIMARY KEY,
  arabic TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  meaning TEXT NOT NULL,
  recommended_count INTEGER NOT NULL DEFAULT 33,
  category TEXT NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  reference TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dhikr_category_id ON public.dhikr(category_id);
CREATE INDEX IF NOT EXISTS idx_dhikr_sort_order ON public.dhikr(sort_order);
CREATE INDEX IF NOT EXISTS idx_dhikr_created_at ON public.dhikr(created_at DESC);

-- ============================================================================
-- 4. CONTENT VERSIONS (version tracking for the public API)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_versions (
  id BIGSERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  dhikr_count INTEGER NOT NULL,
  category_count INTEGER NOT NULL,
  changelog TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_by UUID REFERENCES public.admin_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_content_versions_published ON public.content_versions(published_at DESC);

-- ============================================================================
-- 5. PUSH TOKENS (device tokens for notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  platform TEXT,
  app_version TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_last_active ON public.push_tokens(last_active DESC);

-- ============================================================================
-- 6. NOTIFICATION LOGS (audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  new_zikr_count INTEGER,
  version TEXT,
  recipients_count INTEGER,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by UUID REFERENCES public.admin_profiles(id),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent ON public.notification_logs(sent_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dhikr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables (mobile app uses these via public API)
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Public read dhikr" ON public.dhikr
  FOR SELECT USING (true);

CREATE POLICY "Public read content_versions" ON public.content_versions
  FOR SELECT USING (true);

-- Public can register their push token (insert) and update last_active
CREATE POLICY "Public register push tokens" ON public.push_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update push tokens" ON public.push_tokens
  FOR UPDATE USING (true);

-- Admin write access to content tables (only authenticated admin users)
CREATE POLICY "Admin write categories" ON public.categories
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid() AND ap.role = 'admin' AND ap.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid() AND ap.role = 'admin' AND ap.is_active = true
  ));

CREATE POLICY "Admin write dhikr" ON public.dhikr
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid() AND ap.role = 'admin' AND ap.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid() AND ap.role = 'admin' AND ap.is_active = true
  ));

CREATE POLICY "Admin write content_versions" ON public.content_versions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid() AND ap.role = 'admin' AND ap.is_active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid() AND ap.role = 'admin' AND ap.is_active = true
  ));

CREATE POLICY "Admin read notification_logs" ON public.notification_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid() AND ap.role = 'admin' AND ap.is_active = true
  ));

CREATE POLICY "Admin insert notification_logs" ON public.notification_logs
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = auth.uid() AND ap.role = 'admin' AND ap.is_active = true
  ));

-- ============================================================================
-- TRIGGERS: auto-update updated_at on change
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_categories_updated ON public.categories;
CREATE TRIGGER trg_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_dhikr_updated ON public.dhikr;
CREATE TRIGGER trg_dhikr_updated
  BEFORE UPDATE ON public.dhikr
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_admin_profiles_updated ON public.admin_profiles;
CREATE TRIGGER trg_admin_profiles_updated
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
