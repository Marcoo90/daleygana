"use client";
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'participants' | 'winners' | 'orders'>('participants');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns');
      const d = await res.json();
      if (res.ok) setCampaigns(d);
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/reports?type=${activeTab}${selectedCampaign ? `&campaignId=${selectedCampaign}` : ''}`;
      const res = await fetch(url);
      const d = await res.json();
      if (res.ok) setData(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);
  useEffect(() => { fetchData(); }, [activeTab, selectedCampaign]);

  const downloadCSV = () => {
    if (data.length === 0) return;
    
    let headers = [];
    let rows = [];

    if (activeTab === 'participants') {
      headers = ['Ticket', 'DNI', 'Nombre', 'WhatsApp', 'Departamento', 'Estado', 'Fecha'];
      rows = data.map(t => [
        t.ticket_code,
        t.participants?.dni,
        `${t.participants?.first_name} ${t.participants?.last_name}`,
        t.participants?.whatsapp,
        t.participants?.department,
        t.status,
        new Date(t.created_at).toLocaleString()
      ]);
    } else if (activeTab === 'winners') {
      headers = ['Premio', 'Ganador', 'DNI', 'Ticket', 'WhatsApp', 'Publicado'];
      rows = data.map(w => [
        w.raffles?.prize_name,
        w.visible_name,
        w.tickets?.participants?.dni,
        w.visible_ticket_code,
        w.tickets?.participants?.whatsapp,
        new Date(w.published_at).toLocaleString()
      ]);
    } else {
      headers = ['Orden', 'DNI', 'Cliente', 'Producto', 'Monto', 'Estado', 'Fecha'];
      rows = data.map(o => [
        o.order_code,
        o.participants?.dni,
        `${o.participants?.first_name} ${o.participants?.last_name}`,
        o.products?.name,
        o.total_amount,
        o.order_status,
        new Date(o.created_at).toLocaleString()
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${activeTab}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient-cyan" style={{ fontSize: '2.2rem' }}>📃 Reportes Detallados</h1>
          <p style={{ color: '#64748b' }}>Exporta y analiza toda la información de la plataforma.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            className="form-input-pro" 
            style={{ width: 'auto' }} 
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
          >
            <option value="">Todas las Campañas</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={downloadCSV} className="btn-save-pro" style={{ background: '#059669' }}>
            📥 Descargar CSV
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('participants')}
          className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
        >
          🎟️ Tickets x Participante
        </button>
        <button 
          onClick={() => setActiveTab('winners')}
          className={`tab-btn ${activeTab === 'winners' ? 'active' : ''}`}
        >
          🏆 Ganadores
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
        >
          🛒 Órdenes y Ventas
        </button>
      </div>

      <div className="table-card-pro">
        <table className="admin-table-pro">
          <thead>
            {activeTab === 'participants' && (
              <tr>
                <th>Ticket</th>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Departamento</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            )}
            {activeTab === 'winners' && (
              <tr>
                <th>Premio</th>
                <th>Ganador</th>
                <th>Ticket</th>
                <th>Publicado</th>
              </tr>
            )}
            {activeTab === 'orders' && (
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem' }}>Cargando datos...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem' }}>No se encontraron registros.</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx}>
                  {activeTab === 'participants' && (
                    <>
                      <td style={{ fontWeight: 800 }}>{row.ticket_code}</td>
                      <td>{row.participants?.dni}</td>
                      <td>{row.participants?.first_name} {row.participants?.last_name}</td>
                      <td>{row.participants?.department}</td>
                      <td>
                        <span className={`badge ${row.status === 'winner' ? 'winner' : 'active'}`}>
                          {row.status?.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(row.created_at).toLocaleDateString()}</td>
                    </>
                  )}
                  {activeTab === 'winners' && (
                    <>
                      <td style={{ fontWeight: 700 }}>{row.raffles?.prize_name}</td>
                      <td>{row.visible_name}</td>
                      <td style={{ color: 'var(--accent-purple)', fontWeight: 800 }}>{row.visible_ticket_code}</td>
                      <td>{new Date(row.published_at).toLocaleDateString()}</td>
                    </>
                  )}
                  {activeTab === 'orders' && (
                    <>
                      <td style={{ fontWeight: 800 }}>{row.order_code}</td>
                      <td>{row.participants?.first_name} {row.participants?.last_name}</td>
                      <td>{row.products?.name}</td>
                      <td style={{ fontWeight: 700 }}>S/ {row.total_amount}</td>
                      <td>{row.order_status}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .tab-btn {
          padding: 0.8rem 1.5rem;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 700;
          cursor: pointer;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }
        .tab-btn:hover { background: #f1f5f9; color: #1e1b4b; }
        .tab-btn.active { background: #1e1b4b; color: #fff; }
        .badge { padding: 0.3rem 0.7rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 800; }
        .badge.active { background: #dcfce7; color: #166534; }
        .badge.winner { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
      `}</style>
    </div>
  );
}
