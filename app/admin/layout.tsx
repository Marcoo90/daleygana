"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import AdminNotifications from '@/lib/components/AdminNotifications';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // 1. Verificación inicial de sesión
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
      
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    };

    checkSession();

    // 2. Escuchar cambios en la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // LOGIN POR INACTIVIDAD (30 MINUTOS)
  useEffect(() => {
    if (!session || pathname === '/admin/login') return;

    let timeout: any;
    
    const resetTimer = () => {
       if (timeout) clearTimeout(timeout);
       timeout = setTimeout(() => {
          console.log("Inactividad detectada, cerrando sesión por seguridad.");
          handleLogout();
       }, 30 * 60 * 1000); // 30 minutos de inactividad
    };

    // Escuchar eventos de interacción común
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer(); // Iniciar cronómetro al montar o cambiar sesión

    return () => {
       window.removeEventListener('mousemove', resetTimer);
       window.removeEventListener('keydown', resetTimer);
       window.removeEventListener('mousedown', resetTimer);
       window.removeEventListener('touchstart', resetTimer);
       window.removeEventListener('scroll', resetTimer);
       if (timeout) clearTimeout(timeout);
    };
  }, [session, pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
       router.push('/admin/login');
    }
  };

  if (!mounted || (loading && pathname !== '/admin/login')) return null;

  // Si estamos en el login, no mostramos el sidebar ni el layout de administración
  if (pathname === '/admin/login') {
    return <div className="admin-login-wrapper">{children}</div>;
  }

  // Si no hay sesión y no estamos en login, no mostramos nada hasta que el useEffect redireccione
  if (!session) return null;

  return (
    <div className="admin-body-v2">
      {/* Sidebar - Profesional Claro/Gris */}
      <aside className="admin-sidebar-v2">
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <img src="/logo.png" alt="Logo Admin" style={{ height: '60px', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.1))' }} />
          <p className="sidebar-label">PANEL DE CONTROL</p>
        </div>

        <nav className="admin-sidebar-nav">
          <Link href="/admin" className={`admin-link-v2 ${pathname === '/admin' ? 'active' : ''}`}>📊 Dashboard</Link>
          <Link href="/admin/campaigns" className={`admin-link-v2 ${pathname.includes('/campaigns') ? 'active' : ''}`}>📅 Campañas</Link>
          <Link href="/admin/raffles" className={`admin-link-v2 ${pathname.includes('/raffles') ? 'active' : ''}`}>🎁 Sorteos</Link>
          <Link href="/admin/products" className={`admin-link-v2 ${pathname.includes('/products') ? 'active' : ''}`}>📂 Catálogo</Link>
          <Link href="/admin/reports" className={`admin-link-v2 ${pathname.includes('/reports') ? 'active' : ''}`}>📃 Reportes</Link>
          
          <div className="sidebar-divider"></div>
          
          <Link href="/admin/orders" className={`admin-link-v2 ${pathname.includes('/orders') ? 'active' : ''}`}>🛒 Órdenes</Link>
          <Link href="/admin/payments" className={`admin-link-v2 ${pathname.includes('/payments') ? 'active' : ''}`}>💰 Pagos</Link>
          <Link href="/admin/participants" className={`admin-link-v2 ${pathname.includes('/participants') ? 'active' : ''}`}>👥 Participantes</Link>
          <Link href="/admin/winners" className={`admin-link-v2 ${pathname.includes('/winners') ? 'active' : ''}`}>🎉 Ganadores</Link>
          
          <div className="sidebar-footer">
            <Link href="/" className="admin-link-v2 minimal">🌐 Ir a la Web</Link>
            <button onClick={handleLogout} className="btn-logout-v2">CERRAR SESIÓN</button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-v2">
        <div className="admin-content-container">
            {children}
        </div>
      </main>

      {/* Sistema de Notificaciones de Registro en Tiempo Real */}
      <AdminNotifications />

      <style jsx global>{`
        /* ===================================
           SISTEMA BASE DE DISEÑO - ADMIN
           Dale y Gana — Light Theme v2
        =================================== */

        /* Layout */
        .admin-body-v2 {
            display: flex;
            min-height: 100vh;
            background: #f1f5f9;
            color: #0f172a;
            font-family: 'Inter', -apple-system, sans-serif;
        }

        /* Sidebar */
        .admin-sidebar-v2 {
            width: 268px;
            min-width: 268px;
            background: #1e1b4b;
            padding: 2rem 1.2rem;
            position: sticky;
            top: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .sidebar-label {
            font-size: 0.65rem;
            font-weight: 900;
            letter-spacing: 3px;
            color: rgba(255,255,255,0.35);
            margin-top: 1rem;
            text-transform: uppercase;
            padding: 0 0.8rem;
        }

        .admin-sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;
        }

        .admin-link-v2 {
            padding: 0.8rem 1rem;
            border-radius: 0.7rem;
            text-decoration: none;
            color: rgba(255,255,255,0.6);
            font-weight: 600;
            font-size: 0.9rem;
            line-height: 1.4;
            transition: all 0.15s;
            display: block;
        }

        .admin-link-v2:hover {
            color: #ffffff;
            background: rgba(255,255,255,0.1);
        }

        .admin-link-v2.active {
            background: rgba(255,255,255,0.15);
            color: #ffffff;
            font-weight: 700;
        }

        .sidebar-divider {
            height: 1px;
            background: rgba(255,255,255,0.1);
            margin: 1rem 0;
        }

        .btn-logout-v2 {
            width: 100%;
            padding: 0.8rem;
            border-radius: 0.7rem;
            border: 1px solid rgba(239,68,68,0.3);
            background: rgba(239,68,68,0.08);
            color: #fca5a5;
            font-weight: 800;
            font-size: 0.83rem;
            cursor: pointer;
            margin-top: 0.5rem;
            transition: all 0.2s;
        }

        .btn-logout-v2:hover {
            background: #ef4444;
            color: white;
            border-color: #ef4444;
        }

        .admin-main-v2 {
            flex: 1;
            padding: 2.5rem 3rem;
            overflow-y: auto;
            min-width: 0;
        }

        .admin-content-container {
            max-width: 1300px;
            margin: 0 auto;
        }

        /* ---- TIPOGRAFÍA ---- */
        .text-gradient-cyan { 
            background: linear-gradient(135deg, #1e1b4b 0%, #2563eb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 900;
            display: inline-block;
        }
        
        /* ---- TABLAS ---- */
        .table-card-pro { 
            background: #ffffff; 
            border: 1px solid #e2e8f0; 
            border-radius: 1.2rem;
            overflow: hidden;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        .admin-table-pro {
            width: 100%;
            border-collapse: collapse;
        }

        .admin-table-pro thead tr {
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
        }

        .admin-table-pro th {
            padding: 1rem 1.5rem;
            text-align: left;
            color: #94a3b8;
            font-size: 0.72rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            white-space: nowrap;
        }

        .admin-table-pro td {
            padding: 1rem 1.5rem;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.95rem;
            vertical-align: middle;
        }

        .admin-table-pro tbody tr:last-child td {
            border-bottom: none;
        }

        .admin-table-pro tbody tr:hover td {
            background: #fafbff;
        }

        /* ---- MODAL ---- */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(8px);
            display: grid;
            place-items: center;
            z-index: 5000;
            padding: 2rem;
        }

        .modal {
            background: #ffffff;
            color: #0f172a;
            border-radius: 1.5rem;
            padding: 2.5rem;
            width: 100%;
            max-width: 580px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.18);
            border: 1px solid #e2e8f0;
            position: relative;
        }

        .modal h2 {
            font-size: 1.5rem;
            font-weight: 900;
            color: #1e1b4b;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #f1f5f9;
        }

        /* ---- FORMULARIOS ---- */
        .form-label {
            display: block;
            margin-bottom: 0.4rem;
            font-weight: 700;
            font-size: 0.85rem;
            color: #475569;
        }

        .form-input-pro {
            width: 100%;
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            color: #1e293b;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
            font-family: inherit;
        }

        .form-input-pro:focus {
            border-color: #6366f1;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .form-input-pro::placeholder {
            color: #cbd5e1;
        }

        /* ---- BOTONES ---- */
        .btn-save-pro {
            background: #1e1b4b;
            color: #fff;
            border: none;
            padding: 0.85rem 2rem;
            border-radius: 0.8rem;
            font-weight: 800;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
            letter-spacing: 0.3px;
        }

        .btn-save-pro:hover {
            background: #2563eb;
            transform: translateY(-1px);
        }

        .btn-save-pro:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .btn-cancel-pro {
            background: #f8fafc;
            color: #64748b;
            border: 1.5px solid #e2e8f0;
            padding: 0.85rem 1.5rem;
            border-radius: 0.8rem;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.95rem;
            text-decoration: none;
            display: inline-block;
            transition: all 0.15s;
            text-align: center;
        }

        .btn-cancel-pro:hover {
            background: #e2e8f0;
            color: #0f172a;
        }

        .btn-action-minimal {
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            color: #64748b;
            padding: 0.5rem 0.9rem;
            border-radius: 0.6rem;
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s;
            text-decoration: none;
            display: inline-block;
        }

        .btn-action-minimal:hover {
            background: #e2e8f0;
            color: #0f172a;
            transform: translateY(-1px);
        }

        /* ---- SIDEBAR FOOTER ---- */
        .sidebar-footer {
            margin-top: auto;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255,255,255,0.1);
        }

        .admin-link-v2.minimal {
            font-size: 0.8rem;
            text-align: center;
            color: rgba(255,255,255,0.45);
        }

        /* ---- ANIMACIONES ---- */
        .animate-fade-in {
            animation: adminFadeIn 0.5s ease-out;
        }

        @keyframes adminFadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .animate-scale-in {
            animation: adminScaleIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes adminScaleIn {
            from { opacity: 0; transform: scale(0.93); }
            to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
