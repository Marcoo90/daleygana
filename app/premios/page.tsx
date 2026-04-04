"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageUrl, formatDate } from '@/lib/utils';


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


   const campaign = activeData?.campaign;
   const raffles = activeData?.raffles || [];

   return (
      <div className="container" style={{ paddingBottom: '6rem' }}>

         {/* Hero Sección Premios */}
         <section
            className="premios-hero"
            style={{
               background: campaign?.hero_image
                  ? `url(${campaign.hero_image}) center/cover no-repeat`
                  : undefined
            }}
         >
            <div className="premios-hero-content">
               <span className="benefit-badge">LA MEJOR FORMA DE GANAR ES ARRIESGARSE</span>
               <h2
                  className="hero-mega-title"
                  style={{ textAlign: 'left', marginBottom: '1rem' }}
               >
                  {campaign?.name || 'PRÓXIMO EVENTO'}
               </h2>
               <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
                  TODOS LOS MESES{' '}
                  <span style={{ color: 'var(--accent-cyan)' }}>sorteamos premios increíbles</span>
               </p>
            </div>
            {/* overlay solo cuando hay imagen de fondo */}
            {campaign?.hero_image && (
               <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 }} />
            )}
         </section>

         {/* Grid de Premios */}
         <div className="secondary-prize-grid">
            {loading ? (
               <p style={{ color: '#fff', textAlign: 'center', gridColumn: '1 / -1', padding: '3rem', fontSize: '1.1rem' }}>
                  Buscando premios...
               </p>
            ) : raffles.length === 0 ? (
               <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', gridColumn: '1 / -1', padding: '3rem', fontSize: '1.1rem' }}>
                  No hay sorteos programados por ahora.
               </p>
            ) : raffles.map((r: any) => (
               <div className="prize-card-dynamic" key={r.id}>
                  <div className="prize-card-header">
                     <div className="prize-card-qty">{r.draw_order}</div>
                     <img
                        src={getImageUrl(r.prize_image)}
                        className="prize-card-img-pro"
                        alt={r.prize_name}
                     />
                  </div>
                  <div className="prize-card-body-pro">
                     <span className="prize-date-label">SORTEO: {formatDate(campaign?.draw_at)}</span>
                     <h4 className="prize-name-pro">{r.prize_name}</h4>
                     <p className="prize-desc-pro">{r.description || 'Participa y gana este increíble premio.'}</p>
                  </div>
               </div>
            ))}
         </div>

         {/* Sección Packs */}
         <section id="tienda" className="upsell-section">
            {(() => {
               const packs = (activeData?.products || []).filter((p: any) => p.product_type === 'ticket_pack');
               const packColors = ['purple', 'yellow', 'cyan'];
               const packLabels = ['COMBO TENGO FE', 'PACK FORTUNA', 'COMBO GANADOR'];
               const packBtns = ['COMPRAR EXTRA', '¡SÚPER OFERTA!', 'X3 SUERTE'];

               if (packs.length > 0) {
                  return (
                     <div className="grid-3">
                        {packs.map((p: any, idx: number) => (
                           <Link
                              key={p.id}
                              href={`/registro?type=pack&id=${p.id}`}
                              className={`pack-card-premium ${packColors[idx % packColors.length]}`}
                           >
                              <div className="pack-header">{packLabels[idx] || p.name.toUpperCase()}</div>
                              <div className="pack-tickets">{p.tickets_count} TICKETS</div>
                              <div className="pack-price">S/ {p.price.toFixed(2)}</div>
                              <div className="pack-btn">{packBtns[idx] || 'COMPRAR'}</div>
                           </Link>
                        ))}
                     </div>
                  );
               }

               return (
                  <div className="fallback-container">
                     <p className="fallback-text">Los packs de tickets estarán disponibles próximamente.</p>
                     <Link href="/registro?type=base" className="btn-premios-cta">
                        PARTICIPAR AHORA
                     </Link>
                  </div>
               );
            })()}
         </section>

         {/* Alerta de Seguridad */}
         <div className="alert-fraud">
            <div className="alert-fraud-title">⚠️ ¡ALERTA DE SEGURIDAD! ⚠️</div>
            <p className="alert-fraud-text">Verifica siempre que el pago sea a nombre de:</p>
            <div className="alert-fraud-company">CONSORCIO DALE Y GANA S.A.C</div>
            <p className="alert-fraud-text" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
               Si sale otro nombre, ¡ESTÁS SIENDO ESTAFADO!
            </p>
         </div>

      </div>
   );
}
