import { Request, Response } from 'express';
import { AuthController } from '../../../../infrastructure/http/controllers/AuthController';
import { ExternalAuthenticationService } from '../../../../infrastructure/services/ExternalAuthenticationService';

// Mock do serviço de autenticação
jest.mock('../../../../infrastructure/services/ExternalAuthenticationService');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAuthService: jest.Mocked<ExternalAuthenticationService>;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    authController = new AuthController();
    mockAuthService = (authController as any).authService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'joao@teste.com',
        senha: '123456'
      };

      const mockResult = {
        success: true,
        token: 'jwt-token-123',
        usuario: {
          id: 'user_123',
          nome: 'João Silva',
          email: 'joao@teste.com',
          tipo: 'CLIENTE'
        }
      };

      mockRequest.body = loginData;
      mockAuthService.login.mockResolvedValue(mockResult);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData.email, loginData.senha);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve retornar erro 400 para email faltando', async () => {
      mockRequest.body = { senha: 'password123' };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 para senha faltando', async () => {
      mockRequest.body = { email: 'joao@teste.com' };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 para credenciais inválidas', async () => {
      const loginData = {
        email: 'joao@teste.com',
        senha: 'senha_errada'
      };

      const mockResult = {
        success: false,
        error: 'Credenciais inválidas'
      };

      mockRequest.body = loginData;
      mockAuthService.login.mockResolvedValue(mockResult);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve retornar erro 500 para exceções inesperadas', async () => {
      const loginData = {
        email: 'joao@teste.com',
        senha: 'senha123'
      };

      mockRequest.body = loginData;
      mockAuthService.login.mockRejectedValue(new Error('Erro de conexão'));

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('registrar', () => {
    it('deve registrar usuário com sucesso', async () => {
      const registroData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      const mockResult = {
        success: true,
        usuario: {
          id: 'user_123',
          nome: 'João Silva',
          email: 'joao@teste.com',
          tipo: 'CLIENTE'
        }
      };

      mockRequest.body = registroData;
      mockAuthService.registrar.mockResolvedValue(mockResult);

      await authController.registrar(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.registrar).toHaveBeenCalledWith(registroData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve retornar erro 400 para dados obrigatórios faltando', async () => {
      mockRequest.body = {
        nome: 'João Silva',
        email: 'joao@teste.com'
        // senha e cpf faltando
      };

      await authController.registrar(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Dados obrigatórios faltando',
        details: 'Nome, email, senha e CPF são obrigatórios'
      });
      expect(mockAuthService.registrar).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando registro falha', async () => {
      const registroData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      const mockResult = {
        success: false,
        error: 'Email já está em uso'
      };

      mockRequest.body = registroData;
      mockAuthService.registrar.mockResolvedValue(mockResult);

      await authController.registrar(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('deve retornar erro 500 para exceções inesperadas', async () => {
      const registroData = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: '123456',
        cpf: '12345678901'
      };

      mockRequest.body = registroData;
      mockAuthService.registrar.mockRejectedValue(new Error('Erro de conexão'));

      await authController.registrar(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor'
      });
    });
  });

  describe('me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const mockUser = {
        userId: 'user_123',
        email: 'joao@teste.com',
        tipo: 'CLIENTE'
      };

      const mockAuthRequest = {
        ...mockRequest,
        user: mockUser
      };

      await authController.me(mockAuthRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        user: mockUser
      });
    });

    it('deve retornar erro 401 para usuário não autenticado', async () => {
      const mockAuthRequest = {
        ...mockRequest,
        user: undefined
      };

      await authController.me(mockAuthRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Usuário não autenticado'
      });
    });
  });
});
