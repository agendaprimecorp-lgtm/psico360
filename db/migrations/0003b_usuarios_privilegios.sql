-- Mesma poda aplicada em 0002b: privilegio que nenhum codigo usa so amplia o
-- raio de dano de um bug futuro.
--
-- users nao tem RLS de proposito — o login precisa achar a pessoa pelo email
-- antes de existir contexto de organizacao. Sem essa rede de protecao no banco,
-- o privilegio e a unica fronteira da tabela, entao ele fica no minimo:
-- inserir, e ler APENAS a coluna id, que e o que `insert ... returning id`
-- exige. Email, nome e senha_hash deixam de ser legiveis pela aplicacao.
-- O login da Tarefa 6 nao depende disso: ele le por funcao security definer,
-- que roda com os privilegios do dono.
revoke all on users from psico360_app;
grant insert on users to psico360_app;
grant select (id) on users to psico360_app;

-- org_members tem RLS, mas nenhum codigo desta fase altera nem apaga vinculo.
revoke update, delete on org_members from psico360_app;
