import { VendaRepository } from '../../../domain/repositories/VendaRepository';
import { Venda, MetodoPagamento, StatusVenda } from '../../../domain/entities/Venda';

describe('VendaRepository Interface', () => {
  let mockRepository: VendaRepository;

  beforeEach(() => {
    // Mock implementation do VendaRepository
    mockRepository = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorCodigoPagamento: jest.fn(),
      buscarPorVeiculoId: jest.fn(),
      buscarPorCpf: jest.fn(),
      atualizar: jest.fn(),
      atualizarStatus: jest.fn(),
      buscarVendasPendentesWebhook: jest.fn(),
      incrementarTentativasWebhook: jest.fn(),
      marcarWebhookNotificado: jest.fn(),
      listarTodas: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('criar', () => {
    it('deve ter método para criar venda', () => {
      expect(mockRepository.criar).toBeDefined();
      expect(typeof mockRepository.criar).toBe('function');
    });

    it('deve aceitar dados de venda sem id, dataCriacao e dataAtualizacao', async () => {
      const dadosVenda = {
        veiculoId: 'veiculo-123',
        cpfComprador: '12345678901',
        valorPago: 50000,
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusVenda.PENDENTE,
        webhookNotificado: false,
        tentativasWebhook: 0
      };

      const vendaCriada: Venda = {
        id: 'venda-123',
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        ...dadosVenda
      };

      (mockRepository.criar as jest.Mock).mockResolvedValue(vendaCriada);

      const resultado = await mockRepository.criar(dadosVenda);

      expect(mockRepository.criar).toHaveBeenCalledWith(dadosVenda);
      expect(resultado).toEqual(vendaCriada);
    });
  });

  describe('buscarPorId', () => {
    it('deve ter método para buscar venda por ID', () => {
      expect(mockRepository.buscarPorId).toBeDefined();
      expect(typeof mockRepository.buscarPorId).toBe('function');
    });

    it('deve retornar venda quando encontrada', async () => {
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

      (mockRepository.buscarPorId as jest.Mock).mockResolvedValue(venda);

      const resultado = await mockRepository.buscarPorId('venda-123');

      expect(mockRepository.buscarPorId).toHaveBeenCalledWith('venda-123');
      expect(resultado).toEqual(venda);
    });

    it('deve retornar null quando venda não encontrada', async () => {
      (mockRepository.buscarPorId as jest.Mock).mockResolvedValue(null);

      const resultado = await mockRepository.buscarPorId('venda-inexistente');

      expect(resultado).toBeNull();
    });
  });

  describe('buscarPorCodigoPagamento', () => {
    it('deve ter método para buscar venda por código de pagamento', () => {
      expect(mockRepository.buscarPorCodigoPagamento).toBeDefined();
      expect(typeof mockRepository.buscarPorCodigoPagamento).toBe('function');
    });

    it('deve retornar venda quando código encontrado', async () => {
      const venda: Venda = {
        id: 'venda-123',
        veiculoId: 'veiculo-456',
        cpfComprador: '12345678901',
        valorPago: 50000,
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusVenda.APROVADO,
        codigoPagamento: 'PAG-789',
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        webhookNotificado: false,
        tentativasWebhook: 0
      };

      (mockRepository.buscarPorCodigoPagamento as jest.Mock).mockResolvedValue(venda);

      const resultado = await mockRepository.buscarPorCodigoPagamento('PAG-789');

      expect(mockRepository.buscarPorCodigoPagamento).toHaveBeenCalledWith('PAG-789');
      expect(resultado).toEqual(venda);
    });
  });

  describe('buscarPorVeiculoId', () => {
    it('deve ter método para buscar vendas por ID do veículo', () => {
      expect(mockRepository.buscarPorVeiculoId).toBeDefined();
      expect(typeof mockRepository.buscarPorVeiculoId).toBe('function');
    });

    it('deve retornar array de vendas do veículo', async () => {
      const vendas: Venda[] = [
        {
          id: 'venda-123',
          veiculoId: 'veiculo-456',
          cpfComprador: '12345678901',
          valorPago: 50000,
          metodoPagamento: MetodoPagamento.PIX,
          status: StatusVenda.APROVADO,
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          webhookNotificado: true,
          tentativasWebhook: 1
        }
      ];

      (mockRepository.buscarPorVeiculoId as jest.Mock).mockResolvedValue(vendas);

      const resultado = await mockRepository.buscarPorVeiculoId('veiculo-456');

      expect(mockRepository.buscarPorVeiculoId).toHaveBeenCalledWith('veiculo-456');
      expect(resultado).toEqual(vendas);
    });
  });

  describe('buscarPorCpf', () => {
    it('deve ter método para buscar vendas por CPF', () => {
      expect(mockRepository.buscarPorCpf).toBeDefined();
      expect(typeof mockRepository.buscarPorCpf).toBe('function');
    });

    it('deve retornar array de vendas do CPF', async () => {
      const vendas: Venda[] = [
        {
          id: 'venda-123',
          veiculoId: 'veiculo-456',
          cpfComprador: '12345678901',
          valorPago: 50000,
          metodoPagamento: MetodoPagamento.PIX,
          status: StatusVenda.APROVADO,
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          webhookNotificado: true,
          tentativasWebhook: 1
        },
        {
          id: 'venda-124',
          veiculoId: 'veiculo-789',
          cpfComprador: '12345678901',
          valorPago: 30000,
          metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
          status: StatusVenda.PENDENTE,
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          webhookNotificado: false,
          tentativasWebhook: 0
        }
      ];

      (mockRepository.buscarPorCpf as jest.Mock).mockResolvedValue(vendas);

      const resultado = await mockRepository.buscarPorCpf('12345678901');

      expect(mockRepository.buscarPorCpf).toHaveBeenCalledWith('12345678901');
      expect(resultado).toEqual(vendas);
      expect(resultado).toHaveLength(2);
    });
  });

  describe('atualizar', () => {
    it('deve ter método para atualizar venda', () => {
      expect(mockRepository.atualizar).toBeDefined();
      expect(typeof mockRepository.atualizar).toBe('function');
    });

    it('deve retornar venda atualizada', async () => {
      const vendaAtualizada: Venda = {
        id: 'venda-123',
        veiculoId: 'veiculo-456',
        cpfComprador: '12345678901',
        valorPago: 50000,
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusVenda.APROVADO,
        codigoPagamento: 'PAG-789',
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        dataAprovacao: new Date(),
        webhookNotificado: false,
        tentativasWebhook: 0
      };

      (mockRepository.atualizar as jest.Mock).mockResolvedValue(vendaAtualizada);

      const dadosAtualizacao = { status: StatusVenda.APROVADO, codigoPagamento: 'PAG-789' };
      const resultado = await mockRepository.atualizar('venda-123', dadosAtualizacao);

      expect(mockRepository.atualizar).toHaveBeenCalledWith('venda-123', dadosAtualizacao);
      expect(resultado).toEqual(vendaAtualizada);
    });
  });

  describe('atualizarStatus', () => {
    it('deve ter método para atualizar status da venda', () => {
      expect(mockRepository.atualizarStatus).toBeDefined();
      expect(typeof mockRepository.atualizarStatus).toBe('function');
    });

    it('deve retornar true quando status atualizado com sucesso', async () => {
      (mockRepository.atualizarStatus as jest.Mock).mockResolvedValue(true);

      const dataAprovacao = new Date();
      const resultado = await mockRepository.atualizarStatus('venda-123', StatusVenda.APROVADO, dataAprovacao);

      expect(mockRepository.atualizarStatus).toHaveBeenCalledWith('venda-123', StatusVenda.APROVADO, dataAprovacao);
      expect(resultado).toBe(true);
    });
  });

  describe('buscarVendasPendentesWebhook', () => {
    it('deve ter método para buscar vendas pendentes de webhook', () => {
      expect(mockRepository.buscarVendasPendentesWebhook).toBeDefined();
      expect(typeof mockRepository.buscarVendasPendentesWebhook).toBe('function');
    });

    it('deve retornar array de vendas pendentes', async () => {
      const vendasPendentes: Venda[] = [
        {
          id: 'venda-123',
          veiculoId: 'veiculo-456',
          cpfComprador: '12345678901',
          valorPago: 50000,
          metodoPagamento: MetodoPagamento.PIX,
          status: StatusVenda.APROVADO,
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          webhookNotificado: false,
          tentativasWebhook: 2
        }
      ];

      (mockRepository.buscarVendasPendentesWebhook as jest.Mock).mockResolvedValue(vendasPendentes);

      const resultado = await mockRepository.buscarVendasPendentesWebhook();

      expect(mockRepository.buscarVendasPendentesWebhook).toHaveBeenCalled();
      expect(resultado).toEqual(vendasPendentes);
    });
  });

  describe('incrementarTentativasWebhook', () => {
    it('deve ter método para incrementar tentativas de webhook', () => {
      expect(mockRepository.incrementarTentativasWebhook).toBeDefined();
      expect(typeof mockRepository.incrementarTentativasWebhook).toBe('function');
    });

    it('deve retornar true quando incrementado com sucesso', async () => {
      (mockRepository.incrementarTentativasWebhook as jest.Mock).mockResolvedValue(true);

      const resultado = await mockRepository.incrementarTentativasWebhook('venda-123');

      expect(mockRepository.incrementarTentativasWebhook).toHaveBeenCalledWith('venda-123');
      expect(resultado).toBe(true);
    });
  });

  describe('marcarWebhookNotificado', () => {
    it('deve ter método para marcar webhook como notificado', () => {
      expect(mockRepository.marcarWebhookNotificado).toBeDefined();
      expect(typeof mockRepository.marcarWebhookNotificado).toBe('function');
    });

    it('deve retornar true quando marcado com sucesso', async () => {
      (mockRepository.marcarWebhookNotificado as jest.Mock).mockResolvedValue(true);

      const resultado = await mockRepository.marcarWebhookNotificado('venda-123');

      expect(mockRepository.marcarWebhookNotificado).toHaveBeenCalledWith('venda-123');
      expect(resultado).toBe(true);
    });
  });

  describe('listarTodas', () => {
    it('deve ter método para listar todas as vendas', () => {
      expect(mockRepository.listarTodas).toBeDefined();
      expect(typeof mockRepository.listarTodas).toBe('function');
    });

    it('deve retornar array de vendas com paginação', async () => {
      const vendas: Venda[] = [
        {
          id: 'venda-123',
          veiculoId: 'veiculo-456',
          cpfComprador: '12345678901',
          valorPago: 50000,
          metodoPagamento: MetodoPagamento.PIX,
          status: StatusVenda.APROVADO,
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
          webhookNotificado: true,
          tentativasWebhook: 1
        }
      ];

      (mockRepository.listarTodas as jest.Mock).mockResolvedValue(vendas);

      const resultado = await mockRepository.listarTodas(10, 0);

      expect(mockRepository.listarTodas).toHaveBeenCalledWith(10, 0);
      expect(resultado).toEqual(vendas);
    });

    it('deve funcionar sem parâmetros de paginação', async () => {
      const vendas: Venda[] = [];

      (mockRepository.listarTodas as jest.Mock).mockResolvedValue(vendas);

      const resultado = await mockRepository.listarTodas();

      expect(mockRepository.listarTodas).toHaveBeenCalledWith();
      expect(resultado).toEqual(vendas);
    });
  });
});
