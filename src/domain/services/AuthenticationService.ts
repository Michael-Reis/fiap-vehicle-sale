export interface AuthenticationService {
  login(email: string, senha: string): Promise<LoginResult>;
  registrar(dadosUsuario: RegistroUsuarioInput): Promise<RegistroResult>;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
  };
  message?: string;
  error?: string;
}

export interface RegistroUsuarioInput {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone?: string;
  endereco?: string;
}

export interface RegistroResult {
  success: boolean;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
  };
  message?: string;
  error?: string;
}
