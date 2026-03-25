"use client";
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function WinnersAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raffleId = searchParams.get('raffleId');
  
  const [ticketSearch, setTicketSearch] = useState('');
  const [foundTicket, setFoundTicket] = useState<any>(null);
  const [testimonial, setTestimonial] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const searchWinnerTicket = async () => {
    if (!ticketSearch) return;
    setLoading(true);
    setFoundTicket(null);
    try {
        const res = await fetch(`/api/admin/tickets?ticketCode=${ticketSearch.toUpperCase()}`);
        const result = await res.json();
        if (result.data) {
            setFoundTicket(result.data);
        } else {
            alert("Ticket no encontrado");
        }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'winners');
    try {
       const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
       const data = await res.json();
       if (data.url) setImageUrl(data.url);
    } catch (err) { alert("Error al subir imagen"); }
    setUploading(false);
  };

  const publishWinner = async () => {
    if (!foundTicket || !raffleId) return;
    setLoading(true);
    try {
        const res = await fetch('/api/admin/winners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             raffleId: raffleId,
             ticketId: foundTicket.id,
             visible_name: `${foundTicket.participants.first_name} ${foundTicket.participants.last_name}`,
             visible_ticket_code: foundTicket.ticket_code,
             testimonial: testimonial,
             winner_image: imageUrl
          })
        });
        if (res.ok) {
           alert("🎉 GANADOR PROCLAMADO EXITOSAMENTE");
           router.push('/admin/campaigns');
        } else {
           const err = await res.json();
           alert("Error: " + err.error);
        }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h1 className="text-gradient-cyan" style={{ fontSize: '2.5rem', fontWeight: 950 }}>🏆 Proclamación de Ganador</h1>
            <p style={{ color: '#64748b' }}>Busca el ticket ganador y publica el resultado oficial.</p>
         </div>
         <Link href="/admin/campaigns" className="btn-cancel-pro">Cancelar</Link>
      </header>

      <div className="card-glass-pro">
         {/* PASO 1 */}
         <div style={{ marginBottom: '3rem' }}>
            <h3 className="section-title-cyan">1. BUSCAR TICKET AFORTUNADO</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <input 
                  type="text" 
                  placeholder="Código de Ticket (Ej: DYG-MAR26-0001)" 
                  className="form-input-pro" 
                  value={ticketSearch}
                  onChange={e => setTicketSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchWinnerTicket()}
               />
               <button onClick={searchWinnerTicket} className="btn-search-glow" disabled={loading}>
                  {loading ? '...' : 'BUSCAR'}
               </button>
            </div>
         </div>

         {/* RESULTADO BUSQUEDA */}
         {foundTicket && (
            <div className="winner-found-box animate-scale-in">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                      <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 900, color: 'var(--accent-yellow)' }}>¡Ticket Encontrado!</p>
                      <h4 style={{ fontWeight: 950, fontSize: '2.2rem', margin: '0.4rem 0' }}>{foundTicket.participants.first_name} {foundTicket.participants.last_name}</h4>
                      <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.8 }}>
                         <span>🎫 {foundTicket.ticket_code}</span>
                         <span>📄 DNI: {foundTicket.participants.dni}</span>
                      </div>
                  </div>
                  <div style={{ fontSize: '5rem' }}>✨</div>
               </div>
            </div>
         )}

         {/* PASO 2 */}
         {foundTicket && (
            <div className="animate-fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
               <h3 className="section-title-cyan">2. DETALLES DE LA PREMIACIÓN</h3>
               
               <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', color: '#94a3b8', fontWeight: 800 }}>Mensaje / Testimonio del Ganador</label>
                  <textarea 
                     placeholder="Ej: ¡Cumplimos el sueño! Camioneta 0km entregada en tiempo record." 
                     className="form-input-pro" 
                     style={{ height: '120px' }} 
                     value={testimonial}
                     onChange={e => setTestimonial(e.target.value)}
                  />
               </div>

               <div className="form-group" style={{ marginBottom: '3rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', color: '#94a3b8', fontWeight: 800 }}>Foto de la Entrega (Evidencia)</label>
                  <div className="file-box-pro">
                     <p style={{ marginBottom: '1rem', opacity: 0.6 }}>{uploading ? 'Subiendo...' : imageUrl ? '✅ Imagen Lista' : 'Selecciona una foto del ganador'}</p>
                     <input type="file" onChange={handleImageUpload} disabled={uploading} />
                     {imageUrl && <img src={imageUrl} style={{ height: '100px', marginTop: '1rem', borderRadius: '0.5rem' }} alt="Winner preview" />}
                  </div>
               </div>

               <button 
                  onClick={publishWinner} 
                  className="btn-proclaim-glow"
                  disabled={loading}
               >
                  {loading ? 'PUBLICANDO...' : 'PROCLAMAR GRAN GANADOR 🏆'}
               </button>
            </div>
         )}
      </div>

      <style jsx>{`
        .section-title-cyan { color: #1e1b4b; font-size: 0.9rem; font-weight: 950; letter-spacing: 2px; margin-bottom: 2rem; }
        .card-glass-pro { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 2.5rem; padding: 3.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.06); max-width: 800px; margin: 0 auto; }
        .form-input-pro { width: 100%; background: #fff; border: 1px solid #cbd5e1; color: #1e293b; padding: 1.2rem; border-radius: 1.2rem; font-size: 1.1rem; outline: none; transition: border-color 0.2s; }
        .form-input-pro:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .btn-search-glow { background: #1e1b4b; color: #fff; padding: 0 2rem; border-radius: 1.2rem; border: none; font-weight: 950; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-search-glow:hover { background: #2563eb; }
        .winner-found-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 2.5rem; border-radius: 2rem; margin-bottom: 3rem; color: #fff; box-shadow: 0 15px 40px rgba(5, 150, 105, 0.3); }
        .btn-proclaim-glow { width: 100%; background: #1e1b4b; color: #fff; padding: 1.5rem; border-radius: 1.5rem; border: none; font-size: 1.3rem; font-weight: 950; cursor: pointer; box-shadow: 0 4px 15px rgba(30,27,75,0.3); transition: all 0.3s; }
        .btn-proclaim-glow:hover { background: #2563eb; transform: translateY(-3px); box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4); }
        .btn-cancel-pro { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 0.8rem 1.5rem; border-radius: 1rem; text-decoration: none; font-weight: 800; transition: all 0.2s; }
        .btn-cancel-pro:hover { background: #1e1b4b; color: #fff; border-color: #1e1b4b; }
        .file-box-pro { border: 2px dashed #cbd5e1; padding: 2rem; border-radius: 1.5rem; text-align: center; background: #f8fafc; }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default function WinnersAdmin() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center', color: '#64748b' }}>Cargando Módulo...</div>}>
      <WinnersAdminContent />
    </Suspense>
  );
}
