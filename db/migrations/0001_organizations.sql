create extension if not exists "pgcrypto";

create table organizations (
  id        uuid primary key default gen_random_uuid(),
  nome      text        not null,
  tipo      text        not null check (tipo in ('SST', 'EMPRESA')),
  criado_em timestamptz not null default now()
);

-- O papel da aplicacao precisa de permissao explicita. Ele nao e dono de
-- nada, e e justamente por isso que as politicas de RLS incidem sobre ele.
grant usage on schema public to psico360_app;
grant select, insert, update, delete on organizations to psico360_app;
