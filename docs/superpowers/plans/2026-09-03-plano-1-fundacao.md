# PSICO360 — Plano 1: Fundação (tenancy, autenticação, auditoria)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ter uma aplicação em que um usuário de consultoria SST faz login e, comprovadamente, não consegue alcançar dado de outra organização por nenhum caminho — com toda ação sensível registrada em trilha de auditoria que não pode ser alterada.

**Architecture:** Monolito Next.js (App Router) servindo interface e API no mesmo deploy. PostgreSQL gerenciado com Row-Level Security como fronteira primária de isolamento. Dois papéis de banco: o **dono** roda migrações e preparo de testes; a **aplicação** conecta com papel separado, sobre o qual as políticas de RLS incidem. A aplicação abre uma transação, declara a organização da sessão em variável de sessão do banco, e o próprio Postgres recusa linhas de outra organização.

**Tech Stack:** TypeScript, Next.js (App Router), PostgreSQL gerenciado (Neon, plano gratuito), Drizzle ORM sobre driver `pg`, Vitest, argon2id.

**Spec:** `docs/superpowers/specs/2026-09-03-psico360-piloto-design.md`

## Onde este plano se encaixa

Primeiro de seis planos sequenciais do piloto:

1. **Fundação** ← este plano
2. Estrutura (empresas, unidades, departamentos, cargos, quadro de pessoal)
3. Instrumento e coleta (versionamento, ciclos, tokens, questionário anônimo)
4. Motor de risco (pontuação, direção, cortes, célula mínima, portão de participação)
5. Saída (plano de ação, evidências, relatório assinável)
6. Fechamento (canal de denúncia, consentimento, endurecimento, deploy)

## Global Constraints

Valem para toda tarefa deste plano e dos seguintes. Valores copiados da especificação.

- **Isolamento de tenant:** RLS no PostgreSQL em toda tabela, mais filtro na aplicação. `organizations` é a raiz de tenancy; toda tabela de domínio carrega `organization_id`.
- **Dois papéis de banco.** Migrações e preparo de teste usam o dono. A aplicação usa `psico360_app`, que **nunca** é dono de tabela — é isso que faz o RLS valer.
- **Trilha de auditoria desde a primeira migração**, nunca como fase posterior.
- **Nenhum segredo versionado.** `.env.local` está no `.gitignore`; só `.env.example`, sem valores.
- **Orçamento de infraestrutura:** R$ 150–600/mês.
- **Nada de IA no caminho de cálculo.** Este plano não introduz IA em ponto algum.
- **Idioma:** interface, mensagens e colunas de domínio em português; palavras-chave técnicas em inglês.
- **Toda tarefa termina com testes passando e um commit.**

## Pré-requisitos que só Rodrigo pode cumprir

Bloqueiam a Tarefa 2. Não são código.

- [ ] Criar conta em https://neon.com — o plano gratuito atende todo este plano
- [ ] Criar um projeto chamado `psico360`
- [ ] Dentro dele, criar dois bancos: `psico360_dev` e `psico360_test`
- [ ] No painel do Neon, criar um segundo papel chamado `psico360_app` (além do papel dono que o Neon já cria)
- [ ] Copiar as quatro strings de conexão: dono e `psico360_app`, para cada um dos dois bancos

**Não cole nenhuma dessas strings nesta conversa nem em arquivo versionado.** Elas dão acesso ao banco. O lugar delas é o `.env.local`, que o Git ignora.

---

### Task 1: Esqueleto do projeto e suíte de testes

Entrega: `npm test` roda e passa.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`
- Create: `tests/setup.ts`, `tests/esqueleto.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nada
- Produces: projeto Next.js executável; comandos `npm test` e `npm run dev`

- [ ] **Step 1: Criar o projeto Next.js**

Na raiz do repositório, que já contém os `.md` de documentação:

```bash
npx create-next-app@latest . --typescript --app --no-tailwind --no-src-dir --import-alias "@/*" --eslint --use-npm
```

Ele avisará que o diretório não está vazio; aceite prosseguir. Não apaga os `.md` nem o `.git`.

- [ ] **Step 2: Instalar dependências**

```bash
npm install drizzle-orm pg argon2
npm install -D vitest @types/pg tsx dotenv
```

- [ ] **Step 3: Escrever a configuração do Vitest**

Criar `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Os testes compartilham o mesmo banco de testes; em série, um não
    // enxerga o preparo do outro.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
```

- [ ] **Step 4: Escrever o setup dos testes**

Criar `tests/setup.ts`:

```typescript
import { config } from "dotenv";

config({ path: ".env.local" });
```

- [ ] **Step 5: Escrever o teste**

Criar `tests/esqueleto.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

describe("esqueleto do projeto", () => {
  it("executa a suíte de testes", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Registrar os scripts**

Em `package.json`, dentro de `"scripts"`, acrescentar:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Rodar o teste e ver passar**

```bash
npm test
```

Esperado: 1 teste passa.

- [ ] **Step 8: Escrever o `.env.example`**

Criar `.env.example` — sem valores:

```
# Papel DONO — roda migracoes e preparo de testes. Ignora RLS.
DATABASE_URL_OWNER=
DATABASE_URL_TEST_OWNER=

# Papel da APLICACAO (psico360_app) — sofre as politicas de RLS.
# E com este que a aplicacao atende requisicao de usuario.
DATABASE_URL_APP=
DATABASE_URL_TEST_APP=

# Segredo de assinatura de cookie.
# Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=
```

- [ ] **Step 9: Garantir que segredos não sejam versionados**

Confirmar que `.gitignore` contém, acrescentando o que faltar:

```
.env
.env.local
.env*.local
node_modules/
.next/
```

- [ ] **Step 10: Conferir que nenhum segredo entrou**

```bash
git ls-files | grep -E "^\.env" && echo "PARE: .env rastreado" || echo "OK: nenhum .env rastreado"
```

Esperado: `OK: nenhum .env rastreado`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: esqueleto Next.js com TypeScript e suite de testes Vitest"
```

---

### Task 2: Conexão, executor de migrações e tabela `organizations`

Entrega: uma migração cria `organizations`, e um teste confirma que a aplicação conversa com o banco.

**Files:**
- Create: `db/client.ts`, `db/schema.ts`, `db/migrations/0001_organizations.sql`, `scripts/migrate.ts`
- Test: `tests/db/conexao.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: variáveis de ambiente da Task 1
- Produces:
  - `db/client.ts` exporta `criarPool(connectionString: string): Pool`
  - `scripts/migrate.ts` aplica em ordem alfabética todo `.sql` de `db/migrations`, uma vez cada, registrando em `_migracoes`
  - Tabela `organizations` com `id uuid`, `nome text`, `tipo text` em `('SST','EMPRESA')`, `criado_em timestamptz`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/db/conexao.test.ts`:

```typescript
import { afterAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";

const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);

afterAll(async () => {
  await dono.end();
});

describe("conexão com o banco", () => {
  it("responde a uma consulta trivial", async () => {
    const { rows } = await dono.query("select 1 as um");
    expect(rows[0].um).toBe(1);
  });

  it("possui a tabela organizations", async () => {
    const { rows } = await dono.query(
      "select to_regclass('public.organizations') as tabela",
    );
    expect(rows[0].tabela).toBe("organizations");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- tests/db/conexao.test.ts
```

Esperado: FALHA — módulo `@/db/client` não encontrado.

- [ ] **Step 3: Escrever o cliente**

Criar `db/client.ts`:

```typescript
import { Pool } from "pg";

export function criarPool(connectionString: string): Pool {
  if (!connectionString) {
    throw new Error(
      "String de conexão ausente. Confira as quatro DATABASE_URL_* em .env.local",
    );
  }
  return new Pool({ connectionString, max: 5 });
}
```

- [ ] **Step 4: Escrever a migração**

Criar `db/migrations/0001_organizations.sql`:

```sql
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
```

- [ ] **Step 5: Escrever o executor de migrações**

Criar `scripts/migrate.ts`:

```typescript
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { criarPool } from "../db/client";

config({ path: ".env.local" });

const alvo =
  process.argv[2] === "test" ? "DATABASE_URL_TEST_OWNER" : "DATABASE_URL_OWNER";
const pool = criarPool(process.env[alvo]!);

async function migrar() {
  await pool.query(`
    create table if not exists _migracoes (
      nome        text primary key,
      aplicada_em timestamptz not null default now()
    );
  `);

  const dir = join(process.cwd(), "db", "migrations");
  const arquivos = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const arquivo of arquivos) {
    const { rowCount } = await pool.query(
      "select 1 from _migracoes where nome = $1",
      [arquivo],
    );
    if (rowCount) {
      console.log(`- ${arquivo} (já aplicada)`);
      continue;
    }
    const sql = readFileSync(join(dir, arquivo), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into _migracoes (nome) values ($1)", [arquivo]);
      await client.query("commit");
      console.log(`+ ${arquivo}`);
    } catch (erro) {
      await client.query("rollback");
      throw erro;
    } finally {
      client.release();
    }
  }
  await pool.end();
}

migrar().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
```

- [ ] **Step 6: Registrar os scripts de migração**

Em `package.json`, dentro de `"scripts"`:

```json
"migrate": "tsx scripts/migrate.ts",
"migrate:test": "tsx scripts/migrate.ts test"
```

- [ ] **Step 7: Escrever o schema Drizzle**

Criar `db/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 8: Aplicar nos dois bancos**

```bash
npm run migrate
npm run migrate:test
```

Esperado: `+ 0001_organizations.sql` nas duas execuções. Se falhar dizendo que o papel `psico360_app` não existe, ele não foi criado no painel do Neon — volte aos pré-requisitos.

- [ ] **Step 9: Rodar e ver passar**

```bash
npm test -- tests/db/conexao.test.ts
```

Esperado: 2 testes passam.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: conexao Postgres, executor de migracoes e tabela organizations"
```

---

### Task 3: Row-Level Security — o isolamento que sustenta o produto

A tarefa mais importante do plano. Entrega: um teste que prova que a organização A não alcança dado da organização B nem com acesso direto ao banco pelo papel da aplicação.

**Files:**
- Create: `db/migrations/0002_rls.sql`, `db/tenant.ts`
- Test: `tests/db/isolamento.test.ts`

**Interfaces:**
- Consumes: `criarPool` (Task 2), tabela `organizations` (Task 2)
- Produces: `db/tenant.ts` exporta
  `comOrganizacao<T>(pool: Pool, organizationId: string, fn: (client: PoolClient) => Promise<T>): Promise<T>`
  — abre transação, declara `app.organization_id` com `set_config(..., true)`, executa `fn`, confirma ou desfaz.

**Duas notas técnicas que precisam ser entendidas antes de implementar:**

1. **O dono de uma tabela ignora RLS.** É por isso que existem dois papéis: se a aplicação conectasse com o papel dono, as políticas não teriam efeito nenhum e os testes passariam por engano. Os testes deste arquivo conectam com `psico360_app` justamente para exercer a política.

2. **Ausência de política não gera erro — gera zero linhas.** Um `update` sem política correspondente não lança exceção; ele simplesmente não encontra linha alguma para alterar. Os testes abaixo verificam `rowCount === 0`, não exceção.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/db/isolamento.test.ts`:

```typescript
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { comOrganizacao } from "@/db/tenant";

// Dono: prepara o cenário, ignora RLS.
const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);
// Aplicação: é sobre este papel que as políticas incidem.
const app = criarPool(process.env.DATABASE_URL_TEST_APP!);

let orgA: string;
let orgB: string;

beforeAll(async () => {
  await dono.query("delete from organizations");
  const a = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria A', 'SST') returning id",
  );
  const b = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria B', 'SST') returning id",
  );
  orgA = a.rows[0].id;
  orgB = b.rows[0].id;
});

afterAll(async () => {
  await dono.end();
  await app.end();
});

describe("isolamento por organização", () => {
  it("enxerga a própria organização", async () => {
    const linhas = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query("select id, nome from organizations");
      return rows;
    });
    expect(linhas).toHaveLength(1);
    expect(linhas[0].nome).toBe("Consultoria A");
  });

  it("não enxerga outra organização, mesmo pedindo pelo id dela", async () => {
    const linhas = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query(
        "select id from organizations where id = $1",
        [orgB],
      );
      return rows;
    });
    expect(linhas).toHaveLength(0);
  });

  it("não altera linha de outra organização", async () => {
    const afetadas = await comOrganizacao(app, orgA, async (client) => {
      const { rowCount } = await client.query(
        "update organizations set nome = 'invadida' where id = $1",
        [orgB],
      );
      return rowCount;
    });
    expect(afetadas).toBe(0);

    const { rows } = await dono.query(
      "select nome from organizations where id = $1",
      [orgB],
    );
    expect(rows[0].nome).toBe("Consultoria B");
  });

  it("não apaga linha de outra organização", async () => {
    const afetadas = await comOrganizacao(app, orgA, async (client) => {
      const { rowCount } = await client.query(
        "delete from organizations where id = $1",
        [orgB],
      );
      return rowCount;
    });
    expect(afetadas).toBe(0);

    const { rowCount } = await dono.query(
      "select 1 from organizations where id = $1",
      [orgB],
    );
    expect(rowCount).toBe(1);
  });

  it("sem contexto declarado, não enxerga nada", async () => {
    const client = await app.connect();
    try {
      const { rows } = await client.query("select id from organizations");
      expect(rows).toHaveLength(0);
    } finally {
      client.release();
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- tests/db/isolamento.test.ts
```

Esperado: FALHA — módulo `@/db/tenant` não encontrado.

- [ ] **Step 3: Escrever a migração de RLS**

Criar `db/migrations/0002_rls.sql`:

```sql
alter table organizations enable row level security;

-- Nao usamos "force row level security": o papel dono precisa continuar
-- ignorando RLS para rodar migracoes e preparar testes. Quem sofre a
-- politica e psico360_app, que nao e dono de nada.
create policy organizations_isolamento on organizations
  using (id = current_setting('app.organization_id', true)::uuid);
```

- [ ] **Step 4: Escrever o portador de contexto de tenant**

Criar `db/tenant.ts`:

```typescript
import type { Pool, PoolClient } from "pg";

/**
 * Executa `fn` dentro de uma transação em que o Postgres sabe qual organização
 * está ativa. As políticas de RLS leem `app.organization_id`.
 *
 * O terceiro argumento de `set_config` sendo `true` amarra o valor à transação:
 * ao confirmar ou desfazer, ele some. É isso que impede o contexto de uma
 * requisição vazar para a seguinte quando a conexão volta para o pool.
 *
 * `pool` deve ser o pool do papel da aplicação. Passar o pool do dono aqui
 * anula o isolamento, porque o dono ignora RLS.
 */
export async function comOrganizacao<T>(
  pool: Pool,
  organizationId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.organization_id', $1, true)", [
      organizationId,
    ]);
    const resultado = await fn(client);
    await client.query("commit");
    return resultado;
  } catch (erro) {
    await client.query("rollback");
    throw erro;
  } finally {
    client.release();
  }
}
```

- [ ] **Step 5: Aplicar e rodar**

```bash
npm run migrate:test
npm test -- tests/db/isolamento.test.ts
```

Esperado: 5 testes passam. Se o segundo teste devolver a organização B, a aplicação está conectando com o papel dono — confira `DATABASE_URL_TEST_APP`.

- [ ] **Step 6: Aplicar em dev e commitar**

```bash
npm run migrate
git add -A
git commit -m "feat: RLS por organizacao com papel de aplicacao separado do dono"
```

---

### Task 4: Usuários, vínculo com organização e senhas

Entrega: usuário criado com senha protegida e vinculado a uma organização com papel, sem que o vínculo vaze entre organizações.

**Files:**
- Create: `db/migrations/0003_usuarios.sql`, `lib/senha.ts`, `lib/usuarios.ts`
- Test: `tests/lib/senha.test.ts`, `tests/lib/usuarios.test.ts`
- Modify: `db/schema.ts`

**Interfaces:**
- Consumes: `comOrganizacao` (Task 3), `criarPool` (Task 2)
- Produces:
  - `lib/senha.ts` exporta `protegerSenha(senha: string): Promise<string>` e `conferirSenha(hash: string, senha: string): Promise<boolean>`
  - `lib/usuarios.ts` exporta `criarUsuario(pool: Pool, entrada: { email: string; senha: string; nome: string }): Promise<{ id: string }>` e `vincular(pool: Pool, entrada: { userId: string; organizationId: string; papel: Papel }): Promise<void>`
  - Tipo `Papel = 'SST_ADMIN' | 'SST_TECNICO' | 'EMPRESA_RH'`

- [ ] **Step 1: Escrever o teste de senha**

Criar `tests/lib/senha.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { conferirSenha, protegerSenha } from "@/lib/senha";

describe("proteção de senha", () => {
  it("não guarda a senha em claro", async () => {
    const hash = await protegerSenha("senha-de-teste-123");
    expect(hash).not.toContain("senha-de-teste-123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("confere a senha correta", async () => {
    const hash = await protegerSenha("senha-de-teste-123");
    expect(await conferirSenha(hash, "senha-de-teste-123")).toBe(true);
  });

  it("recusa a senha errada", async () => {
    const hash = await protegerSenha("senha-de-teste-123");
    expect(await conferirSenha(hash, "senha-errada")).toBe(false);
  });

  it("gera hashes diferentes para a mesma senha", async () => {
    const a = await protegerSenha("mesma-senha");
    const b = await protegerSenha("mesma-senha");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- tests/lib/senha.test.ts
```

Esperado: FALHA — módulo `@/lib/senha` não encontrado.

- [ ] **Step 3: Escrever a proteção de senha**

Criar `lib/senha.ts`:

```typescript
import argon2 from "argon2";

export async function protegerSenha(senha: string): Promise<string> {
  return argon2.hash(senha, { type: argon2.argon2id });
}

export async function conferirSenha(
  hash: string,
  senha: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, senha);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npm test -- tests/lib/senha.test.ts
```

Esperado: 4 testes passam.

- [ ] **Step 5: Escrever a migração de usuários**

Criar `db/migrations/0003_usuarios.sql`:

```sql
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
  using (organization_id = current_setting('app.organization_id', true)::uuid);

grant select, insert, update, delete on users to psico360_app;
grant select, insert, update, delete on org_members to psico360_app;
```

- [ ] **Step 6: Escrever o teste de usuários**

Criar `tests/lib/usuarios.test.ts`:

```typescript
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { comOrganizacao } from "@/db/tenant";
import { criarUsuario, vincular } from "@/lib/usuarios";

const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);
const app = criarPool(process.env.DATABASE_URL_TEST_APP!);

let orgA: string;
let orgB: string;

beforeAll(async () => {
  await dono.query("delete from org_members");
  await dono.query("delete from users");
  await dono.query("delete from organizations");
  const a = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria A', 'SST') returning id",
  );
  const b = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria B', 'SST') returning id",
  );
  orgA = a.rows[0].id;
  orgB = b.rows[0].id;
});

afterAll(async () => {
  await dono.end();
  await app.end();
});

describe("usuários e vínculos", () => {
  it("cria usuário sem guardar a senha em claro", async () => {
    const { id } = await criarUsuario(app, {
      email: "tecnico@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Técnico A",
    });
    const { rows } = await dono.query(
      "select senha_hash from users where id = $1",
      [id],
    );
    expect(rows[0].senha_hash).not.toContain("senha-de-teste-123");
  });

  it("recusa email repetido", async () => {
    await criarUsuario(app, {
      email: "repetido@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Primeiro",
    });
    await expect(
      criarUsuario(app, {
        email: "repetido@consultoria-a.com.br",
        senha: "outra-senha-123",
        nome: "Segundo",
      }),
    ).rejects.toThrow();
  });

  it("normaliza o email para minúsculas", async () => {
    const { id } = await criarUsuario(app, {
      email: "  MAIUSCULO@Consultoria-A.com.br  ",
      senha: "senha-de-teste-123",
      nome: "Maiúsculo",
    });
    const { rows } = await dono.query("select email from users where id = $1", [
      id,
    ]);
    expect(rows[0].email).toBe("maiusculo@consultoria-a.com.br");
  });

  it("vincula usuário à organização com papel", async () => {
    const { id } = await criarUsuario(app, {
      email: "vinculado@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Vinculado",
    });
    await vincular(app, {
      userId: id,
      organizationId: orgA,
      papel: "SST_TECNICO",
    });

    const vinculos = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query(
        "select papel from org_members where user_id = $1",
        [id],
      );
      return rows;
    });
    expect(vinculos).toHaveLength(1);
    expect(vinculos[0].papel).toBe("SST_TECNICO");
  });

  it("não expõe o vínculo para outra organização", async () => {
    const { id } = await criarUsuario(app, {
      email: "isolado@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Isolado",
    });
    await vincular(app, {
      userId: id,
      organizationId: orgA,
      papel: "SST_ADMIN",
    });

    const vistos = await comOrganizacao(app, orgB, async (client) => {
      const { rows } = await client.query(
        "select papel from org_members where user_id = $1",
        [id],
      );
      return rows;
    });
    expect(vistos).toHaveLength(0);
  });
});
```

- [ ] **Step 7: Aplicar a migração, rodar e ver falhar**

```bash
npm run migrate:test
npm test -- tests/lib/usuarios.test.ts
```

Esperado: FALHA — módulo `@/lib/usuarios` não encontrado.

- [ ] **Step 8: Escrever o módulo de usuários**

Criar `lib/usuarios.ts`:

```typescript
import type { Pool } from "pg";
import { protegerSenha } from "./senha";

export type Papel = "SST_ADMIN" | "SST_TECNICO" | "EMPRESA_RH";

export async function criarUsuario(
  pool: Pool,
  entrada: { email: string; senha: string; nome: string },
): Promise<{ id: string }> {
  const hash = await protegerSenha(entrada.senha);
  const { rows } = await pool.query(
    `insert into users (email, nome, senha_hash)
     values ($1, $2, $3)
     returning id`,
    [entrada.email.toLowerCase().trim(), entrada.nome, hash],
  );
  return { id: rows[0].id };
}

export async function vincular(
  pool: Pool,
  entrada: { userId: string; organizationId: string; papel: Papel },
): Promise<void> {
  await pool.query(
    `insert into org_members (organization_id, user_id, papel)
     values ($1, $2, $3)`,
    [entrada.organizationId, entrada.userId, entrada.papel],
  );
}
```

**Por que `vincular` funciona sem contexto de organização:** a política `org_members_isolamento` usa apenas `using`, que governa leitura, alteração e remoção. Inserção só seria barrada por uma cláusula `with check`, que não existe aqui — criar vínculo é ação de administração da plataforma, não de tenant. A Task 5 fará o oposto em `audit_logs`, onde a inserção precisa ser amarrada.

- [ ] **Step 9: Rodar e ver passar**

```bash
npm test -- tests/lib/usuarios.test.ts
```

Esperado: 5 testes passam.

- [ ] **Step 10: Atualizar o schema Drizzle**

Acrescentar ao final de `db/schema.ts`:

```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  senhaHash: text("senha_hash").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const orgMembers = pgTable("org_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  userId: uuid("user_id").notNull(),
  papel: text("papel").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 11: Commit**

```bash
npm run migrate
git add -A
git commit -m "feat: usuarios com argon2id, vinculo por organizacao e RLS em org_members"
```

---

### Task 5: Trilha de auditoria

A especificação exige auditoria desde a primeira migração. Entrega: toda ação sensível grava quem fez, o quê, quando e em qual organização — e o registro não pode ser alterado nem apagado pela aplicação.

**Files:**
- Create: `db/migrations/0004_auditoria.sql`, `lib/auditoria.ts`
- Test: `tests/lib/auditoria.test.ts`
- Modify: `db/schema.ts`

**Interfaces:**
- Consumes: `comOrganizacao` (Task 3)
- Produces: `lib/auditoria.ts` exporta o tipo `EventoAuditoria` e
  `registrar(client: PoolClient, evento: EventoAuditoria): Promise<void>`
  — recebe o `client` da transação corrente, para que o registro seja desfeito junto se a operação auditada falhar.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/lib/auditoria.test.ts`:

```typescript
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { comOrganizacao } from "@/db/tenant";
import { registrar } from "@/lib/auditoria";

const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);
const app = criarPool(process.env.DATABASE_URL_TEST_APP!);

let orgA: string;
let orgB: string;
let userId: string;

beforeAll(async () => {
  await dono.query("delete from audit_logs");
  await dono.query("delete from org_members");
  await dono.query("delete from users");
  await dono.query("delete from organizations");
  const a = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria A', 'SST') returning id",
  );
  const b = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria B', 'SST') returning id",
  );
  orgA = a.rows[0].id;
  orgB = b.rows[0].id;
  const u = await dono.query(
    "insert into users (email, nome, senha_hash) values ('auditor@a.com.br', 'Auditor', 'x') returning id",
  );
  userId = u.rows[0].id;
});

afterAll(async () => {
  await dono.end();
  await app.end();
});

describe("trilha de auditoria", () => {
  it("registra o evento com organização, autor e ação", async () => {
    await comOrganizacao(app, orgA, async (client) => {
      await registrar(client, {
        userId,
        acao: "CRIAR",
        recurso: "empresa",
        recursoId: null,
        detalhe: { nome: "Empresa Teste" },
      });
    });

    const linhas = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query("select * from audit_logs");
      return rows;
    });

    expect(linhas).toHaveLength(1);
    expect(linhas[0].acao).toBe("CRIAR");
    expect(linhas[0].recurso).toBe("empresa");
    expect(linhas[0].user_id).toBe(userId);
    expect(linhas[0].detalhe).toEqual({ nome: "Empresa Teste" });
  });

  it("não expõe registros de outra organização", async () => {
    const vistos = await comOrganizacao(app, orgB, async (client) => {
      const { rows } = await client.query("select * from audit_logs");
      return rows;
    });
    expect(vistos).toHaveLength(0);
  });

  it("é desfeito junto com a transação que falhou", async () => {
    await expect(
      comOrganizacao(app, orgA, async (client) => {
        await registrar(client, {
          userId,
          acao: "APAGAR",
          recurso: "empresa",
          recursoId: null,
        });
        throw new Error("falha proposital");
      }),
    ).rejects.toThrow("falha proposital");

    const linhas = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query(
        "select * from audit_logs where acao = 'APAGAR'",
      );
      return rows;
    });
    expect(linhas).toHaveLength(0);
  });

  it("não altera registro já gravado", async () => {
    // Sem politica de update, o Postgres nao lanca erro: simplesmente nao
    // encontra linha para alterar. E por isso que conferimos rowCount.
    const afetadas = await comOrganizacao(app, orgA, async (client) => {
      const { rowCount } = await client.query(
        "update audit_logs set acao = 'ADULTERADO'",
      );
      return rowCount;
    });
    expect(afetadas).toBe(0);

    const { rows } = await dono.query("select acao from audit_logs");
    expect(rows.map((r) => r.acao)).not.toContain("ADULTERADO");
  });

  it("não apaga registro já gravado", async () => {
    const afetadas = await comOrganizacao(app, orgA, async (client) => {
      const { rowCount } = await client.query("delete from audit_logs");
      return rowCount;
    });
    expect(afetadas).toBe(0);

    const { rowCount } = await dono.query("select 1 from audit_logs");
    expect(rowCount).toBe(1);
  });

  it("não registra em nome de outra organização", async () => {
    // registrar() nao aceita organization_id como parametro: ele vem de
    // app.organization_id. Nao ha caminho para gravar em outra organizacao.
    await comOrganizacao(app, orgB, async (client) => {
      await registrar(client, {
        userId,
        acao: "CRIAR",
        recurso: "empresa",
        recursoId: null,
      });
    });

    const daOrgA = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query("select * from audit_logs");
      return rows;
    });
    expect(daOrgA).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- tests/lib/auditoria.test.ts
```

Esperado: FALHA — módulo `@/lib/auditoria` não encontrado.

- [ ] **Step 3: Escrever a migração de auditoria**

Criar `db/migrations/0004_auditoria.sql`:

```sql
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
  using (organization_id = current_setting('app.organization_id', true)::uuid);

-- with check amarra a insercao: nao ha como gravar em nome de outra
-- organizacao, nem por engano nem de proposito.
create policy audit_logs_escrita on audit_logs
  for insert
  with check (organization_id = current_setting('app.organization_id', true)::uuid);

-- Nao existe politica para update nem para delete. A ausencia faz o Postgres
-- nao encontrar linha alguma para essas operacoes: a trilha e somente-anexar
-- do ponto de vista da aplicacao.

grant select, insert on audit_logs to psico360_app;
```

- [ ] **Step 4: Escrever o módulo de auditoria**

Criar `lib/auditoria.ts`:

```typescript
import type { PoolClient } from "pg";

export type EventoAuditoria = {
  userId: string | null;
  acao: string;
  recurso: string;
  recursoId: string | null;
  detalhe?: Record<string, unknown>;
};

/**
 * Grava o evento usando o client da transação corrente. Se a operação auditada
 * falhar e a transação for desfeita, o registro cai junto — auditoria que
 * sobrevive a uma operação que não aconteceu é ruído.
 *
 * `organization_id` não é parâmetro: vem de `app.organization_id`, o mesmo
 * valor que a política de RLS confere. Não há como registrar em nome de outra
 * organização.
 */
export async function registrar(
  client: PoolClient,
  evento: EventoAuditoria,
): Promise<void> {
  await client.query(
    `insert into audit_logs
       (organization_id, user_id, acao, recurso, recurso_id, detalhe)
     values
       (current_setting('app.organization_id', true)::uuid, $1, $2, $3, $4, $5)`,
    [
      evento.userId,
      evento.acao,
      evento.recurso,
      evento.recursoId,
      evento.detalhe ? JSON.stringify(evento.detalhe) : null,
    ],
  );
}
```

- [ ] **Step 5: Aplicar, rodar e ver passar**

```bash
npm run migrate:test
npm test -- tests/lib/auditoria.test.ts
```

Esperado: 6 testes passam.

- [ ] **Step 6: Atualizar o schema Drizzle**

Trocar a linha de importação no topo de `db/schema.ts` por:

```typescript
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
```

Acrescentar ao final do arquivo:

```typescript
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  userId: uuid("user_id"),
  acao: text("acao").notNull(),
  recurso: text("recurso").notNull(),
  recursoId: uuid("recurso_id"),
  detalhe: jsonb("detalhe"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 7: Commit**

```bash
npm run migrate
git add -A
git commit -m "feat: trilha de auditoria somente-anexar com RLS e escrita transacional"
```

---

### Task 6: Sessão e tela de login

Entrega: um usuário entra pelo navegador, recebe cookie de sessão, e a aplicação sabe qual organização usar.

**Decisão registrada:** sessão em tabela própria com cookie, em vez de biblioteca de autenticação. O produto precisa de e-mail e senha para poucos usuários internos — o trabalhador nunca faz login, entra por token anônimo (Plano 3). Uma biblioteca traria superfície de API que muda entre versões em troca de recursos que não usaremos. O padrão adotado é o comum e bem trilhado: cookie `httpOnly`, `secure`, `sameSite=lax`, sessão no servidor, senha em argon2id, token guardado apenas como hash.

**Files:**
- Create: `db/migrations/0005_sessoes.sql`, `lib/sessao.ts`, `app/entrar/page.tsx`, `app/entrar/acoes.ts`
- Test: `tests/lib/sessao.test.ts`

**Interfaces:**
- Consumes: `conferirSenha` (Task 4), `criarUsuario` e `vincular` (Task 4)
- Produces: `lib/sessao.ts` exporta
  - `autenticar(pool: Pool, email: string, senha: string): Promise<{ token: string; organizationId: string; userId: string } | null>`
  - `lerSessao(pool: Pool, token: string): Promise<{ userId: string; organizationId: string } | null>`
  - `encerrar(pool: Pool, token: string): Promise<void>`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/lib/sessao.test.ts`:

```typescript
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { criarUsuario, vincular } from "@/lib/usuarios";
import { autenticar, encerrar, lerSessao } from "@/lib/sessao";

const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);
const app = criarPool(process.env.DATABASE_URL_TEST_APP!);

let orgA: string;

beforeAll(async () => {
  await dono.query("delete from sessoes");
  await dono.query("delete from audit_logs");
  await dono.query("delete from org_members");
  await dono.query("delete from users");
  await dono.query("delete from organizations");
  const a = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria A', 'SST') returning id",
  );
  orgA = a.rows[0].id;
  const { id } = await criarUsuario(app, {
    email: "login@consultoria-a.com.br",
    senha: "senha-de-teste-123",
    nome: "Usuário Login",
  });
  await vincular(app, { userId: id, organizationId: orgA, papel: "SST_ADMIN" });
});

afterAll(async () => {
  await dono.end();
  await app.end();
});

describe("sessão", () => {
  it("autentica com a senha correta e devolve a organização", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    expect(sessao).not.toBeNull();
    expect(sessao!.organizationId).toBe(orgA);
    expect(sessao!.token).toHaveLength(64);
  });

  it("recusa a senha errada", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-errada",
    );
    expect(sessao).toBeNull();
  });

  it("recusa email inexistente", async () => {
    const sessao = await autenticar(app, "ninguem@lugar.com", "qualquer-coisa");
    expect(sessao).toBeNull();
  });

  it("lê a sessão a partir do token", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    const lida = await lerSessao(app, sessao!.token);
    expect(lida!.organizationId).toBe(orgA);
    expect(lida!.userId).toBe(sessao!.userId);
  });

  it("não lê sessão encerrada", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    await encerrar(app, sessao!.token);
    expect(await lerSessao(app, sessao!.token)).toBeNull();
  });

  it("não guarda o token em claro no banco", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    const { rows } = await dono.query(
      "select token_hash from sessoes where token_hash = $1",
      [sessao!.token],
    );
    expect(rows).toHaveLength(0);
  });

  it("não lê sessão expirada", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    await dono.query(
      "update sessoes set expira_em = now() - interval '1 hour'",
    );
    expect(await lerSessao(app, sessao!.token)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm test -- tests/lib/sessao.test.ts
```

Esperado: FALHA — módulo `@/lib/sessao` não encontrado.

- [ ] **Step 3: Escrever a migração de sessões**

Criar `db/migrations/0005_sessoes.sql`:

```sql
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
```

- [ ] **Step 4: Escrever o módulo de sessão**

Criar `lib/sessao.ts`:

```typescript
import { createHash, randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { conferirSenha } from "./senha";

const DURACAO_HORAS = 12;

/**
 * O token vai para o cookie do navegador; no banco guardamos apenas o SHA-256
 * dele. Quem obtiver uma cópia do banco não obtém sessões utilizáveis.
 */
function embaralhar(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function autenticar(
  pool: Pool,
  email: string,
  senha: string,
): Promise<{ token: string; organizationId: string; userId: string } | null> {
  const { rows } = await pool.query(
    `select u.id, u.senha_hash, m.organization_id
       from users u
       join org_members m on m.user_id = u.id
      where u.email = $1
      limit 1`,
    [email.toLowerCase().trim()],
  );
  if (rows.length === 0) return null;

  const usuario = rows[0];
  if (!(await conferirSenha(usuario.senha_hash, senha))) return null;

  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DURACAO_HORAS * 60 * 60 * 1000);

  await pool.query(
    `insert into sessoes (token_hash, user_id, organization_id, expira_em)
     values ($1, $2, $3, $4)`,
    [embaralhar(token), usuario.id, usuario.organization_id, expiraEm],
  );

  return {
    token,
    userId: usuario.id,
    organizationId: usuario.organization_id,
  };
}

export async function lerSessao(
  pool: Pool,
  token: string,
): Promise<{ userId: string; organizationId: string } | null> {
  const { rows } = await pool.query(
    `select user_id, organization_id
       from sessoes
      where token_hash = $1 and expira_em > now()`,
    [embaralhar(token)],
  );
  if (rows.length === 0) return null;
  return {
    userId: rows[0].user_id,
    organizationId: rows[0].organization_id,
  };
}

export async function encerrar(pool: Pool, token: string): Promise<void> {
  await pool.query("delete from sessoes where token_hash = $1", [
    embaralhar(token),
  ]);
}
```

- [ ] **Step 5: Aplicar, rodar e ver passar**

```bash
npm run migrate:test
npm test -- tests/lib/sessao.test.ts
```

Esperado: 7 testes passam.

- [ ] **Step 6: Escrever a ação de servidor do login**

Criar `app/entrar/acoes.ts`:

```typescript
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { criarPool } from "@/db/client";
import { autenticar } from "@/lib/sessao";

const pool = criarPool(process.env.DATABASE_URL_APP!);

export async function entrar(_anterior: unknown, dados: FormData) {
  const email = String(dados.get("email") ?? "");
  const senha = String(dados.get("senha") ?? "");

  const sessao = await autenticar(pool, email, senha);
  if (!sessao) {
    // Mensagem unica para email inexistente e senha errada: dizer qual dos
    // dois falhou entrega a um atacante a lista de emails cadastrados.
    return { erro: "E-mail ou senha inválidos." };
  }

  const jar = await cookies();
  jar.set("psico360_sessao", sessao.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_COOKIE_SEGUNDOS,
  });

  redirect("/painel");
}

const DURACAO_COOKIE_SEGUNDOS = 12 * 60 * 60;
```

- [ ] **Step 7: Escrever a tela de login**

Criar `app/entrar/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";

export default function Entrar() {
  const [estado, acao, pendente] = useActionState(entrar, null);

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto", padding: 24 }}>
      <h1>PSICO360</h1>
      <form action={acao}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
        />

        {estado?.erro ? <p role="alert">{estado.erro}</p> : null}

        <button type="submit" disabled={pendente}>
          {pendente ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 8: Criar um usuário de desenvolvimento**

Sem isto não há com quem entrar. Criar `scripts/semear.ts`:

```typescript
import { config } from "dotenv";
import { criarPool } from "../db/client";
import { criarUsuario, vincular } from "../lib/usuarios";

config({ path: ".env.local" });

const dono = criarPool(process.env.DATABASE_URL_OWNER!);
const app = criarPool(process.env.DATABASE_URL_APP!);

async function semear() {
  const email = process.argv[2];
  const senha = process.argv[3];
  const nome = process.argv[4] ?? "Administrador";

  if (!email || !senha) {
    console.error('Uso: npm run semear -- "email@dominio.com" "senha" "Nome"');
    process.exit(1);
  }

  const { rows } = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria de Desenvolvimento', 'SST') returning id",
  );
  const organizationId = rows[0].id;

  const { id } = await criarUsuario(app, { email, senha, nome });
  await vincular(app, { userId: id, organizationId, papel: "SST_ADMIN" });

  console.log(`Usuário criado: ${email}`);
  console.log(`Organização: ${organizationId}`);

  await dono.end();
  await app.end();
}

semear().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
```

Em `package.json`, dentro de `"scripts"`:

```json
"semear": "tsx scripts/semear.ts"
```

Rodar, escolhendo uma senha sua:

```bash
npm run semear -- "rodrigo@psico360.com.br" "TROQUE-esta-senha-123" "Rodrigo"
```

- [ ] **Step 9: Conferir no navegador**

```bash
npm run dev
```

Abrir `http://localhost:3000/entrar`. Esperado: senha errada mostra "E-mail ou senha inválidos."; senha correta redireciona para `/painel`, que ainda não existe e devolve 404 — comportamento esperado nesta tarefa, a tela `/painel` entra no Plano 2.

- [ ] **Step 10: Rodar a suíte inteira**

```bash
npm test
```

Esperado: todos os arquivos de teste passam.

- [ ] **Step 11: Commit**

```bash
npm run migrate
git add -A
git commit -m "feat: sessao com cookie httpOnly, token em hash, tela de login e semeador"
```

---

## Definição de pronto deste plano

- [ ] `npm test` passa inteiro
- [ ] O teste de isolamento prova que a organização A não lê, não altera e não apaga dado da organização B
- [ ] Sem contexto declarado, o papel da aplicação não enxerga linha alguma
- [ ] A trilha de auditoria não aceita `update` nem `delete` pela aplicação
- [ ] Nenhuma senha e nenhum token de sessão existe em claro no banco
- [ ] `git ls-files | grep -E "^\.env"` não retorna nada
- [ ] Login funciona no navegador

## O que este plano deliberadamente não faz

Cadastro de empresas, unidades, departamentos, cargos e quadro de pessoal — Plano 2. Recuperação de senha, convite de usuário por e-mail e a tela `/painel` entram no Plano 2, quando houver conteúdo para exibir. Deploy é o Plano 6: até lá tudo roda em `localhost` contra o banco gerenciado.
