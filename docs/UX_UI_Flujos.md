# Interfaz de Usuario y Flujos ("Dale y Gana")

## 1. Diseño Visual (Guías de Estilo y Propuesta)
Basado en las referencias, **“Dale y Gana”** será confiable y directo con estéticas vibrantes y micro-animaciones, pero mantendrá una identidad gráfica que transmita: profesionalidad y cero fraude.

* **Paleta de Colores Sugerida (Premium, Trust, Dynamic)**
  * **Fondo Principal**: Un gris oscuro elegante o un azul profundo mate. Ejs: ` #0b1120`, o `#0A0910`. 
  * **Acentos Principales (Vibrantes)**: Color neón claro, oro premium, o esmeralda (Ej: `#10B981` de vida y ganancia / `#FACC15` amarillo de premios y energía directa).
  * **Tipografía**: Modernas Sin Serif (Ej: **Inter** para el contenido, y **Outfit**, o **Space Grotesk** para llamadas a la acción (CTAs) y títulos impactantes).
* **Sensación Táctil (Animaciones sutiles)**
  * Las Cards del sorteo suben levemente `-translate-y-1` ante el `:hover` para evidenciar su interacción táctil en Desktop (Mobile: scroll smooth natural).
  * Efectos “Glow” u “Holograma” limitados a los Premios Principales.
  * Transiciones de página al enviar formulario: Spinners fluidos, popups de celebración suaves, sin recargas bruscas al dar clics, apoyados con Next.js App Router (prefetch).

## 2. Flujos del Sistema

### Flujo del Usuario (Participante Público)
1. **Página de Aterrizaje / Sorteo Activo (`/`)**
   * (Hero) Imagen principal en alta resolución del premio, Precio de participación brillante y masivo.
   * Clickean el Botón CTA que hace autoscroll al formulario, o navegan a `/sorteos/[slug]`.
2. **Formulario Híbrido Rápido**
   * Campos clave: Nombre, Apellidos, Celular (Importante!), Ciudad, Departamento (Opcional o Pre-cargados). Ningún login necesario.
   * Se les solicita el comprobante (Imagen/PDF a través de Dropzone nativa con validaciones para max 2-5MB).
3. **Generación Inmediata de Ticket y Redirección (`/consulta-ticket`)**
   * El Frontend envía la data; Next.js devuelve de forma paralela un código único nanoid (ej. `WD-1A2K`).
   * "¡Tu comprobante ha sido subido! Conserva esto:" [TICKET DE TAMAÑO ENORME EN PANTALLA]
   * Estado devuelto: `En revisión / Pendiente`.
4. **Verificación futura (Consulta de Ticket)**
   * En `/consulta-ticket`, el usuario inserta su DNI o celular para visualizar su código. Verá un estado que el Admin actualizará: `PENDIENTE`, `ACEPTADO`, `RECHAZADO` con la nota respectiva (Ej. Pago Ilegible).

### Flujo del Administrador (`/admin`)
1. **Acceso único** mediante Login Supabase (Roles: Panel Administrativo).
2. **Dashboard de Resumen**
   * Tarjetas con estadísticas: # En Revisión (Rojo parpadeante sutil para urgencia), # Total Recaudación de Mes, Entradas Confirmadas de Sorteo Activo.
3. **Aprobación Express (Revisor o Validador)**
   * El admin abre el Listado de "Comprobantes Pendientes". 
   * Se listan cards horizontales con: Nombre, Celular, Fecha, Sorteo Y Botón “Ver Comprobante”. 
   * La app abre un modal nativo visualizando la foto hospedada del voucher en Supabase (Bucket Privado).
   * Tiene dos botones: Aprobar ✅, Rechazar ❌, al momento clickeando actualizará la BD a tiempo real sin refrescar usando `React Server Actions + revalidatePath()`.
4. **Gestión Total (Sorteos)**
   * Crear o archivar con un CMS limpio: Subidas de portadas, asignación de precios.
  
## 3. Componentes UI Abstractos (Reutilizables en Next.js)
  1. `<HeroSection />`: Destaca las propiedades clave del Sorteo (Título, Fecha, Contador de Cuenta Regresiva).
  2. `<TrustBadge />`: Logotipos o candados de pagos seguros y avisos anti-estafas minimalistas.
  3. `<RaffleCard />`: Tarjetas que albergan la imagen del premio activo con micro-animaciones.
  4. `<ImageDropzone />`: La cápsula de carga del componente de Dropzone intuitiva. Drag & Drop.
  5. `<TicketResult />`: Un "Boleto" físico estilizado (con recortes bordeados CSS) para desplegar resultados o generación en pantalla de éxito al participante.
  6. `<DataTableAdmin />`: Tabla nativa moderna de gestión para Admins. Combina la paginación con Server Components nativos.
