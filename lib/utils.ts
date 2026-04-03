/**
 * Utilidades compartidas para el frontend de Dale y Gana
 */

/**
 * Genera la URL completa de una imagen alojada en Supabase o un placeholder si no existe
 */
export const getImageUrl = (path: string | undefined | null) => {
  if (!path || path === '') {
    return 'https://plchldr.co/i/600x400?&bg=111&fc=fff&text=DALE+Y+GANA';
  }
  
  if (path.startsWith('http')) return path;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/public-assets/${path}`;
};

/**
 * Formatea una fecha en formato "DÍA DE MES" o similar para visualización
 */
export const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  return `${date.getDate()} DE ${months[date.getMonth()]} ${date.getFullYear()}`;
};
