-- Migration: Update categories 10, 11, and 12 to match the new spreadsheet
-- Categories: 10.00 FORROS E DIVISÓRIAS E PORTAS, 11.00 MÃO DE OBRA HORA / HOMEM, 12.00 MATERIAIS DIVERSOS

-- Ensure columns exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tcpo_itens' AND column_name='custo_sabado') THEN
    ALTER TABLE tcpo_itens ADD COLUMN custo_sabado NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tcpo_itens' AND column_name='custo_domingo_feriado') THEN
    ALTER TABLE tcpo_itens ADD COLUMN custo_domingo_feriado NUMERIC DEFAULT 0;
  END IF;
END $$;

INSERT INTO tcpo_itens (id, categoria, descricao, unidade, custo_mat, custo_mo, custo_eq, bdi_padrao, custo_sabado, custo_domingo_feriado)
VALUES 
-- 10.00 FORROS E DIVISÓRIAS E PORTAS
('10.01', 'FORROS E DIVISÓRIAS', 'Desmontagem divisórias', 'm2', 0.00, 75.12, 0.00, 25, 112.67, 150.23),
('10.02', 'FORROS E DIVISÓRIAS', 'Fornecimento e Montagem de forro mineral Armstrong Cirrus Tegular 625x625mm', 'm2', 297.96, 190.29, 0.00, 25, 732.38, 976.51),
('10.03', 'FORROS E DIVISÓRIAS', 'Fornecimento e Montagem de forro mineral Armstrong Sahara Tegular 625x625mm', 'm2', 174.18, 165.47, 0.00, 25, 509.48, 679.31),
('10.04', 'FORROS E DIVISÓRIAS', 'Desmontagem de forro mineral 625x625mm', 'm2', 0.00, 57.59, 0.00, 25, 86.38, 115.18),
('10.05', 'FORROS E DIVISÓRIAS', 'Fornecimento e montagem de forro mineral 1250x650mm AMF Thermatex Thermofon', 'm2', 250.39, 149.71, 0.00, 25, 600.15, 800.19),
('10.06', 'FORROS E DIVISÓRIAS', 'Desmontagem de forro mineral 1250x650mm', 'm2', 0.00, 50.08, 0.00, 25, 75.12, 100.15),
('10.07', 'FORROS E DIVISÓRIAS', 'Fornecimento e montagem de forro em gesso comum placas 60x60cm', 'm2', 90.14, 60.09, 0.00, 25, 225.35, 300.46),
('10.08', 'FORROS E DIVISÓRIAS', 'Demolição de forro em gesso', 'm2', 0.00, 55.09, 0.00, 25, 82.63, 110.17),
('10.09', 'FORROS E DIVISÓRIAS', 'Fornecimento e Montagem de forro em gesso acartonado dry wall', 'm2', 155.24, 90.14, 0.00, 25, 368.07, 490.76),
('10.10', 'FORROS E DIVISÓRIAS', 'Desmontagem de forro drywall', 'm2', 0.00, 80.12, 0.00, 25, 120.19, 160.25),
('10.11', 'FORROS E DIVISÓRIAS', 'Montagem de forro lã de rocha', 'm2', 240.37, 180.28, 0.00, 25, 630.98, 841.30),
('10.12', 'FORROS E DIVISÓRIAS', 'Desmontagem de forro lã de rocha', 'm2', 0.00, 57.59, 0.00, 25, 86.38, 115.18),
('10.13', 'FORROS E DIVISÓRIAS', 'Tabica para forro de gesso comum ou acartonado', 'm', 37.56, 37.56, 0.00, 25, 112.67, 150.23),
('10.14', 'FORROS E DIVISÓRIAS', 'Montagem de porta (Porta+Batente+Dobradiça+Acabamento) alumínio e madeira', 'PÇ', 0.00, 605.94, 0.00, 25, 908.90, 1211.87),
('10.15', 'FORROS E DIVISÓRIAS', 'Instalação de fechadura Lafont', 'PÇ', 0.00, 225.35, 0.00, 25, 338.02, 450.70),
('10.16', 'FORROS E DIVISÓRIAS', 'Guia 3,00 M ( U )', 'PÇ', 90.77, 0.00, 0.00, 25, 136.16, 181.54),
('10.17', 'FORROS E DIVISÓRIAS', 'Jogo batente', 'PÇ', 450.70, 0.00, 0.00, 25, 676.05, 901.39),
('10.18', 'FORROS E DIVISÓRIAS', 'Fornecimento e instalação de parede de gesso dry wall e=9cm', 'm2', 225.35, 100.15, 0.00, 25, 488.25, 651.01),
('10.19', 'FORROS E DIVISÓRIAS', 'Lã de vidro 50mm', 'm2', 97.65, 37.56, 0.00, 25, 202.81, 270.42),
('10.20', 'FORROS E DIVISÓRIAS', 'Fornecimento e montagem de divisória eucatex', 'm2', 162.75, 100.15, 0.00, 25, 394.36, 525.81),
('10.21', 'FORROS E DIVISÓRIAS', 'Fornecimento e montagem de forro de PVC 10x200mm', 'm2', 108.86, 54.43, 0.00, 25, 244.94, 326.59),

-- 11.00 MÃO DE OBRA HORA / HOMEM
('11.01', 'MÃO DE OBRA', 'Mão de obra pedreiro', 'h', 0.00, 90.14, 0.00, 25, 135.21, 180.28),
('11.02', 'MÃO DE OBRA', 'Mão de obra servente', 'h', 0.00, 65.10, 0.00, 25, 97.65, 130.20),
('11.03', 'MÃO DE OBRA', 'Mão de obra carpinteiro', 'h', 0.00, 90.14, 0.00, 25, 135.21, 180.28),
('11.04', 'MÃO DE OBRA', 'Mão de obra encanador', 'h', 0.00, 90.14, 0.00, 25, 135.21, 180.28),
('11.05', 'MÃO DE OBRA', 'Mão de obra armador', 'h', 0.00, 90.14, 0.00, 25, 135.21, 180.28),
('11.06', 'MÃO DE OBRA', 'Mão de obra mestre obras', 'h', 0.00, 187.79, 0.00, 25, 281.69, 375.58),
('11.07', 'MÃO DE OBRA', 'Hora/ Homem Projetista (MDO)', 'h', 0.00, 500.77, 0.00, 25, 751.16, 1001.55),
('11.08', 'MÃO DE OBRA', 'Hora/ Homem Desenhista (MDO)', 'h', 0.00, 125.19, 0.00, 25, 187.79, 250.39),
('11.09', 'MÃO DE OBRA', 'Hora/ Homem Técnico de Segurança (MDO)', 'h', 0.00, 222.84, 0.00, 25, 334.27, 445.69),

-- 12.00 MATERIAIS DIVERSOS
('12.01', 'MATERIAIS', 'Lona preta plástica', 'm2', 5.64, 0.00, 0.00, 25, 8.46, 11.28),
('12.03', 'MATERIAIS', 'Tubos e conexões em PVC diversas medidas', 'pç', 140.22, 0.00, 0.00, 25, 210.33, 280.43)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq,
  custo_sabado = EXCLUDED.custo_sabado,
  custo_domingo_feriado = EXCLUDED.custo_domingo_feriado;
