export type ProjectStatus = 'Planejamento' | 'Em Andamento' | 'Atrasado' | 'Concluído';

export interface TCPOItem {
  id: string;
  categoria: string;
  descricao: string;
  unidade: string;
  custo_mo: number;
  custo_mat: number;
  custo_eq: number;
  custo_sabado?: number;
  custo_domingo_feriado?: number;
  bdi_padrao: number;
  composicao?: {
    insumo: string;
    un: string;
    coef: number;
    p_unit: number;
    p_total: number;
    tipo: 'mo' | 'mat' | 'eq';
  }[];
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
  variacao_anual?: number;
  created_at: string;
}

export interface Insumo {
  id: string;
  descricao: string;
  unidade: string;
  preco_unitario: number;
  preco_sabado?: number;
  preco_domingo_feriado?: number;
  tipo: 'mo' | 'mat' | 'eq';
}

export interface CompositionItem {
  codigo?: string;
  insumo: string;
  un: string;
  coef: number;
  p_unit: number;
  p_total: number;
  tipo: 'mo' | 'mat' | 'eq';
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
  composicao?: CompositionItem[];
}

export interface RDO {
  id: string;
  projeto_id: string;
  data: string;
  clima_manha: string;
  clima_tarde: string;
  mao_de_obra: { funcao: string; quantidade: number }[];
  equipamentos: { nome: string; quantidade: number; status: string }[];
  atividades: string;
  ocorrencias: string;
  fotos: string[];
  assinatura_responsavel: string;
  created_at: string;
  updated_at: string;
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
  cliente_id?: string;
  has_rdo?: boolean;
  created_at: string;
  updated_at: string;
}
