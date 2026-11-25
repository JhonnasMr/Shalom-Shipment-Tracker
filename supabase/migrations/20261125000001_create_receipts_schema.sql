-- ==============================================================================
-- MIGRATION: 20261125000001_create_receipts_schema.sql
-- DESCRIPTION: Sistema Profesional de Digitalización y Búsqueda de Comprobantes por DNI
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'operator');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE receipt_status AS ENUM ('pending_confirmation', 'confirmed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. PROFILES TABLE (vinculado a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'operator',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger para updated_at en profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_name TEXT NOT NULL,
    recipient_dni VARCHAR(10) NOT NULL,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    image_hash VARCHAR(64) NOT NULL,
    ocr_provider VARCHAR(50) NOT NULL,
    ocr_confidence NUMERIC(4,3) NOT NULL CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
    ocr_raw_result JSONB DEFAULT '{}'::jsonb,
    ocr_detected_dni VARCHAR(10),
    ocr_detected_name TEXT,
    manual_correction BOOLEAN NOT NULL DEFAULT false,
    processing_status receipt_status NOT NULL DEFAULT 'confirmed',
    captured_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger para updated_at en receipts
DROP TRIGGER IF EXISTS set_receipts_updated_at ON public.receipts;
CREATE TRIGGER set_receipts_updated_at
    BEFORE UPDATE ON public.receipts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Índices optimizados para consultas de alta concurrencia
CREATE INDEX IF NOT EXISTS idx_receipts_recipient_dni ON public.receipts (recipient_dni);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON public.receipts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_created_by ON public.receipts (created_by);
CREATE INDEX IF NOT EXISTS idx_receipts_image_hash ON public.receipts (image_hash);

-- 5. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (public.get_auth_user_role() = 'admin');

-- Receipts Policies:
-- Operators and Admins can view receipts
DROP POLICY IF EXISTS "Operators can view own receipts and Admins all" ON public.receipts;
CREATE POLICY "Operators can view own receipts and Admins all"
    ON public.receipts FOR SELECT
    USING (
        public.get_auth_user_role() = 'admin' 
        OR (public.get_auth_user_role() = 'operator' AND created_by = auth.uid())
    );

-- Operators and Admins can insert receipts
DROP POLICY IF EXISTS "Authorized users can insert receipts" ON public.receipts;
CREATE POLICY "Authorized users can insert receipts"
    ON public.receipts FOR INSERT
    WITH CHECK (
        public.get_auth_user_role() IN ('admin', 'operator')
        AND auth.uid() = created_by
    );

-- Only Admins can update/delete
DROP POLICY IF EXISTS "Admins can update receipts" ON public.receipts;
CREATE POLICY "Admins can update receipts"
    ON public.receipts FOR UPDATE
    USING (public.get_auth_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete receipts" ON public.receipts;
CREATE POLICY "Admins can delete receipts"
    ON public.receipts FOR DELETE
    USING (public.get_auth_user_role() = 'admin');

-- Function for Public / Citizen DNI Exact Search (SECURITY DEFINER)
-- Allows public search WITHOUT exposing full table access or loose queries
CREATE OR REPLACE FUNCTION public.search_receipts_by_dni(p_dni TEXT)
RETURNS TABLE (
    id UUID,
    recipient_name TEXT,
    recipient_dni VARCHAR(10),
    storage_path TEXT,
    captured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Validar formato estricto de DNI (8 dígitos) o CE (hasta 10)
    IF p_dni IS NULL OR LENGTH(TRIM(p_dni)) < 8 OR LENGTH(TRIM(p_dni)) > 10 THEN
        RAISE EXCEPTION 'Número de documento inválido';
    END IF;

    RETURN QUERY
    SELECT 
        r.id,
        r.recipient_name,
        r.recipient_dni,
        r.storage_path,
        r.captured_at,
        r.created_at
    FROM public.receipts r
    WHERE r.recipient_dni = TRIM(p_dni)
      AND r.processing_status = 'confirmed'
    ORDER BY r.captured_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on search function to anon and authenticated
GRANT EXECUTE ON FUNCTION public.search_receipts_by_dni(TEXT) TO anon, authenticated;

-- Audit Logs Policies:
-- Only admins can read audit logs
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.get_auth_user_role() = 'admin');

-- System or backend can insert logs via security definer or service role
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);
