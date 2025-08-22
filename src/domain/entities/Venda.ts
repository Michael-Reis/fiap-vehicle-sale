export interface Venda {
  id: string;
  veiculoId: string;
  cpfComprador: string;
  valorPago: number;
  metodoPagamento: MetodoPagamento;
  status: StatusVenda;
  codigoPagamento?: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataAprovacao?: Date;
  webhookNotificado: boolean;
  tentativasWebhook: number;
}

export enum MetodoPagamento {
  PIX = 'pix',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  BOLETO = 'boleto',
  TRANSFERENCIA = 'transferencia'
}

export enum StatusVenda {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado'
}

export interface CriarVendaRequest {
  veiculoId: string;
  cpfComprador: string;
  valorPago: number;
  metodoPagamento: MetodoPagamento;
}

export interface WebhookPagamento {
  codigoPagamento: string;
  status: 'aprovado' | 'rejeitado';
  veiculoId: string;
  cpfComprador: string;
  valorPago: number;
  metodoPagamento: string;
  dataTransacao: string;
}

export interface NotificacaoWebhookExterno {
  codigoPagamento: string;
  status: 'aprovado';
  veiculoId: string;
  cpfComprador: string;
  valorPago: number;
  metodoPagamento: MetodoPagamento;
  dataTransacao: string;
}
