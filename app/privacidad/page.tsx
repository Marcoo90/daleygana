"use client";
import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="container" style={{ padding: '3rem 1.5rem 6rem', maxWidth: '1000px' }}>
      <div className="legal-card">
        {/* Encabezado */}
        <div className="legal-header">
          <span style={{ fontSize: '3rem' }}>🔒</span>
          <h1 className="hero-mega-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '1rem 0 0.5rem' }}>
            Política de Privacidad
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
            En <strong style={{ color: 'var(--accent-yellow-contrast)' }}>EL RINCON DEL MOLLO</strong> protegemos tus datos personales conforme a la <strong>Ley N.° 29733</strong> (Ley de Protección de Datos Personales del Perú) y su reglamento.
          </p>
        </div>

        {/* Contenido Legal */}
        <div className="legal-content">

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              1. Datos que Recopilamos
            </h2>
            <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>• <strong>Documento Nacional de Identidad (DNI), Nombres y Apellidos:</strong> Utilizados para verificar tu identidad y asociar tus tickets oficiales del sorteo.</li>
              <li>• <strong>Número de WhatsApp y Teléfono:</strong> Para validar tu comprobante de pago, enviarte avisos y contactarte en caso de resultar ganador.</li>
              <li>• <strong>Departamento / Ubicación:</strong> Para la correcta coordinación logística de entrega de premios.</li>
              <li>• <strong>Comprobante de Pago Yape / Plin:</strong> Monto, fecha, número de operación y titular de la transferencia para validar tu participación.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              2. Finalidad del Tratamiento de Datos
            </h2>
            <p>Tus datos son tratados exclusivamente para los siguientes fines legítimos:</p>
            <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Validar tu comprobante de pago y generar tus participaciones oficiales y tickets.</li>
              <li>Identificar plenamente a los participantes y proclamar a los ganadores de cada premio.</li>
              <li>Coordinar la entrega física o transferencia del premio obtenido.</li>
              <li>Prevenir fraudes, comprobantes duplicados o intentos de manipulación del sistema.</li>
            </ol>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              3. Conservación y Seguridad
            </h2>
            <p>
              Tus datos se almacenan en servidores seguros con cifrado de conexión SSL y se conservan durante el tiempo necesario para la ejecución de la campaña, la auditoría del sorteo y el cumplimiento de las obligaciones normativas aplicables. Aplicamos estrictas medidas técnicas y administrativas para prevenir accesos no autorizados.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              4. Confidencialidad y No Cesión a Terceros
            </h2>
            <p>
              <strong>EL RINCON DEL MOLLO</strong> no vende, no alquila ni comercializa tus datos personales con terceros bajo ningún concepto. Tu información solo podrá ser compartida con autoridades competentes cuando exista un requerimiento legal o judicial fundamentado.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              5. Ejercicio de tus Derechos ARCO
            </h2>
            <p>
              Como titular de tus datos personales, puedes ejercer en cualquier momento tus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong> enviándonos un mensaje formal a nuestros canales oficiales de atención:
            </p>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.8rem' }}>
              <p>📱 <strong>WhatsApp Oficial de Soporte:</strong> <a href="https://wa.me/51959721395" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>+51 959 721 395</a> / <a href="https://wa.me/51953496746" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>+51 953 496 746</a></p>
              <p style={{ marginTop: '0.3rem', fontSize: '0.9rem', color: '#94a3b8' }}>Horario de Atención: Lunes a Sábado de 9:00 a.m. a 9:00 p.m. • Domingos de 9:00 a.m. a 8:00 p.m.</p>
            </div>
          </section>

        </div>

        {/* Botón Volver */}
        <div style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link href="/" className="btn-cyan-v5" style={{ display: 'inline-block', width: 'auto', padding: '0.9rem 2.5rem' }}>
            ← Volver a la Página Principal
          </Link>
        </div>
      </div>
    </div>
  );
}
