"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';


export default function PremiosPage() {
  const [activeData, setActiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const campaign = activeData?.campaign;
  const raffles = activeData?.raffles || [];

  return (
    <div className="container" style={{ paddingBottom: '6rem' }}>
      <nav className="topbar">
        <Link href="/">
          <img src="/logo.png" alt="Dale y Gana Logo" style={{ height: '80px', width: 'auto' }} />
        </Link>
        <div className="nav-links">
           <Link href="/premios" className="nav-link">Premios</Link>
           <Link href="https://whatsapp.com" target="_blank" className="nav-link">📣 Canal Difusión</Link>
           <Link href="/ganadores" className="nav-link">🏆 Ganadores</Link>
           <Link href="/consulta" className="nav-link highlight">🎫 Ver Mis Tickets</Link>
        </div>
      </nav>

      {/* Hero Sección Premios Dinámico */}
      <section className="premios-hero" style={{ background: campaign?.hero_image ? `url(${campaign.hero_image}) center/cover no-repeat` : undefined }}>
         <div className="premios-hero-content">
            <span className="benefit-badge">Beneficios Exclusivos</span>
            <h2 className="hero-mega-title" style={{ textAlign: 'left', fontSize: 'clamp(2.5rem, 6vw, 5rem)', textShadow: '2px 4px 10px #000' }}>
               {campaign?.name || 'PRÓXIMO EVENTO'}
            </h2>
            <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem', textShadow: '0 2px 5px #000' }}>
               TODAS LAS SEMANAS <span style={{ color: 'var(--accent-cyan)' }}>sorteamos premios increíbles</span>
            </p>
            <Link href="#tienda" className="btn-green-light" style={{ display: 'inline-block' }}>Aumentar mis chances 🎟️</Link>
         </div>
         <div className="overlay-dark" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 }}></div>
      </section>

      {/* Grid de Premios Dinámico del CMS */}
      <div className="secondary-prize-grid" style={{ gap: '2rem', marginBottom: '6rem' }}>
         {loading ? (
            <p style={{ color: '#fff', textAlign: 'center', gridColumn: '1/-1' }}>Buscando premios...</p>
         ) : raffles.length === 0 ? (
            <p style={{ color: '#fff', textAlign: 'center', gridColumn: '1/-1' }}>No hay sorteos programados por ahora.</p>
         ) : raffles.map((r: any) => (
            <div className="prize-card-dynamic" key={r.id}>
               <div className="prize-card-header">
                  <div className="prize-card-qty">{r.draw_order}</div>
                  <img src={r.prize_image || 'https://plchldr.co/i/400x250?&bg=111&fc=fff&text=Premio'} className="prize-card-img-pro" alt={r.prize_name} />
               </div>
               <div className="prize-card-body-pro">
                  <span className="prize-date-label">SORTEO: {formatDate(campaign?.draw_at)}</span>
                  <h4 className="prize-name-pro">{r.prize_name}</h4>
                  <p className="prize-desc-pro">{r.description || 'Participa y gana este increíble premio.'}</p>
               </div>
            </div>
         ))}
      </div>

      {/* Sección Multiplicador - PACKS DINÁMICOS desde BD */}
      <section id="tienda" className="upsell-section" style={{ background: 'rgba(0,0,0,0.3)', padding: '5rem 3rem' }}>
         <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="hero-title" style={{ fontSize: '3rem', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>MULTIPLICA TUS <span className="text-gradient">PROBABILIDADES</span></h2>
            <p style={{ color: '#fff', fontWeight: 600, maxWidth: '750px', margin: '1rem auto' }}>
               ¿Ya estás registrado? Compra packs adicionales y no dejes que el premio de tus sueños se escape.
            </p>
         </div>

         {/* Packs dinámicos (de BD) o fallback estático */}
         {(() => {
           const packs = (activeData?.products || []).filter((p: any) => p.product_type === 'ticket_pack');
           const packColors = ['purple', 'yellow', 'cyan'];
           const packLabels = ['PACK SUERTE', 'PACK FORTUNA', 'COMBO GANADOR'];
           const packBtns = ['COMPRAR EXTRA', '¡SÚPER OFERTA!', 'X3 SUERTE'];
           const btnColors = ['#fff', 'var(--accent-cyan)', '#fff'];

           if (packs.length > 0) {
             return (
               <div className="grid-3" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                 {packs.map((p: any, idx: number) => (
                   <Link key={p.id} href={`/registro?type=pack&id=${p.id}`} className={`pack-card-premium ${packColors[idx % packColors.length]}`}>
                      <div className="pack-header">{packLabels[idx] || p.name.toUpperCase()}</div>
                      <div className="pack-tickets" style={{ fontSize: '3.5rem' }}>{p.tickets_count} TICKETS</div>
                      <div className="pack-price" style={{ fontSize: '2.5rem' }}>S/ {p.price.toFixed(2)}</div>
                      <div className="pack-btn" style={{ background: btnColors[idx % btnColors.length], color: '#000' }}>{packBtns[idx] || 'COMPRAR'}</div>
                   </Link>
                 ))}
               </div>
             );
           }

           // Fallback si aún no se configuraron packs en el admin
           return (
             <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.3)', borderRadius: '2rem', maxWidth: '700px', margin: '0 auto' }}>
               <p style={{ color: '#94a3b8', fontWeight: 600 }}>Los packs de tickets estarán disponibles próximamente.</p>
               <Link href="/registro?type=base" className="btn-cyan" style={{ display: 'inline-block', marginTop: '1rem' }}>Registrarme con S/ 40</Link>
             </div>
           );
         })()}
      </section>

      <div className="alert-fraud" style={{ marginTop: '5rem' }}>
         <div className="alert-fraud-title">⚠️ ¡ALERTA DE SEGURIDAD! ⚠️</div>
         <p className="alert-fraud-text">Verifica que el pago al aumentar tus tickets sea a nombre de:</p>
         <div className="alert-fraud-company" style={{ fontSize: '1.8rem' }}>CONSORCIO DALE Y GANA S.A.C</div>
      </div>

      <style jsx>{`
         .prize-card-dynamic { background: #fff; border-radius: 2rem; overflow: hidden; transition: transform 0.3s; box-shadow: 0 15px 40px rgba(0,0,0,0.2); }
         .prize-card-dynamic:hover { transform: translateY(-10px); }
         .prize-card-header { position: relative; height: 260px; background: #000; }
         .prize-card-img-pro { width: 100%; height: 100%; object-fit: contain; }
         .prize-card-qty { position: absolute; bottom: 0; left: 0; background: var(--accent-cyan); color: #000; font-size: 3rem; font-weight: 950; padding: 0.5rem 1.5rem; font-family: 'Outfit'; border-top-right-radius: 1.5rem; line-height: 1; z-index: 2; }
         .prize-card-body-pro { padding: 2rem; }
         .prize-date-label { color: #64748b; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
         .prize-name-pro { color: #0f172a; font-size: 1.6rem; font-weight: 950; margin-bottom: 0.8rem; line-height: 1.2; text-transform: uppercase; }
         .prize-desc-pro { color: #64748b; font-size: 0.95rem; line-height: 1.6; }
         .hero-mega-title { z-index: 2; position: relative; }
      `}</style>
    </div>
  );
}
