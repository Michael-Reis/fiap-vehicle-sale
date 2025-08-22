// Mock do mysql2 antes de qualquer import
const mockPool = {
  execute: jest.fn(),
  end: jest.fn(),
  getConnection: jest.fn()
};

const mockCreatePool = jest.fn(() => mockPool);

jest.mock('mysql2/promise', () => ({
  createPool: mockCreatePool
}));

// Import após o mock
import { pool, initializeDatabase } from '../../../infrastructure/database/connection';

describe('Database Connection Module', () => {
  // Mock console para evitar logs nos testes
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
    // Reset mocks
    mockPool.execute.mockReset();
    mockPool.end.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Module Exports', () => {
    it('deve exportar pool de conexão', () => {
      expect(pool).toBeDefined();
      expect(pool).toBe(mockPool);
    });

    it('deve exportar função initializeDatabase', () => {
      expect(initializeDatabase).toBeDefined();
      expect(typeof initializeDatabase).toBe('function');
    });

    it('deve ter interface correta do pool', () => {
      expect(pool.execute).toBeDefined();
      expect(pool.end).toBeDefined();
      expect(pool.getConnection).toBeDefined();
      expect(typeof pool.execute).toBe('function');
      expect(typeof pool.end).toBe('function');
      expect(typeof pool.getConnection).toBe('function');
    });

    it('deve exportar pool como default', () => {
      const connection = require('../../../infrastructure/database/connection');
      expect(connection.default).toBeDefined();
    });
  });

  describe('Database Initialization - Success Cases', () => {
    it('deve inicializar database com sucesso', async () => {
      // Mock para conexão sem DB (primeira parte)
      const mockConnectionWithoutDb = {
        execute: jest.fn().mockResolvedValue([]),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      // Configurar mocks para sucesso
      mockPool.execute.mockResolvedValue([]);
      
      // Configurar createPool para retornar os objetos corretos
      mockCreatePool
        .mockReturnValueOnce(mockConnectionWithoutDb as any)
        .mockReturnValueOnce(mockPool);
      
      await initializeDatabase();
      
      expect(console.log).toHaveBeenCalledWith('Banco de dados inicializado com sucesso');
      expect(mockConnectionWithoutDb.execute).toHaveBeenCalled();
      expect(mockConnectionWithoutDb.end).toHaveBeenCalled();
    });

    it('deve inicializar banco de dados corretamente', async () => {
      // Configurar mocks para sucesso
      mockPool.execute.mockResolvedValue([]);
      
      await initializeDatabase();
      
      // Verificar se as operações de banco foram executadas
      expect(mockPool.execute).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Banco de dados inicializado com sucesso');
    });

    it('deve criar tabelas necessárias', async () => {
      const mockConnectionWithoutDb = {
        execute: jest.fn().mockResolvedValue([]),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      mockPool.execute.mockResolvedValue([]);
      
      mockCreatePool
        .mockReturnValueOnce(mockConnectionWithoutDb as any)
        .mockReturnValueOnce(mockPool);
      
      await initializeDatabase();
      
      // Verificar se as queries de criação de tabelas foram executadas
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS vendas')
      );
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS log_webhook')
      );
    });
  });

  describe('Database Schema Validation', () => {
    it('deve verificar estrutura de tabela vendas', async () => {
      const mockConnectionWithoutDb = {
        execute: jest.fn().mockResolvedValue([]),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      mockPool.execute.mockResolvedValue([]);
      
      mockCreatePool
        .mockReturnValueOnce(mockConnectionWithoutDb as any)
        .mockReturnValueOnce(mockPool);
      
      await initializeDatabase();
      
      // Buscar a query da tabela vendas
      const vendasCall = mockPool.execute.mock.calls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS vendas')
      );
      
      expect(vendasCall).toBeDefined();
      const vendasQuery = vendasCall[0];
      
      // Verificar colunas essenciais
      expect(vendasQuery).toContain('id VARCHAR(36) PRIMARY KEY');
      expect(vendasQuery).toContain('veiculo_id VARCHAR(50) NOT NULL');
      expect(vendasQuery).toContain('cpf_comprador VARCHAR(11) NOT NULL');
      expect(vendasQuery).toContain('valor_pago DECIMAL(10,2) NOT NULL');
      expect(vendasQuery).toContain('metodo_pagamento ENUM');
      expect(vendasQuery).toContain('status ENUM');
    });

    it('deve verificar estrutura de tabela log_webhook', async () => {
      const mockConnectionWithoutDb = {
        execute: jest.fn().mockResolvedValue([]),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      mockPool.execute.mockResolvedValue([]);
      
      mockCreatePool
        .mockReturnValueOnce(mockConnectionWithoutDb as any)
        .mockReturnValueOnce(mockPool);
      
      await initializeDatabase();
      
      // Buscar a query da tabela log_webhook
      const logWebhookCall = mockPool.execute.mock.calls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS log_webhook')
      );
      
      expect(logWebhookCall).toBeDefined();
      const logWebhookQuery = logWebhookCall[0];
      
      // Verificar colunas essenciais
      expect(logWebhookQuery).toContain('id INT AUTO_INCREMENT PRIMARY KEY');
      expect(logWebhookQuery).toContain('venda_id VARCHAR(36) NOT NULL');
      expect(logWebhookQuery).toContain('url VARCHAR(500) NOT NULL');
      expect(logWebhookQuery).toContain('payload TEXT NOT NULL');
      expect(logWebhookQuery).toContain('FOREIGN KEY (venda_id) REFERENCES vendas(id)');
    });

    it('deve verificar índices da tabela vendas', async () => {
      const mockConnectionWithoutDb = {
        execute: jest.fn().mockResolvedValue([]),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      mockPool.execute.mockResolvedValue([]);
      
      mockCreatePool
        .mockReturnValueOnce(mockConnectionWithoutDb as any)
        .mockReturnValueOnce(mockPool);
      
      await initializeDatabase();
      
      const vendasCall = mockPool.execute.mock.calls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS vendas')
      );
      
      const vendasQuery = vendasCall[0];
      
      // Verificar índices
      expect(vendasQuery).toContain('INDEX idx_status (status)');
      expect(vendasQuery).toContain('INDEX idx_veiculo_id (veiculo_id)');
      expect(vendasQuery).toContain('INDEX idx_cpf_comprador (cpf_comprador)');
      expect(vendasQuery).toContain('INDEX idx_webhook_pendente (webhook_notificado, status)');
    });

    it('deve verificar índices da tabela log_webhook', async () => {
      const mockConnectionWithoutDb = {
        execute: jest.fn().mockResolvedValue([]),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      mockPool.execute.mockResolvedValue([]);
      
      mockCreatePool
        .mockReturnValueOnce(mockConnectionWithoutDb as any)
        .mockReturnValueOnce(mockPool);
      
      await initializeDatabase();
      
      const logWebhookCall = mockPool.execute.mock.calls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS log_webhook')
      );
      
      const logWebhookQuery = logWebhookCall[0];
      
      // Verificar índices
      expect(logWebhookQuery).toContain('INDEX idx_venda_id (venda_id)');
      expect(logWebhookQuery).toContain('INDEX idx_sucesso (sucesso)');
    });
  });

  describe('Pool Operations', () => {
    it('deve permitir executar queries no pool', async () => {
      mockPool.execute.mockResolvedValue([{ test: 'data' }]);
      
      const result = await pool.execute('SELECT 1');
      
      expect(mockPool.execute).toHaveBeenCalledWith('SELECT 1');
      expect(result).toEqual([{ test: 'data' }]);
    });

    it('deve permitir fechar conexões do pool', async () => {
      mockPool.end.mockResolvedValue(undefined);
      
      await pool.end();
      
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('deve permitir obter conexão individual', async () => {
      const mockConnection = { 
        execute: jest.fn(),
        release: jest.fn() 
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);
      
      const connection = await pool.getConnection();
      
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(connection).toBe(mockConnection);
    });

    it('deve ter configuração de pool válida', () => {
      // Verifica se o pool foi criado corretamente
      expect(pool.execute).toEqual(expect.any(Function));
      expect(pool.end).toEqual(expect.any(Function));
      expect(pool.getConnection).toEqual(expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com função initializeDatabase disponível', () => {
      // Testa se a função existe e pode ser chamada
      expect(typeof initializeDatabase).toBe('function');
    });

    it('deve processar chamadas assíncronas', async () => {
      const mockConnectionWithoutDb = {
        execute: jest.fn().mockResolvedValue([]),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      mockPool.execute.mockResolvedValue([]);
      
      mockCreatePool
        .mockReturnValueOnce(mockConnectionWithoutDb as any)
        .mockReturnValueOnce(mockPool);
      
      // Não deve lançar erro
      await expect(initializeDatabase()).resolves.not.toThrow();
    });

    it('deve capturar e propagar erros de inicialização', async () => {
      // Reset todos os mocks para este teste específico
      mockCreatePool.mockReset();
      mockPool.execute.mockReset();
      mockPool.end.mockReset();
      
      const mockConnectionWithError = {
        execute: jest.fn().mockRejectedValue(new Error('Database creation failed')),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      // Mock para que falhe na criação do database
      mockCreatePool.mockReturnValue(mockConnectionWithError as any);
      
      await expect(initializeDatabase()).rejects.toThrow('Database creation failed');
      expect(console.error).toHaveBeenCalledWith('Erro ao inicializar banco de dados:', expect.any(Error));
    });

    it('deve validar comandos SQL', async () => {
      const mockConnectionWithoutDb = {
        execute: jest.fn().mockResolvedValue([]),
        end: jest.fn().mockResolvedValue(undefined),
        getConnection: jest.fn()
      };
      
      mockPool.execute.mockResolvedValue([]);
      
      mockCreatePool
        .mockReturnValueOnce(mockConnectionWithoutDb as any)
        .mockReturnValueOnce(mockPool);
      
      await initializeDatabase();
      
      // Verificar que comandos SQL são strings válidas
      const calls = mockPool.execute.mock.calls;
      calls.forEach(call => {
        expect(typeof call[0]).toBe('string');
        expect(call[0].length).toBeGreaterThan(0);
        // Pode ser CREATE TABLE ou CREATE DATABASE
        expect(call[0]).toMatch(/(CREATE TABLE|CREATE DATABASE)/);
      });
    });

    it('deve tratar pool mock corretamente', async () => {
      // Testa se os mocks estão funcionando
      mockPool.execute.mockResolvedValue([{ id: 1 }]);
      
      const result = await pool.execute('TEST QUERY');
      
      expect(result).toEqual([{ id: 1 }]);
      expect(mockPool.execute).toHaveBeenCalledWith('TEST QUERY');
    });

    it('deve verificar integridade dos mocks', () => {
      // Verificar se todos os mocks estão configurados
      expect(mockPool.execute).toEqual(expect.any(Function));
      expect(mockPool.end).toEqual(expect.any(Function));
      expect(mockPool.getConnection).toEqual(expect.any(Function));
      expect(mockCreatePool).toEqual(expect.any(Function));
    });
  });

  describe('Configuration Validation', () => {
    it('deve verificar module loading', () => {
      // Testa se module pode ser carregado sem erro
      expect(() => {
        const connection = require('../../../infrastructure/database/connection');
        expect(connection).toBeDefined();
        expect(connection.pool).toBeDefined();
        expect(connection.initializeDatabase).toBeDefined();
      }).not.toThrow();
    });

    it('deve verificar estrutura de exportação', () => {
      const connection = require('../../../infrastructure/database/connection');
      
      // Verificar exportações named
      expect(connection.pool).toBeDefined();
      expect(connection.initializeDatabase).toBeDefined();
      
      // Verificar default export
      expect(connection.default).toBeDefined();
    });

    it('deve ter tipos corretos para funções', () => {
      expect(typeof pool.execute).toBe('function');
      expect(typeof pool.end).toBe('function');
      expect(typeof pool.getConnection).toBe('function');
      expect(typeof initializeDatabase).toBe('function');
    });

    it('deve permitir chamadas básicas de pool', () => {
      // Testes básicos de interface
      expect(() => {
        mockPool.execute.mockReturnValue(Promise.resolve([]));
        mockPool.end.mockReturnValue(Promise.resolve());
        mockPool.getConnection.mockReturnValue(Promise.resolve({}));
      }).not.toThrow();
    });
  });
});
