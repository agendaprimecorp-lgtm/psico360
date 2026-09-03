alter table organizations enable row level security;

-- Nao usamos "force row level security": o papel dono precisa continuar
-- ignorando RLS para rodar migracoes e preparar testes. Quem sofre a
-- politica e psico360_app, que nao e dono de nada.
--
-- O "nullif" antes do cast e necessario: neste ambiente (Neon), uma vez que
-- o parametro customizado "app.organization_id" e tocado numa sessao (mesmo
-- via set_config local a transacao), o valor de reset apos o commit e ''
-- (string vazia), nao NULL. Sem o nullif, ''::uuid lanca erro em vez de
-- resultar em zero linhas quando nenhum contexto foi declarado.
create policy organizations_isolamento on organizations
  using (id = nullif(current_setting('app.organization_id', true), '')::uuid);
