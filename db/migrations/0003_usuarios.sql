create table users (
  id         uuid primary key default gen_random_uuid(),
  email      text        not null unique,
  nome       text        not null,
  senha_hash text        not null,
  criado_em  timestamptz not null default now()
);

create table org_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid        not null references organizations(id) on delete cascade,
  user_id         uuid        not null references users(id) on delete cascade,
  papel           text        not null check (papel in ('SST_ADMIN', 'SST_TECNICO', 'EMPRESA_RH')),
  criado_em       timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index org_members_user_idx on org_members (user_id);

-- users nao recebe RLS por organizacao: o login precisa encontrar o usuario
-- pelo email ANTES de existir contexto de tenant. O que e protegido por RLS
-- e o vinculo, que e o que diz a qual organizacao a pessoa pertence.
alter table org_members enable row level security;

create policy org_members_isolamento on org_members
  using (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid);

grant select, insert, update, delete on users to psico360_app;
grant select, insert, update, delete on org_members to psico360_app;
