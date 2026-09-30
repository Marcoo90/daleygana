"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GanadoresPage() {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await fetch('/api/public/winners');
        const data = await res.json();
        if (res.ok) setWinners(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchWinners();
  }, []);

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>

      <div style={{ textAlign: 'center', margin: '5rem 0 4rem' }}>
        <h2 className="hero-mega-title" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', margin: '0' }}>
          ¡NUESTROS GANADORES
        </h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '1.3rem', marginTop: '1.5rem', maxWidth: '750px', margin: '1.5rem auto', fontWeight: 600 }}>
          ¡Felicitamos a todos los afortunados ganadores de nuestro gran sorteo! La transparencia es nuestra garantía, tú puedes ser el próximo.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '3rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {winners.length > 0 ? winners.map((winner, idx) => (
          <div key={idx} className="winner-card-premium">
            <div className="card-image-wrapper">
              <img
                src={winner.winner_image_url || 'https://plchldr.co/i/400x300?&bg=111&fc=fff&text=Foto+Ganador'}
                alt="Ganador"
                className="winner-img-full"
              />
              <div className="ticket-overlay">{winner.visible_ticket_code}</div>
            </div>
            <div className="card-info-pro">
              <h3 className="winner-name">{winner.visible_name}</h3>
              <p className="winner-prize">🔥 Ganó: {winner.raffle?.prize_name || 'Premio'}</p>

              <div className="winner-meta">
                <span className="meta-tag region">
                  📍 {winner.ticket?.participants?.department || 'Perú'}
                </span>
                <span className="meta-tag status">
                  ¡FELICIDADES! 🎉
                </span>
              </div>
            </div>
          </div>
        )) : (
          !loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', fontSize: '1.5rem', fontWeight: 700, padding: '4rem' }}>Aún no hay ganadores proclamados. ¡Tú podrías ser el siguiente!</p>
        )}
      </div>

      <style jsx>{`
        .winner-card-premium {
          background: var(--bg-card);
          border-radius: 2rem;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          backdrop-filter: blur(20px);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: var(--card-shadow);
          position: relative;
        }
        .winner-card-premium:hover {
          transform: translateY(-12px);
          border-color: var(--accent-cyan-contrast);
          box-shadow: var(--card-hover-shadow);
        }
        .card-image-wrapper {
          position: relative;
          height: 250px;
          overflow: hidden;
          background: #000;
        }
        .winner-img-full {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s;
        }
        .winner-card-premium:hover .winner-img-full {
          transform: scale(1.1);
        }
        .ticket-overlay {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--accent-cyan-contrast);
          color: #fff;
          font-weight: 950;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .card-info-pro {
          padding: 2rem;
          text-align: center;
        }
        .winner-name {
          font-size: 1.8rem;
          color: var(--text-heading);
          margin-bottom: 0.5rem;
          font-weight: 900;
        }
        .winner-prize {
          color: var(--accent-yellow-contrast);
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          font-family: 'Inter', sans-serif;
        }
        .winner-meta {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        .meta-tag {
          font-size: 0.85rem;
          padding: 0.6rem 1rem;
          border-radius: 2rem;
          font-weight: 800;
        }
        .meta-tag.region {
          background: var(--bg-card-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }
        .meta-tag.status {
          background: rgba(2, 132, 199, 0.12);
          color: var(--accent-cyan-contrast);
          border: 1px solid rgba(2, 132, 199, 0.3);
        }
      `}</style>
    </div>
  );
}
