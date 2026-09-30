"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './globals.css';
import { getImageUrl, formatDate } from '@/lib/utils';
import { getActiveCampaignData, getWinnersList } from '@/lib/api/public';
import Countdown from '@/lib/components/Countdown';

interface CartItem {
  raffleId: string;
  prizeName: string;
  prizeImage?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export default function Home() {
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [raffles, setRaffles] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados del Modal de Chances
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados del Carrito de Chances
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estados del Checkout de Chances
  const [dni, setDni] = useState('');
  const [checkingDni, setCheckingDni] = useState(false);
  const [dniVerified, setDniVerified] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [dniError, setDniError] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [department, setDepartment] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<any>(null);

  const departamentos = [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco",
    "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto",
    "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
  ];

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      const campData = await getActiveCampaignData();
      if (campData) {
        setActiveCampaign(campData.campaign);
        setRaffles(campData.raffles || []);
      }

      const winData = await getWinnersList();
      setWinners(winData);

      setLoading(false);
    };
    fetchData();
  }, []);

  const campaign = activeCampaign;

  // Abrir modal de chances para un premio
  const handleOpenModal = (raffle: any) => {
    setSelectedRaffle(raffle);
    setQuantity(1);
    setIsModalOpen(true);
  };

  // Agregar al carrito
  const handleAddToCart = (andOpenCart = false) => {
    if (!selectedRaffle) return;
    const unitPrice = Number(selectedRaffle.ticket_price || 1.00);
    const existingIndex = cart.findIndex(it => it.raffleId === selectedRaffle.id);

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * unitPrice;
      setCart(updated);
    } else {
      setCart(prev => [
        ...prev,
        {
          raffleId: selectedRaffle.id,
          prizeName: selectedRaffle.prize_name,
          prizeImage: selectedRaffle.prize_image || selectedRaffle.prize_image_url,
          unitPrice,
          quantity,
          subtotal: quantity * unitPrice
        }
      ]);
    }

    setIsModalOpen(false);
    if (andOpenCart) {
      setIsCartOpen(true);
    }
  };

  // Modificar cantidades en el carrito
  const updateCartQty = (raffleId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.raffleId === raffleId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (raffleId: string) => {
    setCart(prev => prev.filter(item => item.raffleId !== raffleId));
  };

  const totalCartQty = cart.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartAmount = cart.reduce((acc, it) => acc + it.subtotal, 0);

  // Verificar DNI antes de comprar chances
  const handleVerifyDni = async () => {
    if (!dni || dni.length < 8) {
      setDniError('Ingresa un DNI válido de 8 dígitos.');
      return;
    }
    if (!campaign?.id) return;

    setCheckingDni(true);
    setDniError('');
    setDniVerified(false);

    try {
      const res = await fetch(`/api/admin/participants/verify?dni=${dni}&campaignId=${campaign.id}`);
      const data = await res.json();

      if (data.registered) {
        setDniVerified(true);
        setVerifiedUser(data.participant);
        setWhatsapp(data.participant.whatsapp || '');
        setDepartment(data.participant.department || '');
      } else {
        setDniError(data.message || 'No se encontró un Registro Base validado para este DNI en la campaña actual.');
      }
    } catch (e) {
      setDniError('Error al conectar con el servidor.');
    } finally {
      setCheckingDni(false);
    }
  };

  // Enviar orden de chances
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dniVerified || !receiptFile || cart.length === 0 || !campaign?.id) {
      alert('Por favor verifica tu DNI y sube el comprobante de pago.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('dni', dni);
      formData.append('nombres', verifiedUser?.first_name || '');
      formData.append('apellidos', verifiedUser?.last_name || '');
      formData.append('whatsapp', whatsapp);
      formData.append('department', department);
      formData.append('campaignId', campaign.id);
      formData.append('type', 'chances');
      formData.append('receipt', receiptFile);
      formData.append('items', JSON.stringify(cart));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setCheckoutSuccess(data);
        setCart([]);
      } else {
        alert(data.error || 'Ocurrió un error al procesar la orden.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`container ${mounted ? 'fade-in-entry' : ''}`} style={{ minHeight: '100vh', paddingBottom: '6rem' }}>

      <main className="hero" style={{ padding: '1.5rem 0 4rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="benefit-badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>
            🔥 SORTEO OFICIAL DE LA CAMPAÑA
          </span>
          <h1 className="hero-mega-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', lineHeight: 1.15 }}>
            ¡PREMIOS DEL MES <br /> <span className="accent-cyan-text">{campaign?.name?.toUpperCase() || 'ACTIVO'}</span>!
          </h1>
          {/*<p className="hero-subtitle" style={{ fontSize: '1.15rem', color: '#cbd5e1', marginTop: '0.8rem' }}>
            ¡1 solo registro de S/ 10 te hace participar automáticamente en <strong style={{ color: '#fff' }}>TODOS los premios</strong>!
          </p>*/}
        </div>

        {/* CONTENEDOR PRINCIPAL: REGISTRO BASE */}
        <section className="campaign-section" style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', padding: '0 10px' }}>

          {loading ? (
            <div className="loading-state">
              <div className="animate-pulse">Cargando Sorteo...</div>
            </div>
          ) : (
            <div className="unified-card">

              <div className="card-header-v5">
                <div className="pill-event-top">
                  <span>PASE GENERAL: ACCESO A TODOS LOS PREMIOS</span>
                  <span className="star-icon">⭐</span>
                </div>

                <div className="price-layout-v5">
                  <span className="currency-v5">S/</span>
                  <span className="amount-v5">10.00</span>
                </div>

                <p className="card-hero-description" style={{ fontSize: '1.15rem', color: 'var(--text-sub)', fontWeight: 800, lineHeight: '1.5' }}>
                  Al pagar tu Registro Base de S/ 10 participas con <span style={{ color: 'var(--accent-cyan-contrast)' }}>1 oportunidad en CADA premio</span> activo de la campaña.
                </p>
              </div>

              {/* GRID DE PREMIOS INCLUIDOS */}
              {raffles.length > 0 && (
                <div className="prizes-section-v5">
                  <h3 className="section-subtitle-white">
                    🎁 <span className="accent-cyan-text">PREMIOS INCLUIDOS</span> EN TU REGISTRO BASE:
                  </h3>

                  <div className="v3-prize-grid">
                    {raffles.map((r: any) => (
                      <div key={r.id} className="v3-prize-card-clean">
                        {/* Contenedor de Imagen con fondo blanco y badge naranja */}
                        <div className="prize-img-box-clean">
                          {/* Badge numérico naranja en esquina superior izquierda */}
                          <div className="prize-number-badge-orange">
                            {r.draw_order || 1}
                          </div>
                          <img
                            src={getImageUrl(r.prize_image || r.prize_image_url)}
                            className="prize-img-clean"
                            alt={r.prize_name}
                            onError={(e) => {
                              e.currentTarget.src = `https://plchldr.co/i/600x400?&bg=fff&fc=000&text=${encodeURIComponent(r.prize_name)}`;
                            }}
                          />
                        </div>

                        {/* Barra inferior con nombre del premio */}
                        <div className="prize-footer-clean">
                          <h4 className="prize-title-clean">{r.prize_name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/registro?type=base" className="btn-cyan-v5" style={{ fontSize: '1.15rem', padding: '1.2rem' }}>
                ¡PARTICIPAR EN TODOS LOS PREMIOS POR S/ 10! 🚀
              </Link>
            </div>
          )}
        </section>

        {/* SECCIÓN 2: AUMENTO DE CHANCES POR PREMIO */}
        {mounted && raffles.length > 0 && (
          <section id="chances" style={{ padding: '5rem 0 3rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <span style={{ background: 'rgba(126, 34, 206, 0.15)', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)', padding: '0.4rem 1.2rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '0.8rem' }}>
                Multiplica tus posibilidades
              </span>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                HERMANITO, SI YA ESTÁS REGISTRADO 🚀
              </h3>
              <p style={{ color: 'var(--text-sub)', fontSize: '1.15rem', fontWeight: 700, maxWidth: '800px', margin: '0 auto' }}>
                Elige el premio que más quieras ganar y compra <span style={{ color: 'var(--accent-yellow-contrast)' }}>tickets adicionales</span>.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
              {raffles.map((r: any) => (
                <div key={r.id} className="v3-prize-card-clean">
                  {/* Contenedor de Imagen con fondo blanco y badge naranja */}
                  <div className="prize-img-box-clean">
                    <div className="prize-number-badge-orange">
                      {r.draw_order || 1}
                    </div>
                    <img
                      src={getImageUrl(r.prize_image || r.prize_image_url)}
                      alt={r.prize_name}
                      className="prize-img-clean"
                      onError={(e) => {
                        e.currentTarget.src = `https://plchldr.co/i/600x400?&bg=fff&fc=000&text=${encodeURIComponent(r.prize_name)}`;
                      }}
                    />
                  </div>

                  {/* Barra inferior con nombre y botón */}
                  <div className="prize-footer-clean">
                    <h4 className="prize-title-clean">{r.prize_name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                      {r.description || '1 participación base incluida'}
                    </p>
                    <button
                      onClick={() => handleOpenModal(r)}
                      className="btn-aumentar-chances"
                      style={{ width: '100%' }}
                    >
                      🚀 AUMENTAR CHANCES (+S/ {Number(r.ticket_price || 1.00).toFixed(2)})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN 3: CONSULTA DE PARTICIPACIONES */}
        <section style={{ maxWidth: '900px', margin: '4rem auto', padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '2rem', border: '1px solid var(--border-focus)', textAlign: 'center', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '3rem' }}>🎟️</span>
          <h3 style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--text-heading)', margin: '0.8rem 0 0.4rem' }}>
            ¿YA ESTÁS PARTICIPANDO?
          </h3>
          <p style={{ color: 'var(--text-sub)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            Consulta con tu DNI cuántas participaciones tienes acumuladas en cada premio del sorteo.
          </p>
          <Link href="/consulta" className="btn-cyan-v5" style={{ display: 'inline-block', width: 'auto', padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
            🎫 VER MIS PARTICIPACIONES Y TICKETS
          </Link>
        </section>

        {/* CONTADOR DE CIERRE DE VENTAS */}
        {campaign?.ticket_sales_end_at && (
          <Countdown targetDate={campaign.ticket_sales_end_at} />
        )}

        {/* ALERTA DE SEGURIDAD */}
        <div className="alert-fraud">
          <div className="alert-fraud-title">⚠️ ¡ALERTA DE SEGURIDAD! ⚠️</div>
          <p className="alert-fraud-text">Verifica siempre que el pago sea a nombre de:</p>
          <div className="alert-fraud-company">EL RINCON DEL MOLLO</div>
          <p className="alert-fraud-text" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            Si sale otro nombre, ¡ESTÁS SIENDO ESTAFADO!
          </p>
        </div>

        {/* SECCIÓN GANADORES */}
        <section style={{ padding: '6rem 0', position: 'relative', overflow: 'hidden', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', margin: '0 1.5rem 4rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '20%', width: '300px', height: '300px', background: 'var(--accent-purple)', filter: 'blur(150px)', opacity: 0.08, borderRadius: '50%', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', top: '20%', right: '10%', width: '400px', height: '400px', background: 'var(--accent-cyan-contrast)', filter: 'blur(180px)', opacity: 0.08, borderRadius: '50%', zIndex: 0 }}></div>

          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h2 className="hero-mega-title" style={{ fontSize: '3rem', marginBottom: '4.5rem' }}>
              GALERÍA DE NUESTROS GANADORES 📸
            </h2>

            <div className="ticker-container-v3">
              <div className="winners-carousel-v2">
                {winners.length > 0 ? (
                  [...winners, ...winners].map((w, idx) => (
                    <div key={idx} className="winner-photo-wrapper">
                      <img
                        src={w.winner_image_url || 'https://plchldr.co/i/400x300?&bg=111&fc=fff&text=Ganador'}
                        alt="Ganador"
                        className="winner-photo-img"
                      />
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Próximamente más ganadores...</p>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* MODAL: SELECCIÓN DE CHANCES PARA UN PREMIO */}
      {isModalOpen && selectedRaffle && (
        <div className="modal-backdrop-pro">
          <div className="modal-box-pro animate-scale-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan-contrast)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Aumenta tus probabilidades
                </span>
                <h3 style={{ fontSize: '1.6rem', color: 'var(--text-heading)', fontWeight: 950, marginTop: '0.2rem' }}>
                  🎁 {selectedRaffle.prize_name}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn-close-modal">✕</button>
            </div>

            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <img
                src={getImageUrl(selectedRaffle.prize_image || selectedRaffle.prize_image_url)}
                alt={selectedRaffle.prize_name}
                style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '1rem', background: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)', padding: '0.5rem' }}
              />
            </div>

            <div style={{ margin: '1.5rem 0' }}>
              <label style={{ display: 'block', color: 'var(--text-sub)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.8rem' }}>
                ¿Cuántos tickets adicionales quieres? (S/ {Number(selectedRaffle.ticket_price || 1.00).toFixed(2)} c/u)
              </label>

              {/* Botones rápidos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {[1, 5, 10, 20].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuantity(n)}
                    style={{
                      background: quantity === n ? 'var(--accent-cyan-contrast)' : 'var(--bg-card-secondary)',
                      color: quantity === n ? '#fff' : 'var(--text-main)',
                      border: '1px solid ' + (quantity === n ? 'var(--accent-cyan-contrast)' : 'var(--border-subtle)'),
                      padding: '0.6rem',
                      borderRadius: '0.75rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    +{n} {n === 1 ? 'ticket' : 'tickets'}
                  </button>
                ))}
              </div>

              {/* Selector interactivo - / + */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--bg-card-secondary)', padding: '0.8rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: 'var(--nav-link-bg)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', fontSize: '1.5rem', fontWeight: 900, cursor: 'pointer' }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '80px', textAlign: 'center', background: 'transparent', border: 'none', color: 'var(--text-heading)', fontSize: '1.8rem', fontWeight: 950, outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: 'var(--accent-cyan-contrast)', color: '#fff', border: 'none', fontSize: '1.5rem', fontWeight: 900, cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Desglose de Cálculo */}
            <div style={{ background: 'var(--bg-card-secondary)', padding: '1rem 1.2rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <span>Participación Base (Registro S/ 10):</span>
                <span style={{ color: 'var(--text-heading)', fontWeight: 700 }}>1 participación</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <span>Tickets adicionales a comprar:</span>
                <span style={{ color: 'var(--accent-cyan-contrast)', fontWeight: 800 }}>+{quantity} tickets</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-heading)', fontWeight: 800, borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Total de participaciones en este premio:</span>
                <span style={{ color: 'var(--accent-yellow-contrast)', fontSize: '1.2rem', fontWeight: 950 }}>{1 + quantity} participaciones</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: 'var(--text-heading)', fontWeight: 900, marginTop: '0.5rem' }}>
                <span>Total a pagar por estos tickets:</span>
                <span style={{ color: '#22c55e', fontSize: '1.3rem', fontWeight: 950 }}>
                  S/ {(quantity * Number(selectedRaffle.ticket_price || 1.00)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                className="btn-cart-secondary"
              >
                🛒 Agregar al Carrito
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                className="btn-cart-primary"
              >
                ⚡ Comprar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE DEL CARRITO */}
      {cart.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="floating-cart-btn animate-bounce"
        >
          <span>🛒</span>
          <span>Ver Carrito ({totalCartQty} tickets) • S/ {totalCartAmount.toFixed(2)}</span>
          <span style={{ marginLeft: '0.3rem' }}>→</span>
        </button>
      )}

      {/* DRAWER / MODAL DEL CARRITO DE CHANCES */}
      {isCartOpen && (
        <div className="modal-backdrop-pro">
          <div className="modal-box-pro cart-drawer animate-scale-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--text-heading)', fontWeight: 950 }}>
                🛒 Carrito de Chances ({totalCartQty} tickets)
              </h3>
              <button onClick={() => setIsCartOpen(false)} className="btn-close-modal">✕</button>
            </div>

            {checkoutSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <span style={{ fontSize: '4rem' }}>🎉</span>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--accent-cyan-contrast)', fontWeight: 950, margin: '1rem 0 0.5rem' }}>
                  ¡COMPROBANTE RECIBIDO!
                </h3>
                <p style={{ color: 'var(--text-sub)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Tu compra de tickets adicionales ha sido enviada para validación del administrador. <br />
                  Código de orden: <strong style={{ color: 'var(--accent-yellow-contrast)' }}>{checkoutSuccess.order_code}</strong>
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <Link href="/consulta" className="btn-cyan-v5" style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}>
                    Consultar Mis Participaciones
                  </Link>
                  <button
                    onClick={() => { setCheckoutSuccess(null); setIsCartOpen(false); }}
                    className="btn-cart-secondary"
                    style={{ padding: '0.8rem 1.5rem', borderRadius: '2rem' }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Lista de Items en el Carrito */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.3rem' }}>
                  {cart.map(item => (
                    <div key={item.raffleId} style={{ background: 'var(--bg-card-secondary)', padding: '0.8rem 1rem', borderRadius: '0.8rem', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ color: 'var(--text-heading)', fontSize: '0.95rem', fontWeight: 800 }}>{item.prizeName}</h4>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>S/ {item.unitPrice.toFixed(2)} c/u</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--nav-link-bg)', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}>
                          <button onClick={() => updateCartQty(item.raffleId, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 900, cursor: 'pointer', padding: '0 0.3rem' }}>-</button>
                          <span style={{ color: 'var(--accent-cyan-contrast)', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.raffleId, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 900, cursor: 'pointer', padding: '0 0.3rem' }}>+</button>
                        </div>
                        <span style={{ color: 'var(--text-heading)', fontWeight: 900, fontSize: '0.95rem', minWidth: '60px', textAlign: 'right' }}>
                          S/ {item.subtotal.toFixed(2)}
                        </span>
                        <button onClick={() => removeFromCart(item.raffleId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 132, 199, 0.08)', padding: '1rem', borderRadius: '0.8rem', border: '1px solid var(--border-focus)', marginBottom: '1.5rem' }}>
                  <span style={{ color: 'var(--text-heading)', fontWeight: 800, fontSize: '1.1rem' }}>TOTAL A PAGAR:</span>
                  <span style={{ color: 'var(--accent-cyan-contrast)', fontWeight: 950, fontSize: '1.5rem' }}>
                    S/ {totalCartAmount.toFixed(2)}
                  </span>
                </div>

                {/* FORMULARIO DE CHECKOUT Y VALIDACIÓN DE DNI */}
                <form onSubmit={handleCheckoutSubmit}>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', color: 'var(--text-sub)', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                      1. Ingresa tu DNI para verificar tu Registro Base
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Número de DNI (8 dígitos)"
                        value={dni}
                        onChange={(e) => {
                          setDni(e.target.value.trim());
                          if (dniVerified) setDniVerified(false);
                          if (dniError) setDniError('');
                        }}
                        maxLength={8}
                        required
                        className="consulta-input"
                        style={{ height: '48px', fontSize: '1rem' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyDni}
                        disabled={checkingDni || dni.length < 8}
                        className="btn-cyan"
                        style={{ width: 'auto', padding: '0 1.2rem', height: '48px', fontSize: '0.85rem' }}
                      >
                        {checkingDni ? '...' : 'VERIFICAR'}
                      </button>
                    </div>
                  </div>

                  {/* Alerta de Error si no tiene Registro Base */}
                  {dniError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '2px solid #ef4444', padding: '1rem', borderRadius: '0.8rem', color: '#ef4444', marginBottom: '1.2rem', textAlign: 'center' }}>
                      <p style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>⚠️ {dniError}</p>
                      <Link href="/registro?type=base" className="btn-cyan-v5" style={{ display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.8rem', width: 'auto' }}>
                        Adquirir Pase General S/ 10
                      </Link>
                    </div>
                  )}

                  {/* Datos y Pago si está verificado */}
                  {dniVerified && (
                    <div className="animate-fade-in">
                      <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', padding: '0.8rem', borderRadius: '0.8rem', color: '#22c55e', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
                        ✅ Participante Validado: {verifiedUser?.first_name} {verifiedUser?.last_name}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>WhatsApp</label>
                          <input
                            type="tel"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            required
                            placeholder="987..."
                            className="consulta-input"
                            style={{ height: '42px', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Departamento</label>
                          <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            required
                            className="consulta-input"
                            style={{ height: '42px', fontSize: '0.9rem' }}
                          >
                            <option value="">Selecciona...</option>
                            {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Info de Pago Yape */}
                      <div className="yape-box" style={{ border: '2px solid #742384', padding: '1rem', margin: '1rem 0', borderRadius: '1rem' }}>
                        <p style={{ color: 'var(--text-heading)', fontWeight: 950, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                          PAGA S/ {totalCartAmount.toFixed(2)} CON YAPE / PLIN
                        </p>
                        <img src="/images/yape.jpeg" alt="QR" style={{ width: '130px', borderRadius: '0.8rem', display: 'block', margin: '0.5rem auto' }} />
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-heading)' }}>A NOMBRE DE: ALEX ALVARO GONZALES</p>
                        <h4 style={{ fontSize: '1.4rem', color: 'var(--accent-yellow-contrast)', margin: '0.2rem 0' }}>959721395</h4>
                      </div>

                      {/* Subida de Comprobante */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label className="file-upload-btn" style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '2rem' }}>📸</span>
                          <p style={{ marginTop: '0.3rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-sub)' }}>
                            {receiptFile ? receiptFile.name : 'Sube tu captura de pago Yape/Plin'}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            required
                            style={{ display: 'none' }}
                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', fontWeight: 950 }}
                      >
                        {submitting ? 'PROCESANDO COMPRA...' : `🚀 ENVIAR PAGO DE S/ ${totalCartAmount.toFixed(2)}`}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .btn-aumentar-chances {
          background: linear-gradient(135deg, #7e22ce, #00e5ff);
          color: #fff;
          border: none;
          padding: 0.85rem 1.2rem;
          border-radius: 0.8rem;
          font-weight: 950;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(0, 229, 255, 0.25);
          letter-spacing: 0.5px;
        }
        .btn-aumentar-chances:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 229, 255, 0.4);
          filter: brightness(1.1);
        }
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
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--card-shadow);
        }
        .btn-close-modal {
          background: var(--nav-link-bg);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 1.2rem;
          font-weight: 800;
          cursor: pointer;
        }
        .btn-cart-secondary {
          flex: 1;
          background: var(--nav-link-bg);
          color: var(--text-main);
          border: 1px solid var(--border-subtle);
          padding: 0.9rem;
          border-radius: 0.8rem;
          font-weight: 800;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .btn-cart-secondary:hover {
          background: var(--nav-link-hover-bg);
        }
        .btn-cart-primary {
          flex: 1;
          background: var(--accent-cyan-contrast);
          color: #fff;
          border: none;
          padding: 0.9rem;
          border-radius: 0.8rem;
          font-weight: 950;
          cursor: pointer;
          font-size: 0.95rem;
          box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
        }
        .btn-cart-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }
        .floating-cart-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #7e22ce, #00e5ff);
          color: #fff;
          border: none;
          padding: 1rem 1.8rem;
          border-radius: 3rem;
          font-weight: 950;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(0, 229, 255, 0.4);
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: transform 0.2s;
        }
        .floating-cart-btn:hover {
          transform: scale(1.05);
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
