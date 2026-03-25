"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PacksAdmin() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPack, setNewPack] = useState({ name: '', price: '', ticket_quantity: '', campaign_id: campaignId });

  const fetchPacks = async () => {
    if (!campaignId) return;
    const res = await fetch(`/api/admin/packs?campaignId=${campaignId}`);
    const data = await res.json();
    setPacks(data);
    setLoading(false);
  };

  const createPack = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/admin/packs', {
      method: 'POST',
      body: JSON.stringify({ ...newPack, campaign_id: campaignId })
    });
    if (res.ok) {
      alert("Pack creado");
      setShowModal(false);
      fetchPacks();
    }
  };

  useEffect(() => { fetchPacks(); }, [campaignId]);

  return (
    <div className="container" style={{ padding: '2rem', minHeight: '100vh', background: '#0f172a' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ color: '#fff' }}>Packs del Sorteo 🧧</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowModal(true)} className="nav-link" style={{ background: '#7e22ce', border: 'none' }}>+ Nuevo Pack</button>
          <Link href="/admin/campaigns" className="nav-link" style={{ background: 'rgba(255,255,255,0.1)' }}>Volver a Campañas</Link>
        </div>
      </header>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={createPack} style={{ background: '#1e293b', padding: '2rem', borderRadius: '1rem', width: '400px' }}>
            <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Configurar Nuevo Pack</h3>

            <input type="text" placeholder="Nombre (Ej: Pack Suerte Pro)" className="form-input" style={{ marginBottom: '1rem' }} required
              onChange={e => setNewPack({ ...newPack, name: e.target.value })} />

            <input type="number" placeholder="Precio (Ej: 15.00)" className="form-input" style={{ marginBottom: '1rem' }} required
              onChange={e => setNewPack({ ...newPack, price: e.target.value })} />

            <input type="number" placeholder="Cantidad de Tickets (Ej: 8)" className="form-input" style={{ marginBottom: '1.5rem' }} required
              onChange={e => setNewPack({ ...newPack, ticket_quantity: e.target.value })} />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>GUARDAR</button>
              <button onClick={() => setShowModal(false)} className="btn-primary" style={{ flex: 1, background: '#475569' }}>CANCELAR</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {packs.map(p => (
          <div key={p.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem', border: '2px solid' + (p.price > 10 ? '#7e22ce' : 'rgba(255,255,255,0.1)') }}>
            <h3 style={{ color: '#fff' }}>{p.name}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>S/ {p.price}</p>
            <p style={{ color: '#00e5ff', fontWeight: 700 }}>{p.ticket_quantity} Tickets incluidos</p>
            <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>ID: {p.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
