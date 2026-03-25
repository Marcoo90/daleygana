# Recomendaciones de Seguridad y Escalabilidad para "Dale y Gana"

Este documento cubre los pilares para una plataforma transparente y segura contra ataques o caídas masivas de tráfico durante un sorteo en vivo.

## Seguridad

1. **Autenticación Estricta (Solo Administradores)**
   Dado que no habrá inicio de sesión para los usuarios finales, Supabase Auth debe aislarse completamente de las rutas `/app/(public)`.
   Todo inicio de sesión utilizará JWTs pasados a través del Middleware de Next.js. Las rutas `/admin` requerirán comprobación rigurosa del claim correspondiente (`role = superadmin` o `validator`).

2. **Supabase Storage: Comprobantes Privados**
   NUNCA almacenar recibos o imágenes subidas en buckets de acceso público. Supabase Storage debe configurarse como **Bucket Privado.**
   * Los URLs temporales generados al FrontEnd (app) usando `supabase.storage.from('receipts').createSignedUrl(path, 60)` duran segundos. Solo el backend debe poder descargarlos en base al Token de Admin (Auth).
   * La privacidad de las transferencias de pagos evita estafas de terceros.

3. **Rate Limiting (Protección contra DDoS)**
   Durante campañas, es posible recibir ráfagas repentinas de usuarios ingresando datos (Form Submit SPAM). 
   * Se recomienda integrar un proveedor que ofrezca DDoS mitigación y WAF (e.g. Vercel, Cloudflare, etc.). 
   * A nivel aplicación, colocar un middleware básico de API Rate Limit a Server Actions (ej. máximo de 5 participaciones por IP a la hora, dependiendo de los límites permisibles por la campaña del Sorteo).

4. **Sanitación de Data y "Inyecciones" (SQL)**
   Supabase / PostgresSQL (a través de la sintaxis estándar de clientes pre-generados) evitan inyecciones de forma nativa. Siempre utilizar el cliente strongly-typed (`@supabase/supabase-js`) de TypeScript, o Server Actions seguras, jamás incrustar parámetros no procesados en consultas crudas.

5. **Aviso Antifraude Explícito (UI/UX Trust)**
   Como requerimiento estático, en todas las vistas públicas se debe incluir el aviso de "Dale y Gana no te pedirá claves o SMS. Nuestro único canal oficial para reportar victorias es..." De esto dependerá la reputación de la aplicación.
   * Certificados SSL Wildcard activos en Vercel u hospedajes similares. Opcional en el Header.

## Escalabilidad (Preparado para Futuro)

1. **Backend Serverless (Next.js en el Borde o en Nodos)**
   La adopción de "App Router" en Next.js garantiza configuraciones donde la página principal (Home) sea Generada Estáticamente (SSG / ISR - Incremental Static Regeneration). 
   * No hay llamadas pesadas a base de datos al renderizar `/`. Las visualizaciones son ultrarrápidas y soportan 10,000s de visitas simultáneas (Picos de tráfico proveniente de Redes Sociales sin latencia).
   * A cada 1-5 minutos (o según webhooks del CMS Admin revalidatePath), la plataforma re-generará el estado de "Sorteos Agotados" o "Fechas límite" de forma diferida.

2. **Indexación de Tablas Críticas (Postgres)**
   Las tablas centrales en crecimiento rápido (`entries` y `participants`) deberán tener índices fuertes en columnas de filtrado contínuo (`public_ticket_code`, `entry_status`, `payment_status`). Esto evitará que las consultas de "Consultar Ticket" decaigan de milisegundos a segundos en varios miles de participaciones.

3. **Arquitectura Multi-Role (RBAC)**
   El esquema de BD soporta un enumerador `admin_role`. Empezará centralizado con 1 Superadmin, pero el negocio puede fácilmente invitar a "Validador" quien *solo* pueda ver la pantalla de comprobantes y confirmar/rechazar, sin tocar ajustes del sorteo ni finanzas.
   
4. **Caché Distribuido y CDNs**
   Imágenes en alta resolución y la portada se cargarán eficientemente usando `<Image />` pre-empaquetada y optimizada en AVIF o WebP de Next.js, apoyando en la Red de Entrega de Contenidos global y restando un 90% de peso. 

5. **Extensibilidad de Exportación (Reporting y Analítica)**
   Uso de CSV. Todo objeto de Next.js es procesable en backend (Stream API), o directamente exportando desde la consola de Supabase. A futuro, este esquema es compatible 100% con Herramientas de Inteligencia de Negocios para armar tableros vivos si Next.js deja de ser suficiente para tareas contables complejas.
