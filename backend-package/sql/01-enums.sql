-- =============================================
-- 01-enums.sql — Enum types তৈরি
-- সবার আগে রান করুন
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'processing',
  'shipped',
  'completed',
  'cancelled',
  'returned'
);
