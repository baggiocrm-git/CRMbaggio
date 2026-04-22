export const AUXILIAR_ADMIN_NIVEL_1 = 'Auxiliar Administrativo Nível 1';
export const AUXILIAR_ADMIN_NIVEL_2 = 'Auxiliar Administrativo Nível 2';

export type InternalRole =
  | 'Administrador'
  | 'Administrador Master'
  | 'Administrador Financeiro'
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
    href: '/finances/payables',
    description: 'Contas a pagar e conciliação operacional.',
    angle: 170,
    matcherPrefixes: ['/finances/payables', '/finances/cost-centers'],
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

const FULL_ACCESS_ROLES = new Set([
  'Administrador',
  'Administrador Master',
  'Administrador Financeiro',
  'Usuário',
]);

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

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function canAccessPathForRole(role: InternalRole, pathname: string | null | undefined) {
  if (!pathname) return false;
  if (pathname.startsWith('/client/')) return role === 'Cliente';
  if (role === 'Cliente') return false;
  if (pathname === '/dashboard') return true;

  if (role && FULL_ACCESS_ROLES.has(role)) return true;
  if (role === AUXILIAR_ADMIN_NIVEL_1) {
    return pathname === '/finances' || matchesPrefix(pathname, AUX_1_PREFIXES);
  }
  if (role === AUXILIAR_ADMIN_NIVEL_2) return matchesPrefix(pathname, AUX_2_PREFIXES);

  return false;
}

export function getDefaultPathForRole(role: InternalRole) {
  if (role === 'Cliente') return '/login';
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
