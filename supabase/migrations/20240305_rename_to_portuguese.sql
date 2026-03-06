-- Migration to rename tables and columns to Portuguese
-- and update constraints to support Portuguese values

-- 1. Rename Tables
ALTER TABLE IF EXISTS contacts RENAME TO contatos;
ALTER TABLE IF EXISTS projects RENAME TO projetos;
ALTER TABLE IF EXISTS staff RENAME TO equipe;
ALTER TABLE IF EXISTS documents RENAME TO documentos;
ALTER TABLE IF EXISTS finances RENAME TO financas;

-- 2. Rename Columns and Update Constraints for 'contatos' (formerly 'contacts')
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contatos' AND column_name = 'company') THEN
        ALTER TABLE contatos RENAME COLUMN company TO empresa;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contatos' AND column_name = 'contact_person') THEN
        ALTER TABLE contatos RENAME COLUMN contact_person TO pessoa_contato;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contatos' AND column_name = 'category') THEN
        ALTER TABLE contatos RENAME COLUMN category TO categoria;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contatos' AND column_name = 'phone') THEN
        ALTER TABLE contatos RENAME COLUMN phone TO telefone;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contatos' AND column_name = 'initials') THEN
        ALTER TABLE contatos RENAME COLUMN initials TO iniciais;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contatos' AND column_name = 'color') THEN
        ALTER TABLE contatos RENAME COLUMN color TO cor;
    END IF;
END $$;

-- Update constraints for contatos
ALTER TABLE contatos DROP CONSTRAINT IF EXISTS contacts_category_check;
ALTER TABLE contatos ADD CONSTRAINT contatos_categoria_check CHECK (categoria IN ('Cliente', 'Fornecedor', 'Parceiro'));
ALTER TABLE contatos DROP CONSTRAINT IF EXISTS contacts_status_check;
ALTER TABLE contatos ADD CONSTRAINT contatos_status_check CHECK (status IN ('Ativo', 'Pendente', 'Inativo'));

-- 3. Rename Columns and Update Constraints for 'projetos' (formerly 'projects')
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'name') THEN
        ALTER TABLE projetos RENAME COLUMN name TO nome;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'contract_id') THEN
        ALTER TABLE projetos RENAME COLUMN contract_id TO id_contrato;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'budget') THEN
        ALTER TABLE projetos RENAME COLUMN budget TO orcamento;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'spent') THEN
        ALTER TABLE projetos RENAME COLUMN spent TO gasto;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'balance') THEN
        ALTER TABLE projetos RENAME COLUMN balance TO saldo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'liquidity') THEN
        ALTER TABLE projetos RENAME COLUMN liquidity TO liquidez;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'location') THEN
        ALTER TABLE projetos RENAME COLUMN location TO localizacao;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projetos' AND column_name = 'phase') THEN
        ALTER TABLE projetos RENAME COLUMN phase TO fase;
    END IF;
END $$;

-- Update constraints for projetos
ALTER TABLE projetos DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projetos ADD CONSTRAINT projetos_status_check CHECK (status IN ('Planejamento', 'Em Andamento', 'Atrasado', 'Concluído'));

-- 4. Rename Columns and Update Constraints for 'equipe' (formerly 'staff')
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipe' AND column_name = 'name') THEN
        ALTER TABLE equipe RENAME COLUMN name TO nome;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipe' AND column_name = 'emp_id') THEN
        ALTER TABLE equipe RENAME COLUMN emp_id TO id_funcionario;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipe' AND column_name = 'role') THEN
        ALTER TABLE equipe RENAME COLUMN role TO cargo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipe' AND column_name = 'department') THEN
        ALTER TABLE equipe RENAME COLUMN department TO departamento;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipe' AND column_name = 'img_url') THEN
        ALTER TABLE equipe RENAME COLUMN img_url TO url_imagem;
    END IF;
END $$;

-- Update constraints for equipe
ALTER TABLE equipe DROP CONSTRAINT IF EXISTS staff_status_check;
ALTER TABLE equipe ADD CONSTRAINT equipe_status_check CHECK (status IN ('Ativo', 'Em Licença', 'Inativo'));

-- 5. Rename Columns for 'documentos' (formerly 'documents')
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos' AND column_name = 'name') THEN
        ALTER TABLE documentos RENAME COLUMN name TO nome;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos' AND column_name = 'file_type') THEN
        ALTER TABLE documentos RENAME COLUMN file_type TO tipo_arquivo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos' AND column_name = 'file_size') THEN
        ALTER TABLE documentos RENAME COLUMN file_size TO tamanho_arquivo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos' AND column_name = 'icon_name') THEN
        ALTER TABLE documentos RENAME COLUMN icon_name TO nome_icone;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos' AND column_name = 'color_class') THEN
        ALTER TABLE documentos RENAME COLUMN color_class TO classe_cor;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentos' AND column_name = 'bg_class') THEN
        ALTER TABLE documentos RENAME COLUMN bg_class TO classe_fundo;
    END IF;
END $$;

-- 6. Rename Columns and Update Constraints for 'financas' (formerly 'finances')
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financas' AND column_name = 'title') THEN
        ALTER TABLE financas RENAME COLUMN title TO titulo;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financas' AND column_name = 'amount') THEN
        ALTER TABLE financas RENAME COLUMN amount TO valor;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financas' AND column_name = 'due_date') THEN
        ALTER TABLE financas RENAME COLUMN due_date TO data_vencimento;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financas' AND column_name = 'icon_name') THEN
        ALTER TABLE financas RENAME COLUMN icon_name TO nome_icone;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financas' AND column_name = 'color_class') THEN
        ALTER TABLE financas RENAME COLUMN color_class TO classe_cor;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financas' AND column_name = 'bg_class') THEN
        ALTER TABLE financas RENAME COLUMN bg_class TO classe_fundo;
    END IF;
    
    -- Add 'tipo' column if it doesn't exist (it was missing in initial schema but used in code)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financas' AND column_name = 'tipo') THEN
        ALTER TABLE financas ADD COLUMN tipo TEXT NOT NULL DEFAULT 'Despesa' CHECK (tipo IN ('Receita', 'Despesa'));
    END IF;
END $$;

-- Update constraints for financas
ALTER TABLE financas DROP CONSTRAINT IF EXISTS finances_status_check;
ALTER TABLE financas ADD CONSTRAINT financas_status_check CHECK (status IN ('Pendente', 'Crítico', 'Agendado', 'Concluído', 'Pago'));

-- 7. Update existing data to Portuguese values
UPDATE contatos SET categoria = 'Cliente' WHERE categoria = 'Client';
UPDATE contatos SET categoria = 'Fornecedor' WHERE categoria = 'Supplier';
UPDATE contatos SET categoria = 'Parceiro' WHERE categoria = 'Partner';
UPDATE contatos SET status = 'Ativo' WHERE status = 'Active';
UPDATE contatos SET status = 'Pendente' WHERE status = 'Pending';
UPDATE contatos SET status = 'Inativo' WHERE status = 'Inactive';

UPDATE projetos SET status = 'Planejamento' WHERE status = 'Planning';
UPDATE projetos SET status = 'Em Andamento' WHERE status = 'In Progress';
UPDATE projetos SET status = 'Atrasado' WHERE status = 'Delayed';
UPDATE projetos SET status = 'Concluído' WHERE status = 'Completed';

UPDATE equipe SET status = 'Ativo' WHERE status = 'Active';
UPDATE equipe SET status = 'Em Licença' WHERE status = 'On Leave';
UPDATE equipe SET status = 'Inativo' WHERE status = 'Inactive';

UPDATE financas SET status = 'Pendente' WHERE status = 'Pending';
UPDATE financas SET status = 'Crítico' WHERE status = 'Critical';
UPDATE financas SET status = 'Agendado' WHERE status = 'Scheduled';
UPDATE financas SET status = 'Concluído' WHERE status = 'Completed';
UPDATE financas SET status = 'Pago' WHERE status = 'Paid';

-- Set 'tipo' based on some logic if possible, or just default to 'Despesa'
-- For sample data, we can be specific
UPDATE financas SET tipo = 'Receita' WHERE titulo ILIKE '%Receita%' OR titulo ILIKE '%Entrada%';
UPDATE financas SET tipo = 'Despesa' WHERE tipo IS NULL;
