import { Router } from 'express';
import { VendaController, validarCriarVenda, validarBuscarVendaPorId, validarListarVendas, validarWebhookPagamento } from '../controllers/VendaController';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * @swagger
 * tags:
 *   - name: Vendas
 *     description: Operações relacionadas a vendas de veículos
 */

const router = Router();

/**
 * @swagger
 * /api/vendas:
 *   post:
 *     summary: Criar uma nova venda
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
 *                 description: Valor pago pelo veículo
 *               metodoPagamento:
 *                 type: string
 *                 enum: [pix, cartao_credito, cartao_debito, boleto, transferencia]
 *                 description: Método de pagamento
 *     responses:
 *       201:
 *         description: Venda criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Veículo já foi vendido
 */
router.post('/vendas', validarCriarVenda, VendaController.criarVenda);

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
router.get('/vendas/:id', validarBuscarVendaPorId, VendaController.buscarVendaPorId);

/**
 * @swagger
 * /api/vendas:
 *   get:
 *     summary: Listar vendas
 *     description: Lista vendas com controle de acesso - Admins veem todas as vendas, usuários comuns veem apenas suas próprias vendas
 *     tags: [Vendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cpf
 *         schema:
 *           type: string
 *         description: CPF do comprador para filtrar (apenas para admins)
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
 *         description: Número máximo de registros (apenas para admins)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de registros para pular (apenas para admins)
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
router.get('/vendas', authMiddleware, validarListarVendas, VendaController.listarVendas);

router.post('/webhook/pagamento', validarWebhookPagamento, VendaController.processarWebhookPagamento);

router.post('/admin/webhook/processar', VendaController.processarWebhooksPendentes);

export default router;
