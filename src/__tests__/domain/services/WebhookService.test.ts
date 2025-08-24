import axios from 'axios';
import { WebhookService } from '../../../domain/services/WebhookService';
import { Venda, StatusVenda, MetodoPagamento } from '../../../domain/entities/Venda';
import { pool } from '../../../infrastructure/database/connection';

// Mock das dependências
jest.mock('axios');
jest.mock('../../../infrastructure/database/connection');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockPool = pool as jest.Mocked<typeof pool>;

describe('WebhookService', () => {
  let webhookService: WebhookService;
  
  const vendaMock: Venda = {
    id: 'venda-123',
    veiculoId: '1',
    cpfComprador: '12345678901',
    valorPago: 85000,
    metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
    status: StatusVenda.APROVADO,
    codigoPagamento: 'PAG-123456',
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
    dataAprovacao: new Date(),
    webhookNotificado: false,
    tentativasWebhook: 0
  };

  beforeEach(() => {
    // Mock do environment - deve ser configurado antes da criação da instância
    process.env.EXTERNAL_WEBHOOK_URL = 'http://localhost:3000/api/webhook/pagamento';
    
    webhookService = new WebhookService();
    jest.clearAllMocks();
  });

  describe('notificarVendaAprovada', () => {
    it('deve notificar webhook com sucesso', async () => {
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true }
      });

      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await webhookService.notificarVendaAprovada(vendaMock);

      expect(resultado).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/webhook/pagamento',
        {
          codigoPagamento: 'PAG-123456',
          status: 'aprovado',
          veiculoId: '1',
          cpfComprador: '12345678901',
          valorPago: 85000,
          metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
          dataTransacao: vendaMock.dataAprovacao?.toISOString()
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Servico-Vendas-Webhook/1.0'
          }
        }
      );
    });

    it('deve retornar false em caso de erro de resposta', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal Server Error' }
        }
      });

      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await webhookService.notificarVendaAprovada(vendaMock);

      expect(resultado).toBe(false);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO log_webhook'),
        expect.arrayContaining([
          vendaMock.id,
          'http://localhost:3000/api/webhook/pagamento',
          expect.any(String),
          500,
          expect.any(String),
          false
        ])
      );
    });

    it('deve retornar false em caso de timeout', async () => {
      mockAxios.post.mockRejectedValue({
        request: {},
        message: 'timeout'
      });

      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await webhookService.notificarVendaAprovada(vendaMock);

      expect(resultado).toBe(false);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO log_webhook'),
        expect.arrayContaining([
          vendaMock.id,
          'http://localhost:3000/api/webhook/pagamento',
          expect.any(String),
          0,
          'Timeout ou erro de rede',
          false
        ])
      );
    });

    it('deve retornar false para status code não 2xx', async () => {
      mockAxios.post.mockResolvedValue({
        status: 400,
        data: { error: 'Bad Request' }
      });

      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await webhookService.notificarVendaAprovada(vendaMock);

      expect(resultado).toBe(false);
    });

    it('deve usar data atual quando dataAprovacao for undefined', async () => {
      const vendaSemDataAprovacao = { ...vendaMock, dataAprovacao: undefined };
      
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true }
      });

      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await webhookService.notificarVendaAprovada(vendaSemDataAprovacao);

      expect(resultado).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dataTransacao: expect.any(String)
        }),
        expect.any(Object)
      );
    });
  });

  describe('processarWebhooksPendentes', () => {
    it('deve processar webhooks pendentes sem erro', async () => {
      // Mock para vendas pendentes
      mockPool.execute
        .mockResolvedValueOnce([[], undefined] as any) // Debug query
        .mockResolvedValueOnce([[], undefined] as any) // Aprovação automática
        .mockResolvedValueOnce([[], undefined] as any); // Webhooks aprovados

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await webhookService.processarWebhooksPendentes();

      expect(consoleSpy).toHaveBeenCalledWith('Iniciando processamento de webhooks pendentes...');
      expect(consoleSpy).toHaveBeenCalledWith('Processamento de webhooks pendentes concluído');

      consoleSpy.mockRestore();
    });

    it('deve tratar erro durante processamento', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await webhookService.processarWebhooksPendentes();

      // O WebhookService trata erros internamente, então pode chamar diferentes métodos de erro
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls.some(call => 
        call[0].includes('Erro ao aprovar vendas pendentes') || 
        call[0].includes('Erro ao processar webhooks aprovados')
      )).toBe(true);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('deve aprovar vendas pendentes e processar webhooks', async () => {
      // Mock para debug query (vendas pendentes)
      mockPool.execute
        .mockResolvedValueOnce([
          [{ id: 'venda-1', status: 'pendente', data_criacao: new Date(), segundos_passados: 10 }],
          undefined
        ] as any)
        // Mock para buscar vendas para aprovação
        .mockResolvedValueOnce([
          [{ 
            id: 'venda-1', 
            veiculo_id: '1', 
            cpf_comprador: '12345678901',
            valor_pago: 85000,
            metodo_pagamento: 'cartao_credito',
            codigo_pagamento: 'PAG-123'
          }],
          undefined
        ] as any)
        // Mock para update de aprovação
        .mockResolvedValueOnce([[], undefined] as any)
        // Mock para buscar vendas aprovadas para webhook
        .mockResolvedValueOnce([
          [{
            id: 'venda-1',
            veiculo_id: '1',
            cpf_comprador: '12345678901',
            valor_pago: '85000',
            metodo_pagamento: 'cartao_credito',
            status: 'aprovado',
            codigo_pagamento: 'PAG-123',
            data_criacao: new Date().toISOString(),
            data_atualizacao: new Date().toISOString(),
            data_aprovacao: new Date().toISOString(),
            webhook_notificado: 0,
            tentativas_webhook: 0
          }],
          undefined
        ] as any)
        // Mock para incrementar tentativas
        .mockResolvedValueOnce([[], undefined] as any)
        // Mock para log do webhook
        .mockResolvedValueOnce([[], undefined] as any)
        // Mock para marcar como notificado
        .mockResolvedValueOnce([[], undefined] as any);

      // Mock do axios para simular sucesso do webhook
      mockAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await webhookService.processarWebhooksPendentes();

      expect(mockPool.execute).toHaveBeenCalledTimes(7);
      expect(mockAxios.post).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
