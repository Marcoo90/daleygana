"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ConsultaPage() {
  const [dni, setDni] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participantData, setParticipantData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // States para packs extra
  const [packs, setPacks] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  useEffect(() => {
    // Cargar info de campaña y packs al inicio para tenerlo listo
    const fetchActive = async () => {
      try {
        const res = await fetch('/api/public/active-campaign');
        const data = await res.json();
        if (res.ok) {
          setActiveCampaign(data.campaign);
          const p = data.products?.filter((prod: any) => prod.product_type === 'ticket_pack') || [];
          setPacks(p);
        }
      } catch (err) { console.error(err); }
    };
    fetchActive();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dni.trim() === '') return;

    setIsLoading(true);
    setErrorMsg('');
    setHasSearched(false);
    setParticipantData(null);

    try {
      const resp = await fetch(`/api/tickets/lookup?dni=${dni}`);
      const data = await resp.json();

      if (resp.ok) {
        setParticipantData(data);
        setHasSearched(true);
      } else {
        setErrorMsg(data.message || 'No se pudo realizar la consulta');
        setHasSearched(true);
      }
    } catch (err) {
      setErrorMsg('Error de conexión con el servidor');
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <nav className="topbar">
        <Link href="/">
           <img src="/logo.png" alt="Dale y Gana Logo" style={{ height: '70px', width: 'auto' }} />
        </Link>
        <Link href="/" className="nav-link" style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>← Volver al Inicio</Link>
      </nav>

      <div className="consulta-card">
         <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.4))' }}>🎟️</span>
         </div>
         <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '1.2rem', fontWeight: 900 }}>
            Mis Tickets de Sorteo
         </h2>
         <p style={{ color: '#cbd5e1', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
            Ingresa tu DNI para verificar tu participación activa y ver tus números.
         </p>

         <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
              <input 
                type="text" 
                className="consulta-input" 
                placeholder="Número de DNI" 
                value={dni}
                onChange={(e) => {
                   setDni(e.target.value);
                   if(hasSearched) setHasSearched(false);
                }}
                maxLength={8}
                required 
                style={{ flex: 1, margin: 0, height: '64px', fontSize: '1.2rem', padding: '0 1.5rem', background: '#fff', color: '#000' }}
              />
              <button 
                type="submit" 
                className="consulta-btn-blue" 
                disabled={isLoading} 
                style={{ width: 'auto', padding: '0 2.5rem', height: '64px', margin: 0, borderRadius: '0.8rem', fontSize: '1.1rem', fontWeight: 900, whiteSpace: 'nowrap' }}
              >
                 {isLoading ? '...' : 'CONSULTAR'}
              </button>
            </div>
         </form>

         {hasSearched && errorMsg && (
            <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
               <div className="consulta-error-box" style={{ background: 'rgba(185, 28, 28, 0.1)', border: '2px solid #ef4444' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#ff4d4d', marginBottom: '1rem', fontWeight: 900 }}>{errorMsg}</h3>
                  <p style={{ color: '#e2e8f0', fontSize: '1.1rem' }}>Verifica tu número de DNI o contáctate con nuestro soporte por WhatsApp si crees que es un error.</p>
               </div>
               
               <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="consulta-whatsapp" style={{ marginTop: '1.5rem', background: '#25D366' }}>
                  SOPORTE WHATSAPP ONLINE <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>💬</span>
               </a>
            </div>
         )}

         {hasSearched && participantData && (
            <div className="animate-fade-in" style={{ marginTop: '2.5rem', textAlign: 'left' }}>
               <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--accent-cyan)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                       <h3 style={{ color: 'var(--accent-cyan)', fontSize: '2rem', marginBottom: '0.2rem', fontWeight: 950 }}>{participantData.participant_name?.toUpperCase()}</h3>
                       <p style={{ color: '#cbd5e1', fontSize: '1rem' }}>Tienes <strong style={{ color: '#fff' }}>{participantData.tickets?.length || 0} tickets</strong> activos en la campaña <span style={{ color: 'var(--accent-yellow)', fontWeight: 800 }}>{activeCampaign?.name || 'VIGENTE'}</span></p>
                    </div>
                    <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '0.5rem 1.2rem', borderRadius: '2rem', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.9rem' }}>
                       DNI: {dni}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                     {participantData.tickets?.length > 0 ? (
                       participantData.tickets?.map((t: any) => (
                          <div key={t.ticket_code} className="ticket-badge" style={{ background: 'linear-gradient(135deg, #7e22ce, #1e1b4b)', color: '#fff', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center', fontWeight: 900, fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '1px' }}>
                             {t.ticket_code}
                          </div>
                       ))
                     ) : (
                       <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
                          <p>Tus tickets están siendo validados por el administrador. ¡Vuelve pronto!</p>
                       </div>
                     )}
                  </div>

                  {/* SECCIÓN MÁS TICKETS - IMPLEMENTACIÓN DE LA IDEA DEL USUARIO */}
                  {packs.length > 0 && (
                    <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' }}>
                       <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                          <h4 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 900, marginBottom: '0.5rem' }}>
                             🚀 ¡AUMENTA TUS CHANCES DE GANAR!
                          </h4>
                          <p style={{ color: '#94a3b8' }}>Compra packs adicionales para tener más oportunidades en el sorteo.</p>
                       </div>

                       <div className="grid-3" style={{ gap: '1rem' }}>
                          {packs.map((p: any) => (
                             <Link 
                                key={p.id} 
                                href={`/registro?type=pack&id=${p.id}&dni=${dni}`} 
                                className="pack-card-premium-mini"
                             >
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>{p.name}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{p.tickets_count} TICKETS</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
                                   <div style={{ fontSize: '1.2rem', fontWeight: 950 }}>S/ {p.price}</div>
                                   <div style={{ background: '#fff', color: '#000', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: 800 }}>COMPRAR →</div>
                                </div>
                             </Link>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>
         )}

         <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>HORARIO DE ATENCIÓN SOPORTE:</h4>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontWeight: 900, marginBottom: '0.3rem', fontSize: '1.1rem', color: '#fff' }}>LUNES A SÁBADO</p>
                <p style={{ color: '#cbd5e1' }}>9:00 a.m - 9:00 p.m</p>
              </div>
              <div>
                <p style={{ fontWeight: 900, marginBottom: '0.3rem', fontSize: '1.1rem', color: '#fff' }}>DOMINGOS</p>
                <p style={{ color: '#cbd5e1' }}>9:00 a.m - 8:00 p.m</p>
              </div>
            </div>
         </div>
      </div>

      <style jsx>{`
        .pack-card-premium-mini {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 1.2rem;
          border-radius: 1rem;
          color: #fff;
          text-decoration: none;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .pack-card-premium-mini:hover {
          background: rgba(0, 229, 255, 0.1);
          border-color: var(--accent-cyan);
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 229, 255, 0.15);
        }
        .ticket-badge {
          animation: slideIn 0.3s ease forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
