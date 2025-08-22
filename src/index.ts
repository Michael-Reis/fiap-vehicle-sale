import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './infrastructure/http/routes/authRoutes';
import veiculoRoutes from './infrastructure/http/routes/veiculoRoutes';
import vendaRoutes from './infrastructure/http/routes/vendaRoutes';
import { initializeDatabase } from './infrastructure/database/connection';
import { CronJobService } from './infrastructure/jobs/CronJobService';

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
  apis: [
    './src/infrastructure/http/routes/*.ts',
    './src/infrastructure/http/controllers/*.ts'
  ]
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
app.use('/api/veiculos', veiculoRoutes);
app.use('/api', vendaRoutes);

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

// Inicializar aplicação
async function startServer() {
  try {
    // Inicializar banco de dados
    console.log('🔧 Inicializando banco de dados...');
    await initializeDatabase();
    console.log('✅ Banco de dados inicializado com sucesso');

    // Inicializar CronJob para processar webhooks
    const cronJob = new CronJobService();
    const intervalSeconds = parseInt(process.env.CRONJOB_INTERVAL_SECONDS || '10');
    cronJob.start(intervalSeconds);
    console.log(`⏰ CronJob iniciado com intervalo de ${intervalSeconds} segundo(s)`);

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Serviço de vendas rodando na porta ${PORT}`);
      console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health check disponível em http://localhost:${PORT}/health`);
      console.log(`💰 API de vendas disponível em http://localhost:${PORT}/api/vendas`);
      console.log(`🔗 Webhook de pagamento disponível em http://localhost:${PORT}/api/webhook/pagamento`);
    });

    // Tratamento graceful de shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Recebido sinal de shutdown...');
      cronJob.stop();
      console.log('✅ CronJob parado');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Iniciar a aplicação
startServer();

export default app;
