import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Platform API",
      version: "1.0.0",
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      description: "API documentation for Event Platform SaaS",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
      },
    ],
  },

  apis: ["./routes/*.js"], // read route files
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
