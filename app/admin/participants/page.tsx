"use client";
import { useState, useEffect } from 'react';

export default function ParticipantsAdmin() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchParticipants = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/participants?q=${query}`);
      const data = await res.json();
      if (res.ok) setParticipants(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro que deseas eliminar a ${name}? Esta acción podría afectar sus tickets y órdenes.`)) return;
    try {
      const res = await fetch(`/api/admin/participants?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchParticipants(searchTerm);
      } else {
        alert("Error al eliminar");
      }
    } catch (e) { alert("Error de conexión"); }
  };

  useEffect(() => { fetchParticipants(); }, []);

  return (
    <div className="admin-content animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
         <h1 className="text-gradient-cyan" style={{ fontSize: '2.5rem', fontWeight: 950 }}>👥 Participantes</h1>
         <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Gestiona todos los usuarios registrados en tu plataforma.</p>
      </header>
      
      <div className="search-bar-pro">
          <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
              <input 
                 type="text" 
                 placeholder="Buscar por DNI, Nombre o WhatsApp..." 
                 className="form-input-pro"
                 style={{ paddingLeft: '3.5rem' }}
                 onChange={(e) => {
                    const v = e.target.value;
                    setSearchTerm(v);
                    fetchParticipants(v);
                 }}
              />
          </div>
          <div className="total-badge">
             {participants.length} registrados
          </div>
      </div>

      <div className="table-card-pro">
         <table className="admin-table-pro">
            <thead>
               <tr>
                  <th>DNI</th>
                  <th>Nombre Completo</th>
                  <th>WhatsApp</th>
                  <th>Ubicación</th>
                  <th>Tickets</th>
                  <th>Acciones</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Buscando participantes...</td></tr>
               ) : participants.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>No se encontraron resultados.</td></tr>
               ) : (
                  participants.map(p => (
                     <tr key={p.id}>
                        <td style={{ fontWeight: 900, color: '#1e1b4b', fontFamily: 'monospace' }}>{p.dni}</td>
                        <td style={{ fontWeight: 800, color: '#1e293b' }}>{p.first_name} {p.last_name}</td>
                        <td style={{ color: '#059669', fontWeight: 700 }}>📱 {p.whatsapp}</td>
                        <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{p.department || '–'}</td>
                        <td>
                           <span style={{ background: '#ede9fe', color: '#4f46e5', padding: '0.4rem 0.8rem', borderRadius: '0.6rem', fontSize: '0.8rem', fontWeight: 950 }}>
                              {p.tickets?.[0]?.count || 0} 🎫
                           </span>
                        </td>
                        <td>
                           <button 
                             onClick={() => handleDelete(p.id, `${p.first_name} ${p.last_name}`)}
                             style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '0.8rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                             onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                             onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                           >
                              🗑️ Eliminar
                           </button>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>

      <style jsx>{`
        .search-bar-pro { margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem; }
        .form-input-pro { padding: 0.9rem 1rem; width: 100%; border-radius: 1rem; border: 1px solid #cbd5e1; background: #fff; color: #1e293b; outline: none; font-size: 1rem; }
        .form-input-pro:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .total-badge { background: #ede9fe; color: #4f46e5; padding: 0.8rem 1.5rem; border-radius: 1rem; font-weight: 950; font-size: 0.9rem; white-space: nowrap; }
      `}</style>
    </div>
  );
}
