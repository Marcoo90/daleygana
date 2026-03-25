"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ProductsAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const fetchProducts = async () => {
    if (!campaignId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/admin/products?campaignId=${campaignId}`);
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchCampaign = async () => {
    if (!campaignId) return;
    try {
      const res = await fetch(`/api/admin/campaigns`);
      const data = await res.json();
      const camp = data.find((c: any) => c.id === campaignId);
      setActiveCampaign(camp);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { 
    fetchProducts(); 
    fetchCampaign(); 
  }, [campaignId]);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        campaign_id: campaignId,
        name: formData.get('name'),
        product_type: formData.get('product_type'),
        price: parseFloat(formData.get('price') as string),
        tickets_count: parseInt(formData.get('tickets_count') as string),
        description: formData.get('description'),
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
         setShowModal(false);
         fetchProducts();
      } else {
         const err = await res.json();
         alert("Error: " + err.error);
      }
    } catch (err) { alert("Error al guardar"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
       const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
       if (res.ok) fetchProducts();
       else alert("No se pudo eliminar");
    } catch (err) { alert("Error de conexión"); }
  };

  if (!campaignId) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
         <h1 className="text-gradient-cyan" style={{ fontSize: '2.5rem' }}>📦 Selecciona una Campaña</h1>
         <p style={{ color: '#64748b', marginTop: '1rem' }}>Debes entrar desde la lista de campañas para gestionar sus productos.</p>
         <Link href="/admin/campaigns" className="btn-add-pro" style={{ display: 'inline-block', marginTop: '2rem' }}>Ir a Campañas</Link>
      </div>
    );
  }

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', alignItems: 'center' }}>
         <div>
            <h1 className="text-gradient-cyan" style={{ fontSize: '2.5rem', fontWeight: 950 }}>📂 Catálogo de Productos</h1>
            <p style={{ color: '#64748b' }}>Campaña: <span style={{ color: '#1e1b4b', fontWeight: 800 }}>{activeCampaign?.name || 'Cargando...'}</span></p>
         </div>
         <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setShowModal(true)} className="btn-add-pro">+ Nuevo Producto</button>
            <Link href="/admin/campaigns" className="btn-cancel-pro">Volver</Link>
         </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
         {loading ? (
           <p>Cargando productos...</p>
         ) : products.length === 0 ? (
           <div style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', background: '#fff', borderRadius: '2rem', border: '1px dashed #cbd5e1' }}>
              <h3 style={{ color: '#1e293b' }}>No hay productos configurados</h3>
              <p style={{ color: '#64748b' }}>Empieza por añadir el Registro Base de S/ 40</p>
           </div>
         ) : (
           products.map(p => (
              <div key={p.id} className="card-pro" style={{ 
                borderBottom: `6px solid ${p.product_type === 'base_registration' ? '#f59e0b' : '#6366f1'}` 
              }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 900, color: p.product_type === 'base_registration' ? '#d97706' : '#4f46e5' }}>
                      {p.product_type === 'base_registration' ? '⭐ Registro Base' : '🎟️ Pack de Tickets'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>ID: {p.id.slice(0,8)}</span>
                 </div>
                 <h3 style={{ color: '#1e293b', fontSize: '1.4rem', fontWeight: 800 }}>{p.name}</h3>
                 <div style={{ margin: '1.5rem 0' }}>
                    <p style={{ fontSize: '2.5rem', fontWeight: 950, color: '#1e1b4b' }}>S/ {p.price}</p>
                    <p style={{ color: '#2563eb', fontWeight: 800, fontSize: '1rem' }}>{p.tickets_count} Tickets Otorgados</p>
                 </div>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-action-minimal" style={{ flex: 1 }}>Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="btn-action-minimal" style={{ flex: 1, borderColor: '#fee2e2', color: '#ef4444' }}>Eliminar</button>
                 </div>
              </div>
           ))
         )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-scale-in">
             <h2 style={{ marginBottom: '2rem', color: '#1e1b4b', fontWeight: 900 }}>Configurar Producto</h2>
             <form onSubmit={handleCreate}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Nombre del Producto</label>
                   <input name="name" type="text" placeholder="Ej: Registro Base Mayo" required className="form-input-pro" />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Tipo de Producto</label>
                   <select name="product_type" className="form-input-pro" style={{ width: '100%' }} required>
                      <option value="base_registration">Registro Base (Mandatorio)</option>
                      <option value="ticket_pack">Pack de Tickets Extra</option>
                   </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Precio (S/)</label>
                      <input name="price" type="number" step="0.01" placeholder="40.00" required className="form-input-pro" />
                   </div>
                   <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>Cantidad Tickets</label>
                      <input name="tickets_count" type="number" placeholder="1" required className="form-input-pro" />
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                   <button type="submit" className="btn-save-pro" disabled={saving}>{saving ? 'GUARDANDO...' : 'GUARDAR'}</button>
                   <button type="button" onClick={() => setShowModal(false)} className="btn-cancel-pro">CANCELAR</button>
                </div>
             </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .btn-add-pro { background: #1e1b4b; color: #fff; padding: 0.8rem 1.5rem; border-radius: 1rem; border: none; font-weight: 800; cursor: pointer; transition: transform 0.2s; }
        .btn-add-pro:hover { transform: scale(1.02); }
        .card-pro { background: #ffffff; padding: 1.5rem; border-radius: 1.8rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .btn-cancel-pro { flex: 1; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 1.2rem; cursor: pointer; text-align: center; font-weight: 800; text-decoration: none; }
      `}</style>
    </div>
  );
}

export default function ProductsAdmin() {
  return (
    <Suspense fallback={<div>Cargando Módulo...</div>}>
      <ProductsAdminContent />
    </Suspense>
  );
}
