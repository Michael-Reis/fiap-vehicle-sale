import { Request, Response } from 'express';
import { VendaService } from '../../../domain/services/VendaService';
import { WebhookService } from '../../../domain/services/WebhookService';
import { MySQLVendaRepository } from '../../repositories/MySQLVendaRepository';
import { CriarVendaRequest, WebhookPagamento, MetodoPagamento } from '../../../domain/entities/Venda';
import { body, param, query, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const vendaRepository = new MySQLVendaRepository();
const vendaService = new VendaService(vendaRepository);
const webhookService = new WebhookService();

export class VendaController {
  
  /**
   * @swagger
   * /api/vendas:
   *   post:
   *     summary: Criar uma nova venda
   *     description: Cria uma nova venda validando se o valor pago corresponde ao preço do veículo e se o veículo está disponível
   *     tags: [Vendas]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - veiculoId
   *               - cpfComprador
   *               - valorPago
   *               - metodoPagamento
   *             properties:
   *               veiculoId:
   *                 type: string
   *                 description: ID do veículo
   *               cpfComprador:
   *                 type: string
   *                 description: CPF do comprador (11 dígitos)
   *               valorPago:
   *                 type: number
   *                 description: Valor pago pelo veículo (deve corresponder exatamente ao preço do veículo)
   *               metodoPagamento:
   *                 type: string
   *                 enum: [pix, cartao_credito, cartao_debito, boleto, transferencia]
   *                 description: Método de pagamento
   *     responses:
   *       201:
   *         description: Venda criada com sucesso
   *       400:
   *         description: Dados inválidos (CPF inválido, valor incorreto, etc.)
   *       404:
   *         description: Veículo não encontrado
   *       409:
   *         description: Veículo já foi vendido ou não está disponível para venda
   *       500:
   *         description: Erro interno do servidor
   */
  static async criarVenda(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
        return;
      }

      const vendaRequest: CriarVendaRequest = req.body;
      const venda = await vendaService.criarVenda(vendaRequest);

      res.status(201).json({
        success: true,
        message: 'Venda criada com sucesso',
        data: venda
      });
    } catch (error: any) {
      console.error('Erro ao criar venda:', error);
      
      if (error.message === 'CPF inválido' || 
          error.message === 'Valor pago deve ser maior que zero' ||
          error.message === 'Erro ao processar valores monetários' ||
          error.message?.includes('Valor pago') ||
          error.message?.includes('não corresponde ao preço do veículo')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message === 'Veículo não encontrado') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      if (error.message === 'Veículo já foi vendido' ||
          error.message === 'Veículo não está disponível para venda') {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/vendas/{id}:
   *   get:
   *     summary: Buscar venda por ID
   *     tags: [Vendas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da venda
   *     responses:
   *       200:
   *         description: Venda encontrada
   *       404:
   *         description: Venda não encontrada
   */
  static async buscarVendaPorId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID inválido',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const venda = await vendaService.buscarVendaPorId(id);

      if (!venda) {
        res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: venda
      });
    } catch (error) {
      console.error('Erro ao buscar venda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/vendas:
   *   get:
   *     summary: Listar vendas
   *     description: Lista vendas do usuário autenticado. Admins podem ver todas as vendas, usuários comuns apenas suas próprias vendas.
   *     tags: [Vendas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: veiculoId
   *         schema:
   *           type: string
   *         description: ID do veículo para filtrar
   *       - in: query
   *         name: limite
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Número máximo de registros
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Número de registros para pular
   *     responses:
   *       200:
   *         description: Lista de vendas
   *       401:
   *         description: Token de acesso inválido ou não fornecido
   *       400:
   *         description: Parâmetros inválidos
   *       500:
   *         description: Erro interno do servidor
   */
  static async listarVendas(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Parâmetros inválidos',
          errors: errors.array()
        });
        return;
      }

      const { veiculoId, limite = 50, offset = 0 } = req.query;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      let vendas;

      // Se for admin, pode ver todas as vendas
      if (user.tipo === 'ADMIN') {
        if (veiculoId) {
          vendas = await vendaService.buscarVendasPorVeiculo(veiculoId as string);
        } else {
          vendas = await vendaService.listarVendas(Number(limite), Number(offset));
        }
      } else {
        // Se for usuário comum, só pode ver suas próprias vendas
        if (!user.cpf) {
          res.status(400).json({
            success: false,
            message: 'CPF do usuário não encontrado no token'
          });
          return;
        }

        // Usuário comum só pode ver suas próprias vendas
        if (veiculoId) {
          // Busca por veículo, mas filtra pelo CPF do usuário
          const todasVendasVeiculo = await vendaService.buscarVendasPorVeiculo(veiculoId as string);
          vendas = todasVendasVeiculo.filter(venda => venda.cpfComprador === user.cpf);
        } else {
          // Lista apenas as vendas do usuário
          vendas = await vendaService.buscarVendasPorCpf(user.cpf);
        }
      }

      res.json({
        success: true,
        data: vendas,
        total: vendas.length
      });
    } catch (error: any) {
      console.error('Erro ao listar vendas:', error);
      
      if (error.message === 'CPF inválido') {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async processarWebhookPagamento(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados do webhook inválidos',
          errors: errors.array()
        });
        return;
      }

      const webhook: WebhookPagamento = req.body;
      
      const vendaAtualizada = await vendaService.processarPagamento(
        webhook.codigoPagamento, 
        webhook.status
      );

      if (!vendaAtualizada) {
        res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
        return;
      }

      // Se foi aprovado, processar webhook em background (será pego pelo cronjob)
      if (webhook.status === 'aprovado') {
        console.log(`Venda ${vendaAtualizada.id} aprovada. Será notificada via webhook pelo cronjob.`);
      }

      res.json({
        success: true,
        message: 'Pagamento processado com sucesso',
        data: vendaAtualizada
      });
    } catch (error: any) {
      console.error('Erro ao processar webhook de pagamento:', error);
      
      if (error.message === 'Venda não encontrada' || error.message === 'Venda já foi processada') {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async processarWebhooksPendentes(req: Request, res: Response): Promise<void> {
    try {
      // Executar em background
      setImmediate(() => {
        webhookService.processarWebhooksPendentes();
      });

      res.json({
        success: true,
        message: 'Processamento de webhooks pendentes iniciado'
      });
    } catch (error) {
      console.error('Erro ao processar webhooks pendentes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

// Validações para criação de venda
export const validarCriarVenda = [
  body('veiculoId')
    .notEmpty()
    .withMessage('ID do veículo é obrigatório')
    .isString()
    .withMessage('ID do veículo deve ser uma string'),
  
  body('cpfComprador')
    .notEmpty()
    .withMessage('CPF do comprador é obrigatório')
    .isString()
    .withMessage('CPF deve ser uma string')
    .isLength({ min: 11, max: 11 })
    .withMessage('CPF deve ter 11 dígitos'),
  
  body('valorPago')
    .isNumeric()
    .withMessage('Valor pago deve ser um número')
    .isFloat({ min: 0.01 })
    .withMessage('Valor pago deve ser maior que zero'),
  
  body('metodoPagamento')
    .isIn(Object.values(MetodoPagamento))
    .withMessage('Método de pagamento inválido')
];

// Validações para buscar venda por ID
export const validarBuscarVendaPorId = [
  param('id')
    .notEmpty()
    .withMessage('ID da venda é obrigatório')
    .isUUID()
    .withMessage('ID da venda deve ser um UUID válido')
];

// Validações para listar vendas
export const validarListarVendas = [
  query('cpf')
    .optional()
    .isLength({ min: 11, max: 11 })
    .withMessage('CPF deve ter 11 dígitos'),
  
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser um número maior ou igual a 0')
];

// Validações para webhook de pagamento
export const validarWebhookPagamento = [
  body('codigoPagamento')
    .notEmpty()
    .withMessage('Código de pagamento é obrigatório'),
  
  body('status')
    .isIn(['aprovado', 'rejeitado'])
    .withMessage('Status deve ser aprovado ou rejeitado'),
  
  body('veiculoId')
    .notEmpty()
    .withMessage('ID do veículo é obrigatório'),
  
  body('cpfComprador')
    .notEmpty()
    .withMessage('CPF do comprador é obrigatório'),
  
  body('valorPago')
    .isNumeric()
    .withMessage('Valor pago deve ser um número'),
  
  body('metodoPagamento')
    .notEmpty()
    .withMessage('Método de pagamento é obrigatório'),
  
  body('dataTransacao')
    .isISO8601()
    .withMessage('Data da transação deve estar no formato ISO 8601')
];
