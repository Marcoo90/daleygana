"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './globals.css';

export default function Home() {
  const [activeData, setActiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchActive = async () => {
      try {
        const res = await fetch('/api/public/active-campaign');
        const data = await res.json();
        if (res.ok) setActiveData(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchActive();
  }, []);

  const getImageUrl = (path: string) => {
    // Si no hay path, devolver un placeholder estético para no romper la UI
    if (!path || path === '') return 'https://plchldr.co/i/600x400?&bg=111&fc=fff&text=DALE+Y+GANA';
    if (path.startsWith('http')) return path;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/public-assets/${path}`;
  };

  const formatDate = (dateString: string) => {
    if (!mounted || !dateString) return '';
    const date = new Date(dateString);
    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    return `${date.getDate()} DE ${months[date.getMonth()]}`;
  };

  const campaign = activeData?.campaign;
  const raffles = activeData?.raffles || [];
  const products = activeData?.products || [];

  return (
    <div className={`container ${mounted ? 'fade-in-entry' : ''}`} style={{ minHeight: '100vh' }}>
      {/* Header Funcional */}
      <nav className="topbar">
        <Link href="/">
          <img src="/logo.png" alt="Dale y Gana Logo" style={{ height: '120px', width: 'auto' }} />
        </Link>
        <div className="nav-links">
          <Link href="/premios" className="nav-link">Premios</Link>
          <Link href="https://whatsapp.com" target="_blank" className="nav-link">📣 Canal Difusión</Link>
          <Link href="/ganadores" className="nav-link">🏆 Ganadores</Link>
          <Link href="/consulta" className="nav-link highlight">🎫 Ver Mis Tickets</Link>
        </div>
      </nav>

      <main className="hero" style={{ padding: '2rem 0 5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="hero-mega-title">
             ¡SORTEO {campaign?.name?.toUpperCase() || 'MARZO'}!
          </h1>
          <span className="hero-subtitle">CON LA SUERTE DE ALVARO</span>
        </div>

        {/* CONTENEDOR ÚNICO DE CAMPAÑA - SIN REPETICIONES */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', padding: '0 20px' }}>
          
          {loading ? (
            <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
               <div className="animate-pulse">Cargando Sorteo...</div>
            </div>
          ) : (
            <div className="unified-card" style={{ padding: '4rem 3rem' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <div className="pill-event-top" style={{ marginBottom: '2rem' }}>
                  <span>PASO 1: REGISTRO OBLIGATORIO</span>
                  <span style={{ color: '#eab308' }}>⭐</span>
                </div>
                
                <div className="price-layout-v5" style={{ marginBottom: '1.5rem' }}>
                   <span className="currency-v5">S/</span>
                   <span className="amount-v5">40.00</span>
                </div>
                
                <p style={{ color: '#fff', fontSize: '1.4rem', opacity: 0.9, marginBottom: '2.5rem', fontWeight: 700 }}>
                  Acceso Total a todos los sorteos de la campaña
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1.2rem', borderRadius: '1rem', color: '#fff', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>✅ 1 Ticket Inicial</div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1.2rem', borderRadius: '1rem', color: '#fff', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>✅ Sorteos Diarios</div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1.2rem', borderRadius: '1rem', color: '#fff', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>✅ Packs de Descuento</div>
                </div>
              </div>

              {/* GRID DE PREMIOS ESTILO IMAGEN 13 */}
              {raffles.length > 0 && (
                <div style={{ marginBottom: '4.5rem' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 950, marginBottom: '2rem', textAlign: 'center', letterSpacing: '1px' }}>
                    🎁 <span style={{ color: 'var(--accent-cyan)' }}>PREMIOS</span> A SORTEARSE:
                  </h3>
                  
                  <div className="v3-prize-grid">
                    {raffles.map((r: any) => (
                      <div key={r.id} className="v3-prize-card" style={{ border: '1px solid rgba(0, 229, 255, 0.15)' }}>
                        <img 
                          src={getImageUrl(r.prize_image)} 
                          className="v3-prize-img"
                          alt={r.prize_name}
                          onError={(e) => { 
                            e.currentTarget.src = `https://plchldr.co/i/600x400?&bg=111&fc=fff&text=${encodeURIComponent(r.prize_name)}`;
                            e.currentTarget.style.opacity = '0.5';
                          }}
                        />
                        <div className="v3-prize-info">
                           <div className="v3-prize-qty">{r.draw_order || 1}</div>
                           <div className="v3-prize-name">{r.prize_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/registro?type=base" className="btn-cyan-v5" style={{ textDecoration: 'none', display: 'flex', height: '85px', fontSize: '1.8rem', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0, 229, 255, 0.3)' }}>
                ¡REGISTRARME AHORA!
              </Link>
            </div>
          )}
        </section>

        {/* SECCIÓN 2: PACKS ADICIONALES (SOLO DINÁMICO) */}
        {mounted && products.filter((p: any) => p.product_type === 'ticket_pack').length > 0 && (
          <section id="packs" style={{ padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>¿YA ESTÁS REGISTRADO? 🚀</h3>
              <p style={{ color: 'var(--text-muted)' }}>Aumenta tus probabilidades con nuestros packs exclusivos.</p>
            </div>

            <div className="grid-3" style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {products.filter((p: any) => p.product_type === 'ticket_pack').map((p: any) => (
                <Link key={p.id} href={`/registro?type=pack&id=${p.id}`} className={`pack-card-premium ${p.slug.includes('gold') || p.price > 30 ? 'yellow' : p.slug.includes('winner') || p.price > 15 ? 'cyan' : 'purple'}`}>
                  <div className="pack-header">{p.name}</div>
                  <div className="pack-tickets">{p.tickets_count} TICKETS</div>
                  <div className="pack-price">S/ {p.price}</div>
                  <div className="pack-btn">Comprar Extra</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Alerta de Seguridad */}
        <div className="alert-fraud">
          <div className="alert-fraud-title">⚠️ ¡ALERTA DE SEGURIDAD! ⚠️</div>
          <p className="alert-fraud-text">Verifica siempre que el pago sea a nombre de:</p>
          <div className="alert-fraud-company">CONSORCIO DALE Y GANA S.A.C</div>
          <p className="alert-fraud-footer">Si sale otro nombre, ¡ESTÁS SIENDO ESTAFADO!</p>
        </div>
      </main>

      <div className="home-winners-belt">
        <div className="home-winners-belt-inner">
          <div className="home-winners-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '4rem', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }}>🏆</div>
              <div>
                <h3>¡TÚ PODRÍAS SER</h3>
                <span>el próximo suertud@!</span>
              </div>
            </div>
            <Link href="/registro" className="btn-green-light">¡Participar ya!</Link>
          </div>

          <div className="winners-carousel">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <img
                key={idx}
                src={`/ganadores/${idx}.jpg`}
                onError={(e) => { e.currentTarget.src = `https://plchldr.co/i/250x350?&bg=111&fc=fff&text=Ganador+${idx}` }}
                alt={`Súper Ganador ${idx}`}
                className="winner-photo"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
