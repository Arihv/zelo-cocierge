# Plataforma Estadia — reorganização para operação real

Aproveitando as telas e componentes já existentes (dashboard-shell, stat-card, login-card, cards de kits/mercado), reorganizo as áreas, crio o banco relacional completo e ligo tudo a dados reais. Nada será recriado do zero sem necessidade.

## 1. Banco de dados (novas tabelas)

- `reservations` — hóspede vinculado, imóvel, código da reserva, endereço, check-in, check-out, status
- `orders` + `order_items` — número do pedido, categoria, valor, status (Recebido, Em análise, Confirmado, Em preparação, Em entrega, Concluído, Cancelado), detalhes
- `service_catalog` — mantas, travesseiros, aquecedores, limpeza, organização
- `pricing` — preço por tipo de imóvel (S = Estúdio, D = 2 quartos, T = 3 quartos) para limpeza, organização e serviços extras; editável pela administração
- `partners` — empresas parceiras e benefícios
- `notifications` — notificações internas por usuário
- `activity_logs` — registro básico de atividades
- `apartments` ganha `code` (ex.: S101, D204, T302) usado na regra de preços

Todas com RLS por perfil: hóspede vê só o que é dele, proprietário só seus imóveis/pedidos, administração vê tudo.

## 2. Perfis e proteção de rotas

- Três áreas separadas: `/hospede/*`, `/proprietario/*` (renomeando "anfitrião"), `/admin/*`
- Guarda de rota por papel: cada área só abre para o papel autorizado, com redirecionamento para o painel correto
- Cadastro público de hóspede (nome, e-mail, telefone, senha) + estrutura de recuperação de senha
- Primeiro acesso do hóspede: tela para informar o código do imóvel/reserva; código inválido bloqueia solicitação de serviços

## 3. Área do Hóspede

- Cabeçalho do dashboard com nome, código do imóvel, endereço, check-in e check-out (somente leitura)
- Nova categoria **Serviços**: aluguel de mantas, travesseiros, aquecedores extras, limpeza adicional, organização adicional — em cards no padrão visual atual
- **Limpeza** e **Organização** movidas da área do proprietário para cá (telas reaproveitadas), com cálculo automático de preço pela primeira letra do código do imóvel
- Kits, Mercado, Pagamentos e Histórico permanecem, agora com pedidos reais
- Histórico com número, categoria, data, valor, status e detalhes

## 4. Área do Proprietário

- Removidos Kits e Mercado (passam a existir só para hóspedes)
- Removidos Limpeza e Organização (movidos para o hóspede)
- Mantidos Apartamentos, Manutenção e Relatórios
- Novos: **Histórico de Pedidos**, **Parcerias** (empresas, benefícios, serviços parceiros) e **Serviços ao Proprietário** (solicitações operacionais, manutenções, serviços especiais, acompanhamento de demandas)

## 5. Área Administração / Operação

- Dashboard operacional: total de hóspedes, proprietários, imóveis, pedidos, pendentes, concluídos, serviços agendados, próximos check-ins/check-outs, faturamento geral e mensal
- Gráficos (recharts): pedidos por categoria, serviços mais solicitados, evolução de pedidos, faturamento por período
- Gestão de hóspedes, proprietários, reservas e pedidos (alteração de status)
- **Tabela de Preços** editável: limpeza e organização por S/D/T, e serviços extras — sem mexer em código

## 6. Transversal

- Botão flutuante de WhatsApp em todas as páginas + links de contato em pontos estratégicos
- Notificações internas reais no ícone do topo (novo pedido, mudança de status, serviço agendado, check-in, novo cadastro)
- Ícones do Mercado trocados por ícones modernos de compras/supermercado/carrinho/entrega
- Revisão de responsividade (celular, tablet, desktop) nos dashboards
- Logo enviada aplicada na marca do sistema e como favicon

## Ordem de execução

1. Migração do banco + papéis e proteção de rotas
2. Área da Operação (dashboard + tabela de preços)
3. Área do Hóspede (serviços, limpeza/organização, check-in/out, vinculação)
4. Área do Proprietário (remoções, histórico, parcerias, serviços)
5. WhatsApp, notificações, ícones, logo e ajustes finais

No fim entrego um relatório do que foi criado, movido, alterado e removido.
