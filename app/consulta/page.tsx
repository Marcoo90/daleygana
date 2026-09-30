"use client";
import { useState } from 'react';
import Link from 'next/link';
import { getImageUrl, formatDate } from '@/lib/utils';

export default function ConsultaPage() {
  const [dni, setDni] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal de Aumento de Chances dentro de Consulta
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(5);
  const [whatsapp, setWhatsapp] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent, customDni?: string) => {
    if (e) e.preventDefault();
    const searchDni = (customDni || dni).trim();
    if (searchDni === '') return;

    setIsLoading(true);
    setErrorMsg('');
    setHasSearched(false);
    setData(null);

    try {
      const resp = await fetch(`/api/tickets/lookup?dni=${searchDni}`);
      const resData = await resp.json();

      if (resp.ok) {
        setData(resData);
        if (resData.whatsapp) setWhatsapp(resData.whatsapp);
        setHasSearched(true);
      } else {
        setErrorMsg(resData.message || resData.error || 'No se encontraron registros para este DNI.');
        setHasSearched(true);
      }
    } catch (err) {
      setErrorMsg('Error de conexión con el servidor. Intenta nuevamente.');
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChancesModal = (raffle: any) => {
    setSelectedRaffle(raffle);
    setQuantity(5);
    setReceiptFile(null);
    setOrderSuccess(null);
    setIsModalOpen(true);
  };

  const handleBuyChancesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !selectedRaffle || !data?.campaign_id) {
      alert('Por favor sube tu comprobante de pago Yape/Plin.');
      return;
    }

    setSubmitting(true);
    try {
      const items = [{
        raffleId: selectedRaffle.raffle_id,
        prizeName: selectedRaffle.prize_name,
        quantity: quantity,
        unitPrice: Number(selectedRaffle.ticket_price || 1.00),
        subtotal: quantity * Number(selectedRaffle.ticket_price || 1.00)
      }];

      const formData = new FormData();
      formData.append('dni', data.dni);
      formData.append('nombres', data.participant_name?.split(' ')[0] || '');
      formData.append('apellidos', data.participant_name?.split(' ').slice(1).join(' ') || '');
      formData.append('whatsapp', whatsapp || data.whatsapp || '');
      formData.append('department', data.department || 'LIMA');
      formData.append('campaignId', data.campaign_id);
      formData.append('type', 'chances');
      formData.append('receipt', receiptFile);
      formData.append('items', JSON.stringify(items));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: formData
      });
      const resData = await res.json();

      if (res.ok) {
        setOrderSuccess(resData);
      } else {
        alert(resData.error || 'Error al procesar la orden.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div className="consulta-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 15px rgba(0, 229, 255, 0.4))' }}>🎟️</span>
        </div>
        <h2 className="hero-compact-title">
          Mis Participaciones y Tickets
        </h2>
        <p className="hero-compact-subtitle">
          Ingresa tu DNI para verificar tus participaciones y tickets generados en cada premio del sorteo.
        </p>

        <form onSubmit={handleSearch} className="consulta-form-wrapper">
          <div className="search-group">
            <input
              type="text"
              className="consulta-input"
              placeholder="Número de DNI (8 dígitos)"
              value={dni}
              onChange={(e) => {
                setDni(e.target.value.trim());
                if (hasSearched) setHasSearched(false);
              }}
              maxLength={8}
              required
            />
            <button
              type="submit"
              className="consulta-btn-blue"
              disabled={isLoading || dni.length < 8}
            >
              {isLoading ? '...' : 'CONSULTAR'}
            </button>
          </div>
        </form>

        {/* Mensaje de error / no encontrado */}
        {hasSearched && errorMsg && (
          <div className="animate-fade-in" style={{ marginTop: '2.5rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '2px dashed #ef4444', padding: '2rem', borderRadius: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#ff4d4d', marginBottom: '0.8rem', fontWeight: 900 }}>
                {errorMsg}
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.5' }}>
                Si aún no te has registrado, adquiere tu <strong>Pase General (S/ 10)</strong> para participar automáticamente en todos los premios.
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <Link href="/registro?type=base" className="btn-cyan-v5" style={{ display: 'inline-block', padding: '0.8rem 1.8rem', fontSize: '0.95rem' }}>
                  PARTICIPAR AHORA POR S/ 10
                </Link>
              </div>
            </div>

            <a href="https://wa.me/51953496746" target="_blank" rel="noopener noreferrer" className="consulta-whatsapp" style={{ marginTop: '1.5rem', background: '#25D366' }}>
              SOPORTE WHATSAPP ONLINE <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>💬</span>
            </a>
          </div>
        )}

        {/* RESULTADO DE LA CONSULTA */}
        {hasSearched && data && (
          <div className="animate-fade-in" style={{ marginTop: '2.5rem', textAlign: 'left' }}>
            {/* Encabezado del Participante */}
            <div style={{ background: 'var(--bg-card-secondary)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border-focus)', boxShadow: 'var(--card-shadow)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-yellow-contrast)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Participante Oficial
                  </span>
                  <h3 style={{ color: 'var(--text-heading)', fontSize: '2rem', fontWeight: 950, marginTop: '0.2rem' }}>
                    {data.participant_name?.toUpperCase()}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.3rem' }}>
                    Campaña: <strong style={{ color: 'var(--accent-cyan-contrast)' }}>{data.campaign_name}</strong> • Sorteo: {formatDate(data.draw_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <div style={{ background: 'rgba(2, 132, 199, 0.12)', padding: '0.4rem 1rem', borderRadius: '2rem', border: '1px solid var(--border-focus)', color: 'var(--accent-cyan-contrast)', fontWeight: 800, fontSize: '0.9rem' }}>
                    DNI: {data.dni}
                  </div>
                  {data.is_base_validated ? (
                    <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 800 }}>✅ Pase General Validado (S/ 10)</span>
                  ) : (
                    <span style={{ color: '#eab308', fontSize: '0.8rem', fontWeight: 800 }}>⏳ En proceso de validación</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN: MIS PARTICIPACIONES POR PREMIO (DESGLOSE BASE + TICKETS ADICIONALES) */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.6rem', color: 'var(--text-heading)', fontWeight: 950 }}>
                    🎁 Mis Participaciones por Premio
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Tus chances y tickets asociados específicamente a cada premio del sorteo.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {data.participations_by_prize?.map((p: any) => (
                  <div key={p.raffle_id} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '1.4rem',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--card-shadow)'
                  }}>
                    <div>
                      {/* Imagen y Badge Naranja */}
                      <div className="prize-img-box-clean" style={{ height: '180px' }}>
                        <div className="prize-number-badge-orange">
                          {p.draw_order || 1}
                        </div>
                        <img
                          src={getImageUrl(p.prize_image)}
                          alt={p.prize_name}
                          className="prize-img-clean"
                        />
                      </div>

                      <div style={{ padding: '1.4rem' }}>
                        <h4 style={{ color: 'var(--text-heading)', fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.8rem' }}>
                          {p.prize_name}
                        </h4>

                        {/* 1. PARTICIPACIÓN BASE */}
                        <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', padding: '0.8rem', borderRadius: '0.8rem', marginBottom: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan-contrast)', fontWeight: 800 }}>
                              🎟️ Participación Base (Pase General S/ 10):
                            </span>
                            <span style={{ fontWeight: 900, color: 'var(--text-heading)' }}>{p.base_participation} chance</span>
                          </div>
                          {p.base_tickets && p.base_tickets.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                              {p.base_tickets.map((code: string) => (
                                <span key={code} style={{ background: 'var(--bg-card-tertiary)', color: 'var(--text-heading)', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                                  {code}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. TICKETS ADICIONALES ESPECÍFICOS DE ESTE PREMIO */}
                        <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)', padding: '0.8rem', borderRadius: '0.8rem', marginBottom: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: 800 }}>
                              ⚡ Tickets Adicionales para {p.prize_name}:
                            </span>
                            <span style={{ fontWeight: 950, color: 'var(--accent-yellow-contrast)', fontSize: '1rem' }}>
                              +{p.additional_tickets} {p.additional_tickets === 1 ? 'ticket' : 'tickets'}
                            </span>
                          </div>

                          {p.additional_ticket_codes && p.additional_ticket_codes.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                              {p.additional_ticket_codes.map((code: string) => (
                                <span key={code} style={{ background: 'linear-gradient(135deg, #7e22ce, #00e5ff)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                                  {code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Sin tickets adicionales comprados aún para este premio.
                            </p>
                          )}
                        </div>

                        {/* 3. TOTAL CHANCES EN ESTE PREMIO */}
                        <div style={{ background: 'var(--bg-card-secondary)', padding: '0.9rem 1.1rem', borderRadius: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
                          <div>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-heading)', fontWeight: 800, display: 'block' }}>
                              TOTAL EN ESTE PREMIO:
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              ({p.base_participation} Base + {p.additional_tickets} Adicionales)
                            </span>
                          </div>
                          <span style={{ color: 'var(--accent-yellow-contrast)', fontSize: '1.4rem', fontWeight: 950 }}>
                            {p.total_participations} {p.total_participations === 1 ? 'chance' : 'chances'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BOTÓN AUMENTAR CHANCES (FUNCIONA DIRECTAMENTE AQUÍ) */}
                    <div style={{ padding: '0 1.4rem 1.4rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenChancesModal(p)}
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, #7e22ce, #00e5ff)',
                          color: '#fff',
                          border: 'none',
                          padding: '0.85rem',
                          borderRadius: '0.8rem',
                          fontWeight: 950,
                          fontSize: '0.9rem',
                          letterSpacing: '0.5px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(0, 229, 255, 0.25)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        🚀 Aumentar Chances (+S/ {Number(p.ticket_price || 1.00).toFixed(2)})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTÓN PARA VOLVER A LA PÁGINA PRINCIPAL */}
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <Link href="/" className="btn-cyan-v5" style={{ display: 'inline-block', width: 'auto', padding: '0.9rem 2.5rem' }}>
                ← Volver a la Página Principal
              </Link>
            </div>
          </div>
        )}

        {/* MODAL PARA AUMENTAR CHANCES DIRECTAMENTE EN CONSULTA */}
        {isModalOpen && selectedRaffle && (
          <div className="modal-backdrop-pro">
            <div className="modal-box-pro animate-scale-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan-contrast)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Comprar tickets adicionales
                  </span>
                  <h3 style={{ fontSize: '1.5rem', color: 'var(--text-heading)', fontWeight: 950, marginTop: '0.2rem' }}>
                    🎁 {selectedRaffle.prize_name}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="btn-close-modal">✕</button>
              </div>

              {orderSuccess ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <span style={{ fontSize: '3.5rem' }}>🎉</span>
                  <h3 style={{ color: 'var(--accent-cyan-contrast)', fontSize: '1.6rem', fontWeight: 950, margin: '0.8rem 0 0.3rem' }}>
                    ¡COMPROBANTE ENVIADO!
                  </h3>
                  <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                    Tu compra de <strong>{quantity} tickets adicionales</strong> para <strong>{selectedRaffle.prize_name}</strong> ha sido recibida.<br />
                    Orden: <strong style={{ color: 'var(--accent-yellow-contrast)' }}>{orderSuccess.order_code}</strong>
                  </p>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setOrderSuccess(null);
                      handleSearch(undefined, data.dni);
                    }}
                    className="btn-cyan-v5"
                    style={{ padding: '0.8rem 2rem', fontSize: '0.95rem', width: 'auto', display: 'inline-block' }}
                  >
                    🔄 Actualizar Mis Participaciones
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBuyChancesSubmit}>
                  {/* Selector de Cantidad */}
                  <div style={{ margin: '1rem 0' }}>
                    <label style={{ display: 'block', color: 'var(--text-sub)', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                      ¿Cuántos tickets adicionales deseas? (S/ {Number(selectedRaffle.ticket_price || 1.00).toFixed(2)} c/u)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.8rem' }}>
                      {[1, 5, 10, 20].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setQuantity(n)}
                          style={{
                            background: quantity === n ? 'var(--accent-cyan-contrast)' : 'var(--bg-card-secondary)',
                            color: quantity === n ? '#fff' : 'var(--text-main)',
                            border: '1px solid ' + (quantity === n ? 'var(--accent-cyan-contrast)' : 'var(--border-subtle)'),
                            padding: '0.5rem',
                            borderRadius: '0.6rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          +{n} {n === 1 ? 'ticket' : 'tickets'}
                        </button>
                      ))}
                    </div>

                    {/* Selector - / + */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--bg-card-secondary)', padding: '0.6rem', borderRadius: '0.8rem', border: '1px solid var(--border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'var(--nav-link-bg)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', fontSize: '1.3rem', fontWeight: 900, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '70px', textAlign: 'center', background: 'transparent', border: 'none', color: 'var(--text-heading)', fontSize: '1.6rem', fontWeight: 950, outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'var(--accent-cyan-contrast)', color: '#fff', border: 'none', fontSize: '1.3rem', fontWeight: 900, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Resumen de Total */}
                  <div style={{ background: 'var(--bg-card-secondary)', padding: '0.9rem', borderRadius: '0.8rem', border: '1px solid var(--border-subtle)', marginBottom: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>Participaciones actuales en este premio:</span>
                      <strong style={{ color: 'var(--text-heading)' }}>{selectedRaffle.total_participations || 1}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      <span>Nuevas participaciones totales:</span>
                      <strong style={{ color: 'var(--accent-yellow-contrast)' }}>{(selectedRaffle.total_participations || 1) + quantity}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: 'var(--text-heading)', fontWeight: 900, borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <span>TOTAL A PAGAR:</span>
                      <span style={{ color: '#22c55e', fontSize: '1.3rem', fontWeight: 950 }}>
                        S/ {(quantity * Number(selectedRaffle.ticket_price || 1.00)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp de contacto */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Número de WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      required
                      placeholder="987654321"
                      className="consulta-input"
                      style={{ height: '42px', fontSize: '0.95rem' }}
                    />
                  </div>

                  {/* Caja Yape / Plin */}
                  <div className="yape-box" style={{ border: '2px solid #742384', padding: '0.8rem', margin: '0.8rem 0', borderRadius: '0.8rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-heading)', fontWeight: 900, fontSize: '0.85rem' }}>
                      PAGA S/ {(quantity * Number(selectedRaffle.ticket_price || 1.00)).toFixed(2)} CON YAPE / PLIN
                    </p>
                    <img src="/images/yape.jpeg" alt="QR" style={{ width: '110px', borderRadius: '0.6rem', display: 'block', margin: '0.4rem auto' }} />
                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-heading)' }}>ALEX ALVARO GONZALES</p>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--accent-yellow-contrast)', margin: '0.1rem 0' }}>959721395</h4>
                  </div>

                  {/* Subir Comprobante */}
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label className="file-upload-btn" style={{ padding: '0.8rem', cursor: 'pointer', display: 'block', borderRadius: '0.8rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>📸</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)', marginTop: '0.2rem' }}>
                        {receiptFile ? receiptFile.name : 'Selecciona tu foto/captura del voucher'}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        style={{ display: 'none' }}
                        onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-cyan-v5"
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 950 }}
                  >
                    {submitting ? 'ENVIANDO PAGO...' : `🚀 ENVIAR PAGO DE S/ ${(quantity * Number(selectedRaffle.ticket_price || 1.00)).toFixed(2)}`}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Horarios de Atención */}
        <div style={{ marginTop: '4rem', padding: '2rem', background: 'var(--bg-card-secondary)', borderRadius: '1rem', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--accent-cyan-contrast)', fontWeight: 800 }}>HORARIO DE ATENCIÓN SOPORTE:</h4>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 900, marginBottom: '0.2rem', fontSize: '1rem', color: 'var(--text-heading)' }}>LUNES A SÁBADO</p>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>9:00 a.m - 9:00 p.m</p>
            </div>
            <div>
              <p style={{ fontWeight: 900, marginBottom: '0.2rem', fontSize: '1rem', color: 'var(--text-heading)' }}>DOMINGOS</p>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>9:00 a.m - 8:00 p.m</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop-pro {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .modal-box-pro {
          background: var(--bg-modal);
          border: 1px solid var(--border-focus);
          border-radius: 1.8rem;
          padding: 2rem;
          width: 100%;
          max-width: 480px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: var(--card-shadow);
        }
        .btn-close-modal {
          background: var(--nav-link-bg);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
        }
        .animate-scale-in {
          animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
