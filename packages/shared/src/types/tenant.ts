export interface Empresa {
  id: string;
  nome: string;
  nomeFantasia?: string;
  cnpj?: string;
  ativo: boolean;
}

export interface Unidade {
  id: string;
  empresaId: string;
  nome: string;
  ativo: boolean;
}
