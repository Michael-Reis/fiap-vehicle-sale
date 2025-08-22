import dotenv from 'dotenv';

// Carregar variáveis de ambiente para testes
dotenv.config();

// Configurações globais para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.SERVICO_PRINCIPAL_URL = 'http://localhost:3000';

// Mock do console para evitar logs nos testes
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Adicionar um teste dummy para evitar erro do Jest
describe('Setup', () => {
  it('deve configurar o ambiente de teste', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
