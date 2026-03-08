-- Make id_contrato, localizacao, and fase nullable in projetos table
ALTER TABLE projetos ALTER COLUMN id_contrato DROP NOT NULL;
ALTER TABLE projetos ALTER COLUMN localizacao DROP NOT NULL;
ALTER TABLE projetos ALTER COLUMN fase DROP NOT NULL;
