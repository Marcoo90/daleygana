"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function ConsultaPage() {
  const [dni, setDni] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participantData, setParticipantData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

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
            <span style={{ fontSize: '4rem' }}>🎟️</span>
         </div>
         <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem' }}>
            Ingresa tu DNI para ver tus tickets del sorteo
         </h2>

         <form onSubmit={handleSearch}>
            <input 
              type="text" 
              className="consulta-input" 
              placeholder="Número de DNI" 
              value={dni}
              onChange={(e) => {
                 setDni(e.target.value);
                 if(hasSearched) setHasSearched(false);
              }}
              required 
            />
            <button type="submit" className="consulta-btn-blue" disabled={isLoading}>
               {isLoading ? 'CONSULTANDO...' : 'CONSULTAR'}
            </button>
         </form>

         {hasSearched && errorMsg && (
            <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
               <div className="consulta-error-box">
                  <h3 style={{ fontSize: '1.8rem', color: '#ff4d4d', marginBottom: '1rem' }}>{errorMsg}</h3>
                  <p style={{ color: '#e2e8f0', fontSize: '1.1rem' }}>Verifica tu número de DNI o contáctate con soporte</p>
               </div>
               
               <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="consulta-whatsapp">
                  CANAL DE ATENCIÓN <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>💬</span>
               </a>
            </div>
         )}

         {hasSearched && participantData && (
            <div className="animate-fade-in" style={{ marginTop: '2.5rem', textAlign: 'left' }}>
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: '#00e5ff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Hola, {participantData.participant_name}</h3>
                  <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>Hemos encontrado {participantData.tickets?.length || 0} tickets vinculados a tu DNI:</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                     {participantData.tickets?.map((t: any) => (
                        <div key={t.id} style={{ background: '#7e22ce', color: '#fff', padding: '0.8rem', borderRadius: '0.5rem', textAlign: 'center', fontWeight: 900, fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                           {t.ticket_code}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         <div style={{ marginTop: '3rem', color: '#fff' }}>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#00e5ff' }}>Horario de Atención:</h4>
            
            <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Lunes a Sábado</p>
            <p style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}>9:00 a.m - 9:00 p.m</p>

            <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Domingos</p>
            <p style={{ color: '#cbd5e1' }}>9:00 a.m - 8:00 p.m</p>
         </div>
      </div>
    </div>
  );
}
