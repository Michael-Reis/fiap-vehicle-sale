const mysql = require('mysql2/promise');
require('dotenv').config();

async function criarVendaAprovada() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'servico_vendas'
    });

    console.log('🔄 Criando venda aprovada para teste do webhook...');
    
    const vendaId = 'test-venda-' + Date.now();
    const codigoPagamento = 'PAG-TEST-' + Date.now();
    
    // Inserir venda aprovada
    const [result] = await connection.execute(`
      INSERT INTO vendas (
        id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
        status, codigo_pagamento, data_criacao, data_atualizacao, 
        data_aprovacao, webhook_notificado, tentativas_webhook
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), FALSE, 0)
    `, [
      vendaId,
      'veh_58976926-729c-4970-9ac3-71d24f1d', // ID do veículo
      '47907012805', // CPF
      85000, // Valor
      'pix', // Método
      'aprovado', // Status
      codigoPagamento
    ]);
    
    console.log('✅ Venda aprovada criada com sucesso!');
    console.log('ID:', vendaId);
    console.log('Código:', codigoPagamento);
    console.log('O cronjob deve processar em 10 segundos...');
    
    await connection.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

criarVendaAprovada();
