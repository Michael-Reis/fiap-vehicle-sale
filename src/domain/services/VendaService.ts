import { VendaRepository } from '../repositories/VendaRepository';
import { Venda, CriarVendaRequest, StatusVenda, MetodoPagamento } from '../entities/Venda';
import { ExternalVeiculoService } from '../../infrastructure/services/ExternalVeiculoService';
import { v4 as uuidv4 } from 'uuid';

export class VendaService {
  private veiculoService: ExternalVeiculoService;

  constructor(private vendaRepository: VendaRepository) {
    this.veiculoService = new ExternalVeiculoService();
  }

  async criarVenda(request: CriarVendaRequest): Promise<Venda> {
    // Validar se CPF tem 11 dígitos
    if (!this.validarCpf(request.cpfComprador)) {
      throw new Error('CPF inválido');
    }

    // Validar valor pago
    if (request.valorPago <= 0) {
      throw new Error('Valor pago deve ser maior que zero');
    }

    // Buscar dados do veículo para validar o valor
    const veiculoResponse = await this.veiculoService.buscarVeiculoPorId(request.veiculoId);
    
    if (!veiculoResponse.success || !veiculoResponse.data) {
      throw new Error(veiculoResponse.message || 'Veículo não encontrado');
    }

    const veiculo = veiculoResponse.data;

    // Verificar se o veículo está disponível para venda
    if (veiculo.status !== 'A_VENDA') {
      throw new Error('Veículo não está disponível para venda');
    }

    // Converter preços para número para garantir comparação correta
    const valorPago = Number(request.valorPago);
    const precoVeiculo = Number(veiculo.preco);

    // Validar se os valores são números válidos
    if (isNaN(valorPago) || isNaN(precoVeiculo)) {
      throw new Error('Erro ao processar valores monetários');
    }

    // Validar se o valor pago corresponde ao preço do veículo (com tolerância para precisão de ponto flutuante)
    if (Math.abs(valorPago - precoVeiculo) > 0.01) {
      throw new Error(`Valor pago (R$ ${valorPago.toFixed(2)}) não corresponde ao preço do veículo (R$ ${precoVeiculo.toFixed(2)})`);
    }

    // Verificar se veículo já não foi vendido
    const vendasExistentes = await this.vendaRepository.buscarPorVeiculoId(request.veiculoId);
    const vendaAprovada = vendasExistentes.find(v => v.status === StatusVenda.APROVADO);
    
    if (vendaAprovada) {
      throw new Error('Veículo já foi vendido');
    }

    // Gerar código de pagamento único
    const codigoPagamento = this.gerarCodigoPagamento();

    const venda: Omit<Venda, 'id' | 'dataCriacao' | 'dataAtualizacao'> = {
      veiculoId: request.veiculoId,
      cpfComprador: request.cpfComprador,
      valorPago: request.valorPago,
      metodoPagamento: request.metodoPagamento,
      status: StatusVenda.PENDENTE,
      codigoPagamento,
      dataAprovacao: undefined,
      webhookNotificado: false,
      tentativasWebhook: 0
    };

    console.log('Criando venda:', venda);
    return await this.vendaRepository.criar(venda);
  }

  async buscarVendaPorId(id: string): Promise<Venda | null> {
    return await this.vendaRepository.buscarPorId(id);
  }

  async buscarVendasPorCpf(cpf: string): Promise<Venda[]> {
    if (!this.validarCpf(cpf)) {
      throw new Error('CPF inválido');
    }
    
    return await this.vendaRepository.buscarPorCpf(cpf);
  }

  async buscarVendasPorVeiculo(veiculoId: string): Promise<Venda[]> {
    return await this.vendaRepository.buscarPorVeiculoId(veiculoId);
  }

  async processarPagamento(codigoPagamento: string, statusPagamento: 'aprovado' | 'rejeitado'): Promise<Venda | null> {
    const venda = await this.vendaRepository.buscarPorCodigoPagamento(codigoPagamento);
    
    if (!venda) {
      throw new Error('Venda não encontrada');
    }

    if (venda.status !== StatusVenda.PENDENTE && venda.status !== StatusVenda.PROCESSANDO) {
      throw new Error('Venda já foi processada');
    }

    const novoStatus = statusPagamento === 'aprovado' ? StatusVenda.APROVADO : StatusVenda.REJEITADO;
    const dataAprovacao = statusPagamento === 'aprovado' ? new Date() : undefined;

    await this.vendaRepository.atualizarStatus(venda.id, novoStatus, dataAprovacao);
    
    return await this.vendaRepository.buscarPorId(venda.id);
  }

  async listarVendas(limite: number = 50, offset: number = 0): Promise<Venda[]> {
    return await this.vendaRepository.listarTodas(limite, offset);
  }

  async buscarVendasPendentesWebhook(): Promise<Venda[]> {
    return await this.vendaRepository.buscarVendasPendentesWebhook();
  }

  async marcarWebhookNotificado(vendaId: string): Promise<boolean> {
    return await this.vendaRepository.marcarWebhookNotificado(vendaId);
  }

  async incrementarTentativasWebhook(vendaId: string): Promise<boolean> {
    return await this.vendaRepository.incrementarTentativasWebhook(vendaId);
  }

  private validarCpf(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) {
      return false;
    }

    // Validação do algoritmo do CPF
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(10))) return false;

    return true;
  }

  private gerarCodigoPagamento(): string {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAG-${timestamp}-${randomPart}`;
  }
}
