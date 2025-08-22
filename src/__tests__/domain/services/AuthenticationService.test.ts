import { 
  AuthenticationService, 
  LoginResult, 
  RegistroUsuarioInput, 
  RegistroResult 
} from '../../../domain/services/AuthenticationService';

describe('AuthenticationService Interface', () => {
  let mockAuthService: AuthenticationService;

  beforeEach(() => {
    // Mock implementation do AuthenticationService
    mockAuthService = {
      login: jest.fn(),
      registrar: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve ter método para fazer login', () => {
      expect(mockAuthService.login).toBeDefined();
      expect(typeof mockAuthService.login).toBe('function');
    });

    it('deve retornar sucesso ao fazer login válido', async () => {
      const loginResult: LoginResult = {
        success: true,
        token: 'jwt-token-123',
        usuario: {
          id: 'user-123',
          nome: 'João Silva',
          email: 'joao@email.com',
          tipo: 'CLIENTE'
        },
        message: 'Login realizado com sucesso'
      };

      (mockAuthService.login as jest.Mock).mockResolvedValue(loginResult);

      const resultado = await mockAuthService.login('joao@email.com', 'senha123');

      expect(mockAuthService.login).toHaveBeenCalledWith('joao@email.com', 'senha123');
      expect(resultado).toEqual(loginResult);
      expect(resultado.success).toBe(true);
      expect(resultado.token).toBe('jwt-token-123');
      expect(resultado.usuario?.nome).toBe('João Silva');
    });

    it('deve retornar erro para credenciais inválidas', async () => {
      const loginResult: LoginResult = {
        success: false,
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      };

      (mockAuthService.login as jest.Mock).mockResolvedValue(loginResult);

      const resultado = await mockAuthService.login('joao@email.com', 'senhaErrada');

      expect(resultado).toEqual(loginResult);
      expect(resultado.success).toBe(false);
      expect(resultado.token).toBeUndefined();
      expect(resultado.usuario).toBeUndefined();
    });

    it('deve retornar erro para usuário não encontrado', async () => {
      const loginResult: LoginResult = {
        success: false,
        error: 'Usuário não encontrado',
        message: 'Não existe usuário com este email'
      };

      (mockAuthService.login as jest.Mock).mockResolvedValue(loginResult);

      const resultado = await mockAuthService.login('inexistente@email.com', 'senha123');

      expect(resultado).toEqual(loginResult);
      expect(resultado.success).toBe(false);
    });

    it('deve aceitar diferentes tipos de usuário', async () => {
      const loginResultAdmin: LoginResult = {
        success: true,
        token: 'admin-token-456',
        usuario: {
          id: 'admin-123',
          nome: 'Admin Silva',
          email: 'admin@email.com',
          tipo: 'ADMIN'
        }
      };

      (mockAuthService.login as jest.Mock).mockResolvedValue(loginResultAdmin);

      const resultado = await mockAuthService.login('admin@email.com', 'adminPass');

      expect(resultado.usuario?.tipo).toBe('ADMIN');
    });
  });

  describe('registrar', () => {
    it('deve ter método para registrar usuário', () => {
      expect(mockAuthService.registrar).toBeDefined();
      expect(typeof mockAuthService.registrar).toBe('function');
    });

    it('deve registrar usuário com sucesso', async () => {
      const dadosUsuario: RegistroUsuarioInput = {
        nome: 'Maria Santos',
        email: 'maria@email.com',
        senha: 'senhaSegura123',
        cpf: '12345678901',
        telefone: '11999999999',
        endereco: 'Rua das Flores, 123'
      };

      const registroResult: RegistroResult = {
        success: true,
        usuario: {
          id: 'user-456',
          nome: 'Maria Santos',
          email: 'maria@email.com',
          tipo: 'CLIENTE'
        },
        message: 'Usuário registrado com sucesso'
      };

      (mockAuthService.registrar as jest.Mock).mockResolvedValue(registroResult);

      const resultado = await mockAuthService.registrar(dadosUsuario);

      expect(mockAuthService.registrar).toHaveBeenCalledWith(dadosUsuario);
      expect(resultado).toEqual(registroResult);
      expect(resultado.success).toBe(true);
      expect(resultado.usuario?.nome).toBe('Maria Santos');
    });

    it('deve registrar usuário sem campos opcionais', async () => {
      const dadosUsuario: RegistroUsuarioInput = {
        nome: 'Pedro Costa',
        email: 'pedro@email.com',
        senha: 'senha456',
        cpf: '98765432109'
      };

      const registroResult: RegistroResult = {
        success: true,
        usuario: {
          id: 'user-789',
          nome: 'Pedro Costa',
          email: 'pedro@email.com',
          tipo: 'CLIENTE'
        },
        message: 'Usuário registrado com sucesso'
      };

      (mockAuthService.registrar as jest.Mock).mockResolvedValue(registroResult);

      const resultado = await mockAuthService.registrar(dadosUsuario);

      expect(resultado).toEqual(registroResult);
      expect(resultado.success).toBe(true);
    });

    it('deve retornar erro para email já existente', async () => {
      const dadosUsuario: RegistroUsuarioInput = {
        nome: 'Ana Silva',
        email: 'maria@email.com', // Email já existente
        senha: 'senha789',
        cpf: '11122233344'
      };

      const registroResult: RegistroResult = {
        success: false,
        error: 'Email já cadastrado',
        message: 'Já existe um usuário com este email'
      };

      (mockAuthService.registrar as jest.Mock).mockResolvedValue(registroResult);

      const resultado = await mockAuthService.registrar(dadosUsuario);

      expect(resultado).toEqual(registroResult);
      expect(resultado.success).toBe(false);
      expect(resultado.usuario).toBeUndefined();
    });

    it('deve retornar erro para CPF já existente', async () => {
      const dadosUsuario: RegistroUsuarioInput = {
        nome: 'Carlos Souza',
        email: 'carlos@email.com',
        senha: 'senha999',
        cpf: '12345678901' // CPF já existente
      };

      const registroResult: RegistroResult = {
        success: false,
        error: 'CPF já cadastrado',
        message: 'Já existe um usuário com este CPF'
      };

      (mockAuthService.registrar as jest.Mock).mockResolvedValue(registroResult);

      const resultado = await mockAuthService.registrar(dadosUsuario);

      expect(resultado).toEqual(registroResult);
      expect(resultado.success).toBe(false);
    });

    it('deve retornar erro para dados inválidos', async () => {
      const dadosUsuario: RegistroUsuarioInput = {
        nome: '',
        email: 'email-invalido',
        senha: '123', // Senha muito curta
        cpf: '123' // CPF inválido
      };

      const registroResult: RegistroResult = {
        success: false,
        error: 'Dados inválidos',
        message: 'Verifique os dados informados'
      };

      (mockAuthService.registrar as jest.Mock).mockResolvedValue(registroResult);

      const resultado = await mockAuthService.registrar(dadosUsuario);

      expect(resultado).toEqual(registroResult);
      expect(resultado.success).toBe(false);
    });
  });

  describe('LoginResult interface', () => {
    it('deve ter propriedades obrigatórias e opcionais corretas', () => {
      const loginSuccess: LoginResult = {
        success: true,
        token: 'token-123',
        usuario: {
          id: 'user-1',
          nome: 'Test User',
          email: 'test@email.com',
          tipo: 'CLIENTE'
        }
      };

      const loginFailure: LoginResult = {
        success: false,
        error: 'Erro de autenticação'
      };

      expect(loginSuccess.success).toBe(true);
      expect(loginSuccess.token).toBeDefined();
      expect(loginSuccess.usuario).toBeDefined();

      expect(loginFailure.success).toBe(false);
      expect(loginFailure.token).toBeUndefined();
      expect(loginFailure.usuario).toBeUndefined();
      expect(loginFailure.error).toBeDefined();
    });
  });

  describe('RegistroUsuarioInput interface', () => {
    it('deve ter propriedades obrigatórias e opcionais corretas', () => {
      const registroCompleto: RegistroUsuarioInput = {
        nome: 'Usuário Completo',
        email: 'completo@email.com',
        senha: 'senhaSegura',
        cpf: '12345678901',
        telefone: '11999999999',
        endereco: 'Endereço completo'
      };

      const registroMinimo: RegistroUsuarioInput = {
        nome: 'Usuário Mínimo',
        email: 'minimo@email.com',
        senha: 'senha123',
        cpf: '98765432109'
      };

      expect(registroCompleto.nome).toBeDefined();
      expect(registroCompleto.email).toBeDefined();
      expect(registroCompleto.senha).toBeDefined();
      expect(registroCompleto.cpf).toBeDefined();
      expect(registroCompleto.telefone).toBeDefined();
      expect(registroCompleto.endereco).toBeDefined();

      expect(registroMinimo.nome).toBeDefined();
      expect(registroMinimo.email).toBeDefined();
      expect(registroMinimo.senha).toBeDefined();
      expect(registroMinimo.cpf).toBeDefined();
      expect(registroMinimo.telefone).toBeUndefined();
      expect(registroMinimo.endereco).toBeUndefined();
    });
  });

  describe('RegistroResult interface', () => {
    it('deve ter propriedades obrigatórias e opcionais corretas', () => {
      const registroSuccess: RegistroResult = {
        success: true,
        usuario: {
          id: 'user-1',
          nome: 'Novo Usuário',
          email: 'novo@email.com',
          tipo: 'CLIENTE'
        },
        message: 'Sucesso'
      };

      const registroFailure: RegistroResult = {
        success: false,
        error: 'Erro no registro'
      };

      expect(registroSuccess.success).toBe(true);
      expect(registroSuccess.usuario).toBeDefined();
      expect(registroSuccess.message).toBeDefined();

      expect(registroFailure.success).toBe(false);
      expect(registroFailure.usuario).toBeUndefined();
      expect(registroFailure.error).toBeDefined();
    });
  });
});
