const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'servico_vendas'
    });

    console.log('Dropando tabela existente...');
    await connection.execute('DROP TABLE IF EXISTS vendas');
    
    console.log('Criando nova tabela com estrutura correta...');
    const createTableQuery = `
      CREATE TABLE vendas (
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
        INDEX idx_codigo_pagamento (codigo_pagamento)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Tabela criada com sucesso!');
    
    // Verificar estrutura
    const [columns] = await connection.execute('DESCRIBE vendas');
    console.log('\nNova estrutura:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

updateTable();
