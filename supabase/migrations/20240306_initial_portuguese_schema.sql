-- Initial schema for CBSL CRM in Portuguese
-- This script creates the tables from scratch with Portuguese names

-- 1. Contatos (Clientes, Fornecedores, Parceiros)
CREATE TABLE IF NOT EXISTS contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  pessoa_contato TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Cliente', 'Fornecedor', 'Parceiro')),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pendente', 'Inativo')),
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  iniciais TEXT NOT NULL,
  cor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Projetos
CREATE TABLE IF NOT EXISTS projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  id_contrato TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planejamento' CHECK (status IN ('Planejamento', 'Em Andamento', 'Atrasado', 'Concluído')),
  orcamento NUMERIC(15, 2) NOT NULL,
  gasto NUMERIC(15, 2) NOT NULL DEFAULT 0,
  saldo NUMERIC(15, 2) GENERATED ALWAYS AS (orcamento - gasto) STORED,
  liquidez INTEGER NOT NULL DEFAULT 0 CHECK (liquidez >= 0 AND liquidez <= 100),
  localizacao TEXT NOT NULL,
  fase TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Equipe (Staff)
CREATE TABLE IF NOT EXISTS equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  id_funcionario TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Em Licença', 'Inativo')),
  url_imagem TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Documentos
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  tamanho_arquivo TEXT NOT NULL,
  nome_icone TEXT NOT NULL,
  classe_cor TEXT NOT NULL,
  classe_fundo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Finanças (Transações)
CREATE TABLE IF NOT EXISTS financas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Despesa' CHECK (tipo IN ('Receita', 'Despesa')),
  status TEXT NOT NULL CHECK (status IN ('Pendente', 'Crítico', 'Agendado', 'Concluído', 'Pago')),
  valor NUMERIC(15, 2) NOT NULL,
  data_vencimento TIMESTAMPTZ NOT NULL,
  nome_icone TEXT NOT NULL,
  classe_cor TEXT NOT NULL,
  classe_fundo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sample Data in Portuguese

-- Contatos
INSERT INTO contatos (empresa, pessoa_contato, categoria, status, email, telefone, iniciais, cor)
VALUES 
('Acme Construções', 'Infraestrutura Comercial', 'Cliente', 'Ativo', 'contato@acme.com', '+55 11 9999-0101', 'AC', 'bg-blue-100 text-blue-600'),
('BuildRight Suprimentos', 'Materiais e Concreto', 'Fornecedor', 'Pendente', 'vendas@buildright.com', '+55 11 9999-0202', 'BS', 'bg-amber-100 text-amber-600'),
('Steel & Iron Co.', 'Componentes Estruturais', 'Fornecedor', 'Ativo', 'info@steeliron.com', '+55 11 9999-0303', 'SI', 'bg-slate-100 text-slate-600'),
('Design Partners LLC', 'Serviços de Arquitetura', 'Parceiro', 'Inativo', 'ola@designparts.com', '+55 11 9999-0404', 'DP', 'bg-purple-100 text-purple-600');

-- Projetos
INSERT INTO projetos (nome, id_contrato, status, orcamento, gasto, liquidez, localizacao, fase)
VALUES 
('Torre de Escritórios Skyline', '#299-A', 'Em Andamento', 2450000, 1840000, 85, 'Centro', 'Fase Estrutural'),
('Expansão da Ponte Riverfront', '#102', 'Atrasado', 850000, 820000, 12, 'Travessia do Rio Leste', 'Fase de Fundação'),
('Upgrade da Estação de Metrô', '#405', 'Planejamento', 1200000, 0, 100, 'Estação Central', 'Fase de Design');

-- Equipe
INSERT INTO equipe (nome, id_funcionario, cargo, departamento, status, url_imagem)
VALUES 
('Roberto Jackson', 'E294', 'Engenheiro Civil Sênior', 'Divisão Estrutural', 'Ativo', 'https://picsum.photos/seed/staff1/100/100'),
('Sarah Jenkins', 'E302', 'Inspetora de Segurança', 'Compliance', 'Ativo', 'https://picsum.photos/seed/staff2/100/100'),
('Michael Vance', 'E112', 'Coordenador de Projeto', 'Logística', 'Em Licença', 'https://picsum.photos/seed/staff3/100/100');

-- Documentos
INSERT INTO documentos (nome, tipo_arquivo, tamanho_arquivo, nome_icone, classe_cor, classe_fundo)
VALUES 
('Contrato Mestre Projeto Alpha', 'PDF', '4.2 MB', 'FileText', 'text-blue-500', 'bg-blue-500/10'),
('Licença Ambiental 2024', 'DOCX', '1.8 MB', 'ShieldCheck', 'text-emerald-500', 'bg-emerald-500/10'),
('Certificações de Segurança OSHA', 'ZIP', '22 MB', 'HardHat', 'text-red-500', 'bg-red-500/10');

-- Finanças
INSERT INTO financas (titulo, tipo, status, valor, data_vencimento, nome_icone, classe_cor, classe_fundo)
VALUES 
('Suprimento de Concreto - #204', 'Despesa', 'Pendente', 8450.00, now() + interval '2 days', 'FileText', 'text-blue-500', 'bg-blue-500/10'),
('Folha de Pagamento - Junho', 'Despesa', 'Crítico', 12200.00, now() - interval '1 day', 'AlertCircle', 'text-rose-500', 'bg-rose-500/10'),
('Aluguel de Equipamentos', 'Despesa', 'Agendado', 3150.00, now() + interval '15 days', 'TrendingDown', 'text-blue-500', 'bg-blue-500/10'),
('Taxas de Permissão - Fase 1', 'Despesa', 'Concluído', 1200.00, now() - interval '1 day', 'CheckCircle2', 'text-emerald-500', 'bg-emerald-500/10'),
('Pagamento Cliente - Milestone 1', 'Receita', 'Concluído', 50000.00, now() - interval '5 days', 'TrendingUp', 'text-emerald-500', 'bg-emerald-500/10');
