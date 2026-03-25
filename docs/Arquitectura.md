# Arquitectura del Proyecto "Dale y Gana"

## Objetivos
Crear una plataforma de sorteos online rápida, confiable, enfocada a la conversión y fácil de administrar.

## Stack Tecnológico Elegido
* **Frontend**: Next.js (App Router) con TypeScript. Rendimiento óptimo mediante Server Server Components y Static Rendering donde aplique.
* **Backend**: Next.js (API Routes / Server Actions) conectándose directamente a la base de datos de manera segura en el servidor.
* **Base de Datos**: Supabase (PostgreSQL). Ofrece escalabilidad nativa, integraciones con auth y buckets, y es idónea para transacciones.
* **Almacenamiento de Archivos (Comprobantes)**: Supabase Storage, utilizando buckets privados a los cuales únicamente los administradores tienen acceso para visualizarlos e inspeccionarlos. 
* **Autenticación**: Supabase Auth para acceso exclusivo del Panel de Administración (vía email/password). No hay login de usuario final.
* **Estilos**: Vanilla CSS con variables CSS puras para la flexibilidad y coherencia del sistema de diseño (o el uso de TailwindCSS si se prefiere implementar rápidamente).

## Interacciones del Sistema
1. **Flujo Público (Usuarios)**:
   * Acceden a la plataforma pre-renderizada (ISR/SSG) para alta velocidad de carga.
   * Envían un formulario de participación vía Server Actions de Next.js.
   * La app sube el comprobante al Supabase Storage y crea el registro temporal en la DB, generando el ticket único (UUID corto o nanoid criptográfico).
2. **Flujo de Administración**:
   * Middleware de Next.js verifica los tokens de Supabase Auth para todas las rutas bajo `/admin`.
   * El admin visualiza los tickets en base al estado (`pending`), usando consultas Postgres directamente de Supabase.
   * Aprobaciones de tickets mediante Server Actions que actualizan las filas correspondientes en la DB.

## Integraciones y Extensibilidad Opcional
* Sistema preparado para exportar a CSV vía bibliotecas como `papaparse` o similar.
* Base de datos Postgres para soporte a un uso intensivo (posibilidad de migrar paneles a Retool u otra app si escalara y la capa de datos siguiera intacta).
