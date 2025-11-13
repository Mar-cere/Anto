/**
 * Configuración de Mailer - Gestiona el envío de correos electrónicos
 */
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

// Constantes de configuración
const APP_NAME = 'Anto';
const APP_NAME_FULL = 'AntoApp';
const LOGO_URL = 'https://res.cloudinary.com/dfmmn3hqw/image/upload/v1746325071/Anto_nnrwjr.png';
const EMAIL_FROM_NAME = 'Anto';

// Constantes de tiempos de expiración
const CODE_EXPIRATION_MINUTES = 10;
const RESET_TOKEN_EXPIRATION_HOURS = 1;

// Constantes de URLs
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const RESET_PASSWORD_PATH = '/reset-password';

// Constantes de colores (para plantillas HTML)
const COLORS = {
  PRIMARY_DARK: '#0A1533',
  PRIMARY_MEDIUM: '#1D2B5F',
  ACCENT: '#1ADDDB',
  TEXT_LIGHT: '#A3B8E8',
  TEXT_DARK: '#1D2B5F',
  TEXT_GRAY: '#666',
  TEXT_WHITE: '#fff',
  BACKGROUND: '#f3f7fa'
};

// Helper: crear transporter de nodemailer
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    const error = new Error('Variables de entorno EMAIL_USER y EMAIL_APP_PASSWORD son requeridas para enviar correos');
    console.error('[Mailer] ⚠️ Configuración faltante:', error.message);
    throw error;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

// Helper: generar footer común para emails
const getEmailFooter = () => {
  const currentYear = new Date().getFullYear();
  return `
    <div style="text-align: center; margin: 0 24px 24px 24px;">
      <p style="color: ${COLORS.TEXT_LIGHT}; font-size: 0.95rem; margin: 0;">
        Este es un correo automático, por favor no respondas a este mensaje.<br>
        © ${currentYear} <span style="color: ${COLORS.ACCENT};">${APP_NAME}</span>. Todos los derechos reservados.
      </p>
    </div>
  `;
};

// Helper: generar header común para emails
const getEmailHeader = (title, logoAlt = `${APP_NAME} Logo`) => {
  return `
    <div style="background: linear-gradient(135deg, ${COLORS.PRIMARY_DARK} 0%, ${COLORS.PRIMARY_MEDIUM} 60%, ${COLORS.ACCENT} 100%); padding: 36px 0 24px 0; border-radius: 0 0 32px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); text-align: center;">
      <img src="${LOGO_URL}" alt="${logoAlt}" style="width: 64px; height: 64px; margin-bottom: 12px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.10);" />
      <h1 style="color: ${COLORS.TEXT_WHITE}; margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 8px rgba(0,0,0,0.15);">
        ${title}
      </h1>
    </div>
  `;
};

// Plantillas de correo
const emailTemplates = {
  /**
   * Plantilla para código de verificación
   */
  verificationCode: (code) => ({
    subject: `Código de Verificación - ${APP_NAME_FULL}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${COLORS.BACKGROUND};">
        ${getEmailHeader('Código de Verificación')}
        
        <div style="background: rgba(20, 28, 56, 0.92); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.10);">
          <p style="color: ${COLORS.TEXT_WHITE}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
            ¡Hola!<br>
            Tu código de verificación para recuperar tu contraseña es:
          </p>

          <div style="background: linear-gradient(135deg, ${COLORS.PRIMARY_MEDIUM} 0%, ${COLORS.ACCENT} 100%); padding: 4px; border-radius: 14px; margin: 32px 0;">
            <div style="background: white; padding: 24px 0; border-radius: 12px;">
              <span style="display: block; color: ${COLORS.TEXT_DARK}; font-size: 2.5rem; text-align: center; letter-spacing: 12px; font-weight: bold; font-family: 'Segoe UI Mono', 'Menlo', 'Monaco', monospace;">
                ${code}
              </span>
            </div>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <p style="color: ${COLORS.TEXT_LIGHT}; font-size: 1rem; margin-bottom: 8px;">
              Este código expirará en <span style="color: ${COLORS.ACCENT}; font-weight: bold;">${CODE_EXPIRATION_MINUTES} minutos</span>.
            </p>
            <p style="color: ${COLORS.TEXT_LIGHT}; font-size: 0.95rem;">
              Si no solicitaste este código, puedes ignorar este correo.
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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${COLORS.BACKGROUND};">
        ${getEmailHeader('Restablecer Contraseña')}
        
        <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.18);">
          <p style="color: ${COLORS.TEXT_DARK}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
            Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}${RESET_PASSWORD_PATH}?token=${token}"
               style="background: linear-gradient(135deg, ${COLORS.PRIMARY_MEDIUM} 0%, ${COLORS.ACCENT} 100%); color: ${COLORS.TEXT_WHITE}; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          
          <p style="color: ${COLORS.TEXT_GRAY}; font-size: 0.95rem; text-align: center;">
            Este enlace expirará en ${RESET_TOKEN_EXPIRATION_HOURS} hora${RESET_TOKEN_EXPIRATION_HOURS > 1 ? 's' : ''}.
          </p>
          <p style="color: ${COLORS.TEXT_GRAY}; font-size: 0.95rem; text-align: center;">
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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${COLORS.BACKGROUND};">
        ${getEmailHeader(`¡Bienvenido a ${APP_NAME}, ${username}! 🎉`)}
        
        <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); margin: -24px 24px 24px 24px; padding: 32px 24px; border-radius: 18px; box-shadow: 0 8px 32px rgba(31,38,135,0.10); border: 1px solid rgba(255,255,255,0.18);">
          <p style="color: ${COLORS.TEXT_DARK}; font-size: 1.1rem; line-height: 1.7; margin-bottom: 28px; text-align: center;">
            ¡Gracias por unirte a nuestra comunidad! ${APP_NAME} es tu espacio seguro para conversar con una IA entrenada como psicólogo virtual, lista para escucharte y acompañarte en tu bienestar emocional.
          </p>
          
          <h2 style="color: ${COLORS.ACCENT}; margin-top: 20px; text-align: center;">¿Cómo aprovechar al máximo el chat con ${APP_NAME}?</h2>
          <ul style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            <li><b>Exprésate libremente:</b> Cuéntale a ${APP_NAME} cómo te sientes, tus preocupaciones, logros o dudas. No hay juicios, solo escucha y acompañamiento.</li>
            <li><b>Haz preguntas abiertas:</b> Si buscas reflexión, pide a ${APP_NAME} que te ayude a ver diferentes perspectivas o a profundizar en tus emociones.</li>
            <li><b>Utiliza el chat en momentos de estrés o ansiedad:</b> ${APP_NAME} puede guiarte con ejercicios de respiración, mindfulness o ayudarte a organizar tus pensamientos.</li>
            <li><b>Revisa tus conversaciones:</b> Volver a leer lo que has compartido puede ayudarte a identificar patrones y avances en tu bienestar.</li>
            <li><b>Recuerda:</b> ${APP_NAME} no reemplaza a un profesional humano, pero es un gran apoyo para tu día a día emocional.</li>
          </ul>

          <h2 style="color: ${COLORS.ACCENT}; margin-top: 20px; text-align: center;">Tips para un mejor beneficio:</h2>
          <ol style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            <li>Habla con ${APP_NAME} de forma regular, incluso si no tienes un problema específico.</li>
            <li>Prueba escribir tus emociones tal como las sientes, sin filtros.</li>
            <li>Pide a ${APP_NAME} ejercicios de relajación o autoexploración cuando lo necesites.</li>
            <li>Utiliza los recordatorios, hábitos y tareas como complemento para tu bienestar, pero recuerda que el corazón de ${APP_NAME} es el chat.</li>
          </ol>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: ${COLORS.TEXT_GRAY}; font-size: 14px;">
              Si tienes alguna pregunta o sugerencia, no dudes en contactarnos.<br>
              ¡Estamos aquí para acompañarte en tu camino hacia una mejor salud emocional!
            </p>
          </div>
        </div>

        ${getEmailFooter()}
      </div>
    `
  })
};

// Helper: enviar correo genérico
const sendEmail = async (email, template, emailType) => {
  try {
    // Verificar configuración antes de intentar enviar
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error('Variables de entorno EMAIL_USER y EMAIL_APP_PASSWORD no están configuradas');
    }

    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: email,
      ...template
    });
    
    console.log(`✉️ ${emailType} enviado exitosamente a:`, email);
    return true;
  } catch (error) {
    console.error(`[Mailer] ❌ Error al enviar ${emailType} a ${email}:`, error.message);
    if (error.message.includes('Variables de entorno')) {
      console.error('[Mailer] 💡 Solución: Configura EMAIL_USER y EMAIL_APP_PASSWORD en tu archivo .env');
    }
    throw error;
  }
};

// Funciones de envío de correo
const mailer = {
  /**
   * Enviar código de verificación
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
      console.error('[Mailer] Error al enviar correo de bienvenida (no crítico):', error);
      return false;
    }
  }
};

export default mailer;