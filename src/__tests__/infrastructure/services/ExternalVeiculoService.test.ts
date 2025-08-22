import axios from 'axios';
import { ExternalVeiculoService } from '../../../infrastructure/services/ExternalVeiculoService';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Setup', () => {
  it('deve configurar o ambiente de teste', () => {
    expect(true).toBe(true);
  });
});

describe('ExternalVeiculoService', () => {
  let service: ExternalVeiculoService;

  beforeEach(() => {
    service = new ExternalVeiculoService();
    jest.clearAllMocks();
    // Mock do process.env
    process.env.SERVICO_PRINCIPAL_URL = 'http://localhost:3000';
  });

  describe('listarVeiculosAVenda', () => {
    it('deve listar veículos à venda com sucesso sem filtros', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              marca: 'Toyota',
              modelo: 'Corolla',
              ano: 2020,
              preco: 50000,
              status: 'A_VENDA',
              criadoEm: '2023-01-01',
              atualizadoEm: '2023-01-01'
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listarVeiculosAVenda();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/api/veiculos'),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('status=A_VENDA'),
        expect.anything()
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('ordem=ASC'),
        expect.anything()
      );
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.data,
        message: undefined
      });
    });

    it('deve listar veículos à venda com filtros aplicados', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              marca: 'Toyota',
              modelo: 'Corolla',
              ano: 2020,
              preco: 50000,
              status: 'A_VENDA',
              criadoEm: '2023-01-01',
              atualizadoEm: '2023-01-01'
            }
          ]
        }
      };

      const filtros = {
        marca: 'Toyota',
        modelo: 'Corolla',
        anoMin: 2019,
        anoMax: 2021,
        precoMin: 40000,
        precoMax: 60000
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listarVeiculosAVenda(filtros);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/api/veiculos'),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      const call = mockedAxios.get.mock.calls[0][0];
      expect(call).toContain('marca=Toyota');
      expect(call).toContain('modelo=Corolla');
      expect(call).toContain('anoMin=2019');
      expect(call).toContain('anoMax=2021');
      expect(call).toContain('precoMin=40000');
      expect(call).toContain('precoMax=60000');
      expect(call).toContain('status=A_VENDA');
      expect(call).toContain('ordem=ASC');
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.data,
        message: undefined
      });
    });

    it('deve retornar erro quando API retorna erro 404', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Nenhum veículo encontrado'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.listarVeiculosAVenda();

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro 404: Nenhum veículo encontrado'
      });
    });

    it('deve retornar erro quando API retorna erro 500', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: {
            message: 'Erro interno do servidor'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.listarVeiculosAVenda();

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro 500: Erro interno do servidor'
      });
    });

    it('deve retornar erro genérico para erros de rede', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      const result = await service.listarVeiculosAVenda();

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro interno do servidor'
      });
    });

    it('deve retornar erro para ECONNREFUSED', async () => {
      const networkError = new Error('ECONNREFUSED') as any;
      networkError.code = 'ECONNREFUSED';
      mockedAxios.get.mockRejectedValue(networkError);

      const result = await service.listarVeiculosAVenda();

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Serviço principal indisponível'
      });
    });

    it('deve retornar erro para ENOTFOUND', async () => {
      const networkError = new Error('ENOTFOUND') as any;
      networkError.code = 'ENOTFOUND';
      mockedAxios.get.mockRejectedValue(networkError);

      const result = await service.listarVeiculosAVenda();

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Serviço principal indisponível'
      });
    });

    it('deve usar dados direto quando response.data.data não existe', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            marca: 'Toyota',
            modelo: 'Corolla',
            ano: 2020,
            preco: 50000,
            status: 'A_VENDA',
            criadoEm: '2023-01-01',
            atualizadoEm: '2023-01-01'
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listarVeiculosAVenda();

      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: undefined
      });
    });
  });

  describe('listarVeiculosVendidos', () => {
    it('deve listar veículos vendidos com sucesso sem filtros', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              marca: 'Honda',
              modelo: 'Civic',
              ano: 2019,
              preco: 45000,
              status: 'VENDIDO',
              criadoEm: '2023-01-01',
              atualizadoEm: '2023-01-01'
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listarVeiculosVendidos(undefined, 'mock-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/api/veiculos'),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token'
          },
          timeout: 10000
        }
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('status=VENDIDO'),
        expect.anything()
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('ordem=ASC'),
        expect.anything()
      );
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.data,
        message: undefined
      });
    });

    it('deve listar veículos vendidos com filtros aplicados', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              marca: 'Honda',
              modelo: 'Civic',
              ano: 2019,
              preco: 45000,
              status: 'VENDIDO',
              criadoEm: '2023-01-01',
              atualizadoEm: '2023-01-01'
            }
          ]
        }
      };

      const filtros = {
        marca: 'Honda',
        anoMin: 2018,
        anoMax: 2020
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listarVeiculosVendidos(filtros, 'mock-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/api/veiculos'),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token'
          },
          timeout: 10000
        }
      );
      const call = mockedAxios.get.mock.calls[0][0];
      expect(call).toContain('marca=Honda');
      expect(call).toContain('anoMin=2018');
      expect(call).toContain('anoMax=2020');
      expect(call).toContain('status=VENDIDO');
      expect(call).toContain('ordem=ASC');
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.data,
        message: undefined
      });
    });

    it('deve funcionar sem token (sem header Authorization)', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listarVeiculosVendidos();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/api/veiculos'),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('status=VENDIDO'),
        expect.anything()
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('ordem=ASC'),
        expect.anything()
      );
      expect(result).toEqual({
        success: true,
        data: [],
        message: undefined
      });
    });

    it('deve retornar erro quando API retorna erro 401', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: {
            message: 'Token inválido'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.listarVeiculosVendidos(undefined, 'invalid-token');

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro 401: Token inválido'
      });
    });

    it('deve retornar erro quando API retorna erro 403', async () => {
      const errorResponse = {
        response: {
          status: 403,
          data: {
            message: 'Acesso negado'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.listarVeiculosVendidos(undefined, 'mock-token');

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro 403: Acesso negado'
      });
    });

    it('deve usar campo error quando message não está disponível', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            error: 'Dados inválidos'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.listarVeiculosVendidos(undefined, 'mock-token');

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro 400: Dados inválidos'
      });
    });

    it('deve usar mensagem padrão quando nem message nem error estão disponíveis', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {}
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.listarVeiculosVendidos(undefined, 'mock-token');

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro 400: Erro na comunicação com o serviço principal'
      });
    });
  });

  describe('configuração do serviço', () => {
    it('deve usar URL padrão quando SERVICO_PRINCIPAL_URL não está definida', () => {
      delete process.env.SERVICO_PRINCIPAL_URL;
      const newService = new ExternalVeiculoService();
      expect(newService).toBeInstanceOf(ExternalVeiculoService);
    });

    it('deve usar URL do ambiente quando SERVICO_PRINCIPAL_URL está definida', () => {
      process.env.SERVICO_PRINCIPAL_URL = 'https://api.production.com';
      const newService = new ExternalVeiculoService();
      expect(newService).toBeInstanceOf(ExternalVeiculoService);
    });
  });

  describe('buscarVeiculoPorId', () => {
    beforeEach(() => {
      // Reset service instance para cada teste
      service = new ExternalVeiculoService();
      process.env.SERVICO_PRINCIPAL_URL = 'http://localhost:3000';
    });

    it('deve buscar veículo por ID com sucesso', async () => {
      const mockVeiculo = {
        id: '1',
        marca: 'Honda',
        modelo: 'Civic',
        ano: 2021,
        preco: 75000,
        status: 'A_VENDA',
        cor: 'Azul',
        kilometragem: 15000,
        combustivel: 'Flex',
        transmissao: 'Automático',
        criadoEm: '2023-01-01',
        atualizadoEm: '2023-01-01'
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockVeiculo
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.buscarVeiculoPorId('1', 'mock-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/veiculos/1',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }
        }
      );
      expect(result).toEqual({
        success: true,
        data: mockVeiculo,
        message: undefined
      });
    });

    it('deve buscar veículo por ID sem token', async () => {
      const mockVeiculo = {
        id: '1',
        marca: 'Honda',
        modelo: 'Civic',
        ano: 2021,
        preco: 75000,
        status: 'A_VENDA',
        criadoEm: '2023-01-01',
        atualizadoEm: '2023-01-01'
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockVeiculo
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.buscarVeiculoPorId('1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/veiculos/1',
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual({
        success: true,
        data: mockVeiculo,
        message: undefined
      });
    });

    it('deve retornar erro quando veículo não encontrado', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Veículo não encontrado'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.buscarVeiculoPorId('999');

      expect(result).toEqual({
        success: false,
        message: 'Veículo não encontrado'
      });
    });

    it('deve retornar erro quando API retorna erro 500', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: {
            message: 'Erro interno do servidor'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.buscarVeiculoPorId('1');

      expect(result).toEqual({
        success: false,
        message: 'Erro interno do servidor'
      });
    });

    it('deve retornar erro genérico quando não há resposta da API', async () => {
      const error = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(error);

      const result = await service.buscarVeiculoPorId('1');

      expect(result).toEqual({
        success: false,
        message: 'Erro interno do servidor'
      });
    });
  });

  describe('listarVeiculos', () => {
    it('deve listar veículos com sucesso com token', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              marca: 'Ford',
              modelo: 'Focus',
              ano: 2022,
              preco: 80000,
              status: 'VENDIDO',
              criadoEm: '2023-01-01',
              atualizadoEm: '2023-01-01'
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const params = {
        marca: 'Ford',
        status: 'VENDIDO' as const,
        ordem: 'DESC' as const
      };

      const result = await service.listarVeiculos(params, 'mock-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3000/api/veiculos'),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          timeout: 10000
        }
      );

      const call = mockedAxios.get.mock.calls[0][0];
      expect(call).toContain('marca=Ford');
      expect(call).toContain('status=VENDIDO');
      expect(call).toContain('ordem=DESC');

      expect(result).toEqual({
        success: true,
        data: mockResponse.data.data,
        message: undefined
      });
    });

    it('deve listar veículos sem token', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.listarVeiculos({});

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/veiculos',
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      expect(result).toEqual({
        success: true,
        data: [],
        message: undefined
      });
    });

    it('deve retornar erro quando não autorizado (401)', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: {
            message: 'Token inválido'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(errorResponse);

      const result = await service.listarVeiculos({}, 'invalid-token');

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro 401: Token inválido'
      });
    });

    it('deve retornar erro quando timeout da requisição', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded'
      };

      mockedAxios.get.mockRejectedValue(timeoutError);

      const result = await service.listarVeiculos({});

      expect(result).toEqual({
        success: false,
        data: [],
        message: 'Erro interno do servidor'
      });
    });
  });
});
