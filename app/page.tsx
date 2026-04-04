"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './globals.css';
import { getImageUrl, formatDate } from '@/lib/utils';
import { getActiveCampaignData, getWinnersList } from '@/lib/api/public';
import Countdown from '@/lib/components/Countdown';

export default function Home() {
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      const campData = await getActiveCampaignData();
      if (campData) {
        setActiveCampaign(campData.campaign);
        setRaffles(campData.raffles || []);
        setProducts(campData.products || []);
      }

      const winData = await getWinnersList();
      setWinners(winData);

      setLoading(false);
    };
    fetchData();
  }, []);


  const campaign = activeCampaign;

  return (
    <div className={`container ${mounted ? 'fade-in-entry' : ''}`} style={{ minHeight: '100vh' }}>

      <main className="hero" style={{ padding: '2rem 0 5rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="hero-mega-title">
            ¡PREMIOS DALE Y GANA <br />  {campaign?.name?.toUpperCase() || 'MARZO'}!
          </h1>
          <span className="hero-subtitle">CON LA SUERTE DE ALVARO</span>
        </div>

        {/* CONTENEDOR ÚNICO DE CAMPAÑA - SIN REPETICIONES */}
        <section className="campaign-section" style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', padding: '0 20px' }}>

          {loading ? (
            <div className="loading-state">
              <div className="animate-pulse">Cargando Sorteo...</div>
            </div>
          ) : (
            <div className="unified-card">

              <div className="card-header-v5">
                <div className="pill-event-top">
                  <span>PARA PARTICIPAR: REGÍSTRATE SIN MIEDO AL EXITO</span>
                  <span className="star-icon">⭐</span>
                </div>

                <div className="price-layout-v5">
                  <span className="currency-v5">S/</span>
                  <span className="amount-v5">40.00</span>
                </div>

                <p className="card-hero-description">
                  Acceso Total a todos los sorteos de la campaña
                </p>
              </div>

              {/* GRID DE PREMIOS ESTILO IMAGEN 13 */}
              {raffles.length > 0 && (
                <div className="prizes-section-v5">
                  <h3 className="section-subtitle-white">
                    🎁 <span className="accent-cyan-text">INCREIBLES PREMIOS</span> QUE PUEDEN SER TUYOS:
                  </h3>

                  <div className="v3-prize-grid">
                    {raffles.map((r: any) => (
                      <div key={r.id} className="v3-prize-card">
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

              <Link href="/registro?type=base" className="btn-cyan-v5">
                ¡PARTICIPAR AHORA!
              </Link>
            </div>
          )}
        </section>

        {/* SECCIÓN 2: PACKS ADICIONALES (SOLO DINÁMICO) */}
        {mounted && products.filter((p: any) => p.product_type === 'ticket_pack').length > 0 && (
          <section id="packs" style={{ padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>HERMANITO SI YA ESTÁS REGISTRADO 🚀</h3>
              <p style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 750 }}>Aumenta tus probabilidades con nuestros packs exclusivos.</p>
            </div>

            <div className="grid-3" style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {products.filter((p: any) => p.product_type === 'ticket_pack').map((p: any) => (
                <Link key={p.id} href={`/registro?type=pack&id=${p.id}`} className={`pack-card-premium ${p.slug.includes('gold') || p.price > 30 ? 'yellow' : p.slug.includes('winner') || p.price > 15 ? 'cyan' : 'purple'}`}>
                  <div className="pack-header">{p.name}</div>
                  <div className="pack-tickets">{p.tickets_count} TICKETS</div>
                  <div className="pack-price">S/ {p.price}</div>
                  <div className="pack-btn">Aumenta tus chances</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CONTADOR DE CIERRE DE VENTAS */}
        {campaign?.ticket_sales_end_at && (
          <Countdown targetDate={campaign.ticket_sales_end_at} />
        )}


        {/* ALERTA DE SEGURIDAD */}
        <div className="alert-fraud">
          <div className="alert-fraud-title">⚠️ ¡ALERTA DE SEGURIDAD! ⚠️</div>
          <p className="alert-fraud-text">Verifica siempre que el pago sea a nombre de:</p>
          <div className="alert-fraud-company">CONSORCIO DALE Y GANA S.A.C</div>
          <p className="alert-fraud-text" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            Si sale otro nombre, ¡ESTÁS SIENDO ESTAFADO!
          </p>
        </div>

        {/* SECCIÓN GANADORES */}
        <section style={{ padding: '6rem 0', position: 'relative', overflow: 'hidden' }}>
          {/* Luces de acento de fondo (Blobs) */}
          <div style={{ position: 'absolute', top: '50%', left: '20%', width: '300px', height: '300px', background: 'var(--accent-purple)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', top: '20%', right: '10%', width: '400px', height: '400px', background: 'var(--accent-cyan)', filter: 'blur(180px)', opacity: 0.1, borderRadius: '50%', zIndex: 0 }}></div>

          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h2 className="hero-mega-title" style={{ fontSize: '3rem', marginBottom: '4.5rem' }}>
              GALERÍA DE NUESTROS GANADORES 📸
            </h2>

            <div className="ticker-container-v3">
              <div className="winners-carousel-v2">
                {winners.length > 0 ? (
                  [...winners, ...winners].map((w, idx) => (
                    <div key={idx} className="winner-photo-wrapper">
                      <img
                        src={w.winner_image_url || 'https://plchldr.co/i/400x300?&bg=111&fc=fff&text=Ganador'}
                        alt="Ganador"
                        className="winner-photo-img"
                      />
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Próximamente más ganadores...</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <style jsx>{`
          .ticker-container-v3 {
            overflow: hidden;
            padding: 2rem 0;
            width: 100%;
            -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
            mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          }
          .winners-carousel-v2 {
            display: flex;
            gap: 2rem;
            width: fit-content;
            animation: ticker 50s linear infinite;
          }
          .winners-carousel-v2:hover {
            animation-play-state: paused;
          }
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .winner-photo-wrapper {
            flex: 0 0 350px;
            height: 240px;
            border-radius: 1.5rem;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.02);
            backdrop-filter: blur(5px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .winner-photo-wrapper:hover {
            transform: scale(1.1) rotate(2deg);
            border-color: var(--accent-cyan);
            box-shadow: 0 25px 60px rgba(0, 229, 255, 0.2);
            z-index: 10;
          }
          .winner-photo-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.85;
            transition: opacity 0.3s;
          }
          .winner-photo-wrapper:hover .winner-photo-img {
            opacity: 1;
          }
          @media (max-width: 768px) {
            .ticker-container-v3 { -webkit-mask-image: none; mask-image: none; }
            .winner-photo-wrapper {
              flex: 0 0 260px;
              height: 180px;
            }
          }
        `}</style>

      </main>
    </div>
  );
}
