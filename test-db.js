const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabase() {
  try {
    console.log('Testando conexão com o banco de dados...');
    console.log('Configurações:');
    console.log('- Host:', process.env.DB_HOST);
    console.log('- Port:', process.env.DB_PORT);
    console.log('- User:', process.env.DB_USER);
    console.log('- Database:', process.env.DB_NAME);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'servico_vendas'
    });

    console.log('\n✅ Conexão estabelecida com sucesso!');

    // Verificar se o banco existe
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
    console.log(`\n📊 Banco "${process.env.DB_NAME}" ${dbExists ? 'existe' : 'não existe'}`);

    if (!dbExists) {
      console.log('Criando banco de dados...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
      await connection.execute(`USE ${process.env.DB_NAME}`);
      console.log('✅ Banco criado!');
    }

    // Verificar se a tabela vendas existe
    const [tables] = await connection.execute('SHOW TABLES');
    const tableExists = tables.some(table => Object.values(table)[0] === 'vendas');
    console.log(`\n📋 Tabela "vendas" ${tableExists ? 'existe' : 'não existe'}`);

    if (!tableExists) {
      console.log('\n❌ Tabela "vendas" não encontrada!');
      console.log('Criando tabela...');
      
      const createTableQuery = `
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
          INDEX idx_veiculo_id (veiculo_id),
          INDEX idx_cpf_comprador (cpf_comprador),
          INDEX idx_codigo_pagamento (codigo_pagamento),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.execute(createTableQuery);
      console.log('✅ Tabela criada com sucesso!');
    } else {
      console.log('\n✅ Tabela "vendas" encontrada!');
    }

    // Verificar estrutura da tabela
    const [columns] = await connection.execute('DESCRIBE vendas');
    console.log('\n🏗️  Estrutura da tabela:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });

    // Contar registros
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM vendas');
    console.log(`\n📊 Total de vendas na tabela: ${count[0].total}`);

    await connection.end();
    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDatabase();
