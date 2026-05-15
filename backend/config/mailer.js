/**
 * Configuración de Mailer - Gestiona el envío de correos electrónicos
 * Soporta Gmail API (Google Workspace), SendGrid y Gmail SMTP (fallback)
 *
 * Textos visibles al usuario: español neutro y natural (tú estándar: puedes, recibes, indica; sin voseo).
 */
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import fs from 'fs';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { APP_NAME, APP_NAME_FULL, EMAIL_FROM_NAME, INSTAGRAM_URL, LOGO_URL } from '../constants/app.js';
import {
  CODE_EXPIRATION_MINUTES,
  EMAIL_COLORS,
  FRONTEND_URL,
  RESET_PASSWORD_PATH,
  RESET_TOKEN_EXPIRATION_HOURS
} from '../constants/email.js';
import { emailCtaLabel, getEmailLegalMedicalDisclaimerPlain } from '../constants/emailProductCopy.js';
import { getUtcIsoWeekParts } from '../utils/isoWeek.js';
import logger from '../utils/logger.js';
import {
  buildWeeklySummaryEmailContext,
  escapeHtmlText
} from '../utils/weeklySummaryEmailContext.js';
import { withTimeout } from '../utils/withTimeout.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveInstagramIconDataUri() {
  try {
    const p = path.join(__dirname, '../assets/instagram.png');
    if (!fs.existsSync(p)) return null;
    const buf = fs.readFileSync(p);
    if (!buf || buf.length === 0) return null;
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch (_) {
    return null;
  }
}

const INSTAGRAM_ICON_DATA_URI = resolveInstagramIconDataUri();

const MAIL_PROVIDER_TIMEOUT_MS = parseInt(process.env.MAIL_PROVIDER_TIMEOUT_MS || '20000', 10);

// Configurar Gmail API si está disponible (Google Workspace)
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL || process.env.EMAIL_USER;
/** Debe coincidir con la "URI de redirección" del cliente OAuth usada al obtener el refresh token (p. ej. Playground). */
const GMAIL_OAUTH_REDIRECT_URI =
  process.env.GMAIL_OAUTH_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
const USE_GMAIL_API = !!(GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN);

// SendGrid: API key disponible (también como fallback si Gmail API falla en Render, etc.)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER;
const MAIL_OPT_OUT_SENDGRID = process.env.MAIL_OPT_OUT_SENDGRID === 'true';
const SENDGRID_CONFIGURED = !MAIL_OPT_OUT_SENDGRID && !!SENDGRID_API_KEY;
/** SendGrid como canal principal solo cuando no hay credenciales de Gmail API */
const USE_SENDGRID_PRIMARY = SENDGRID_CONFIGURED && !USE_GMAIL_API;

let gmailClient = null;
if (USE_GMAIL_API) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      GMAIL_OAUTH_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      refresh_token: GMAIL_REFRESH_TOKEN
    });
    
    gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
    console.log('[Mailer] ✅ Gmail API configurado correctamente (Google Workspace)');
    console.log(
      `[Mailer]    OAuth redirect_uri usado al refrescar token: ${GMAIL_OAUTH_REDIRECT_URI} (debe ser el mismo que al generar el refresh token)`
    );
  } catch (error) {
    console.warn('[Mailer] ⚠️ Error configurando Gmail API:', error.message);
    console.log('[Mailer] ⚠️ Intentando con otros proveedores...');
  }
}

// Inicializar SendGrid si hay API key (sirve como principal o como fallback tras Gmail API)
try {
  if (SENDGRID_CONFIGURED) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('[Mailer] ✅ SendGrid API key cargada (uso principal o fallback si Gmail API falla)');
  } else if (!USE_GMAIL_API) {
    console.log('[Mailer] ⚠️ SendGrid no configurado, usando Gmail SMTP como fallback');
  }
} catch (error) {
  console.warn('[Mailer] ⚠️ Error configurando SendGrid:', error.message);
  if (!USE_GMAIL_API) {
    console.log('[Mailer] ⚠️ Usando Gmail SMTP como fallback');
  }
}

if (USE_GMAIL_API && !GMAIL_USER_EMAIL) {
  console.warn(
    '[Mailer] ⚠️ Gmail API: falta GMAIL_USER_EMAIL (o EMAIL_USER). El envío por API puede fallar.'
  );
}

/** Un vistazo rápido al arranque: qué canal usará primero el mailer */
const logMailerBootstrap = () => {
  if (USE_GMAIL_API && gmailClient && GMAIL_USER_EMAIL) {
    console.log(`[Mailer] 📌 Correo: Gmail API como prioridad (desde ${GMAIL_USER_EMAIL})`);
    if (SENDGRID_CONFIGURED) {
      console.log('[Mailer]    Si la API falla → SendGrid; si SendGrid falla → Gmail SMTP (app password).');
    } else {
      console.log('[Mailer]    Si la API falla → Gmail SMTP (EMAIL_USER + EMAIL_APP_PASSWORD). En Render suele fallar SMTP; conviene SENDGRID_API_KEY.');
    }
  } else if (USE_GMAIL_API && !gmailClient) {
    console.warn('[Mailer] 📌 Gmail API parcialmente configurada pero el cliente no pudo iniciarse; revisa credenciales.');
  } else if (USE_SENDGRID_PRIMARY) {
    console.log(`[Mailer] 📌 Correo: SendGrid (${SENDGRID_FROM_EMAIL || 'sin FROM'})`);
  } else {
    console.log('[Mailer] 📌 Correo: Gmail SMTP (sin Gmail API ni SendGrid)');
  }
  if (MAIL_OPT_OUT_SENDGRID && SENDGRID_API_KEY) {
    console.log('[Mailer] ℹ️ MAIL_OPT_OUT_SENDGRID=true → no se usará SendGrid aunque exista SENDGRID_API_KEY.');
  }
};
logMailerBootstrap();

const EMAIL_LAYOUT_OUTER = `font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px 12px;background:${EMAIL_COLORS.BACKGROUND};`;
const EMAIL_LAYOUT_CARD = `background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:28px 24px;margin:0 auto;max-width:560px;box-shadow:0 2px 12px rgba(29,43,95,0.06);`;
const EMAIL_PREHEADER_HIDDEN = `display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:transparent;width:0;height:0;opacity:0;`;

function emailPreheaderHtml(escapedText) {
  return `<div style="${EMAIL_PREHEADER_HIDDEN}">${escapedText}</div>`;
}

const EMAIL_LEGAL_DISCLAIMER_ESCAPED = escapeHtmlText(getEmailLegalMedicalDisclaimerPlain());

/**
 * Formatea importe para comprobantes por correo (confirmación de compra).
 * @param {number|null|undefined} amount
 * @param {string} [currency]
 * @returns {string|null}
 */
function formatPurchaseAmount(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const n = Number(amount);
  const code = (currency || 'CLP').toUpperCase();
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: code }).format(n);
  } catch {
    return `${n.toLocaleString('es-CL')} ${code}`;
  }
}

const SUBSCRIPTION_PLAN_LABELS = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semestral: 'Semestral',
  yearly: 'Anual',
};

function subscriptionPlanDisplayName(plan) {
  return SUBSCRIPTION_PLAN_LABELS[plan] != null ? SUBSCRIPTION_PLAN_LABELS[plan] : String(plan ?? '');
}

/**
 * Bloque HTML de comprobante (fecha, producto, importe, proveedor, referencia, vigencia).
 * @param {object} receipt
 * @param {string} planNameRaw — etiqueta del plan sin escapar
 * @param {string} periodEndSafe — fecha fin ya escapada para HTML
 * @param {{ title?: string }} [options]
 */
function buildSubscriptionReceiptHtmlBlock(receipt, planNameRaw, periodEndSafe, options = {}) {
  if (!receipt) return '';
  const title = escapeHtmlText(options.title ?? 'Confirmación de compra');

  const purchaseDateStr = receipt.purchaseDate
    ? new Date(receipt.purchaseDate).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  const purchaseDateSafe = purchaseDateStr ? escapeHtmlText(purchaseDateStr) : null;
  const amountStr = formatPurchaseAmount(receipt.amount, receipt.currency);
  const amountSafe = amountStr ? escapeHtmlText(amountStr) : null;
  const providerSafe = escapeHtmlText(String(receipt.providerLabel ?? '—'));
  const referenceSafe = escapeHtmlText(String(receipt.reference ?? '—'));
  const productLineSafe = escapeHtmlText(`Suscripción premium — plan ${planNameRaw}`);

  const dateRow = purchaseDateSafe
    ? `<tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};width:38%;"><strong>Fecha</strong></td><td style="padding:10px 0;">${purchaseDateSafe}</td></tr>`
    : '';
  const amountRow = amountSafe
    ? `<tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Importe</strong></td><td style="padding:10px 0;"><strong style="color:${EMAIL_COLORS.PRIMARY_DARK};">${amountSafe}</strong></td></tr>`
    : '';

  return `
            <div style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM}10 0%,${EMAIL_COLORS.ACCENT}08 100%);padding:24px 18px 26px;border-radius:14px;margin:0 0 24px 0;text-align:left;border:1px solid rgba(29,43,95,0.12);border-left:4px solid ${EMAIL_COLORS.ACCENT};">
              <p style="color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:15px;font-weight:700;margin:0 0 16px 0;text-align:center;">
                ${title}
              </p>
              <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 14px 20px;">
                <table style="width:100%;border-collapse:collapse;color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.5;">
                  ${dateRow}
                  <tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Producto</strong></td><td style="padding:10px 0;">${productLineSafe}</td></tr>
                  ${amountRow}
                  <tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Pago procesado por</strong></td><td style="padding:10px 0;">${providerSafe}</td></tr>
                  <tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Referencia</strong></td><td style="padding:10px 0;word-break:break-word;font-family:'Segoe UI Mono','Menlo','Monaco',monospace;font-size:12px;line-height:1.45;">${referenceSafe}</td></tr>
                  <tr><td style="padding:12px 10px 0 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Vigencia hasta</strong></td><td style="padding:12px 0 0 0;">${periodEndSafe}</td></tr>
                </table>
              </div>
              <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:12px;margin:16px 0 0 0;text-align:center;line-height:1.55;">
                Puedes conservar este correo como comprobante. Para facturación o soporte, indica la referencia y el correo de tu cuenta.
              </p>
            </div>
          `;
}

// Helper: crear transporter de nodemailer
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    const error = new Error('Variables de entorno EMAIL_USER y EMAIL_APP_PASSWORD son requeridas para enviar correos');
    console.error('[Mailer] ⚠️ Configuración faltante:', error.message);
    throw error;
  }
  
  // Configuración mejorada para entornos de producción (Render, etc.)
  // Intentar primero con puerto 587 (TLS), si falla, usar 465 (SSL)
  const useSSL = process.env.EMAIL_USE_SSL === 'true';
  const port = useSSL ? 465 : 587;
  
  console.log(`[Mailer] 🔧 Configurando transporter con puerto ${port} (SSL: ${useSSL})`);
  
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: port,
    secure: useSSL, // true para 465, false para 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    // Opciones de conexión mejoradas para evitar timeouts
    connectionTimeout: 15000, // 15 segundos (aumentado)
    greetingTimeout: 15000, // 15 segundos (aumentado)
    socketTimeout: 15000, // 15 segundos (aumentado)
    // Opciones adicionales para entornos de producción
    tls: {
      rejectUnauthorized: false, // Permite certificados autofirmados (útil en algunos entornos)
      ciphers: 'SSLv3' // Forzar SSLv3 para compatibilidad
    },
    // Pool de conexiones
    pool: false, // Desactivar pool para evitar problemas de conexión
    // Requerir TLS
    requireTLS: !useSSL
  });
};

// Helper: generar footer común para emails
const getEmailFooter = (options = {}) => {
  const currentYear = new Date().getFullYear();
  const weeklyReply = options.weeklySummaryAllowReply === true;
  const replyHtml = weeklyReply
    ? '¿Dudas sobre la ampliación de prueba? Puedes responder a este correo indicando el email con el que inicias sesión en la app. Para otro tipo de consultas, te recomendamos Instagram (enlace arriba).<br>'
    : 'Este es un correo automático, por favor no respondas a este mensaje.<br>';
  return `
    <div style="text-align: center; margin: 0 24px 24px 24px;">
      <div style="margin: 10px 0 14px 0;">
        <a
          href="${INSTAGRAM_URL}"
          target="_blank"
          rel="noopener noreferrer"
          style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_MEDIUM} 0%, ${EMAIL_COLORS.ACCENT} 100%); color: ${EMAIL_COLORS.TEXT_WHITE}; padding: 10px 16px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 0.95rem;"
        >
          ${
            INSTAGRAM_ICON_DATA_URI
              ? `<img src="${INSTAGRAM_ICON_DATA_URI}" alt="Instagram" width="20" height="20" style="vertical-align: -4px; margin-right: 8px; border-radius: 5px;" />`
              : ''
          }
          Instagram
        </a>
        <div style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 0.9rem; margin-top: 8px;">
          Feedback rápido, novedades y soporte.
        </div>
      </div>
      <p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 0.95rem; margin: 0;">
        ${replyHtml}
        © ${currentYear} <span style="color: ${EMAIL_COLORS.ACCENT};">${APP_NAME}</span>. Todos los derechos reservados.
      </p>
    </div>
  `;
};

// Helper: generar header común para emails
/**
 * URL del botón “Abrir en la app” en correos (resumen semanal, confirmación Mercado Pago, etc.).
 *
 * Prioridad (modo normal):
 * 1. `EMAIL_APP_OPEN_LINK` — URL única para todos los CTAs (HTTPS recomendado en producción).
 * 2. `WEEKLY_SUMMARY_EMAIL_APP_LINK` — compat / override histórico.
 * 3. Si `WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY=true` — esquema (`WEEKLY_SUMMARY_APP_SCHEME`, default `anto`) + `WEEKLY_SUMMARY_APP_PATH` (por defecto `weekly-summary`). Se emite `anto:///ruta` (triple barra) para que el path sea reconocible por la app, no solo el host.
 * 4. `FRONTEND_URL` + `WEEKLY_SUMMARY_EMAIL_LINK_PATH`.
 *
 * Modo `subscriptionThankYou: true` (solo correo post-pago MP / agradecimiento):
 * - Antes de (1): `SUBSCRIPTION_THANKYOU_EMAIL_APP_LINK` si está definida (CTA específico post-compra).
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @param {{ subscriptionThankYou?: boolean }} [options]
 * @returns {string}
 */
export function buildEmailAppOpenHref(env = process.env, options = {}) {
  const subscriptionThankYou = options.subscriptionThankYou === true;
  if (subscriptionThankYou) {
    const subDirect = env.SUBSCRIPTION_THANKYOU_EMAIL_APP_LINK;
    if (subDirect && typeof subDirect === 'string' && subDirect.trim()) {
      return subDirect.trim();
    }
  }

  const emailAppOpen = env.EMAIL_APP_OPEN_LINK;
  if (emailAppOpen && typeof emailAppOpen === 'string' && emailAppOpen.trim()) {
    return emailAppOpen.trim();
  }

  const weeklyDirect = env.WEEKLY_SUMMARY_EMAIL_APP_LINK;
  if (weeklyDirect && typeof weeklyDirect === 'string' && weeklyDirect.trim()) {
    return weeklyDirect.trim();
  }

  if (env.WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY === 'true') {
    const rawScheme = String(env.WEEKLY_SUMMARY_APP_SCHEME || 'anto').trim().toLowerCase();
    const scheme = (rawScheme.replace(/:$/, '').split(':')[0] || 'anto').replace(/[^a-z0-9._-]/gi, '') || 'anto';
    const pathEnv = env.WEEKLY_SUMMARY_APP_PATH;
    const rawPath = String(pathEnv !== undefined && pathEnv !== null ? pathEnv : 'weekly-summary')
      .trim()
      .replace(/^\/+/, '');
    if (!rawPath) {
      return `${scheme}://`;
    }
    // anto:///weekly-summary → pathname /weekly-summary (Linking + deep link en app). anto://weekly-summary deja todo en el host y muchos clientes no exponen path.
    return `${scheme}:///${rawPath}`;
  }

  const baseSource =
    env.FRONTEND_URL && String(env.FRONTEND_URL).trim()
      ? String(env.FRONTEND_URL).trim()
      : FRONTEND_URL;
  const base = (baseSource || '').replace(/\/$/, '');
  let path = (env.WEEKLY_SUMMARY_EMAIL_LINK_PATH || '/').trim();
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (!base) {
    return path;
  }
  return `${base}${path}`;
}

/** @deprecated Usar `buildEmailAppOpenHref` */
export const buildWeeklySummaryAppHref = buildEmailAppOpenHref;

function getWeeklySummaryAppHref() {
  return buildEmailAppOpenHref(process.env);
}

function getWeeklySummaryAppStoreHref() {
  const direct =
    process.env.WEEKLY_SUMMARY_APPSTORE_LINK ||
    process.env.EMAIL_APPSTORE_LINK ||
    process.env.WEEKLY_SUMMARY_DOWNLOAD_APP_LINK ||
    process.env.EMAIL_DOWNLOAD_APP_LINK;
  if (direct && typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  return 'https://apps.apple.com/cl/app/anto/id6756631911';
}

const getEmailHeader = (title, logoAlt = `${APP_NAME} Logo`) => {
  return `
    <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_DARK} 0%, ${EMAIL_COLORS.PRIMARY_MEDIUM} 60%, ${EMAIL_COLORS.ACCENT} 100%); padding: 36px 0 24px 0; border-radius: 0 0 32px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); text-align: center;">
      <img src="${LOGO_URL}" alt="${logoAlt}" style="width: 64px; height: 64px; margin-bottom: 12px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.10);" />
      <h1 style="color: ${EMAIL_COLORS.TEXT_WHITE}; margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 8px rgba(0,0,0,0.15);">
        ${title}
      </h1>
    </div>
  `;
};

// Plantillas de correo
const emailTemplates = {
  /**
   * Plantilla para código de verificación (recuperación de contraseña)
   */
  verificationCode: (code) => ({
    subject: `Código de Verificación - ${APP_NAME_FULL}`,
    html: `
      <div style="${EMAIL_LAYOUT_OUTER}">
        ${emailPreheaderHtml(escapeHtmlText(`Tu código para restablecer acceso en ${APP_NAME}.`))}
        ${getEmailHeader('Código de verificación')}
        <div style="${EMAIL_LAYOUT_CARD}">
          <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 20px 0;text-align:center;">
            Usa este código para recuperar tu contraseña:
          </p>
          <div style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);padding:3px;border-radius:12px;margin:0 0 22px 0;">
            <div style="background:#ffffff;padding:20px 0;border-radius:10px;">
              <span style="display:block;color:${EMAIL_COLORS.TEXT_DARK};font-size:2rem;text-align:center;letter-spacing:10px;font-weight:700;font-family:'Segoe UI Mono','Menlo','Monaco',monospace;">
                ${code}
              </span>
            </div>
          </div>
          <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:14px;margin:0 0 8px 0;text-align:center;line-height:1.55;">
            Este código expira en <strong>${CODE_EXPIRATION_MINUTES} minutos</strong>.
          </p>
          <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;margin:0;text-align:center;line-height:1.55;">
            Si no solicitaste este código, puedes ignorar este correo.
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    `
  }),

  /**
   * Plantilla para código de verificación de email (registro)
   */
  emailVerificationCode: (code, username) => {
    const safeUser = escapeHtmlText(String(username ?? '').trim() || 'Usuario');
    return {
    subject: `Verifica tu Email - ${APP_NAME_FULL}`,
    html: `
      <div style="${EMAIL_LAYOUT_OUTER}">
        ${emailPreheaderHtml(escapeHtmlText(`Código para verificar tu correo en ${APP_NAME}.`))}
        ${getEmailHeader('Verifica tu email')}
        <div style="${EMAIL_LAYOUT_CARD}">
          <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 20px 0;text-align:center;">
            Hola, ${safeUser}. Para completar el registro, introduce este código:
          </p>

          <div style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);padding:3px;border-radius:12px;margin:0 0 22px 0;">
            <div style="background:#ffffff;padding:20px 0;border-radius:10px;">
              <span style="display:block;color:${EMAIL_COLORS.TEXT_DARK};font-size:2rem;text-align:center;letter-spacing:10px;font-weight:700;font-family:'Segoe UI Mono','Menlo','Monaco',monospace;">
                ${code}
              </span>
            </div>
          </div>

          <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:14px;margin:0 0 8px 0;text-align:center;line-height:1.55;">
            Este código expira en <strong>${CODE_EXPIRATION_MINUTES} minutos</strong>.
          </p>
          <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;margin:0;text-align:center;line-height:1.55;">
            Si no creaste esta cuenta, puedes ignorar este correo.
          </p>
        </div>

        ${getEmailFooter()}
      </div>
    `
    };
  },

  /**
   * Plantilla para restablecimiento de contraseña
   */
  resetPassword: (token) => ({
    subject: `Restablecer Contraseña - ${APP_NAME_FULL}`,
    html: `
      <div style="${EMAIL_LAYOUT_OUTER}">
        ${emailPreheaderHtml(escapeHtmlText(`Enlace para restablecer contraseña en ${APP_NAME}.`))}
        ${getEmailHeader('Restablecer contraseña')}
        <div style="${EMAIL_LAYOUT_CARD}">
          <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 22px 0;text-align:center;">
            Solicitaste restablecer tu contraseña. Pulsa el botón para continuar:
          </p>
          <div style="text-align:center;margin:0 0 22px 0;">
            <a href="${FRONTEND_URL}${RESET_PASSWORD_PATH}?token=${token}"
               style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);color:${EMAIL_COLORS.TEXT_WHITE};padding:14px 26px;text-decoration:none;border-radius:10px;display:inline-block;font-weight:700;font-size:15px;">
              ${escapeHtmlText(emailCtaLabel.resetPassword())}
            </a>
          </div>
          <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;margin:0 0 8px 0;text-align:center;line-height:1.55;">
            Este enlace expira en ${RESET_TOKEN_EXPIRATION_HOURS} hora${RESET_TOKEN_EXPIRATION_HOURS > 1 ? 's' : ''}.
          </p>
          <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;margin:0;text-align:center;line-height:1.55;">
            Si no solicitaste restablecer tu contraseña, ignora este correo.
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    `
  }),

  /**
   * Plantilla para correo de bienvenida (tono cercano; sin sustituir aviso médico ni terapia presencial).
   */
  welcomeEmail: (username) => {
    const safeName = escapeHtmlText(username);
    const appHref = buildEmailAppOpenHref(process.env);
    const rawUser = String(username ?? '').trim();
    const preheaderText = escapeHtmlText(
      rawUser
        ? `Gracias por registrarte, ${rawUser}. Abre ${APP_NAME} y revisa unos primeros pasos en este correo.`
        : `Gracias por registrarte en ${APP_NAME}. Abre la app y revisa unos primeros pasos en este correo.`
    );
    const body = `color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 14px 0;text-align:left;`;
    const small = `color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;line-height:1.55;margin:0;text-align:left;`;
    return {
      subject: `Bienvenido a ${APP_NAME}`,
      html: `
      <div style="${EMAIL_LAYOUT_OUTER}">
        ${emailPreheaderHtml(preheaderText)}
        ${getEmailHeader(`Bienvenido, ${safeName}`)}

        <div style="${EMAIL_LAYOUT_CARD}">
          <p style="${body}">
            Gracias por registrarte. <strong>${APP_NAME}</strong> es un espacio para conversar con calma, ordenar lo que sientes y, si te encaja, usar tareas, hábitos o recordatorios sin una obligación fija.
          </p>
          <p style="${small}margin-bottom:18px;">
            ${EMAIL_LEGAL_DISCLAIMER_ESCAPED}
          </p>

          <p style="color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:15px;font-weight:700;margin:0 0 12px 0;text-align:left;">
            Primeros pasos
          </p>
          <ul style="color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.55;margin:0 0 22px 0;padding-left:20px;text-align:left;">
            <li style="margin:0 0 8px 0;"><strong>Abre el chat</strong> y escribe con naturalidad: no hace falta un “tema grande” para empezar.</li>
            <li style="margin:0 0 8px 0;"><strong>Tareas, hábitos y pomodoros</strong> desde el chat, cuando te encajen: son un apoyo al día a día, no una obligación.</li>
            <li style="margin:0 0 8px 0;"><strong>Resumen semanal y mensual</strong> en Perfil te da perspectiva sobre tu actividad cuando quieras mirar atrás sin presión.</li>
            <li style="margin:0 0 0 0;">Si algo no te encaja en el tono o las sugerencias, <strong>corrige o cambia de tema</strong>: la conversación va a tu ritmo.</li>
          </ul>

          <div style="text-align:center;margin:8px 0 14px 0;">
            <a href="${appHref}"
               style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);color:${EMAIL_COLORS.TEXT_WHITE};padding:14px 26px;text-decoration:none;border-radius:10px;display:inline-block;font-weight:700;font-size:15px;">
              ${escapeHtmlText(emailCtaLabel.openApp())}
            </a>
          </div>
          <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;line-height:1.5;margin:0 0 20px 0;text-align:center;">
            Si el enlace no abre la app, ábrela manualmente e inicia sesión con esta cuenta.
          </p>

          <p style="${small}">
            Dudas o feedback: puedes escribirnos por los canales que enlazamos abajo (Instagram). Este mensaje es automático; para hablar con ${APP_NAME}, usa la app.
          </p>
        </div>

        ${getEmailFooter()}
      </div>
    `
    };
  },

  /**
   * Plantilla para correo de re-engagement (usuarios inactivos). Tip rotado de forma determinista por `daysInactive` (misma inactividad → mismo texto; estable en tests).
   */
  reEngagementEmail: (username, daysInactive) => {
    const safeName = escapeHtmlText(String(username ?? '').trim() || 'Usuario');
    const rawDays = Number(daysInactive);
    const d = Number.isFinite(rawDays) && rawDays >= 1 ? Math.floor(rawDays) : 1;
    const appHref = buildEmailAppOpenHref(process.env);
    const tips = [
      'Escribe con naturalidad cómo te sientes hoy: no hace falta un tema grande para volver a empezar.',
      'Pide una guía breve de relajación o mindfulness cuando necesites bajar la intensidad del día.',
      'Reflexiona con calma sobre emociones y pensamientos; ordenar lo que pasa por la cabeza ya ayuda.',
      'Establece una meta pequeña y realista para hoy; celebrar avances modestos también suma.',
      'Si te sirve mirar atrás, revisa conversaciones anteriores con la misma cuenta.',
    ];
    const tipIndex = d % tips.length;
    const tipText = tips[tipIndex];
    const preheaderText = escapeHtmlText(
      `Hace ${d} día${d !== 1 ? 's' : ''} sin actividad en ${APP_NAME}. Recordatorio amable: puedes abrir la app cuando te venga bien.`
    );
    const body = `color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 14px 0;text-align:left;`;
    const small = `color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;line-height:1.55;margin:0;text-align:left;`;
    const sectionTitle = `color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:15px;font-weight:700;margin:0 0 10px 0;text-align:left;`;

    return {
      subject: `Hace tiempo que no abres ${APP_NAME}`,
      html: `
        <div style="${EMAIL_LAYOUT_OUTER}">
          ${emailPreheaderHtml(preheaderText)}
          ${getEmailHeader(`Hola, ${safeName}`)}

          <div style="${EMAIL_LAYOUT_CARD}">
            <p style="${body}">
              Hace <strong>${d}</strong> día${d !== 1 ? 's' : ''} que no registramos actividad con tu cuenta. No pasa nada: los ritmos cambian. Si te apetece, <strong>${APP_NAME}</strong> sigue aquí cuando quieras volver.
            </p>
            <p style="${small}margin-bottom:12px;">
              ${EMAIL_LEGAL_DISCLAIMER_ESCAPED}
            </p>
            <p style="${small}margin-bottom:20px;">
              Abrir este correo o la app <strong>no genera un cargo adicional</strong>: tu cuenta sigue igual hasta que elijas suscribirte, si en algún momento lo haces.
            </p>

            <div style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM}12 0%,${EMAIL_COLORS.ACCENT}12 100%);padding:22px 18px;border-radius:12px;margin:0 0 22px 0;border-left:4px solid ${EMAIL_COLORS.ACCENT};">
              <p style="${sectionTitle}margin-bottom:4px;">Idea para retomar</p>
              <p style="${small}margin-bottom:10px;font-size:12px;line-height:1.45;">
                Sugerencia general de una lista rotativa; no está ligada a tu actividad reciente en la app.
              </p>
              <p style="${body}margin-bottom:0;">
                ${escapeHtmlText(tipText)}
              </p>
            </div>

            <p style="${sectionTitle}">Qué puedes hacer en la app</p>
            <ul style="color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.55;margin:0 0 22px 0;padding-left:20px;text-align:left;">
              <li style="margin:0 0 8px 0;">Chat cuando lo necesites, sin agenda.</li>
              <li style="margin:0 0 8px 0;">Tareas, hábitos y recordatorios si te encajan en tu día a día.</li>
              <li style="margin:0 0 0 0;">Resumen de actividad en Perfil cuando quieras perspectiva, sin presión.</li>
            </ul>

            <div style="text-align:center;margin:8px 0 14px 0;">
              <a href="${appHref}"
                 style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);color:${EMAIL_COLORS.TEXT_WHITE};padding:14px 26px;text-decoration:none;border-radius:10px;display:inline-block;font-weight:700;font-size:15px;">
                ${escapeHtmlText(emailCtaLabel.openApp())}
              </a>
            </div>
            <p style="${small}text-align:center;margin:0 0 18px 0;">
              Si el enlace no abre la app, ábrela manualmente e inicia sesión con esta cuenta.
            </p>

            <p style="${small}">
              Dudas o feedback: canales enlazados al pie (Instagram). Este mensaje es automático.
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      `
    };
  },

  /**
   * Retención trial (~2.º día de prueba corta): español neutro, sin presión; CTA a app / resumen.
   * @param {string} username
   * @param {Date|string} trialEndDate
   */
  trialRetentionEmail: (username, trialEndDate) => {
    const safeName = escapeHtmlText(String(username ?? '').trim() || 'Usuario');
    const end = new Date(trialEndDate);
    const now = new Date();
    const msLeft = end.getTime() - now.getTime();
    const hoursLeft =
      Number.isFinite(msLeft) && msLeft > 0
        ? Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60)))
        : 1;
    const daysApprox =
      hoursLeft >= 24 ? Math.max(1, Math.round(hoursLeft / 24)) : null;
    const premiumHref = buildEmailAppOpenHref(process.env, { subscriptionThankYou: true });
    const summaryHref = getWeeklySummaryAppHref();
    const endFormatted = end.toLocaleDateString('es', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const endSafe = escapeHtmlText(endFormatted);
    const fewHours = hoursLeft < 6;
    let preheaderPlain;
    if (fewHours) {
      preheaderPlain =
        daysApprox != null
          ? `Te quedan pocas horas de prueba (aprox. ${daysApprox} día${daysApprox !== 1 ? 's' : ''}) en ${APP_NAME}. Puedes ver planes Premium o abrir tu resumen desde este correo.`
          : `Te quedan pocas horas de prueba en ${APP_NAME}. Puedes ver planes Premium o abrir tu resumen desde este correo.`;
    } else {
      preheaderPlain =
        daysApprox != null
          ? `Te quedan unas ${hoursLeft} horas de prueba (aprox. ${daysApprox} día${daysApprox !== 1 ? 's' : ''}) en ${APP_NAME}. Puedes ver planes Premium o abrir tu resumen desde este correo.`
          : `Te quedan unas ${hoursLeft} horas de prueba en ${APP_NAME}. Puedes ver planes Premium o abrir tu resumen desde este correo.`;
    }
    const preheaderText = escapeHtmlText(preheaderPlain);
    const body = `color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 14px 0;text-align:left;`;
    const small = `color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;line-height:1.55;margin:0;text-align:left;`;
    const sectionTitle = `color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:15px;font-weight:700;margin:0 0 10px 0;text-align:left;`;

    const timeBodyHtml = fewHours
      ? `Te quedan <strong style="color:${EMAIL_COLORS.ACCENT};">pocas horas</strong> de prueba${
          daysApprox != null
            ? `, unos <strong>${daysApprox}</strong> día${daysApprox !== 1 ? 's' : ''} a modo orientativo`
            : ''
        }. Si te resulta útil, puedes pasarte a <strong>Premium</strong> y mantener el acceso completo cuando termine la prueba, sin obligación de decidir ya mismo.`
      : `Te quedan aproximadamente <strong style="color:${EMAIL_COLORS.ACCENT};">${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}</strong> de prueba${
          daysApprox != null
            ? `, unos <strong>${daysApprox}</strong> día${daysApprox !== 1 ? 's' : ''} a modo orientativo`
            : ''
        }. Si te resulta útil, puedes pasarte a <strong>Premium</strong> y mantener el acceso completo cuando termine la prueba, sin obligación de decidir ya mismo.`;

    return {
      subject: `Tu prueba en ${APP_NAME} termina pronto`,
      html: `
        <div style="${EMAIL_LAYOUT_OUTER}">
          ${emailPreheaderHtml(preheaderText)}
          ${getEmailHeader(`Hola, ${safeName}`)}

          <div style="${EMAIL_LAYOUT_CARD}">
            <p style="${sectionTitle}margin-bottom:12px;">Prueba por terminar</p>
            <p style="${body}">
              Tu periodo gratuito sirve para conocer <strong>${APP_NAME}</strong> con calma.
            </p>
            <p style="${small}margin-bottom:14px;">
              ${EMAIL_LEGAL_DISCLAIMER_ESCAPED}
            </p>
            <p style="${body}margin-bottom:18px;">
              ${timeBodyHtml}
            </p>

            <p style="${small}margin-bottom:20px;">
              <strong>Fecha orientativa de fin:</strong> ${endSafe}.
              <span> El detalle exacto lo ves en la app con tu sesión iniciada.</span>
            </p>

            <hr style="border:0;border-top:1px solid #e8edf4;margin:22px 0;height:0;" />

            <p style="${sectionTitle}">Con Premium sigues teniendo</p>
            <ul style="color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.55;margin:0 0 22px 0;padding-left:20px;text-align:left;">
              <li style="margin:0 0 8px 0;">Chat y herramientas sin el tope de la prueba.</li>
              <li style="margin:0 0 8px 0;">Resumen de actividad y continuidad en tu proceso.</li>
              <li style="margin:0 0 0 0;">El mismo espacio, con el ritmo que tú elijas.</li>
            </ul>

            <div style="text-align:center;margin:10px 0 10px 0;">
              <a href="${premiumHref}"
                 style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);color:${EMAIL_COLORS.TEXT_WHITE};padding:14px 26px;text-decoration:none;border-radius:10px;display:inline-block;font-weight:700;font-size:15px;">
                ${escapeHtmlText(emailCtaLabel.trialPremium())}
              </a>
            </div>
            <p style="${small}text-align:center;margin:0 0 14px 0;">
              Si el enlace no abre la app, ábrela manualmente e inicia sesión; revisa suscripción o pagos dentro de ${APP_NAME}.
            </p>
            <p style="text-align:center;margin:0;">
              <a href="${summaryHref}"
                 style="color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:14px;font-weight:600;text-decoration:underline;">
                ${escapeHtmlText(emailCtaLabel.trialWeeklySummary())}
              </a>
            </p>

            <p style="${small}margin-top:22px;">
              Gracias por probar ${APP_NAME}. Dudas o feedback: canales enlazados al pie (Instagram). Este mensaje es automático.
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      `
    };
  },

  /**
   * Plantilla para correo de tips semanales
   */
  weeklyTipsEmail: (username, weekNumber) => {
    const weeklyTips = [
      {
        title: '🌱 Practica la Gratitud',
        content: 'Cada día, antes de dormir, escribe 3 cosas por las que estás agradecido. Esto ayuda a entrenar tu mente para enfocarse en lo positivo.',
        action: 'Pregúntale a Anto: "¿Cómo puedo practicar la gratitud diariamente?"'
      },
      {
        title: '🧘 Técnica de Respiración 4-7-8',
        content: 'Inhala por 4 segundos, mantén por 7, exhala por 8. Repite 4 veces. Esta técnica ayuda a reducir la ansiedad y mejorar el sueño.',
        action: 'Pregúntale a Anto: "Enséñame ejercicios de respiración para relajarme"'
      },
      {
        title: '💭 Diario de Emociones',
        content: 'Escribe cómo te sientes cada día. Identificar tus emociones es el primer paso para gestionarlas mejor.',
        action: 'Pregúntale a Anto: "¿Cómo puedo llevar un diario de emociones?"'
      },
      {
        title: '🌿 Mindfulness de 5 Minutos',
        content: 'Dedica 5 minutos al día a estar presente. Observa tu respiración, los sonidos alrededor, las sensaciones de tu cuerpo.',
        action: 'Pregúntale a Anto: "Guíame en una meditación de 5 minutos"'
      },
      {
        title: '🤝 Autocompasión',
        content: 'Trátate con la misma amabilidad que tratarías a un buen amigo. Recuerda que está bien no estar bien todo el tiempo.',
        action: 'Pregúntale a Anto: "¿Cómo puedo practicar la autocompasión?"'
      },
      {
        title: '🎯 Pequeñas Metas',
        content: 'Establece metas pequeñas y alcanzables. Celebrar pequeños logros construye confianza y motivación.',
        action: 'Pregúntale a Anto: "Ayúdame a establecer metas realistas de bienestar"'
      },
      {
        title: '🌙 Higiene del Sueño',
        content: 'Mantén un horario regular de sueño. Evita pantallas 1 hora antes de dormir y crea una rutina relajante.',
        action: 'Pregúntale a Anto: "¿Cómo puedo mejorar mi calidad de sueño?"'
      }
    ];

    const tip = weeklyTips[weekNumber % weeklyTips.length];
    const safeTipUser = escapeHtmlText(String(username ?? '').trim() || 'Usuario');
    const tipsAppHref = buildEmailAppOpenHref(process.env);
    const smallTip = `color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;line-height:1.55;margin:0;text-align:left;`;

    return {
      subject: `Tip semanal de ${APP_NAME} — Semana ${weekNumber}`,
      html: `
        <div style="${EMAIL_LAYOUT_OUTER}">
          ${emailPreheaderHtml(escapeHtmlText(`Idea breve de bienestar y ${APP_NAME} (semana ${weekNumber}).`))}
          ${getEmailHeader(`Tip semanal — Semana ${weekNumber}`)}
          <div style="${EMAIL_LAYOUT_CARD}">
            <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 20px 0;text-align:center;">
              Hola, ${safeTipUser}. Esta semana compartimos un recordatorio sencillo.
            </p>

            <div style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM}12 0%,${EMAIL_COLORS.ACCENT}12 100%);padding:22px 18px;border-radius:12px;margin:0 0 22px 0;border-left:4px solid ${EMAIL_COLORS.ACCENT};">
              <p style="color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:16px;font-weight:700;margin:0 0 12px 0;text-align:center;">
                ${tip.title}
              </p>
              <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;text-align:center;margin:0 0 16px 0;">
                ${tip.content}
              </p>
              <div style="background:#ffffff;padding:14px 12px;border-radius:10px;border:1px dashed rgba(29,43,95,0.15);">
                <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;margin:0;text-align:center;line-height:1.55;">
                  <strong>Prueba en el chat:</strong><br>
                  ${tip.action}
                </p>
              </div>
            </div>

            <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.6;margin:0 0 18px 0;text-align:center;">
              El bienestar emocional es un proceso; cada paso pequeño cuenta. ${APP_NAME} está disponible cuando quieras retomar.
            </p>

            <p style="${smallTip}margin-bottom:16px;text-align:center;">
              ${EMAIL_LEGAL_DISCLAIMER_ESCAPED}
            </p>

            <div style="text-align:center;margin:0 0 12px 0;">
              <a href="${tipsAppHref}"
                 style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);color:${EMAIL_COLORS.TEXT_WHITE};padding:14px 26px;text-decoration:none;border-radius:10px;display:inline-block;font-weight:700;font-size:15px;">
                ${escapeHtmlText(emailCtaLabel.openApp())}
              </a>
            </div>
            <p style="${smallTip}text-align:center;margin:0;">
              Si el enlace no abre la app, ábrela manualmente e inicia sesión con tu cuenta.
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      `
    };
  },

  /**
   * Aviso de resumen semanal: impulso a abrir la app. Puede llevar saludo con nombre;
   * no incluye cifras ni métricas sensibles (crisis, etc.) ni contenido del chat.
   * @param {object} context — resultado de `buildWeeklySummaryEmailContext`
   */
  weeklySummaryEmail: (context) => {
    const appHref = getWeeklySummaryAppHref();
    const appStoreHref = getWeeklySummaryAppStoreHref();
    const greeting = context.displayName
      ? `Hola, <strong>${context.displayName}</strong>.`
      : `Hola.`;
    const benefitListHtml = (context.benefitLines || [])
      .map(
        (line) =>
          `<li style="margin:0 0 8px 0;padding-left:2px;">${escapeHtmlText(line)}</li>`
      )
      .join('');
    const updatesListHtml = (context.updatesLines || [])
      .map(
        (line) =>
          `<li style="margin:0 0 8px 0;padding-left:2px;">${escapeHtmlText(line)}</li>`
      )
      .join('');
    const sectionTitle = `color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:15px;font-weight:700;margin:0 0 12px 0;line-height:1.3;`;
    const body = `color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 14px 0;text-align:left;`;
    const small = `color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;line-height:1.55;margin:0 0 12px 0;text-align:left;`;
    const hr = `border:0;border-top:1px solid #e8edf4;margin:22px 0;height:0;`;

    return {
      subject: context.subjectLine,
      html: `
        <div style="${EMAIL_LAYOUT_OUTER}">
          ${emailPreheaderHtml(escapeHtmlText(context.preheaderText))}
          ${getEmailHeader('Resumen semanal')}
          <div style="${EMAIL_LAYOUT_CARD}">
            <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;font-weight:600;margin:0 0 6px 0;text-align:left;letter-spacing:0.02em;">
              ${escapeHtmlText(context.weekLabel)}
            </p>
            <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:18px;font-weight:600;margin:0 0 16px 0;text-align:left;line-height:1.35;">
              ${greeting}
            </p>

            <div style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM}16 0%,${EMAIL_COLORS.ACCENT}14 100%);border:2px solid ${EMAIL_COLORS.ACCENT};border-radius:14px;padding:22px 20px 20px;margin:0 0 18px 0;text-align:left;box-shadow:0 4px 18px rgba(29,43,95,0.08);">
              <p style="color:${EMAIL_COLORS.ACCENT};font-size:12px;font-weight:800;margin:0 0 10px 0;letter-spacing:0.1em;text-transform:uppercase;">
                ${escapeHtmlText(context.giftBadgeLabel)}
              </p>
              <p style="color:${EMAIL_COLORS.TEXT_DARK};font-size:20px;font-weight:800;margin:0 0 12px 0;line-height:1.25;">
                ${escapeHtmlText(context.giftTitle)}
              </p>
              <p style="${body}margin-bottom:10px;">
                ${escapeHtmlText(context.giftPrimary)}
              </p>
              <p style="${small}margin-bottom:0;line-height:1.55;">
                ${escapeHtmlText(context.giftSecondary)}
              </p>
            </div>

            <div style="background:#f4f7fb;border:1px solid #dbe4f0;border-radius:14px;padding:20px 18px 18px;margin:0 0 22px 0;border-left:5px solid ${EMAIL_COLORS.PRIMARY_MEDIUM};">
              <p style="color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:16px;font-weight:800;margin:0 0 6px 0;line-height:1.25;">
                ${escapeHtmlText(context.updatesSectionTitle)}
              </p>
              <p style="color:${EMAIL_COLORS.ACCENT};font-size:11px;font-weight:700;margin:0 0 12px 0;letter-spacing:0.08em;text-transform:uppercase;">
                Destacado esta semana
              </p>
              <p style="${body}margin-bottom:12px;">
                ${escapeHtmlText(context.updatesIntro)}
              </p>
              <ul style="color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.6;margin:0;padding-left:20px;text-align:left;">
                ${updatesListHtml}
              </ul>
              <p style="${small}margin-top:14px;margin-bottom:0;padding-top:14px;border-top:1px solid #dbe4f0;line-height:1.55;">
                ${escapeHtmlText(context.postUpdatesActionLine)}
              </p>
            </div>

            <hr style="${hr}" />
            <p style="${body}margin-bottom:12px;">
              ${escapeHtmlText(context.openingBenefitLine)}
            </p>
            <hr style="${hr}" />
            <p style="${body}">
              ${escapeHtmlText(context.leadParagraph)}
            </p>

            <div style="text-align:center;margin:22px 0 8px 0;">
              <a href="${appHref}"
                 style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);color:${EMAIL_COLORS.TEXT_WHITE};padding:14px 26px;text-decoration:none;border-radius:10px;display:inline-block;font-weight:700;font-size:15px;">
                ${escapeHtmlText(emailCtaLabel.weeklySummary())}
              </a>
            </div>
            <p style="${small}text-align:center;margin-top:10px;">
              Si el enlace no abre la app: inicia sesión y ve a <strong>Perfil</strong> → «Resumen semanal y mensual».
            </p>

            <hr style="${hr}" />

            <p style="${sectionTitle}">${escapeHtmlText(context.benefitSectionTitle)}</p>
            <ul style="color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.55;margin:0;padding-left:20px;text-align:left;">
              ${benefitListHtml}
            </ul>

            <hr style="${hr}" />

            <p style="${small}margin-bottom:10px;">${escapeHtmlText(context.privacyParagraph)}</p>
            <p style="${small}margin-bottom:0;">${escapeHtmlText(context.whereParagraph)}</p>

            <p style="${body}margin-top:22px;margin-bottom:8px;text-align:center;font-size:14px;">
              ${escapeHtmlText(context.downloadPrompt)}
            </p>
            <div style="text-align:center;margin:0 0 8px 0;">
              <a href="${appStoreHref}"
                 style="color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:14px;font-weight:600;text-decoration:underline;">
                Descargar en App Store
              </a>
            </div>
            <p style="${small}text-align:center;font-style:italic;margin-top:18px;margin-bottom:0;">
              ${escapeHtmlText(context.closingLine)}
            </p>
            <hr style="${hr}" />
            <p style="${small}text-align:center;margin:0;">
              ${EMAIL_LEGAL_DISCLAIMER_ESCAPED}
            </p>
          </div>
          ${getEmailFooter({ weeklySummaryAllowReply: true })}
        </div>
      `
    };
  },

  /**
   * Plantilla para correo de agradecimiento por suscripción + bloque opcional de confirmación de compra.
   * @param {string} username
   * @param {string} plan
   * @param {Date|string} periodEnd
   * @param {null|{
   *   purchaseDate: Date|string,
   *   amount?: number|null,
   *   currency?: string,
   *   providerLabel: string,
   *   reference: string
   * }} [receipt] - Si viene informado, se muestra resumen tipo comprobante.
   */
  subscriptionThankYouEmail: (username, plan, periodEnd, receipt = null) => {
    const appOpenHref = buildEmailAppOpenHref(process.env, { subscriptionThankYou: true });
    const planNameRaw = subscriptionPlanDisplayName(plan);
    const planName = escapeHtmlText(planNameRaw);
    const safeName = escapeHtmlText(String(username ?? '').trim() || 'Usuario');

    const end = new Date(periodEnd);
    const periodEndDate = Number.isFinite(end.getTime())
      ? end.toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—';
    const periodEndSafe = escapeHtmlText(periodEndDate);

    const purchaseDateStr = receipt?.purchaseDate
      ? new Date(receipt.purchaseDate).toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;
    const purchaseDateSafe = purchaseDateStr ? escapeHtmlText(purchaseDateStr) : null;
    const amountStr = formatPurchaseAmount(receipt?.amount, receipt?.currency);
    const amountSafe = amountStr ? escapeHtmlText(amountStr) : null;
    const providerSafe = escapeHtmlText(String(receipt?.providerLabel ?? '—'));
    const referenceSafe = escapeHtmlText(String(receipt?.reference ?? '—'));
    const productLineSafe = escapeHtmlText(`Suscripción premium — plan ${planNameRaw}`);

    const receiptBlock = receipt
      ? `
            <div style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM}10 0%,${EMAIL_COLORS.ACCENT}08 100%);padding:24px 18px 26px;border-radius:14px;margin:0 0 24px 0;text-align:left;border:1px solid rgba(29,43,95,0.12);border-left:4px solid ${EMAIL_COLORS.ACCENT};">
              <p style="color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:15px;font-weight:700;margin:0 0 16px 0;text-align:center;">
                Confirmación de compra
              </p>
              <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 14px 20px;">
                <table style="width:100%;border-collapse:collapse;color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.5;">
                  ${
                    purchaseDateSafe
                      ? `<tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};width:38%;"><strong>Fecha</strong></td><td style="padding:10px 0;">${purchaseDateSafe}</td></tr>`
                      : ''
                  }
                  <tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Producto</strong></td><td style="padding:10px 0;">${productLineSafe}</td></tr>
                  ${
                    amountSafe
                      ? `<tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Importe</strong></td><td style="padding:10px 0;"><strong style="color:${EMAIL_COLORS.PRIMARY_DARK};">${amountSafe}</strong></td></tr>`
                      : ''
                  }
                  <tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Pago procesado por</strong></td><td style="padding:10px 0;">${providerSafe}</td></tr>
                  <tr style="border-bottom:1px solid rgba(29,43,95,0.08);"><td style="padding:10px 10px 10px 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Referencia</strong></td><td style="padding:10px 0;word-break:break-word;font-family:'Segoe UI Mono','Menlo','Monaco',monospace;font-size:12px;line-height:1.45;">${referenceSafe}</td></tr>
                  <tr><td style="padding:12px 10px 0 0;vertical-align:top;color:${EMAIL_COLORS.PRIMARY_MEDIUM};"><strong>Vigencia hasta</strong></td><td style="padding:12px 0 0 0;">${periodEndSafe}</td></tr>
                </table>
              </div>
              <p style="color:${EMAIL_COLORS.TEXT_GRAY};font-size:12px;margin:16px 0 0 0;text-align:center;line-height:1.55;">
                Puedes conservar este correo como comprobante. Para facturación o soporte, indica la referencia y el correo de tu cuenta.
              </p>
            </div>
          `
      : '';

    const preheaderPlain = receipt
      ? `Confirmación de compra en ${APP_NAME}. Plan ${planNameRaw}. Abre la app desde este correo.`
      : `Suscripción activada en ${APP_NAME}. Plan ${planNameRaw}. Abre la app cuando quieras.`;
    const preheaderText = escapeHtmlText(preheaderPlain);

    const body = `color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 14px 0;text-align:left;`;
    const small = `color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;line-height:1.55;margin:0;text-align:left;`;
    const sectionTitle = `color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:15px;font-weight:700;margin:0 0 10px 0;text-align:left;`;

    return {
      subject: receipt
        ? `${APP_NAME}: confirmación de compra (plan ${planNameRaw})`
        : `${APP_NAME}: suscripción activada (plan ${planNameRaw})`,
      html: `
        <div style="${EMAIL_LAYOUT_OUTER}">
          ${emailPreheaderHtml(preheaderText)}
          ${getEmailHeader(`Gracias, ${safeName}`)}

          <div style="${EMAIL_LAYOUT_CARD}">
            <p style="${body}">
              Tu suscripción <strong>Premium</strong> (plan <strong>${planName}</strong>) quedó activa. Gracias por confiar en <strong>${APP_NAME}</strong>.
            </p>
            <p style="${body}margin-bottom:14px;">
              Si acabas de pagar y la app aún no muestra Premium, <strong>cierra la app por completo</strong> y vuelve a entrar; a veces la tienda tarda unos minutos en sincronizar.
            </p>
            <p style="${small}margin-bottom:18px;">
              ${EMAIL_LEGAL_DISCLAIMER_ESCAPED}
            </p>

            ${receiptBlock}

            <p style="${sectionTitle}">Vigencia actual</p>
            <p style="${body}margin-bottom:18px;">
              La suscripción asociada a esta compra está vigente hasta el <strong>${periodEndSafe}</strong>. La fecha exacta de renovación también la puedes revisar en la app con tu sesión iniciada.
            </p>

            <p style="${sectionTitle}">Qué incluye Premium</p>
            <ul style="color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.55;margin:0 0 22px 0;padding-left:20px;text-align:left;">
              <li style="margin:0 0 8px 0;">Chat y herramientas sin los topes del periodo de prueba gratuito.</li>
              <li style="margin:0 0 8px 0;">Escalas y recursos de autoevaluación disponibles en la app, cuando correspondan a tu perfil.</li>
              <li style="margin:0 0 8px 0;">Seguimiento de actividad y continuidad en tu proceso, a tu ritmo.</li>
              <li style="margin:0 0 0 0;">El detalle de funciones puede actualizarse; lo definitivo lo ves en la tienda y dentro de ${APP_NAME}.</li>
            </ul>

            <div style="text-align:center;margin:8px 0 14px 0;">
              <a href="${appOpenHref}"
                 style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);color:${EMAIL_COLORS.TEXT_WHITE};padding:14px 26px;text-decoration:none;border-radius:10px;display:inline-block;font-weight:700;font-size:15px;">
                ${escapeHtmlText(emailCtaLabel.openApp())}
              </a>
            </div>
            <p style="${small}text-align:center;margin:0 0 18px 0;">
              Si el enlace no abre la app, ábrela manualmente e inicia sesión con esta cuenta.
            </p>

            <p style="${small}">
              Dudas sobre tu suscripción: canales enlazados al pie (Instagram). Este mensaje es automático.
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      `
    };
  },

  /**
   * Renovación automática de suscripción: agradecimiento + comprobante del cobro.
   * @param {string} username
   * @param {string} plan
   * @param {Date|string} periodEnd
   * @param {{
   *   purchaseDate: Date|string,
   *   amount?: number|null,
   *   currency?: string,
   *   providerLabel: string,
   *   reference: string
   * }} receipt
   */
  subscriptionRenewalEmail: (username, plan, periodEnd, receipt) => {
    const appOpenHref = buildEmailAppOpenHref(process.env, { subscriptionThankYou: true });
    const planNameRaw = subscriptionPlanDisplayName(plan);
    const planName = escapeHtmlText(planNameRaw);
    const safeName = escapeHtmlText(String(username ?? '').trim() || 'Usuario');

    const end = new Date(periodEnd);
    const periodEndDate = Number.isFinite(end.getTime())
      ? end.toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—';
    const periodEndSafe = escapeHtmlText(periodEndDate);

    const receiptBlock = buildSubscriptionReceiptHtmlBlock(receipt, planNameRaw, periodEndSafe, {
      title: 'Detalle del cobro',
    });

    const preheaderText = escapeHtmlText(
      `Tu suscripción en ${APP_NAME} se renovó. Plan ${planNameRaw}. Detalles del pago abajo.`
    );

    const body = `color:${EMAIL_COLORS.TEXT_DARK};font-size:15px;line-height:1.65;margin:0 0 14px 0;text-align:left;`;
    const small = `color:${EMAIL_COLORS.TEXT_GRAY};font-size:13px;line-height:1.55;margin:0;text-align:left;`;
    const sectionTitle = `color:${EMAIL_COLORS.PRIMARY_MEDIUM};font-size:15px;font-weight:700;margin:0 0 10px 0;text-align:left;`;

    return {
      subject: `${APP_NAME}: otro periodo contigo (plan ${planNameRaw})`,
      html: `
        <div style="${EMAIL_LAYOUT_OUTER}">
          ${emailPreheaderHtml(preheaderText)}
          ${getEmailHeader(`Gracias por seguir, ${safeName}`)}

          <div style="${EMAIL_LAYOUT_CARD}">
            <p style="${body}">
              Se procesó la <strong>renovación</strong> de tu suscripción <strong>Premium</strong> (plan <strong>${planName}</strong>). Gracias por seguir un periodo más con <strong>${APP_NAME}</strong>.
            </p>
            <p style="${body}margin-bottom:14px;">
              Tu acceso Premium queda vigente hasta el <strong>${periodEndSafe}</strong>. Si la app no refleja la fecha al instante, cierra la app por completo y vuelve a entrar.
            </p>
            <p style="${small}margin-bottom:18px;">
              ${EMAIL_LEGAL_DISCLAIMER_ESCAPED}
            </p>

            ${receiptBlock}

            <p style="${sectionTitle}">Qué incluye Premium</p>
            <ul style="color:${EMAIL_COLORS.TEXT_DARK};font-size:14px;line-height:1.55;margin:0 0 22px 0;padding-left:20px;text-align:left;">
              <li style="margin:0 0 8px 0;">Chat y herramientas sin los topes del periodo de prueba gratuito.</li>
              <li style="margin:0 0 8px 0;">Escalas y recursos de autoevaluación disponibles en la app, cuando correspondan a tu perfil.</li>
              <li style="margin:0 0 8px 0;">Seguimiento de actividad y continuidad en tu proceso, a tu ritmo.</li>
              <li style="margin:0 0 0 0;">El detalle de funciones puede actualizarse; lo definitivo lo ves en la tienda y dentro de ${APP_NAME}.</li>
            </ul>

            <div style="text-align:center;margin:8px 0 14px 0;">
              <a href="${appOpenHref}"
                 style="background:linear-gradient(135deg,${EMAIL_COLORS.PRIMARY_MEDIUM} 0%,${EMAIL_COLORS.ACCENT} 100%);color:${EMAIL_COLORS.TEXT_WHITE};padding:14px 26px;text-decoration:none;border-radius:10px;display:inline-block;font-weight:700;font-size:15px;">
                ${escapeHtmlText(emailCtaLabel.openApp())}
              </a>
            </div>
            <p style="${small}text-align:center;margin:0 0 18px 0;">
              Si el enlace no abre la app, ábrela manualmente e inicia sesión con esta cuenta.
            </p>

            <p style="${small}">
              Dudas sobre tu suscripción o este cobro: canales enlazados al pie (Instagram). Indica la referencia del comprobante. Este mensaje es automático.
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      `
    };
  },

  /**
   * Informe diario de uso de tokens OpenAI (visibilidad de coste operativo).
   */
  openaiDailyCostReport: (
    dateKey,
    stats,
    model,
    environment,
    registrations = 0,
    verifiedRegistrations = 0,
    dau = 0,
    estimatedCostUsd = 0,
    tokensPerActiveUser = 0
  ) => {
    const requests = stats?.requests ?? 0;
    const promptTokens = stats?.promptTokens ?? 0;
    const completionTokens = stats?.completionTokens ?? 0;
    const totalTokens = stats?.totalTokens ?? 0;
    const registrationsCount = Number.isFinite(Number(registrations)) ? Number(registrations) : 0;
    const verifiedRegistrationsCount =
      Number.isFinite(Number(verifiedRegistrations)) ? Number(verifiedRegistrations) : 0;
    const dauCount = Number.isFinite(Number(dau)) ? Number(dau) : 0;
    const costUsd = Number.isFinite(Number(estimatedCostUsd)) ? Number(estimatedCostUsd) : 0;
    const tokensPerActive =
      Number.isFinite(Number(tokensPerActiveUser)) ? Number(tokensPerActiveUser) : 0;
    const empty = requests === 0 && totalTokens === 0;
    const modelLine = model ? String(model) : '—';
    const envLine = environment ? String(environment) : '—';

    return {
      subject: `Uso OpenAI (${dateKey} UTC) — ${APP_NAME_FULL}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${EMAIL_COLORS.BACKGROUND};">
          ${getEmailHeader('Informe diario OpenAI')}
          
          <div style="background: rgba(20, 28, 56, 0.92); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.10);">
            <p style="color: ${EMAIL_COLORS.TEXT_WHITE}; font-size: 1.05rem; line-height: 1.7; margin-bottom: 20px;">
              Resumen del día <strong style="color: ${EMAIL_COLORS.ACCENT};">${dateKey}</strong> (zona horaria UTC). Los totales se persisten en la base de datos de la app (agregado por este servidor).
            </p>
            <p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 0.95rem; margin-bottom: 24px;">
              Modelo: <strong style="color: ${EMAIL_COLORS.TEXT_WHITE};">${modelLine}</strong><br>
              Entorno: <strong style="color: ${EMAIL_COLORS.TEXT_WHITE};">${envLine}</strong><br>
              Registros de usuarios: <strong style="color: ${EMAIL_COLORS.TEXT_WHITE};">${registrationsCount.toLocaleString('es-CL')}</strong><br>
              Registros verificados: <strong style="color: ${EMAIL_COLORS.TEXT_WHITE};">${verifiedRegistrationsCount.toLocaleString('es-CL')}</strong><br>
              DAU (usuarios activos): <strong style="color: ${EMAIL_COLORS.TEXT_WHITE};">${dauCount.toLocaleString('es-CL')}</strong><br>
              Tokens por usuario activo: <strong style="color: ${EMAIL_COLORS.TEXT_WHITE};">${tokensPerActive.toLocaleString('es-CL', { maximumFractionDigits: 2 })}</strong><br>
              Coste estimado OpenAI (USD): <strong style="color: ${EMAIL_COLORS.TEXT_WHITE};">$${costUsd.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</strong>
            </p>

            ${
              empty
                ? `<p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 1rem;">No se registró uso de completions en este servicio para ese día (o aún no hay datos).</p>`
                : `
            <table style="width: 100%; border-collapse: collapse; color: ${EMAIL_COLORS.TEXT_WHITE}; font-size: 1rem;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.15);">
                <td style="padding: 10px 0;">Completions (requests)</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700;">${requests.toLocaleString('es-CL')}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.15);">
                <td style="padding: 10px 0;">Tokens de prompt</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700;">${promptTokens.toLocaleString('es-CL')}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.15);">
                <td style="padding: 10px 0;">Tokens de completion</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700;">${completionTokens.toLocaleString('es-CL')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">Total tokens (API)</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: ${EMAIL_COLORS.ACCENT};">${totalTokens.toLocaleString('es-CL')}</td>
              </tr>
            </table>
            <p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 0.9rem; margin-top: 20px;">
              Para el coste en dinero exacto, revisa el panel de uso y facturación en la cuenta de OpenAI (los precios por modelo cambian).
            </p>
            `
            }
          </div>

          ${getEmailFooter()}
        </div>
      `
    };
  }
};

// Helper: enviar correo con SendGrid
const sendEmailWithSendGrid = async (email, template, emailType) => {
  try {
    const msg = {
      to: email,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: EMAIL_FROM_NAME
      },
      subject: template.subject,
      html: template.html
    };

    console.log(`[Mailer] 📧 [SendGrid] Intentando enviar ${emailType} a: ${email}`);
    console.log(`[Mailer] 📧 [SendGrid] Desde: ${SENDGRID_FROM_EMAIL}`);
    
    const response = await withTimeout(
      sgMail.send(msg),
      MAIL_PROVIDER_TIMEOUT_MS,
      { label: `SendGrid send (${emailType})` }
    );
    
    console.log(`[Mailer] ✉️ [SendGrid] ${emailType} enviado exitosamente a: ${email}`);
    if (response[0]?.headers?.['x-message-id']) {
      console.log(`[Mailer] 📬 [SendGrid] Message ID: ${response[0].headers['x-message-id']}`);
    }
    return true;
  } catch (error) {
    console.error(`[Mailer] ❌ [SendGrid] Error al enviar ${emailType} a ${email}:`, error.message);
    if (error.response?.body) {
      console.error(`[Mailer] 📋 [SendGrid] Error response:`, JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
};

// Helper: enviar correo con Gmail API (Google Workspace)
const sendEmailWithGmailAPI = async (email, template, emailType) => {
  try {
    if (!gmailClient || !GMAIL_USER_EMAIL) {
      throw new Error('Gmail API no está configurado correctamente');
    }

    console.log(`[Mailer] 📧 [Gmail API] Intentando enviar ${emailType} a: ${email}`);
    console.log(`[Mailer] 📧 [Gmail API] Desde: ${GMAIL_USER_EMAIL}`);

    // Helper: encode RFC2047 para headers con caracteres no ASCII (UTF-8)
    // Evita "mojibake" tipo "Â¢Â€Â”" cuando el cliente interpreta mal el encoding del header.
    const encodeHeader = (value) => {
      const s = String(value ?? '');
      // Si es ASCII puro, no encodar (más legible).
      if (/^[\x00-\x7F]*$/.test(s)) return s;
      const b64 = Buffer.from(s, 'utf8').toString('base64');
      return `=?UTF-8?B?${b64}?=`;
    };

    // Crear el mensaje en formato RFC 2822
    const message = [
      `MIME-Version: 1.0`,
      `From: "${encodeHeader(EMAIL_FROM_NAME)}" <${GMAIL_USER_EMAIL}>`,
      `To: ${email}`,
      `Subject: ${encodeHeader(template.subject)}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      template.html
    ].join('\n');

    // Codificar el mensaje en base64url (formato requerido por Gmail API)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Enviar el email usando Gmail API
    const response = await withTimeout(
      gmailClient.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
      }),
      MAIL_PROVIDER_TIMEOUT_MS,
      { label: `Gmail API send (${emailType})` }
    );

    console.log(`[Mailer] ✉️ [Gmail API] ${emailType} enviado exitosamente a: ${email}`);
    if (response.data.id) {
      console.log(`[Mailer] 📬 [Gmail API] Message ID: ${response.data.id}`);
    }
    return true;
  } catch (error) {
    console.error(`[Mailer] ❌ [Gmail API] Error al enviar ${emailType} a ${email}:`, error.message);
    if (error.response?.data) {
      console.error(`[Mailer] 📋 [Gmail API] Error response:`, JSON.stringify(error.response.data, null, 2));
    }
    const errStr = JSON.stringify(error.response?.data || error.message || '');
    if (errStr.includes('invalid_grant')) {
      console.error(
        '[Mailer] 💡 invalid_grant: regenerá GMAIL_REFRESH_TOKEN con el mismo GMAIL_CLIENT_ID/SECRET y scope gmail.send; revisá OAuth en Google Cloud.'
      );
    }
    throw error;
  }
};

// Helper: enviar correo con Gmail SMTP (fallback)
const sendEmailWithGmail = async (email, template, emailType) => {
  try {
    // Verificar configuración antes de intentar enviar
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error('Variables de entorno EMAIL_USER y EMAIL_APP_PASSWORD no están configuradas');
    }

    console.log(`[Mailer] 📧 [Gmail] Intentando enviar ${emailType} a: ${email}`);
    console.log(`[Mailer] 📧 [Gmail] Desde: ${process.env.EMAIL_USER}`);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: email,
      ...template
    };
    
    const info = await withTimeout(
      transporter.sendMail(mailOptions),
      MAIL_PROVIDER_TIMEOUT_MS,
      { label: `Gmail SMTP send (${emailType})` }
    );
    
    console.log(`[Mailer] ✉️ [Gmail] ${emailType} enviado exitosamente a: ${email}`);
    console.log(`[Mailer] 📬 [Gmail] Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Mailer] ❌ [Gmail] Error al enviar ${emailType} a ${email}:`, error.message);
    if (error.response) {
      console.error(`[Mailer] 📋 [Gmail] Error response:`, error.response);
    }
    if (error.code) {
      console.error(`[Mailer] 🔢 [Gmail] Error code:`, error.code);
    }
    throw error;
  }
};

// Helper: enviar correo genérico (prioridad: Gmail API > SendGrid > Gmail SMTP)
const sendEmail = async (email, template, emailType) => {
  // Intentar primero con Gmail API si está configurado (Google Workspace)
  if (USE_GMAIL_API && gmailClient) {
    try {
      return await sendEmailWithGmailAPI(email, template, emailType);
    } catch (gmailAPIError) {
      console.error('[Mailer] ⚠️ Gmail API falló, intentando con otros proveedores...');
      // Continuar con otros proveedores
    }
  }

  if (SENDGRID_CONFIGURED) {
    try {
      return await sendEmailWithSendGrid(email, template, emailType);
    } catch (sendGridError) {
      console.error('[Mailer] ⚠️ SendGrid falló, intentando con Gmail SMTP como fallback...');
    }
  }

  // Fallback a Gmail SMTP
  try {
    return await sendEmailWithGmail(email, template, emailType);
  } catch (gmailError) {
    // Log de errores de Gmail
    if (gmailError.message.includes('Variables de entorno')) {
      console.error('[Mailer] 💡 Solución: Configura EMAIL_USER y EMAIL_APP_PASSWORD en tu archivo .env');
    } else if (gmailError.message.includes('Invalid login') || gmailError.message.includes('authentication')) {
      console.error('[Mailer] 💡 Error de autenticación: Verifica que EMAIL_APP_PASSWORD sea una App Password válida de Gmail');
      console.error('[Mailer] 💡 Cómo obtener App Password: https://myaccount.google.com/apppasswords');
    } else if (gmailError.message.includes('ENOTFOUND') || gmailError.message.includes('ECONNREFUSED')) {
      console.error('[Mailer] 💡 Error de conexión: Verifica tu conexión a internet');
    } else if (gmailError.code === 'ETIMEDOUT' || gmailError.message.includes('timeout')) {
      console.error('[Mailer] 💡 Error de timeout: El servidor no pudo conectarse a Gmail SMTP');
      console.error('[Mailer] 💡 Posibles soluciones:');
      console.error('[Mailer]   1. Verifica que el servidor tenga acceso saliente al puerto 587');
      console.error('[Mailer]   2. Configura SENDGRID_API_KEY para usar SendGrid (recomendado)');
      console.error('[Mailer]   3. Verifica que Gmail no esté bloqueando conexiones desde este servidor');
    }
    throw gmailError;
  }
};

// Funciones de envío de correo
const mailer = {
  /**
   * Enviar código de verificación (recuperación de contraseña)
   * @param {string} email - Email del destinatario
   * @param {string} code - Código de verificación
   * @returns {Promise<boolean>} true si se envió correctamente
   */
  sendVerificationCode: async (email, code) => {
    try {
      const template = emailTemplates.verificationCode(code);
      return await sendEmail(email, template, 'Código de verificación');
    } catch (error) {
      throw new Error('Error al enviar el correo de verificación');
    }
  },

  /**
   * Enviar código de verificación de email (registro)
   * @param {string} email - Email del destinatario
   * @param {string} code - Código de verificación
   * @param {string} username - Nombre de usuario
   * @returns {Promise<boolean>} true si se envió correctamente
   */
  sendEmailVerificationCode: async (email, code, username) => {
    try {
      const template = emailTemplates.emailVerificationCode(code, username);
      return await sendEmail(email, template, 'Código de verificación de email');
    } catch (error) {
      throw new Error('Error al enviar el correo de verificación de email');
    }
  },

  /**
   * Enviar correo de restablecimiento de contraseña
   * @param {string} email - Email del destinatario
   * @param {string} token - Token de restablecimiento
   * @returns {Promise<boolean>} true si se envió correctamente
   */
  sendPasswordReset: async (email, token) => {
    try {
      const template = emailTemplates.resetPassword(token);
      return await sendEmail(email, template, 'Correo de restablecimiento');
    } catch (error) {
      throw new Error('Error al enviar el correo de restablecimiento');
    }
  },

  /**
   * Enviar correo de bienvenida
   * @param {string} email - Email del destinatario
   * @param {string} username - Nombre de usuario
   * @returns {Promise<boolean>} true si se envió correctamente, false si falla (no afecta el flujo)
   */
  sendWelcomeEmail: async (email, username) => {
    try {
      const template = emailTemplates.welcomeEmail(username);
      return await sendEmail(email, template, 'Correo de bienvenida');
    } catch (error) {
      // No lanzamos el error para que no afecte el flujo de registro
      console.error('[Mailer] ❌ Error al enviar correo de bienvenida (no crítico):', error.message);
      if (error.stack) {
        console.error('[Mailer] Stack trace:', error.stack);
      }
      if (error.message.includes('Variables de entorno')) {
        console.error('[Mailer] 💡 Solución: Configura EMAIL_USER y EMAIL_APP_PASSWORD en tu archivo .env');
      } else if (error.message.includes('Invalid login') || error.message.includes('authentication')) {
        console.error('[Mailer] 💡 Error de autenticación: Verifica que EMAIL_APP_PASSWORD sea una App Password válida de Gmail');
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.error('[Mailer] 💡 Error de conexión: Verifica tu conexión a internet');
      }
      return false;
    }
  },

  /**
   * Enviar email genérico personalizado
   * @param {Object} options - Opciones del email
   * @param {string} options.to - Email del destinatario
   * @param {string} options.subject - Asunto del email
   * @param {string} options.html - Contenido HTML del email
   * @returns {Promise<boolean>} true si se envió correctamente
   */
  sendCustomEmail: async ({ to, subject, html }) => {
    try {
      const template = { subject, html };
      return await sendEmail(to, template, 'Email personalizado');
    } catch (error) {
      console.error('[Mailer] ❌ Error al enviar email personalizado:', error.message);
      return false;
    }
  },

  /**
   * Enviar correo de re-engagement (usuarios inactivos)
   * @param {string} email - Email del destinatario
   * @param {string} username - Nombre de usuario
   * @param {number} daysInactive - Días de inactividad
   * @returns {Promise<boolean>} true si se envió correctamente, false si falla (no crítico)
   */
  sendReEngagementEmail: async (email, username, daysInactive) => {
    try {
      const template = emailTemplates.reEngagementEmail(username, daysInactive);
      return await sendEmail(email, template, 'Correo de re-engagement');
    } catch (error) {
      // No lanzamos el error para que no afecte otros procesos
      console.error('[Mailer] ❌ Error al enviar correo de re-engagement (no crítico):', error.message);
      return false;
    }
  },

  /**
   * Enviar correo de tips semanales
   * @param {string} email - Email del destinatario
   * @param {string} username - Nombre de usuario
   * @param {number} weekNumber - Número de semana (para rotar tips)
   * @returns {Promise<boolean>} true si se envió correctamente, false si falla (no crítico)
   */
  sendWeeklyTipsEmail: async (email, username, weekNumber = 1) => {
    try {
      const template = emailTemplates.weeklyTipsEmail(username, weekNumber);
      return await sendEmail(email, template, 'Correo de tips semanales');
    } catch (error) {
      // No lanzamos el error para que no afecte otros procesos
      console.error('[Mailer] ❌ Error al enviar correo de tips semanales (no crítico):', error.message);
      return false;
    }
  },

  /**
   * Resumen semanal (personalización con cifras agregadas + enlace a la app).
   * @param {string} email
   * @param {string|object} userOrUsername — `username` (string) para pruebas mínimas, o documento/lean user con `username`, `name`, `stats`, `subscription`, `createdAt`
   * @returns {Promise<boolean>}
   */
  sendWeeklySummaryEmail: async (email, userOrUsername) => {
    try {
      const isoParts = getUtcIsoWeekParts();
      const lean =
        typeof userOrUsername === 'string'
          ? { username: userOrUsername }
          : userOrUsername && typeof userOrUsername === 'object'
            ? userOrUsername
            : { username: '' };
      const context = buildWeeklySummaryEmailContext(lean, isoParts);
      const template = emailTemplates.weeklySummaryEmail(context);
      return await sendEmail(email, template, 'Correo resumen semanal');
    } catch (error) {
      console.error('[Mailer] ❌ Error al enviar resumen semanal (no crítico):', error.message);
      return false;
    }
  },

  /**
   * Correo de retención antes del fin del trial corto (p. ej. ~48 h tras inicio).
   * @param {string} email
   * @param {string} username
   * @param {Date|string} trialEndDate
   * @returns {Promise<boolean>}
   */
  sendTrialRetentionEmail: async (email, username, trialEndDate) => {
    const em = email != null ? String(email).trim() : '';
    if (!em || !em.includes('@')) {
      logger.warn('[Mailer] sendTrialRetentionEmail: destinatario inválido');
      return false;
    }
    const end = trialEndDate != null ? new Date(trialEndDate) : new Date(NaN);
    const nowMs = Date.now();
    if (Number.isNaN(end.getTime()) || end.getTime() <= nowMs) {
      logger.warn('[Mailer] sendTrialRetentionEmail: trialEndDate inválido o ya vencido');
      return false;
    }
    try {
      const template = emailTemplates.trialRetentionEmail(username, trialEndDate);
      return await sendEmail(em, template, 'Correo retención trial');
    } catch (error) {
      console.error('[Mailer] ❌ Error al enviar correo de retención trial (no crítico):', error.message);
      return false;
    }
  },

  /**
   * Informe diario de uso de tokens OpenAI (misma tubería que el resto de correos).
   * @param {string} email - Destinatario
   * @param {{ dateKey: string, stats: object | null, model: string, environment: string, registrations?: number, verifiedRegistrations?: number, dau?: number, estimatedCostUsd?: number, tokensPerActiveUser?: number }} payload
   */
  sendOpenAIDailyCostReport: async (
    email,
    {
      dateKey,
      stats,
      model,
      environment,
      registrations = 0,
      verifiedRegistrations = 0,
      dau = 0,
      estimatedCostUsd = 0,
      tokensPerActiveUser = 0
    }
  ) => {
    try {
      const template = emailTemplates.openaiDailyCostReport(
        dateKey,
        stats,
        model,
        environment,
        registrations,
        verifiedRegistrations,
        dau,
        estimatedCostUsd,
        tokensPerActiveUser
      );
      return await sendEmail(email, template, 'Informe diario OpenAI');
    } catch (error) {
      console.error('[Mailer] ❌ Error al enviar informe diario OpenAI:', error.message);
      return false;
    }
  },

  /**
   * Agradecimiento y confirmación de compra tras activar suscripción (App Store, Mercado Pago, etc.).
   * Usa la misma tubería interna que el resto de correos (no exponer sendEmail en el objeto exportado).
   */
  sendSubscriptionThankYouEmail: async (
    email,
    username,
    plan,
    periodEnd,
    receipt = null,
    emailType = 'Confirmación suscripción'
  ) => {
    try {
      const template = emailTemplates.subscriptionThankYouEmail(username, plan, periodEnd, receipt);
      return await sendEmail(email, template, emailType);
    } catch (error) {
      logger.error('[Mailer] ❌ Error enviando confirmación de suscripción:', error.message);
      return false;
    }
  },

  /**
   * Renovación automática: agradecimiento y datos del cobro (App Store, Mercado Pago, etc.).
   */
  sendSubscriptionRenewalEmail: async (
    email,
    username,
    plan,
    periodEnd,
    receipt,
    emailType = 'Renovación suscripción'
  ) => {
    try {
      if (!receipt || typeof receipt !== 'object') {
        logger.warn('[Mailer] sendSubscriptionRenewalEmail: receipt requerido');
        return false;
      }
      const template = emailTemplates.subscriptionRenewalEmail(username, plan, periodEnd, receipt);
      return await sendEmail(email, template, emailType);
    } catch (error) {
      logger.error('[Mailer] ❌ Error enviando correo de renovación de suscripción:', error.message);
      return false;
    }
  },

  /**
   * Correo de comprobación al iniciar el servidor (Gmail API / fallback).
   * @param {string} to - Destinatario
   * @returns {Promise<boolean>}
   */
  sendServerStartupPing: async (to) => {
    try {
      if (!to || typeof to !== 'string' || !to.trim()) {
        logger.warn('[Mailer] sendServerStartupPing: destinatario vacío');
        return false;
      }
      const ts = new Date().toISOString();
      const env = process.env.NODE_ENV || 'development';
      const host =
        process.env.RENDER_SERVICE_NAME ||
        process.env.RENDER_EXTERNAL_URL ||
        process.env.HOSTNAME ||
        '—';
      const template = {
        subject: `[${APP_NAME}] Servidor iniciado — prueba de correo (${env})`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:system-ui,-apple-system,sans-serif;padding:20px;line-height:1.5;color:#111;">
<p>Este mensaje se envía <strong>automáticamente cuando el backend arranca</strong> para verificar que el mailer funciona.</p>
<ul>
  <li><strong>UTC:</strong> ${ts}</li>
  <li><strong>Entorno:</strong> <code>${env}</code></li>
  <li><strong>Servicio / URL:</strong> <code>${String(host)}</code></li>
</ul>
<p style="margin:18px 0 8px 0;">
  <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#1D2B5F 0%,#1ADDDB 100%);color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:700;">
    ${
      INSTAGRAM_ICON_DATA_URI
        ? `<img src="${INSTAGRAM_ICON_DATA_URI}" alt="Instagram" width="20" height="20" style="vertical-align:-4px;margin-right:8px;border-radius:5px;" />`
        : ''
    }
    Instagram
  </a>
</p>
<p style="color:#444;font-size:14px;">Si lo recibes, la tubería (Gmail API o fallback SMTP/SendGrid) respondió correctamente.</p>
</body></html>`
      };
      const ok = await sendEmail(to.trim(), template, 'Ping arranque servidor');
      if (!ok) {
        logger.warn('[Mailer] sendServerStartupPing: sendEmail devolvió false', { to: to.trim() });
      }
      return ok;
    } catch (error) {
      logger.warn('[Mailer] Error en sendServerStartupPing', { error: error.message });
      return false;
    }
  },

  /**
   * Enviar email de prueba a contacto de emergencia
   * @param {string} email - Email del contacto
   * @param {string} contactName - Nombre del contacto
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<boolean>} true si se envió correctamente
   */
  sendEmergencyContactTestEmail: async (email, contactName, userName) => {
    try {
      const subject = `🧪 Prueba de Alerta - ${APP_NAME}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #0A1533;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .test-box {
              background-color: #e3f2fd;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🧪 Prueba de Alerta - ${APP_NAME}</h1>
          </div>
          <div class="content">
            <p>Hola ${contactName},</p>
            
            <div class="test-box">
              <h2 style="margin-top: 0;">⚠️ Esta es una PRUEBA</h2>
              <p>Este es un email de prueba enviado por <strong>${userName}</strong> para verificar que el sistema de alertas de emergencia funciona correctamente.</p>
              <p><strong>No hay ninguna situación de emergencia real.</strong></p>
            </div>

            <p>Si recibiste este email, significa que:</p>
            <ul>
              <li>✅ Tu dirección de email está correctamente configurada</li>
              <li>✅ El sistema puede contactarte en caso de emergencia</li>
              <li>✅ Las alertas llegarán a tu bandeja de entrada</li>
            </ul>

            <p>En caso de una emergencia real, recibirás un email similar pero con información sobre la situación y recursos de ayuda.</p>

            <div class="footer">
              <p>Este es un mensaje automático de prueba de ${APP_NAME}.</p>
              <p>Si no deberías recibir estos emails, por favor contacta a ${userName}.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const template = { subject, html };
      return await sendEmail(email, template, 'Email de prueba de contacto de emergencia');
    } catch (error) {
      console.error('[Mailer] ❌ Error al enviar email de prueba:', error.message);
      return false;
    }
  }
};

// Exportar también las plantillas para uso directo
mailer.emailTemplates = emailTemplates;

export default mailer;