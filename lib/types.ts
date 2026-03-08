export type ProjectStatus = 'Planejamento' | 'Em Andamento' | 'Atrasado' | 'Concluído';

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
