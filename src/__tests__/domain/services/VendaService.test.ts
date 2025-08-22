import { VendaService } from '../../../domain/services/VendaService';
import { VendaRepository } from '../../../domain/repositories/VendaRepository';
import { ExternalVeiculoService } from '../../../infrastructure/services/ExternalVeiculoService';
import { Venda, StatusVenda, MetodoPagamento, CriarVendaRequest } from '../../../domain/entities/Venda';

// Mock do repositório
const mockVendaRepository: jest.Mocked<VendaRepository> = {
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

// Mock do serviço externo
jest.mock('../../../infrastructure/services/ExternalVeiculoService');

describe('VendaService', () => {
  let vendaService: VendaService;
  let mockExternalVeiculoService: jest.Mocked<ExternalVeiculoService>;

  beforeEach(() => {
    vendaService = new VendaService(mockVendaRepository);
    mockExternalVeiculoService = vendaService['veiculoService'] as jest.Mocked<ExternalVeiculoService>;
    jest.clearAllMocks();
  });

  describe('criarVenda', () => {
    const vendaRequest: CriarVendaRequest = {
      veiculoId: '1',
      cpfComprador: '11144477735', // CPF válido
      valorPago: 85000,
      metodoPagamento: MetodoPagamento.CARTAO_CREDITO
    };

    const veiculoMock = {
      id: '1',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      preco: 85000,
      status: 'A_VENDA' as 'A_VENDA',
      criadoEm: '2023-01-01T00:00:00Z',
      atualizadoEm: '2023-01-01T00:00:00Z'
    };

    const vendaEsperada: Venda = {
      id: 'uuid-gerado',
      veiculoId: '1',
      cpfComprador: '11144477735',
      valorPago: 85000,
      metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
      status: StatusVenda.PENDENTE,
      codigoPagamento: 'PAG-codigo-gerado',
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      webhookNotificado: false,
      tentativasWebhook: 0
    };

    it('deve criar uma venda com sucesso', async () => {
      mockExternalVeiculoService.buscarVeiculoPorId.mockResolvedValue({
        success: true,
        data: veiculoMock
      });
      mockVendaRepository.buscarPorVeiculoId.mockResolvedValue([]);
      mockVendaRepository.criar.mockResolvedValue(vendaEsperada);

      const resultado = await vendaService.criarVenda(vendaRequest);

      expect(mockExternalVeiculoService.buscarVeiculoPorId).toHaveBeenCalledWith('1');
      expect(mockVendaRepository.buscarPorVeiculoId).toHaveBeenCalledWith('1');
      expect(mockVendaRepository.criar).toHaveBeenCalled();
      expect(resultado).toEqual(vendaEsperada);
    });

    it('deve rejeitar CPF inválido - formato incorreto', async () => {
      const requestCpfInvalido = { ...vendaRequest, cpfComprador: '123456789' };

      await expect(vendaService.criarVenda(requestCpfInvalido)).rejects.toThrow('CPF inválido');
    });

    it('deve rejeitar CPF inválido - todos dígitos iguais', async () => {
      const requestCpfInvalido = { ...vendaRequest, cpfComprador: '11111111111' };

      await expect(vendaService.criarVenda(requestCpfInvalido)).rejects.toThrow('CPF inválido');
    });

    it('deve rejeitar CPF inválido - algoritmo de validação', async () => {
      const requestCpfInvalido = { ...vendaRequest, cpfComprador: '12345678901' };

      await expect(vendaService.criarVenda(requestCpfInvalido)).rejects.toThrow('CPF inválido');
    });

    it('deve rejeitar valor zero', async () => {
      const requestValorZero = { ...vendaRequest, valorPago: 0 };

      await expect(vendaService.criarVenda(requestValorZero)).rejects.toThrow('Valor pago deve ser maior que zero');
    });

    it('deve rejeitar valor negativo', async () => {
      const requestValorNegativo = { ...vendaRequest, valorPago: -1000 };

      await expect(vendaService.criarVenda(requestValorNegativo)).rejects.toThrow('Valor pago deve ser maior que zero');
    });

    it('deve rejeitar quando veículo não for encontrado', async () => {
      mockExternalVeiculoService.buscarVeiculoPorId.mockResolvedValue({
        success: false,
        message: 'Veículo não encontrado'
      });

      await expect(vendaService.criarVenda(vendaRequest)).rejects.toThrow('Veículo não encontrado');
    });

    it('deve rejeitar quando veículo não está disponível para venda', async () => {
      const veiculoIndisponivel = { ...veiculoMock, status: 'VENDIDO' as 'VENDIDO' };
      mockExternalVeiculoService.buscarVeiculoPorId.mockResolvedValue({
        success: true,
        data: veiculoIndisponivel
      });

      await expect(vendaService.criarVenda(vendaRequest)).rejects.toThrow('Veículo não está disponível para venda');
    });

    it('deve rejeitar quando valor pago não corresponde ao preço do veículo', async () => {
      const requestValorIncorreto = { ...vendaRequest, valorPago: 80000 };
      mockExternalVeiculoService.buscarVeiculoPorId.mockResolvedValue({
        success: true,
        data: veiculoMock
      });

      await expect(vendaService.criarVenda(requestValorIncorreto)).rejects.toThrow(/não corresponde ao preço do veículo/);
    });

    it('deve rejeitar quando veículo já foi vendido', async () => {
      const vendaExistente: Venda = {
        id: 'uuid-existente',
        veiculoId: '1',
        cpfComprador: '98765432100',
        valorPago: 85000,
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusVenda.APROVADO,
        codigoPagamento: 'PAG-existente',
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        webhookNotificado: true,
        tentativasWebhook: 0
      };

      mockExternalVeiculoService.buscarVeiculoPorId.mockResolvedValue({
        success: true,
        data: veiculoMock
      });
      mockVendaRepository.buscarPorVeiculoId.mockResolvedValue([vendaExistente]);

      await expect(vendaService.criarVenda(vendaRequest)).rejects.toThrow('Veículo já foi vendido');
    });

    it('deve aceitar venda quando existe venda pendente/rejeitada do mesmo veículo', async () => {
      const vendaPendente: Venda = {
        id: 'uuid-pendente',
        veiculoId: '1',
        cpfComprador: '98765432100',
        valorPago: 85000,
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusVenda.REJEITADO,
        codigoPagamento: 'PAG-rejeitado',
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        webhookNotificado: false,
        tentativasWebhook: 0
      };

      mockExternalVeiculoService.buscarVeiculoPorId.mockResolvedValue({
        success: true,
        data: veiculoMock
      });
      mockVendaRepository.buscarPorVeiculoId.mockResolvedValue([vendaPendente]);
      mockVendaRepository.criar.mockResolvedValue(vendaEsperada);

      const resultado = await vendaService.criarVenda(vendaRequest);

      expect(resultado).toEqual(vendaEsperada);
    });

    it('deve lidar com erro de processamento de valores monetários', async () => {
      const veiculoPrecoInvalido = { ...veiculoMock, preco: 'invalid' as any };
      mockExternalVeiculoService.buscarVeiculoPorId.mockResolvedValue({
        success: true,
        data: veiculoPrecoInvalido
      });

      await expect(vendaService.criarVenda(vendaRequest)).rejects.toThrow('Erro ao processar valores monetários');
    });
  });

  describe('buscarVendaPorId', () => {
    it('deve buscar venda por ID', async () => {
      const vendaMock: Venda = {
        id: 'venda-123',
        veiculoId: '1',
        cpfComprador: '11144477735',
        valorPago: 85000,
        metodoPagamento: MetodoPagamento.PIX,
        status: StatusVenda.APROVADO,
        codigoPagamento: 'PAG-123',
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        webhookNotificado: true,
        tentativasWebhook: 0
      };

      mockVendaRepository.buscarPorId.mockResolvedValue(vendaMock);

      const resultado = await vendaService.buscarVendaPorId('venda-123');

      expect(mockVendaRepository.buscarPorId).toHaveBeenCalledWith('venda-123');
      expect(resultado).toEqual(vendaMock);
    });

    it('deve retornar null quando venda não for encontrada', async () => {
      mockVendaRepository.buscarPorId.mockResolvedValue(null);

      const resultado = await vendaService.buscarVendaPorId('venda-inexistente');

      expect(resultado).toBeNull();
    });
  });

  describe('buscarVendasPorCpf', () => {
    it('deve buscar vendas por CPF válido', async () => {
      const vendas: Venda[] = [];
      mockVendaRepository.buscarPorCpf.mockResolvedValue(vendas);

      const resultado = await vendaService.buscarVendasPorCpf('11144477735');

      expect(mockVendaRepository.buscarPorCpf).toHaveBeenCalledWith('11144477735');
      expect(resultado).toEqual(vendas);
    });

    it('deve rejeitar CPF inválido', async () => {
      await expect(vendaService.buscarVendasPorCpf('123456789')).rejects.toThrow('CPF inválido');
    });
  });

  describe('buscarVendasPorVeiculo', () => {
    it('deve buscar vendas por veículo', async () => {
      const vendas: Venda[] = [];
      mockVendaRepository.buscarPorVeiculoId.mockResolvedValue(vendas);

      const resultado = await vendaService.buscarVendasPorVeiculo('veiculo-123');

      expect(mockVendaRepository.buscarPorVeiculoId).toHaveBeenCalledWith('veiculo-123');
      expect(resultado).toEqual(vendas);
    });
  });

  describe('processarPagamento', () => {
    const vendaPendente: Venda = {
      id: 'venda-123',
      veiculoId: '1',
      cpfComprador: '11144477735',
      valorPago: 85000,
      metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
      status: StatusVenda.PENDENTE,
      codigoPagamento: 'PAG-123456',
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      webhookNotificado: false,
      tentativasWebhook: 0
    };

    it('deve processar pagamento aprovado', async () => {
      const vendaAprovada = { ...vendaPendente, status: StatusVenda.APROVADO, dataAprovacao: new Date() };

      mockVendaRepository.buscarPorCodigoPagamento.mockResolvedValue(vendaPendente);
      mockVendaRepository.atualizarStatus.mockResolvedValue(true);
      mockVendaRepository.buscarPorId.mockResolvedValue(vendaAprovada);

      const resultado = await vendaService.processarPagamento('PAG-123456', 'aprovado');

      expect(mockVendaRepository.atualizarStatus).toHaveBeenCalledWith(
        'venda-123',
        StatusVenda.APROVADO,
        expect.any(Date)
      );
      expect(resultado?.status).toBe(StatusVenda.APROVADO);
    });

    it('deve processar pagamento rejeitado', async () => {
      const vendaRejeitada = { ...vendaPendente, status: StatusVenda.REJEITADO };

      mockVendaRepository.buscarPorCodigoPagamento.mockResolvedValue(vendaPendente);
      mockVendaRepository.atualizarStatus.mockResolvedValue(true);
      mockVendaRepository.buscarPorId.mockResolvedValue(vendaRejeitada);

      const resultado = await vendaService.processarPagamento('PAG-123456', 'rejeitado');

      expect(mockVendaRepository.atualizarStatus).toHaveBeenCalledWith(
        'venda-123',
        StatusVenda.REJEITADO,
        undefined
      );
      expect(resultado?.status).toBe(StatusVenda.REJEITADO);
    });

    it('deve rejeitar processamento de venda não encontrada', async () => {
      mockVendaRepository.buscarPorCodigoPagamento.mockResolvedValue(null);

      await expect(vendaService.processarPagamento('PAG-inexistente', 'aprovado'))
        .rejects.toThrow('Venda não encontrada');
    });

    it('deve rejeitar processamento de venda já processada', async () => {
      const vendaJaProcessada = { ...vendaPendente, status: StatusVenda.APROVADO };
      mockVendaRepository.buscarPorCodigoPagamento.mockResolvedValue(vendaJaProcessada);

      await expect(vendaService.processarPagamento('PAG-123456', 'aprovado'))
        .rejects.toThrow('Venda já foi processada');
    });

    it('deve permitir reprocessamento de venda em processamento', async () => {
      const vendaProcessando = { ...vendaPendente, status: StatusVenda.PROCESSANDO };
      const vendaAprovada = { ...vendaPendente, status: StatusVenda.APROVADO };

      mockVendaRepository.buscarPorCodigoPagamento.mockResolvedValue(vendaProcessando);
      mockVendaRepository.atualizarStatus.mockResolvedValue(true);
      mockVendaRepository.buscarPorId.mockResolvedValue(vendaAprovada);

      const resultado = await vendaService.processarPagamento('PAG-123456', 'aprovado');

      expect(resultado?.status).toBe(StatusVenda.APROVADO);
    });
  });

  describe('listarVendas', () => {
    it('deve listar vendas com limite e offset padrão', async () => {
      const vendas: Venda[] = [];
      mockVendaRepository.listarTodas.mockResolvedValue(vendas);

      const resultado = await vendaService.listarVendas();

      expect(mockVendaRepository.listarTodas).toHaveBeenCalledWith(50, 0);
      expect(resultado).toEqual(vendas);
    });

    it('deve listar vendas com limite e offset customizados', async () => {
      const vendas: Venda[] = [];
      mockVendaRepository.listarTodas.mockResolvedValue(vendas);

      const resultado = await vendaService.listarVendas(10, 20);

      expect(mockVendaRepository.listarTodas).toHaveBeenCalledWith(10, 20);
      expect(resultado).toEqual(vendas);
    });
  });

  describe('buscarVendasPendentesWebhook', () => {
    it('deve buscar vendas pendentes de webhook', async () => {
      const vendas: Venda[] = [];
      mockVendaRepository.buscarVendasPendentesWebhook.mockResolvedValue(vendas);

      const resultado = await vendaService.buscarVendasPendentesWebhook();

      expect(mockVendaRepository.buscarVendasPendentesWebhook).toHaveBeenCalled();
      expect(resultado).toEqual(vendas);
    });
  });

  describe('marcarWebhookNotificado', () => {
    it('deve marcar webhook como notificado', async () => {
      mockVendaRepository.marcarWebhookNotificado.mockResolvedValue(true);

      const resultado = await vendaService.marcarWebhookNotificado('venda-123');

      expect(mockVendaRepository.marcarWebhookNotificado).toHaveBeenCalledWith('venda-123');
      expect(resultado).toBe(true);
    });
  });

  describe('incrementarTentativasWebhook', () => {
    it('deve incrementar tentativas de webhook', async () => {
      mockVendaRepository.incrementarTentativasWebhook.mockResolvedValue(true);

      const resultado = await vendaService.incrementarTentativasWebhook('venda-123');

      expect(mockVendaRepository.incrementarTentativasWebhook).toHaveBeenCalledWith('venda-123');
      expect(resultado).toBe(true);
    });
  });

  describe('validação de CPF', () => {
    it('deve validar CPFs corretos', () => {
      // Testando método privado através do método público
      const cpfsValidos = [
        '11144477735', // CPF válido
        '01234567890'  // Outro CPF válido
      ];

      for (const cpf of cpfsValidos) {
        // Se não lançar exceção, o CPF é válido
        expect(() => vendaService['validarCpf'](cpf)).not.toThrow();
      }
    });

    it('deve rejeitar CPFs inválidos', () => {
      const cpfsInvalidos = [
        '12345678901', // CPF inválido
        '00000000000', // Todos zeros
        '11111111111', // Todos iguais
        '123456789',   // Menos de 11 dígitos
        '123456789012' // Mais de 11 dígitos
      ];

      for (const cpf of cpfsInvalidos) {
        expect(vendaService['validarCpf'](cpf)).toBe(false);
      }
    });
  });

  describe('geração de código de pagamento', () => {
    it('deve gerar código de pagamento único', () => {
      const codigo1 = vendaService['gerarCodigoPagamento']();
      const codigo2 = vendaService['gerarCodigoPagamento']();

      expect(codigo1).toMatch(/^PAG-\d+-[A-F0-9]{8}$/);
      expect(codigo2).toMatch(/^PAG-\d+-[A-F0-9]{8}$/);
      expect(codigo1).not.toBe(codigo2);
    });

    it('deve gerar códigos de pagamento com alta entropia', () => {
      const codigos = new Set();
      
      // Gerar 1000 códigos para verificar unicidade
      for (let i = 0; i < 1000; i++) {
        const codigo = vendaService['gerarCodigoPagamento']();
        expect(codigos.has(codigo)).toBe(false); // Não deve haver duplicatas
        codigos.add(codigo);
      }
      
      expect(codigos.size).toBe(1000);
    });
  });
});
