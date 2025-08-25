import axios from 'axios';
import { Venda, NotificacaoWebhookExterno } from '../entities/Venda';
import { pool } from '../../infrastructure/database/connection';

export class WebhookService {
  private readonly webhookUrl: string;
  private readonly maxTentativas: number = 5;
  private readonly timeoutMs: number = 5000;

  constructor() {
    // Se EXTERNAL_WEBHOOK_URL não estiver definida, usa o SERVICO_PRINCIPAL_URL como base
    const servicoPrincipalUrl = process.env.SERVICO_PRINCIPAL_URL || 'http://localhost:3000';
    this.webhookUrl = process.env.EXTERNAL_WEBHOOK_URL || `${servicoPrincipalUrl}/api/webhook/pagamento`;
  }

  async notificarVendaAprovada(venda: Venda): Promise<boolean> {
    const payload: NotificacaoWebhookExterno = {
      codigoPagamento: venda.codigoPagamento || '',
      status: 'aprovado',
      veiculoId: venda.veiculoId,
      cpfComprador: venda.cpfComprador,
      valorPago: venda.valorPago,
      metodoPagamento: venda.metodoPagamento,
      dataTransacao: venda.dataAprovacao?.toISOString() || new Date().toISOString()
    };

    try {
      const response = await axios.post(this.webhookUrl, payload, {
        timeout: this.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Servico-Vendas-Webhook/1.0'
        }
      });

      // Log da tentativa
      await this.logTentativaWebhook(venda.id, this.webhookUrl, payload, response.status, response.data, true);

      // Considera sucesso se status for 2xx
      return response.status >= 200 && response.status < 300;
    } catch (error: any) {
      let statusCode = 0;
      let resposta = 'Erro de conexão';

      if (error.response) {
        statusCode = error.response.status;
        resposta = JSON.stringify(error.response.data);
      } else if (error.request) {
        resposta = 'Timeout ou erro de rede';
      } else {
        resposta = error.message;
      }

      // Log da tentativa com erro
      await this.logTentativaWebhook(venda.id, this.webhookUrl, payload, statusCode, resposta, false);

      return false;
    }
  }

  async processarWebhooksPendentes(): Promise<void> {
    console.log('Iniciando processamento de webhooks pendentes...');
    
    try {
      // Primeiro: Aprovar vendas pendentes que estão há mais de 30 segundos
      await this.aprovarVendasPendentes();
      
      // Segundo: Processar webhooks de vendas aprovadas
      await this.processarWebhooksAprovadas();
      
      console.log('Processamento de webhooks pendentes concluído');
    } catch (error) {
      console.error('Erro no processamento de webhooks pendentes:', error);
    }
  }

  private async aprovarVendasPendentes(): Promise<void> {
    console.log('Verificando vendas pendentes para aprovação...');
    
    try {
      // Primeiro vamos ver todas as vendas pendentes (sem filtro de tempo)
      const queryDebug = `
        SELECT id, status, data_criacao, 
               TIMESTAMPDIFF(SECOND, data_criacao, NOW()) as segundos_passados
        FROM vendas 
        WHERE status = 'pendente'
        ORDER BY data_criacao ASC
      `;
      
      const [debugRows] = await pool.execute(queryDebug);
      const todasPendentes = debugRows as any[];
      
      if (todasPendentes.length > 0) {
        console.log(`🔍 Debug: Encontradas ${todasPendentes.length} vendas pendentes no total:`);
        todasPendentes.forEach(v => {
          console.log(`   - Venda ${v.id} (${v.status}): criada há ${v.segundos_passados} segundos`);
        });
      }

      // Agora vamos buscar as que podem ser aprovadas (reduzido para 5 segundos)
      const query = `
        SELECT id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
               codigo_pagamento, data_criacao
        FROM vendas 
        WHERE status = 'pendente' 
        ORDER BY data_criacao ASC
        LIMIT 20
      `;

      const [rows] = await pool.execute(query);
      const vendasPendentes = rows as any[];

      console.log(`Encontradas ${vendasPendentes.length} vendas pendentes para aprovação (≥ 5 segundos)`);

      for (const venda of vendasPendentes) {
        try {
          console.log(`Aprovando automaticamente venda ${venda.id}...`);
          
          // Aprovar a venda
          const updateQuery = `
            UPDATE vendas 
            SET status = 'aprovado', 
                data_aprovacao = NOW(), 
                data_atualizacao = NOW()
            WHERE id = ? AND status = 'pendente'
          `;
          
          await pool.execute(updateQuery, [venda.id]);
          console.log(`✅ Venda ${venda.id} aprovada automaticamente`);
          
        } catch (error) {
          console.error(`Erro ao aprovar venda ${venda.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro ao aprovar vendas pendentes:', error);
    }
  }

  private async processarWebhooksAprovadas(): Promise<void> {
    console.log('Processando webhooks de vendas aprovadas...');
    
    try {
      const query = `
        SELECT id, veiculo_id, cpf_comprador, valor_pago, metodo_pagamento, 
               status, codigo_pagamento, data_criacao, data_atualizacao, 
               data_aprovacao, webhook_notificado, tentativas_webhook
        FROM vendas 
        WHERE status = 'aprovado' 
          AND webhook_notificado = FALSE 
          AND tentativas_webhook < ?
        ORDER BY data_aprovacao ASC
        LIMIT 50
      `;

      const [rows] = await pool.execute(query, [this.maxTentativas]);
      const vendas = rows as any[];

      console.log(`Encontradas ${vendas.length} vendas aprovadas pendentes de notificação webhook`);

      for (const vendaRow of vendas) {
        const venda: Venda = {
          id: vendaRow.id,
          veiculoId: vendaRow.veiculo_id,
          cpfComprador: vendaRow.cpf_comprador,
          valorPago: parseFloat(vendaRow.valor_pago),
          metodoPagamento: vendaRow.metodo_pagamento,
          status: vendaRow.status,
          codigoPagamento: vendaRow.codigo_pagamento,
          dataCriacao: new Date(vendaRow.data_criacao),
          dataAtualizacao: new Date(vendaRow.data_atualizacao),
          dataAprovacao: vendaRow.data_aprovacao ? new Date(vendaRow.data_aprovacao) : undefined,
          webhookNotificado: Boolean(vendaRow.webhook_notificado),
          tentativasWebhook: vendaRow.tentativas_webhook
        };

        try {
          console.log(`Tentando notificar webhook para venda ${venda.id}...`);
          
          // Incrementar tentativas antes de tentar
          await this.incrementarTentativas(venda.id);
          
          const sucesso = await this.notificarVendaAprovada(venda);
          
          if (sucesso) {
            await this.marcarComoNotificado(venda.id);
            console.log(`✅ Webhook notificado com sucesso para venda ${venda.id}`);
          } else {
            console.log(`❌ Falha ao notificar webhook para venda ${venda.id}. Tentativa ${venda.tentativasWebhook + 1}/${this.maxTentativas}`);
          }
          
          // Aguardar um pouco entre as tentativas para não sobrecarregar o serviço externo
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Erro ao processar webhook para venda ${venda.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erro ao processar webhooks aprovados:', error);
    }
  }

  private async logTentativaWebhook(
    vendaId: string, 
    url: string, 
    payload: any, 
    statusCode: number, 
    resposta: any, 
    sucesso: boolean
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO log_webhook (venda_id, url, payload, status_code, resposta, sucesso)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await pool.execute(query, [
        vendaId,
        url,
        JSON.stringify(payload),
        statusCode,
        typeof resposta === 'string' ? resposta : JSON.stringify(resposta),
        sucesso
      ]);
    } catch (error) {
      console.error('Erro ao registrar log de webhook:', error);
    }
  }

  private async incrementarTentativas(vendaId: string): Promise<void> {
    const query = `
      UPDATE vendas 
      SET tentativas_webhook = tentativas_webhook + 1, data_atualizacao = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await pool.execute(query, [vendaId]);
  }

  private async marcarComoNotificado(vendaId: string): Promise<void> {
    const query = `
      UPDATE vendas 
      SET webhook_notificado = TRUE, data_atualizacao = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await pool.execute(query, [vendaId]);
  }
}
