// /backend/routes/calendar.js
import { Router } from 'express';
import { google } from 'googleapis';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import Reservas from '../model/Reservas.js';
import { enviarCorreoConfirmacion } from '../config/email-config.js';

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE
} = process.env;

async function getDb() {
  return mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    connectionLimit: 5
  });
}

function isInvalidGrant(err) {
  const data = err?.response?.data || err;
  const msg = (data?.error_description || data?.error || `${err?.message || ''}`).toString();
  const code = (data?.error || '').toString();
  return /invalid_grant/i.test(code) || /invalid_grant/i.test(msg) || /expired or revoked/i.test(msg);
}

const router = Router();

/** 1) Iniciar autorización (visitar una vez) */
router.get('/auth/google', (req, res) => {
  const professionalId = req.query.professionalId ? String(req.query.professionalId) : '';
  const url = getAuthUrl(professionalId);
  res.redirect(url);
});

/** 2) Callback de Google (DEBE coincidir con GOOGLE_REDIRECT_URI) */
router.get('/oauth2callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (req.query.error) {
      return res.status(400).send(`Google devolvió error: ${req.query.error}`);
    }
    if (!code) return res.status(400).send('Falta "code" en el callback');

    // Intercambia el code por tokens (access + id_token + refresh_token?)
    const tokens = await setTokensFromCode(code);
    const refresh_token = tokens?.refresh_token || null;
    const id_token = tokens?.id_token || null;

    // Verifica identidad con el id_token
    if (!id_token) {
      return res.status(500).send('No se recibió id_token de Google.');
    }
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload(); // { sub, email, name, picture, ... }

    // Crea tu JWT de aplicación (no expongas tokens de Google)
    const appJwt = jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' } // 1 año en lugar de 7 días
    );

    // Setea cookie de sesión (HttpOnly) válida por 1 año
    res.cookie('token', appJwt, {
      httpOnly: true,
      sameSite: 'lax',
      // secure: true, // habilitar en producción (HTTPS)
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 año
    });
    // DEV ONLY: cookie legible por el cliente para flujos que usan localStorage
    res.cookie('token_client', appJwt, {
      httpOnly: false,
      sameSite: 'lax',
      // secure: true, // habilitar en producción (HTTPS)
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 año
    });

    // Si vino un professionalId en state, persiste su refresh_token en BD
    if (state && refresh_token) {
      const professionalId = Number(state);
      const db = await getDb();
      const [result] = await db.query(
        'UPDATE profesionales SET google_refresh_token=? WHERE id=?',
        [refresh_token, professionalId]
      );
      if (result.affectedRows === 0) {
        // No encontrado: limpia cookie para no dejar sesión a medias
        res.clearCookie('token');
        return res.status(404).send('Profesional no encontrado para guardar refresh_token');
      }
    }

    // Redirige al dashboard de Next.js con sesión ya establecida por cookie
    // y entrega el token por query para que el frontend pueda guardarlo en localStorage
    return res.redirect(`http://localhost:3000/dashboard?token=${appJwt}`);
  } catch (e) {
    console.error('OAuth callback error:', e?.response?.data || e.message || e);
    return res.status(500).send('Error al procesar OAuth.');
  }
});

/** Verificar disponibilidad de horario */
router.post('/events/check-availability', async (req, res) => {
  try {
    const { start, end, professionalId } = req.body;
    
    if (!start || !end) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Faltan campos requeridos: start, end' 
      });
    }

    // Normalizar fechas
    const startISO = typeof start === 'string' ? start : new Date(start).toISOString();
    const endISO = typeof end === 'string' ? end : new Date(end).toISOString();

    // Obtener autenticación
    let auth;
    if (professionalId) {
      const db = await getDb();
      const [rows] = await db.query('SELECT google_refresh_token FROM profesionales WHERE id=? LIMIT 1', [professionalId]);
      if (!rows.length || !rows[0].google_refresh_token) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Profesional sin refresh_token. Autoriza primero /auth/google?professionalId=ID' 
        });
      }
      auth = getOAuthClientForRefreshToken(rows[0].google_refresh_token);
    } else {
      auth = ensureAuth(); // modo single-user
    }

    const calendar = getCalendar(auth);

    // Buscar eventos del día completo para verificar superposiciones
    const fechaInicio = new Date(startISO);
    const fechaInicioDelDia = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
    const fechaFinDelDia = new Date(fechaInicioDelDia);
    fechaFinDelDia.setDate(fechaFinDelDia.getDate() + 1);

    console.log('Verificando disponibilidad para:', {
      rangoSolicitado: `${startISO} - ${endISO}`,
      buscarEnRango: `${fechaInicioDelDia.toISOString()} - ${fechaFinDelDia.toISOString()}`
    });

    // Buscar todos los eventos del día
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: fechaInicioDelDia.toISOString(),
      timeMax: fechaFinDelDia.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const todosLosEventos = response.data.items || [];
    console.log(`Eventos encontrados en Google Calendar: ${todosLosEventos.length}`);

    // TAMBIÉN VERIFICAR EN LA BASE DE DATOS
    const reservas = new Reservas();
    const fechaDB = fechaInicio.toISOString().split('T')[0]; // YYYY-MM-DD
    const reservasBD = await reservas.selectReservasPorFecha(fechaDB);
    console.log(`Eventos encontrados en Base de Datos: ${reservasBD.length}`);

    // Combinar eventos de Google Calendar y Base de Datos
    const todosLosConflictos = [];

    // Filtrar eventos de Google Calendar que se superponen
    const eventosGoogleConflicto = todosLosEventos.filter(evento => {
      if (evento.status === 'cancelled') return false;
      
      const eventoInicio = new Date(evento.start?.dateTime || evento.start?.date);
      const eventoFin = new Date(evento.end?.dateTime || evento.end?.date);
      const nuevoInicio = new Date(startISO);
      const nuevoFin = new Date(endISO);

      const haySuperposicion = (nuevoInicio < eventoFin && nuevoFin > eventoInicio);
      
      if (haySuperposicion) {
        console.log('Conflicto en Google Calendar:', {
          eventoExistente: {
            titulo: evento.summary,
            inicio: eventoInicio.toISOString(),
            fin: eventoFin.toISOString()
          },
          eventoNuevo: {
            inicio: nuevoInicio.toISOString(),
            fin: nuevoFin.toISOString()
          }
        });
      }

      return haySuperposicion;
    });

    // Filtrar eventos de Base de Datos que se superponen
    const eventosBDConflicto = reservasBD.filter(reserva => {
      if (reserva.status === 'cancelada') return false;
      
      // Combinar fecha y hora de la reserva
      const fechaHoraReserva = `${reserva.fecha.toISOString().split('T')[0]}T${reserva.hora}`;
      const eventoInicio = new Date(fechaHoraReserva);
      // Asumir 45 minutos de duración si no hay hora de fin
      const eventoFin = new Date(eventoInicio.getTime() + 45 * 60 * 1000);
      
      const nuevoInicio = new Date(startISO);
      const nuevoFin = new Date(endISO);

      const haySuperposicion = (nuevoInicio < eventoFin && nuevoFin > eventoInicio);
      
      if (haySuperposicion) {
        console.log('Conflicto en Base de Datos:', {
          eventoExistente: {
            titulo: reserva.nombre,
            inicio: eventoInicio.toISOString(),
            fin: eventoFin.toISOString()
          },
          eventoNuevo: {
            inicio: nuevoInicio.toISOString(),
            fin: nuevoFin.toISOString()
          }
        });
      }

      return haySuperposicion;
    });

    // Combinar conflictos de ambas fuentes
    const eventosConflicto = [
      ...eventosGoogleConflicto,
      ...eventosBDConflicto.map(reserva => ({
        // Convertir formato de BD a formato de Google Calendar para consistencia
        summary: reserva.nombre,
        start: { dateTime: `${reserva.fecha.toISOString().split('T')[0]}T${reserva.hora}` },
        end: { dateTime: new Date(new Date(`${reserva.fecha.toISOString().split('T')[0]}T${reserva.hora}`).getTime() + 45 * 60 * 1000).toISOString() },
        source: 'database'
      }))
    ];

    const disponible = eventosConflicto.length === 0;

    console.log(`Resultado: ${disponible ? 'DISPONIBLE' : 'CONFLICTO'} - ${eventosConflicto.length} conflictos encontrados`);

    res.json({
      ok: true,
      disponible,
      conflictos: eventosConflicto,
      message: disponible 
        ? 'Horario disponible' 
        : `${eventosConflicto.length} conflicto(s) encontrado(s)`
    });

  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    
    if (isInvalidGrant(error)) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Token expirado. Re-autoriza en /auth/google' 
      });
    }

    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor al verificar disponibilidad' 
    });
  }
});

/** 3) Crear evento */
router.post('/events', async (req, res) => {
  try {
    const { summary, description, start, end, location, attendees, professionalId, rutPaciente, telefonoPaciente } = req.body;
    if (!summary || !start || !end) {
      return res.status(400).json({ ok: false, error: 'Faltan campos: summary, start, end' });
    }

    // Normaliza fechas y zona horaria
    const timeZone = 'America/Santiago';
    const startISO = typeof start === 'string' ? start : new Date(start).toISOString();
    const endISO = typeof end === 'string' ? end : new Date(end).toISOString();

    // Normaliza asistentes
    const attendeesArr = Array.isArray(attendees)
      ? attendees
      : attendees
        ? [{ email: attendees }]
        : [];

    // Auth: por profesional (si viene) o global con ensureAuth
    let auth;
    if (professionalId) {
      const db = await getDb();
      const [rows] = await db.query('SELECT google_refresh_token FROM profesionales WHERE id=? LIMIT 1', [professionalId]);
      if (!rows.length || !rows[0].google_refresh_token) {
        return res.status(400).json({ ok: false, error: 'Profesional sin refresh_token. Autoriza primero /auth/google?professionalId=ID' });
      }
      auth = getOAuthClientForRefreshToken(rows[0].google_refresh_token);
    } else {
      auth = ensureAuth(); // modo single-user
    }

    const calendar = getCalendar(auth);

    // Crea evento con Google Meet
    const requestId = `meet-${professionalId || 'global'}-${Date.now()}`;
    const event = {
      summary,
      description,
      location,
      start: { dateTime: startISO, timeZone },
      end:   { dateTime: endISO,   timeZone },
      attendees: attendeesArr,
      conferenceData: { createRequest: { requestId } }
    };

    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1
    });

    const meetLink = data?.hangoutLink
      || data?.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri
      || null;

    // GUARDAR TAMBIÉN EN LA BASE DE DATOS
    try {
      console.log('Iniciando guardado en base de datos...');
      const reservas = new Reservas();
      
      // Extraer datos para la base de datos
      const fechaDB = new Date(startISO).toISOString().split('T')[0]; // YYYY-MM-DD
      const horaDB = new Date(startISO).toTimeString().split(' ')[0]; // HH:MM:SS
      
      // Extraer email del primer attendee si existe
      const emailAsistente = attendeesArr.length > 0 ? attendeesArr[0].email : '';
      
      const datosReserva = {
        nombre: summary,
        rut: rutPaciente || '', // Usar el RUT del formulario si existe
        telefono: telefonoPaciente || '', // Usar el teléfono del formulario si existe
        email: emailAsistente,
        fecha: fechaDB,
        hora: horaDB,
        event_id: data.id, // ID del evento de Google Calendar
        status: 'confirmada'
      };
      
      console.log('💾 Datos a guardar en BD:', JSON.stringify(datosReserva, null, 2));
      const reservaId = await reservas.insertarReserva(datosReserva);
      console.log('Evento guardado en BD con ID:', reservaId);
      
      // Enviar correo de confirmación
      if (emailAsistente && emailAsistente.includes('@')) {
        try {
          console.log('Enviando correo de confirmación a:', emailAsistente);
          const resultadoCorreo = await enviarCorreoConfirmacion({
            nombre: summary,
            email: emailAsistente,
            fecha: fechaDB,
            hora: horaDB,
            meetLink: meetLink
          });
          
          if (resultadoCorreo.success) {
            console.log('Correo de confirmación enviado exitosamente');
          } else {
            console.error('Error enviando correo:', resultadoCorreo.error);
          }
        } catch (emailError) {
          console.error('Error detallado enviando correo:', emailError);
          // No fallamos la respuesta - el evento ya se creó y guardó
        }
      } else {
        console.log('⚠️  No se envió correo - email no válido:', emailAsistente);
      }
      
    } catch (dbError) {
      console.error('Error detallado al guardar en base de datos:', dbError);
      console.error('Stack trace:', dbError.stack);
      // No fallamos la respuesta - el evento ya se creó en Google Calendar
    }

    res.json({ ok: true, event: data, meetLink });
  } catch (e) {
    // Manejo fino para tokens vencidos/revocados
    if (isInvalidGrant(e)) {
      try {
        // Si está ligado a un profesional, borrar el refresh_token para forzar reautorización
        const professionalId = req.body?.professionalId ? Number(req.body.professionalId) : null;
        if (professionalId) {
          const db = await getDb();
          await db.query('UPDATE profesionales SET google_refresh_token=NULL WHERE id=?', [professionalId]);
        }
      } catch (wipeErr) {
        console.error('No se pudo limpiar refresh_token del profesional:', wipeErr?.message || wipeErr);
      }
      return res.status(401).json({ ok: false, error: 'REAUTH_NEEDED', message: 'El token de Google caducó o fue revocado. Vuelve a autorizar.', reauthUrl: `/calendar/auth/google${req.body?.professionalId ? `?professionalId=${Number(req.body.professionalId)}` : ''}` });
    }
    console.error('Calendar insert error:', e?.response?.data || e.message || e);
    return res.status(500).json({ ok: false, error: 'No se pudo crear el evento' });
  }
});

/** 4) Listar próximos eventos */
router.get('/events', async (req, res) => {
  try {
    const maxResults = Number(req.query.max || 10);
    const professionalId = req.query.professionalId ? Number(req.query.professionalId) : null;

    let auth;
    if (professionalId) {
      const db = await getDb();
      const [rows] = await db.query('SELECT google_refresh_token FROM profesionales WHERE id=? LIMIT 1', [professionalId]);
      if (!rows.length || !rows[0].google_refresh_token) {
        return res.status(400).json({ ok: false, error: 'Profesional sin refresh_token. Autoriza primero /auth/google?professionalId=ID' });
      }
      auth = getOAuthClientForRefreshToken(rows[0].google_refresh_token);
    } else {
      auth = ensureAuth();
    }

    const calendar = getCalendar(auth);
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date().toISOString(),
      timeZone: 'America/Santiago'
    });

    res.json({ ok: true, items: data.items || [] });
  } catch (e) {
    if (isInvalidGrant(e)) {
      try {
        const professionalId = req.query?.professionalId ? Number(req.query.professionalId) : null;
        if (professionalId) {
          const db = await getDb();
          await db.query('UPDATE profesionales SET google_refresh_token=NULL WHERE id=?', [professionalId]);
        }
      } catch (wipeErr) {
        console.error('No se pudo limpiar refresh_token del profesional (listar):', wipeErr?.message || wipeErr);
      }
      return res.status(401).json({ ok: false, error: 'REAUTH_NEEDED', message: 'El token de Google caducó o fue revocado. Vuelve a autorizar.', reauthUrl: `/calendar/auth/google${req.query?.professionalId ? `?professionalId=${Number(req.query.professionalId)}` : ''}` });
    }
    console.error('No se pudieron listar eventos:', e?.response?.data || e.message || e);
    return res.status(500).json({ ok: false, error: 'No se pudieron listar eventos' });
  }
});

export default router;