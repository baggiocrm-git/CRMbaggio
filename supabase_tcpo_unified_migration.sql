-- Unified TCPO Services Migration
-- Including full titles, detailed compositions, and correct TCPO codes

-- 1. Ensure Insumos have correct codes
INSERT INTO tcpo_insumos (id, descricao, unidade, preco_unitario, tipo) VALUES
('01270.0.45.1', 'Servente', 'h', 15.50, 'mo'),
('01270.0.4', 'Pedreiro', 'h', 22.00, 'mo'),
('01270.0.19.1', 'Carpinteiro', 'h', 22.00, 'mo'),
('012700.1-11', 'Ajudante de carpinteiro', 'h', 18.00, 'mo'),
('01270.0.33.1', 'Montador', 'h', 25.00, 'mo'),
('01270.0.48.1', 'Telhadista', 'h', 25.00, 'mo'),
('01270.0.1.13', 'Ajudante de eletricista', 'h', 18.00, 'mo'),
('01270.0.22.1', 'Eletricista', 'h', 25.00, 'mo'),
('01270.0.20.1', 'Cavouqueiro', 'h', 18.00, 'mo'),
('01270.0.1.1', 'Ajudante', 'h', 18.00, 'mo'),
('01270.0.25.1', 'Armador', 'h', 22.00, 'mo'),
('01270.0.1.10', 'Ajudante de armador', 'h', 18.00, 'mo'),
('02065.3.2.1', 'Cal hidratada CH III', 'kg', 1.20, 'mat'),
('07110.3.1.1', 'Aditivo hidrófugo', 'l', 15.00, 'mat'),
('22300.9.10.1', 'Vibrador de imersão elétrico 1HP', 'h', 5.00, 'eq'),
('22300.9.8.1', 'Régua vibratória simples elétrica 0,5HP', 'h', 8.00, 'eq'),
('22500.9.1.1', 'Acabadora de superfície elétrica 2HP', 'h', 12.00, 'eq'),
('02060.8.1.1', 'Areia média - secagem e peneiramento', 'm³', 45.00, 'mat'),
('04211.3.4.1', 'Tijolo maciço cerâmico 5,7 x 9 x 19 cm', 'un', 0.80, 'mat'),
('00050.3.3.1', 'Aglutinante organo-sintético', 'l', 12.00, 'mat'),
('03310.3.1.1', 'Concreto dosado em central convencional britas 1 e 2', 'm³', 350.00, 'mat'),
('03300.3.1.1', 'Concreto dosado em central de alto desempenho', 'm³', 450.00, 'mat'),
('03300.3.1.2', 'Concreto dosado em central auto-adensável', 'm³', 480.00, 'mat'),
('07110.3.3.1', 'Aditivo impermeabilizante e plastificante em pó', 'kg', 8.50, 'mat'),
('04211.1.1.9', 'Mão de obra empreitada para execução de alvenaria com tijolo comum 5,7 x 9 x 19 cm', 'm²', 35.00, 'mo'),
('04060.3.2.1', 'Argamassa pré-fabricada para assentamento de alvenaria', 'kg', 1.50, 'mat'),
('04211.3.1.1', 'Bloco cerâmico de vedação 9 x 19 x 39 cm', 'un', 2.50, 'mat'),
('04211.3.1.2', 'Bloco cerâmico de vedação 14 x 19 x 39 cm', 'un', 3.20, 'mat'),
('04211.3.1.3', 'Bloco cerâmico de vedação 19 x 19 x 39 cm', 'un', 4.10, 'mat'),
('06060.3.1.1', 'Madeira peroba', 'm³', 4500.00, 'mat'),
('05060.3.9.1', 'Ferragem para telhados tipo chapa de emenda de ferro', 'kg', 12.00, 'mat'),
('01270.0.1.20', 'Ajudante de telhadista', 'h', 18.00, 'mo'),
('07320.3.9.1', 'Telha cerâmica francesa', 'un', 3.50, 'mat'),
('07320.3.9.2', 'Telha cerâmica paulista', 'un', 3.20, 'mat'),
('07320.3.9.3', 'Telha cerâmica plan', 'un', 3.80, 'mat'),
('07320.3.9.4', 'Telha cerâmica colonial telhão', 'un', 4.50, 'mat'),
('07320.3.10.1', 'Telha de concreto', 'un', 4.20, 'mat'),
('05060.3.31.1', 'Parafuso com rosca soberba galvanizado 110mm', 'un', 1.20, 'mat'),
('07320.3.11.6', 'Telha de fibrocimento ondulada 6mm', 'm²', 25.00, 'mat'),
('07325.3.6.1', 'Conjunto vedação elástica', 'un', 0.80, 'mat'),
('05060.3.20.4', 'Prego 16 x 24 com cabeça', 'kg', 15.00, 'mat'),
('05060.3.24.1', 'Parafuso madeira cabeça chata fenda simples 90mm', 'un', 0.60, 'mat'),
('06062.3.8.2', 'Taco de madeira peroba 15x50x60mm', 'un', 1.50, 'mat'),
('08210.3.1.2', 'Batente de madeira peroba para porta', 'un', 150.00, 'mat'),
('08210.3.2.1', 'Guarnição de madeira peroba para porta', 'un', 45.00, 'mat'),
('08210.3.5.1', 'Porta almofadada de madeira duas faces 35mm', 'un', 450.00, 'mat'),
('08710.3.2.1', 'Dobradiça de ferro para porta 2 1/2" x 3"', 'un', 15.00, 'mat'),
('08710.3.9.4', 'Fechadura completa para porta externa em latão', 'un', 120.00, 'mat'),
('08210.3.4.3', 'Porta lisa de madeira encabeçada 0,80 x 2,10m imbuia', 'un', 320.00, 'mat'),
('08210.3.4.4', 'Porta lisa de madeira encabeçada 0,90 x 2,10m imbuia', 'un', 350.00, 'mat'),
('08710.3.10.4', 'Fechadura completa para porta interna em latão', 'un', 85.00, 'mat'),
('08520.3.1.5', 'Caixilho de alumínio sob encomenda basculante natural', 'm²', 450.00, 'mat'),
('08520.3.1.6', 'Caixilho de alumínio sob encomenda de correr natural', 'm²', 520.00, 'mat'),
('08530.3.1.6', 'Janela de aço pintado de correr 1,20 x 1,50m com vidro', 'un', 680.00, 'mat'),
('08530.3.1.5', 'Janela de aço pintado de correr 1,00 x 1,20m com vidro', 'un', 550.00, 'mat'),
('08710.3.11.1', 'Fechadura completa em aço inoxidável', 'un', 150.00, 'mat'),
('08800.1.1.1', 'Mão-de-obra especializada para colocação de vidro', 'm²', 45.00, 'mo'),
('08800.3.2.1', 'Vidro aramado incolor 6mm', 'm²', 280.00, 'mat'),
('08770.3.13.1', 'Massa para vidro comum', 'kg', 12.00, 'mat'),
('08800.3.3.1', 'Vidro cristal comum fantasia incolor 4mm', 'm²', 120.00, 'mat'),
('08800.3.3.2', 'Vidro cristal comum liso 4mm', 'm²', 95.00, 'mat'),
('08800.3.3.3', 'Vidro cristal comum liso 5mm', 'm²', 115.00, 'mat'),
('08800.3.3.4', 'Vidro cristal comum liso 6mm', 'm²', 140.00, 'mat'),
('08800.3.4.1', 'Vidro laminado 6mm', 'm²', 220.00, 'mat'),
('08800.3.4.2', 'Vidro laminado 8mm', 'm²', 280.00, 'mat'),
('08800.3.4.3', 'Vidro laminado 10mm', 'm²', 350.00, 'mat'),
('08800.3.4.4', 'Vidro laminado 12mm', 'm²', 420.00, 'mat'),
('08800.13.1.1', 'Diversos sobre materiais para a colocação de vidros', '%', 1.00, 'mat'),
('08800.3.6.1', 'Vidro temperado 6mm', 'm²', 180.00, 'mat'),
('08800.3.6.2', 'Vidro temperado 8mm', 'm²', 220.00, 'mat'),
('08800.3.6.3', 'Vidro temperado 10mm', 'm²', 280.00, 'mat'),
('08810.13.1.9', 'Diversos sobre materiais para a colocação de vidros (temperado)', '%', 1.00, 'mat'),
('08770.3.18.1', 'Suporte de canto (1302)', 'un', 25.00, 'mat'),
('08770.3.19.1', 'Suporte de centro (1329)', 'un', 35.00, 'mat'),
('08810.3.6.2', 'Vidro temperado incolor liso 10mm', 'm²', 320.00, 'mat'),
('08810.13.1.13', 'Diversos sobre materiais para a colocação de vidros (fixo)', '%', 1.00, 'mat'),
('08770.3.16.1', 'Suporte com miolo para dois vidros (1306)', 'un', 25.00, 'mat'),
('08770.3.2.1', 'Botão de correção com parafuso (tipo: 1002 / cor: fosco acetinado)', 'un', 15.00, 'mat'),
('08810.13.1.14', 'Diversos sobre materiais para a colocação de vidros', '%', 1.00, 'mat'),
('08710.3.4.1', 'Dobradiça inferior', 'un', 45.00, 'mat'),
('08710.3.7.1', 'Dobradiça superior', 'un', 45.00, 'mat'),
('08710.3.8.1', 'Fechadura central com dois cilindros', 'un', 120.00, 'mat'),
('08770.3.14.1', 'Mola hidráulica', 'un', 350.00, 'mat'),
('08770.3.15.1', 'Puxador de madeira', 'un', 80.00, 'mat'),
('08770.3.3.1', 'Bucha para pivotante de dobradiça (tipo: 1201)', 'un', 10.00, 'mat'),
('08810.13.1.22', 'Diversos sobre materiais para a colocação de vidros', '%', 1.00, 'mat'),
('01270.0.1.19', 'Ajudante de pintor', 'h', 18.00, 'mo'),
('01270.0.41.1', 'Pintor', 'h', 22.00, 'mo'),
('09910.3.2.1', 'Cal em pó para pintura', 'kg', 2.50, 'mat'),
('09910.3.21.1', 'Óleo de linhaça', 'kg', 15.00, 'mat'),
('09910.3.22.2', 'Pigmento para tinta (pó)', 'kg', 12.00, 'mat'),
('09910.3.5.1', 'Tinta à base de emulsão acrílica para piso - acabamento liso/rugoso', 'l', 35.00, 'mat'),
('09900.3.30.1', 'Lixa para superfície madeira/massa grana 100', 'un', 2.50, 'mat'),
('09960.3.1.1', 'Massa à base de epóxi', 'kg', 45.00, 'mat'),
('09960.3.11.1', 'Fundo à base de epóxi', 'l', 55.00, 'mat'),
('09960.3.9.1', 'Tinta epóxi brilhante', 'l', 65.00, 'mat'),
('09906.3.1.1', 'Fundo nivelador para madeira (cor: branco fosco)', 'l', 28.00, 'mat'),
('09900.3.12.1', 'Aguarrás mineral', 'l', 18.00, 'mat'),
('09900.3.3.1', 'Esmalte sintético para madeiras e metais (tipo de acabamento: acetinado)', 'l', 32.00, 'mat'),
('09906.3.3.1', 'Líquido preparador de superfícies lata 18 l', 'l', 15.00, 'mat'),
('09910.3.7.2', 'Tinta látex acrílica (tipo de acabamento: fosco)', 'l', 25.00, 'mat'),
('09906.3.8.1', 'Selador base PVA para pintura látex', 'l', 12.00, 'mat'),
('09910.3.7.4', 'Tinta látex PVA (tipo de acabamento: fosco)', 'l', 18.00, 'mat'),
('09015.1.3.1', 'Mão-de-obra empreitada para pintura com tinta látex', 'm²', 15.00, 'mo'),
('09906.3.9.1', 'Zarcão', 'l', 22.00, 'mat'),
('09910.3.12.1', 'Aguarrás mineral', 'l', 18.00, 'mat'),
('09910.3.30.21', 'Lixa para superfície metálica grana 100', 'un', 2.80, 'mat'),
('09900.3.3.5', 'Esmalte sintético para metais ferrosos', 'l', 30.00, 'mat'),
('05060.3.17.1', 'Pino liso de aço (comprimento: 25,00 mm / diâmetro nominal: 1/4")', 'un', 0.50, 'mat'),
('05060.3.2.5', 'Arame galvanizado (bitola: 18 BWG)', 'kg', 12.00, 'mat'),
('05060.3.20.2', 'Prego 10 x 10 com cabeça (diâmetro da cabeça: 1,5 mm / comprimento: 23,0 mm)', 'kg', 15.00, 'mat'),
('06062.3.4.1', 'Sarrafo aparelhado (seção transversal: 1" x 2" / tipo de madeira: cedro)', 'm', 8.50, 'mat'),
('06062.3.4.4', 'Sarrafo aparelhado (seção transversal: 1" x 4" / tipo de madeira: pinho)', 'm', 12.00, 'mat'),
('09500.3.5.1', 'Arremate para forro de PVC - perfil "U"', 'm', 5.50, 'mat'),
('09500.3.6.1', 'Lamina de PVC para forro (100 mm)', 'm²', 25.00, 'mat'),
('09500.3.6.2', 'Lamina de PVC para forro (200 mm)', 'm²', 22.00, 'mat'),
('09500.1.1.2', 'Mão-de-obra empreitada para colocação de forro', 'm²', 18.00, 'mo'),
('09500.6.4.1', 'Forro de gesso liso tipo bisotado encaixe macho-e-fêmea (60x60x30mm)', 'm²', 35.00, 'mat'),
('09500.6.3.1', 'Forro de gesso acartonado - colocado, removível com perfil "T" de aço galvanizado (12,5 mm) - 0,65x0,65', 'm²', 45.00, 'mat'),
('09500.6.3.2', 'Forro de gesso acartonado - colocado, fixo com acabamento monolítico com perfis em aço galvanizado (12,5 mm)', 'm²', 42.00, 'mat'),
('09500.6.3.3', 'Forro de gesso acartonado - colocado, removível com perfil "T" de aço galvanizado (12,5 mm) - 0,65x1,25', 'm²', 48.00, 'mat'),
('09500.6.3.5', 'Forro de gesso acartonado - colocado, fixo, com acabamento monolítico suspenso por pendurais de arame galvanizado nº 18 (12,5 mm)', 'm²', 38.00, 'mat'),
('04060.8.1.22', 'Argamassa de cimento e areia peneirada traço 1:3', 'm³', 450.00, 'mat'),
('04060.8.1.34', 'Argamassa de cimento e areia sem peneirar traço 1:3', 'm³', 420.00, 'mat'),
('01270.0.30.1', 'Ladrilhista', 'h', 22.00, 'mo'),
('09606.3.2.14', 'Piso cerâmico esmaltado liso brilhante (300x300x8mm)', 'm²', 35.00, 'mat'),
('04060.8.1.78', 'Argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:0,5:5', 'm³', 480.00, 'mat'),
('09606.1.1.1', 'Mão-de-obra empreitada para assentamento de piso cerâmico', 'm²', 25.00, 'mo'),
('09705.3.2.6', 'Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas', 'kg', 1.80, 'mat'),
('09705.3.2.24', 'Argamassa pré-fabricada para rejuntamento cerâmico', 'kg', 4.50, 'mat'),
('09310.3.12.3', 'Rodapé cerâmico (300x80x8mm)', 'm', 12.00, 'mat'),
('04060.8.1.84', 'Argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:8', 'm³', 420.00, 'mat'),
('09310.3.5.14', 'Porcelanato polido (400x400x8,6mm)', 'm²', 65.00, 'mat'),
('09606.1.1.3', 'Mão-de-obra empreitada para assentamento de piso cerâmico de porcelanato', 'm²', 35.00, 'mo'),
('09705.3.2.12', 'Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas tipo porcelanato', 'kg', 2.50, 'mat'),
('04060.8.1.51', 'Argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com adição de 130 kg de cimento', 'm³', 450.00, 'mat'),
('04060.8.1.16', 'Argamassa de cal hidratada e areia sem peneirar traço 1:4', 'm³', 380.00, 'mat'),
('04060.8.1.80', 'Argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:6', 'm³', 460.00, 'mat'),
('09705.1.3.6', 'Mão-de-obra empreitada para execução de emboço em parede externa', 'm²', 22.00, 'mo'),
('02060.3.2.2', 'Areia lavada tipo média', 'm³', 120.00, 'mat'),
('02065.3.5.1', 'Cimento Portland CP II-E-32', 'kg', 0.85, 'mat'),
('09705.1.3.7', 'Mão-de-obra empreitada para execução de emboço em parede interna', 'm²', 20.00, 'mo'),
('09705.1.3.2', 'Mão-de-obra empreitada para execução de reboco em parede interna', 'm²', 18.00, 'mo'),
('09705.1.3.3', 'Mão-de-obra empreitada para execução de reboco em teto', 'm²', 22.00, 'mo'),
('09705.1.3.5', 'Mão-de-obra empreitada para execução de chapisco em parede interna', 'm²', 8.00, 'mo'),
('01270.0.15.1', 'Azulejista', 'h', 22.00, 'mo'),
('02065.3.4.1', 'Cimento branco não estrutural', 'kg', 4.50, 'mat'),
('09310.3.1.1', 'Azulejo cerâmico esmaltado liso (150x150mm)', 'm²', 45.00, 'mat'),
('09706.1.1.1', 'Mão-de-obra empreitada para assentamento de azulejos', 'm²', 30.00, 'mo'),
('09310.3.14.28', 'Revestimento cerâmico esmaltado liso (200x200mm)', 'm²', 55.00, 'mat'),
('01270.0.40.1', 'Pedreiro (especializado)', 'h', 22.00, 'mo'),
('04060.8.1.14', 'Argamassa de cal hidratada e areia sem peneirar traço 1:2', 'm³', 380.00, 'mat'),
('04060.8.1.15', 'Argamassa de cal hidratada e areia sem peneirar traço 1:3', 'm³', 380.00, 'mat'),
('04060.8.1.17', 'Argamassa de cal hidratada e areia peneirada traço 1:2', 'm³', 400.00, 'mat'),
('04060.8.1.18', 'Argamassa de cal hidratada e areia peneirada traço 1:3', 'm³', 400.00, 'mat'),
('04060.8.1.19', 'Argamassa de cal hidratada e areia peneirada traço 1:4,5', 'm³', 400.00, 'mat'),
('04060.8.1.13', 'Argamassa de cal hidratada e areia peneirada traço 1:4,5, com betoneira', 'm³', 420.00, 'mat'),
('04060.8.1.75', 'Argamassa mista de cimento, cal hidratada e areia peneirada traço 1:2:8', 'm³', 450.00, 'mat'),
('01270.0.21.1', 'Encanador', 'h', 22.00, 'mo'),
('01270.0.1.15', 'Ajudante de encanador', 'h', 18.00, 'mo'),
('10010.3.1.1', 'Tubo PVC soldável 20mm', 'm', 3.50, 'mat'),
('10010.3.1.2', 'Tubo PVC soldável 25mm', 'm', 4.20, 'mat'),
('10010.3.1.3', 'Tubo PVC soldável 32mm', 'm', 6.80, 'mat'),
('10010.3.1.4', 'Tubo PVC soldável 50mm', 'm', 12.50, 'mat'),
('10020.3.1.1', 'Tubo PVC esgoto 40mm', 'm', 5.50, 'mat'),
('10020.3.1.2', 'Tubo PVC esgoto 50mm', 'm', 7.20, 'mat'),
('10020.3.1.3', 'Tubo PVC esgoto 75mm', 'm', 11.50, 'mat'),
('10020.3.1.4', 'Tubo PVC esgoto 100mm', 'm', 15.80, 'mat'),
('11010.3.1.1', 'Cabo flexível 1.5mm²', 'm', 1.80, 'mat'),
('11010.3.1.2', 'Cabo flexível 2.5mm²', 'm', 2.80, 'mat'),
('11010.3.1.3', 'Cabo flexível 4mm²', 'm', 4.50, 'mat'),
('11010.3.1.4', 'Cabo flexível 6mm²', 'm', 6.80, 'mat'),
('11020.3.1.1', 'Eletroduto flexível corrugado 20mm', 'm', 1.20, 'mat'),
('11020.3.1.2', 'Eletroduto flexível corrugado 25mm', 'm', 1.80, 'mat'),
('11020.3.1.3', 'Eletroduto flexível corrugado 32mm', 'm', 2.50, 'mat'),
('11030.3.1.1', 'Caixa de luz 4x2', 'un', 1.50, 'mat'),
('11030.3.1.2', 'Caixa de luz 4x4', 'un', 2.20, 'mat'),
('11040.3.1.1', 'Interruptor simples', 'un', 12.50, 'mat'),
('11040.3.1.2', 'Tomada 2P+T', 'un', 15.00, 'mat'),
('11050.3.1.1', 'Disjuntor monopolar 10A', 'un', 18.00, 'mat'),
('11050.3.1.2', 'Disjuntor monopolar 16A', 'un', 18.00, 'mat'),
('11050.3.1.3', 'Disjuntor monopolar 20A', 'un', 18.00, 'mat'),
('11050.3.1.4', 'Disjuntor monopolar 25A', 'un', 18.00, 'mat'),
('09705.3.2.21', 'Argamassa pré-fabricada para rejuntamento cerâmico de juntas finas', 'kg', 4.50, 'mat'),
('09906.3.4.1', 'Massa acrílica para pintura látex', 'kg', 8.50, 'mat'),
('09906.3.5.2', 'Massa corrida base PVA', 'kg', 6.50, 'mat'),
('09940.3.1.1', 'Revestimento texturizado de alta camada (granulado fino irregular)', 'kg', 12.00, 'mat'),
('09940.3.1.2', 'Revestimento texturizado de alta camada (baixo relevo com ranhuras verticais)', 'kg', 14.00, 'mat'),
('09906.3.7.1', 'Selador acrílico', 'l', 15.00, 'mat'),
('09940.3.3.1', 'Textura acrílica', 'l', 18.00, 'mat'),
('16132.3.14.2', 'Caixa de ligação de PVC para eletroduto flexível corrugado de embutir 4"x4"', 'un', 4.50, 'mat'),
('16132.8.10.2', 'Eletroduto de PVC rígido de encaixe 3/4"', 'm', 5.80, 'mat'),
('16140.3.1.3', 'Placa (espelho) para caixa 4x4', 'un', 3.50, 'mat'),
('16132.8.3.2', 'Eletroduto de PVC flexível corrugado 3/4"', 'm', 2.20, 'mat'),
('16143.3.2.9', 'Interruptor de embutir uma tecla simples', 'un', 12.50, 'mat'),
('16143.3.2.8', 'Interruptor de embutir uma tecla paralelo', 'un', 15.00, 'mat'),
('16143.3.2.12', 'Interruptor de embutir uma tecla simples e uma paralelo', 'un', 22.00, 'mat'),
('16143.3.2.10', 'Interruptor de embutir uma tecla simples e duas paralelo', 'un', 28.00, 'mat'),
('16143.3.2.6', 'Interruptor de embutir uma tecla bipolar paralelo', 'un', 25.00, 'mat'),
('16143.3.2.7', 'Interruptor de embutir uma tecla dupla bipolar simples', 'un', 32.00, 'mat'),
('16143.3.2.1', 'Interruptor de embutir duas teclas simples', 'un', 20.00, 'mat'),
('16143.3.2.3', 'Interruptor de embutir duas teclas paralelo', 'un', 24.00, 'mat'),
('16143.3.2.2', 'Interruptor de embutir duas teclas simples e uma paralelo', 'un', 30.00, 'mat'),
('16143.3.2.4', 'Interruptor e tomada de embutir uma tecla simples e 1 tomada', 'un', 25.00, 'mat'),
('16143.3.2.33', 'Interruptor e tomada de embutir uma tecla paralelo e 1 tomada', 'un', 28.00, 'mat'),
('16143.3.2.35', 'Interruptor e tomada de embutir uma tecla simples, uma paralelo e 1 tomada', 'un', 35.00, 'mat'),
('16143.3.2.31', 'Interruptor e tomada de embutir duas teclas simples e 1 tomada', 'un', 32.00, 'mat'),
('16143.3.2.32', 'Interruptor e tomada de embutir duas teclas paralelo e 1 tomada', 'un', 38.00, 'mat'),
('16143.3.1.1', 'Placa (espelho) para caixa 3"x3"', 'un', 2.50, 'mat'),
('16143.3.1.2', 'Placa (espelho) para caixa 4"x2"', 'un', 2.50, 'mat'),
('16143.3.1.3', 'Placa (espelho) para caixa 4"x4"', 'un', 3.50, 'mat'),
('16143.3.4.1', 'Tomada de embutir 2P+T 20A', 'un', 15.00, 'mat'),
('16143.3.4.2', 'Tomada de embutir universal 2P 10A', 'un', 12.00, 'mat'),
('16143.3.4.8', 'Tomada de embutir para telefone (Jack 1/4)', 'un', 18.00, 'mat'),
('16143.3.4.82', 'Tomada de embutir para telefone (4 polos Telebrás)', 'un', 22.00, 'mat'),
('16143.3.4.83', 'Tomada de embutir para telefone (4 polos Telebrás para duto de piso)', 'un', 25.00, 'mat'),
('09906.1.2.1', 'Mão-de-obra empreitada para aplicação de massa corrida, com duas demãos', 'm²', 12.00, 'mo'),
('09940.1.2.1', 'Mão-de-obra empreitada para execução de textura acrílica', 'm²', 15.00, 'mo'),
('01270.0.1.14', 'Ajudante de encanador', 'h', 18.00, 'mo')
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
]'),

-- 02225.8.1.1 - REMOÇÃO DE DIVISÓRIA LEVE
('02225.8.1.1', '02.225', 'REMOÇÃO de divisória leve', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 1.80, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02225.8.2.1 - REMOÇÃO DE ESQUADRIA METÁLICA
('02225.8.2.1', '02.225', 'REMOÇÃO de esquadria metálica com ou sem reaproveitamento', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02225.8.5.1 - REMOÇÃO DE PINTURA LÁTEX
('02225.8.5.1', '02.225', 'REMOÇÃO de pintura látex', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02225.8.5.2 - REMOÇÃO DE PINTURA A CAL
('02225.8.5.2', '02.225', 'REMOÇÃO de pintura a cal', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02225.8.5.3 - REMOÇÃO DE PINTURA ÓLEO OU ESMALTE
('02225.8.5.3', '02.225', 'REMOÇÃO de pintura óleo ou esmalte', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Aguarrás mineral", "codigo": "09910.3.12.1", "un": "l", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02225.8.5.4 - REMOÇÃO DE PINTURA A TÉMPERA
('02225.8.5.4', '02.225', 'REMOÇÃO de pintura a têmpera', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Aguarrás mineral", "codigo": "09910.3.12.1", "un": "l", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02225.8.6.1 - REMOÇÃO DE REVESTIMENTO DE PISO CARPETE TÊXTIL
('02225.8.6.1', '02.225', 'REMOÇÃO de revestimento de piso carpete têxtil', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.01, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02225.8.6.2 - REMOÇÃO DE REVESTIMENTO DE PISO VINÍLICO
('02225.8.6.2', '02.225', 'REMOÇÃO de revestimento de piso vinílico', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.09, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02225.8.8.1 - REMOÇÃO DE ESQUADRIA DE MADEIRA
('02225.8.8.1', '02.225', 'REMOÇÃO de esquadria de madeira, inclusive batente', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.08, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02230.8.1.1 - CORTE DE CAPOEIRA FINA A FOICE
('02230.8.1.1', '02.230', 'CORTE de capoeira fina a foice', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.0774, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02230.8.3.1 - RASPAGEM E LIMPEZA MANUAL DE TERRENO
('02230.8.3.1', '02.230', 'RASPAGEM e limpeza manual de terreno', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02240.8.1.2 - ESGOTAMENTO COM BOMBA ELÉTRICA
('02240.8.1.2', '02.240', 'ESGOTAMENTO com bomba elétrica de imersão potência 2,7 kW, até 8,00 m de profundidade', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Bomba de drenagem submersa", "codigo": "22200.9.1.4", "un": "h prod.", "coef": 0.0222, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02240.8.3.1 - DRENO COM BRITAS 2 E 3
('02240.8.3.1', '02.240', 'DRENO com britas 2 e 3 - fornecimento e colocação', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 2.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 3", "codigo": "02060.3.3.3", "un": "m³", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02250.8.3.1 - ESCORAMENTO DE VALA CONTÍNUO
('02250.8.3.1', '02.250', 'ESCORAMENTO de vala empregando pranchas e longarinas de peroba - contínuo', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 1.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 2.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Viga 30x160mm peroba", "codigo": "06062.3.6.1", "un": "m", "coef": 1.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Viga 60x160mm peroba", "codigo": "06062.3.6.3", "un": "m", "coef": 0.15, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Escora de madeira 100mm eucalipto", "codigo": "06135.3.1.4", "un": "m", "coef": 0.14, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02250.8.3.2 - ESCORAMENTO DE VALA DESCONTÍNUO
('02250.8.3.2', '02.250', 'ESCORAMENTO de vala empregando pranchas e longarinas de peroba - descontínuo', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Viga 30x160mm peroba", "codigo": "06062.3.6.1", "un": "m", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Viga 60x160mm peroba", "codigo": "06062.3.6.3", "un": "m", "coef": 0.09, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Escora de madeira 100mm eucalipto", "codigo": "06135.3.1.4", "un": "m", "coef": 0.08, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02300.8.5.1 - SOLO-CIMENTO ENSACADO
('02300.8.5.1', '02.300', 'SOLO-CIMENTO ensacado para contenção de talude', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 5.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 17.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Solo retirado do local", "codigo": "02055.3.1.1", "un": "m²", "coef": 0.576, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 37.50, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Saco de aniagem", "codigo": "02230.3.9.1", "un": "un", "coef": 18.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02315.8.1.1 - ESCAVAÇÃO MANUAL EM ROCHA ATÉ 2M
('02315.8.1.1', '02.315', 'ESCAVAÇÃO MANUAL de vala em rocha de 3ª categoria, com uso de explosivos e perfuração manual - até 2m', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Cavouqueiro", "codigo": "01270.0.20.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 15.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espoleta simples", "codigo": "02350.3.4.1", "un": "un", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Estopim comum", "codigo": "02350.3.5.1", "un": "m", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Explosivo gelatinoso dinamite 40%", "codigo": "02350.3.6.1", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02315.8.1.2 - ESCAVAÇÃO MANUAL EM ROCHA ENTRE 2 E 4M
('02315.8.1.2', '02.315', 'ESCAVAÇÃO MANUAL de vala em rocha de 3ª categoria, com uso de explosivos e perfuração manual - entre 2 e 4m', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Cavouqueiro", "codigo": "01270.0.20.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 16.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espoleta simples", "codigo": "02350.3.4.1", "un": "un", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Estopim comum", "codigo": "02350.3.5.1", "un": "m", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Explosivo gelatinoso dinamite 40%", "codigo": "02350.3.6.1", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02310.8.1.1 - ESCAVAÇÃO MANUAL VALA TERRA FIRME ATÉ 1,50M
('02310.8.1.1', '02.310', 'ESCAVAÇÃO MANUAL de valas ou cavas em terra firme até 1,50m de profundidade', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02310.8.1.2 - ESCAVAÇÃO MANUAL VALA TERRA FIRME 1,50 A 3,00M
('02310.8.1.2', '02.310', 'ESCAVAÇÃO MANUAL de valas ou cavas em terra firme entre 1,50 e 3,00m de profundidade', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 2.50, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02310.8.2.1 - ESCAVAÇÃO MANUAL VALA TERRENO MÉDIO ATÉ 1,50M
('02310.8.2.1', '02.310', 'ESCAVAÇÃO MANUAL de valas ou cavas em terreno de consistência média até 1,50m de profundidade', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02310.8.2.2 - ESCAVAÇÃO MANUAL VALA TERRENO MÉDIO 1,50 A 3,00M
('02310.8.2.2', '02.310', 'ESCAVAÇÃO MANUAL de valas ou cavas em terreno de consistência média entre 1,50 e 3,00m de profundidade', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 3.75, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02313.8.1.1 - REATERRO MANUAL VALA COMPACTAÇÃO MANUAL
('02313.8.1.1', '02.313', 'REATERRO MANUAL de valas com compactação manual, sem fornecimento de terra', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02313.8.1.2 - REATERRO MANUAL VALA COMPACTAÇÃO MECÂNICA
('02313.8.1.2', '02.313', 'REATERRO MANUAL de valas com compactação mecânica, sem fornecimento de terra', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Compactador de solo a percussão", "codigo": "22300.9.1.1", "un": "h prod.", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02313.8.2.1 - REATERRO MANUAL VALA COMPACTAÇÃO MANUAL COM TERRA
('02313.8.2.1', '02.313', 'REATERRO MANUAL de valas com compactação manual, com fornecimento de terra', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Terra vegetal (comum)", "codigo": "02055.3.2.1", "un": "m³", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02313.8.2.2 - REATERRO MANUAL VALA COMPACTAÇÃO MECÂNICA COM TERRA
('02313.8.2.2', '02.313', 'REATERRO MANUAL de valas com compactação mecânica, com fornecimento de terra', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Compactador de solo a percussão", "codigo": "22300.9.1.1", "un": "h prod.", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Terra vegetal (comum)", "codigo": "02055.3.2.1", "un": "m³", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02225.8.10.1 - TRANSPORTE MANUAL ENTULHO ATÉ 30M
('02225.8.10.1', '02.225', 'TRANSPORTE manual de entulho até 30m', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02225.8.10.2 - TRANSPORTE MANUAL ENTULHO ATÉ 50M
('02225.8.10.2', '02.225', 'TRANSPORTE manual de entulho até 50m', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02225.8.11.1 - CARGA MANUAL ENTULHO EM CAMINHÃO
('02225.8.11.1', '02.225', 'CARGA manual de entulho em caminhão', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 01210.8.1.1 - LOCAÇÃO DE OBRA COM TÁBUAS CORRIDAS
('01210.8.1.1', '01.210', 'LOCAÇÃO de obra com tábuas corridas', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.15, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.15, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pontalete 3\" x 3\" (7,5 x 7,5 cm)", "codigo": "06062.3.2.1", "un": "m", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 6\" (2,5 x 15 cm)", "codigo": "06062.3.5.3", "un": "m", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.01, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 01210.8.1.2 - LOCAÇÃO DE OBRA COM CAVALETES
('01210.8.1.2', '01.210', 'LOCAÇÃO de obra com cavaletes', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pontalete 3\" x 3\" (7,5 x 7,5 cm)", "codigo": "06062.3.2.1", "un": "m", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 6\" (2,5 x 15 cm)", "codigo": "06062.3.5.3", "un": "m", "coef": 0.06, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.005, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02311.8.1.1 - ESCAVAÇÃO MECÂNICA VALAS RETROESCAVADEIRA (1ª CAT)
('02311.8.1.1', '02.311', 'ESCAVAÇÃO MECÂNICA de valas com retroescavadeira em terreno de 1ª categoria', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Retroescavadeira sobre pneus 80 HP", "codigo": "22040.9.1.1", "un": "h prod.", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02311.8.1.2 - ESCAVAÇÃO MECÂNICA VALAS RETROESCAVADEIRA (2ª CAT)
('02311.8.1.2', '02.311', 'ESCAVAÇÃO MECÂNICA de valas com retroescavadeira em terreno de 2ª categoria', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Retroescavadeira sobre pneus 80 HP", "codigo": "22040.9.1.1", "un": "h prod.", "coef": 0.07, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.15, "p_unit": 0, "p_total": 0, "tipo": "mo"}
]'),

-- 02465.8.1.1 - BROCA DE CONCRETO ARMADO (25MM)
('02465.8.1.1', '02.465', 'BROCA DE CONCRETO ARMADO, controle tipo "C", brita 1 e 2, fck = 13,5 MPa - diâmetro 25,00 mm', 'm', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 2.2946, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0452702, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.0102619, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.0307857, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 13.7971, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra de aço CA-25 1/4\"", "codigo": "03210.3.1.4", "un": "kg", "coef": 0.98, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.0150246, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02515.8.1.1 - LIGAÇÃO PROVISÓRIA DE LUZ E FORÇA
('02515.8.1.1', '02.515', 'LIGAÇÃO provisória de luz e força para obra - instalação mínima', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 24.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 24.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Fio isolado em PVC 6,00 mm²", "codigo": "16120.3.7.4", "un": "m", "coef": 27.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Caixa em chapa de aço entrada energia tipo K", "codigo": "16136.3.3.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Poste de aço para entrada de energia", "codigo": "16588.3.7.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02595.8.1.1 - LOCAÇÃO DA OBRA, EXECUÇÃO DE GABARITO
('02595.8.1.1', '02.595', 'LOCAÇÃO da obra, execução de gabarito', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.13, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.13, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.0120, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame galvanizado 16 BWG", "codigo": "05060.3.2.4", "un": "kg", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pontalete 3\" x 3\"", "codigo": "06062.3.2.1", "un": "m", "coef": 0.04, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 9\"", "codigo": "06062.3.5.4", "un": "m²", "coef": 0.09, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02710.8.6.1 - LASTRO DE CONCRETO (CONTRAPISO)
('02710.8.6.1', '02.710', 'LASTRO DE CONCRETO (contrapiso), incluindo preparo e lançamento', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Concreto não-estrutural, preparo com betoneira", "codigo": "03320.8.1.2", "un": "m³", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02710.8.6.2 - LASTRO DE CONCRETO (CONTRAPISO) E=5CM
('02710.8.6.2', '02.710', 'LASTRO DE CONCRETO (contrapiso), incluindo preparo de caixa, e = 5 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Concreto não-estrutural, preparo com betoneira", "codigo": "03320.8.1.2", "un": "m³", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02720.8.3.1 - BASE DE BRITA GRADUADA
('02720.8.3.1', '02.720', 'BASE DE BRITA graduada', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante", "codigo": "01270.0.1.1", "un": "h", "coef": 0.202, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedra britada graduada", "codigo": "02060.3.3.6", "un": "m³", "coef": 1.30, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Distribuidor de agregados rebocável", "codigo": "22500.9.2.1", "un": "h prod.", "coef": 0.0083, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Rolo compactador autopropelido vibratório tandem", "codigo": "22700.9.11.3", "un": "h prod.", "coef": 0.0083, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Rolo compactador autopropelido estático de pneus", "codigo": "22700.9.9.1", "un": "h prod.", "coef": 0.0083, "p_unit": 0, "p_total": 0, "tipo": "eq"},
  {"insumo": "Caminhão basculante", "codigo": "22800.9.1.1", "un": "h prod.", "coef": 0.0083, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02720.8.5.1 - LASTRO DE AREIA GROSSA
('02720.8.5.1', '02.720', 'LASTRO DE AREIA com areia grossa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 3.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo grossa", "codigo": "02060.3.2.4", "un": "m³", "coef": 1.15, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02720.8.6.1 - LASTRO DE BRITA 3 E 4
('02720.8.6.1', '02.720', 'LASTRO DE BRITA 3 e 4 apiloado manualmente com maço de até 30 kg', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 2.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedra britada 3", "codigo": "02060.3.3.3", "un": "m³", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 4", "codigo": "02060.3.3.4", "un": "m³", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02752.8.1.1 - PASSEIO EM CONCRETO FCK=13,5 MPA
('02752.8.1.1', '02.752', 'PASSEIO EM CONCRETO, fck = 13,5 MPa, controle tipo "C", incluindo preparo de caixa, e = 7 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.62, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.06454, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.01463, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.04389, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 19.67, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Ripa peroba 10x70mm", "codigo": "06062.3.3.2", "un": "m", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.02142, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02752.8.5.1 - PISO DE CONCRETO FCK=15 MPA
('02752.8.5.1', '02.752', 'PISO DE CONCRETO fck = 15 MPa, controle tipo "B", e = 12 cm, sobre lastro de brita 3 e 4, e = 5 cm, e armado com tela de aço CA-60', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.9450, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.11076, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.0251, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.0752, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 3", "codigo": "02060.3.3.3", "un": "m³", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 4", "codigo": "02060.3.3.4", "un": "m³", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 33.60, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tela de aço CA-60 soldada tipo Q138", "codigo": "03220.3.1.1", "un": "kg", "coef": 2.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.01, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 3ª construção 10x120mm cedrinho", "codigo": "06062.3.5.6", "un": "m", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.0367, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02752.8.6.1 - PISO RÚSTICO EM CONCRETO 1,20X1,20M
('02752.8.6.1', '02.752', 'PISO RÚSTICO EM CONCRETO, fck = 13,5 MPa, controle tipo "C", formando quadrados ripados e = 7 cm - dimensões 1,20 x 1,20 m', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.42, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0645, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.0146, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.0439, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 19.67, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Ripa peroba 10x70mm", "codigo": "06062.3.3.2", "un": "m", "coef": 1.82, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.0214, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 02753.8.1.1 - PISO CIMENTADO TRAÇO 1:4
('02753.8.1.1', '02.753', 'PISO CIMENTADO com argamassa de cimento e areia sem peneirar traço 1:4, e = 1,5 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.15, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0183, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 5.475, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 02825.8.2.1 - TAPUME DE CHAPA COMPENSADA 6MM
('02825.8.2.1', '02.825', 'TAPUME de chapa de madeira compensada, inclusive montagem - madeira compensada resinada e = 6 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ferragem para portão de tapume", "codigo": "02825.3.1.1", "un": "kg", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Chapa compensada resinada 6mm", "codigo": "03110.3.1.2", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.15, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pontalete 3\" x 3\"", "codigo": "06062.3.2.1", "un": "m", "coef": 3.15, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03110.8.1.1 - FÔRMA DE MADEIRA PARA PISO DE CONCRETO (APROV 1)
('03110.8.1.1', '03.110', 'FÔRMA de madeira para piso de concreto com sarrafos 2,5 x 7,5 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.15, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Desmoldante de fôrmas para concreto", "codigo": "03125.3.1.1", "un": "l", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 17 x 21 com cabeça", "codigo": "05060.3.20.11", "un": "kg", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo 1\" x 3\"", "codigo": "06062.3.4.5", "un": "m", "coef": 1.70, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03110.8.1.12 - FÔRMA DE MADEIRA MACIÇA PARA PILARES (APROV 1)
('03110.8.1.12', '03.110', 'FÔRMA de madeira maciça para pilares, com tábuas e sarrafos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 0.64, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 2.562, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 17 x 21 com cabeça", "codigo": "05060.3.20.11", "un": "kg", "coef": 0.15, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pontalete 3\" x 3\"", "codigo": "06062.3.2.4", "un": "m", "coef": 3.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo 1\" x 3\"", "codigo": "06062.3.4.5", "un": "m", "coef": 2.70, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 12\"", "codigo": "06062.3.5.2", "un": "m²", "coef": 1.45, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Desmoldante de fôrmas para concreto", "codigo": "03125.3.1.1", "un": "l", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 17 x 27 com cabeça dupla", "codigo": "05060.3.20.18", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame galvanizado 12 BWG", "codigo": "05060.3.2.2", "un": "kg", "coef": 0.18, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03110.8.1.17 - FÔRMA DE MADEIRA MACIÇA PARA VIGAS (APROV 1)
('03110.8.1.17', '03.110', 'FÔRMA de madeira maciça para vigas, com tábuas e sarrafos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 0.64, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 2.562, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 17 x 21 com cabeça", "codigo": "05060.3.20.11", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo 1\" x 3\"", "codigo": "06062.3.4.5", "un": "m", "coef": 3.60, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 12\"", "codigo": "06062.3.5.2", "un": "m²", "coef": 1.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Desmoldante de fôrmas para concreto", "codigo": "03125.3.1.1", "un": "l", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 17 x 27 com cabeça", "codigo": "05060.3.20.19", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03110.8.2.4 - FÔRMA COM CHAPA COMPENSADA PLASTIFICADA 12MM (APROV 8)
('03110.8.2.4', '03.110', 'FÔRMA com chapa compensada plastificada, e=12 mm, para pilares/vigas/lajes, incluso contraventamentos/travamentos com pontaletes 7,5 cm x 7,5 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 0.182, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.726, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Chapa compensada plastificada 12mm", "codigo": "03110.3.1.1", "un": "m²", "coef": 0.156, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 17 x 21 com cabeça", "codigo": "05060.3.20.11", "un": "kg", "coef": 0.025, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pontalete 3\" x 3\"", "codigo": "06062.3.2.4", "un": "m", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo 1\" x 3\"", "codigo": "06062.3.4.5", "un": "m", "coef": 1.031, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 8\"", "codigo": "06062.3.5.18", "un": "m", "coef": 0.065, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 6\"", "codigo": "06062.3.5.20", "un": "m", "coef": 0.063, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Desmoldante de fôrmas para concreto", "codigo": "03125.3.1.1", "un": "l", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 17 x 27 com cabeça dupla", "codigo": "05060.3.20.18", "un": "kg", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 15 x 15 com cabeça", "codigo": "05060.3.20.5", "un": "kg", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03110.8.2.6 - FÔRMA COM CHAPA COMPENSADA RESINADA 12MM (APROV 1)
('03110.8.2.6', '03.110', 'FÔRMA com chapa compensada resinada, e=12 mm, para pilares/vigas/lajes, incluso contraventamentos/escoramentos com pontaletes 7,5 cm x 7,5 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 0.444, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 1.776, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Chapa compensada resinada 12mm", "codigo": "03110.3.1.4", "un": "m²", "coef": 1.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 17 x 21 com cabeça", "codigo": "05060.3.20.11", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pontalete 3\" x 3\"", "codigo": "06062.3.2.4", "un": "m", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo 1\" x 3\"", "codigo": "06062.3.4.5", "un": "m", "coef": 8.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 8\"", "codigo": "06062.3.5.18", "un": "m", "coef": 0.52, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 6\"", "codigo": "06062.3.5.20", "un": "m", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Desmoldante de fôrmas para concreto", "codigo": "03125.3.1.1", "un": "l", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 17 x 27 com cabeça dupla", "codigo": "05060.3.20.18", "un": "kg", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 15 x 15 com cabeça", "codigo": "05060.3.20.5", "un": "kg", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03140.8.3.2 - ESCORAMENTO EM MADEIRA PARA VIGAS
('03140.8.3.2', '03.140', 'ESCORAMENTO EM MADEIRA para vigas de edificação, com escoras em eucalipto (d=10 cm) para altura entre 2,20 m e 3,00 m', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 0.215, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.225, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 17 x 21 com cabeça", "codigo": "05060.3.20.11", "un": "kg", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pontalete 3\" x 3\"", "codigo": "06062.3.2.4", "un": "m", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo 1\" x 3\"", "codigo": "06062.3.4.5", "un": "m", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tábua 1\" x 6\"", "codigo": "06062.3.5.20", "un": "m", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Escora de madeira 100mm eucalipto", "codigo": "06135.3.1.4", "un": "m", "coef": 3.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03210.8.1.3 - ARMADURA CA-50, D=8,0 MM, CORTE E DOBRA NA OBRA
('03210.8.1.3', '03.210', 'ARMADURA de aço para estruturas em geral, CA-50, diâmetro 8,0 mm, corte e dobra na obra', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.08, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.08, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espaçador circular de plástico para pilares, fundo e laterais de vigas, lajes, pisos e estacas (cobrimento: 30 mm)", "codigo": "03150.3.3.6", "un": "un", "coef": 11.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra de aço CA-50 5/16\"", "codigo": "03210.3.2.5", "un": "kg", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame recozido 18 BWG", "codigo": "05060.3.3.1", "un": "kg", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03210.8.1.4 - ARMADURA CA-50, D ATÉ 10,0 MM, CORTE E DOBRA INDUSTRIAL
('03210.8.1.4', '03.210', 'ARMADURA de aço para estruturas em geral, CA-50, diâmetro até 10,0 mm, corte e dobra industrial, fora da obra', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.06, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.06, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espaçador circular de plástico para pilares, fundo e laterais de vigas, lajes, pisos e estacas (cobrimento: 30 mm)", "codigo": "03150.3.3.6", "un": "un", "coef": 11.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Serviço de corte/dobra industrializado para aço CA 50/60", "codigo": "03210.1.2.1", "un": "kg", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra de aço CA-50 3/8\"", "codigo": "03210.3.2.2", "un": "kg", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame recozido 18 BWG", "codigo": "05060.3.3.1", "un": "kg", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03210.8.1.5 - ARMADURA CA-50, D=20,0 MM, CORTE E DOBRA NA OBRA
('03210.8.1.5', '03.210', 'ARMADURA de aço para estruturas em geral, CA-50, diâmetro 20,0 mm, corte e dobra na obra', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espaçador circular de plástico para pilares, fundo e laterais de vigas, lajes, pisos e estacas (cobrimento: 30 mm)", "codigo": "03150.3.3.6", "un": "un", "coef": 1.82, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra de aço CA-50 3/4\"", "codigo": "03210.3.2.4", "un": "kg", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame recozido 18 BWG", "codigo": "05060.3.3.1", "un": "kg", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03210.8.1.6 - ARMADURA CA-60, D=5,0 MM, CORTE E DOBRA NA OBRA
('03210.8.1.6', '03.210', 'ARMADURA de aço para estruturas em geral, CA-60, diâmetro 5,0 mm, corte e dobra na obra', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.07, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.07, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espaçador circular de plástico para pilares, fundo e laterais de vigas, lajes, pisos e estacas (cobrimento: 30 mm)", "codigo": "03150.3.3.6", "un": "un", "coef": 29.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra aço CA-60 5,00 mm", "codigo": "03210.3.5.2", "un": "kg", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame recozido 18 BWG", "codigo": "05060.3.3.1", "un": "kg", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03210.8.1.7 - ARMADURA CA-60, D=7,0 MM, CORTE E DOBRA NA OBRA
('03210.8.1.7', '03.210', 'ARMADURA de aço para estruturas em geral, CA-60, diâmetro 7,0 mm, corte e dobra na obra', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.08, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.08, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espaçador circular de plástico para pilares, fundo e laterais de vigas, lajes, pisos e estacas (cobrimento: 30 mm)", "codigo": "03150.3.3.6", "un": "un", "coef": 14.90, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra aço CA-60 7,00 mm", "codigo": "03210.3.5.3", "un": "kg", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame recozido 18 BWG", "codigo": "05060.3.3.1", "un": "kg", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03210.8.1.8 - ARMADURA CA-60, D ATÉ 9,5 MM, CORTE E DOBRA INDUSTRIAL
('03210.8.1.8', '03.210', 'ARMADURA de aço para estruturas em geral, CA-60, diâmetro até 9,5 mm, corte e dobra industrial, fora da obra', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espaçador circular de plástico para pilares, fundo e laterais de vigas, lajes, pisos e estacas (cobrimento: 30 mm)", "codigo": "03150.3.3.6", "un": "un", "coef": 8.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Serviço de corte/dobra industrializado para aço CA 50/60", "codigo": "03210.1.2.1", "un": "kg", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra aço CA-60 9,50 mm", "codigo": "03210.3.5.7", "un": "kg", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame recozido 18 BWG", "codigo": "05060.3.3.1", "un": "kg", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03210.8.1.10 - ARMADURA PARA PILARES, CA-50, CORTE E DOBRA NA OBRA
('03210.8.1.10', '03.210', 'ARMADURA de aço para pilares, CA-50, corte e dobra na obra', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.062, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.062, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espaçador circular de plástico para pilares, fundo e laterais de vigas, lajes, pisos e estacas (cobrimento: 30 mm)", "codigo": "03150.3.3.6", "un": "un", "coef": 4.70, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra de aço CA-50 1/2\"", "codigo": "03210.3.2.3", "un": "kg", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame recozido 18 BWG", "codigo": "05060.3.3.1", "un": "kg", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03210.8.1.11 - ARMADURA PARA VIGAS, CA-50, CORTE E DOBRA NA OBRA
('03210.8.1.11', '03.210', 'ARMADURA de aço para vigas, CA-50, corte e dobra na obra', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.093, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.093, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Espaçador circular de plástico para pilares, fundo e laterais de vigas, lajes, pisos e estacas (cobrimento: 30 mm)", "codigo": "03150.3.3.6", "un": "un", "coef": 7.30, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Barra de aço CA-50 3/8\"", "codigo": "03210.3.2.2", "un": "kg", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame recozido 18 BWG", "codigo": "05060.3.3.1", "un": "kg", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03310.8.1.38 - CONCRETO ESTRUTURAL VIRADO EM OBRA 13,5 MPA
('03310.8.1.38', '03.310', 'CONCRETO estrutural virado em obra, controle "C", consistência para vibração, brita 1, fck = 13,5 MPa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.886, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.836, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 295.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.3060, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 03310.8.1.39 - CONCRETO ESTRUTURAL VIRADO EM OBRA 15 MPA
('03310.8.1.39', '03.310', 'CONCRETO estrutural virado em obra, controle "C", consistência para vibração, brita 1, fck = 15 MPa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.876, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.836, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 308.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.3060, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 03310.8.2.6 - CONCRETO DOSADO EM CENTRAL 25 MPA
('03310.8.2.6', '03.310', 'CONCRETO estrutural dosado em central, convencional britas 1 e 2, fck = 25 MPa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Concreto dosado em central convencional britas 1 e 2", "codigo": "03310.3.1.1", "un": "m³", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03310.8.13.1 - TRANSPORTE E LANÇAMENTO DE CONCRETO
('03310.8.13.1', '03.310', 'TRANSPORTE, lançamento, adensamento e acabamento do concreto em estrutura', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.65, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 4.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Vibrador de imersão elétrico 1HP", "codigo": "22300.9.10.1", "un": "h prod.", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 03320.8.1.1 - CONCRETO NÃO-ESTRUTURAL PREPARO MANUAL
('03320.8.1.1', '03.320', 'CONCRETO NÃO-ESTRUTURAL, preparo manual', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 10.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.778, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.289, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.677, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 220.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03320.8.1.2 - CONCRETO NÃO-ESTRUTURAL PREPARO COM BETONEIRA
('03320.8.1.2', '03.320', 'CONCRETO NÃO-ESTRUTURAL, preparo com betoneira', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.677, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.263, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.615, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 220.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.3060, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 03350.8.1.1 - ADENSAMENTO E REGULARIZAÇÃO DE SUPERFÍCIE
('03350.8.1.1', '03.350', 'ADENSAMENTO e regularização de superfície de concreto empregando régua simples, profundidade até 15 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.09, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Régua vibratória simples elétrica 0,5HP", "codigo": "22300.9.8.1", "un": "h prod.", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 03350.8.2.1 - ACABAMENTO DE SUPERFÍCIE COM DESEMPENADEIRA MECÂNICA
('03350.8.2.1', '03.350', 'ACABAMENTO de superfície de concreto com desempenadeira mecânica elétrica', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.01, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Acabadora de superfície elétrica 2HP", "codigo": "22500.9.1.1", "un": "h prod.", "coef": 0.01, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 04060.8.1.12 - ARGAMASSA DE CAL E AREIA PENEIRADA 1:3
('04060.8.1.12', '04.060', 'ARGAMASSA de cal hidratada e areia peneirada traço 1:3', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 10.244, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.122, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 243.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04060.8.1.16 - ARGAMASSA DE CAL E AREIA SEM PENEIRAR 1:4
('04060.8.1.16', '04.060', 'ARGAMASSA de cal hidratada e areia sem peneirar traço 1:4', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 8.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.22, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 182.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04060.8.1.19 - ARGAMASSA DE CAL E AREIA SEM PENEIRAR 1:4,5 COM BETONEIRA
('04060.8.1.19', '04.060', 'ARGAMASSA de cal hidratada e areia sem peneirar traço 1:4,5, com betoneira', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 4.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.22, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 162.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.306, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 03310.8.1.41 - CONCRETO ESTRUTURAL VIRADO EM OBRA 13,5 MPA BRITAS 1 E 2
('03310.8.1.41', '03.310', 'CONCRETO estrutural virado em obra, controle "C", consistência para vibração, britas 1 e 2, fck = 13,5 MPa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.922, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.209, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.627, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 281.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.3060, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 03310.8.1.42 - CONCRETO ESTRUTURAL VIRADO EM OBRA 15 MPA BRITAS 1 E 2
('03310.8.1.42', '03.310', 'CONCRETO estrutural virado em obra, controle "C", consistência para vibração, britas 1 e 2, fck = 15 MPa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.913, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.209, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.627, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 293.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.3060, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 03310.8.2.3 - CONCRETO DOSADO EM CENTRAL 15 MPA
('03310.8.2.3', '03.310', 'CONCRETO estrutural dosado em central, convencional britas 1 e 2, fck = 15 MPa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Concreto dosado em central convencional britas 1 e 2", "codigo": "03310.3.1.1", "un": "m³", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03310.8.2.5 - CONCRETO DOSADO EM CENTRAL 20 MPA
('03310.8.2.5', '03.310', 'CONCRETO estrutural dosado em central, convencional britas 1 e 2, fck = 20 MPa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Concreto dosado em central convencional britas 1 e 2", "codigo": "03310.3.1.1", "un": "m³", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03310.8.2.11 - CONCRETO ALTO DESEMPENHO 50 MPA
('03310.8.2.11', '03.310', 'CONCRETO estrutural dosado em central, de alto desempenho, fck = 50 MPa, relação água/cimento: 0,4', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Concreto dosado em central de alto desempenho", "codigo": "03300.3.1.1", "un": "m³", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03310.8.2.14 - CONCRETO AUTO-ADENSÁVEL 25 MPA
('03310.8.2.14', '03.310', 'CONCRETO estrutural dosado em central, auto-adensável, fck = 25 MPa', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Concreto dosado em central auto-adensável", "codigo": "03300.3.1.2", "un": "m³", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03320.8.1.3 - CONCRETO NÃO-ESTRUTURAL COM ADITIVO IMPERMEABILIZANTE
('03320.8.1.3', '03.320', 'CONCRETO NÃO-ESTRUTURAL, preparo com betoneira, com aditivo impermeabilizante', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.677, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.263, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.615, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 220.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Aditivo hidrófugo", "codigo": "07110.3.1.1", "un": "l", "coef": 2.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.3060, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 04060.8.1.11 - ARGAMASSA DE CAL E AREIA PENEIRADA 1:2
('04060.8.1.11', '04.060', 'ARGAMASSA de cal hidratada e areia peneirada traço 1:2', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 10.244, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.122, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 365.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04060.8.1.22 - ARGAMASSA DE CIMENTO E AREIA PENEIRADA 1:3
('04060.8.1.22', '04.060', 'ARGAMASSA de cimento e areia peneirada traço 1:3', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 12.244, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.122, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 486.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04060.8.1.25 - ARGAMASSA DE CIMENTO E AREIA PENEIRADA 1:4 COM ADITIVO
('04060.8.1.25', '04.060', 'ARGAMASSA de cimento e areia peneirada traço 1:4, com aditivo impermeabilizante', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 12.244, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.122, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 365.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Aditivo impermeabilizante e plastificante em pó", "codigo": "07110.3.3.1", "un": "kg", "coef": 20.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04060.8.1.34 - ARGAMASSA DE CIMENTO E AREIA SEM PENEIRAR 1:3
('04060.8.1.34', '04.060', 'ARGAMASSA de cimento e areia sem peneirar traço 1:3', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 10.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.22, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 486.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04060.8.1.42 - ARGAMASSA DE CIMENTO E AREIA PENEIRADA 1:8 COM ADITIVO AGLUTINANTE
('04060.8.1.42', '04.060', 'ARGAMASSA de cimento, areia média peneirada e aditivo aglutinante traço 1:8', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 12.244, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.122, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 182.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Aglutinante organo-sintético", "codigo": "00050.3.3.1", "un": "l", "coef": 0.701, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04060.8.1.50 - ARGAMASSA MISTA DE CAL E AREIA SEM PENEIRAR 1:4 + 100KG CIMENTO
('04060.8.1.50', '04.060', 'ARGAMASSA mista de cal hidratada e areia sem peneirar traço 1:4, com adição de 100 kg de cimento', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 9.336, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.11674, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 166.894, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 100.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04060.8.1.80 - ARGAMASSA MISTA DE CIMENTO, CAL E AREIA SEM PENEIRAR 1:1:4
('04060.8.1.80', '04.060', 'ARGAMASSA mista de cimento, cal hidratada e areia sem peneirar traço 1:1:4', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 10.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 1.22, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 182.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 365.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04085.8.1.1 - VERGA RETA MOLDADA NO LOCAL
('04085.8.1.1', '04.085', 'VERGA RETA moldada no local com fôrma de madeira considerando cinco reaproveitamentos, concreto armado fck = 13,5 MPa, controle tipo "B"', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 16.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 4.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 28.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.933, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.209, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 2", "codigo": "02060.3.3.2", "un": "m³", "coef": 0.627, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 268.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.306, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 04211.8.1.1 - ALVENARIA DE VEDAÇÃO TIJOLO MACIÇO 5,7CM
('04211.8.1.1', '04.211', 'ALVENARIA de vedação com tijolos maciços cerâmico 5,7 x 9 x 19 cm, juntas de 12 mm com argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com 100 kg de cimento - tipo 5 - espessura 5,7cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.926, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tijolo maciço cerâmico 5,7 x 9 x 19 cm", "codigo": "04211.3.4.1", "un": "un", "coef": 51.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com adição de 100 kg de cimento", "codigo": "04060.8.1.50", "un": "m³", "coef": 0.011921, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04211.8.1.2 - ALVENARIA DE VEDAÇÃO TIJOLO MACIÇO 9CM
('04211.8.1.2', '04.211', 'ALVENARIA de vedação com tijolos maciços cerâmico 5,7 x 9 x 19 cm, juntas de 12 mm com argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com 100 kg de cimento - tipo 5 - espessura 9cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.6522, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tijolo maciço cerâmico 5,7 x 9 x 19 cm", "codigo": "04211.3.4.1", "un": "un", "coef": 75.30, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com adição de 100 kg de cimento", "codigo": "04060.8.1.50", "un": "m³", "coef": 0.0239337, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04211.8.1.6 - ALVENARIA DE VEDAÇÃO TIJOLO MACIÇO 9CM TRAÇO 1:2:8
('04211.8.1.6', '04.211', 'ALVENARIA de vedação com tijolos maciços cerâmico 5,7 x 9 x 19 cm, juntas de 12 mm com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:8 - tipo 5 - espessura 9cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.861, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tijolo maciço cerâmico 5,7 x 9 x 19 cm", "codigo": "04211.3.4.1", "un": "un", "coef": 75.30, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:8", "codigo": "04060.8.1.84", "un": "m³", "coef": 0.031842, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04211.8.1.17 - ALVENARIA TIJOLO MACIÇO 9CM MÃO DE OBRA EMPREITADA
('04211.8.1.17', '04.211', 'ALVENARIA de vedação com tijolos maciços cerâmico 5,7 x 9 x 19 cm, espessura da parede 9 cm, juntas de 12 mm com argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com 100 kg de cimento - tipo 5 - (com mão-de-obra empreitada)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão de obra empreitada para execução de alvenaria com tijolo comum 5,7 x 9 x 19 cm", "codigo": "04211.1.1.9", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.0522, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tijolo maciço cerâmico 5,7 x 9 x 19 cm", "codigo": "04211.3.4.1", "un": "un", "coef": 75.30, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.61, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa de cal hidratada e areia sem peneirar traço 1:4", "codigo": "04060.8.1.16", "un": "m³", "coef": 0.0239337, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04211.8.1.22 - ALVENARIA TIJOLO MACIÇO 9CM ARGAMASSA INDUSTRIALIZADA
('04211.8.1.22', '04.211', 'ALVENARIA de vedação com tijolos maciços cerâmico 5,7 x 9 x 19 cm, juntas de 12 mm com argamassa industrializada - espessura 9cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 1.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa pré-fabricada para assentamento de alvenaria", "codigo": "04060.3.2.1", "un": "kg", "coef": 37.90, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tijolo maciço cerâmico 5,7 x 9 x 19 cm", "codigo": "04211.3.4.1", "un": "un", "coef": 75.30, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04211.8.2.17 - ALVENARIA BLOCO CERÂMICO FURADO 14CM ARGAMASSA MISTA 1:2:8
('04211.8.2.17', '04.211', 'ALVENARIA de vedação com blocos cerâmicos furados, juntas de 12 mm, assentado com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:8 - tipo 2 - espessura 14cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.859, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.019398, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 2.8938, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.8938, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Bloco cerâmico de vedação 14 x 19 x 39 cm", "codigo": "04211.3.1.2", "un": "un", "coef": 12.90, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04211.8.2.22 - ALVENARIA BLOCO CERÂMICO FURADO 14CM ARGAMASSA INDUSTRIALIZADA
('04211.8.2.22', '04.211', 'ALVENARIA de vedação com blocos cerâmicos furados, juntas de 12 mm com argamassa industrializada - espessura 14cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa pré-fabricada para assentamento de alvenaria", "codigo": "04060.3.2.1", "un": "kg", "coef": 23.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Bloco cerâmico de vedação 14 x 19 x 39 cm", "codigo": "04211.3.1.2", "un": "un", "coef": 12.90, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 06110.8.1.4 - ESTRUTURA DE MADEIRA PARA TELHA CERÂMICA OU CONCRETO
('06110.8.1.4', '06.110', 'ESTRUTURA de madeira para telha cerâmica ou de concreto, ancorada em laje ou parede', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.24, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Madeira peroba", "codigo": "06060.3.1.1", "un": "m³", "coef": 0.021, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 06110.8.3.1 - ESTRUTURA DE MADEIRA PARA TELHA ONDULADA VÃO 10M
('06110.8.3.1', '06.110', 'ESTRUTURA de madeira para telha ondulada de fibrocimento, alumínio ou plástica - vão 10m', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 1.77, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 1.77, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.18, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Ferragem para telhados tipo chapa de emenda de ferro", "codigo": "05060.3.9.1", "un": "kg", "coef": 0.41, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Madeira peroba", "codigo": "06060.3.1.1", "un": "m³", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 07320.8.3.1 - COBERTURA TELHA CERÂMICA FRANCESA
('07320.8.3.1', '07.320', 'COBERTURA com telha cerâmica francesa, inclinação 35%', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de telhadista", "codigo": "01270.0.1.20", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Telhadista", "codigo": "01270.0.48.1", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Telha cerâmica francesa", "codigo": "07320.3.9.1", "un": "un", "coef": 17.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 07320.8.3.2 - COBERTURA TELHA CERÂMICA PAULISTA
('07320.8.3.2', '07.320', 'COBERTURA com telha cerâmica paulista com argamassa de cimento, cal hidratada e areia sem peneirar, no traço 1:2:9, inclinação 35%', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de telhadista", "codigo": "01270.0.1.20", "un": "h", "coef": 2.03, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Telhadista", "codigo": "01270.0.48.1", "un": "h", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0038, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 0.486, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 0.486, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Telha cerâmica paulista", "codigo": "07320.3.9.2", "un": "un", "coef": 25.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 07320.8.4.1 - COBERTURA TELHA DE CONCRETO
('07320.8.4.1', '07.320', 'COBERTURA com telha de concreto largura útil 320 mm, largura total 330 mm, comprimento útil 319 mm e comprimento total 419 mm, inclinação acima de 30%', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de telhadista", "codigo": "01270.0.1.20", "un": "h", "coef": 1.08, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Telhadista", "codigo": "01270.0.48.1", "un": "h", "coef": 0.27, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Telha de concreto", "codigo": "07320.3.10.1", "un": "un", "coef": 10.90, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 07320.8.5.2 - COBERTURA TELHA FIBROCIMENTO 6MM
('07320.8.5.2', '07.320', 'COBERTURA com telha de fibrocimento, uma água, perfil ondulado, e = 6 mm, altura 51 mm, largura útil 1.050 mm, largura nominal 1.100 mm, inclinação 27%', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de telhadista", "codigo": "01270.0.1.20", "un": "h", "coef": 0.22, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Telhadista", "codigo": "01270.0.48.1", "un": "h", "coef": 0.22, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Parafuso com rosca soberba galvanizado 110mm", "codigo": "05060.3.31.1", "un": "un", "coef": 1.42, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Telha de fibrocimento ondulada 6mm", "codigo": "07320.3.11.6", "un": "m²", "coef": 1.15, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Conjunto vedação elástica", "codigo": "07325.3.6.1", "un": "un", "coef": 1.42, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08210.8.1.2 - PORTA EXTERNA MADEIRA 0,90 X 2,10M
('08210.8.1.2', '08.210', 'PORTA externa de madeira, colocação e acabamento, de uma folha com batente, guarnição e ferragem - 0,90 x 2,10m', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 3.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 3.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 1.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0106, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 1.72, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 1.72, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 16 x 24 com cabeça", "codigo": "05060.3.20.4", "un": "kg", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Parafuso madeira cabeça chata fenda simples 90mm", "codigo": "05060.3.24.1", "un": "un", "coef": 8.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Taco de madeira peroba 15x50x60mm", "codigo": "06062.3.8.2", "un": "un", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Batente de madeira peroba para porta", "codigo": "08210.3.1.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Guarnição de madeira peroba para porta", "codigo": "08210.3.2.1", "un": "un", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Porta almofadada de madeira duas faces 35mm", "codigo": "08210.3.5.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Dobradiça de ferro para porta 2 1/2\" x 3\"", "codigo": "08710.3.2.1", "un": "un", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Fechadura completa para porta externa em latão", "codigo": "08710.3.9.4", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 06110.8.3.4 - ESTRUTURA DE MADEIRA PARA TELHA ONDULADA ANCORADA
('06110.8.3.4', '06.110', 'ESTRUTURA de madeira para telha ondulada de fibrocimento, alumínio ou plástica, ancorada em laje ou parede', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Madeira peroba", "codigo": "06060.3.1.1", "un": "m³", "coef": 0.0102, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08210.8.3.1 - PORTA INTERNA MADEIRA 0,60 X 2,10M
('08210.8.3.1', '08.210', 'PORTA interna de madeira, colocação e acabamento, de uma folha com batente, guarnição e ferragem - 0,60 x 2,10m', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 3.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 3.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 1.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0106, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 1.72, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 1.72, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 16 x 24 com cabeça", "codigo": "05060.3.20.4", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Parafuso madeira cabeça chata fenda simples 90mm", "codigo": "05060.3.24.1", "un": "un", "coef": 8.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Taco de madeira peroba 15x50x60mm", "codigo": "06062.3.8.2", "un": "un", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Batente de madeira peroba para porta", "codigo": "08210.3.1.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Guarnição de madeira peroba para porta", "codigo": "08210.3.2.1", "un": "un", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Porta lisa de madeira encabeçada 0,80 x 2,10m imbuia", "codigo": "08210.3.4.3", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Fechadura completa para porta interna em latão", "codigo": "08710.3.10.4", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Dobradiça de ferro para porta 2 1/2\" x 3\"", "codigo": "08710.3.2.1", "un": "un", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08210.8.8.1 - BATENTE E GUARNIÇÃO PARA PORTA DE MADEIRA
('08210.8.8.1', '08.210', 'BATENTE E GUARNIÇÃO para porta de madeira', 'm', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.012, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 5.19, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 16 x 24 com cabeça", "codigo": "05060.3.20.4", "un": "kg", "coef": 0.09, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Taco de madeira peroba 15x50x60mm", "codigo": "06062.3.8.2", "un": "un", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Batente de madeira peroba para porta", "codigo": "08210.3.1.2", "un": "un", "coef": 0.185, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Guarnição de madeira peroba para porta", "codigo": "08210.3.2.1", "un": "un", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08520.8.1.1 - JANELA ALUMÍNIO BASCULANTE
('08520.8.1.1', '08.520', 'JANELA de alumínio sob encomenda, colocação e acabamento, basculante, com contramarcos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0049, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 1.94, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Caixilho de alumínio sob encomenda basculante natural", "codigo": "08520.3.1.5", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08530.8.1.1 - JANELA AÇO PINTADO 1,20 X 1,50M
('08530.8.1.1', '08.530', 'JANELA de aço pintado (esmalte) padronizada, colocação e acabamento, de correr, com quatro folhas, sem bandeira, dimensões 1,20 m x 1,50 m, com vidro liso', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 1.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.825, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.00578, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.33, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Janela de aço pintado de correr 1,20 x 1,50m com vidro", "codigo": "08530.3.1.6", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08710.8.9.1 - FERRAGENS PARA PORTA INTERNA SIMPLES
('08710.8.9.1', '08.710', 'FERRAGENS para porta interna simples', 'cj', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 4.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 4.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Fechadura completa para porta interna em latão", "codigo": "08710.3.10.4", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Dobradiça de ferro para porta 2 1/2\" x 3\"", "codigo": "08710.3.2.1", "un": "un", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08810.8.1.1 - VIDRO COMUM ARAMADO 6MM
('08810.8.1.1', '08.810', 'VIDRO comum aramado, colocado em caixilho com ou sem baguetes, duas demãos de massa e = 6 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra especializada para colocação de vidro", "codigo": "08800.1.1.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Vidro aramado incolor 6mm", "codigo": "08800.3.2.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Massa para vidro comum", "codigo": "08770.3.13.1", "un": "kg", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08810.8.3.1 - VIDRO CRISTAL COMUM LISO 4MM
('08810.8.3.1', '08.810', 'VIDRO cristal comum liso, colocado em caixilho com ou sem baguetes, duas demãos de massa - 4mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra especializada para colocação de vidro", "codigo": "08800.1.1.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Vidro cristal comum liso 4mm", "codigo": "08800.3.3.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Massa para vidro comum", "codigo": "08770.3.13.1", "un": "kg", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08810.8.4.1 - VIDRO CRISTAL LAMINADO 6MM
('08810.8.4.1', '08.810', 'VIDRO cristal laminado, colocado em caixilho com ou sem baguetes, com gaxeta de neoprene - 6mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Vidro laminado 6mm", "codigo": "08800.3.4.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Diversos sobre materiais para a colocação de vidros", "codigo": "08800.13.1.1", "un": "%", "coef": 20.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08810.8.6.1 - VIDRO TEMPERADO 6MM
('08810.8.6.1', '08.810', 'VIDRO temperado, colocado em caixilho com ou sem baguetes, com gaxeta de neoprene - 6mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Vidro temperado 6mm", "codigo": "08800.3.6.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Diversos sobre materiais para a colocação de vidros (temperado)", "codigo": "08810.13.1.9", "un": "%", "coef": 20.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08820.8.1.2 - VIDRO TEMPERADO FIXO 10MM COM FERRAGEM
('08820.8.1.2', '08.820', 'VIDRO temperado fixo, 10 mm, uma folha, 900 mm x 2.100 mm, com ferragem cromada', 'cj', 0, 0, 0, 25,
'[
  {"insumo": "Suporte de canto (1302)", "codigo": "08770.3.18.1", "un": "un", "coef": 4.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Suporte de centro (1329)", "codigo": "08770.3.19.1", "un": "un", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Vidro temperado incolor liso 10mm", "codigo": "08810.3.6.2", "un": "m²", "coef": 1.89, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Diversos sobre materiais para a colocação de vidros (fixo)", "codigo": "08810.13.1.13", "un": "%", "coef": 30.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08210.8.3.2 - PORTA INTERNA MADEIRA 0,70 X 2,10M
('08210.8.3.2', '08.210', 'PORTA interna de madeira, colocação e acabamento, de uma folha com batente, guarnição e ferragem - 0,70 x 2,10m', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 3.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 3.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 1.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0106, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 1.72, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 1.72, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 16 x 24 com cabeça", "codigo": "05060.3.20.4", "un": "kg", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Parafuso madeira cabeça chata fenda simples 90mm", "codigo": "05060.3.24.1", "un": "un", "coef": 8.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Taco de madeira peroba 15x50x60mm", "codigo": "06062.3.8.2", "un": "un", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Batente de madeira peroba para porta", "codigo": "08210.3.1.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Guarnição de madeira peroba para porta", "codigo": "08210.3.2.1", "un": "un", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Porta lisa de madeira encabeçada 0,80 x 2,10m imbuia", "codigo": "08210.3.4.3", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Fechadura completa para porta interna em latão", "codigo": "08710.3.10.4", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Dobradiça de ferro para porta 2 1/2\" x 3\"", "codigo": "08710.3.2.1", "un": "un", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08520.8.1.2 - JANELA ALUMÍNIO DE CORRER
('08520.8.1.2', '08.520', 'JANELA de alumínio sob encomenda, colocação e acabamento, de correr, com contramarcos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0049, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 1.94, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Caixilho de alumínio sob encomenda de correr natural", "codigo": "08520.3.1.6", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08530.8.1.2 - JANELA AÇO PINTADO 1,00 X 1,20M
('08530.8.1.2', '08.530', 'JANELA de aço pintado (esmalte) padronizada, colocação e acabamento, de correr, com quatro folhas, sem bandeira, dimensões 1,00 m x 1,20 m, com vidro liso', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.40.1", "un": "h", "coef": 1.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.825, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.00578, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.33, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Janela de aço pintado de correr 1,00 x 1,20m com vidro", "codigo": "08530.3.1.5", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08710.8.9.3 - FERRAGENS PARA PORTA EXTERNA SIMPLES
('08710.8.9.3', '08.710', 'FERRAGENS para porta externa simples', 'cj', 0, 0, 0, 25,
'[
  {"insumo": "Carpinteiro", "codigo": "01270.0.19.1", "un": "h", "coef": 4.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ajudante de carpinteiro", "codigo": "01270.0.1.11", "un": "h", "coef": 4.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Fechadura completa para porta externa em latão", "codigo": "08710.3.9.4", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Dobradiça de ferro para porta 2 1/2\" x 3\"", "codigo": "08710.3.2.1", "un": "un", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08810.8.2.1 - VIDRO COMUM FANTASIA 4MM
('08810.8.2.1', '08.810', 'VIDRO comum fantasia, colocado em caixilho com ou sem baguetes, duas demãos de massa - 4mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra especializada para colocação de vidro", "codigo": "08800.1.1.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Vidro cristal comum fantasia incolor 4mm", "codigo": "08800.3.3.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Massa para vidro comum", "codigo": "08770.3.13.1", "un": "kg", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08810.8.3.2 - VIDRO CRISTAL COMUM LISO 5MM
('08810.8.3.2', '08.810', 'VIDRO cristal comum liso, colocado em caixilho com ou sem baguetes, duas demãos de massa - 5mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra especializada para colocação de vidro", "codigo": "08800.1.1.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Vidro cristal comum liso 5mm", "codigo": "08800.3.3.3", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Massa para vidro comum", "codigo": "08770.3.13.1", "un": "kg", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08810.8.6.2 - VIDRO TEMPERADO 8MM
('08810.8.6.2', '08.810', 'VIDRO temperado, colocado em caixilho com ou sem baguetes, com gaxeta de neoprene - 8mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Vidro temperado 8mm", "codigo": "08800.3.6.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Diversos sobre materiais para a colocação de vidros (temperado)", "codigo": "08810.13.1.9", "un": "%", "coef": 20.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08820.8.1.3 - VIDRO TEMPERADO FIXO 10MM DUAS FOLHAS
('08820.8.1.3', '08.820', 'VIDRO temperado fixo, 10 mm, duas folhas, 1.800 mm x 2.100 mm, com ferragem cromada', 'cj', 0, 0, 0, 25,
'[
  {"insumo": "Suporte com miolo para dois vidros (1306)", "codigo": "08770.3.16.1", "un": "un", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Suporte de canto (1302)", "codigo": "08770.3.18.1", "un": "un", "coef": 4.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Suporte de centro (1329)", "codigo": "08770.3.19.1", "un": "un", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Botão de correção com parafuso (tipo: 1002 / cor: fosco acetinado)", "codigo": "08770.3.2.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Vidro temperado incolor liso 10mm", "codigo": "08810.3.6.2", "un": "m²", "coef": 3.78, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Diversos sobre materiais para a colocação de vidros", "codigo": "08810.13.1.14", "un": "%", "coef": 30.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 08820.8.2.2 - PORTA DE VIDRO TEMPERADO 10MM UMA FOLHA
('08820.8.2.2', '08.820', 'PORTA de vidro temperado, 10 mm, uma folha, 900 mm x 2.100 mm, com ferragem e mola hidráulica', 'cj', 0, 0, 0, 25,
'[
  {"insumo": "Dobradiça inferior", "codigo": "08710.3.4.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Dobradiça superior", "codigo": "08710.3.7.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Fechadura central com dois cilindros", "codigo": "08710.3.8.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Mola hidráulica", "codigo": "08770.3.14.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Puxador de madeira", "codigo": "08770.3.15.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Bucha para pivotante de dobradiça (tipo: 1201)", "codigo": "08770.3.3.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Vidro temperado incolor liso 10mm", "codigo": "08810.3.6.2", "un": "m²", "coef": 1.89, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Diversos sobre materiais para a colocação de vidros", "codigo": "08810.13.1.22", "un": "%", "coef": 30.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.3.1 - PINTURA TIPO CAIAÇÃO PAREDE EXTERNA
('09115.8.3.1', '09.115', 'PINTURA TIPO CAIAÇÃO com três demãos em parede externa', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.015, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Cal em pó para pintura", "codigo": "09910.3.2.1", "un": "kg", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Óleo de linhaça", "codigo": "09910.3.21.1", "un": "kg", "coef": 0.0225, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pigmento para tinta (pó)", "codigo": "09910.3.22.2", "un": "kg", "coef": 0.015, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.3.2 - PINTURA TIPO CAIAÇÃO PAREDE INTERNA
('09115.8.3.2', '09.115', 'PINTURA TIPO CAIAÇÃO com três demãos em parede interna', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.015, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Cal em pó para pintura", "codigo": "09910.3.2.1", "un": "kg", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Óleo de linhaça", "codigo": "09910.3.21.1", "un": "kg", "coef": 0.0225, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pigmento para tinta (pó)", "codigo": "09910.3.22.2", "un": "kg", "coef": 0.015, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.5.1 - PINTURA COM TINTA ACRÍLICA EM PISO
('09115.8.5.1', '09.115', 'PINTURA COM TINTA ACRÍLICA em piso de concreto, duas demãos, aplicada com rolo de lã', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tinta à base de emulsão acrílica para piso - acabamento liso/rugoso", "codigo": "09910.3.5.1", "un": "l", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.5.2 - PINTURA COM TINTA ACRÍLICA EM PISO FAIXAS
('09115.8.5.2', '09.115', 'PINTURA COM TINTA ACRÍLICA em piso, para faixas de demarcação, com faixas de 5 cm de largura, aplicada com trincha', 'm', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tinta à base de emulsão acrílica para piso - acabamento liso/rugoso", "codigo": "09910.3.5.1", "un": "l", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.8.1 - PINTURA COM TINTA EPÓXI EM PAREDE INTERNA
('09115.8.8.1', '09.115', 'PINTURA COM TINTA EPÓXI em parede interna, com duas demãos, incluindo emassamento e lixamento', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 1.90, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 1.90, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Massa à base de epóxi", "codigo": "09960.3.1.1", "un": "kg", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Fundo à base de epóxi", "codigo": "09960.3.11.1", "un": "l", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tinta epóxi brilhante", "codigo": "09960.3.9.1", "un": "l", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.9.8 - PINTURA COM TINTA ESMALTE EM ESQUADRIA DE MADEIRA
('09115.8.9.8', '09.115', 'PINTURA COM TINTA ESMALTE em esquadria de madeira, com duas demãos, sem massa corrida', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.35, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Fundo nivelador para madeira (cor: branco fosco)", "codigo": "09906.3.1.1", "un": "l", "coef": 0.13, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Aguarrás mineral", "codigo": "09900.3.12.1", "un": "l", "coef": 0.04, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Esmalte sintético para madeiras e metais (tipo de acabamento: acetinado)", "codigo": "09900.3.3.1", "un": "l", "coef": 0.16, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.11.1 - PINTURA COM TINTA LÁTEX ACRÍLICA EM PAREDE EXTERNA DUAS DEMÃOS
('09115.8.11.1', '09.115', 'PINTURA COM TINTA LÁTEX ACRÍLICA em parede externa, sem massa corrida, duas demãos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.35, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Líquido preparador de superfícies lata 18 l", "codigo": "09906.3.3.1", "un": "l", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tinta látex acrílica (tipo de acabamento: fosco)", "codigo": "09910.3.7.2", "un": "l", "coef": 0.17, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.11.2 - PINTURA COM TINTA LÁTEX ACRÍLICA EM PAREDE EXTERNA TRÊS DEMÃOS
('09115.8.11.2', '09.115', 'PINTURA COM TINTA LÁTEX ACRÍLICA em parede externa, sem massa corrida, três demãos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Líquido preparador de superfícies lata 18 l", "codigo": "09906.3.3.1", "un": "l", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tinta látex acrílica (tipo de acabamento: fosco)", "codigo": "09910.3.7.2", "un": "l", "coef": 0.24, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.12.1 - PINTURA COM TINTA LÁTEX PVA EM PAREDE INTERNA DUAS DEMÃOS
('09115.8.12.1', '09.115', 'PINTURA COM TINTA LÁTEX PVA em parede interna, com duas demãos, sem massa corrida', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.35, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Selador base PVA para pintura látex", "codigo": "09906.3.8.1", "un": "l", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tinta látex PVA (tipo de acabamento: fosco)", "codigo": "09910.3.7.4", "un": "l", "coef": 0.17, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.12.2 - PINTURA COM TINTA LÁTEX PVA EM PAREDE INTERNA TRÊS DEMÃOS
('09115.8.12.2', '09.115', 'PINTURA COM TINTA LÁTEX PVA em parede interna, com três demãos, sem massa corrida', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Selador base PVA para pintura látex", "codigo": "09906.3.8.1", "un": "l", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tinta látex PVA (tipo de acabamento: fosco)", "codigo": "09910.3.7.4", "un": "l", "coef": 0.24, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.12.10 - PINTURA COM TINTA LÁTEX PVA EM PAREDE INTERNA EMPREITADA DUAS DEMÃOS
('09115.8.12.10', '09.115', 'PINTURA COM TINTA LÁTEX PVA em parede interna, sem massa corrida (com mão-de-obra empreitada), duas demãos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para pintura com tinta látex", "codigo": "09015.1.3.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Selador base PVA para pintura látex", "codigo": "09906.3.8.1", "un": "l", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tinta látex PVA (tipo de acabamento: fosco)", "codigo": "09910.3.7.4", "un": "l", "coef": 0.17, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.12.11 - PINTURA COM TINTA LÁTEX PVA EM PAREDE INTERNA EMPREITADA TRÊS DEMÃOS
('09115.8.12.11', '09.115', 'PINTURA COM TINTA LÁTEX PVA em parede interna, sem massa corrida (com mão-de-obra empreitada), três demãos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para pintura com tinta látex", "codigo": "09015.1.3.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Selador base PVA para pintura látex", "codigo": "09906.3.8.1", "un": "l", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Tinta látex PVA (tipo de acabamento: fosco)", "codigo": "09910.3.7.4", "un": "l", "coef": 0.24, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.9.12 - PINTURA COM TINTA ESMALTE EM ESQUADRIA DE FERRO
('09115.8.9.12', '09.115', 'PINTURA COM TINTA ESMALTE em esquadria de ferro, com duas demãos', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Zarcão", "codigo": "09906.3.9.1", "un": "l", "coef": 0.12, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Aguarrás mineral", "codigo": "09910.3.12.1", "un": "l", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície metálica grana 100", "codigo": "09910.3.30.21", "un": "un", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Esmalte sintético para madeiras e metais (tipo de acabamento: acetinado)", "codigo": "09910.3.3.1", "un": "l", "coef": 0.16, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09115.8.20.1 - PINTURA COM ESMALTE SINTÉTICO PARA METAIS FERROSOS
('09115.8.20.1', '09.115', 'PINTURA COM ESMALTE SINTÉTICO para metais ferrosos em rufo, calha e condutor, com uma demão', 'm', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Zarcão", "codigo": "09906.3.9.1", "un": "l", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Aguarrás mineral", "codigo": "09900.3.12.1", "un": "l", "coef": 0.025, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Esmalte sintético para metais ferrosos", "codigo": "09900.3.3.5", "un": "l", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.6.1 - FORRO DE PVC EM PAINÉIS LINEARES (100 X 6.000 MM)
('09500.8.6.1', '09.500', 'FORRO de PVC em painéis lineares encaixados entre si e fixados em estrutura de madeira (100 x 6.000 mm)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante", "codigo": "01270.0.1.1", "un": "h", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Montador", "codigo": "01270.0.33.1", "un": "h", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pino liso de aço (comprimento: 25,00 mm / diâmetro nominal: 1/4\")", "codigo": "05060.3.17.1", "un": "un", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame galvanizado (bitola: 18 BWG)", "codigo": "05060.3.2.5", "un": "kg", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 10 x 10 com cabeça", "codigo": "05060.3.20.2", "un": "kg", "coef": 0.013, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.028, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo aparelhado (seção transversal: 1\" x 2\" / tipo de madeira: cedro)", "codigo": "06062.3.4.1", "un": "m", "coef": 1.80, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo aparelhado (seção transversal: 1\" x 4\" / tipo de madeira: pinho)", "codigo": "06062.3.4.4", "un": "m", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arremate para forro de PVC - perfil \"U\"", "codigo": "09500.3.5.1", "un": "m", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lamina de PVC para forro (100 mm)", "codigo": "09500.3.6.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.6.2 - FORRO DE PVC EM PAINÉIS LINEARES (200 X 6.000 MM)
('09500.8.6.2', '09.500', 'FORRO de PVC em painéis lineares encaixados entre si e fixados em estrutura de madeira (200 x 6.000 mm)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante", "codigo": "01270.0.1.1", "un": "h", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Montador", "codigo": "01270.0.33.1", "un": "h", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pino liso de aço (comprimento: 25,00 mm / diâmetro nominal: 1/4\")", "codigo": "05060.3.17.1", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame galvanizado (bitola: 18 BWG)", "codigo": "05060.3.2.5", "un": "kg", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 10 x 10 com cabeça", "codigo": "05060.3.20.2", "un": "kg", "coef": 0.007, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.014, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo aparelhado (seção transversal: 1\" x 2\" / tipo de madeira: cedro)", "codigo": "06062.3.4.1", "un": "m", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo aparelhado (seção transversal: 1\" x 4\" / tipo de madeira: pinho)", "codigo": "06062.3.4.4", "un": "m", "coef": 0.45, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arremate para forro de PVC - perfil \"U\"", "codigo": "09500.3.5.1", "un": "m", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lamina de PVC para forro (200 mm)", "codigo": "09500.3.6.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.6.3 - FORRO DE PVC EM PAINÉIS LINEARES (EMPREITADA, 100 X 6.000 MM)
('09500.8.6.3', '09.500', 'FORRO de PVC em painéis lineares encaixados entre si e fixados em estrutura de madeira (com mão-de-obra empreitada) (100 x 6.000 mm)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para colocação de forro", "codigo": "09500.1.1.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pino liso de aço (comprimento: 25,00 mm / diâmetro nominal: 1/4\")", "codigo": "05060.3.17.1", "un": "un", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame galvanizado (bitola: 18 BWG)", "codigo": "05060.3.2.5", "un": "kg", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 10 x 10 com cabeça", "codigo": "05060.3.20.2", "un": "kg", "coef": 0.013, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.028, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo aparelhado (seção transversal: 1\" x 2\" / tipo de madeira: cedro)", "codigo": "06062.3.4.1", "un": "m", "coef": 1.80, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo aparelhado (seção transversal: 1\" x 4\" / tipo de madeira: pinho)", "codigo": "06062.3.4.4", "un": "m", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arremate para forro de PVC - perfil \"U\"", "codigo": "09500.3.5.1", "un": "m", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lamina de PVC para forro (100 mm)", "codigo": "09500.3.6.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.6.4 - FORRO DE PVC EM PAINÉIS LINEARES (EMPREITADA, 200 X 6.000 MM)
('09500.8.6.4', '09.500', 'FORRO de PVC em painéis lineares encaixados entre si e fixados em estrutura de madeira (com mão-de-obra empreitada) (200 x 6.000 mm)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para colocação de forro", "codigo": "09500.1.1.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pino liso de aço (comprimento: 25,00 mm / diâmetro nominal: 1/4\")", "codigo": "05060.3.17.1", "un": "un", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame galvanizado (bitola: 18 BWG)", "codigo": "05060.3.2.5", "un": "kg", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 10 x 10 com cabeça", "codigo": "05060.3.20.2", "un": "kg", "coef": 0.007, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Prego 18 x 27 com cabeça", "codigo": "05060.3.20.6", "un": "kg", "coef": 0.014, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo aparelhado (seção transversal: 1\" x 2\" / tipo de madeira: cedro)", "codigo": "06062.3.4.1", "un": "m", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Sarrafo aparelhado (seção transversal: 1\" x 4\" / tipo de madeira: pinho)", "codigo": "06062.3.4.4", "un": "m", "coef": 0.45, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arremate para forro de PVC - perfil \"U\"", "codigo": "09500.3.5.1", "un": "m", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lamina de PVC para forro (200 mm)", "codigo": "09500.3.6.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.8.1 - FORRO DE GESSO FIXO MONOLÍTICO (E=30 MM)
('09500.8.8.1', '09.500', 'FORRO DE GESSO fixo monolítico com placa pré-moldada, encaixe macho-e-fêmea, e=30 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Forro de gesso liso tipo bisotado encaixe macho-e-fêmea (60x60x30mm)", "codigo": "09500.6.4.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.8.2 - FORRO DE GESSO ACARTONADO REMOVÍVEL (0,65 X 0,65 M)
('09500.8.8.2', '09.500', 'FORRO DE GESSO acartonado removível, apoiado em perfis metálicos tipo \"T\" suspenso por pendurais rígidos, e=12,5 mm (modulação 0,65 x 0,65 m)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Forro de gesso acartonado - colocado, removível com perfil \"T\" de aço galvanizado (12,5 mm) - 0,65x0,65", "codigo": "09500.6.3.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.8.3 - FORRO DE GESSO ACARTONADO REMOVÍVEL (0,65 X 1,25 M)
('09500.8.8.3', '09.500', 'FORRO DE GESSO acartonado removível, apoiado em perfis metálicos tipo \"T\" suspenso por pendurais rígidos, e=12,5 mm (modulação 0,65 x 1,25 m)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Forro de gesso acartonado - colocado, removível com perfil \"T\" de aço galvanizado (12,5 mm) - 0,65x1,25", "codigo": "09500.6.3.3", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.8.4 - FORRO DE GESSO ACARTONADO FIXO MONOLÍTICO (PERFIS A 0,60 M)
('09500.8.8.4', '09.500', 'FORRO DE GESSO acartonado fixo, monolítico, aparafusado em perfis metálicos espaçados a 0,60 m, suspensos por pendurais rígidos reguláveis, espaçados a cada 1,00 m, e=12,5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Forro de gesso acartonado - colocado, fixo com acabamento monolítico com perfis em aço galvanizado (12,5 mm)", "codigo": "09500.6.3.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09500.8.8.5 - FORRO DE GESSO ACARTONADO FIXO MONOLÍTICO (ARAME Nº 18)
('09500.8.8.5', '09.500', 'FORRO DE GESSO acartonado fixo monolítico, suspenso por pendurais de arame galvanizado no 18 painel, e=12,5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Forro de gesso acartonado - colocado, fixo, com acabamento monolítico suspenso por pendurais de arame galvanizado nº 18 (12,5 mm)", "codigo": "09500.6.3.5", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09605.8.1.1 - REGULARIZAÇÃO SARRAFEADA (TRAÇO 1:3, E=3 CM)
('09605.8.1.1', '09.605', 'REGULARIZAÇÃO SARRAFEADA de base para revestimento de piso com argamassa de cimento e areia peneirada traço 1:3, e=3 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cimento e areia peneirada traço 1:3", "codigo": "04060.8.1.22", "un": "m³", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09605.8.4.1 - REGULARIZAÇÃO DESEMPENADA (TRAÇO 1:3, E=3 CM)
('09605.8.4.1', '09.605', 'REGULARIZAÇÃO DESEMPENADA de base para revestimento de piso com argamassa de cimento e areia sem peneirar traço 1:3, e=3 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cimento e areia sem peneirar traço 1:3", "codigo": "04060.8.1.34", "un": "m³", "coef": 0.03, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09606.8.2.1 - PISO CERÂMICO ESMALTADO (TRAÇO 1:0,5:5, E=2,5 CM)
('09606.8.2.1', '09.606', 'PISO CERÂMICO esmaltado 30 cm x 30 cm, assentado com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:0,5:5, e=2,5 cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ladrilhista", "codigo": "01270.0.30.1", "un": "h", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 1.30, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Piso cerâmico esmaltado liso brilhante (300x300x8mm)", "codigo": "09606.3.2.14", "un": "m²", "coef": 1.19, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:0,5:5", "codigo": "04060.8.1.78", "un": "m³", "coef": 0.025, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09606.8.2.2 - PISO CERÂMICO ESMALTADO (CIMENTO COLANTE, PRÓPRIA)
('09606.8.2.2', '09.606', 'PISO CERÂMICO esmaltado 30 cm x 30 cm, assentado com argamassa pré-fabricada de cimento colante (mão-de-obra própria)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ladrilhista", "codigo": "01270.0.30.1", "un": "h", "coef": 0.44, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.22, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Piso cerâmico esmaltado liso brilhante (300x300x8mm)", "codigo": "09606.3.2.14", "un": "m²", "coef": 1.19, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09606.8.2.3 - PISO CERÂMICO ESMALTADO (CIMENTO COLANTE, EMPREITADA)
('09606.8.2.3', '09.606', 'PISO CERÂMICO esmaltado 30 cm x 30 cm, assentado com argamassa pré-fabricada de cimento colante (mão-de-obra empreitada)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para assentamento de piso cerâmico", "codigo": "09606.1.1.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Piso cerâmico esmaltado liso brilhante (300x300x8mm)", "codigo": "09606.3.2.14", "un": "m²", "coef": 1.19, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09606.8.3.1 - REJUNTAMENTO DE PISO CERÂMICO (JUNTA 6 MM)
('09606.8.3.1', '09.606', 'REJUNTAMENTO DE PISO cerâmico com argamassa pré-fabricada, espessura da junta: 6 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa pré-fabricada para rejuntamento cerâmico", "codigo": "09705.3.2.24", "un": "kg", "coef": 0.529, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09606.8.4.1 - RODAPÉ CERÂMICO (TRAÇO 1:2:8, ALTURA 8 CM)
('09606.8.4.1', '09.606', 'RODAPÉ cerâmico assentado com argamassa mista de cimento, cal hidratada e areia sem peneirar, traço 1:2:8, altura 8 cm', 'm', 0, 0, 0, 25,
'[
  {"insumo": "Ladrilhista", "codigo": "01270.0.30.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Rodapé cerâmico (300x80x8mm)", "codigo": "09310.3.12.3", "un": "m", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:8", "codigo": "04060.8.1.84", "un": "m³", "coef": 0.0008, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09606.8.5.1 - PORCELANATO POLIDO (CIMENTO COLANTE, PRÓPRIA)
('09606.8.5.1', '09.606', 'PORCELANATO polido 40 x 40 cm, assentado com argamassa pré-fabricada de cimento colante (mão-de-obra própria)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ladrilhista", "codigo": "01270.0.30.1", "un": "h", "coef": 0.44, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.22, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Porcelanato polido (400x400x8,6mm)", "codigo": "09310.3.5.14", "un": "m²", "coef": 1.19, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas tipo porcelanato", "codigo": "09705.3.2.12", "un": "kg", "coef": 9.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09606.8.5.2 - PORCELANATO POLIDO (CIMENTO COLANTE, EMPREITADA)
('09606.8.5.2', '09.606', 'PORCELANATO polido 40 x 40 cm, assentado com argamassa pré-fabricada de cimento colante (mão-de-obra empreitada)', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para assentamento de piso cerâmico de porcelanato", "codigo": "09606.1.1.3", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Porcelanato polido (400x400x8,6mm)", "codigo": "09310.3.5.14", "un": "m²", "coef": 1.19, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas tipo porcelanato", "codigo": "09705.3.2.12", "un": "kg", "coef": 9.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.2 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:3, E=20 MM)
('09705.8.2.2', '09.705', 'EMBOÇO para parede interna com argamassa de cimento e areia sem peneirar traço 1:3, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cimento e areia sem peneirar traço 1:3", "codigo": "04060.8.1.34", "un": "m³", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.12 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:4 + CIMENTO, E=20 MM)
('09705.8.2.12', '09.705', 'EMBOÇO para parede interna com argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com adição de 130 kg de cimento, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.64, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.60, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa de cal hidratada e areia sem peneirar traço 1:4", "codigo": "04060.8.1.16", "un": "m³", "coef": 0.01784, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.13 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:2:8, E=20 MM)
('09705.8.2.13', '09.705', 'EMBOÇO para parede interna com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:8, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 3.64, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 3.64, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.14 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:2:9, E=20 MM)
('09705.8.2.14', '09.705', 'EMBOÇO para parede interna com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:9, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 3.24, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 3.24, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.15 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:2:11, E=20 MM)
('09705.8.2.15', '09.705', 'EMBOÇO para parede interna with argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:11, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.72, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 2.66, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.66, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.007, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 09705.8.2.16 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:4, E=20 MM)
('09705.8.2.16', '09.705', 'EMBOÇO para parede interna com argamassa de cimento e areia sem peneirar traço 1:4, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 7.30, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.17 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:5, E=20 MM)
('09705.8.2.17', '09.705', 'EMBOÇO para parede interna com argamassa de cimento e areia sem peneirar traço 1:5, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.80, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 5.84, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.21 - EMBOÇO PARA PAREDE EXTERNA (TRAÇO 1:2:6, E=20 MM)
('09705.8.2.21', '09.705', 'EMBOÇO para parede externa com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:6, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.82, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.66, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0305, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 6.075, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 6.075, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.22 - EMBOÇO EM TETO (TRAÇO 1:2:9, E=20 MM)
('09705.8.2.22', '09.705', 'EMBOÇO em teto com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:9, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 3.24, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 3.24, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.23 - EMBOÇO EM TETO (TRAÇO 1:2:11, E=20 MM)
('09705.8.2.23', '09.705', 'EMBOÇO em teto com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:11, e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.90, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 2.66, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.66, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.27 - EMBOÇO PARA PAREDE EXTERNA (EMPREITADA, TRAÇO 1:2:6, E=20 MM)
('09705.8.2.27', '09.705', 'EMBOÇO para parede externa com argamassa mista de cimento, cal hidratada e areia sem peneirar traço 1:2:6 - (com mão-de-obra empreitada), e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de emboço em parede externa", "codigo": "09705.1.3.6", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0305, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 6.075, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 6.075, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.28 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:2, EMPREITADA, E=20 MM)
('09705.8.2.28', '09.705', 'EMBOÇO para parede interna com argamassa de cal hidratada e areia sem peneirar traço 1:2 - (com mão-de-obra empreitada), e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de emboço em parede interna", "codigo": "09705.1.3.7", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cal hidratada e areia sem peneirar traço 1:2", "codigo": "04060.8.1.14", "un": "m³", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.29 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:3, EMPREITADA, E=20 MM)
('09705.8.2.29', '09.705', 'EMBOÇO para parede interna com argamassa de cal hidratada e areia sem peneirar traço 1:3 - (com mão-de-obra empreitada), e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de emboço em parede interna", "codigo": "09705.1.3.7", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cal hidratada e areia sem peneirar traço 1:3", "codigo": "04060.8.1.15", "un": "m³", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.30 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:4,5, EMPREITADA, E=20 MM)
('09705.8.2.30', '09.705', 'EMBOÇO para parede interna com argamassa de cal hidratada e areia sem peneirar traço 1:4,5 - (com mão-de-obra empreitada), e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de emboço em parede interna", "codigo": "09705.1.3.7", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cal hidratada e areia sem peneirar traço 1:4", "codigo": "04060.8.1.16", "un": "m³", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.31 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:3, EMPREITADA, E=20 MM)
('09705.8.2.31', '09.705', 'EMBOÇO para parede interna com argamassa de cimento e areia sem peneirar traço 1:3 - (com mão-de-obra empreitada), e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de emboço em parede interna", "codigo": "09705.1.3.7", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 9.72, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.32 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:4, EMPREITADA, E=20 MM)
('09705.8.2.32', '09.705', 'EMBOÇO para parede interna com argamassa de cimento e areia sem peneirar traço 1:4 - (com mão-de-obra empreitada), e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de emboço em parede interna", "codigo": "09705.1.3.7", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 7.30, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.33 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:5, EMPREITADA, E=20 MM)
('09705.8.2.33', '09.705', 'EMBOÇO para parede interna com argamassa de cimento e areia sem peneirar traço 1:5 - (com mão-de-obra empreitada), e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de emboço em parede interna", "codigo": "09705.1.3.7", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0244, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 5.84, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.2.34 - EMBOÇO PARA PAREDE INTERNA (TRAÇO 1:4 + CIMENTO, EMPREITADA, E=20 MM)
('09705.8.2.34', '09.705', 'EMBOÇO para parede interna com argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com adição de 130 kg de cimento - (com mão-de-obra empreitada), e=20 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de emboço em parede interna", "codigo": "09705.1.3.7", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.04, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.60, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa de cal hidratada e areia sem peneirar traço 1:4", "codigo": "04060.8.1.16", "un": "m³", "coef": 0.01784, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.3.26 - REBOCO EM TETO (TRAÇO 1:2, E=5 MM)
('09705.8.3.26', '09.705', 'REBOCO em teto com argamassa de cal hidratada e areia peneirada traço 1:2, e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro (especializado)", "codigo": "01270.0.40.1", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.64, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.004675, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 1.825, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.3.27 - REBOCO EM TETO (TRAÇO 1:3, E=5 MM)
('09705.8.3.27', '09.705', 'REBOCO em teto com argamassa de cal hidratada e areia peneirada traço 1:3, e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro (especializado)", "codigo": "01270.0.40.1", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.64, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.004675, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 1.215, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.3.28 - REBOCO EM TETO (TRAÇO 1:4,5, BETONEIRA, E=5 MM)
('09705.8.3.28', '09.705', 'REBOCO em teto com argamassa de cal hidratada e areia peneirada traço 1:4,5, com betoneira, e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro (especializado)", "codigo": "01270.0.40.1", "un": "h", "coef": 0.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.624, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.004675, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 0.81, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.00175, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 09705.8.3.32 - REBOCO PAREDE INTERNA (TRAÇO 1:2, EMPREITADA, E=5 MM)
('09705.8.3.32', '09.705', 'REBOCO para parede interna com argamassa de cal hidratada e areia peneirada traço 1:2 - (com mão-de-obra empreitada), e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de reboco em parede interna", "codigo": "09705.1.3.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cal hidratada e areia peneirada traço 1:2", "codigo": "04060.8.1.17", "un": "m³", "coef": 0.005, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.3.33 - REBOCO PAREDE INTERNA (TRAÇO 1:3, EMPREITADA, E=5 MM)
('09705.8.3.33', '09.705', 'REBOCO para parede interna com argamassa de cal hidratada e areia peneirada traço 1:3 - (com mão-de-obra empreitada), e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de reboco em parede interna", "codigo": "09705.1.3.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cal hidratada e areia peneirada traço 1:3", "codigo": "04060.8.1.18", "un": "m³", "coef": 0.005, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.3.34 - REBOCO PAREDE INTERNA (TRAÇO 1:4,5, EMPREITADA, E=5 MM)
('09705.8.3.34', '09.705', 'REBOCO para parede interna com argamassa de cal hidratada e areia peneirada traço 1:4,5 - (com mão-de-obra empreitada), e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de reboco em parede interna", "codigo": "09705.1.3.2", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa de cal hidratada e areia peneirada traço 1:4,5", "codigo": "04060.8.1.19", "un": "m³", "coef": 0.005, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.3.47 - REBOCO EM TETO (TRAÇO 1:2, EMPREITADA, E=5 MM)
('09705.8.3.47', '09.705', 'REBOCO em teto com argamassa de cal hidratada e areia peneirada traço 1:2 - (com mão-de-obra empreitada), e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de reboco em teto", "codigo": "09705.1.3.3", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.04, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.004675, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 1.825, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.3.48 - REBOCO EM TETO (TRAÇO 1:3, EMPREITADA, E=5 MM)
('09705.8.3.48', '09.705', 'REBOCO em teto com argamassa de cal hidratada e areia peneirada traço 1:3 - (com mão-de-obra empreitada), e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de reboco em teto", "codigo": "09705.1.3.3", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.04, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.004675, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 1.215, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.3.49 - REBOCO EM TETO (TRAÇO 1:4,5, EMPREITADA, E=5 MM)
('09705.8.3.49', '09.705', 'REBOCO em teto com argamassa de cal hidratada e areia peneirada traço 1:4,5 - (com mão-de-obra empreitada), e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de reboco em teto", "codigo": "09705.1.3.3", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.024, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.004675, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 0.81, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 0.00175, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 09705.8.12.4 - CHAPISCO PAREDE (TRAÇO 1:3, E=5 MM)
('09705.8.12.4', '09.705', 'CHAPISCO para parede interna ou externa com argamassa de cimento e areia sem peneirar traço 1:3, e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro (especializado)", "codigo": "01270.0.40.1", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.15, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0061, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.43, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.12.8 - CHAPISCO PAREDE INTERNA (EMPREITADA, TRAÇO 1:3, E=5 MM)
('09705.8.12.8', '09.705', 'CHAPISCO para parede interna com argamassa de cimento e areia sem peneirar traço 1:3 - (com mão-de-obra empreitada), e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de chapisco em parede interna", "codigo": "09705.1.3.5", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0061, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.43, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09705.8.12.9 - CHAPISCO PAREDE EXTERNA (EMPREITADA, TRAÇO 1:3, E=5 MM)
('09705.8.12.9', '09.705', 'CHAPISCO para parede externa com argamassa de cimento e areia sem peneirar traço 1:3 - (com mão-de-obra empreitada), e=5 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de chapisco em parede interna", "codigo": "09705.1.3.5", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.0061, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 2.43, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.4 - AZULEJO A PRUMO (TRAÇO 1:2:8)
('09706.8.1.4', '09.706', 'AZULEJO assentado com argamassa mista de cimento, cal hidratada e areia peneirada traço 1:2:8 - a prumo', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Azulejista", "codigo": "01270.0.15.1", "un": "h", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.0187, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 3.64, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento branco não estrutural", "codigo": "02065.3.4.1", "un": "kg", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 3.64, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.5 - AZULEJO EM AMARRAÇÃO (TRAÇO 1:2:8)
('09706.8.1.5', '09.706', 'AZULEJO assentado com argamassa mista de cimento, cal hidratada e areia peneirada traço 1:2:8 - em amarração', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Azulejista", "codigo": "01270.0.15.1", "un": "h", "coef": 1.60, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.0187, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 3.64, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento branco não estrutural", "codigo": "02065.3.4.1", "un": "kg", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 3.64, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.6 - AZULEJO EM DIAGONAL (TRAÇO 1:2:8)
('09706.8.1.6', '09.706', 'AZULEJO assentado com argamassa mista de cimento, cal hidratada e areia peneirada traço 1:2:8 - em diagonal', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Azulejista", "codigo": "01270.0.15.1", "un": "h", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.75, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia média - Secagem e peneiramento", "codigo": "02060.8.1.1", "un": "m³", "coef": 0.0187, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cal hidratada CH III", "codigo": "02065.3.2.1", "un": "kg", "coef": 3.64, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento branco não estrutural", "codigo": "02065.3.4.1", "un": "kg", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 3.64, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.7 - AZULEJO A PRUMO (CIMENTO COLANTE)
('09706.8.1.7', '09.706', 'AZULEJO assentado com argamassa pré-fabricada de cimento colante - a prumo', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Azulejista", "codigo": "01270.0.15.1", "un": "h", "coef": 0.36, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.8 - AZULEJO EM AMARRAÇÃO (CIMENTO COLANTE)
('09706.8.1.8', '09.706', 'AZULEJO assentado com argamassa pré-fabricada de cimento colante - em amarração', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Azulejista", "codigo": "01270.0.15.1", "un": "h", "coef": 0.27, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.9 - AZULEJO EM DIAGONAL (CIMENTO COLANTE)
('09706.8.1.9', '09.706', 'AZULEJO assentado com argamassa pré-fabricada de cimento colante - em diagonal', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Azulejista", "codigo": "01270.0.15.1", "un": "h", "coef": 0.54, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.16 - AZULEJO A PRUMO (CIMENTO COLANTE, EMPREITADA)
('09706.8.1.16', '09.706', 'AZULEJO assentado com argamassa pré-fabricada de cimento colante - (com mão-de-obra empreitada) - a prumo', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para assentamento de azulejos", "codigo": "09706.1.1.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.17 - AZULEJO EM AMARRAÇÃO (CIMENTO COLANTE, EMPREITADA)
('09706.8.1.17', '09.706', 'AZULEJO assentado com argamassa pré-fabricada de cimento colante - (com mão-de-obra empreitada) - em amarração', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para assentamento de azulejos", "codigo": "09706.1.1.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.1.18 - AZULEJO EM DIAGONAL (CIMENTO COLANTE, EMPREITADA)
('09706.8.1.18', '09.706', 'AZULEJO assentado com argamassa pré-fabricada de cimento colante - (com mão-de-obra empreitada) - em diagonal', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para assentamento de azulejos", "codigo": "09706.1.1.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.3.1 - CERÂMICA 20X20 (CIMENTO COLANTE)
('09706.8.3.1', '09.706', 'CERÂMICA comum em placa 20 cm x 20 cm, assentada com argamassa pré-fabricada de cimento colante e rejuntamento com cimento branco', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ladrilhista", "codigo": "01270.0.30.1", "un": "h", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Cimento branco não estrutural", "codigo": "02065.3.4.1", "un": "kg", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Revestimento cerâmico esmaltado liso (200x200mm)", "codigo": "09310.3.14.28", "un": "m²", "coef": 1.05, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa pré-fabricada de cimento colante para assentamento de peças cerâmicas", "codigo": "09705.3.2.6", "un": "kg", "coef": 4.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 10010.8.1.1 - PONTO DE ÁGUA FRIA (PVC SOLDÁVEL 25MM)
('10010.8.1.1', '10.010', 'PONTO DE ÁGUA FRIA, com tubos e conexões de PVC soldável, diâmetro 25 mm', 'pt', 0, 0, 0, 25,
'[
  {"insumo": "Encanador", "codigo": "01270.0.21.1", "un": "h", "coef": 3.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ajudante de encanador", "codigo": "01270.0.1.15", "un": "h", "coef": 3.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tubo PVC soldável 25mm", "codigo": "10010.3.1.2", "un": "m", "coef": 4.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 10020.8.1.1 - PONTO DE ESGOTO (PVC 40MM)
('10020.8.1.1', '10.020', 'PONTO DE ESGOTO, com tubos e conexões de PVC, diâmetro 40 mm', 'pt', 0, 0, 0, 25,
'[
  {"insumo": "Encanador", "codigo": "01270.0.21.1", "un": "h", "coef": 2.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ajudante de encanador", "codigo": "01270.0.1.15", "un": "h", "coef": 2.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tubo PVC esgoto 40mm", "codigo": "10020.3.1.1", "un": "m", "coef": 3.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 11020.8.1.1 - PONTO DE LUZ (ELETRODUTO FLEXÍVEL 20MM)
('11020.8.1.1', '11.020', 'PONTO DE LUZ, com eletroduto flexível corrugado, diâmetro 20 mm', 'pt', 0, 0, 0, 25,
'[
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletroduto flexível corrugado 20mm", "codigo": "11020.3.1.1", "un": "m", "coef": 5.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Caixa de luz 4x2", "codigo": "11030.3.1.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 11040.8.1.1 - INSTALAÇÃO DE INTERRUPTOR SIMPLES
('11040.8.1.1', '11.040', 'INSTALAÇÃO de interruptor simples, incluindo placa e suporte', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor simples", "codigo": "11040.3.1.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 11040.8.1.2 - INSTALAÇÃO DE TOMADA 2P+T
('11040.8.1.2', '11.040', 'INSTALAÇÃO de tomada 2P+T, incluindo placa e suporte', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.35, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tomada 2P+T", "codigo": "11040.3.1.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 03310.8.1.1 - CONCRETO SIMPLES (PREPARO MECÂNICO)
('03310.8.1.1', '03.310', 'CONCRETO simples, preparo mecânico com betoneira, traço 1:3:6 (cimento, areia, brita)', 'm³', 0, 0, 0, 25,
'[
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 10.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Areia lavada tipo média", "codigo": "02060.3.2.2", "un": "m³", "coef": 0.55, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Pedra britada 1", "codigo": "02060.3.3.1", "un": "m³", "coef": 0.85, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento Portland CP II-E-32", "codigo": "02065.3.5.1", "un": "kg", "coef": 220.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Betoneira elétrica 2HP", "codigo": "22300.9.2.5", "un": "h prod.", "coef": 1.50, "p_unit": 0, "p_total": 0, "tipo": "eq"}
]'),

-- 05010.8.1.1 - ARMADURA EM AÇO CA-50 (DIÂMETRO 6.3MM A 12.5MM)
('05010.8.1.1', '05.010', 'ARMADURA em aço CA-50, diâmetro de 6,3 mm a 12,5 mm, incluindo corte, dobra e colocação', 'kg', 0, 0, 0, 25,
'[
  {"insumo": "Armador", "codigo": "01270.0.25.1", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Ajudante de armador", "codigo": "01270.0.1.10", "un": "h", "coef": 0.10, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Aço CA-50 (6.3 a 12.5mm)", "codigo": "05010.3.1.1", "un": "kg", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Arame galvanizado (bitola: 18 BWG)", "codigo": "05060.3.2.5", "un": "kg", "coef": 0.02, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 04211.8.2.1 - ALVENARIA BLOCO CERÂMICO FURADO 9CM
('04211.8.2.1', '04.211', 'ALVENARIA de vedação com blocos cerâmicos furados 9 x 19 x 19 cm, juntas de 12 mm com argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com 100 kg de cimento - espessura 9cm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Pedreiro", "codigo": "01270.0.4", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Bloco cerâmico de vedação 9 x 19 x 39 cm", "codigo": "04211.3.1.1", "un": "un", "coef": 12.50, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Argamassa mista de cal hidratada e areia sem peneirar traço 1:4, com adição de 130 kg de cimento", "codigo": "04060.8.1.51", "un": "m³", "coef": 0.015, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09310.8.1.1 - REVESTIMENTO CERÂMICO EM PAREDE (AZULEJO 15X15)
('09310.8.1.1', '09.310', 'REVESTIMENTO cerâmico em parede com azulejos 15 x 15 cm, assentados com argamassa mista de cal hidratada e areia peneirada traço 1:3, com 100 kg de cimento', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Azulejista", "codigo": "01270.0.15.1", "un": "h", "coef": 1.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Azulejo cerâmico esmaltado liso (150x150mm)", "codigo": "09310.3.1.1", "un": "m²", "coef": 1.10, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Cimento branco não estrutural", "codigo": "02065.3.4.1", "un": "kg", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09706.8.5.2 - REJUNTAMENTO DE AZULEJO 15X15
('09706.8.5.2', '09.706', 'REJUNTAMENTO de azulejo 15 cm x 15 cm, com argamassa pré-fabricada, para juntas até 3 mm', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Azulejista", "codigo": "01270.0.15.1", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Servente", "codigo": "01270.0.45.1", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Argamassa pré-fabricada para rejuntamento cerâmico de juntas finas", "codigo": "09705.3.2.21", "un": "kg", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09906.8.2.1 - EMASSAMENTO PAREDE EXTERNA (PRÓPRIA)
('09906.8.2.1', '09.906', 'EMASSAMENTO de parede externa com massa acrílica com duas demãos, para pintura látex - mão-de-obra própria', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.25, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.35, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Massa acrílica para pintura látex", "codigo": "09906.3.4.1", "un": "kg", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09906.8.2.2 - EMASSAMENTO PAREDE EXTERNA (EMPREITADA)
('09906.8.2.2', '09.906', 'EMASSAMENTO de parede externa com massa acrílica com duas demãos, para pintura látex - mão-de-obra empreitada', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para aplicação de massa corrida, com duas demãos", "codigo": "09906.1.2.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Massa acrílica para pintura látex", "codigo": "09906.3.4.1", "un": "kg", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09906.8.3.1 - EMASSAMENTO PAREDE INTERNA (PRÓPRIA)
('09906.8.3.1', '09.906', 'EMASSAMENTO de parede interna com massa corrida à base de PVA com duas demãos, para pintura látex - mão-de-obra própria', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Massa corrida base PVA", "codigo": "09906.3.5.2", "un": "kg", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09906.8.3.3 - EMASSAMENTO PAREDE INTERNA (EMPREITADA)
('09906.8.3.3', '09.906', 'EMASSAMENTO de parede interna com massa corrida à base de PVA com duas demãos, para pintura látex - mão-de-obra empreitada', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para aplicação de massa corrida, com duas demãos", "codigo": "09906.1.2.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Massa corrida base PVA", "codigo": "09906.3.5.2", "un": "kg", "coef": 0.70, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Lixa para superfície madeira/massa grana 100", "codigo": "09900.3.30.1", "un": "un", "coef": 0.40, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09940.8.1.1 - REVESTIMENTO TEXTURIZADO ALTA CAMADA (ROLO)
('09940.8.1.1', '09.940', 'REVESTIMENTO texturizado em parede interna ou externa de alta camada - com rolo, granulado fino irregular', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.33, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Revestimento texturizado de alta camada (granulado fino irregular)", "codigo": "09940.3.1.1", "un": "kg", "coef": 1.30, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09940.8.1.2 - REVESTIMENTO TEXTURIZADO ALTA CAMADA (DESEMPENADEIRA)
('09940.8.1.2', '09.940', 'REVESTIMENTO texturizado em parede interna ou externa de alta camada - com desempenadeira, baixo relevo com ranhuras verticais', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.33, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Revestimento texturizado de alta camada (baixo relevo com ranhuras verticais)", "codigo": "09940.3.1.2", "un": "kg", "coef": 3.50, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09940.8.2.1 - TEXTURA ACRÍLICA PAREDE EXTERNA (PRÓPRIA)
('09940.8.2.1', '09.940', 'TEXTURA acrílica em parede externa com uma demão - mão-de-obra própria', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de pintor", "codigo": "01270.0.1.19", "un": "h", "coef": 0.20, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Pintor", "codigo": "01270.0.41.1", "un": "h", "coef": 0.30, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Selador acrílico", "codigo": "09906.3.7.1", "un": "l", "coef": 0.21, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Textura acrílica", "codigo": "09940.3.3.1", "un": "l", "coef": 0.66, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 09940.8.2.2 - TEXTURA ACRÍLICA PAREDE EXTERNA (EMPREITADA)
('09940.8.2.2', '09.940', 'TEXTURA acrílica em parede externa com uma demão - mão-de-obra empreitada', 'm²', 0, 0, 0, 25,
'[
  {"insumo": "Mão-de-obra empreitada para execução de textura acrílica", "codigo": "09940.1.2.1", "un": "m²", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Selador acrílico", "codigo": "09906.3.7.1", "un": "l", "coef": 0.21, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Textura acrílica", "codigo": "09940.3.3.1", "un": "l", "coef": 0.66, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16100.8.3.1 - PONTO SECO (PVC RÍGIDO)
('16100.8.3.1', '16.100', 'PONTO SECO para instalação de som, TV, alarme e lógica, incluindo eletroduto de PVC rígido e caixa com espelho', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de encanador", "codigo": "01270.0.1.14", "un": "h", "coef": 2.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Caixa de ligação de PVC para eletroduto flexível corrugado de embutir 4\\"x4\\"", "codigo": "16132.3.14.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Eletroduto de PVC rígido de encaixe 3/4\\"", "codigo": "16132.8.10.2", "un": "m", "coef": 6.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Placa (espelho) para caixa 4x4", "codigo": "16140.3.1.3", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16100.8.3.2 - PONTO SECO (PVC FLEXÍVEL)
('16100.8.3.2', '16.100', 'PONTO SECO para instalação de som, TV, alarme e lógica, incluindo eletroduto de PVC flexível corrugado e caixa com espelho', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 2.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 2.50, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Caixa de ligação de PVC para eletroduto flexível corrugado de embutir 4\\"x4\\"", "codigo": "16132.3.14.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Eletroduto de PVC flexível corrugado 3/4\\"", "codigo": "16132.8.3.2", "un": "m", "coef": 10.00, "p_unit": 0, "p_total": 0, "tipo": "mat"},
  {"insumo": "Placa (espelho) para caixa 4x4", "codigo": "16140.3.1.3", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.9 - INTERRUPTOR UMA TECLA SIMPLES
('16143.8.2.9', '16.143', 'INTERRUPTOR 10 A - 250 V - uma tecla simples', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.21, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.21, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir uma tecla simples", "codigo": "16143.3.2.9", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.8 - INTERRUPTOR UMA TECLA PARALELO
('16143.8.2.8', '16.143', 'INTERRUPTOR 10 A - 250 V - uma tecla paralelo', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.29, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.29, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir uma tecla paralelo", "codigo": "16143.3.2.8", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.12 - INTERRUPTOR UMA TECLA SIMPLES E UMA PARALELO
('16143.8.2.12', '16.143', 'INTERRUPTOR 10 A - 250 V - uma tecla simples e uma tecla paralelo', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.45, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.45, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir uma tecla simples e uma paralelo", "codigo": "16143.3.2.12", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.10 - INTERRUPTOR UMA TECLA SIMPLES E DUAS PARALELO
('16143.8.2.10', '16.143', 'INTERRUPTOR 10 A - 250 V - uma tecla simples e duas teclas paralelo', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.69, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.69, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir uma tecla simples e duas paralelo", "codigo": "16143.3.2.10", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.6 - INTERRUPTOR UMA TECLA BIPOLAR PARALELO
('16143.8.2.6', '16.143', 'INTERRUPTOR 10 A - 250 V - uma tecla bipolar paralelo', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.53, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.53, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir uma tecla bipolar paralelo", "codigo": "16143.3.2.6", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.7 - INTERRUPTOR UMA TECLA DUPLA BIPOLAR SIMPLES
('16143.8.2.7', '16.143', 'INTERRUPTOR 10 A - 250 V - uma tecla dupla bipolar simples', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir uma tecla dupla bipolar simples", "codigo": "16143.3.2.7", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.1 - INTERRUPTOR DUAS TECLAS SIMPLES
('16143.8.2.1', '16.143', 'INTERRUPTOR 10 A - 250 V - duas teclas simples', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir duas teclas simples", "codigo": "16143.3.2.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.3 - INTERRUPTOR DUAS TECLAS PARALELO
('16143.8.2.3', '16.143', 'INTERRUPTOR 10 A - 250 V - duas teclas paralelo', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.53, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.53, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir duas teclas paralelo", "codigo": "16143.3.2.3", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.2.2 - INTERRUPTOR DUAS TECLAS SIMPLES E UMA PARALELO
('16143.8.2.2', '16.143', 'INTERRUPTOR 10 A - 250 V - duas teclas simples e uma tecla paralelo', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.61, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.61, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor de embutir duas teclas simples e uma paralelo", "codigo": "16143.3.2.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.3.4 - INTERRUPTOR E TOMADA UMA TECLA SIMPLES E 1 TOMADA
('16143.8.3.4', '16.143', 'INTERRUPTOR E TOMADA 10 A - 250 V - uma tecla simples e 1 tomada dois polos universal', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor e tomada de embutir uma tecla simples e 1 tomada", "codigo": "16143.3.2.4", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.3.3 - INTERRUPTOR E TOMADA UMA TECLA PARALELO E 1 TOMADA
('16143.8.3.3', '16.143', 'INTERRUPTOR E TOMADA 10 A - 250 V - uma tecla paralelo e 1 tomada dois polos universal', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.45, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.45, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor e tomada de embutir uma tecla paralelo e 1 tomada", "codigo": "16143.3.2.33", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.3.5 - INTERRUPTOR E TOMADA UMA TECLA SIMPLES, UMA PARALELO E 1 TOMADA
('16143.8.3.5', '16.143', 'INTERRUPTOR E TOMADA 10 A - 250 V - uma tecla simples, uma tecla paralelo e uma tomada, dois polos', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.61, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.61, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor e tomada de embutir uma tecla simples, uma paralelo e 1 tomada", "codigo": "16143.3.2.35", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.3.1 - INTERRUPTOR E TOMADA DUAS TECLAS SIMPLES E 1 TOMADA
('16143.8.3.1', '16.143', 'INTERRUPTOR E TOMADA 10 A - 250 V - duas teclas simples e uma tomada dois polos', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.53, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.53, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor e tomada de embutir duas teclas simples e 1 tomada", "codigo": "16143.3.2.31", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.3.2 - INTERRUPTOR E TOMADA DUAS TECLAS PARALELO E 1 TOMADA
('16143.8.3.2', '16.143', 'INTERRUPTOR E TOMADA 10 A - 250 V - duas teclas paralelo e uma tomada dois polos', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.69, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.69, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Interruptor e tomada de embutir duas teclas paralelo e 1 tomada", "codigo": "16143.3.2.32", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.5.1 - PLACA (ESPELHO) 3"x3"
('16143.8.5.1', '16.143', 'PLACA (ESPELHO) PARA CAIXA - tamanho 3" x 3"', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Placa (espelho) para caixa 3\\"x3\\"", "codigo": "16143.3.1.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.5.2 - PLACA (ESPELHO) 4"x2"
('16143.8.5.2', '16.143', 'PLACA (ESPELHO) PARA CAIXA - tamanho 4" x 2"', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.05, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Placa (espelho) para caixa 4\\"x2\\"", "codigo": "16143.3.1.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.5.3 - PLACA (ESPELHO) 4"x4"
('16143.8.5.3', '16.143', 'PLACA (ESPELHO) PARA CAIXA - tamanho 4" x 4"', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.06, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.06, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Placa (espelho) para caixa 4\\"x4\\"", "codigo": "16143.3.1.3", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.6.1 - TOMADA 2P+T 20A
('16143.8.6.1', '16.143', 'TOMADA - dois polos mais terra 20 A - 250 V', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.29, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.29, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tomada de embutir 2P+T 20A", "codigo": "16143.3.4.1", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.6.2 - TOMADA UNIVERSAL 2P 10A
('16143.8.6.2', '16.143', 'TOMADA - universal dois polos 10 A - 250 V', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.21, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.21, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tomada de embutir universal 2P 10A", "codigo": "16143.3.4.2", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.8.1 - TOMADA TELEFONE JACK 1/4
('16143.8.8.1', '16.143', 'TOMADA PARA TELEFONE - para pino jack 1/4', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.29, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.29, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tomada de embutir para telefone (Jack 1/4)", "codigo": "16143.3.4.8", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.8.2 - TOMADA TELEFONE 4 POLOS TELEBRÁS
('16143.8.8.2', '16.143', 'TOMADA PARA TELEFONE - quatro polos, padrão Telebrás', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tomada de embutir para telefone (4 polos Telebrás)", "codigo": "16143.3.4.82", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
]'),

-- 16143.8.8.3 - TOMADA TELEFONE 4 POLOS TELEBRÁS DUTO PISO
('16143.8.8.3', '16.143', 'TOMADA PARA TELEFONE - quatro polos, padrão Telebrás para duto de piso', 'un', 0, 0, 0, 25,
'[
  {"insumo": "Ajudante de eletricista", "codigo": "01270.0.1.13", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Eletricista", "codigo": "01270.0.22.1", "un": "h", "coef": 0.37, "p_unit": 0, "p_total": 0, "tipo": "mo"},
  {"insumo": "Tomada de embutir para telefone (4 polos Telebrás para duto de piso)", "codigo": "16143.3.4.83", "un": "un", "coef": 1.00, "p_unit": 0, "p_total": 0, "tipo": "mat"}
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
