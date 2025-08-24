import { Router } from 'express';
import { VeiculoController } from '../controllers/VeiculoController';

const router = Router();
const veiculoController = new VeiculoController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Veiculo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         marca:
 *           type: string
 *           example: "Toyota"
 *         modelo:
 *           type: string
 *           example: "Corolla"
 *         ano:
 *           type: integer
 *           example: 2023
 *         preco:
 *           type: number
 *           example: 85000.00
 *         status:
 *           type: string
 *           enum: [A_VENDA, VENDIDO, RESERVADO]
 *           example: "A_VENDA"
 *         cor:
 *           type: string
 *           example: "Branco"
 *         kilometragem:
 *           type: number
 *           example: 15000
 *         combustivel:
 *           type: string
 *           example: "Flex"
 *         transmissao:
 *           type: string
 *           example: "Automático"
 *         descricao:
 *           type: string
 *           example: "Veículo em excelente estado"
 *         criadoEm:
 *           type: string
 *           format: date-time
 *         atualizadoEm:
 *           type: string
 *           format: date-time
 *     
 *     VeiculosResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Veiculo'
 *         message:
 *           type: string
 *           example: "Veículos listados com sucesso"
 */

/**
 * @swagger
 * /api/veiculos/a-venda:
 *   get:
 *     summary: Listar veículos à venda
 *     description: Lista todos os veículos disponíveis para venda com opções de filtro e ordenação por preço
 *     tags: [Veículos]
 *     parameters:
 *       - in: query
 *         name: marca
 *         schema:
 *           type: string
 *         description: Filtrar por marca
 *         example: Toyota
 *       - in: query
 *         name: modelo
 *         schema:
 *           type: string
 *         description: Filtrar por modelo
 *         example: Corolla
 *       - in: query
 *         name: anoMin
 *         schema:
 *           type: integer
 *         description: Ano mínimo
 *         example: 2020
 *       - in: query
 *         name: anoMax
 *         schema:
 *           type: integer
 *         description: Ano máximo
 *         example: 2024
 *       - in: query
 *         name: precoMin
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *         example: 50000
 *       - in: query
 *         name: precoMax
 *         schema:
 *           type: number
 *         description: Preço máximo
 *         example: 100000
 *       - in: query
 *         name: ordem
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Ordenação por preço (ASC = mais barato para mais caro, DESC = mais caro para mais barato)
 *         example: ASC
 *     responses:
 *       200:
 *         description: Veículos à venda listados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VeiculosResponse'
 *       400:
 *         description: Erro na solicitação
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/a-venda', veiculoController.listarVeiculosAVenda.bind(veiculoController));

export default router;
