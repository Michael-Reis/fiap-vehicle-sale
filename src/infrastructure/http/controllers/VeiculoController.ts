import { Request, Response } from 'express';
import { ExternalVeiculoService, ListarVeiculosParams } from '../../services/ExternalVeiculoService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class VeiculoController {
  private veiculoService: ExternalVeiculoService;

  constructor() {
    this.veiculoService = new ExternalVeiculoService();
  }

  async listarVeiculosAVenda(req: Request, res: Response): Promise<void> {
    try {
      const {
        marca,
        modelo,
        anoMin,
        anoMax,
        precoMin,
        precoMax
      } = req.query;

      const params: Omit<ListarVeiculosParams, 'status'> = {};

      if (marca) params.marca = marca as string;
      if (modelo) params.modelo = modelo as string;
      if (anoMin) params.anoMin = parseInt(anoMin as string);
      if (anoMax) params.anoMax = parseInt(anoMax as string);
      if (precoMin) params.precoMin = parseFloat(precoMin as string);
      if (precoMax) params.precoMax = parseFloat(precoMax as string);

      const result = await this.veiculoService.listarVeiculosAVenda(params);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Veículos à venda listados com sucesso'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Erro ao listar veículos à venda'
        });
      }
    } catch (error: any) {
      console.error('Erro no controller ao listar veículos à venda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async listarVeiculosVendidos(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        marca,
        modelo,
        anoMin,
        anoMax,
        precoMin,
        precoMax
      } = req.query;

      const params: Omit<ListarVeiculosParams, 'status'> = {};

      if (marca) params.marca = marca as string;
      if (modelo) params.modelo = modelo as string;
      if (anoMin) params.anoMin = parseInt(anoMin as string);
      if (anoMax) params.anoMax = parseInt(anoMax as string);
      if (precoMin) params.precoMin = parseFloat(precoMin as string);
      if (precoMax) params.precoMax = parseFloat(precoMax as string);

      // Extrair token do header Authorization
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

      const result = await this.veiculoService.listarVeiculosVendidos(params, token);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Veículos vendidos listados com sucesso'
        });
      } else {
        // Extrair código de status da mensagem de erro se presente
        const errorMessage = result.message || 'Erro ao listar veículos vendidos';
        const statusMatch = errorMessage.match(/Erro (\d{3}):/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : 400;
        
        res.status(statusCode).json({
          success: false,
          message: errorMessage
        });
      }
    } catch (error: any) {
      console.error('Erro no controller ao listar veículos vendidos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }


}
