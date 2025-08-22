import { Venda, StatusVenda } from '../entities/Venda';

export interface VendaRepository {
  criar(venda: Omit<Venda, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Promise<Venda>;
  buscarPorId(id: string): Promise<Venda | null>;
  buscarPorCodigoPagamento(codigoPagamento: string): Promise<Venda | null>;
  buscarPorVeiculoId(veiculoId: string): Promise<Venda[]>;
  buscarPorCpf(cpfComprador: string): Promise<Venda[]>;
  atualizar(id: string, dados: Partial<Venda>): Promise<Venda | null>;
  atualizarStatus(id: string, status: StatusVenda, dataAprovacao?: Date): Promise<boolean>;
  buscarVendasPendentesWebhook(): Promise<Venda[]>;
  incrementarTentativasWebhook(id: string): Promise<boolean>;
  marcarWebhookNotificado(id: string): Promise<boolean>;
  listarTodas(limit?: number, offset?: number): Promise<Venda[]>;
}
