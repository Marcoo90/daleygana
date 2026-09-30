"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function WinnersAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raffleIdFromUrl = searchParams.get('raffleId');

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [raffles, setRaffles] = useState<any[]>([]);
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>('');

  const [existingWinners, setExistingWinners] = useState<any[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // Formulario del Ganador Oficial
  const [winnerName, setWinnerName] = useState('');
  const [winnerDni, setWinnerDni] = useState('');
  const [winnerWhatsapp, setWinnerWhatsapp] = useState('');
  const [winnerTicketCode, setWinnerTicketCode] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Cargar campañas
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCampaigns(data);
        const active = data.find((c: any) => c.status === 'active') || data[0];
        if (active) setSelectedCampaignId(active.id);
      }
    } catch (e) { console.error(e); }
  };

  // Cargar premios de la campaña seleccionada
  const fetchRaffles = async (campId: string) => {
    if (!campId) return;
    try {
      const res = await fetch(`/api/admin/raffles?campaignId=${campId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setRaffles(data);
        if (raffleIdFromUrl) {
          setSelectedRaffleId(raffleIdFromUrl);
        } else if (data.length > 0) {
          setSelectedRaffleId(data[0].id);
        }
      }
    } catch (e) { console.error(e); }
  };

  // Cargar lista de ganadores publicados
  const fetchExistingWinners = async () => {
    setLoadingWinners(true);
    try {
      const res = await fetch('/api/public/winners');
      const data = await res.json();
      if (res.ok) setExistingWinners(data);
    } catch (e) { console.error(e); }
    setLoadingWinners(false);
  };

  useEffect(() => {
    fetchCampaigns();
    fetchExistingWinners();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchRaffles(selectedCampaignId);
    }
  }, [selectedCampaignId]);

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

  const handlePublishWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRaffleId) {
      alert("⚠️ Por favor selecciona el premio del sorteo.");
      return;
    }
    if (!winnerName.trim()) {
      alert("⚠️ El nombre del ganador es obligatorio.");
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/admin/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId: selectedRaffleId,
          visible_name: winnerName.trim(),
          visible_ticket_code: winnerTicketCode.trim() || `CH-${winnerDni || 'GANADOR'}`,
          testimonial: testimonial.trim(),
          winner_image_url: imageUrl || null
        })
      });

      if (res.ok) {
        alert("🎉 ¡GANADOR PUBLICADO EXITOSAMENTE EN LA WEB!");
        setWinnerName('');
        setWinnerDni('');
        setWinnerWhatsapp('');
        setWinnerTicketCode('');
        setTestimonial('');
        setImageUrl('');
        fetchExistingWinners();
      } else {
        const err = await res.json();
        alert("❌ Error: " + (err.error || 'No se pudo publicar'));
      }
    } catch (e: any) {
      alert("Error de conexión: " + e.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteWinner = async (winnerId: string, name: string) => {
    if (!confirm(`¿Deseas despublicar al ganador "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/winners?id=${winnerId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExistingWinners();
      } else {
        alert("No se pudo eliminar.");
      }
    } catch (e) {
      alert("Error al eliminar.");
    }
  };

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient-cyan" style={{ fontSize: '2.2rem', fontWeight: 950 }}>
            🏆 Proclamación y Galería de Ganadores
          </h1>
          <p style={{ color: '#64748b' }}>
            Ingresa los datos del ganador obtenido en el sorteo para publicarlo oficialmente en la web.
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* FORMULARIO DE PUBLICACIÓN DE GANADOR */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#1e1b4b', fontSize: '1.3rem', fontWeight: 950, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span> Registrar y Publicar Ganador
          </h2>

          <form onSubmit={handlePublishWinner}>
            {/* Selección de Campaña y Premio */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label className="form-label">1. Campaña</label>
                <select
                  value={selectedCampaignId}
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  className="form-input-pro"
                  required
                >
                  <option value="">Selecciona Campaña...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">2. Premio Sorteado *</label>
                <select
                  value={selectedRaffleId}
                  onChange={e => setSelectedRaffleId(e.target.value)}
                  className="form-input-pro"
                  required
                >
                  <option value="">Selecciona Premio...</option>
                  {raffles.map(r => (
                    <option key={r.id} value={r.id}>🎁 {r.prize_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Datos del Ganador */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Nombre Completo del Ganador *</label>
              <input
                type="text"
                placeholder="Ej: Juan Carlos Pérez Silva"
                value={winnerName}
                onChange={e => setWinnerName(e.target.value)}
                required
                className="form-input-pro"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label className="form-label">DNI del Ganador</label>
                <input
                  type="text"
                  placeholder="8 dígitos"
                  maxLength={8}
                  value={winnerDni}
                  onChange={e => setWinnerDni(e.target.value.trim())}
                  className="form-input-pro"
                />
              </div>
              <div>
                <label className="form-label">WhatsApp / Teléfono</label>
                <input
                  type="tel"
                  placeholder="987654321"
                  value={winnerWhatsapp}
                  onChange={e => setWinnerWhatsapp(e.target.value)}
                  className="form-input-pro"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Código del Ticket / Chance Ganador *</label>
              <input
                type="text"
                placeholder="Ej: CH-7A4B-8921-03 o CH-BASE-1240"
                value={winnerTicketCode}
                onChange={e => setWinnerTicketCode(e.target.value.toUpperCase())}
                required
                className="form-input-pro"
                style={{ fontWeight: 800, color: '#1e1b4b', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label className="form-label">Testimonio o Mensaje de Entrega</label>
              <textarea
                placeholder="Ej: ¡Felicidades a nuestro afortunado ganador de Lima! Premio entregado en tiempo récord."
                value={testimonial}
                onChange={e => setTestimonial(e.target.value)}
                className="form-input-pro"
                style={{ height: '80px', resize: 'vertical' }}
              />
            </div>

            {/* Foto de la Entrega */}
            <div style={{ marginBottom: '1.8rem' }}>
              <label className="form-label">Foto de la Entrega (Evidencia Oficial)</label>
              <div style={{ border: '2px dashed #cbd5e1', padding: '1.2rem', borderRadius: '1rem', textAlign: 'center', background: '#f8fafc' }}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  {uploading ? 'Subiendo foto...' : imageUrl ? '✅ Foto lista para publicar' : 'Selecciona una foto del ganador con su premio'}
                </p>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ fontSize: '0.82rem' }} />
                {imageUrl && (
                  <img src={imageUrl} style={{ height: '100px', marginTop: '0.8rem', borderRadius: '0.6rem', objectFit: 'contain', display: 'block', margin: '0.8rem auto 0' }} alt="Preview" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={publishing || uploading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #1e1b4b, #2563eb)',
                color: '#fff',
                padding: '1.1rem',
                borderRadius: '1rem',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 950,
                cursor: publishing ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)',
                transition: 'transform 0.2s'
              }}
            >
              {publishing ? 'PUBLICANDO...' : '🏆 PROCLAMAR Y PUBLICAR GANADOR OFICIAL'}
            </button>
          </form>
        </div>

        {/* LISTADO DE GANADORES PUBLICADOS */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#1e1b4b', fontSize: '1.2rem', fontWeight: 950, marginBottom: '1rem' }}>
              🎉 Ganadores Publicados ({existingWinners.length})
            </h3>

            {loadingWinners ? (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>Cargando...</p>
            ) : existingWinners.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>Aún no se han publicado ganadores.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {existingWinners.map((w: any) => (
                  <div key={w.id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img
                        src={w.winner_image_url || 'https://plchldr.co/i/80x60?&bg=111&fc=fff&text=Foto'}
                        alt={w.visible_name}
                        style={{ width: '70px', height: '55px', objectFit: 'cover', borderRadius: '0.6rem' }}
                      />
                      <div>
                        <h4 style={{ color: '#1e1b4b', fontWeight: 900, fontSize: '0.95rem' }}>{w.visible_name}</h4>
                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>🎁 {w.raffle?.prize_name || 'Premio'}</p>
                        <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.78rem' }}>
                          Ticket: {w.visible_ticket_code}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteWinner(w.id, w.visible_name)}
                      className="btn-action-minimal"
                      style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function WinnersAdmin() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center', color: '#64748b' }}>Cargando...</div>}>
      <WinnersAdminContent />
    </Suspense>
  );
}
