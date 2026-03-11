export type ProjectStatus = 'Planejamento' | 'Em Andamento' | 'Atrasado' | 'Concluído';

export interface TCPOItem {
  id: string;
  categoria: string;
  descricao: string;
  unidade: string;
  custo_mo: number;
  custo_mat: number;
  custo_eq: number;
  bdi_padrao: number;
  composicao?: unknown[];
}

export interface Budget {
  id: string;
  projeto_id: string;
  nome: string;
  descricao?: string;
  total_mo: number;
  total_mat: number;
  total_eq: number;
  total_geral: number;
  created_at: string;
}

export interface BudgetItem {
  id: string;
  orcamento_id: string;
  tcpo_id: string;
  descricao_personalizada?: string;
  quantidade: number;
  unidade?: string;
  custo_unit_mo: number;
  custo_unit_mat: number;
  custo_unit_eq: number;
  bdi: number;
  observacao?: string;
  ordem: number;
}

export interface Project {
  id: string;
  nome: string;
  id_contrato?: string;
  status: ProjectStatus;
  orcamento: number;
  gasto: number;
  saldo?: number;
  liquidez: number;
  localizacao?: string;
  fase?: string;
  created_at: string;
  updated_at: string;
}
