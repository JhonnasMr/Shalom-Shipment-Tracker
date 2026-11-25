-- ==============================================================================
-- MIGRATION: 20261125000002_create_storage_bucket.sql
-- DESCRIPTION: Bucket privado para comprobantes y políticas de almacenamiento
-- ==============================================================================

-- 1. CREACIÓN DEL BUCKET PRIVADO (receipts)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    false, -- OBLIGATORIO: BUCKET PRIVADO
    15728640, -- 15MB límite
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- 2. POLÍTICAS DE ACCESO EN STORAGE.OBJECTS

-- Operadores y Admins pueden subir fotos a su propia carpeta: receipts/{user_id}/*
DROP POLICY IF EXISTS "Authorized users can upload receipts" ON storage.objects;
CREATE POLICY "Authorized users can upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Lectura a través de objetos autenticados
DROP POLICY IF EXISTS "Users can read own uploaded receipt files" ON storage.objects;
CREATE POLICY "Users can read own uploaded receipt files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.get_auth_user_role() = 'admin'
        )
    );

-- Eliminación únicamente para administradores
DROP POLICY IF EXISTS "Admins can delete storage objects" ON storage.objects;
CREATE POLICY "Admins can delete storage objects"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'receipts'
        AND public.get_auth_user_role() = 'admin'
    );
