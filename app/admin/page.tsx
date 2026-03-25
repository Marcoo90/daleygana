"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    activeCampaign: 'Sin campaña activa',
    pendingOrders: 0,
    pendingPayments: 0,
    soldTickets: 0,
    totalParticipants: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const statCards = [
    {
      label: 'Campaña Vigente',
      value: stats.activeCampaign,
      isBig: true,
      icon: '🎯',
      accent: '#1e1b4b',
      sub: 'EN CURSO ✅',
    },
    { label: 'Órdenes Pendientes', value: stats.pendingOrders, icon: '🛒', accent: '#d97706' },
    { label: 'Pagos Sin Validar', value: stats.pendingPayments, icon: '💰', accent: '#dc2626' },
    { label: 'Tickets Generados', value: stats.soldTickets, icon: '🎫', accent: '#2563eb' },
    { label: 'Participantes', value: stats.totalParticipants, icon: '👥', accent: '#7c3aed' },
  ];

  const quickActions = [
    { href: '/admin/campaigns', icon: '📅', title: 'Crear Campaña', desc: 'Configura fechas y arte del sorteo', color: '#1e1b4b' },
    { href: '/admin/payments', icon: '⚖️', title: 'Validar Pagos', desc: 'Revisar vouchers y activar tickets', color: '#065f46' },
    { href: '/admin/raffles', icon: '🎁', title: 'Configurar Premios', desc: 'Añadir artículos para el sorteo', color: '#4c1d95' },
    { href: '/admin/winners', icon: '🏆', title: 'Proclamar Ganadores', desc: 'Publicar resultados del sorteo', color: '#92400e' },
    { href: '/admin/participants', icon: '👥', title: 'Ver Participantes', desc: 'Consultar la base de datos', color: '#1e40af' },
    { href: '/admin/products', icon: '📦', title: 'Catálogo de Precios', desc: 'Gestionar packs y registros', color: '#065f46' },
  ];

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
         <div>
            <h1 className="text-gradient-cyan" style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px' }}>
              Dashboard General
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.4rem' }}>
              Bienvenido al panel de control de <strong style={{ color: '#1e1b4b' }}>Dale y Gana</strong>.
            </p>
         </div>
         <button onClick={fetchStats} className="btn-refresh-pro">
           🔄 Actualizar
         </button>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `4px solid ${s.accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                {s.label}
              </span>
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>{s.icon}</span>
            </div>
            {s.isBig ? (
              <>
                <h2 style={{ color: '#1e293b', fontSize: '1.4rem', fontWeight: 950, lineHeight: 1.2, marginBottom: '1rem' }}>
                  {loading ? '...' : s.value}
                </h2>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 900 }}>
                  {s.sub}
                </span>
              </>
            ) : (
              <h2 style={{ color: s.accent, fontSize: '3.5rem', fontWeight: 950, lineHeight: 1 }}>
                {loading ? '–' : s.value}
              </h2>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '4rem' }}>
        <h3 style={{ color: '#1e293b', fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem' }}>
          ⚡ Acciones Rápidas
        </h3>
        <div className="quick-grid">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="action-card">
              <span style={{ fontSize: '2.2rem', background: a.color + '1A', padding: '1rem', borderRadius: '1rem', display: 'block', textAlign: 'center' }}>
                {a.icon}
              </span>
              <div>
                <h4 style={{ color: '#1e293b', fontWeight: 800, marginBottom: '0.3rem' }}>{a.title}</h4>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .stat-card {
          background: #ffffff;
          padding: 2rem;
          border-radius: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }
        .quick-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .action-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: #ffffff;
          padding: 1.5rem;
          border-radius: 1.5rem;
          text-decoration: none;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .action-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          border-color: #c7d2fe;
        }
        .btn-refresh-pro {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 0.8rem 1.5rem;
          border-radius: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-refresh-pro:hover {
          background: #1e1b4b;
          color: #fff;
          border-color: #1e1b4b;
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
