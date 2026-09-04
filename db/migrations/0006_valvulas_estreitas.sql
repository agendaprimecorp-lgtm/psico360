-- sessoes era a unica tabela com dado de tenant sem RLS e com privilegio amplo.
-- Em vez de politica (a tabela e consultada ANTES de existir contexto de
-- organizacao — e ela que estabelece o contexto), aplicamos o mesmo padrao de
-- valvula estreita ja usado em credencial_por_email: a aplicacao perde todo
-- acesso direto e passa por funcoes que so alcancam a linha cujo hash de token
-- ela ja conhece.
revoke all on sessoes from psico360_app;

-- pg_temp no final do search_path: sem ele, o PostgreSQL consulta o schema
-- temporario ANTES de public para nomes de relacao, e o papel da aplicacao tem
-- privilegio TEMPORARY. Quem executasse SQL arbitrario como a aplicacao poderia
-- sombrear public.users com uma tabela temporaria e fazer uma funcao security
-- definer — que roda como dono — devolver o que quisesse.
create or replace function credencial_por_email(p_email text)
returns table (user_id uuid, senha_hash text, organization_id uuid)
language sql
security definer
set search_path = public, pg_temp
as $$
  select u.id, u.senha_hash, m.organization_id
    from users u
    join org_members m on m.user_id = u.id
   where u.email = p_email
   order by m.criado_em asc, m.id asc
   limit 1;
$$;

create or replace function criar_sessao(
  p_token_hash      text,
  p_user_id         uuid,
  p_organization_id uuid,
  p_expira_em       timestamptz
) returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into sessoes (token_hash, user_id, organization_id, expira_em)
  values (p_token_hash, p_user_id, p_organization_id, p_expira_em);
$$;

-- Devolve no maximo a linha cujo hash o chamador ja conhece, e so se estiver
-- vigente. Nao ha como listar, contar nem varrer.
create or replace function sessao_por_token(p_token_hash text)
returns table (user_id uuid, organization_id uuid)
language sql
security definer
set search_path = public, pg_temp
as $$
  select s.user_id, s.organization_id
    from sessoes s
   where s.token_hash = p_token_hash
     and s.expira_em > now();
$$;

create or replace function encerrar_sessao(p_token_hash text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from sessoes where token_hash = p_token_hash;
$$;

revoke all on function criar_sessao(text, uuid, uuid, timestamptz) from public;
revoke all on function sessao_por_token(text) from public;
revoke all on function encerrar_sessao(text) from public;

grant execute on function criar_sessao(text, uuid, uuid, timestamptz) to psico360_app;
grant execute on function sessao_por_token(text) to psico360_app;
grant execute on function encerrar_sessao(text) to psico360_app;

-- users: o `select (id)` existia so para o `insert ... returning id`. Com o id
-- gerado na aplicacao, o returning some e a leitura pode ser revogada por
-- inteiro. Sem ela, `select count(*) from users` e `select id from users` — que
-- enumeravam a plataforma toda, sem RLS para conter — deixam de ser possiveis.
revoke all on users from psico360_app;
grant insert on users to psico360_app;
