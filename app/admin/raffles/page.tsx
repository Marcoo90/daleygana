"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function RafflesAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const [raffles, setRaffles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const fetchRaffles = async () => {
    if (!campaignId) { setLoading(false); return; }
    const res = await fetch(`/api/admin/raffles?campaignId=${campaignId}`);
    const data = await res.json();
    if (res.ok) setRaffles(data);
    setLoading(false);
  };

  const fetchCampaign = async () => {
    if (!campaignId) return;
    const res = await fetch(`/api/admin/campaigns`);
    const data = await res.json();
    const camp = data.find((c: any) => c.id === campaignId);
    setActiveCampaign(camp);
  }

  useEffect(() => { fetchRaffles(); fetchCampaign(); }, [campaignId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'raffles');
    try {
       const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
       const data = await res.json();
       if (data.url) setImageUrl(data.url);
    } catch (err) { alert("Error al subir imagen"); }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    if (!campaignId) return;
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const qty = parseInt(formData.get('quantity') as string) || 1;
      const data = {
        campaign_id: campaignId,
        prize_name: formData.get('prize_name'),
        description: formData.get('description'),
        draw_order: qty,
        prize_image: imageUrl,
        status: 'active'
      };

      const res = await fetch('/api/admin/raffles', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        setShowModal(false);
        setImageUrl('');
        fetchRaffles();
      } else {
        const err = await res.json();
        alert("Error al guardar: " + (err.error || "Desconocido"));
      }
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este premio?")) return;
    try {
       const res = await fetch(`/api/admin/raffles?id=${id}`, { method: 'DELETE' });
       if (res.ok) fetchRaffles();
       else alert("No se pudo eliminar");
    } catch (err) { alert("Error de conexión"); }
  };

  if (!campaignId) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
         <h1 className="text-gradient-cyan" style={{ fontSize: '2.5rem' }}>🎁 Gestionar Premios</h1>
         <p style={{ color: '#64748b', marginTop: '1rem' }}>Selecciona una campaña para ver/editar sus sorteos.</p>
         <Link href="/admin/campaigns" className="btn-add-pro" style={{ display: 'inline-block', marginTop: '2rem' }}>Lista de Campañas</Link>
      </div>
    );
  }

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
         <div>
            <h1 className="text-gradient-cyan" style={{ fontSize: '2.2rem', fontWeight: 900 }}>🎁 Premios del Sorteo</h1>
            <p style={{ color: '#64748b', marginTop: '0.3rem' }}>
              Campaña: <span style={{ color: '#1e1b4b', fontWeight: 700 }}>{activeCampaign?.name || '...'}</span>
            </p>
         </div>
         <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => setShowModal(true)} className="btn-add-pro">+ Agregar Premio</button>
            <Link href="/admin/campaigns" className="btn-cancel-pro" style={{ padding: '0.7rem 1.2rem' }}>← Volver</Link>
         </div>
      </header>

      {/* Empty state */}
      {!loading && raffles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '1.5rem', border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
          <h3 style={{ color: '#1e293b', fontSize: '1.3rem', fontWeight: 700 }}>No hay premios registrados</h3>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Agrega el primer premio para este sorteo.</p>
        </div>
      )}

      {/* Prize Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
         {loading ? (
           <p style={{ color: '#94a3b8', padding: '2rem' }}>Cargando premios...</p>
         ) : (
           raffles.map(r => (
             <div key={r.id} style={{
               background: '#fff',
               borderRadius: '1.2rem',
               border: '1px solid #e2e8f0',
               overflow: 'hidden',
               boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
               transition: 'transform 0.2s, box-shadow 0.2s',
             }}>
                {/* Image */}
                <div style={{ position: 'relative', height: '200px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                   <img
                     src={r.prize_image || 'https://plchldr.co/i/400x200?&bg=eee&fc=999&text=Sin+Imagen'}
                     alt={r.prize_name}
                     style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }}
                   />
                   {/* Quantity badge */}
                   <div style={{
                     position: 'absolute', top: '0.75rem', right: '0.75rem',
                     background: '#1e1b4b', color: '#fff',
                     padding: '0.3rem 0.75rem', borderRadius: '2rem',
                     fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.3px'
                   }}>
                     x{r.draw_order} {r.draw_order === 1 ? 'unidad' : 'unidades'}
                   </div>
                </div>
                {/* Info */}
                <div style={{ padding: '1.25rem 1.5rem' }}>
                   <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 800, marginBottom: '0.4rem' }}>{r.prize_name}</h3>
                   <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', minHeight: '2.5em' }}>
                     {r.description || 'Sin descripción.'}
                   </p>
                </div>
                {/* Actions */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem' }}>
                   <Link
                     href={`/admin/winners?raffleId=${r.id}`}
                     style={{ flex: 2, background: '#1e1b4b', color: '#fff', textAlign: 'center', padding: '0.65rem', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem', transition: 'background 0.15s' }}
                   >
                     🏆 Elegir Ganador
                   </Link>
                   <button
                     onClick={() => handleDelete(r.id)}
                     className="btn-action-minimal"
                     style={{ borderColor: '#fee2e2', color: '#ef4444' }}
                   >
                     🗑️
                   </button>
                </div>
             </div>
           ))
         )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-scale-in">
             <h2>Nuevo Premio del Sorteo</h2>
             <form onSubmit={handleCreate}>

                <div style={{ marginBottom: '1.25rem' }}>
                   <label className="form-label">Nombre del Premio *</label>
                   <input name="prize_name" type="text" placeholder="Ej: PlayStation 5 Slim" required className="form-input-pro" style={{ marginTop: '0.35rem' }} />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                   <label className="form-label">Descripción</label>
                   <textarea name="description" className="form-input-pro" style={{ height: '80px', marginTop: '0.35rem', resize: 'vertical' }}></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                   <div>
                      <label className="form-label">Cantidad a Sortearse *</label>
                      <input name="quantity" type="number" min="1" placeholder="1" required className="form-input-pro" style={{ marginTop: '0.35rem' }} />
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.3rem', display: 'block' }}>Unidades de este premio</span>
                   </div>
                   <div>
                      <label className="form-label">Imagen del Premio</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="form-input-pro" style={{ marginTop: '0.35rem', fontSize: '0.78rem', cursor: 'pointer' }} />
                   </div>
                </div>

                {imageUrl && (
                  <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <img src={imageUrl} style={{ width: '96px', height: '64px', objectFit: 'contain', borderRadius: '0.5rem', background: '#e2e8f0' }} alt="Preview" />
                     <p style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>✅ Imagen lista para guardar</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                   <button type="submit" className="btn-save-pro" disabled={saving} style={{ flex: 2 }}>
                     {saving ? 'Guardando...' : 'Guardar Premio'}
                   </button>
                   <button type="button" onClick={() => setShowModal(false)} className="btn-cancel-pro" style={{ flex: 1 }}>
                     Cancelar
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .btn-add-pro {
          background: #1e1b4b; color: #fff; padding: 0.75rem 1.5rem;
          border-radius: 0.8rem; border: none; font-weight: 700;
          font-size: 0.92rem; cursor: pointer; text-decoration: none;
          display: inline-block; transition: background 0.15s;
        }
        .btn-add-pro:hover { background: #2563eb; }
      `}</style>
    </div>
  );
}

export default function RafflesAdmin() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center', color: '#64748b' }}>Cargando...</div>}>
      <RafflesAdminContent />
    </Suspense>
  );
}
