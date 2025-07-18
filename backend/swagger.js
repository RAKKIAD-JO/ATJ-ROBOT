// swagger.js
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'ATJ Robots API',
    description: 'API documentation for ATJ Robot system',
    version: "1.0.0",
  },
  host: 'localhost:5000',
  schemes: ['https'],
  tags: [
    {
      name: 'Robot',
      description: './robot/robot.js',
    },
    {
      name: 'User',
      description: './users.js',
    },
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'ใส่ Bearer Token เช่น: `Bearer <token>`',
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./server.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);