"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'base'; // 'base' o 'pack'
  const packId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  
  // States para pack-flow
  const [isDniVerified, setIsDniVerified] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [checkingDni, setCheckingDni] = useState(false);

  const departamentos = [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", 
    "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", 
    "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
  ];

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch('/api/admin/campaigns');
        const data = await res.json();
        if (res.ok && data.length > 0) {
          const camp = data.find((c: any) => c.status === 'active') || data[0];
          setActiveCampaign(camp);
        }
      } catch (e) { console.error(e); }
    };
    fetchCampaign();
  }, []);

  const handleVerifyDni = async () => {
    const dniInput = (document.getElementsByName('dni')[0] as HTMLInputElement)?.value;
    if (!dniInput || dniInput.length < 8) {
      alert("Ingresa un DNI válido.");
      return;
    }
    if (!activeCampaign?.id) return;

    setCheckingDni(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/participants/verify?dni=${dniInput}&campaignId=${activeCampaign.id}`);
      const data = await res.json();
      if (data.registered) {
        setIsDniVerified(true);
        setVerifiedUser(data.participant);
      } else {
        setErrorMsg(data.message || "No puedes comprar packs adicionales si no tienes un Registro Base validado en esta campaña.");
      }
    } catch (e) {
      setErrorMsg("Error al verificar DNI.");
    } finally {
      setCheckingDni(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeCampaign?.id) {
       setErrorMsg("Error: Campaña no disponible.");
       return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    formData.append('campaignId', activeCampaign.id);
    formData.append('type', type);
    if (packId) formData.append('packId', packId);
    
    // El monto lo definimos segun el tipo si no viene del packId
    if (type === 'base') formData.append('amount', '40.00');

    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();

      if (resp.ok) {
        alert("¡Recibido! Tu pago está en validación. Revisa 'Mis Tickets' pronto.");
        router.push('/');
      } else {
        setErrorMsg(data.error || "Ocurrió un error.");
      }
    } catch (err) {
        setErrorMsg("Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <nav className="topbar">
        <Link href="/"><img src="/logo.png" alt="Logo" style={{ height: '80px' }} /></Link>
        <Link href="/" className="nav-link highlight">← Regresar</Link>
      </nav>

      <div style={{ textAlign: 'center', margin: '3rem 0' }}>
         <h2 className="hero-mega-title" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}>
           {type === 'base' ? 'REGISTRO BASE' : 'PACK DE TICKETS'}
         </h2>
         <p style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>CAMPANA: {activeCampaign?.name?.toUpperCase() || '...'}</p>
      </div>

      {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', color: '#fff', padding: '1.5rem', borderRadius: '1rem', maxWidth: '800px', margin: '0 auto 2rem', textAlign: 'center', fontWeight: 900 }}>
             ⚠️ {errorMsg}
             {type === 'pack' && !isDniVerified && (
               <div style={{ marginTop: '1rem' }}>
                  <Link href="/registro?type=base" className="btn-cyan" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'inline-block' }}>Ir a Registro Base S/ 40</Link>
               </div>
             )}
          </div>
      )}

      <div className="grid-2">
         {/* LADO IZQUIERDO: FORMULARIO */}
         <div className="card" style={{ border: '1px solid var(--accent-cyan)', background: 'rgba(5, 5, 10, 0.9)' }}>
            <form onSubmit={handleSubmit}>
               <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>1. Identificación</h3>
               <div className="form-group">
                 <label className="form-label">DNI / Documento</label>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input name="dni" type="text" className="form-input" placeholder="Tu número de DNI" required disabled={isDniVerified} />
                    {type === 'pack' && !isDniVerified && (
                       <button type="button" onClick={handleVerifyDni} disabled={checkingDni} className="btn-cyan" style={{ width: 'auto', padding: '0 1.5rem' }}>
                          {checkingDni ? '...' : 'VERIFICAR'}
                       </button>
                    )}
                 </div>
               </div>

               {/* Campos que solo se muestran en registro base o si el DNI de pack fue verificado */}
               {(type === 'base' || isDniVerified) && (
                 <>
                    {type === 'base' && (
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                             <label className="form-label">Nombres</label>
                             <input name="nombres" type="text" className="form-input" placeholder="Nombres" required />
                          </div>
                          <div className="form-group">
                             <label className="form-label">Apellidos</label>
                             <input name="apellidos" type="text" className="form-input" placeholder="Apellidos" required />
                          </div>
                       </div>
                    )}
                    
                    {type === 'pack' && isDniVerified && (
                        <div style={{ marginBottom: '1.5rem', background: 'rgba(0,180,0,0.1)', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #00b400', color: '#00b400', fontWeight: 700 }}>
                           ✅ Usuario Verificado: {verifiedUser?.first_name} {verifiedUser?.last_name}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                           <label className="form-label">WhatsApp (Celular)</label>
                           <input name="whatsapp" type="tel" className="form-input" placeholder="987..." required />
                        </div>
                        <div className="form-group">
                           <label className="form-label">Provincia/Departamento</label>
                           <select name="department" className="form-input" required>
                              <option value="">Selecciona...</option>
                              {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                           </select>
                        </div>
                    </div>

                    <h3 style={{ margin: '1.5rem 0 1rem', color: '#fff' }}>2. Pago del Comprobante</h3>
                    <div className="form-group">
                      <label className="file-upload-btn">
                         <span style={{ fontSize: '3rem' }}>📸</span>
                         <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>{fileName || 'Sube tu captura de Yape/Plin'}</p>
                         <input name="receipt" type="file" style={{ display: 'none' }} accept="image/*" required onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
                      </label>
                    </div>

                    <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                       <input type="checkbox" id="terms" required style={{ width: '20px', height: '20px' }} />
                       <label htmlFor="terms" style={{ color: '#fff', fontSize: '0.8rem' }}>Acepto términos y condiciones.</label>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                      {isLoading ? 'TRABAJANDO...' : '¡DALE Y GANA! 🚀'}
                    </button>
                 </>
               )}
            </form>
         </div>

         {/* LADO DERECHO: INFO DE PAGO */}
         <div className="card" style={{ background: '#000', border: '1px solid var(--accent-purple)' }}>
            <div style={{ textAlign: 'center' }}>
               <h3 style={{ color: 'var(--accent-cyan)' }}>SI AÚN NO PAGASTE...</h3>
               <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#111', borderRadius: '1rem' }}>
                  <p style={{ fontSize: '1rem' }}>Precio de este item:</p>
                  <p style={{ fontSize: '4rem', fontWeight: 950 }}>{type === 'base' ? 'S/ 40' : 'PACK'}</p>
                  <p style={{ color: 'var(--accent-yellow)', fontWeight: 800 }}>{type === 'base' ? 'POR 1 TICKET + ACCESO' : 'MÁS OPORTUNIDADES'}</p>
               </div>
               
               <div className="yape-box" style={{ border: '2px solid #742384' }}>
                 <p style={{ color: '#742384', fontWeight: 950, marginBottom: '0.5rem' }}>PAGA CON YAPE / PLIN</p>
                 <img src="https://plchldr.co/i/200x200?&bg=742384&fc=fff&text=QR+PAGO" alt="QR" style={{ width: '160px', borderRadius: '1rem' }} />
                 <p style={{ marginTop: '1rem', fontWeight: 800 }}>CONSORCIO DALE Y GANA S.A.C</p>
                 <h4 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>945 278 476</h4>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="loading">Cargando...</div>}>
      <RegistroContent />
    </Suspense>
  );
}
