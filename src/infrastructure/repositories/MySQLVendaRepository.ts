import { VendaRepository } from '../../domain/repositories/VendaRepository';
import { Venda, StatusVenda, MetodoPagamento } from '../../domain/entities/Venda';
import { pool } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class MySQLVendaRepository implements VendaRepository {
  
  async criar(vendaData: Omit<Venda, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Promise<Venda> {
    const id = uuidv4();
    const now = new Date();
    
    const query = `
      INSERT INTO vendas (
        id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
        status, codigo_pagamento, webhook_notificado, tentativas_webhook
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.execute(query, [
      id,
      vendaData.veiculoId,
      vendaData.cpfComprador,
      vendaData.valorPago,
      vendaData.metodoPagamento,
      vendaData.status,
      vendaData.codigoPagamento || null,
      vendaData.webhookNotificado,
      vendaData.tentativasWebhook
    ]);
    
    const vendaCriada = await this.buscarPorId(id);
    if (!vendaCriada) {
      throw new Error('Erro ao criar venda');
    }
    
    return vendaCriada;
  }

  async buscarPorId(id: string): Promise<Venda | null> {
    const query = `
      SELECT id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
             status, codigo_pagamento, data_criacao, data_atualizacao, 
             data_aprovacao, webhook_notificado, tentativas_webhook
      FROM vendas WHERE id = ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return this.mapRowToVenda(rows[0]);
  }

  async buscarPorCodigoPagamento(codigoPagamento: string): Promise<Venda | null> {
    const query = `
      SELECT id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
             status, codigo_pagamento, data_criacao, data_atualizacao, 
             data_aprovacao, webhook_notificado, tentativas_webhook
      FROM vendas WHERE codigo_pagamento = ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [codigoPagamento]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return this.mapRowToVenda(rows[0]);
  }

  async buscarPorVeiculoId(veiculoId: string): Promise<Venda[]> {
    const query = `
      SELECT id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
             status, codigo_pagamento, data_criacao, data_atualizacao, 
             data_aprovacao, webhook_notificado, tentativas_webhook
      FROM vendas WHERE veiculo_id = ? ORDER BY data_criacao DESC
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [veiculoId]);
    
    return rows.map(row => this.mapRowToVenda(row));
  }

  async buscarPorCpf(cpfComprador: string): Promise<Venda[]> {
    const query = `
      SELECT id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
             status, codigo_pagamento, data_criacao, data_atualizacao, 
             data_aprovacao, webhook_notificado, tentativas_webhook
      FROM vendas WHERE cpf_comprador = ? ORDER BY data_criacao DESC
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [cpfComprador]);
    
    return rows.map(row => this.mapRowToVenda(row));
  }

  async atualizar(id: string, dados: Partial<Venda>): Promise<Venda | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    
    if (dados.status !== undefined) {
      setClauses.push('status = ?');
      values.push(dados.status);
    }
    
    if (dados.codigoPagamento !== undefined) {
      setClauses.push('codigo_pagamento = ?');
      values.push(dados.codigoPagamento);
    }
    
    if (dados.dataAprovacao !== undefined) {
      setClauses.push('data_aprovacao = ?');
      values.push(dados.dataAprovacao);
    }
    
    if (dados.webhookNotificado !== undefined) {
      setClauses.push('webhook_notificado = ?');
      values.push(dados.webhookNotificado);
    }
    
    if (dados.tentativasWebhook !== undefined) {
      setClauses.push('tentativas_webhook = ?');
      values.push(dados.tentativasWebhook);
    }
    
    if (setClauses.length === 0) {
      return this.buscarPorId(id);
    }
    
    values.push(id);
    
    const query = `UPDATE vendas SET ${setClauses.join(', ')}, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await pool.execute(query, values);
    
    return this.buscarPorId(id);
  }

  async atualizarStatus(id: string, status: StatusVenda, dataAprovacao?: Date): Promise<boolean> {
    const query = dataAprovacao 
      ? `UPDATE vendas SET status = ?, data_aprovacao = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`
      : `UPDATE vendas SET status = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`;
    
    const values = dataAprovacao ? [status, dataAprovacao, id] : [status, id];
    
    const [result] = await pool.execute<ResultSetHeader>(query, values);
    
    return result.affectedRows > 0;
  }

  async buscarVendasPendentesWebhook(): Promise<Venda[]> {
    const query = `
      SELECT id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
             status, codigo_pagamento, data_criacao, data_atualizacao, 
             data_aprovacao, webhook_notificado, tentativas_webhook
      FROM vendas 
      WHERE status = 'aprovado' AND webhook_notificado = FALSE AND tentativas_webhook < 5
      ORDER BY data_aprovacao ASC
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query);
    
    return rows.map(row => this.mapRowToVenda(row));
  }

  async incrementarTentativasWebhook(id: string): Promise<boolean> {
    const query = `UPDATE vendas SET tentativas_webhook = tentativas_webhook + 1, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`;
    
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);
    
    return result.affectedRows > 0;
  }

  async marcarWebhookNotificado(id: string): Promise<boolean> {
    const query = `UPDATE vendas SET webhook_notificado = TRUE, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`;
    
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);
    
    return result.affectedRows > 0;
  }

  async listarTodas(limit: number = 50, offset: number = 0): Promise<Venda[]> {
    const query = `
      SELECT id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
             status, codigo_pagamento, data_criacao, data_atualizacao, 
             data_aprovacao, webhook_notificado, tentativas_webhook
      FROM vendas 
      ORDER BY data_criacao DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [limit, offset]);
    
    return rows.map(row => this.mapRowToVenda(row));
  }

  private mapRowToVenda(row: RowDataPacket): Venda {
    return {
      id: row.id,
      veiculoId: row.veiculo_id,
      cpfComprador: row.cpf_comprador,
      valorPago: parseFloat(row.valor_pago),
      metodoPagamento: row.metodo_pagamento as MetodoPagamento,
      status: row.status as StatusVenda,
      codigoPagamento: row.codigo_pagamento,
      dataCriacao: new Date(row.data_criacao),
      dataAtualizacao: new Date(row.data_atualizacao),
      dataAprovacao: row.data_aprovacao ? new Date(row.data_aprovacao) : undefined,
      webhookNotificado: Boolean(row.webhook_notificado),
      tentativasWebhook: row.tentativas_webhook
    };
  }
}
