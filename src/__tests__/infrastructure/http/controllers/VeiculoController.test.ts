import { Request, Response } from 'express';
import { VeiculoController } from '../../../../infrastructure/http/controllers/VeiculoController';
import { ExternalVeiculoService } from '../../../../infrastructure/services/ExternalVeiculoService';
import { AuthenticatedRequest } from '../../../../infrastructure/http/middlewares/authMiddleware';

// Mock do ExternalVeiculoService
jest.mock('../../../../infrastructure/services/ExternalVeiculoService');
const MockedExternalVeiculoService = ExternalVeiculoService as jest.MockedClass<typeof ExternalVeiculoService>;

describe('VeiculoController', () => {
  let veiculoController: VeiculoController;
  let mockRequest: Partial<Request | AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockVeiculoService: jest.Mocked<ExternalVeiculoService>;

  beforeEach(() => {
    // Reset do mock
    MockedExternalVeiculoService.mockClear();
    
    // Criar uma instância mockada do serviço
    mockVeiculoService = {
      listarVeiculosAVenda: jest.fn(),
      listarVeiculosVendidos: jest.fn(),
      listarVeiculos: jest.fn()
    } as any;

    // Configurar o mock para retornar nossa instância mockada
    MockedExternalVeiculoService.mockImplementation(() => mockVeiculoService);

    veiculoController = new VeiculoController();

    mockRequest = {
      query: {},
      headers: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listarVeiculosAVenda', () => {
    it('deve listar veículos à venda com sucesso sem filtros', async () => {
      const mockVeiculos = [
        {
          id: '1',
          marca: 'Toyota',
          modelo: 'Corolla',
          ano: 2020,
          preco: 50000,
          status: 'A_VENDA' as const,
          criadoEm: '2023-01-01',
          atualizadoEm: '2023-01-01'
        }
      ];

      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: true,
        data: mockVeiculos,
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosAVenda).toHaveBeenCalledWith({});
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockVeiculos,
        message: 'Veículos à venda listados com sucesso'
      });
    });

    it('deve listar veículos à venda com filtros aplicados', async () => {
      mockRequest.query = {
        marca: 'Toyota',
        modelo: 'Corolla',
        anoMin: '2020',
        anoMax: '2023',
        precoMin: '30000',
        precoMax: '80000'
      };

      const mockVeiculos = [
        {
          id: '1',
          marca: 'Toyota',
          modelo: 'Corolla',
          ano: 2021,
          preco: 55000,
          status: 'A_VENDA' as const,
          criadoEm: '2023-01-01',
          atualizadoEm: '2023-01-01'
        }
      ];

      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: true,
        data: mockVeiculos,
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosAVenda).toHaveBeenCalledWith({
        marca: 'Toyota',
        modelo: 'Corolla',
        anoMin: 2020,
        anoMax: 2023,
        precoMin: 30000,
        precoMax: 80000
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockVeiculos,
        message: 'Veículos à venda listados com sucesso'
      });
    });

    it('deve retornar erro 400 quando serviço falha', async () => {
      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: false,
        data: [],
        message: 'Erro no serviço'
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro no serviço'
      });
    });

    it('deve retornar erro 400 quando serviço falha sem mensagem', async () => {
      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: false,
        data: []
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro ao listar veículos à venda'
      });
    });

    it('deve retornar erro 500 para exceções inesperadas', async () => {
      mockVeiculoService.listarVeiculosAVenda.mockRejectedValue(new Error('Erro inesperado'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro interno do servidor'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Erro no controller ao listar veículos à venda:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('deve processar filtros com valores vazios', async () => {
      mockRequest.query = {
        marca: '',
        modelo: undefined,
        anoMin: '',
        anoMax: '',
        precoMin: '',
        precoMax: ''
      };

      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: true,
        data: [],
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosAVenda).toHaveBeenCalledWith({});
    });

    it('deve processar filtros com valores inválidos para números', async () => {
      mockRequest.query = {
        anoMin: 'abc',
        anoMax: 'def',
        precoMin: 'ghi',
        precoMax: 'jkl'
      };

      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: true,
        data: [],
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosAVenda).toHaveBeenCalledWith({
        anoMin: NaN,
        anoMax: NaN,
        precoMin: NaN,
        precoMax: NaN
      });
    });

    it('deve processar parâmetro de ordem ASC corretamente', async () => {
      mockRequest.query = {
        marca: 'Toyota',
        ordem: 'ASC'
      };

      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: true,
        data: [],
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosAVenda).toHaveBeenCalledWith({
        marca: 'Toyota',
        ordem: 'ASC'
      });
    });

    it('deve processar parâmetro de ordem DESC corretamente', async () => {
      mockRequest.query = {
        marca: 'Honda',
        ordem: 'DESC'
      };

      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: true,
        data: [],
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosAVenda).toHaveBeenCalledWith({
        marca: 'Honda',
        ordem: 'DESC'
      });
    });

    it('deve ignorar parâmetro de ordem inválido', async () => {
      mockRequest.query = {
        marca: 'Ford',
        ordem: 'INVALID'
      };

      mockVeiculoService.listarVeiculosAVenda.mockResolvedValue({
        success: true,
        data: [],
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosAVenda(mockRequest as Request, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosAVenda).toHaveBeenCalledWith({
        marca: 'Ford'
        // Nota: ordem inválida é ignorada, então não deve aparecer nos parâmetros
      });
    });
  });

  describe('listarVeiculosVendidos', () => {
    beforeEach(() => {
      mockRequest = {
        query: {},
        headers: {
          authorization: 'Bearer valid_token_123'
        }
      } as AuthenticatedRequest;
    });

    it('deve listar veículos vendidos com sucesso sem filtros', async () => {
      const mockVeiculos = [
        {
          id: '1',
          marca: 'Honda',
          modelo: 'Civic',
          ano: 2019,
          preco: 45000,
          status: 'VENDIDO' as const,
          criadoEm: '2023-01-01',
          atualizadoEm: '2023-01-01'
        }
      ];

      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: true,
        data: mockVeiculos,
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosVendidos).toHaveBeenCalledWith({}, 'valid_token_123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockVeiculos,
        message: 'Veículos vendidos listados com sucesso'
      });
    });

    it('deve listar veículos vendidos com filtros aplicados', async () => {
      mockRequest.query = {
        marca: 'Honda',
        modelo: 'Civic',
        anoMin: '2018',
        anoMax: '2021',
        precoMin: '40000',
        precoMax: '60000'
      };

      const mockVeiculos = [
        {
          id: '1',
          marca: 'Honda',
          modelo: 'Civic',
          ano: 2019,
          preco: 45000,
          status: 'VENDIDO' as const,
          criadoEm: '2023-01-01',
          atualizadoEm: '2023-01-01'
        }
      ];

      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: true,
        data: mockVeiculos,
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosVendidos).toHaveBeenCalledWith({
        marca: 'Honda',
        modelo: 'Civic',
        anoMin: 2018,
        anoMax: 2021,
        precoMin: 40000,
        precoMax: 60000
      }, 'valid_token_123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar erro 400 quando serviço falha', async () => {
      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: false,
        data: [],
        message: 'Erro no serviço'
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro no serviço'
      });
    });

    it('deve extrair código de status da mensagem de erro', async () => {
      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: false,
        data: [],
        message: 'Erro 403: Acesso negado'
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro 403: Acesso negado'
      });
    });

    it('deve usar código 400 quando não conseguir extrair código da mensagem', async () => {
      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: false,
        data: [],
        message: 'Erro genérico sem código'
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('deve usar mensagem padrão quando não há mensagem de erro', async () => {
      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: false,
        data: []
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro ao listar veículos vendidos'
      });
    });

    it('deve retornar erro 500 para exceções inesperadas', async () => {
      mockVeiculoService.listarVeiculosVendidos.mockRejectedValue(new Error('Erro inesperado'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro interno do servidor'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Erro no controller ao listar veículos vendidos:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('deve trabalhar sem token de autorização', async () => {
      mockRequest.headers = {};

      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: true,
        data: [],
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosVendidos).toHaveBeenCalledWith({}, undefined);
    });

    it('deve trabalhar com header de autorização vazio', async () => {
      mockRequest.headers = {
        authorization: ''
      };

      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: true,
        data: [],
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosVendidos).toHaveBeenCalledWith({}, '');
    });

    it('deve trabalhar com header de autorização sem Bearer', async () => {
      mockRequest.headers = {
        authorization: 'token_without_bearer'
      };

      mockVeiculoService.listarVeiculosVendidos.mockResolvedValue({
        success: true,
        data: [],
        message: 'Sucesso'
      });

      await veiculoController.listarVeiculosVendidos(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockVeiculoService.listarVeiculosVendidos).toHaveBeenCalledWith({}, 'token_without_bearer');
    });
  });
});
