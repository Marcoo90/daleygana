-- Supabase / PostgreSQL Schema 

-- Habilitar extensión opcional para generación de IDs únicos y criptográficos seguros si se prefiere.
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; Use la versión v4 como default

-- 1. PARTICIPANTES (users públicos, no auth)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NULL,
  department VARCHAR(150),
  city VARCHAR(150) NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SORTEOS
CREATE TYPE raffle_status AS ENUM ('draft', 'active', 'closed', 'completed');

CREATE TABLE raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  prize_image_url TEXT,
  prize_value NUMERIC(10,2) NULL,
  entry_price NUMERIC(10,2) NOT NULL,
  draw_date TIMESTAMPTZ,
  status raffle_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PARTICIPACIONES O ENTRADAS (TICKETS Y COMPROBANTES)
CREATE TYPE entry_payment_status AS ENUM ('pending', 'validated', 'rejected');
CREATE TYPE entry_status AS ENUM ('active', 'cancelled', 'winner');

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  public_ticket_code VARCHAR(20) NOT NULL UNIQUE, 
  payment_status entry_payment_status DEFAULT 'pending',
  entry_status entry_status DEFAULT 'active',
  receipt_path TEXT NOT NULL, -- Ruta o URI de la imagen en Supabase Storage
  admin_note TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  validated_at TIMESTAMPTZ NULL
);

-- Se añade un index de unicidad para asegurarse que la fila completa no duplique.
-- Idealmente un índice adicional sobre `public_ticket_code` asegurará consultas ultra rápidas.
CREATE INDEX idx_entries_public_ticket_code ON entries (public_ticket_code);

-- 4. GANADORES HISTÓRICOS
CREATE TABLE winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID REFERENCES raffles(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  visible_name VARCHAR(255) NOT NULL,
  visible_ticket_code VARCHAR(50) NOT NULL,
  testimonial TEXT NULL,
  winner_image_url TEXT NULL
);

-- 5. USUARIOS ADMINISTRADOR (vinculados con auth.users)
CREATE TYPE admin_role AS ENUM ('superadmin', 'admin', 'validator');

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role admin_role DEFAULT 'validator',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REGLAS DE SEGURIDAD (RLS - Row Level Security) O SEGURIDAD APLICATIVA
-- Idealmente el Middleware en Next.js evitará accesos a lectura o escritura descontrolada
-- Pero las RLS son un requisito extra para garantizar un modelo seguro en Supabase (escalabilidad de seguridad local).
-- El backend del servidor Next.js debe usar siempre llaves Service_Role o tokens correctos del Admin.

-- Notas:
-- El Bucket 'receipts' de Supabase Storage debe ser PRIVADO. Solo admins tendrán acceso o políticas de RLS.
-- `public_ticket_code` debe ser corto, del lado de la app puede usarse un `nanoid` (ej: 'ABC-12X9').
