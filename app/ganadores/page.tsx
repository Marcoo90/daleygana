"use client";
import Link from 'next/link';

export default function GanadoresPage() {
  const winners = [
    { name: "MARCO ANTONIO R.", prize: "Honda CBR 2024", ticket: "DLG-1A4K", area: "Lima", pic: "https://plchldr.co/i/400x300?&bg=ff007f&fc=fff&text=Foto+Ganador" },
    { name: "JUANA BEATRIZ M.", prize: "S/ 1,200 en Efectivo", ticket: "DLG-8X9B", area: "Arequipa", pic: "https://plchldr.co/i/400x300?&bg=00f0ff&fc=000&text=Foto+Ganador" },
    { name: "CARLOS ANDRÉS G.", prize: "iPhone 15 Pro Max", ticket: "DLG-F2Q9", area: "Piura", pic: "https://plchldr.co/i/400x300?&bg=ffea00&fc=000&text=Foto+Ganador" }
  ];

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Topbar Reutilizable Mini */}
      <nav className="topbar">
        <Link href="/">
           <h1 className="brand-logo" style={{ cursor: 'pointer' }}>DALE<span>Y</span>GANA</h1>
        </Link>
        <div className="nav-links">
           <Link href="/consulta" className="nav-link">🎫 Ver Mis Tickets</Link>
           <Link href="/" className="nav-link highlight">Volver al Sorteo</Link>
        </div>
      </nav>

      <div style={{ textAlign: 'center', margin: '4rem 0' }}>
         <h2 className="hero-title" style={{ fontSize: '3rem' }}>¡NUESTROS <span className="text-gradient">GANADORES!</span></h2>
         <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '1rem', maxWidth: '600px', margin: '1rem auto' }}>
           ¡Felicitamos a todos los afortunados ganadores de nuestro gran sorteo! La transparencia es nuestra garantía, tú puedes ser el próximo.
         </p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
         {winners.map((winner, idx) => (
            <div key={idx} className="card" style={{ padding: '0', overflow: 'hidden' }}>
               <img src={winner.pic} alt="Ganador" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
               <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--accent-yellow)', marginBottom: '0.5rem' }}>{winner.name}</h3>
                  <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem' }}>Ganó: {winner.prize}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 1rem', borderRadius: '2rem', color: 'var(--text-muted)' }}>
                      📍 {winner.area}
                    </span>
                    <span style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0,240,255,0.3)', padding: '0.4rem 1rem', borderRadius: '2rem', color: 'var(--accent-cyan)' }}>
                      🎫 {winner.ticket}
                    </span>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
