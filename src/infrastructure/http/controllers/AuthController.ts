import { Request, Response } from 'express';
import { ExternalAuthenticationService } from '../../services/ExternalAuthenticationService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AuthController {
  private authService: ExternalAuthenticationService;

  constructor() {
    this.authService = new ExternalAuthenticationService();
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        res.status(400).json({ 
          success: false,
          error: 'Email e senha são obrigatórios'
        });
        return;
      }

      const result = await this.authService.login(email, senha);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async registrar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha, cpf, telefone, endereco } = req.body;

      // Validações básicas
      if (!nome || !email || !senha || !cpf) {
        res.status(400).json({ 
          success: false,
          error: 'Dados obrigatórios faltando',
          details: 'Nome, email, senha e CPF são obrigatórios'
        });
        return;
      }

      const result = await this.authService.registrar({
        nome,
        email,
        senha,
        cpf,
        telefone,
        endereco
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}
