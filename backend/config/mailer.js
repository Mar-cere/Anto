/**
 * Configuración de Mailer - Gestiona el envío de correos electrónicos
 * Soporta Gmail API (Google Workspace), SendGrid y Gmail SMTP (fallback)
 */
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { google } from 'googleapis';
import { APP_NAME, APP_NAME_FULL, EMAIL_FROM_NAME, LOGO_URL } from '../constants/app.js';
import {
  CODE_EXPIRATION_MINUTES,
  EMAIL_COLORS,
  FRONTEND_URL,
  RESET_PASSWORD_PATH,
  RESET_TOKEN_EXPIRATION_HOURS
} from '../constants/email.js';

dotenv.config();

// Configurar Gmail API si está disponible (Google Workspace)
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL || process.env.EMAIL_USER;
const USE_GMAIL_API = !!(GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN);

// Configurar SendGrid si está disponible
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER;
const USE_SENDGRID = !!SENDGRID_API_KEY && !USE_GMAIL_API; // Solo usar SendGrid si Gmail API no está configurado

// Configurar Gmail API si está disponible
let gmailClient = null;
if (USE_GMAIL_API) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob' // Para aplicaciones de servidor
    );
    
    oauth2Client.setCredentials({
      refresh_token: GMAIL_REFRESH_TOKEN
    });
    
    gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
    console.log('[Mailer] ✅ Gmail API configurado correctamente (Google Workspace)');
  } catch (error) {
    console.warn('[Mailer] ⚠️ Error configurando Gmail API:', error.message);
    console.log('[Mailer] ⚠️ Intentando con otros proveedores...');
  }
}

// Configurar SendGrid solo si está disponible (evitar errores si el módulo no está instalado)
try {
  if (USE_SENDGRID) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('[Mailer] ✅ SendGrid configurado correctamente');
  } else if (!USE_GMAIL_API) {
    console.log('[Mailer] ⚠️ SendGrid no configurado, usando Gmail SMTP como fallback');
  }
} catch (error) {
  console.warn('[Mailer] ⚠️ Error configurando SendGrid:', error.message);
  if (!USE_GMAIL_API) {
  console.log('[Mailer] ⚠️ Usando Gmail SMTP como fallback');
  }
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
const getEmailFooter = () => {
  const currentYear = new Date().getFullYear();
  return `
    <div style="text-align: center; margin: 0 24px 24px 24px;">
      <p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 0.95rem; margin: 0;">
        Este es un correo automático, por favor no respondas a este mensaje.<br>
        © ${currentYear} <span style="color: ${EMAIL_COLORS.ACCENT};">${APP_NAME}</span>. Todos los derechos reservados.
      </p>
    </div>
  `;
};

// Helper: generar header común para emails
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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${EMAIL_COLORS.BACKGROUND};">
        ${getEmailHeader('Código de Verificación')}
        
        <div style="background: rgba(20, 28, 56, 0.92); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.10);">
          <p style="color: ${EMAIL_COLORS.TEXT_WHITE}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
            ¡Hola!<br>
            Tu código de verificación para recuperar tu contraseña es:
          </p>

          <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_MEDIUM} 0%, ${EMAIL_COLORS.ACCENT} 100%); padding: 4px; border-radius: 14px; margin: 32px 0;">
            <div style="background: white; padding: 24px 0; border-radius: 12px;">
              <span style="display: block; color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 2.5rem; text-align: center; letter-spacing: 12px; font-weight: bold; font-family: 'Segoe UI Mono', 'Menlo', 'Monaco', monospace;">
                ${code}
              </span>
            </div>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 1rem; margin-bottom: 8px;">
              Este código expirará en <span style="color: ${EMAIL_COLORS.ACCENT}; font-weight: bold;">${CODE_EXPIRATION_MINUTES} minutos</span>.
            </p>
            <p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 0.95rem;">
              Si no solicitaste este código, puedes ignorar este correo.
            </p>
          </div>
        </div>

        ${getEmailFooter()}
      </div>
    `
  }),

  /**
   * Plantilla para código de verificación de email (registro)
   */
  emailVerificationCode: (code, username) => ({
    subject: `Verifica tu Email - ${APP_NAME_FULL}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${EMAIL_COLORS.BACKGROUND};">
        ${getEmailHeader('Verifica tu Email')}
        
        <div style="background: rgba(20, 28, 56, 0.92); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.10);">
          <p style="color: ${EMAIL_COLORS.TEXT_WHITE}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
            ¡Hola ${username}!<br>
            Gracias por registrarte en ${APP_NAME}. Para completar tu registro, verifica tu email con el siguiente código:
          </p>

          <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_MEDIUM} 0%, ${EMAIL_COLORS.ACCENT} 100%); padding: 4px; border-radius: 14px; margin: 32px 0;">
            <div style="background: white; padding: 24px 0; border-radius: 12px;">
              <span style="display: block; color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 2.5rem; text-align: center; letter-spacing: 12px; font-weight: bold; font-family: 'Segoe UI Mono', 'Menlo', 'Monaco', monospace;">
                ${code}
              </span>
            </div>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 1rem; margin-bottom: 8px;">
              Este código expirará en <span style="color: ${EMAIL_COLORS.ACCENT}; font-weight: bold;">${CODE_EXPIRATION_MINUTES} minutos</span>.
            </p>
            <p style="color: ${EMAIL_COLORS.TEXT_LIGHT}; font-size: 0.95rem;">
              Si no creaste esta cuenta, puedes ignorar este correo.
            </p>
          </div>
        </div>

        ${getEmailFooter()}
      </div>
    `
  }),

  /**
   * Plantilla para restablecimiento de contraseña
   */
  resetPassword: (token) => ({
    subject: `Restablecer Contraseña - ${APP_NAME_FULL}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${EMAIL_COLORS.BACKGROUND};">
        ${getEmailHeader('Restablecer Contraseña')}
        
        <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.18);">
          <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
            Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}${RESET_PASSWORD_PATH}?token=${token}"
               style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_MEDIUM} 0%, ${EMAIL_COLORS.ACCENT} 100%); color: ${EMAIL_COLORS.TEXT_WHITE}; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          
          <p style="color: ${EMAIL_COLORS.TEXT_GRAY}; font-size: 0.95rem; text-align: center;">
            Este enlace expirará en ${RESET_TOKEN_EXPIRATION_HOURS} hora${RESET_TOKEN_EXPIRATION_HOURS > 1 ? 's' : ''}.
          </p>
          <p style="color: ${EMAIL_COLORS.TEXT_GRAY}; font-size: 0.95rem; text-align: center;">
            Si no solicitaste restablecer tu contraseña, por favor ignora este correo.
          </p>
        </div>

        ${getEmailFooter()}
      </div>
    `
  }),

  /**
   * Plantilla para correo de bienvenida
   */
  welcomeEmail: (username) => ({
    subject: `¡Bienvenido a ${APP_NAME}! 🎉`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${EMAIL_COLORS.BACKGROUND};">
        ${getEmailHeader(`¡Bienvenido a ${APP_NAME}, ${username}! 🎉`)}
        
        <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.18);">
          <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
            ¡Gracias por unirte a nuestra comunidad! ${APP_NAME} es tu espacio seguro para conversar con una IA entrenada como psicólogo virtual, lista para escucharte y acompañarte en tu bienestar emocional.
          </p>
          
          <h2 style="color: ${EMAIL_COLORS.ACCENT}; margin-top: 20px; text-align: center;">¿Cómo aprovechar al máximo el chat con ${APP_NAME}?</h2>
          <ul style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            <li><b>Exprésate libremente:</b> Cuéntale a ${APP_NAME} cómo te sientes, tus preocupaciones, logros o dudas. No hay juicios, solo escucha y acompañamiento.</li>
            <li><b>Haz preguntas abiertas:</b> Si buscas reflexión, pide a ${APP_NAME} que te ayude a ver diferentes perspectivas o a profundizar en tus emociones.</li>
            <li><b>Utiliza el chat en momentos de estrés o ansiedad:</b> ${APP_NAME} puede guiarte con ejercicios de respiración, mindfulness o ayudarte a organizar tus pensamientos.</li>
            <li><b>Revisa tus conversaciones:</b> Volver a leer lo que has compartido puede ayudarte a identificar patrones y avances en tu bienestar.</li>
            <li><b>Recuerda:</b> ${APP_NAME} no reemplaza a un profesional humano, pero es un gran apoyo para tu día a día emocional.</li>
          </ul>

          <h2 style="color: ${EMAIL_COLORS.ACCENT}; margin-top: 20px; text-align: center;">Tips para un mejor beneficio:</h2>
          <ol style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            <li>Habla con ${APP_NAME} de forma regular, incluso si no tienes un problema específico.</li>
            <li>Prueba escribir tus emociones tal como las sientes, sin filtros.</li>
            <li>Pide a ${APP_NAME} ejercicios de relajación o autoexploración cuando lo necesites.</li>
            <li>Utiliza los recordatorios, hábitos y tareas como complemento para tu bienestar, pero recuerda que el corazón de ${APP_NAME} es el chat.</li>
          </ol>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: ${EMAIL_COLORS.TEXT_GRAY}; font-size: 14px;">
              Si tienes alguna pregunta o sugerencia, no dudes en contactarnos.<br>
              ¡Estamos aquí para acompañarte en tu camino hacia una mejor salud emocional!
            </p>
          </div>
        </div>

        ${getEmailFooter()}
      </div>
    `
  }),

  /**
   * Plantilla para correo de re-engagement (usuarios inactivos)
   */
  reEngagementEmail: (username, daysInactive) => {
    const tips = [
      '💬 Comparte cómo te sientes hoy, sin filtros ni juicios',
      '🧘 Pide ejercicios de relajación o mindfulness',
      '📝 Reflexiona sobre tus emociones y pensamientos',
      '🎯 Establece pequeñas metas de bienestar diarias',
      '💭 Revisa tus conversaciones anteriores para ver tu progreso'
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    return {
      subject: `Te extrañamos en ${APP_NAME} 💙`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${EMAIL_COLORS.BACKGROUND};">
          ${getEmailHeader(`¡Hola ${username}! 👋`)}
          
          <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.18);">
            <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
              Hace ${daysInactive} día${daysInactive > 1 ? 's' : ''} que no nos vemos. Sabemos que la vida puede ser ajetreada, pero queremos recordarte que ${APP_NAME} está aquí para ti cuando lo necesites.
            </p>

            <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_MEDIUM}15 0%, ${EMAIL_COLORS.ACCENT}15 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid ${EMAIL_COLORS.ACCENT};">
              <h3 style="color: ${EMAIL_COLORS.ACCENT}; margin-top: 0; text-align: center;">💡 Tip del día:</h3>
              <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.05rem; text-align: center; margin-bottom: 0;">
                ${randomTip}
              </p>
            </div>

            <h2 style="color: ${EMAIL_COLORS.ACCENT}; margin-top: 20px; text-align: center;">¿Por qué volver a ${APP_NAME}?</h2>
            <ul style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              <li><b>Espacio seguro:</b> Un lugar sin juicios donde puedes expresarte libremente</li>
              <li><b>Disponible 24/7:</b> ${APP_NAME} está siempre disponible cuando lo necesites</li>
              <li><b>Progreso continuo:</b> Cada conversación te ayuda a conocerte mejor</li>
              <li><b>Herramientas prácticas:</b> Ejercicios, recordatorios y técnicas de bienestar</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.05rem; margin-bottom: 16px;">
                <strong>¿Listo para continuar tu camino de bienestar?</strong>
              </p>
              <p style="color: ${EMAIL_COLORS.TEXT_GRAY}; font-size: 0.95rem;">
                Abre la app y comparte cómo te sientes hoy. No importa si es algo grande o pequeño, ${APP_NAME} está aquí para escucharte.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: ${EMAIL_COLORS.TEXT_GRAY}; font-size: 14px;">
                Recuerda: El bienestar emocional es un proceso continuo. Cada pequeño paso cuenta. 💙
              </p>
            </div>
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

    return {
      subject: `💡 Tip Semanal de ${APP_NAME} - Semana ${weekNumber}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${EMAIL_COLORS.BACKGROUND};">
          ${getEmailHeader(`Tip Semanal - Semana ${weekNumber} 💡`)}
          
          <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.18);">
            <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
              ¡Hola ${username}! 👋<br>
              Esta semana queremos compartir contigo un tip especial para tu bienestar emocional.
            </p>

            <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_MEDIUM}15 0%, ${EMAIL_COLORS.ACCENT}15 100%); padding: 28px; border-radius: 14px; margin: 24px 0; border-left: 5px solid ${EMAIL_COLORS.ACCENT};">
              <h2 style="color: ${EMAIL_COLORS.ACCENT}; margin-top: 0; font-size: 1.5rem; text-align: center;">
                ${tip.title}
              </h2>
              <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.05rem; line-height: 1.7; text-align: center; margin-bottom: 20px;">
                ${tip.content}
              </p>
              <div style="background: white; padding: 16px; border-radius: 8px; margin-top: 16px; border: 2px dashed ${EMAIL_COLORS.ACCENT}40;">
                <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 0.95rem; margin: 0; text-align: center; font-style: italic;">
                  <strong>💬 Prueba esto:</strong><br>
                  ${tip.action}
                </p>
              </div>
            </div>

            <h3 style="color: ${EMAIL_COLORS.ACCENT}; margin-top: 28px; text-align: center;">✨ Recuerda</h3>
            <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1rem; line-height: 1.6; text-align: center;">
              El bienestar emocional es un viaje, no un destino. Cada pequeño paso que das hacia tu bienestar es valioso. ${APP_NAME} está aquí para acompañarte en cada paso del camino.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: ${EMAIL_COLORS.TEXT_GRAY}; font-size: 0.95rem;">
                ¿Tienes preguntas o quieres profundizar en este tema?<br>
                Abre la app y conversa con ${APP_NAME}. Estamos aquí para ti. 💙
              </p>
            </div>

            <div style="background: ${EMAIL_COLORS.PRIMARY_MEDIUM}10; padding: 20px; border-radius: 12px; margin-top: 24px; text-align: center;">
              <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 0.9rem; margin: 0;">
                <strong>📅 Próximo tip:</strong> Te enviaremos otro tip la próxima semana. ¡Mantente atento!
              </p>
            </div>
          </div>

          ${getEmailFooter()}
        </div>
      `
    };
  },

  /**
   * Plantilla para correo de agradecimiento por suscripción
   */
  subscriptionThankYouEmail: (username, plan, periodEnd) => {
    const planNames = {
      weekly: 'Semanal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      semestral: 'Semestral',
      yearly: 'Anual',
    };

    const planName = planNames[plan] || plan;
    const periodEndDate = new Date(periodEnd).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      subject: `¡Gracias por tu suscripción a ${APP_NAME}! 🎉`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${EMAIL_COLORS.BACKGROUND};">
          ${getEmailHeader(`¡Gracias por tu suscripción, ${username}! 🎉`)}
          
          <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.18);">
            <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
              ¡Hola ${username}!<br><br>
              Queremos agradecerte por confiar en ${APP_NAME} y por unirte a nuestra comunidad premium. Tu suscripción ha sido activada exitosamente y ahora tienes acceso completo a todas las funcionalidades de la app.
            </p>
            
            <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_MEDIUM} 0%, ${EMAIL_COLORS.ACCENT} 100%); padding: 24px; border-radius: 14px; margin: 28px 0; text-align: center;">
              <h2 style="color: white; margin: 0 0 12px 0; font-size: 1.5rem;">
                ✨ Plan ${planName}
              </h2>
              <p style="color: rgba(255,255,255,0.95); font-size: 1rem; margin: 0;">
                Tu suscripción es válida hasta el ${periodEndDate}
              </p>
            </div>

            <h2 style="color: ${EMAIL_COLORS.ACCENT}; margin-top: 20px; text-align: center;">
              🎁 ¿Qué incluye tu suscripción premium?
            </h2>
            <ul style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              <li><b>Chat ilimitado</b> con ${APP_NAME}, tu asistente terapéutico</li>
              <li><b>Evaluaciones clínicas</b> automáticas (PHQ-9, GAD-7)</li>
              <li><b>Detección de distorsiones cognitivas</b> en tus conversaciones</li>
              <li><b>Protocolos terapéuticos estructurados</b> personalizados</li>
              <li><b>Seguimiento de progreso</b> y métricas de bienestar</li>
              <li><b>Análisis emocional avanzado</b> de tus conversaciones</li>
              <li><b>Sin límites</b> en todas las funcionalidades</li>
            </ul>

            <div style="background: linear-gradient(135deg, ${EMAIL_COLORS.PRIMARY_MEDIUM}15 0%, ${EMAIL_COLORS.ACCENT}15 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid ${EMAIL_COLORS.ACCENT};">
              <h3 style="color: ${EMAIL_COLORS.ACCENT}; margin-top: 0; text-align: center;">💬 Comienza ahora</h3>
              <p style="color: ${EMAIL_COLORS.TEXT_DARK}; font-size: 1.05rem; text-align: center; margin-bottom: 0;">
                Abre la app y comienza a conversar con ${APP_NAME}. Estamos aquí para acompañarte en tu camino hacia el bienestar emocional.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: ${EMAIL_COLORS.TEXT_GRAY}; font-size: 14px;">
                Si tienes alguna pregunta sobre tu suscripción o necesitas ayuda, no dudes en contactarnos.<br>
                Estamos aquí para acompañarte en tu camino hacia una mejor salud emocional. 💙
              </p>
            </div>

            <div style="border-top: 1px solid rgba(0,0,0,0.1); padding-top: 20px; margin-top: 28px; text-align: center;">
              <p style="color: ${EMAIL_COLORS.TEXT_GRAY}; font-size: 14px; margin: 0;">
                <strong>Próxima renovación:</strong> ${periodEndDate}
              </p>
            </div>
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
    
    const response = await sgMail.send(msg);
    
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

    // Crear el mensaje en formato RFC 2822
    const message = [
      `From: "${EMAIL_FROM_NAME}" <${GMAIL_USER_EMAIL}>`,
      `To: ${email}`,
      `Subject: ${template.subject}`,
      `Content-Type: text/html; charset=utf-8`,
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
    const response = await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

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
    
    const info = await transporter.sendMail(mailOptions);
    
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

  // Intentar con SendGrid si está configurado
  if (USE_SENDGRID) {
    try {
      return await sendEmailWithSendGrid(email, template, emailType);
    } catch (sendGridError) {
      console.error('[Mailer] ⚠️ SendGrid falló, intentando con Gmail SMTP como fallback...');
      // Continuar con el fallback a Gmail SMTP
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