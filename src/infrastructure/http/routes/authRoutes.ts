import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - senha
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "cliente@exemplo.com"
 *         senha:
 *           type: string
 *           example: "senha123"
 *     
 *     RegistroInput:
 *       type: object
 *       required:
 *         - nome
 *         - email
 *         - senha
 *         - cpf
 *       properties:
 *         nome:
 *           type: string
 *           example: "João Silva"
 *         email:
 *           type: string
 *           format: email
 *           example: "joao@exemplo.com"
 *         senha:
 *           type: string
 *           example: "senha123"
 *         cpf:
 *           type: string
 *           example: "12345678901"
 *         telefone:
 *           type: string
 *           example: "11999999999"
 *         endereco:
 *           type: string
 *           example: "Rua das Flores, 123"
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         usuario:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nome:
 *               type: string
 *             email:
 *               type: string
 *             tipo:
 *               type: string
 *         message:
 *           type: string
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Autenticação]
 *     summary: Fazer login no sistema
 *     description: Autentica um usuário através do serviço principal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * @swagger
 * /api/auth/registrar:
 *   post:
 *     tags: [Autenticação]
 *     summary: Registrar novo cliente
 *     description: Registra um novo cliente através do serviço principal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroInput'
 *     responses:
 *       201:
 *         description: Cliente registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/registrar', (req, res) => authController.registrar(req, res));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Autenticação]
 *     summary: Obter dados do usuário autenticado
 *     description: Retorna os dados do usuário logado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     tipo:
 *                       type: string
 *       401:
 *         description: Token inválido ou não fornecido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;
