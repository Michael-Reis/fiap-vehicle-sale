import { initializeDatabase } from '../../../infrastructure/database/connection';

// Mock mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn().mockReturnValue({
    execute: jest.fn(),
    end: jest.fn(),
  }),
}));

describe('Database Connection - Simple Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve testar branch de sucesso na inicialização', async () => {
    const mysql = require('mysql2/promise');
    const mockPool = {
      execute: jest.fn().mockResolvedValue([]),
      end: jest.fn().mockResolvedValue(undefined),
    };
    
    mysql.createPool.mockReturnValue(mockPool);

    await expect(initializeDatabase()).resolves.not.toThrow();
    expect(console.log).toHaveBeenCalledWith('Banco de dados inicializado com sucesso');
  });

  it('deve testar branch de erro na inicialização', async () => {
    const mysql = require('mysql2/promise');
    const mockPool = {
      execute: jest.fn().mockRejectedValue(new Error('Connection failed')),
      end: jest.fn().mockResolvedValue(undefined),
    };
    
    mysql.createPool.mockReturnValue(mockPool);

    await expect(initializeDatabase()).rejects.toThrow('Connection failed');
    expect(console.error).toHaveBeenCalledWith('Erro ao inicializar banco de dados:', expect.any(Error));
  });
});
