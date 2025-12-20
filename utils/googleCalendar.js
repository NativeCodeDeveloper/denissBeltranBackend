// backend/utils/googleCalendar.js
import { ensureAuth, getCalendar } from '../auth/google.js';

/**
 * Crea un evento en Google Calendar y retorna el eventId y meetLink
 * @param {Object} params
 * @param {string} params.summary - Título del evento
 * @param {string} params.description - Descripción
 * @param {string} params.startISO - Fecha/hora inicio (ISO)
 * @param {string} params.endISO - Fecha/hora fin (ISO)
 * @param {string} params.email - Email del invitado
 * @returns {Promise<{ eventId: string, meetLink: string }>} 
 */
export async function crearEventoGoogleCalendar({ summary, description, startISO, endISO, email }) {
  const auth = ensureAuth();
  const calendar = getCalendar(auth);

  const event = {
    summary,
    description,
    start: { dateTime: startISO, timeZone: 'America/Santiago' },
    end: { dateTime: endISO, timeZone: 'America/Santiago' },
    attendees: [{ email }],
    conferenceData: { createRequest: { requestId: Date.now().toString() } },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });
    console.log('[GoogleCalendar][DEBUG] Respuesta completa de events.insert:', JSON.stringify(response.data, null, 2));
    const eventId = response.data.id;
    const meetLink = response.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || '';
    if (!eventId) {
      console.error('[GoogleCalendar][ERROR] No se obtuvo eventId de la respuesta');
    }
    if (!meetLink) {
      console.warn('[GoogleCalendar][WARN] No se obtuvo meetLink de la respuesta');
    }
    return { eventId, meetLink };
  } catch (error) {
    console.error('[GoogleCalendar][ERROR] Error al crear evento:', error?.response?.data || error.message || error);
    return { eventId: null, meetLink: '' };
  }
}
