import { ExternalVeiculoService } from '../../../infrastructure/services/ExternalVeiculoService';
import axios from 'axios';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('ExternalVeiculoService - Branch Coverage', () => {
  let service: ExternalVeiculoService;

  beforeEach(() => {
    service = new ExternalVeiculoService();
    jest.clearAllMocks();
  });

  it('deve testar branch de erro 404 no buscarVeiculoPorId', async () => {
    mockAxios.get.mockRejectedValue({
      response: { status: 404 }
    });

    const result = await service.buscarVeiculoPorId('veiculo-inexistente');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Veículo não encontrado');
  });

  it('deve testar branch de erro 401 no buscarVeiculoPorId', async () => {
    mockAxios.get.mockRejectedValue({
      response: { status: 401 }
    });

    const result = await service.buscarVeiculoPorId('veiculo-123', 'invalid-token');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Token de acesso inválido');
  });

  it('deve testar branch de erro 403 no buscarVeiculoPorId', async () => {
    mockAxios.get.mockRejectedValue({
      response: { status: 403 }
    });

    const result = await service.buscarVeiculoPorId('veiculo-123', 'token');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Acesso negado');
  });

  it('deve testar branch de erro genérico no buscarVeiculoPorId', async () => {
    mockAxios.get.mockRejectedValue(new Error('Generic error'));

    const result = await service.buscarVeiculoPorId('veiculo-123');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Erro interno do servidor');
  });

  it('deve testar branch de resposta sem sucesso no buscarVeiculoPorId', async () => {
    mockAxios.get.mockResolvedValue({
      data: { 
        success: false, 
        message: 'Veículo não disponível' 
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });

    const result = await service.buscarVeiculoPorId('veiculo-123');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Veículo não disponível');
  });

  it('deve testar branch de sucesso no buscarVeiculoPorId', async () => {
    const veiculo = {
      id: 'veiculo-123',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      preco: 80000,
      status: 'A_VENDA' as const,
      criadoEm: '2023-01-01',
      atualizadoEm: '2023-01-01'
    };

    mockAxios.get.mockResolvedValue({
      data: { 
        success: true, 
        data: veiculo,
        message: 'Veículo encontrado'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });

    const result = await service.buscarVeiculoPorId('veiculo-123');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(veiculo);
    expect(result.message).toBe('Veículo encontrado');
  });

  it('deve testar branch com token no header', async () => {
    const veiculo = {
      id: 'veiculo-123',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      preco: 80000,
      status: 'A_VENDA' as const,
      criadoEm: '2023-01-01',
      atualizadoEm: '2023-01-01'
    };

    mockAxios.get.mockResolvedValue({
      data: { 
        success: true, 
        data: veiculo,
        message: 'Veículo encontrado'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });

    const result = await service.buscarVeiculoPorId('veiculo-123', 'valid-token');
    expect(result.success).toBe(true);
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/veiculos/veiculo-123'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-token'
        })
      })
    );
  });
});
