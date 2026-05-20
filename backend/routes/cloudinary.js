/**
 * Rutas de Cloudinary - Gestiona firma de subida, eliminación y consulta de recursos
 */
import cloudinary from 'cloudinary';
import express from 'express';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validationErrorBody, validateBody } from '../utils/apiValidation.js';
import { cloudinaryApiCopy } from '../utils/cloudinaryApiCopy.js';
import { getSignatureSchema } from '../utils/cloudinarySchemas.js';

const router = express.Router();

router.use(attachApiCopy(cloudinaryApiCopy));

const deleteResourceLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: (req) => cloudinaryApiCopy(resolveRequestLanguage(req)).rateLimitDelete,
  standardHeaders: true,
  legacyHeaders: false,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEFAULT_TYPE = 'authenticated';
const DEFAULT_MAX_RESULTS = 10;

const validatePreset = (type) => {
  const presets = {
    background: {
      upload_preset: 'Anto Background',
      transformation: [
        { width: 1920, height: 1080, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    },
    attachment: {
      upload_preset: 'Anto Attachment',
      transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
    },
  };

  return presets[type] || presets.attachment;
};

router.post('/signature', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getSignatureSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }

    const { type, folder, allowed_formats, max_size } = value;
    const preset = validatePreset(type);

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      timestamp,
      upload_preset: preset.upload_preset,
      type: DEFAULT_TYPE,
      folder,
      allowed_formats,
      max_size,
      transformation: JSON.stringify(preset.transformation),
    };

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
      params: paramsToSign,
    });
  } catch (error) {
    console.error('Error generando firma:', error);
    res.status(500).json({
      message: copy.signatureError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/resource/:publicId', authenticateToken, deleteResourceLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { publicId } = req.params;
    const { type } = req.query;

    if (!publicId || !publicId.trim()) {
      return res.status(400).json({
        message: copy.resourceIdRequired,
      });
    }

    const result = await cloudinary.v2.uploader.destroy(publicId.trim(), {
      type: type || DEFAULT_TYPE,
      invalidate: true,
    });

    if (result.result !== 'ok') {
      return res.status(400).json({
        message: copy.deleteResourceError,
        result,
      });
    }

    res.json({
      message: copy.resourceDeleted,
      result,
    });
  } catch (error) {
    console.error('Error eliminando recurso:', error);
    res.status(500).json({
      message: copy.deleteResourceError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/resources', authenticateToken, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { type = DEFAULT_TYPE, max_results = DEFAULT_MAX_RESULTS, next_cursor } = req.query;

    const result = await cloudinary.v2.search
      .expression(`folder:${req.user._id}/*`)
      .sort_by('created_at', 'desc')
      .max_results(parseInt(max_results))
      .next_cursor(next_cursor)
      .execute();

    res.json({
      resources: result.resources || [],
      next_cursor: result.next_cursor || null,
    });
  } catch (error) {
    console.error('Error obteniendo recursos:', error);
    res.status(500).json({
      message: copy.listResourcesError,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
