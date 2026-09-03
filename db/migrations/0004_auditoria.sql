create table audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid        not null references organizations(id) on delete cascade,
  user_id         uuid        references users(id),
  acao            text        not null,
  recurso         text        not null,
  recurso_id      uuid,
  detalhe         jsonb,
  criado_em       timestamptz not null default now()
);

create index audit_logs_org_idx on audit_logs (organization_id, criado_em desc);

alter table audit_logs enable row level security;

create policy audit_logs_leitura on audit_logs
  for select
  using (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid);

-- with check amarra a insercao: nao ha como gravar em nome de outra
-- organizacao, nem por engano nem de proposito.
create policy audit_logs_escrita on audit_logs
  for insert
  with check (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid);

-- Nao existe politica para update nem para delete, e o grant abaixo tambem
-- nao concede essas operacoes. Sao duas camadas: o privilegio recusa antes,
-- a politica recusaria depois. A trilha e somente-anexar do ponto de vista da
-- aplicacao, e a tentativa de altera-la levanta erro em vez de falhar calada.
grant select, insert on audit_logs to psico360_app;
