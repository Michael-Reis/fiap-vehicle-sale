import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    tipo: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || authHeader.trim() === '') {
      res.status(401).json({ 
        success: false,
        message: 'Token de acesso não fornecido' 
      });
      return;
    }

    const trimmedHeader = authHeader.trim();
    
    // Verificar se o formato é Bearer token
    if (!trimmedHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false,
        message: 'Formato de token inválido' 
      });
      return;
    }

    const token = trimmedHeader.replace('Bearer ', '').trim();

    if (!token) {
      res.status(401).json({ 
        success: false,
        message: 'Token de acesso não fornecido' 
      });
      return;
    }

    const decoded = jwt.decode(token) as any;

    if (!decoded) {
      res.status(401).json({ 
        success: false,
        message: 'Token inválido' 
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      tipo: decoded.tipo
    };

    next();
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: 'Erro interno de autenticação' 
    });
  }
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {

  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
    return;
  }


  if (req.user.tipo !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores têm acesso a este recurso'
    });
    return;
  }


  console.log("acessei o admin middleware")
  next();
};
