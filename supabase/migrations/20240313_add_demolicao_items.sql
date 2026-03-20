-- Migration: Add Demolition items from spreadsheet
-- Category: 01.00 DEMOLIÇÃO

INSERT INTO tcpo_itens (id, categoria, descricao, unidade, custo_mat, custo_mo, custo_eq, bdi_padrao)
VALUES 
('01.01', 'DEMOLIÇÃO', 'Demolição de piso cimentado sobre lastro de concreto', 'm2', 0.00, 75.12, 0.00, 25),
('01.02', 'DEMOLIÇÃO', 'Demolição manual de piso revestido com cerâmica', 'm2', 0.00, 22.30, 0.00, 25),
('01.03', 'DEMOLIÇÃO', 'Demolição manual de piso revestido com cerâmica + base de concreto', 'm2', 0.00, 58.85, 0.00, 25),
('01.04', 'DEMOLIÇÃO', 'Demolição manual de revestimento com azulejos', 'm2', 0.00, 63.86, 0.00, 25),
('01.05', 'DEMOLIÇÃO', 'Demolição manual de revestimento com argamassa', 'm2', 0.00, 38.82, 0.00, 25),
('01.06', 'DEMOLIÇÃO', 'Demolição manual de alv. de 1/2 tijolos assent. com arg. mista s/ reaprov.', 'm2', 0.00, 42.33, 0.00, 25),
('01.07', 'DEMOLIÇÃO', 'Demolição manual de alv. de bloco de concreto de 9cm + revestimento reboco', 'm2', 0.00, 59.35, 0.00, 25),
('01.08', 'DEMOLIÇÃO', 'Demolição manual de alv. de bloco de concreto de 19cm + revestimento reboco', 'm2', 0.00, 93.41, 0.00, 25),
('01.09', 'DEMOLIÇÃO', 'Demolição manual de alv. de tijolo a espelho assent, com arg. Cim. s/ reaprov.', 'm2', 0.00, 76.38, 0.00, 25),
('01.10', 'DEMOLIÇÃO', 'Demolição manual de concreto simples com rompedor elétrico', 'm3', 0.00, 681.05, 0.00, 25),
('01.11', 'DEMOLIÇÃO', 'Demolição manual de concreto armado com rompedor pneumático', 'm3', 0.00, 1665.07, 0.00, 25),
('01.12', 'DEMOLIÇÃO', 'Demolição manual de pavimentação asfáltica com rompedor elétrico', 'm2', 0.00, 67.10, 0.00, 25),
('01.13', 'DEMOLIÇÃO', 'Demolição de cerca tipo alambrado', 'm', 0.00, 30.05, 0.00, 25),
('01.14', 'DEMOLIÇÃO', 'Demolição de cobertura de telha cerâmica ou concreto e estrutura de madeira', 'm2', 0.00, 41.37, 0.00, 25),
('01.15', 'DEMOLIÇÃO', 'Retirada de portas e janelas inclusive batentes até h=2,10m', 'm2', 0.00, 76.38, 0.00, 25),
('01.16', 'DEMOLIÇÃO', 'Retirada de esquadrias metálicas até h=2,10m', 'm2', 0.00, 50.08, 0.00, 25),
('01.17', 'DEMOLIÇÃO', 'Fornecimento e montagem de tapume de chapa de madeira compensada e=6mm h=2,20m', 'm2', 85.13, 85.13, 0.00, 25),
('01.18', 'DEMOLIÇÃO', 'Fornecimento e montagem de tapume de chapa metálica trapezoidal 0,4mm', 'm2', 115.18, 85.13, 0.00, 25),
('01.19', 'DEMOLIÇÃO', 'Fornecimento e montagem de tapume de chapa ondulada ecológica h=2,20m', 'm2', 105.16, 85.13, 0.00, 25),
('01.20', 'DEMOLIÇÃO', 'Isolamento de área com cerquite h=1,20m', 'm', 13.02, 12.28, 0.00, 25),
('01.21', 'DEMOLIÇÃO', 'Carga e transporte de Entulho em caçambas', 'm3', 0.00, 170.26, 0.00, 25),
('01.22', 'DEMOLIÇÃO', 'Descarte de entulhos em local homologado', 'm3', 0.00, 312.98, 0.00, 25),
('01.23', 'DEMOLIÇÃO', 'Remoção de lavatório s/ coluna', 'pç', 0.00, 125.19, 0.00, 25),
('01.24', 'DEMOLIÇÃO', 'Remoção de vaso sanitário', 'pç', 0.00, 125.19, 0.00, 25),
('01.25', 'DEMOLIÇÃO', 'Fornecimento e montagem de andaime multidirecional (mínimo 10m²)', 'm2/dia', 0.00, 80.12, 0.00, 25),
('01.26', 'DEMOLIÇÃO', 'Fornecimento e montagem de andaime do tipo tubo e braçadeira (mínimo 10m²)', 'm2/dia', 0.00, 155.24, 0.00, 25),
('01.27', 'DEMOLIÇÃO', 'Corte de piso com serra clipper', 'ml', 0.00, 45.07, 0.00, 25),
('01.28', 'DEMOLIÇÃO', 'Locação de bases de máquinas até 12 m2', 'm2', 0.00, 35.05, 0.00, 25),
('01.29', 'DEMOLIÇÃO', 'Locação de equipamento para demoliçao tipo bob cat (8hrs/dia)', 'dia', 0.00, 6760.45, 0.00, 25),
('01.30', 'DEMOLIÇÃO', 'Locação de retroescavadeira (8hrs/dia)', 'dia', 0.00, 3405.26, 0.00, 25),
('01.31', 'DEMOLIÇÃO', 'Locação de caminhão basculante 6m3 (8hrs/dia)', 'dia', 0.00, 2441.27, 0.00, 25),
('01.32', 'DEMOLIÇÃO', 'Locação de escavadeira hidráulica sobre esteiras (8hrs/dia)', 'dia', 0.00, 6409.91, 0.00, 25)
ON CONFLICT (id) DO UPDATE SET
  categoria = EXCLUDED.categoria,
  descricao = EXCLUDED.descricao,
  unidade = EXCLUDED.unidade,
  custo_mat = EXCLUDED.custo_mat,
  custo_mo = EXCLUDED.custo_mo,
  custo_eq = EXCLUDED.custo_eq;
