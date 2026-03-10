export const COST_CATEGORIES = [
  'Material',
  'Mão de Obra',
  'Taxas e Emolumentos',
  'Equipamentos',
  'Diversos'
] as const;

export const CONSTRUCTION_STAGES = [
  'SERVIÇOS PRELIMINARES E ADMINISTRATIVOS',
  'FUNDAÇÕES',
  'SUPERESTRUTURA',
  'SISTEMAS DE VEDAÇÃO VERTICAL',
  'COBERTURA',
  'PAVIMENTAÇÃO E REVESTIMENTOS INTERNO',
  'ESQUADRIAS',
  'PINTURA',
  'INSTALAÇÃO ELÉTRICA',
  'INSTALAÇÃO HIDRÁULICA',
  'INSTALAÇÃO SANITÁRIA',
  'LOUÇAS E METAIS',
  'POÇO',
  'PÓRTICO E CAIXA D\'ÁGUA',
  'SERVIÇOS FINAIS'
] as const;

export type CostCategory = typeof COST_CATEGORIES[number];
export type ConstructionStage = typeof CONSTRUCTION_STAGES[number];
