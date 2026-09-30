"use client";
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'raffle' | 'participants' | 'winners' | 'orders'>('raffle');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  
  // Estados para Reporte por Premio
  const [raffles, setRaffles] = useState<any[]>([]);
  const [selectedRaffleId, setSelectedRaffleId] = useState('');
  const [raffleReportData, setRaffleReportData] = useState<any>(null);

  // Estados para otros reportes
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns');
      const d = await res.json();
      if (res.ok && Array.isArray(d)) {
        setCampaigns(d);
        const active = d.find((c: any) => c.status === 'active') || d[0];
        if (active) setSelectedCampaign(active.id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchRaffles = async (campId: string) => {
    if (!campId) return;
    try {
      const res = await fetch(`/api/admin/raffles?campaignId=${campId}`);
      const d = await res.json();
      if (res.ok && Array.isArray(d)) {
        setRaffles(d);
        if (d.length > 0) setSelectedRaffleId(d[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchRaffleReport = async (rId: string) => {
    if (!rId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=raffle_participants&raffleId=${rId}`);
      const d = await res.json();
      if (res.ok) setRaffleReportData(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchOtherData = async () => {
    if (activeTab === 'raffle') return;
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

  useEffect(() => {
    if (selectedCampaign) {
      fetchRaffles(selectedCampaign);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    if (activeTab === 'raffle' && selectedRaffleId) {
      fetchRaffleReport(selectedRaffleId);
    } else {
      fetchOtherData();
    }
  }, [activeTab, selectedCampaign, selectedRaffleId]);

  // Generar filas individuales (1 fila por cada ticket/chance) con el Código en la 3ra columna
  const buildIndividualRaffleEntries = () => {
    if (!raffleReportData?.participants || raffleReportData.participants.length === 0) {
      return [];
    }

    const prizeName = raffleReportData.raffle?.prize_name || 'Premio';
    const entries: any[] = [];
    let entryCounter = 1;

    raffleReportData.participants.forEach((p: any) => {
      const totalChances = p.total_participations || 1;
      const tCodes: string[] = p.ticket_codes || [];

      for (let i = 0; i < totalChances; i++) {
        // Asignar el código de ticket correspondiente o generar fallback consistente
        let code = tCodes[i];
        if (!code) {
          code = i === 0 ? `CH-BASE-${p.dni}` : `CH-${p.dni}-${String(i).padStart(2, '0')}`;
        }
        const tipo = i === 0 ? 'Base (Pase S/10)' : 'Chance Adicional';

        entries.push({
          num: entryCounter++,
          participante: p.full_name,
          codigo_ticket: code, // <-- 3ra Columna
          dni: p.dni,
          whatsapp: p.whatsapp || 'No registrado',
          departamento: p.department || 'LIMA',
          tipo: tipo,
          premio: prizeName
        });
      }
    });

    return entries;
  };

  // DESCARGA EN EXCEL NATIVO (.XLS) con 1 Fila por cada Ticket y Código en la 3ra columna
  const downloadRaffleExcel = () => {
    const entries = buildIndividualRaffleEntries();
    if (entries.length === 0) {
      alert("No hay participantes para exportar.");
      return;
    }

    const prizeName = raffleReportData.raffle?.prize_name || 'Premio';
    const campaignName = raffleReportData.raffle?.campaign_name || 'Campaña Oficial';

    // Generar formato HTML / XML Spreadsheet nativo para Microsoft Excel
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          .title { font-size: 16pt; font-weight: bold; color: #1e1b4b; margin-bottom: 5px; }
          .subtitle { font-size: 11pt; color: #64748b; margin-bottom: 15px; }
          th { background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; font-size: 11pt; text-align: left; }
          td { border: 1px solid #e2e8f0; padding: 8px; font-size: 10.5pt; color: #1e293b; }
          .odd { background-color: #f8fafc; }
          .highlight { color: #2563eb; font-weight: bold; font-family: Consolas, monospace; }
        </style>
      </head>
      <body>
        <div class="title">REPORTE OFICIAL DEL SORTEO: ${prizeName.toUpperCase()}</div>
        <div class="subtitle">Campaña: ${campaignName} | Total Entradas / Chances en Bombo: ${entries.length}</div>
        <br/>
        <table>
          <thead>
            <tr>
              <th style="width: 60px;"># Entrada</th>
              <th style="width: 250px;">Participante</th>
              <th style="width: 180px;">Código de Ticket</th>
              <th style="width: 110px;">DNI</th>
              <th style="width: 130px;">WhatsApp</th>
              <th style="width: 130px;">Departamento</th>
              <th style="width: 140px;">Tipo de Participación</th>
              <th style="width: 200px;">Premio Sorteado</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map((e, idx) => `
              <tr class="${idx % 2 === 1 ? 'odd' : ''}">
                <td style="text-align: center; font-weight: bold;">${e.num}</td>
                <td><b>${e.participante}</b></td>
                <td class="highlight">${e.codigo_ticket}</td>
                <td style="mso-number-format:'\\@';">${e.dni}</td>
                <td style="mso-number-format:'\\@';">${e.whatsapp}</td>
                <td>${e.departamento}</td>
                <td>${e.tipo}</td>
                <td>${e.premio}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sorteo_${prizeName.replace(/\s+/g, '_')}_${Date.now()}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // DESCARGA EN CSV (1 Fila por cada Ticket / Chance)
  const downloadRaffleCSV = () => {
    const entries = buildIndividualRaffleEntries();
    if (entries.length === 0) {
      alert("No hay participantes para exportar.");
      return;
    }

    const prizeName = raffleReportData.raffle?.prize_name || 'Premio';
    const headers = ['# Entrada', 'Participante', 'Código de Ticket', 'DNI', 'WhatsApp', 'Departamento', 'Tipo', 'Premio'];

    const rows = entries.map(e => [
      e.num,
      e.participante,
      e.codigo_ticket, // <-- 3ra Columna
      e.dni,
      e.whatsapp,
      e.departamento,
      e.tipo,
      e.premio
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sorteo_${prizeName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const individualEntries = activeTab === 'raffle' ? buildIndividualRaffleEntries() : [];

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient-cyan" style={{ fontSize: '2.2rem', fontWeight: 950 }}>
            📃 Reportes y Listas para Sorteos
          </h1>
          <p style={{ color: '#64748b' }}>
            Genera y descarga la lista individual de tickets en Excel (.xls) y CSV para tus plataformas de sorteo.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <select 
            className="form-input-pro" 
            style={{ width: 'auto', fontWeight: 700 }} 
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
          >
            <option value="">Selecciona Campaña...</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('raffle')}
          className={`tab-btn ${activeTab === 'raffle' ? 'active' : ''}`}
        >
          🎁 Reporte por Premio (Sorteo Externo)
        </button>
        <button 
          onClick={() => setActiveTab('participants')}
          className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
        >
          🎟️ Todos los Tickets
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
        >
          🛒 Órdenes y Ventas
        </button>
        <button 
          onClick={() => setActiveTab('winners')}
          className={`tab-btn ${activeTab === 'winners' ? 'active' : ''}`}
        >
          🏆 Historial de Ganadores
        </button>
      </div>

      {/* TAB 1: REPORTE POR PREMIO */}
      {activeTab === 'raffle' && (
        <div>
          {/* Selector de Premio y Botones de Descarga */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.5rem 2rem', borderRadius: '1.2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontWeight: 800, color: '#1e1b4b', fontSize: '0.95rem' }}>Seleccionar Premio:</label>
              <select
                value={selectedRaffleId}
                onChange={e => setSelectedRaffleId(e.target.value)}
                className="form-input-pro"
                style={{ width: 'auto', fontWeight: 800, color: '#1e1b4b', background: '#f8fafc' }}
              >
                {raffles.map(r => (
                  <option key={r.id} value={r.id}>🎁 {r.prize_name} (Sorteo #{r.draw_order})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button
                onClick={downloadRaffleExcel}
                className="btn-save-pro"
                style={{ background: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem', padding: '0.85rem 1.6rem', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)' }}
              >
                <span>📊</span> <strong>Descargar Excel (.xls)</strong>
              </button>
              <button
                onClick={downloadRaffleCSV}
                className="btn-save-pro"
                style={{ background: '#1e1b4b', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem', padding: '0.85rem 1.4rem' }}
              >
                <span>📥</span> Descargar CSV
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas del Premio */}
          {raffleReportData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.2rem', borderLeft: '4px solid #6366f1' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PREMIO SELECCIONADO</span>
                <h3 style={{ color: '#1e1b4b', fontSize: '1.3rem', fontWeight: 950, marginTop: '0.2rem' }}>
                  {raffleReportData.raffle?.prize_name}
                </h3>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.2rem', borderLeft: '4px solid #059669' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PARTICIPANTES ÚNICOS</span>
                <h3 style={{ color: '#059669', fontSize: '1.8rem', fontWeight: 950, marginTop: '0.2rem' }}>
                  {raffleReportData.total_participants || 0}
                </h3>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.2rem', borderLeft: '4px solid #d97706' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL FILAS / CHANCES EN BOMBO</span>
                <h3 style={{ color: '#d97706', fontSize: '1.8rem', fontWeight: 950, marginTop: '0.2rem' }}>
                  {individualEntries.length}
                </h3>
              </div>
            </div>
          )}

          {/* Tabla de Entradas Individuales (1 Fila por cada Ticket / Chance) */}
          <div className="table-card-pro">
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#1e1b4b', fontSize: '0.9rem' }}>
                Vista previa de entradas individuales ({individualEntries.length} filas generadas para el sorteo)
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                * Código de Ticket ubicado en la 3ra columna
              </span>
            </div>
            <table className="admin-table-pro">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}># Entrada</th>
                  <th>Participante</th>
                  <th style={{ color: '#2563eb' }}>Código de Ticket</th>
                  <th>DNI</th>
                  <th>WhatsApp</th>
                  <th>Departamento</th>
                  <th>Tipo</th>
                  <th>Premio</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>Cargando participantes...</td></tr>
                ) : individualEntries.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>No hay participantes registrados para este premio todavía.</td></tr>
                ) : (
                  individualEntries.slice(0, 100).map((e: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ color: '#64748b', fontWeight: 800, textAlign: 'center' }}>{e.num}</td>
                      <td style={{ fontWeight: 800, color: '#1e1b4b' }}>{e.participante}</td>
                      <td style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 900, fontSize: '0.9rem' }}>
                        {e.codigo_ticket}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{e.dni}</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>{e.whatsapp}</td>
                      <td>{e.departamento}</td>
                      <td>
                        <span style={{
                          background: e.tipo.includes('Base') ? '#eff6ff' : '#fdf4ff',
                          color: e.tipo.includes('Base') ? '#2563eb' : '#a855f7',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {e.tipo}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#475569' }}>{e.premio}</td>
                    </tr>
                  ))
                )}
                {individualEntries.length > 100 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '1rem', color: '#64748b', background: '#f8fafc' }}>
                      Mostrando las primeras 100 de {individualEntries.length} entradas. Descarga el archivo Excel para ver todas las filas completas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2, 3, 4: OTROS REPORTES */}
      {activeTab !== 'raffle' && (
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
                        <td>{row.products?.name || 'S/ 10 Plan Base'}</td>
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
      )}

      <style jsx>{`
        .tab-btn {
          padding: 0.8rem 1.4rem;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 700;
          cursor: pointer;
          border-radius: 0.75rem;
          transition: all 0.2s;
          font-size: 0.9rem;
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
