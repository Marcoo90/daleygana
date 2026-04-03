"use client";
import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

function getReceiptUrl(path: string | null) {
  if (!path) return null;
  // Handle both full URLs and relative storage paths
  if (path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/receipts/${path}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: '#fef3c7', color: '#d97706', label: '⏳ Pendiente' },
    validated: { bg: '#dcfce7', color: '#16a34a', label: '✅ Validado' },
    rejected:  { bg: '#fee2e2', color: '#dc2626', label: '❌ Rechazado' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.78rem', fontWeight: 800 }}>
      {s.label}
    </span>
  );
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawTotal, setRawTotal] = useState(0);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [validating, setValidating] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setRawTotal(data.length);
        setOrders(data);
      } else {
        console.error('Error fetching orders:', data);
      }
    } catch (err) { 
      console.error('Fetch error:', err); 
    }
    setLoading(false);
  };

  const validateOrder = async (orderId: string) => {
    if (!confirm('¿Confirmas la validación de este pago? Se generarán los tickets automáticamente.')) return;
    setValidating(orderId);
    try {
      const res = await fetch('/api/admin/validate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (res.ok) {
        const codes = data.ticketCodes?.join(', ') || '';
        alert(`✅ ¡Pago aprobado!\n${data.ticketsGenerated} ticket(s) generados.\n\nCódigos: ${codes}`);
        fetchOrders();
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) { 
      alert("Error de conexión"); 
    }
    setValidating(null);
  };

  const rejectOrder = async (orderId: string) => {
    if (!confirm('¿Rechazar este pago? El usuario NO recibirá tickets.')) return;
    try {
      // Update order status to rejected
      await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: 'rejected' })
      });
      await fetch(`/api/admin/payments?orderId=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      fetchOrders();
    } catch (err) { 
      alert("Error al rechazar"); 
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Smart filter: an order "needs validation" if:
  // - order_status is 'pending', OR
  // - it has any payment with status 'pending'
  const pendingOrders = orders.filter(o => {
    if (o.order_status === 'pending') return true;
    const pmts = Array.isArray(o.payments) ? o.payments : (o.payments ? [o.payments] : []);
    if (pmts.some((p: any) => p.status === 'pending')) return true;
    return false;
  });

  const displayOrders = filter === 'pending' ? pendingOrders : orders;

  return (
    <div className="admin-content animate-fade-in">
      {/* Header */}
      <header style={{ marginBottom: '2.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <div>
             <h1 className="text-gradient-cyan" style={{ fontSize: '2.2rem', fontWeight: 900 }}>
               💰 Validación de Comprobantes
             </h1>
             <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.3rem' }}>
               Revisa el voucher del participante y aprueba para generar sus tickets.
             </p>
           </div>
           <button onClick={fetchOrders} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', padding: '0.7rem 1.2rem', borderRadius: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
             🔄 Actualizar
           </button>
         </div>

         {/* Stats bar */}
         <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
           <button
             onClick={() => setFilter('pending')}
             style={{ padding: '0.6rem 1.2rem', borderRadius: '2rem', border: '2px solid', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s',
               background: filter === 'pending' ? '#fff3cd' : '#f8fafc',
               color: filter === 'pending' ? '#d97706' : '#64748b',
               borderColor: filter === 'pending' ? '#fbbf24' : '#e2e8f0'
             }}
           >
             ⏳ Pendientes ({pendingOrders.length})
           </button>
           <button
             onClick={() => setFilter('all')}
             style={{ padding: '0.6rem 1.2rem', borderRadius: '2rem', border: '2px solid', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s',
               background: filter === 'all' ? '#e0e7ff' : '#f8fafc',
               color: filter === 'all' ? '#3730a3' : '#64748b',
               borderColor: filter === 'all' ? '#6366f1' : '#e2e8f0'
             }}
           >
             📋 Todos ({rawTotal})
           </button>
         </div>
      </header>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Consultando base de datos...</p>
        </div>
      ) : displayOrders.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '5rem', borderRadius: '2rem', textAlign: 'center' }}>
          {filter === 'pending' ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: '#1e1b4b', fontSize: '1.5rem', fontWeight: 900 }}>Todo al día</h3>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No hay vouchers pendientes de validación.</p>
              <button onClick={() => setFilter('all')} style={{ marginTop: '1.5rem', background: '#1e1b4b', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                Ver todos los registros
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <h3 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 900 }}>Sin órdenes</h3>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No se han recibido registros aún.</p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '1.5rem' }}>
          {displayOrders.map(o => {
            const paymentRow = Array.isArray(o.payments) ? o.payments[0] : o.payments;
            const receiptUrl = paymentRow?.receipt_url || getReceiptUrl(paymentRow?.receipt_path || null);
            const isValidating = validating === o.id;
            const isPending = o.order_status === 'pending';

            return (
              <div key={o.id} style={{
                background: '#fff',
                borderRadius: '1.5rem',
                border: `1px solid ${isPending ? '#fde68a' : '#e2e8f0'}`,
                overflow: 'hidden',
                boxShadow: isPending ? '0 4px 20px rgba(251,191,36,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                {/* Card Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isPending ? '#fffbeb' : '#f8fafc' }}>
                   <div>
                     <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>
                       {o.order_code || 'SIN CÓDIGO'}
                     </span>
                     <h3 style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem' }}>
                       {o.participants?.first_name} {o.participants?.last_name}
                     </h3>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e1b4b' }}>S/ {o.total_amount}</div>
                     <StatusBadge status={o.order_status} />
                   </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Participant info */}
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Participante</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <p style={{ fontSize: '0.9rem', color: '#334155' }}>
                        <span style={{ color: '#94a3b8', fontWeight: 700 }}>DNI:</span> <strong>{o.participants?.dni}</strong>
                      </p>
                      <p style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 700 }}>
                        📱 {o.participants?.whatsapp}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        📍 {o.participants?.department || 'Sin ubicación'}
                      </p>
                    </div>

                    <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.3rem' }}>PRODUCTO:</p>
                      <p style={{ color: '#1e1b4b', fontWeight: 700, fontSize: '0.9rem' }}>
                        {o.products?.name || '⚠️ Sin producto asignado'}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#64748b' }}>{o.campaigns?.name}</p>
                      {o.products?.tickets_count && (
                        <p style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, marginTop: '0.25rem' }}>
                          🎫 {o.products.tickets_count} ticket(s) a generar
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Receipt image */}
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Comprobante</p>
                    <div style={{ height: '180px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {receiptUrl ? (
                        <a href={receiptUrl} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                          <img
                            src={receiptUrl}
                            alt="Comprobante de pago"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }}
                          />
                        </a>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                          <p style={{ fontSize: '0.8rem' }}>Sin comprobante</p>
                        </div>
                      )}
                    </div>
                    {receiptUrl && (
                      <a href={receiptUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                        🔍 Ver imagen completa
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions (only for pending) */}
                {isPending && (
                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', background: '#fffbeb' }}>
                     <button
                       onClick={() => validateOrder(o.id)}
                       disabled={isValidating}
                       style={{
                         flex: 3, background: isValidating ? '#94a3b8' : '#1e1b4b', color: '#fff',
                         border: 'none', padding: '0.9rem', borderRadius: '0.8rem', fontWeight: 800,
                         fontSize: '0.9rem', cursor: isValidating ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                       }}
                     >
                       {isValidating ? '⏳ Procesando...' : '✅ Aprobar y Generar Tickets'}
                     </button>
                     <button
                       onClick={() => rejectOrder(o.id)}
                       disabled={isValidating}
                       style={{
                         flex: 1, background: '#fef2f2', color: '#ef4444',
                         border: '1px solid #fee2e2', padding: '0.9rem', borderRadius: '0.8rem',
                         fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem'
                       }}
                     >
                       ❌ Rechazar
                     </button>
                  </div>
                )}

                {/* Completed info */}
                {(o.order_status === 'validated' || o.order_status === 'completed') && (
                  <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>✅</span>
                    <p style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 700 }}>Pago validado — tickets generados</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
