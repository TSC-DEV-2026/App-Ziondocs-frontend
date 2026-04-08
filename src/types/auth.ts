export interface EmpresaMatricula {
  id: string;
  nome: string;
  matricula: string;
}

export interface User {
  nome: string;
  email: string;
  matricula?: string;
  gestor: boolean;
  cpf: string;
  cliente?: string;
  centro_de_custo?: string;
  dados?: EmpresaMatricula[];
  rh?: boolean;
  interno?: boolean;
  senha_trocada?: boolean | null;
}

export type LoginPayload = {
  usuario: string;
  senha: string;
};