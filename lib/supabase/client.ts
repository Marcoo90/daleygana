import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente público (para el frontend y operaciones de usuario)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Queremos que persista durante la pestaña actual
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Cliente admin con service_role key (SOLO usar en API routes del servidor)
// Bypasa RLS — nunca exponer al cliente
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = serviceRoleKey && serviceRoleKey !== 'SOLO_SI_ES_NECESARIO'
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // Fallback al cliente anon si no está configurado
