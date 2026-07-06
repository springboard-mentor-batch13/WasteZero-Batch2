const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'WasteZero Authentication API',
      version: '1.0.0',
      description: 'Swagger documentation for WasteZero authentication module',
    },
    servers: [{ url: process.env.SWAGGER_SERVER_URL || '/api' }],
    tags: [{ name: 'Auth', description: 'Authentication endpoints' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        UserRegistration: {
          type: 'object',
          required: ['fullName', 'username', 'email', 'password', 'confirmPassword', 'role'],
          properties: {
            fullName: { type: 'string', example: 'Ava Smith' },
            username: { type: 'string', example: 'ava_smith' },
            email: { type: 'string', format: 'email', example: 'ava@example.com' },
            password: { type: 'string', minLength: 8, example: 'StrongPass123' },
            confirmPassword: { type: 'string', example: 'StrongPass123' },
            role: {
              type: 'string',
              enum: ['Volunteer', 'NGO', 'Admin'],
              default: 'Volunteer',
            },
          },
        },
        UserLogin: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'ava_smith' },
            password: { type: 'string', example: 'StrongPass123' },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, '..', 'routes', '*.js').replace(/\\/g, '/')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
