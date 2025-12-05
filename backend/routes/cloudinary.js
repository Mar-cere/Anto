/**
 * Rutas de Cloudinary - Gestiona firma de subida, eliminación y consulta de recursos en Cloudinary
 */
import cloudinary from 'cloudinary';
import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter para eliminación de recursos
const deleteResourceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: 'Demasiadas eliminaciones de recursos. Por favor, intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Constantes de configuración
const MAX_FILE_SIZE = 5242880; // 5MB en bytes
const DEFAULT_TYPE = 'authenticated';
const DEFAULT_MAX_RESULTS = 10;
const ALLOWED_FORMATS = ['jpg', 'png', 'gif', 'webp'];

// Esquemas de validación Joi
const signatureSchema = Joi.object({
  type: Joi.string()
    .valid('avatar', 'background', 'attachment')
    .required()
    .messages({
      'any.only': 'El tipo debe ser avatar, background o attachment',
      'any.required': 'El tipo es requerido'
    }),
  folder: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'La carpeta es requerida'
    }),
  allowed_formats: Joi.array()
    .items(Joi.string())
    .default(ALLOWED_FORMATS),
  max_size: Joi.number()
    .default(MAX_FILE_SIZE)
    .min(1024) // Mínimo 1KB
    .max(10485760) // Máximo 10MB
});

// Presets de configuración por tipo de recurso
const validatePreset = (type) => {
  const presets = {
    avatar: {
      upload_preset: 'Anto Avatar',
      transformation: [
        { width: 200, height: 200, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    },
    background: {
      upload_preset: 'Anto Background',
      transformation: [
        { width: 1920, height: 1080, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    },
    attachment: {
      upload_preset: 'Anto Attachment',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    }
  };

  return presets[type] || presets.attachment;
};

// Generar firma de subida para Cloudinary
router.post('/signature', authenticateToken, async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = signatureSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { type, folder, allowed_formats, max_size } = value;
    const preset = validatePreset(type);

    // Generar timestamp y parámetros para firmar
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      timestamp,
      upload_preset: preset.upload_preset,
      type: DEFAULT_TYPE,
      folder,
      allowed_formats,
      max_size,
      transformation: JSON.stringify(preset.transformation)
    };

    // Generar firma usando el secreto de Cloudinary
    const signature = cloudinary.v2.utils.api_sign_request(
      paramsToSign, 
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      uploadPreset: preset.upload_preset,
      params: paramsToSign
    });
  } catch (error) {
    console.error('Error generando firma:', error);
    res.status(500).json({
      message: 'Error al generar firma de subida',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Eliminar recurso de Cloudinary
router.delete('/resource/:publicId', authenticateToken, deleteResourceLimiter, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { type } = req.query;

    if (!publicId || !publicId.trim()) {
      return res.status(400).json({
        message: 'ID del recurso requerido'
      });
    }

    // Eliminar recurso de Cloudinary (invalida caché)
    const result = await cloudinary.v2.uploader.destroy(publicId.trim(), {
      type: type || DEFAULT_TYPE,
      invalidate: true
    });

    if (result.result !== 'ok') {
      return res.status(400).json({
        message: 'Error al eliminar el recurso',
        result
      });
    }

    res.json({
      message: 'Recurso eliminado correctamente',
      result
    });
  } catch (error) {
    console.error('Error eliminando recurso:', error);
    res.status(500).json({
      message: 'Error al eliminar el recurso',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener recursos del usuario (búsqueda en Cloudinary)
router.get('/resources', authenticateToken, async (req, res) => {
  try {
    const { 
      type = DEFAULT_TYPE, 
      max_results = DEFAULT_MAX_RESULTS, 
      next_cursor 
    } = req.query;

    // Buscar recursos en la carpeta del usuario
    const result = await cloudinary.v2.search
      .expression(`folder:${req.user._id}/*`)
      .sort_by('created_at', 'desc')
      .max_results(parseInt(max_results))
      .next_cursor(next_cursor)
      .execute();

    res.json({
      resources: result.resources || [],
      next_cursor: result.next_cursor || null
    });
  } catch (error) {
    console.error('Error obteniendo recursos:', error);
    res.status(500).json({
      message: 'Error al obtener recursos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
