import axios, { AxiosResponse } from 'axios';
import {
  AuthenticationService,
  LoginResult,
  RegistroUsuarioInput,
  RegistroResult
} from '../../domain/services/AuthenticationService';

export class ExternalAuthenticationService implements AuthenticationService {
  private readonly servicoPrincipalUrl: string;

  constructor() {
    this.servicoPrincipalUrl = process.env.SERVICO_PRINCIPAL_URL || 'http://localhost:3000';
  }

  async login(email: string, senha: string): Promise<LoginResult> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.servicoPrincipalUrl}/api/auth/login`,
        { email, senha },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        token: response.data.token,
        usuario: response.data.usuario,
        message: response.data.message || 'Login realizado com sucesso'
      };
    } catch (error: any) {
      console.error('Erro ao fazer login no serviço principal:', error);

      if (error.response) {
        // O serviço principal retornou um erro
        return {
          success: false,
          error: error.response.data?.error || 'Erro de autenticação'
        };
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: 'Serviço de autenticação indisponível'
        };
      }

      return {
        success: false,
        error: 'Erro interno de autenticação'
      };
    }
  }

  async registrar(dadosUsuario: RegistroUsuarioInput): Promise<RegistroResult> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.servicoPrincipalUrl}/api/auth/registrar-cliente`,
        dadosUsuario,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        usuario: response.data.usuario,
        message: response.data.message || 'Usuário registrado com sucesso'
      };
    } catch (error: any) {
      console.error('Erro ao registrar usuário no serviço principal:', error);

      if (error.response) {
        return {
          success: false,
          error: error.response.data?.error || 'Erro ao registrar usuário'
        };
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: 'Serviço de autenticação indisponível'
        };
      }

      return {
        success: false,
        error: 'Erro interno de registro'
      };
    }
  }
}
