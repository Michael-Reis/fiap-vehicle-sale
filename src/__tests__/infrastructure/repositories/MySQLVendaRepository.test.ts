import { MySQLVendaRepository } from '../../../infrastructure/repositories/MySQLVendaRepository';
import { Venda, StatusVenda, MetodoPagamento } from '../../../domain/entities/Venda';
import { pool } from '../../../infrastructure/database/connection';

// Mock da conexão com o banco
jest.mock('../../../infrastructure/database/connection');
const mockPool = pool as jest.Mocked<typeof pool>;

describe('MySQLVendaRepository', () => {
  let repository: MySQLVendaRepository;
  
  const vendaMock = {
    veiculoId: '1',
    cpfComprador: '12345678901',
    valorPago: 85000,
    metodoPagamento: MetodoPagamento.CARTAO_CREDITO,
    status: StatusVenda.PENDENTE,
    codigoPagamento: 'PAG-123456',
    dataAprovacao: undefined,
    webhookNotificado: false,
    tentativasWebhook: 0
  };

  const vendaCompleta: Venda = {
    id: 'venda-123',
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
    ...vendaMock
  };

  beforeEach(() => {
    repository = new MySQLVendaRepository();
    jest.clearAllMocks();
  });

  describe('criar', () => {
    it('deve criar uma venda com sucesso', async () => {
      // Mock do execute para insert
      mockPool.execute
        .mockResolvedValueOnce([{ insertId: 1 }, undefined] as any)
        // Mock para buscarPorId após criação
        .mockResolvedValueOnce([[{
          id: expect.any(String),
          veiculo_id: '1',
          cpf_comprador: '12345678901',
          valor_pago: '85000',
          metodo_pagamento: 'cartao_credito',
          status: 'pendente',
          codigo_pagamento: 'PAG-123456',
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString(),
          data_aprovacao: null,
          webhook_notificado: 0,
          tentativas_webhook: 0
        }], undefined] as any);

      const resultado = await repository.criar(vendaMock);

      expect(mockPool.execute).toHaveBeenCalledTimes(2);
      expect(mockPool.execute).toHaveBeenNthCalledWith(1,
        expect.stringContaining('INSERT INTO vendas'),
        expect.arrayContaining([
          expect.any(String), // UUID gerado
          '1',
          '12345678901',
          85000,
          'cartao_credito',
          'pendente',
          'PAG-123456',
          false,
          0
        ])
      );
      
      expect(resultado).toHaveProperty('id');
      expect(resultado.veiculoId).toBe('1');
    });

    it('deve lançar erro se não conseguir criar venda', async () => {
      // Mock do execute para insert
      mockPool.execute
        .mockResolvedValueOnce([{ insertId: 1 }, undefined] as any)
        // Mock para buscarPorId retornando vazio
        .mockResolvedValueOnce([[], undefined] as any);

      await expect(repository.criar(vendaMock)).rejects.toThrow('Erro ao criar venda');
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar venda quando encontrada', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '85000',
        metodo_pagamento: 'cartao_credito',
        status: 'pendente',
        codigo_pagamento: 'PAG-123456',
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: null,
        webhook_notificado: 0,
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.buscarPorId('venda-123');

      expect(resultado).not.toBeNull();
      expect(resultado?.id).toBe('venda-123');
      expect(resultado?.veiculoId).toBe('1');
      expect(resultado?.status).toBe(StatusVenda.PENDENTE);
    });

    it('deve retornar null quando venda não encontrada', async () => {
      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await repository.buscarPorId('venda-inexistente');

      expect(resultado).toBeNull();
    });
  });

  describe('buscarPorCodigoPagamento', () => {
    it('deve retornar venda quando encontrada por código de pagamento', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '85000',
        metodo_pagamento: 'cartao_credito',
        status: 'pendente',
        codigo_pagamento: 'PAG-123456',
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: null,
        webhook_notificado: 0,
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.buscarPorCodigoPagamento('PAG-123456');

      expect(resultado).not.toBeNull();
      expect(resultado?.codigoPagamento).toBe('PAG-123456');
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE codigo_pagamento = ?'),
        ['PAG-123456']
      );
    });

    it('deve retornar null quando não encontrar por código de pagamento', async () => {
      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await repository.buscarPorCodigoPagamento('PAG-inexistente');

      expect(resultado).toBeNull();
    });
  });

  describe('buscarPorVeiculoId', () => {
    it('deve retornar lista de vendas por veículo', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '85000',
        metodo_pagamento: 'cartao_credito',
        status: 'aprovado',
        codigo_pagamento: 'PAG-123456',
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: new Date(),
        webhook_notificado: 1,
        tentativas_webhook: 1
      }], undefined] as any);

      const resultado = await repository.buscarPorVeiculoId('1');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].veiculoId).toBe('1');
      expect(resultado[0].status).toBe(StatusVenda.APROVADO);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE veiculo_id = ?'),
        ['1']
      );
    });

    it('deve retornar lista vazia quando não houver vendas para o veículo', async () => {
      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await repository.buscarPorVeiculoId('999');

      expect(resultado).toHaveLength(0);
    });
  });

  describe('buscarPorCpf', () => {
    it('deve retornar lista de vendas por CPF', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '85000',
        metodo_pagamento: 'cartao_credito',
        status: 'pendente',
        codigo_pagamento: 'PAG-123456',
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: null,
        webhook_notificado: 0,
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.buscarPorCpf('12345678901');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].cpfComprador).toBe('12345678901');
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE cpf_comprador = ?'),
        ['12345678901']
      );
    });
  });

  describe('atualizar', () => {
    it('deve atualizar dados da venda e retornar venda atualizada', async () => {
      const dadosAtualizacao = {
        codigoPagamento: 'PAG-NOVO-123',
        status: StatusVenda.PROCESSANDO,
        tentativasWebhook: 1
      };

      // Mock para UPDATE
      mockPool.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }, undefined] as any)
        // Mock para buscarPorId após atualização
        .mockResolvedValueOnce([[{
          id: 'venda-123',
          veiculo_id: '1',
          cpf_comprador: '12345678901',
          valor_pago: '85000',
          metodo_pagamento: 'cartao_credito',
          status: 'processando',
          codigo_pagamento: 'PAG-NOVO-123',
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_aprovacao: null,
          webhook_notificado: 0,
          tentativas_webhook: 1
        }], undefined] as any);

      const resultado = await repository.atualizar('venda-123', dadosAtualizacao);

      expect(resultado).not.toBeNull();
      expect(resultado?.codigoPagamento).toBe('PAG-NOVO-123');
      expect(resultado?.status).toBe(StatusVenda.PROCESSANDO);
      expect(resultado?.tentativasWebhook).toBe(1);
    });

    it('deve retornar null quando venda não encontrada para atualização', async () => {
      const dadosAtualizacao = {
        status: StatusVenda.APROVADO
      };

      // Mock para UPDATE
      mockPool.execute
        .mockResolvedValueOnce([{ affectedRows: 0 }, undefined] as any)
        // Mock para buscarPorId retornando null (venda não encontrada)
        .mockResolvedValueOnce([[], undefined] as any);

      const resultado = await repository.atualizar('venda-inexistente', dadosAtualizacao);

      expect(resultado).toBeNull();
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const dadosAtualizacao = {
        webhookNotificado: true
      };

      // Mock para UPDATE
      mockPool.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }, undefined] as any)
        // Mock para buscarPorId após atualização
        .mockResolvedValueOnce([[{
          id: 'venda-123',
          veiculo_id: '1',
          cpf_comprador: '12345678901',
          valor_pago: '85000',
          metodo_pagamento: 'cartao_credito',
          status: 'pendente',
          codigo_pagamento: null,
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_aprovacao: null,
          webhook_notificado: 1,
          tentativas_webhook: 0
        }], undefined] as any);

      const resultado = await repository.atualizar('venda-123', dadosAtualizacao);

      expect(resultado?.webhookNotificado).toBe(true);
      expect(resultado?.status).toBe(StatusVenda.PENDENTE); // Não alterado
    });

    it('deve tratar erro na atualização', async () => {
      const dadosAtualizacao = {
        status: StatusVenda.APROVADO
      };

      mockPool.execute.mockRejectedValue(new Error('Erro de SQL'));

      await expect(repository.atualizar('venda-123', dadosAtualizacao))
        .rejects.toThrow('Erro de SQL');
    });

    it('deve construir query de atualização corretamente com múltiplos campos', async () => {
      const dadosAtualizacao = {
        status: StatusVenda.APROVADO,
        codigoPagamento: 'PAG-999',
        webhookNotificado: true,
        tentativasWebhook: 2,
        dataAprovacao: new Date('2024-01-15T10:30:00Z')
      };

      // Mock para UPDATE
      mockPool.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }, undefined] as any)
        // Mock para buscarPorId após atualização
        .mockResolvedValueOnce([[{
          id: 'venda-123',
          veiculo_id: '1',
          cpf_comprador: '12345678901',
          valor_pago: '85000',
          metodo_pagamento: 'cartao_credito',
          status: 'aprovado',
          codigo_pagamento: 'PAG-999',
          data_criacao: new Date(),
          data_atualizacao: new Date(),
          data_aprovacao: new Date('2024-01-15T10:30:00Z'),
          webhook_notificado: 1,
          tentativas_webhook: 2
        }], undefined] as any);

      const resultado = await repository.atualizar('venda-123', dadosAtualizacao);

      expect(resultado).not.toBeNull();
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vendas SET'),
        expect.arrayContaining([
          StatusVenda.APROVADO,
          'PAG-999',
          true,
          2,
          dadosAtualizacao.dataAprovacao,
          'venda-123'
        ])
      );
    });
  });

  describe('atualizarStatus', () => {
    it('deve atualizar status da venda com data de aprovação', async () => {
      const dataAprovacao = new Date();
      mockPool.execute.mockResolvedValue([{ affectedRows: 1 }, undefined] as any);

      const resultado = await repository.atualizarStatus('venda-123', StatusVenda.APROVADO, dataAprovacao);

      expect(resultado).toBe(true);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vendas SET status = ?, data_aprovacao = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?'),
        [StatusVenda.APROVADO, dataAprovacao, 'venda-123']
      );
    });

    it('deve atualizar status da venda sem data de aprovação', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 1 }, undefined] as any);

      const resultado = await repository.atualizarStatus('venda-123', StatusVenda.REJEITADO);

      expect(resultado).toBe(true);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vendas SET status = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?'),
        [StatusVenda.REJEITADO, 'venda-123']
      );
    });

    it('deve retornar false quando nenhuma linha for afetada', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 0 }, undefined] as any);

      const resultado = await repository.atualizarStatus('venda-inexistente', StatusVenda.APROVADO);

      expect(resultado).toBe(false);
    });
  });

  describe('listarTodas', () => {
    it('deve listar vendas com limite e offset', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '85000',
        metodo_pagamento: 'cartao_credito',
        status: 'pendente',
        codigo_pagamento: 'PAG-123456',
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: null,
        webhook_notificado: 0,
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.listarTodas(10, 5);

      expect(resultado).toHaveLength(1);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        [10, 5]
      );
    });
  });

  describe('buscarVendasPendentesWebhook', () => {
    it('deve buscar vendas pendentes de webhook', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '85000',
        metodo_pagamento: 'cartao_credito',
        status: 'aprovado',
        codigo_pagamento: 'PAG-123456',
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: new Date(),
        webhook_notificado: 0,
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.buscarVendasPendentesWebhook();

      expect(resultado).toHaveLength(1);
      expect(resultado[0].status).toBe(StatusVenda.APROVADO);
      expect(resultado[0].webhookNotificado).toBe(false);
      expect(mockPool.execute).toHaveBeenCalled();
    });
  });

  describe('marcarWebhookNotificado', () => {
    it('deve marcar webhook como notificado', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 1 }, undefined] as any);

      const resultado = await repository.marcarWebhookNotificado('venda-123');

      expect(resultado).toBe(true);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vendas SET webhook_notificado = TRUE'),
        ['venda-123']
      );
    });

    it('deve retornar false quando nenhuma linha for afetada', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 0 }, undefined] as any);

      const resultado = await repository.marcarWebhookNotificado('venda-inexistente');

      expect(resultado).toBe(false);
    });
  });

  describe('incrementarTentativasWebhook', () => {
    it('deve incrementar tentativas de webhook', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 1 }, undefined] as any);

      const resultado = await repository.incrementarTentativasWebhook('venda-123');

      expect(resultado).toBe(true);
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vendas SET tentativas_webhook = tentativas_webhook + 1'),
        ['venda-123']
      );
    });

    it('deve retornar false quando nenhuma linha for afetada', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 0 }, undefined] as any);

      const resultado = await repository.incrementarTentativasWebhook('venda-inexistente');

      expect(resultado).toBe(false);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve propagar erro de banco em criar', async () => {
      const erro = new Error('Erro de conexão com banco');
      mockPool.execute.mockRejectedValue(erro);

      await expect(repository.criar(vendaMock)).rejects.toThrow('Erro de conexão com banco');
    });

    it('deve propagar erro de banco em buscarPorId', async () => {
      const erro = new Error('Erro SQL');
      mockPool.execute.mockRejectedValue(erro);

      await expect(repository.buscarPorId('venda-123')).rejects.toThrow('Erro SQL');
    });

    it('deve propagar erro de banco em buscarPorCodigoPagamento', async () => {
      const erro = new Error('Timeout de conexão');
      mockPool.execute.mockRejectedValue(erro);

      await expect(repository.buscarPorCodigoPagamento('PAG-123')).rejects.toThrow('Timeout de conexão');
    });

    it('deve propagar erro de banco em atualizarStatus', async () => {
      const erro = new Error('Constraint violation');
      mockPool.execute.mockRejectedValue(erro);

      await expect(repository.atualizarStatus('venda-123', StatusVenda.APROVADO)).rejects.toThrow('Constraint violation');
    });

    it('deve propagar erro de banco em marcarWebhookNotificado', async () => {
      const erro = new Error('Deadlock');
      mockPool.execute.mockRejectedValue(erro);

      await expect(repository.marcarWebhookNotificado('venda-123')).rejects.toThrow('Deadlock');
    });

    it('deve propagar erro de banco em incrementarTentativasWebhook', async () => {
      const erro = new Error('Table locked');
      mockPool.execute.mockRejectedValue(erro);

      await expect(repository.incrementarTentativasWebhook('venda-123')).rejects.toThrow('Table locked');
    });
  });

  describe('Casos extremos e validações', () => {
    it('deve lidar com resultados vazios em buscarPorVeiculoId', async () => {
      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await repository.buscarPorVeiculoId('veiculo-inexistente');

      expect(resultado).toHaveLength(0);
    });

    it('deve lidar com resultados vazios em buscarPorCpf', async () => {
      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await repository.buscarPorCpf('00000000000');

      expect(resultado).toHaveLength(0);
    });

    it('deve lidar com resultados vazios em buscarVendasPendentesWebhook', async () => {
      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await repository.buscarVendasPendentesWebhook();

      expect(resultado).toHaveLength(0);
    });

    it('deve lidar com resultados vazios em listarTodas', async () => {
      mockPool.execute.mockResolvedValue([[], undefined] as any);

      const resultado = await repository.listarTodas();

      expect(resultado).toHaveLength(0);
    });

    it('deve converter valores monetários corretamente', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '123456.78', // String com decimal
        metodo_pagamento: 'pix',
        status: 'aprovado',
        codigo_pagamento: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: null,
        webhook_notificado: 0,
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.buscarPorId('venda-123');

      expect(resultado?.valorPago).toBe(123456.78);
    });

    it('deve converter boolean corretamente do banco (0/1)', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '50000',
        metodo_pagamento: 'pix',
        status: 'aprovado',
        codigo_pagamento: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: null,
        webhook_notificado: 1, // Valor numérico do banco
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.buscarPorId('venda-123');

      expect(resultado?.webhookNotificado).toBe(true);
    });

    it('deve lidar com dataAprovacao null corretamente', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '50000',
        metodo_pagamento: 'pix',
        status: 'pendente',
        codigo_pagamento: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: null,
        webhook_notificado: 0,
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.buscarPorId('venda-123');

      expect(resultado?.dataAprovacao).toBeUndefined();
    });

    it('deve lidar com codigoPagamento null corretamente', async () => {
      mockPool.execute.mockResolvedValue([[{
        id: 'venda-123',
        veiculo_id: '1',
        cpf_comprador: '12345678901',
        valor_pago: '50000',
        metodo_pagamento: 'pix',
        status: 'pendente',
        codigo_pagamento: null,
        data_criacao: new Date(),
        data_atualizacao: new Date(),
        data_aprovacao: null,
        webhook_notificado: 0,
        tentativas_webhook: 0
      }], undefined] as any);

      const resultado = await repository.buscarPorId('venda-123');

      expect(resultado?.codigoPagamento).toBeNull();
    });
  });
});
