"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 1. Verificación Inicial de Sesión
  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        console.log("Sesión detectada, mandando a /admin...");
        window.location.href = '/admin';
      }
    }
    checkUser();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log("Intentando login...");

    try {
      // 2. Ejecutar Login Cliente
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(`Error: ${authError.message}`);
        setLoading(false);
      } else if (data.session) {
        console.log("Login OK, sesion guardada en localstorage");
        // 3. Redireccion Crítica (Evitamos router.push por ahora)
        window.location.assign('/admin');
      } else {
        setError("Error desconocido de autenticación");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Fallo crítico de conexión");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#11111a', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.png" alt="Dale y Gana" style={{ height: '70px', width: 'auto', marginBottom: '1.5rem' }} />
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>PANEL DE CONTROL 🔒</h2>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.8rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>USER</label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>PASS</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', background: '#7e22ce' }}
            disabled={loading}
          >
            {loading ? 'DURMIENDO...' : 'INGRESAR 🚀'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
           <Link href="/" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>← Volver al Inicio</Link>
        </div>
      </div>
    </div>
  );
}
