import { 
  Venda, 
  MetodoPagamento, 
  StatusVenda, 
  CriarVendaRequest, 
  WebhookPagamento, 
  NotificacaoWebhookExterno 
} from '../../../domain/entities/Venda';

describe('Entidades de Venda', () => {
  describe('Venda interface', () => {
    it('deve ter todas as propriedades obrigatórias', () => {
      const venda: Venda = {
        id: 'venda-123',
        veiculoId: 'veiculo-456',
        cpfComprador: '12345678901',
        valorPago: 50000,
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusVenda.PENDENTE,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        webhookNotificado: false,
        tentativasWebhook: 0
      };

      expect(venda.id).toBe('venda-123');
      expect(venda.veiculoId).toBe('veiculo-456');
      expect(venda.cpfComprador).toBe('12345678901');
      expect(venda.valorPago).toBe(50000);
      expect(venda.metodoPagamento).toBe(MetodoPagamento.PIX);
      expect(venda.status).toBe(StatusVenda.PENDENTE);
      expect(venda.webhookNotificado).toBe(false);
      expect(venda.tentativasWebhook).toBe(0);
    });

    it('deve permitir propriedades opcionais', () => {
      const venda: Venda = {
        id: 'venda-123',
        veiculoId: 'veiculo-456',
        cpfComprador: '12345678901',
        valorPago: 50000,
        metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
        status: StatusVenda.APROVADO,
        codigoPagamento: 'PAG-789',
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        dataAprovacao: new Date(),
        webhookNotificado: true,
        tentativasWebhook: 1
      };

      expect(venda.codigoPagamento).toBe('PAG-789');
      expect(venda.dataAprovacao).toBeInstanceOf(Date);
    });
  });

  describe('MetodoPagamento enum', () => {
    it('deve ter todos os métodos de pagamento disponíveis', () => {
      expect(MetodoPagamento.PIX).toBe('pix');
      expect(MetodoPagamento.CARTAO_CREDITO).toBe('cartao_credito');
      expect(MetodoPagamento.CARTAO_DEBITO).toBe('cartao_debito');
      expect(MetodoPagamento.BOLETO).toBe('boleto');
      expect(MetodoPagamento.TRANSFERENCIA).toBe('transferencia');
    });

    it('deve permitir verificação de valores válidos', () => {
      const metodosValidos = Object.values(MetodoPagamento);
      
      expect(metodosValidos).toContain('pix');
      expect(metodosValidos).toContain('cartao_credito');
      expect(metodosValidos).toContain('cartao_debito');
      expect(metodosValidos).toContain('boleto');
      expect(metodosValidos).toContain('transferencia');
      expect(metodosValidos).toHaveLength(5);
    });
  });

  describe('StatusVenda enum', () => {
    it('deve ter todos os status de venda disponíveis', () => {
      expect(StatusVenda.PENDENTE).toBe('pendente');
      expect(StatusVenda.PROCESSANDO).toBe('processando');
      expect(StatusVenda.APROVADO).toBe('aprovado');
      expect(StatusVenda.REJEITADO).toBe('rejeitado');
      expect(StatusVenda.CANCELADO).toBe('cancelado');
    });

    it('deve permitir verificação de status válidos', () => {
      const statusValidos = Object.values(StatusVenda);
      
      expect(statusValidos).toContain('pendente');
      expect(statusValidos).toContain('processando');
      expect(statusValidos).toContain('aprovado');
      expect(statusValidos).toContain('rejeitado');
      expect(statusValidos).toContain('cancelado');
      expect(statusValidos).toHaveLength(5);
    });
  });

  describe('CriarVendaRequest interface', () => {
    it('deve ter todas as propriedades obrigatórias para criar venda', () => {
      const criarVendaRequest: CriarVendaRequest = {
        veiculoId: 'veiculo-123',
        cpfComprador: '12345678901',
        valorPago: 50000,
        metodoPagamento: MetodoPagamento.PIX
      };

      expect(criarVendaRequest.veiculoId).toBe('veiculo-123');
      expect(criarVendaRequest.cpfComprador).toBe('12345678901');
      expect(criarVendaRequest.valorPago).toBe(50000);
      expect(criarVendaRequest.metodoPagamento).toBe(MetodoPagamento.PIX);
    });

    it('deve aceitar diferentes métodos de pagamento', () => {
      const requests = [
        {
          veiculoId: 'veiculo-1',
          cpfComprador: '11111111111',
          valorPago: 30000,
          metodoPagamento: MetodoPagamento.CARTAO_CREDITO
        },
        {
          veiculoId: 'veiculo-2',
          cpfComprador: '22222222222',
          valorPago: 40000,
          metodoPagamento: MetodoPagamento.BOLETO
        }
      ];

      requests.forEach(request => {
        expect(request).toHaveProperty('veiculoId');
        expect(request).toHaveProperty('cpfComprador');
        expect(request).toHaveProperty('valorPago');
        expect(request).toHaveProperty('metodoPagamento');
      });
    });
  });

  describe('WebhookPagamento interface', () => {
    it('deve ter todas as propriedades obrigatórias para webhook de pagamento', () => {
      const webhookPagamento: WebhookPagamento = {
        codigoPagamento: 'PAG-123',
        status: 'aprovado',
        veiculoId: 'veiculo-456',
        cpfComprador: '12345678901',
        valorPago: 50000,
        metodoPagamento: 'pix',
        dataTransacao: '2024-01-15T10:30:00Z'
      };

      expect(webhookPagamento.codigoPagamento).toBe('PAG-123');
      expect(webhookPagamento.status).toBe('aprovado');
      expect(webhookPagamento.veiculoId).toBe('veiculo-456');
      expect(webhookPagamento.cpfComprador).toBe('12345678901');
      expect(webhookPagamento.valorPago).toBe(50000);
      expect(webhookPagamento.metodoPagamento).toBe('pix');
      expect(webhookPagamento.dataTransacao).toBe('2024-01-15T10:30:00Z');
    });

    it('deve aceitar status aprovado e rejeitado', () => {
      const webhookAprovado: WebhookPagamento = {
        codigoPagamento: 'PAG-123',
        status: 'aprovado',
        veiculoId: 'veiculo-456',
        cpfComprador: '12345678901',
        valorPago: 50000,
        metodoPagamento: 'pix',
        dataTransacao: '2024-01-15T10:30:00Z'
      };

      const webhookRejeitado: WebhookPagamento = {
        codigoPagamento: 'PAG-124',
        status: 'rejeitado',
        veiculoId: 'veiculo-457',
        cpfComprador: '12345678902',
        valorPago: 60000,
        metodoPagamento: 'cartao_credito',
        dataTransacao: '2024-01-15T11:30:00Z'
      };

      expect(webhookAprovado.status).toBe('aprovado');
      expect(webhookRejeitado.status).toBe('rejeitado');
    });
  });

  describe('NotificacaoWebhookExterno interface', () => {
    it('deve ter todas as propriedades obrigatórias', () => {
      const notificacao: NotificacaoWebhookExterno = {
        codigoPagamento: 'PAG-EXTERNO-123',
        status: 'aprovado',
        veiculoId: 'veiculo-789',
        cpfComprador: '98765432109',
        valorPago: 45000,
        metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
        dataTransacao: '2024-01-16T14:20:00Z'
      };

      expect(notificacao.codigoPagamento).toBe('PAG-EXTERNO-123');
      expect(notificacao.status).toBe('aprovado');
      expect(notificacao.veiculoId).toBe('veiculo-789');
      expect(notificacao.cpfComprador).toBe('98765432109');
      expect(notificacao.valorPago).toBe(45000);
      expect(notificacao.metodoPagamento).toBe(MetodoPagamento.CARTAO_CREDITO);
      expect(notificacao.dataTransacao).toBe('2024-01-16T14:20:00Z');
    });

    it('deve ter status fixo como aprovado', () => {
      const notificacao: NotificacaoWebhookExterno = {
        codigoPagamento: 'PAG-EXTERNO-456',
        status: 'aprovado',
        veiculoId: 'veiculo-888',
        cpfComprador: '11122233344',
        valorPago: 35000,
        metodoPagamento: MetodoPagamento.PIX,
        dataTransacao: '2024-01-17T09:15:00Z'
      };

      expect(notificacao.status).toBe('aprovado');
    });
  });
});
