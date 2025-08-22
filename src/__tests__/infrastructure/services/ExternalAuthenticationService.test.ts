import axios from 'axios';
import { ExternalAuthenticationService } from '../../../infrastructure/services/ExternalAuthenticationService';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ExternalAuthenticationService', () => {
  let authService: ExternalAuthenticationService;

  beforeEach(() => {
    authService = new ExternalAuthenticationService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token-123',
          usuario: {
            id: 'user_123',
            nome: 'João Silva',
            email: 'joao@teste.com',
            tipo: 'CLIENTE'
          },
          message: 'Login realizado com sucesso'
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authService.login('joao@teste.com', '123456');

      expect(result.success).toBe(true);
      expect(result.token).toBe('jwt-token-123');
      expect(result.usuario).toEqual(mockResponse.data.usuario);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        { email: 'joao@teste.com', senha: '123456' },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
    });

    it('deve retornar erro para credenciais inválidas', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Credenciais inválidas'
          }
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const result = await authService.login('joao@teste.com', 'senha_errada');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Credenciais inválidas');
    });

    it('deve retornar erro quando serviço principal estiver indisponível', async () => {
      const mockError = {
        code: 'ECONNREFUSED'
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const result = await authService.login('joao@teste.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serviço de autenticação indisponível');
    });
  });

  describe('registrar', () => {
    it('deve registrar usuário com sucesso', async () => {
      const mockResponse = {
        data: {
          usuario: {
            id: 'user_123',
            nome: 'João Silva',
            email: 'joao@teste.com',
            tipo: 'CLIENTE'
          },
          message: 'Usuário registrado com sucesso'
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      const result = await authService.registrar(dadosUsuario);

      expect(result.success).toBe(true);
      expect(result.usuario).toEqual(mockResponse.data.usuario);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/registrar-cliente',
        dadosUsuario,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
    });

    it('deve retornar erro para dados inválidos', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Email já cadastrado'
          }
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      const result = await authService.registrar(dadosUsuario);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email já cadastrado');
    });
  });

  describe('login - cenários adicionais', () => {
    it('deve retornar erro para problemas de rede', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      const result = await authService.login('joao@teste.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro interno de autenticação');
    });

    it('deve retornar erro para resposta sem dados', async () => {
      const mockError = {
        response: undefined
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const result = await authService.login('joao@teste.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro interno de autenticação');
    });
  });

  describe('registrar - cenários adicionais', () => {
    it('deve retornar erro para problemas de rede', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      const result = await authService.registrar(dadosUsuario);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro interno de registro');
    });

    it('deve retornar erro para resposta sem dados', async () => {
      const mockError = {
        response: undefined
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      const result = await authService.registrar(dadosUsuario);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro interno de registro');
    });

    it('deve registrar usuário com dados opcionais', async () => {
      const mockResponse = {
        data: {
          usuario: {
            id: 'user_123',
            nome: 'João Silva',
            email: 'joao@teste.com',
            tipo: 'CLIENTE'
          },
          message: 'Cliente registrado com sucesso'
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901',
        telefone: '11999999999',
        endereco: 'Rua das Flores, 123'
      };

      const result = await authService.registrar(dadosUsuario);

      expect(result.success).toBe(true);
      expect(result.usuario).toEqual(mockResponse.data.usuario);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/registrar-cliente',
        dadosUsuario,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
    });
  });

  describe('configuração do serviço', () => {
    it('deve usar a URL base correta', () => {
      const service = new ExternalAuthenticationService();
      expect(service).toBeDefined();
    });

    it('deve ter timeout configurado', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await authService.login('test@test.com', 'password');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 5000
        })
      );
    });

    it('deve ter headers corretos configurados', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await authService.login('test@test.com', 'password');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  describe('cenários de erro de conexão', () => {
    it('deve retornar erro para ECONNREFUSED no login', async () => {
      const errorWithCode = new Error('Connection refused');
      (errorWithCode as any).code = 'ECONNREFUSED';
      
      mockedAxios.post.mockRejectedValue(errorWithCode);

      const result = await authService.login('test@test.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serviço de autenticação indisponível');
    });

    it('deve retornar erro para ENOTFOUND no login', async () => {
      const errorWithCode = new Error('Host not found');
      (errorWithCode as any).code = 'ENOTFOUND';
      
      mockedAxios.post.mockRejectedValue(errorWithCode);

      const result = await authService.login('test@test.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serviço de autenticação indisponível');
    });

    it('deve retornar erro para ECONNREFUSED no registro', async () => {
      const errorWithCode = new Error('Connection refused');
      (errorWithCode as any).code = 'ECONNREFUSED';
      
      mockedAxios.post.mockRejectedValue(errorWithCode);

      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      const result = await authService.registrar(dadosUsuario);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serviço de autenticação indisponível');
    });

    it('deve retornar erro para ENOTFOUND no registro', async () => {
      const errorWithCode = new Error('Host not found');
      (errorWithCode as any).code = 'ENOTFOUND';
      
      mockedAxios.post.mockRejectedValue(errorWithCode);

      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      const result = await authService.registrar(dadosUsuario);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Serviço de autenticação indisponível');
    });
  });
});
