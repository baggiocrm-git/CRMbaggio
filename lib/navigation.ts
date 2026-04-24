export const AUXILIAR_ADMIN_NIVEL_1 = 'Auxiliar Administrativo Nível 1';
export const AUXILIAR_ADMIN_NIVEL_2 = 'Auxiliar Administrativo Nível 2';
export const ADMINISTRATIVO_FINANCEIRO_1 = 'Administrativo Financeiro 1';
export const ADMINISTRATIVO_FINANCEIRO_2 = 'Administrativo Financeiro 2';

export type InternalRole =
  | 'Administrador'
  | 'Administrador Master'
  | 'Administrador Financeiro'
  | typeof ADMINISTRATIVO_FINANCEIRO_1
  | typeof ADMINISTRATIVO_FINANCEIRO_2
  | 'Usuário'
  | typeof AUXILIAR_ADMIN_NIVEL_1
  | typeof AUXILIAR_ADMIN_NIVEL_2
  | 'Cliente'
  | string
  | null
  | undefined;

export type HubModule = {
  id: string;
  title: string;
  shortTitle?: string;
  href: string;
  description: string;
  angle: number;
  matcherPrefixes: string[];
};

function normalizeRole(role: InternalRole) {
  return String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function roleMatches(role: InternalRole, candidates: string[]) {
  const normalized = normalizeRole(role);
  return candidates.some((candidate) => normalizeRole(candidate) === normalized);
}

export function isAdminRole(role: InternalRole) {
  return roleMatches(role, ['Administrador', 'Administrador Master', 'Administrador Financeiro']);
}

export function isAuxAdminLevel1Role(role: InternalRole) {
  return roleMatches(role, [AUXILIAR_ADMIN_NIVEL_1]);
}

export function isAuxAdminLevel2Role(role: InternalRole) {
  return roleMatches(role, [AUXILIAR_ADMIN_NIVEL_2]);
}

export function isFinancialAdminLevel1Role(role: InternalRole) {
  return roleMatches(role, [
    ADMINISTRATIVO_FINANCEIRO_1,
    'Administrativo Financeiro Nível 1',
    'Administrativo Financeiro Nivel 1',
    'Admin Financeiro 1',
  ]);
}

export function isFinancialAdminLevel2Role(role: InternalRole) {
  return roleMatches(role, [
    ADMINISTRATIVO_FINANCEIRO_2,
    'Administrativo Financeiro Nível 2',
    'Administrativo Financeiro Nivel 2',
    'Admin Financeiro 2',
  ]);
}

export function getFinanceEntryPathForRole(role: InternalRole) {
  if (isAdminRole(role)) return '/finances';
  if (isFinancialAdminLevel2Role(role)) return '/finances/invoices';
  return '/finances/payables';
}

export function getRoleFromUser(
  user:
    | {
        user_metadata?: Record<string, unknown> | null;
        app_metadata?: Record<string, unknown> | null;
      }
    | null
    | undefined
) {
  const userRole = user?.user_metadata?.role;
  if (typeof userRole === 'string' && userRole.trim()) {
    return userRole;
  }

  const appRole = user?.app_metadata?.role;
  if (typeof appRole === 'string' && appRole.trim()) {
    return appRole;
  }

  return null;
}

export const HUB_MODULES: HubModule[] = [
  {
    id: 'obras',
    title: 'Obras',
    href: '/projects',
    description: 'Projetos, acompanhamento de obra e execução.',
    angle: 270,
    matcherPrefixes: ['/projects'],
  },
  {
    id: 'agenda',
    title: 'Agenda',
    href: '/calendar',
    description: 'Compromissos, eventos e marcos operacionais.',
    angle: 306,
    matcherPrefixes: ['/calendar'],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    href: '/finances',
    description: 'Painel financeiro, recebíveis e faturamento.',
    angle: 342,
    matcherPrefixes: ['/finances', '/finances/receivables', '/finances/invoices'],
  },
  {
    id: 'engenharia',
    title: 'Engenharia',
    href: '/finances/budget',
    description: 'Orçamento técnico e planejamento de engenharia.',
    angle: 5,
    matcherPrefixes: ['/finances/budget'],
  },
  {
    id: 'suprimentos',
    title: 'Suprimentos',
    href: '/finances/insumos',
    description: 'Insumos, compras e apoio ao canteiro.',
    angle: 36,
    matcherPrefixes: ['/finances/insumos', '/finances/services'],
  },
  {
    id: 'config',
    title: 'Config.',
    href: '/settings',
    description: 'Preferências, integrações e parâmetros do sistema.',
    angle: 90,
    matcherPrefixes: ['/settings'],
  },
  {
    id: 'rh',
    title: 'Recursos Humanos',
    shortTitle: 'R.H.',
    href: '/staff',
    description: 'Equipe, estrutura e rotinas administrativas.',
    angle: 144,
    matcherPrefixes: ['/staff'],
  },
  {
    id: 'contabil',
    title: 'Contábil',
    href: '/finances/invoices',
    description: 'Contas a pagar e conciliação operacional.',
    angle: 170,
    matcherPrefixes: ['/finances/invoices'],
  },
  {
    id: 'contatos',
    title: 'Contatos',
    href: '/contacts',
    description: 'Clientes, fornecedores e parceiros.',
    angle: 201,
    matcherPrefixes: ['/contacts'],
  },
  {
    id: 'documentos',
    title: 'Documentos',
    href: '/documents',
    description: 'Arquivos, templates e histórico documental.',
    angle: 234,
    matcherPrefixes: ['/documents'],
  },
];

const FULL_ACCESS_ROLES = [
  'Administrador',
  'Administrador Master',
  'Administrador Financeiro',
  'Usuário',
];

const AUX_1_PREFIXES = [
  '/dashboard',
  '/calendar',
  '/contacts',
  '/staff',
  '/documents',
  '/finances/receivables',
  '/finances/payables',
  '/finances/cost-centers',
  '/finances/invoices',
  '/settings',
];

const AUX_2_PREFIXES = [
  '/dashboard',
  '/calendar',
  '/contacts',
  '/staff',
  '/documents',
  '/settings',
];

const FINANCIAL_LEVEL_1_PREFIXES = [
  '/finances/receivables',
  '/finances/payables',
];

const FINANCIAL_LEVEL_2_PREFIXES = [
  '/finances/invoices',
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function canAccessPathForRole(role: InternalRole, pathname: string | null | undefined) {
  if (!pathname) return false;
  if (pathname.startsWith('/client/')) return roleMatches(role, ['Cliente']);
  if (roleMatches(role, ['Cliente'])) return false;

  if (FULL_ACCESS_ROLES.some((candidate) => roleMatches(role, [candidate]))) return true;
  if (isAuxAdminLevel1Role(role)) {
    return matchesPrefix(pathname, AUX_1_PREFIXES);
  }
  if (isAuxAdminLevel2Role(role)) return matchesPrefix(pathname, AUX_2_PREFIXES);
  if (isFinancialAdminLevel1Role(role)) return matchesPrefix(pathname, FINANCIAL_LEVEL_1_PREFIXES);
  if (isFinancialAdminLevel2Role(role)) return matchesPrefix(pathname, FINANCIAL_LEVEL_2_PREFIXES);

  return false;
}

export function getDefaultPathForRole(role: InternalRole) {
  if (roleMatches(role, ['Cliente'])) return '/login';
  if (isAuxAdminLevel1Role(role)) return '/dashboard';
  if (isFinancialAdminLevel1Role(role)) return '/finances/payables';
  if (isFinancialAdminLevel2Role(role)) return '/finances/invoices';
  return '/dashboard';
}

export function findModuleByPath(pathname: string | null | undefined) {
  if (!pathname) return null;
  return (
    HUB_MODULES
      .filter((module) => matchesPrefix(pathname, module.matcherPrefixes))
      .sort((left, right) => {
        const leftLongest = Math.max(...left.matcherPrefixes.map((prefix) => prefix.length));
        const rightLongest = Math.max(...right.matcherPrefixes.map((prefix) => prefix.length));
        return rightLongest - leftLongest;
      })[0] ?? null
  );
}
