import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { authMiddleware, adminMiddleware, AuthenticatedRequest } from '../../../../infrastructure/http/middlewares/authMiddleware';

// Mock do jwt
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('authMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    // Reset environment variable
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('deve autenticar usuário com token válido', () => {
      const mockDecodedToken = {
        userId: 'user_123',
        email: 'test@test.com',
        tipo: 'CLIENTE'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token_123'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid_token_123', 'test_secret');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve usar JWT_SECRET padrão quando não definido', () => {
      delete process.env.JWT_SECRET;
      
      const mockDecodedToken = {
        userId: 'user_123',
        email: 'test@test.com',
        tipo: 'CLIENTE'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token_123'
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid_token_123', 'secret_default');
    });

    it('deve retornar erro 401 quando authorization header não fornecido', () => {
      mockRequest.headers = {};

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acesso não fornecido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando authorization header está vazio', () => {
      mockRequest.headers = {
        authorization: ''
      };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acesso não fornecido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando authorization header é apenas espaços', () => {
      mockRequest.headers = {
        authorization: '   '
      };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token de acesso não fornecido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando formato do token é inválido - sem espaço', () => {
      mockRequest.headers = {
        authorization: 'Bearer'
      };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando formato do token é inválido - Token ao invés de Bearer', () => {
      mockRequest.headers = {
        authorization: 'Token invalid_format'
      };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando token está vazio após Bearer', () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando token está vazio após Bearer com espaços', () => {
      mockRequest.headers = {
        authorization: 'Bearer    '
      };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 para token expirado', () => {
      mockRequest.headers = {
        authorization: 'Bearer expired_token'
      };

      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expirado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 para token inválido', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      };

      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 500 para outros erros JWT', () => {
      mockRequest.headers = {
        authorization: 'Bearer some_token'
      };

      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Algum erro desconhecido');
      });

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erro interno de autenticação'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('adminMiddleware', () => {
    it('deve permitir acesso para usuário admin', () => {
      mockRequest.user = {
        userId: 'admin_123',
        email: 'admin@test.com',
        tipo: 'ADMIN'
      };

      adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando usuário não está autenticado', () => {
      mockRequest.user = undefined;

      adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não autenticado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar erro 403 quando usuário não é admin', () => {
      mockRequest.user = {
        userId: 'user_123',
        email: 'user@test.com',
        tipo: 'CLIENTE'
      };

      adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acesso negado. Apenas administradores têm acesso a este recurso'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
