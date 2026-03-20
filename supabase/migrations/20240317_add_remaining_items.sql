-- Migration: Add remaining items from spreadsheet
-- Categories: 07.00 to 15.00

INSERT INTO tcpo_itens (id, categoria, descricao, unidade, custo_mat, custo_mo, custo_eq, bdi_padrao)
VALUES 
-- 07.00 FECHAMENTO EXTERNO
('07.01', 'FECHAMENTO EXTERNO', 'Fornec. e inst. de gradil metálico', 'm2', 580.90, 200.31, 0.00, 25),
('07.02', 'FECHAMENTO EXTERNO', 'Fornec. e inst. de portão metálico de abrir', 'm2', 726.12, 250.39, 0.00, 25),
('07.03', 'FECHAMENTO EXTERNO', 'Fornec. e inst. de portão metálico de correr', 'm2', 871.35, 300.46, 0.00, 25),

-- 08.00 VIDRAÇARIA
('08.01', 'VIDRAÇARIA', 'Fornec. e inst. de vidro liso 4mm', 'm2', 217.84, 100.15, 0.00, 25),
('08.02', 'VIDRAÇARIA', 'Fornec. e inst. de vidro canelado 4mm', 'm2', 217.84, 100.15, 0.00, 25),
('08.03', 'VIDRAÇARIA', 'Fornec. e inst. de vidro temperado 8mm', 'm2', 435.67, 200.31, 0.00, 25),

-- 09.00 COBERTURA
('09.01', 'COBERTURA', 'Fornec. e inst. de telha cerâmica francesa', 'm2', 72.61, 50.08, 0.00, 25),
('09.02', 'COBERTURA', 'Fornec. e inst. de telha de fibrocimento 6mm', 'm2', 43.57, 30.05, 0.00, 25),
('09.03', 'COBERTURA', 'Fornec. e inst. de calha em chapa galvanizada', 'm', 58.09, 40.06, 0.00, 25),
('09.04', 'COBERTURA', 'Fornec. e inst. de rufo em chapa galvanizada', 'm', 43.57, 30.05, 0.00, 25),

-- 10.00 FORROS E DIVISÓRIAS E PORTAS
('10.01', 'FORROS E DIVISÓRIAS', 'Fornec. e inst. de forro de PVC', 'm2', 58.09, 40.06, 0.00, 25),
('10.02', 'FORROS E DIVISÓRIAS', 'Fornec. e inst. de forro de gesso acartonado', 'm2', 72.61, 50.08, 0.00, 25),
('10.03', 'FORROS E DIVISÓRIAS', 'Fornec. e inst. de divisória naval', 'm2', 145.22, 100.15, 0.00, 25),

-- 11.00 MÃO DE OBRA HORA / HOMEM
('11.01', 'MÃO DE OBRA', 'Pedreiro', 'h', 0.00, 25.04, 0.00, 25),
('11.02', 'MÃO DE OBRA', 'Servente', 'h', 0.00, 15.02, 0.00, 25),
('11.03', 'MÃO DE OBRA', 'Carpinteiro', 'h', 0.00, 25.04, 0.00, 25),
('11.04', 'MÃO DE OBRA', 'Armador', 'h', 0.00, 25.04, 0.00, 25),
('11.05', 'MÃO DE OBRA', 'Pintor', 'h', 0.00, 25.04, 0.00, 25),
('11.06', 'MÃO DE OBRA', 'Eletricista', 'h', 0.00, 25.04, 0.00, 25),
('11.07', 'MÃO DE OBRA', 'Encanador', 'h', 0.00, 25.04, 0.00, 25),

-- 12.00 MATERIAIS DIVERSOS
('12.01', 'MATERIAIS', 'Areia média', 'm3', 145.22, 0.00, 0.00, 25),
('12.02', 'MATERIAIS', 'Brita 1', 'm3', 116.18, 0.00, 0.00, 25),
('12.03', 'MATERIAIS', 'Cimento CP II 50kg', 'sc', 43.57, 0.00, 0.00, 25),
('12.04', 'MATERIAIS', 'Cal hidratada 20kg', 'sc', 14.52, 0.00, 0.00, 25),
('12.05', 'MATERIAIS', 'Tijolo comum', 'mil', 871.35, 0.00, 0.00, 25),

-- 13.00 ARQUITETURA
('13.01', 'PROJETOS', 'Elaboração de projeto arquitetônico', 'm2', 0.00, 50.08, 0.00, 25),
('13.02', 'PROJETOS', 'Elaboração de projeto estrutural', 'm2', 0.00, 40.06, 0.00, 25),

-- 14.00 MOBILIZAÇÃO
('14.01', 'MOBILIZAÇÃO', 'Mobilização e desmobilização de canteiro', 'un', 1452.25, 1452.25, 0.00, 25),

-- 15.00 OUTROS SERVIÇOS
('15.01', 'OUTROS', 'Limpeza final de obra', 'm2', 7.26, 15.02, 0.00, 25)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq;
