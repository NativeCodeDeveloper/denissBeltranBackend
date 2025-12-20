import { google } from 'googleapis';

// Módulo de utilidades para OAuth2 de Google Calendar
// Exporta: getAuthUrl, setTokensFromCode, getOAuthClientForRefreshToken, ensureAuth, getCalendar

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

function createOAuthClient() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    // No lanzamos aquí; muchas rutas usan ensureAuth o pasan refresh token.
    // Pero dejar una advertencia para debugging.
    console.warn('Google OAuth: faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en env');
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function getAuthUrl(state) {
  const oAuth2Client = createOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: state ? String(state) : undefined
  });
}

async function setTokensFromCode(code) {
  const oAuth2Client = createOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  // No seteamos credenciales globalmente aquí por seguridad
  return tokens;
}

function getOAuthClientForRefreshToken(refreshToken) {
  const oAuth2Client = createOAuthClient();
  if (!refreshToken) throw new Error('Falta refreshToken');
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

function ensureAuth() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('No GOOGLE_REFRESH_TOKEN en variables de entorno para modo single-user');
  }
  return getOAuthClientForRefreshToken(refreshToken);
}

function getCalendar(auth) {
  return google.calendar({ version: 'v3', auth });
}

export {
  getAuthUrl,
  setTokensFromCode,
  getOAuthClientForRefreshToken,
  ensureAuth,
  getCalendar
};

