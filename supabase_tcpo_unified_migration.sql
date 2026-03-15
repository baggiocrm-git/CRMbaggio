-- Unified TCPO Services Migration
-- Including full titles, detailed compositions, and correct TCPO codes

-- 1. Ensure Insumos have correct codes
INSERT INTO tcpo_insumos (id, descricao, unidade, preco_unitario, tipo) VALUES
('01270.0.45.1', 'Servente', 'h', 15.50, 'mo'),
('01270.0.4', 'Pedreiro', 'h', 22.00, 'mo'),
('01270.0.19.1', 'Carpinteiro', 'h', 22.00, 'mo'),
('012700.1-11', 'Ajudante de carpinteiro', 'h', 18.00, 'mo'),
('01270.0.33.1', 'Montador', 'h', 25.00, 'mo'),
('01270.0.48.1', 'Telhadista', 'h', 25.00, 'mo')
ON CONFLICT (id) DO UPDATE SET descricao = EXCLUDED.descricao;

-- 2. Insert Detailed Services
INSERT INTO tcpo_itens (id, categoria, descricao, unidade, custo_mo, custo_mat, custo_eq, bdi_padrao, composicao)
VALUES 
-- 01520.8.1.1 - ABRIGO PROVISÓRIO
('01520.8.1.1', '01.520', 'ABRIGO PROVISÓRIO de madeira executado na obra para alojamento e depósito de materiais e ferramentas', 'm²', 0, 0, 0, 25, 
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 6.70, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 7.92, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.06356, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.05852, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 18.76, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Chapa compensada resinada (12mm)", "codigo": "03110.3.1.4", "un": "m²", "coef": 1.18, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 15 x 15 com cabeça", "codigo": "05060.3.20.5", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pontalete 3ª construção", "codigo": "06062.3.2.1", "un": "m", "coef": 4.39, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 6\"", "codigo": "06062.3.5.3", "un": "m²", "coef": 2.11, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Viga (60x120mm)", "codigo": "06062.3.6.2", "un": "m", "coef": 1.37, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Telha de fibrocimento ondulada", "codigo": "07320.3.11.7", "un": "m²", "coef": 1.19, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cumeeira para telha de cimento", "codigo": "07320.3.3.2", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.0245, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 01544.8.2.2 - ANDAIME (6 REAPROVEITAMENTOS)
('01544.8.2.2', '01.544', 'ANDAIME para 1 m² de alvenaria, construção e desmontagem (Reaproveitamento 6 vezes)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.06, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.18, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 18x27", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Madeira (cedrinho)", "codigo": "06060.3.1.2", "un": "m³", "coef": 0.000825, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 01544.8.2.3 - ANDAIME (10 REAPROVEITAMENTOS)
('01544.8.2.3', '01.544', 'ANDAIME para 1 m² de alvenaria, construção e desmontagem - Reaproveitamento 10 vezes', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.04, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.015, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Madeira (tipo madeira: cedrinho)", "codigo": "06060.3.1.2", "un": "m³", "coef": 0.000327, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 01544.8.5.1 - ANDAIME METÁLICO
('01544.8.5.1', '01.544', 'ANDAIME metálico de encaixe para trabalho em fachada de edifícios - locação', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Montador", "codigo": "01270.0.33.1", "un": "h", "coef": 0.08, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.16, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Andaime metálico fachadeiro - locação (2,00 x 1,00m)", "codigo": "01544.7.1.1", "un": "loc/mês", "coef": 1.03, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 01740.8.1.1 - LIMPEZA GERAL
('01740.8.1.1', '01.740', 'LIMPEZA geral da edificação', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02060.8.1.1 - AREIA MÉDIA SECAGEM
('02060.8.1.1', '02.060', 'AREIA MÉDIA – Secagem e peneiramento', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 2.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02220.8.1.2 - DEMOLIÇÃO ALVENARIA
('02220.8.1.2', '02.220', 'DEMOLIÇÃO de alvenaria de tijolo comum, sem reaproveitamento', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.14.1 - DEMOLIÇÃO REVESTIMENTO ARGAMASSA
('02220.8.14.1', '02.220', 'DEMOLIÇÃO de revestimento com argamassa', 'm²', 0, 0, 0, 25, 
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.2.1 - DEMOLIÇÃO ASSOALHO
('02220.8.2.1', '02.220', 'DEMOLIÇÃO de assoalho de madeira', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "012700.1-11", "un": "h", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.09, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.3.1 - DEMOLIÇÃO COBERTURA CERÂMICA
('02220.8.3.1', '02.220', 'DEMOLIÇÃO de cobertura de telha cerâmica', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.06, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.3.2 - DEMOLIÇÃO COBERTURA FIBROCIMENTO
('02220.8.3.2', '02.220', 'DEMOLIÇÃO de cobertura de telha ondulada de fibrocimento', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Telhadista", "codigo": "01270.0.48.1", "un": "h", "coef": 0.025, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.4.1 - DEMOLIÇÃO CONCRETO ARMADO (ROMPEDOR)
('02220.8.4.1', '02.220', 'DEMOLIÇÃO de concreto armado com utilização de martelo rompedor', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ponteiro para rompedor", "codigo": "22050.3.40.2", "un": "un", "coef": 0.075, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Compressor de ar portátil", "codigo": "22070.9.1.1", "un": "h prod.", "coef": 5.00, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Martelo rompedor pneumático", "codigo": "22600.9.3.5", "un": "h prod.", "coef": 15.00, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02220.8.4.2 - DEMOLIÇÃO CONCRETO SIMPLES
('02220.8.4.2', '02.220', 'DEMOLIÇÃO de concreto simples', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 13.00, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.6.1 - DEMOLIÇÃO ESTRUTURA TELHADO
('02220.8.6.1', '02.220', 'DEMOLIÇÃO de estrutura de madeira para telhado', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "012700.1-11", "un": "h", "coef": 1.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.13, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.7.1 - DEMOLIÇÃO FORRO ESTUQUE
('02220.8.7.1', '02.220', 'DEMOLIÇÃO de forro de estuque', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "012700.1-11", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.04, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.7.2 - DEMOLIÇÃO FORRO TÁBUA
('02220.8.7.2', '02.220', 'DEMOLIÇÃO de forro de tábua de pinho', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "012700.1-11", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.7.3 - DEMOLIÇÃO FORRO GESSO
('02220.8.7.3', '02.220', 'DEMOLIÇÃO de forro de gesso em placas', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02220.8.8.1 - DEMOLIÇÃO PAVIMENTAÇÃO ASFÁLTICA
('02220.8.8.1', '02.220', 'DEMOLIÇÃO de pavimentação asfáltica com utilização de martelo rompedor', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ponteiro para rompedor (160mm)", "codigo": "22050.3.40.2", "un": "un", "coef": 0.0015, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Compressor de ar portátil diesel 63 HP", "codigo": "22070.9.1.1", "un": "h prod.", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Martelo rompedor pneumático", "codigo": "22600.9.3.5", "un": "h prod.", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02220.8.9.1 - DEMOLIÇÃO PISO CIMENTADO
('02220.8.9.1', '02.220', 'DEMOLIÇÃO de piso cimentado sobre lastro de concreto', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.13, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.30, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]')
ON CONFLICT (id) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  composicao = EXCLUDED.composicao;

-- 3. Handle Foreign Key Constraints and Cleanup
-- First, update references in orcamento_itens to the new IDs (without prefix)
-- We assume the mapping is simply removing 'TCPO08-'
UPDATE orcamento_itens
SET tcpo_id = REPLACE(tcpo_id, 'TCPO08-', '')
WHERE tcpo_id LIKE 'TCPO08-%'
AND EXISTS (SELECT 1 FROM tcpo_itens WHERE id = REPLACE(orcamento_itens.tcpo_id, 'TCPO08-', ''));

-- Now we can safely delete the old records that were replaced by the new ones
DELETE FROM tcpo_itens 
WHERE id LIKE 'TCPO08-%'
AND EXISTS (SELECT 1 FROM tcpo_itens t2 WHERE t2.id = REPLACE(tcpo_itens.id, 'TCPO08-', ''));

-- For any remaining TCPO08- that didn't have a direct replacement in the INSERT above, 
-- we can try to rename them if they are not referenced, or just leave them.
-- But the best is to rename them if possible.
-- To rename a PK that is referenced, we'd need CASCADE or the insert-update-delete dance.
