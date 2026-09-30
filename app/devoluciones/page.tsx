"use client";
import Link from 'next/link';

export default function DevolucionesPage() {
  return (
    <div className="container" style={{ padding: '3rem 1.5rem 6rem', maxWidth: '1000px' }}>
      <div className="legal-card">
        {/* Encabezado */}
        <div className="legal-header">
          <span style={{ fontSize: '3rem' }}>💸</span>
          <h1 className="hero-mega-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '1rem 0 0.5rem' }}>
            Política de Devoluciones
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
            La adquisición de participaciones y tickets para los sorteos de <strong style={{ color: 'var(--accent-yellow-contrast)' }}>EL RINCON DEL MOLLO</strong> corresponde a la participación voluntaria en juegos de azar y promociones comerciales. A continuación se detalla nuestra política oficial de reembolsos.
          </p>
        </div>

        {/* Contenido Legal */}
        <div className="legal-content">

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              1. Naturaleza de la Compra
            </h2>
            <p>
              Una vez validado el comprobante de pago y generadas las participaciones en el sistema, la participación se considera definitiva y efectiva. Por la naturaleza propia de los sorteos y juegos de azar, los pagos no son reembolsables por desistimiento o arrepentimiento del usuario, salvo en las situaciones extraordinarias detalladas en el punto siguiente.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              2. Casos en que SÍ Procede una Devolución
            </h2>
            <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <li>
                <strong>✅ Cobro o Transferencia Duplicada:</strong> Cuando exista una transferencia duplicada comprobable por error de la pasarela o de la aplicación bancaria hacia nuestra cuenta oficial.
              </li>
              <li>
                <strong>✅ Cancelación del Sorteo:</strong> En caso de que el organizador cancele formal y definitivamente una campaña antes de su realización por causas de fuerza mayor.
              </li>
              <li>
                <strong>✅ Falla Técnica Imputable a la Plataforma:</strong> Cuando un pago haya sido debitado y validado pero, por un error técnico comprobado de la plataforma, no se hayan emitido ni registrado las participaciones antes del cierre oficial de ventas.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              3. Casos en que NO Procede una Devolución
            </h2>
            <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <li>
                <strong>❌ No haber resultado ganador:</strong> La compra de tickets otorga oportunidades matemáticas de ganar, mas no garantiza la obtención obligatoria de un premio.
              </li>
              <li>
                <strong>❌ Datos erróneos ingresados por el participante:</strong> Errores atribuibles al usuario en el ingreso de su DNI o número telefónico.
              </li>
              <li>
                <strong>❌ Comprobantes adulterados o extemporáneos:</strong> Comprobantes falsificados, reutilizados, de campañas pasadas o transferidos a cuentas no oficiales.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              4. Procedimiento para Solicitar Devolución
            </h2>
            <p>
              Para solicitar una evaluación de devolución en los casos procedentes:
            </p>
            <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Escríbenos a nuestro canal oficial de WhatsApp (<strong>+51 959 721 395</strong> / <strong>+51 953 496 746</strong>) dentro de los <strong>siete (7) días calendario</strong> posteriores a la fecha del pago.</li>
              <li>Adjunta tu comprobante original de pago Yape/Plin legible y el número de operación bancaria.</li>
              <li>Indica tu número de DNI y motivo documentado de la solicitud.</li>
            </ol>
            <p style={{ marginTop: '0.8rem' }}>
              Nuestro equipo evaluará la solicitud en un plazo máximo de 48 a 72 horas útiles. De resultar procedente, el reembolso se realizará exclusivamente por el mismo medio de pago (Yape/Plin o transferencia bancaria al titular del DNI registrado).
            </p>
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
