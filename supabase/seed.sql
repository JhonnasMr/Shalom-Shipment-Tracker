-- ==============================================================================
-- SEED DATA: supabase/seed.sql
-- Datos iniciales para entorno de pruebas y desarrollo
-- ==============================================================================

-- Usuarios de prueba pre-creados (deben corresponder a auth.users en local)
-- ID operador test: '00000000-0000-0000-0000-000000000001'
-- ID admin test:    '00000000-0000-0000-0000-000000000002'

INSERT INTO public.profiles (id, full_name, email, role, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Ester Operador Lima', 'operador@comprobantes.pe', 'operator', true),
    ('00000000-0000-0000-0000-000000000002', 'Ayrton Administrador Central', 'admin@comprobantes.pe', 'admin', true)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Registro de prueba con el DNI del comprobante Shalom real (47037422)
INSERT INTO public.receipts (
    id,
    recipient_name,
    recipient_dni,
    storage_path,
    original_filename,
    mime_type,
    file_size,
    image_hash,
    ocr_provider,
    ocr_confidence,
    ocr_raw_result,
    ocr_detected_dni,
    ocr_detected_name,
    manual_correction,
    processing_status,
    captured_at,
    created_by
)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'RODRIGUEZ GARCIA SANDRA YASET',
    '47037422',
    '00000000-0000-0000-0000-000000000001/sample_shalom_receipt.png',
    'comprobante_shalom_47037422.png',
    'image/png',
    428512,
    'a7f3e1b9c8d2045612349876543210fedcba9876543210fedcba9876543210ab',
    'tesseract',
    0.980,
    '{"provider": "tesseract", "detected_block": "DATOS DEL DESTINATARIO", "recipient_dni": "47037422", "recipient_name": "RODRIGUEZ GARCIA SANDRA YASET"}'::jsonb,
    '47037422',
    'RODRIGUEZ GARCIA SANDRA YASET',
    false,
    'confirmed',
    '2026-11-21 11:05:12-05',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Registro de prueba adicional para demostrar múltiples comprobantes para un mismo DNI
INSERT INTO public.receipts (
    id,
    recipient_name,
    recipient_dni,
    storage_path,
    original_filename,
    mime_type,
    file_size,
    image_hash,
    ocr_provider,
    ocr_confidence,
    ocr_raw_result,
    ocr_detected_dni,
    ocr_detected_name,
    manual_correction,
    processing_status,
    captured_at,
    created_by
)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'RODRIGUEZ GARCIA SANDRA YASET',
    '47037422',
    '00000000-0000-0000-0000-000000000001/second_delivery_47037422.png',
    'guia_entrega_shalom_47037422.png',
    'image/png',
    384210,
    'b8e4f2c0d9a3156723450987654321fedcba0987654321fedcba09876543210cd',
    'tesseract',
    0.965,
    '{"provider": "tesseract", "detected_block": "DATOS DEL DESTINATARIO", "recipient_dni": "47037422"}'::jsonb,
    '47037422',
    'RODRIGUEZ GARCIA SANDRA YASET',
    false,
    'confirmed',
    '2026-11-24 16:30:00-05',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Log de auditoría inicial
INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'CREATE_RECEIPT',
    'receipt',
    '11111111-1111-1111-1111-111111111111',
    '{"dni": "47037422", "mode": "automatic_ocr", "confidence": 0.98}'::jsonb
);
