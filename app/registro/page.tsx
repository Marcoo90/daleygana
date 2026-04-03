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

  // States para autocomplete DNI
  const [dniLookupLoading, setDniLookupLoading] = useState(false);
  const [dniSourceVerified, setDniSourceVerified] = useState(false);
  const [nombresForm, setNombresForm] = useState('');
  const [apellidosForm, setApellidosForm] = useState('');

  const departamentos = [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco",
    "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto",
    "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
  ];

  const [selectedPack, setSelectedPack] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/campaigns');
        const data = await res.json();
        if (res.ok && data.length > 0) {
          const camp = data.find((c: any) => c.status === 'active') || data[0];
          setActiveCampaign(camp);

          // Auto-verificar si viene DNI por URL
          const dniParam = searchParams.get('dni');
          if (dniParam && type === 'pack') {
            const dniEl = document.getElementsByName('dni')[0] as HTMLInputElement;
            if (dniEl) dniEl.value = dniParam;
            setTimeout(() => { triggerDniVerify(dniParam, camp.id); }, 100);
          }

          // Fetch specific pack info if needed
          if (type === 'pack' && packId) {
            const prodRes = await fetch(`/api/public/active-campaign`);
            const prodData = await prodRes.json();
            if (prodRes.ok) {
              const pack = prodData.products?.find((p: any) => p.id === packId);
              setSelectedPack(pack);
            }
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [searchParams, type, packId]);

  const [whatsapp, setWhatsapp] = useState('');
  const [department, setDepartment] = useState('');

  const triggerDniVerify = async (val: string, campId: string) => {
    if (!val || val.length < 8) return;
    setCheckingDni(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/participants/verify?dni=${val}&campaignId=${campId}`);
      const data = await res.json();
      if (data.registered) {
        setIsDniVerified(true);
        setVerifiedUser(data.participant);
        setNombresForm(data.participant.first_name || '');
        setApellidosForm(data.participant.last_name || '');
        setWhatsapp(data.participant.whatsapp || '');
        setDepartment(data.participant.department || '');
      } else {
        setErrorMsg(data.message || "No puedes comprar packs adicionales si no tienes un Registro Base validado.");
      }
    } catch (e) { setErrorMsg("Error al verificar DNI."); }
    finally { setCheckingDni(false); }
  };

  const handleVerifyDni = async () => {
    const dniInput = (document.getElementsByName('dni')[0] as HTMLInputElement)?.value;
    if (!dniInput || dniInput.length < 8) {
      alert("Ingresa un DNI válido (8 dígitos).");
      return;
    }
    if (!activeCampaign?.id) return;
    triggerDniVerify(dniInput, activeCampaign.id);
  };

  const handleDniBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const dniInput = e.target.value.trim();
    if (dniInput.length !== 8 || type !== 'base') return;

    setDniLookupLoading(true);
    try {
      const res = await fetch(`/api/public/dni?dni=${dniInput}`);
      if (res.ok) {
        const data = await res.json();
        setNombresForm(data.first_name || '');
        setApellidosForm(data.last_name || '');
        setDniSourceVerified(true);
        setErrorMsg(''); // clear previous errors if successful
      } else {
        setDniSourceVerified(false);
        // Do not block the user, just let them write manually
      }
    } catch (err) {
      setDniSourceVerified(false);
    } finally {
      setDniLookupLoading(false);
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
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  name="dni"
                  type="text"
                  className="form-input"
                  placeholder="Tu número de DNI"
                  required
                  readOnly={isDniVerified}
                  onBlur={type === 'base' ? handleDniBlur : undefined}
                  maxLength={8}
                  style={isDniVerified ? { background: '#1e293b', cursor: 'not-allowed' } : {}}
                />
                {type === 'base' && dniLookupLoading && (
                  <span style={{ fontSize: '1.2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
                )}

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
                    <input type="hidden" name="dni_verified" value={dniSourceVerified ? 'true' : 'false'} />
                    <div className="form-group">
                      <label className="form-label">
                        Nombres
                        {dniSourceVerified && <span style={{ color: '#00e5ff', fontSize: '0.7rem', marginLeft: '0.5rem' }}>✓ Validado</span>}
                      </label>
                      <input
                        name="nombres"
                        type="text"
                        className="form-input"
                        placeholder="Nombres"
                        required
                        value={nombresForm}
                        onChange={(e) => setNombresForm(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Apellidos</label>
                      <input
                        name="apellidos"
                        type="text"
                        className="form-input"
                        placeholder="Apellidos"
                        required
                        value={apellidosForm}
                        onChange={(e) => setApellidosForm(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {type === 'pack' && isDniVerified && (
                  <>
                    <div style={{ marginBottom: '1.5rem', background: 'rgba(0,180,0,0.1)', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #00b400', color: '#00b400', fontWeight: 700 }}>
                      ✅ Usuario Verificado: {verifiedUser?.first_name} {verifiedUser?.last_name}
                    </div>
                    {/* Hidden inputs to ensure backend gets the names for the upsert */}
                    <input type="hidden" name="nombres" value={verifiedUser?.first_name || ''} />
                    <input type="hidden" name="apellidos" value={verifiedUser?.last_name || ''} />
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">WhatsApp (Celular)</label>
                    <input
                      name="whatsapp"
                      type="tel"
                      className="form-input"
                      placeholder="987..."
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Provincia/Departamento</label>
                    <select
                      name="department"
                      className="form-input"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
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
              <p style={{ fontSize: '1rem' }}>DALE Y GANA CON SOLO:</p>
              <p style={{ fontSize: '4rem', fontWeight: 950 }}>{type === 'base' ? 'S/ 40' : 'PACK'}</p>
              <p style={{ color: 'var(--accent-yellow)', fontWeight: 800 }}>{type === 'base' ? 'NO TE QUEDES FUERA' : 'MÁS OPORTUNIDADES'}</p>
            </div>

            <div className="yape-box" style={{ border: '2px solid #742384' }}>
              <p style={{ color: '#ffffffff', fontWeight: 950, marginBottom: '0.5rem' }}>PAGA CON YAPE/PLIN</p>
              <img src="/images/plin.png" alt="QR" style={{ width: '160px', borderRadius: '1rem' }} />
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
