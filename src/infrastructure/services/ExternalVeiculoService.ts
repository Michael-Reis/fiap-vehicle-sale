import axios, { AxiosResponse } from 'axios';

export interface Veiculo {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  preco: number;
  status: 'A_VENDA' | 'VENDIDO' | 'RESERVADO';
  cor?: string;
  kilometragem?: number;
  combustivel?: string;
  transmissao?: string;
  descricao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ListarVeiculosParams {
  marca?: string;
  modelo?: string;
  anoMin?: number;
  anoMax?: number;
  precoMin?: number;
  precoMax?: number;
  ordem?: 'ASC' | 'DESC';
  status?: 'A_VENDA' | 'VENDIDO' | 'RESERVADO';
}

export interface ListarVeiculosResponse {
  success: boolean;
  data: Veiculo[];
  message?: string;
}

export class ExternalVeiculoService {
  private readonly servicoPrincipalUrl: string;

  constructor() {
    this.servicoPrincipalUrl = process.env.SERVICO_PRINCIPAL_URL || 'http://localhost:3000';
  }

  async listarVeiculos(params: ListarVeiculosParams, token?: string): Promise<ListarVeiculosResponse> {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Token enviado para o serviço principal:', token.substring(0, 20) + '...');
      } else {
        console.log('Nenhum token fornecido para a requisição');
      }

      const queryParams = new URLSearchParams();
      
      if (params.marca) queryParams.append('marca', params.marca);
      if (params.modelo) queryParams.append('modelo', params.modelo);
      if (params.anoMin) queryParams.append('anoMin', params.anoMin.toString());
      if (params.anoMax) queryParams.append('anoMax', params.anoMax.toString());
      if (params.precoMin) queryParams.append('precoMin', params.precoMin.toString());
      if (params.precoMax) queryParams.append('precoMax', params.precoMax.toString());
      if (params.ordem) queryParams.append('ordem', params.ordem);
      if (params.status) queryParams.append('status', params.status);

      const url = `${this.servicoPrincipalUrl}/api/veiculos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('Fazendo requisição para:', url);
      console.log('Headers enviados:', headers);

      const response: AxiosResponse = await axios.get(url, {
        headers,
        timeout: 10000
      });

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };

    } catch (error: any) {
      console.error('Erro ao consultar veículos no serviço principal:', error.message);
      
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Erro na comunicação com o serviço principal';
        
        console.error(`Erro HTTP ${statusCode}:`, errorMessage);
        console.error('Dados completos do erro:', error.response.data);
        
        return {
          success: false,
          data: [],
          message: `Erro ${statusCode}: ${errorMessage}`
        };
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          data: [],
          message: 'Serviço principal indisponível'
        };
      }

      return {
        success: false,
        data: [],
        message: 'Erro interno do servidor'
      };
    }
  }

  async listarVeiculosAVenda(params?: Omit<ListarVeiculosParams, 'status'>): Promise<ListarVeiculosResponse> {
    return this.listarVeiculos({
      ...params,
      status: 'A_VENDA',
      ordem: 'ASC' // Do mais barato para o mais caro
    });
  }

  async listarVeiculosVendidos(params?: Omit<ListarVeiculosParams, 'status'>, token?: string): Promise<ListarVeiculosResponse> {
    return this.listarVeiculos({
      ...params,
      status: 'VENDIDO',
      ordem: 'ASC' // Do mais barato para o mais caro
    }, token);
  }

  async buscarVeiculoPorId(id: string, token?: string): Promise<{ success: boolean; data?: Veiculo; message?: string }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response: AxiosResponse = await axios.get(
        `${this.servicoPrincipalUrl}/api/veiculos/${id}`,
        { headers }
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erro ao buscar veículo'
        };
      }
    } catch (error: any) {
      console.error('Erro ao buscar veículo por ID:', error.message);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Veículo não encontrado'
        };
      }

      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Token de acesso inválido'
        };
      }

      if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Acesso negado'
        };
      }

      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }
}
