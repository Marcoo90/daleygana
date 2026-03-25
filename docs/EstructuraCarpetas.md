# Estructura de Carpetas Sugerida para Next.js App Router

Esta es una sugerencia basada en el stack y en Next.js optimizado. Todo el código de la app vivirá directamente dentro de la misma (o usando `src/` opcional).

```
daleygana/
│
├── .env.local                    # Variables de entorno Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY)
├── package.json
├── next.config.js
├── tailwind.config.ts            (Si se decidiese usar en el futuro, descartar para Vanilla CSS)
│
├── public/                       # Assets públicos
│   ├── images/                   # Premios por defecto, fondos, logos
│   └── fonts/                    # Fuentes de texto (Inter, Outfit, etc)
│
├── docs/                         # Documentación del proyecto (esta carpeta)
│
├── app/                          # App Router de Next.js
│   ├── (public)/                 # Rutas públicas agrupadas (sin interferir en URL)
│   │   ├── layout.tsx            # Navbar y Footer públicos
│   │   ├── page.tsx              # Landing Principal / Home
│   │   ├── sorteos/
│   │   │   ├── [slug]/           # Vista individual de un sorteo
│   │   │   │   └── page.tsx      
│   │   └── consulta-ticket/      # Consulta de tickets del usuario público
│   │       └── page.tsx          
│   │
│   ├── (admin)/                  # Rutas privadas agrupadas
│   │   ├── layout.tsx            # Sidebar del panel de administración
│   │   ├── login/                # Página de login del administrador
│   │   │   └── page.tsx          
│   │   ├── dashboard/            # Panel general (conteos, métricas)
│   │   │   └── page.tsx          
│   │   ├── sorteos/              # CRUD y lista de sorteos (admin)
│   │   │   └── page.tsx          
│   │   └── comprobantes/         # Revisar pendientes y flujo de validez
│   │       └── page.tsx          
│   │
│   ├── api/                      # (Opcional) Si en vez de Server Actions se requerirían Rutas API
│   ├── global.css                # Estilos base variables, tokens o configuración utilitaria
│   └── layout.tsx                # Root layout, con el proveedor básico y fuentes base
│
├── lib/
│   ├── supabase/                 # Clientes e inicialización
│   │   ├── client.ts             # Cliente público (browser)
│   │   └── server.ts             # Cliente con Next.js Cookies
│   ├── utils.ts                  # Utilidades como formateos de fecha (date-fns), generador tickets cortos, merge estilos
│   └── database.types.ts         # Tipados exactos auto-generados desde supabase CLI
│
├── components/                   # Componentes reusables de UI
│   ├── ui/                       # Componentes atómicos o nativos (Botones, Inputs, Modales, Tablas)
│   ├── form/                     # Subida de recibos, dropzones, validaciones (react-hook-form)
│   └── layout/                   # Sidebars del admin, Headers públicos, Footers, Heroections 
│
└── actions/                      # Server Actions puras (Ej: submitEntryAction, approveEntryAction...)
    ├── raffle_actions.ts         # Actions para CRUDS de los Sorteos
    ├── admin_actions.ts          # Actions de seguridad en el Admin Panel
    └── public_actions.ts         # Actions para los participantes (ej: Generar ticket de ingreso)
```
