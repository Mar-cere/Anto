/**
 * Configuración de Swagger/OpenAPI
 * 
 * Genera documentación interactiva de la API usando Swagger.
 * 
 * @author AntoApp Team
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Anto App API',
      version: '1.2.0',
      description: 'API REST para Anto App - Aplicación de asistente AI terapéutico',
      contact: {
        name: 'AntoApp Team',
        email: 'support@antoapp.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: process.env.FRONTEND_URL || 'http://localhost:5000',
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://anto-ion2.onrender.com',
        description: 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint de login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message',
                },
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                statusCode: {
                  type: 'number',
                  example: 400,
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación',
      },
      {
        name: 'Users',
        description: 'Endpoints de usuarios',
      },
      {
        name: 'Tasks',
        description: 'Endpoints de tareas',
      },
      {
        name: 'Habits',
        description: 'Endpoints de hábitos',
      },
      {
        name: 'Chat',
        description: 'Endpoints de chat con IA',
      },
      {
        name: 'Crisis',
        description: 'Endpoints de gestión de crisis',
      },
      {
        name: 'Payments',
        description: 'Endpoints de pagos y suscripciones',
      },
      {
        name: 'Health',
        description: 'Endpoints de salud del servidor',
      },
    ],
  },
  apis: [
    './routes/*.js',
    './server.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Anto App API Documentation',
};

export const setupSwagger = (app) => {
  // Documentación JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // UI de Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
};

export default swaggerSpec;

