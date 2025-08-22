import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './infrastructure/http/routes/authRoutes';

// Configurar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());

// Middleware de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // máximo de 100 requests por windowMs
  message: {
    error: 'Muitas requisições enviadas. Tente novamente em alguns minutos.',
    retry_after: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Serviço de Vendas - API',
      version: '1.0.0',
      description: 'API para gerenciamento de vendas de veículos',
      contact: {
        name: 'FIAP Student',
        email: 'student@fiap.com.br'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/infrastructure/http/routes/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'servico-vendas',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);

// Middleware de tratamento de rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de tratamento de erros
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro interno:', error);
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Serviço de vendas rodando na porta ${PORT}`);
  console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check disponível em http://localhost:${PORT}/health`);
});

export default app;
