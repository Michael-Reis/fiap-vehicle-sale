const mysql = require('mysql2/promise');
require('dotenv').config();

async function aprovarVenda() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'servico_vendas'
    });

    console.log('🔄 Aprovando venda de teste...');
    
    // Buscar a última venda pendente
    const [vendas] = await connection.execute('SELECT id, codigo_pagamento FROM vendas WHERE status = ? ORDER BY data_criacao DESC LIMIT 1', ['pendente']);
    
    if (vendas.length === 0) {
      console.log('❌ Nenhuma venda pendente encontrada');
      await connection.end();
      return;
    }
    
    const venda = vendas[0];
    console.log('Venda encontrada:', venda.id, 'Código:', venda.codigo_pagamento);
    
    // Atualizar status para aprovado
    const [result] = await connection.execute('UPDATE vendas SET status = ?, data_aprovacao = NOW() WHERE id = ?', ['aprovado', venda.id]);
    
    console.log('✅ Venda aprovada com sucesso!');
    console.log('Agora o cronjob deve processar o webhook...');
    
    // Verificar se foi atualizada
    const [vendaAprovada] = await connection.execute('SELECT * FROM vendas WHERE id = ?', [venda.id]);
    console.log('Status atual:', vendaAprovada[0].status);
    console.log('Data aprovação:', vendaAprovada[0].data_aprovacao);
    
    await connection.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

aprovarVenda();
