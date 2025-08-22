import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'servico_vendas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const pool = mysql.createPool(dbConfig);

export async function initializeDatabase() {
  try {
    // Criar banco se não existir
    const connectionWithoutDb = mysql.createPool({
      ...dbConfig,
      database: undefined,
    });
    
    await connectionWithoutDb.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connectionWithoutDb.end();

    // Criar tabelas
    await createTables();
    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

async function createTables() {
  const createVendasTable = `
    CREATE TABLE IF NOT EXISTS vendas (
      id VARCHAR(36) PRIMARY KEY,
      veiculo_id VARCHAR(50) NOT NULL,
      cpf_comprador VARCHAR(11) NOT NULL,
      valor_pago DECIMAL(10,2) NOT NULL,
      metodo_pagamento ENUM('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia') NOT NULL,
      status ENUM('pendente', 'processando', 'aprovado', 'rejeitado', 'cancelado') DEFAULT 'pendente',
      codigo_pagamento VARCHAR(100),
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      data_aprovacao TIMESTAMP NULL,
      webhook_notificado BOOLEAN DEFAULT FALSE,
      tentativas_webhook INT DEFAULT 0,
      INDEX idx_status (status),
      INDEX idx_veiculo_id (veiculo_id),
      INDEX idx_cpf_comprador (cpf_comprador),
      INDEX idx_webhook_pendente (webhook_notificado, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createLogWebhookTable = `
    CREATE TABLE IF NOT EXISTS log_webhook (
      id INT AUTO_INCREMENT PRIMARY KEY,
      venda_id VARCHAR(36) NOT NULL,
      url VARCHAR(500) NOT NULL,
      payload TEXT NOT NULL,
      status_code INT,
      resposta TEXT,
      data_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sucesso BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
      INDEX idx_venda_id (venda_id),
      INDEX idx_sucesso (sucesso)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.execute(createVendasTable);
  await pool.execute(createLogWebhookTable);
}

export default pool;
