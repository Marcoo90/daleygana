"use client";
import { useState, useEffect } from 'react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDni, setFilterDni] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.participants?.dni.includes(filterDni) || 
    o.order_code.toLowerCase().includes(filterDni.toLowerCase())
  );

  return (
    <div className="admin-content">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900 }}>🛒 Listado de Órdenes</h1>
            <p style={{ color: '#94a3b8' }}>Gestiona todas las compras realizadas en la plataforma.</p>
         </div>
         <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Buscar por DNI o Código..." 
              value={filterDni}
              onChange={(e) => setFilterDni(e.target.value)}
              style={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '0.5rem', width: '300px' }}
            />
            <button onClick={fetchOrders} className="btn-refresh">🔄</button>
         </div>
      </header>

      <div className="table-card">
         <table className="admin-table">
            <thead>
               <tr>
                  <th>Código Orden</th>
                  <th>Participante</th>
                  <th>Campaña / Pack</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Estado</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                 <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>Cargando...</td></tr>
               ) : filteredOrders.map(o => (
                  <tr key={o.id}>
                     <td style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{o.order_code}</td>
                     <td>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{o.participants?.first_name} {o.participants?.last_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>DNI: {o.participants?.dni}</div>
                     </td>
                     <td>
                        <div style={{ fontWeight: 600 }}>{o.campaigns?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>{o.packs?.name || 'Registro Base'}</div>
                     </td>
                     <td style={{ fontWeight: 900, color: '#fff' }}>S/ {o.total_amount}</td>
                     <td style={{ fontSize: '0.85rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                     <td>
                        <span className={`badge ${o.order_status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                           {o.order_status.toUpperCase()}
                        </span>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      <style jsx>{`
        .table-card {
           background: #11111a;
           border-radius: 1rem;
           border: 1px solid rgba(255,255,255,0.05);
           overflow: hidden;
        }
        .admin-table {
           width: 100%;
           border-collapse: collapse;
        }
        .admin-table th {
           text-align: left;
           padding: 1rem 1.5rem;
           background: rgba(255,255,255,0.02);
           color: #94a3b8;
           font-size: 0.75rem;
           text-transform: uppercase;
           letter-spacing: 1px;
           border-bottom: 2px solid rgba(255,255,255,0.05);
        }
        .admin-table td {
           padding: 1.2rem 1.5rem;
           border-bottom: 1px solid rgba(255,255,255,0.02);
           color: #e2e8f0;
        }
        .btn-refresh {
           background: rgba(255,255,255,0.05);
           border: 1px solid rgba(255,255,255,0.1);
           color: #fff;
           padding: 0.6rem 1rem;
           border-radius: 0.5rem;
           cursor: pointer;
        }
        .badge {
           padding: 0.3rem 0.7rem;
           border-radius: 2rem;
           font-size: 0.7rem;
           font-weight: 800;
        }
        .badge-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .badge-success { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
      `}</style>
    </div>
  );
}
