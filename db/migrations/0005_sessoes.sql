create table sessoes (
  token_hash      text        primary key,
  user_id         uuid        not null references users(id) on delete cascade,
  organization_id uuid        not null references organizations(id) on delete cascade,
  criada_em       timestamptz not null default now(),
  expira_em       timestamptz not null
);

create index sessoes_user_idx on sessoes (user_id);

-- sessoes e consultada ANTES de existir contexto de organizacao: e ela que
-- estabelece esse contexto. Por isso nao recebe politica de RLS por
-- organizacao. O que a protege e o segredo do token, guardado apenas como
-- hash SHA-256 — um vazamento do banco nao entrega sessoes validas.

grant select, insert, delete on sessoes to psico360_app;

-- O login enfrenta um problema de partida: para descobrir a organizacao do
-- usuario e preciso ler org_members, mas org_members esta sob RLS e a RLS
-- exige justamente a organizacao que ainda nao se sabe. A saida e esta funcao,
-- que roda com os privilegios do DONO (security definer) e por isso enxerga
-- org_members — mas devolve APENAS as tres colunas do login, para um unico
-- email. E a valvula estreita: o unico ponto do sistema que le vinculo sem
-- contexto, e de proposito.
--
-- As alternativas foram descartadas: dar a credencial de dono a aplicacao
-- daria a ela poder total em producao; afrouxar a politica de org_members
-- deixaria uma organizacao enumerar usuarios de outra.
create function credencial_por_email(p_email text)
returns table (user_id uuid, senha_hash text, organization_id uuid)
language sql
security definer
set search_path = public
as $$
  select u.id, u.senha_hash, m.organization_id
    from users u
    join org_members m on m.user_id = u.id
   where u.email = p_email
   limit 1;
$$;

revoke all on function credencial_por_email(text) from public;
grant execute on function credencial_por_email(text) to psico360_app;
