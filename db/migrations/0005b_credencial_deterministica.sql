-- O `limit 1` sem ordenacao sorteava a organizacao quando o usuario pertence a
-- mais de uma — o schema permite, porque org_members e unique por
-- (organization_id, user_id), nao por user_id sozinho. Sortear significa que a
-- mesma pessoa poderia abrir organizacoes diferentes em dois logins seguidos,
-- sem entender por que.
--
-- Enquanto a fase atual assume um usuario numa organizacao so, a ordenacao pelo
-- vinculo mais antigo torna a escolha estavel e explicavel. Quando houver
-- vinculo multiplo de verdade, o login passa a oferecer a escolha ao usuario, e
-- esta funcao deixa de ser o lugar que decide.
create or replace function credencial_por_email(p_email text)
returns table (user_id uuid, senha_hash text, organization_id uuid)
language sql
security definer
set search_path = public
as $$
  select u.id, u.senha_hash, m.organization_id
    from users u
    join org_members m on m.user_id = u.id
   where u.email = p_email
   order by m.criado_em asc, m.id asc
   limit 1;
$$;
