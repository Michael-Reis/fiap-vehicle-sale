import { CronJobService } from '../../../infrastructure/jobs/CronJobService';
import { WebhookService } from '../../../domain/services/WebhookService';

// Mock do WebhookService
jest.mock('../../../domain/services/WebhookService');

const MockedWebhookService = WebhookService as jest.MockedClass<typeof WebhookService>;

describe('CronJobService', () => {
  let cronJobService: CronJobService;
  let mockWebhookService: jest.Mocked<WebhookService>;

  // Mock para setTimeout e clearInterval
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Reset dos mocks
    MockedWebhookService.mockClear();
    
    // Criar instância mockada do serviço
    mockWebhookService = {
      processarWebhooksPendentes: jest.fn(),
      notificarVendaAprovada: jest.fn(),
    } as any;

    // Configurar o mock para retornar nossa instância mockada
    MockedWebhookService.mockImplementation(() => mockWebhookService);

    cronJobService = new CronJobService();
  });

  afterEach(() => {
    // Garantir que todos os timers sejam limpos
    cronJobService.stop();
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('deve iniciar o cronjob com intervalo padrão de 10 segundos', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cronJobService.start();

      expect(consoleSpy).toHaveBeenCalledWith('Iniciando CronJob para processar webhooks pendentes a cada 10 segundo(s)');

      consoleSpy.mockRestore();
    });

    it('deve iniciar o cronjob com intervalo personalizado', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cronJobService.start(30);

      expect(consoleSpy).toHaveBeenCalledWith('Iniciando CronJob para processar webhooks pendentes a cada 30 segundo(s)');

      consoleSpy.mockRestore();
    });

    it('não deve iniciar novamente se já estiver em execução', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cronJobService.start();
      cronJobService.start(); // Segunda chamada

      expect(consoleSpy).toHaveBeenCalledWith('Iniciando CronJob para processar webhooks pendentes a cada 10 segundo(s)');
      expect(consoleSpy).toHaveBeenCalledWith('CronJob já está em execução');
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it('deve processar webhooks pendentes no intervalo especificado', async () => {
      mockWebhookService.processarWebhooksPendentes.mockResolvedValue();

      cronJobService.start(1); // 1 segundo para o teste

      // Avançar o tempo e verificar que o webhook foi chamado
      jest.advanceTimersByTime(2500);
      await Promise.resolve();

      // Deve ter executado
      expect(mockWebhookService.processarWebhooksPendentes).toHaveBeenCalled();
    });

    it('deve capturar e logar erros durante o processamento', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Erro no webhook');
      
      mockWebhookService.processarWebhooksPendentes.mockRejectedValue(error);

      cronJobService.start(1);

      // Avançar o tempo para executar o primeiro ciclo
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(consoleSpy).toHaveBeenCalledWith('Erro no CronJob de webhooks:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('deve parar o cronjob em execução', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cronJobService.start();
      cronJobService.stop();

      expect(consoleSpy).toHaveBeenCalledWith('CronJob parado');

      consoleSpy.mockRestore();
    });

    it('não deve fazer nada se o cronjob não estiver em execução', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cronJobService.stop(); // Chamar stop sem ter iniciado

      expect(consoleSpy).toHaveBeenCalledWith('CronJob não está em execução');

      consoleSpy.mockRestore();
    });

    it('deve parar a execução de webhooks após stop', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      cronJobService.start(1);
      cronJobService.stop();

      // Verificar que foi chamado o log de parada
      expect(consoleSpy).toHaveBeenCalledWith('CronJob parado');

      consoleSpy.mockRestore();
    });
  });

  describe('isActive', () => {
    it('deve retornar false quando não iniciado', () => {
      expect(cronJobService.isActive()).toBe(false);
    });

    it('deve retornar true quando iniciado', () => {
      cronJobService.start();
      expect(cronJobService.isActive()).toBe(true);
    });

    it('deve retornar false após ser parado', () => {
      cronJobService.start();
      expect(cronJobService.isActive()).toBe(true);
      
      cronJobService.stop();
      expect(cronJobService.isActive()).toBe(false);
    });
  });

  describe('executeNow', () => {
    it('deve executar o processamento manual com sucesso', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockWebhookService.processarWebhooksPendentes.mockResolvedValue();

      await cronJobService.executeNow();

      expect(consoleSpy).toHaveBeenCalledWith('Executando processamento de webhooks manualmente...');
      expect(consoleSpy).toHaveBeenCalledWith('Processamento manual concluído com sucesso');
      expect(mockWebhookService.processarWebhooksPendentes).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('deve capturar e propagar erros durante o processamento manual', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const error = new Error('Erro no processamento manual');
      
      mockWebhookService.processarWebhooksPendentes.mockRejectedValue(error);

      await expect(cronJobService.executeNow()).rejects.toThrow('Erro no processamento manual');

      expect(consoleLogSpy).toHaveBeenCalledWith('Executando processamento de webhooks manualmente...');
      expect(consoleSpy).toHaveBeenCalledWith('Erro no processamento manual de webhooks:', error);

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
