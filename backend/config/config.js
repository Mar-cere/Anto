/**
 * Configuración de la Aplicación - Gestiona variables de entorno y configuración global
 */
import dotenv from 'dotenv';

dotenv.config();

// Constantes de variables de entorno requeridas
const REQUIRED_ENV_VARS = ['OPENAI_API_KEY', 'MONGO_URI', 'JWT_SECRET'];

// Constantes de valores por defecto
const DEFAULT_PORT = 5000;
const DEFAULT_ENVIRONMENT = 'development';
const DEFAULT_OPENAI_MODEL = 'gpt-5-turbo';
const DEFAULT_JWT_EXPIRES_IN = '24h';

// Constantes de configuración de OpenAI
const OPENAI_MAX_TOKENS = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 400
};

const OPENAI_TEMPERATURE = {
  PRECISE: 0.3,
  BALANCED: 0.5,
  CREATIVE: 0.7
};

// Helper: validar variables de entorno requeridas
const validateRequiredEnvVars = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno críticas: ${missing.join(', ')}. ` +
      `Por favor, configura estas variables en tu archivo .env`
    );
  }
};

// Validar variables de entorno al cargar el módulo
validateRequiredEnvVars();

// Configuración exportada
export default {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    maxTokens: {
      short: OPENAI_MAX_TOKENS.SHORT,
      medium: OPENAI_MAX_TOKENS.MEDIUM,
      long: OPENAI_MAX_TOKENS.LONG
    },
    temperature: {
      precise: OPENAI_TEMPERATURE.PRECISE,
      balanced: OPENAI_TEMPERATURE.BALANCED,
      creative: OPENAI_TEMPERATURE.CREATIVE
    }
  },
  mongodb: {
    uri: process.env.MONGO_URI || process.env.MONGODB_URI // Soporta ambos nombres
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN
  },
  app: {
    port: parseInt(process.env.PORT || DEFAULT_PORT, 10),
    environment: process.env.NODE_ENV || DEFAULT_ENVIRONMENT,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  }
}; 