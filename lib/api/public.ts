/**
 * Funciones de obtención de datos para el frontend de Dale y Gana
 */

/**
 * Obtiene la campaña activa junto con sus sorteos y productos asociados.
 */
export async function getActiveCampaignData() {
  try {
    const res = await fetch('/api/public/active-campaign');
    if (!res.ok) throw new Error('Error al obtener campaña');
    return await res.json();
  } catch (err) {
    console.error('API Error (active-campaign):', err);
    return null;
  }
}

/**
 * Obtiene la lista completa de ganadores proclamados.
 */
export async function getWinnersList() {
  try {
    const res = await fetch('/api/public/winners');
    if (!res.ok) throw new Error('Error al obtener ganadores');
    return await res.json();
  } catch (err) {
    console.error('API Error (winners):', err);
    return [];
  }
}

/**
 * Consulta la información de un participante por su DNI.
 */
export async function lookupParticipant(dni: string) {
  try {
    const res = await fetch(`/api/tickets/lookup?dni=${dni}`);
    const data = await res.json();
    return { data, ok: res.ok };
  } catch (err) {
    console.error('API Error (lookup):', err);
    return { data: null, ok: false };
  }
}
