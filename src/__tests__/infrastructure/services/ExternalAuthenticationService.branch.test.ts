import { ExternalAuthenticationService } from '../../../infrastructure/services/ExternalAuthenticationService';
import axios from 'axios';

jest.mock('axios');

describe('ExternalAuthenticationService - Additional Branch Coverage', () => {
  let service: ExternalAuthenticationService;
  let mockAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ExternalAuthenticationService();
    mockAxios = axios as jest.Mocked<typeof axios>;
  });

  it('deve testar branch de erro de rede no login', async () => {
    mockAxios.post.mockRejectedValue(new Error('Network error'));

    const result = await service.login('test@email.com', 'password');
    expect(result.success).toBe(false);
  });

  it('deve testar branch de timeout no login', async () => {
    mockAxios.post.mockRejectedValue(new Error('timeout'));

    const result = await service.login('test@email.com', 'password');
    expect(result.success).toBe(false);
  });

  it('deve testar branch de erro no registrar', async () => {
    mockAxios.post.mockRejectedValue(new Error('Registration failed'));

    const result = await service.registrar({
      email: 'test@email.com',
      senha: 'password',
      nome: 'Test User',
      cpf: '12345678901'
    });

    expect(result.success).toBe(false);
  });

  it('deve testar branch de erro com status code específico no login', async () => {
    mockAxios.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Unauthorized' } }
    });

    const result = await service.login('test@email.com', 'wrong-password');
    expect(result.success).toBe(false);
  });

  it('deve testar branch de erro com status code específico no registrar', async () => {
    mockAxios.post.mockRejectedValue({
      response: { status: 409, data: { message: 'User already exists' } }
    });

    const result = await service.registrar({
      email: 'existing@email.com',
      senha: 'password',
      nome: 'Test User',
      cpf: '12345678901'
    });

    expect(result.success).toBe(false);
  });
});
