"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns');
      const data = await res.json();
      if (res.ok) setCampaigns(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'campaigns');

    try {
       const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
       const data = await res.json();
       if (data.url) setImageUrl(data.url);
    } catch (err) { alert("Error al subir imagen"); }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      starts_at: formData.get('starts_at'),
      ticket_sales_end_at: formData.get('ticket_sales_end_at'),
      draw_at: formData.get('draw_at'),
      status: formData.get('status'),
      hero_image: imageUrl
    };

    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setShowModal(false);
        setImageUrl('');
        fetchCampaigns();
      } else {
        const errData = await res.json();
        alert("Error: " + errData.error);
      }
    } catch (err) { alert("Error al guardar"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas eliminar esta campaña? Se borrarán sorteos y productos asociados.")) return;
    try {
       const res = await fetch(`/api/admin/campaigns?id=${id}`, { method: 'DELETE' });
       if (res.ok) fetchCampaigns();
       else alert("No se pudo eliminar");
    } catch (err) { alert("Error de conexión"); }
  };

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h1 className="text-gradient-cyan" style={{ fontSize: '2.5rem', fontWeight: 950 }}>📅 Gestión de Campañas</h1>
            <p style={{ color: '#64748b', fontSize: '1.2rem' }}>Define el cronograma y el arte visual de tus sorteos.</p>
         </div>
         <button onClick={() => { setImageUrl(''); setShowModal(true); }} className="btn-add-pro">+ Crear Campaña</button>
      </header>

      <div className="table-card-pro">
         <table className="admin-table-pro">
            <thead>
               <tr>
                  <th>Imagen</th>
                  <th>Campaña</th>
                  <th>Venta Cierra</th>
                  <th>Gran Sorteo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones / Módulos</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                 <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>Buscando campañas...</td></tr>
               ) : campaigns.length === 0 ? (
                 <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>No hay campañas configuradas.</td></tr>
               ) : (
                 campaigns.map(c => (
                    <tr key={c.id}>
                       <td>
                          <img 
                            src={c.hero_image || 'https://plchldr.co/i/150x80?&bg=eee&fc=999&text=Banner'} 
                            alt={c.name} 
                            style={{ width: '100px', height: '56px', borderRadius: '0.6rem', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                          />
                       </td>
                       <td style={{ fontWeight: 800, color: '#1e293b' }}>{c.name}</td>
                       <td>{c.ticket_sales_end_at ? new Date(c.ticket_sales_end_at).toLocaleDateString() : '-'}</td>
                       <td>{c.draw_at ? new Date(c.draw_at).toLocaleDateString() : '-'}</td>
                       <td>
                          <span className={`status-pill ${c.status}`}>{c.status.toUpperCase()}</span>
                       </td>
                       <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                             <Link href={`/admin/products?campaignId=${c.id}`} className="btn-action-minimal" style={{ border: '1px solid #e0f2fe', color: '#0369a1' }}>
                                📦 Productos
                             </Link>
                             <Link href={`/admin/raffles?campaignId=${c.id}`} className="btn-action-minimal" style={{ border: '1px solid #f3e8ff', color: '#7e22ce' }}>
                                🎁 Premios
                             </Link>
                             <button onClick={() => handleDelete(c.id)} className="btn-action-minimal" style={{ borderColor: '#fee2e2', color: '#ef4444' }}>🗑️</button>
                          </div>
                       </td>
                    </tr>
                 ))
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-scale-in">
            <h2 className="text-gradient-cyan" style={{ marginBottom: '2rem', fontSize: '1.8rem', fontWeight: 900 }}>Nueva Campaña</h2>
            <form onSubmit={handleSave}>
               <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Nombre de la Campaña</label>
                  <input name="name" type="text" placeholder="Ej: Marzo 2026 - Especial Autos" required className="form-input-pro" />
               </div>
               
               <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Imagen Banner Principal (Hero)</label>
                  <input type="file" onChange={handleImageUpload} className="form-input-pro" style={{ fontSize: '0.8rem' }} />
                  {imageUrl && <p style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: '0.5rem', fontWeight: 700 }}>✅ Imagen cargada</p>}
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                     <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Fecha Inicio</label>
                     <input name="starts_at" type="date" required className="form-input-pro" />
                  </div>
                  <div className="form-group">
                     <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Cierre Venta (fecha y hora)</label>
                     <input name="ticket_sales_end_at" type="datetime-local" required className="form-input-pro" />
                     <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem', display: 'block' }}>Hora exacta en que cierran las ventas</span>
                  </div>
               </div>
               <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Gran Sorteo (fecha y hora)</label>
                  <input name="draw_at" type="datetime-local" required className="form-input-pro" />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem', display: 'block' }}>Momento oficial del gran sorteo en vivo</span>
               </div>
               <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Estado</label>
                  <select name="status" className="form-input-pro" style={{ width: '100%' }}>
                     <option value="active">Activa (Visible en Web)</option>
                     <option value="draft">Borrador</option>
                     <option value="completed">Completada</option>
                  </select>
               </div>
               <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                  <button type="submit" className="btn-save-pro" disabled={saving}>{saving ? 'GUARDANDO...' : 'GUARDAR CAMPAÑA'}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cancel-pro">CANCELAR</button>
               </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .status-pill { padding: 0.4rem 0.8rem; border-radius: 2rem; font-size: 0.7rem; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; }
        .status-pill.active { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .status-pill.draft { background: #f1f5f9; color: #475569; }
        .btn-add-pro { background: #1e1b4b; color: #fff; padding: 1rem 2rem; border-radius: 1.2rem; border: none; font-weight: 800; cursor: pointer; transition: transform 0.2s; }
        .btn-add-pro:hover { transform: scale(1.02); }
        .btn-action-minimal { padding: 0.6rem 1rem; border-radius: 0.8rem; background: transparent; font-size: 0.8rem; font-weight: 800; transition: all 0.2s; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn-action-minimal:hover { transform: translateY(-2px); opacity: 0.8; }
        .btn-cancel-pro { flex: 1; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 1.2rem; border-radius: 1.2rem; cursor: pointer; text-align: center; font-weight: 800; }
      `}</style>
    </div>
  );
}
