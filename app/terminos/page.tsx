"use client";
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="container" style={{ padding: '3rem 1.5rem 6rem', maxWidth: '1000px' }}>
      <div className="legal-card">
        {/* Encabezado */}
        <div className="legal-header">
          <span style={{ fontSize: '3rem' }}>📜</span>
          <h1 className="hero-mega-title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '1rem 0 0.5rem' }}>
            Términos y Condiciones
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
            Documento legal que regula la participación en las promociones comerciales y sorteos organizados por <strong style={{ color: 'var(--accent-yellow-contrast)' }}>El RINCON DEL MOLLO</strong>.
          </p>
        </div>

        {/* Contenido Legal */}
        <div className="legal-content">

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              1. Organización y Marco Legal
            </h2>
            <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Organizador / Plataforma:</strong> EL RINCON DEL MOLLO</li>
              <li><strong>Titular de la Cuenta Oficial:</strong> EL RINCON DEL MOLLO</li>
              <li><strong>Sitio Web Oficial:</strong> Plataforma oficial de El RINCON DEL MOLLO</li>
              <li><strong>WhatsApp de Contacto Oficial:</strong> +51 959 721 395 / +51 953 496 746</li>
              <li>
                <strong>Periodicidad y Marco Legal:</strong> El lanzamiento de las campañas y sorteos será publicado y anunciado a través de nuestros canales oficiales. Todos los sorteos y promociones comerciales organizados por la plataforma se rigen bajo la legislación peruana vigente, garantizando la equidad, transparencia e idoneidad en cada evento.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              2. Participación y Registro
            </h2>
            <p>La participación es voluntaria y está sujeta al cumplimiento estricto de los siguientes pasos:</p>
            <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Realizar el pago previo del <strong>Pase General (S/ 10.00)</strong> o de los <strong>tickets adicionales de chances</strong> para premios específicos.</li>
              <li>Efectuar la transferencia o pago exclusivamente a la cuenta oficial Yape/Plin a nombre de <strong>EL RINCON DEL MOLLO (959721395)</strong>.</li>
              <li>Guardar la captura de pantalla o comprobante oficial emitido por la entidad financiera o billetera digital.</li>
              <li>Completar el formulario en la web oficial con datos reales, exactos y actualizados (DNI, nombres, apellidos, WhatsApp y departamento).</li>
              <li>Al dar click en <strong>"SUBIR COMPROBANTE"</strong> o <strong>"REGISTRARSE"</strong>, usted acepta el cumplimiento total de los presentes Términos y Condiciones y de la Política de Privacidad.</li>
            </ol>
            <p style={{ marginTop: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>
              ⚠️ La participación está estrictamente limitada a personas mayores de 18 años con DNI vigente. De comprobarse falsedad en la declaración de identidad o edad, la participación quedará invalidada sin derecho a reclamo o reembolso.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              3. Validación y Seguridad de Tickets
            </h2>
            <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li><strong>✅ Registro Correcto:</strong> Los tickets y chances deben estar correctamente registrados y validados en nuestra base de datos por el administrador.</li>
              <li><strong>❌ Prohibición de Manipulación:</strong> No se permite la alteración, falsificación, duplicidad o manipulación de comprobantes de pago digitales o físicos.</li>
              <li><strong>🧾 Verificación Obligatoria:</strong> El ganador acepta de manera irrevocable la verificación de su identidad (DNI físico), información proporcionada y tickets registrados, así como la exhibición del comprobante de pago original con el que participó antes de la entrega de cualquier premio.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              4. Cierre de Inscripciones
            </h2>
            <p>
              El cierre de inscripciones y validación de comprobantes se realiza en la fecha y hora programada como <strong>"Cierre de Ventas"</strong> indicada en la plataforma. Todo pago o registro posterior a dicho corte no participará en la campaña en curso y será evaluado o trasladado para la campaña siguiente.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              5. Condiciones de Pagos
            </h2>
            <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>• El valor del <strong>Pase General</strong> es de <strong>S/ 10.00 (Diez y 00/100 Soles)</strong> y otorga 1 participación en todos los premios activos de la campaña.</li>
              <li>• El valor de los tickets adicionales para aumentar chances varía según el premio (por defecto S/ 1.00 por ticket).</li>
              <li>• Los comprobantes falsos, ilegibles o adulterados serán rechazados de inmediato y el usuario quedará bloqueado de la plataforma.</li>
              <li>• No se realizan devoluciones por desistimiento, errores en la transferencia o equivocaciones cometidas por el participante.</li>
              <li>• La adquisición de un mayor número de chances incrementa las probabilidades matemáticas, pero no garantiza bajo ninguna circunstancia la obtención asegurada de un premio.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              6. Premios y Dinámica del Sorteo
            </h2>
            <p>
              Los premios consisten en los artículos y bienes anunciados oficialmente en la web (televisores, bicicletas, laptops, electrodomésticos, vehículos o dinero en efectivo).
            </p>
            <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li><strong>• Naturaleza del Premio:</strong> Los premios son de carácter estrictamente personal e intransferible. Solo se entregarán al titular registrado con su DNI.</li>
              <li><strong>• Sorteo Oficial:</strong> Los sorteos se llevan a cabo de forma pública y transparente a través de transmisiones en vivo en nuestras redes sociales oficiales o plataformas de sorteo certificadas.</li>
              <li><strong>• Decisión Final:</strong> La declaración oficial de los ganadores realizada por la organización tras la validación de los datos y tickets será definitiva e inapelable.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              7. Entrega, Recojo y Envíos de Premios
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.2rem', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <strong style={{ color: '#fff' }}>7.1. Recojo presencial de bienes físicos:</strong>
                <p style={{ marginTop: '0.3rem', fontSize: '0.92rem' }}>
                  Para la entrega de premios físicos (electrodomésticos, laptops, bicicletas, etc.), el participante ganador titular deberá acercarse obligatoria y personalmente a la ubicación coordinada por El Rincon Del Mollo, presentando su Documento Nacional de Identidad (DNI) vigente y original para la firma del acta de entrega.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.2rem', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <strong style={{ color: '#fff' }}>7.2. Exención de responsabilidad por envíos vía Courier:</strong>
                <p style={{ marginTop: '0.3rem', fontSize: '0.92rem' }}>
                  En caso de que el ganador solicite voluntariamente que un premio físico sea enviado a su domicilio en provincia a través de una agencia o courier, el ganador asume la total responsabilidad sobre el transporte. El Rincon Del Mollo queda liberada de responsabilidad civil o administrativa por demoras, pérdidas o averías imputables a la empresa de transporte seleccionada tras la entrega del paquete con su respectiva guía.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.2rem', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <strong style={{ color: '#fff' }}>7.3. Premios mayores en efectivo (Superiores a S/ 5,000.00):</strong>
                <p style={{ marginTop: '0.3rem', fontSize: '0.92rem' }}>
                  Tratándose de premios en dinero en efectivo donde el monto sea igual o mayor a S/ 5,000.00 (Cinco mil y 00/100 Soles), el ganador deberá acudir presencialmente con su DNI original para validar su identidad y firmar el acta notarial/documento legal de recepción conforme.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ color: 'var(--accent-cyan)', fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.8rem' }}>
              8. Protección de Datos Personales (Ley N° 29733)
            </h2>
            <p>
              En estricto cumplimiento de la Ley N° 29733 y su reglamento, Dale y Gana garantiza la confidencialidad de los datos personales recopilados, los cuales se utilizan exclusivamente para la gestión de los sorteos, verificación de tickets y contacto con los ganadores. Para ejercer sus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), comuníquese a nuestro WhatsApp oficial: <strong>+51 959 721 395</strong>.
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
