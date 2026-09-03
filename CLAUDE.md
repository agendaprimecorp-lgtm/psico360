# PSICO360

Plataforma de gestão de riscos psicossociais para a NR-1, em piloto.

## Banco de dados

Existem dois papéis de conexão. O papel dono roda migrações e o preparo de testes;
ele ignora RLS (Row-Level Security). O papel `psico360_app` é o que a aplicação usa
para atender requisição de usuário, e é sobre ele que as políticas de RLS incidem.

Nunca fazer a aplicação conectar com o papel dono — isso anula o isolamento entre
organizações. Produção carrega apenas `DATABASE_URL_APP`.

## Segredos

`.env.local` nunca é versionado; só `.env.example`, sem valores. Conferir antes de
todo commit que nenhum segredo entrou.

## Idioma

Interface, mensagens de erro e nomes de colunas de domínio em português; palavras-
chave técnicas em inglês.

## Testes

Toda tarefa termina com testes passando e um commit. Teste primeiro, implementação
depois.

## Documentos de referência

A especificação vigente é
`docs/superpowers/specs/2026-09-03-psico360-piloto-design.md`. O plano em execução é
`docs/superpowers/plans/2026-09-03-plano-1-fundacao.md`.

Os arquivos `01_` a `05_` na raiz são registro histórico e têm premissas superadas.

---

@AGENTS.md
