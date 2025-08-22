import { WebhookService } from '../../domain/services/WebhookService';

export class CronJobService {
  private webhookService: WebhookService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.webhookService = new WebhookService();
  }

  /**
   * Inicia o cronjob para processar webhooks pendentes
   * @param intervalSeconds Intervalo em segundos (padrão: 10 segundos)
   */
  start(intervalSeconds: number = 10): void {
    if (this.isRunning) {
      console.log('CronJob já está em execução');
      return;
    }

    const intervalMs = intervalSeconds * 1000;
    
    console.log(`Iniciando CronJob para processar webhooks pendentes a cada ${intervalSeconds} segundo(s)`);
    
    this.intervalId = setInterval(async () => {
      try {
        await this.webhookService.processarWebhooksPendentes();
      } catch (error) {
        console.error('Erro no CronJob de webhooks:', error);
      }
    }, intervalMs);

    this.isRunning = true;

    // Executar uma vez imediatamente
    setImmediate(async () => {
      try {
        await this.webhookService.processarWebhooksPendentes();
      } catch (error) {
        console.error('Erro na execução inicial do CronJob:', error);
      }
    });
  }

  /**
   * Para o cronjob
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('CronJob não está em execução');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('CronJob parado');
  }

  /**
   * Verifica se o cronjob está em execução
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Executa o processamento de webhooks manualmente
   */
  async executeNow(): Promise<void> {
    console.log('Executando processamento de webhooks manualmente...');
    try {
      await this.webhookService.processarWebhooksPendentes();
      console.log('Processamento manual concluído com sucesso');
    } catch (error) {
      console.error('Erro no processamento manual de webhooks:', error);
      throw error;
    }
  }
}
