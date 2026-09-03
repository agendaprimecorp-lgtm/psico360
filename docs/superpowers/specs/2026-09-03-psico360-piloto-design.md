# PSICO360 — Especificação do Piloto

**Data:** 3 de setembro de 2026
**Status:** Aprovado para planejamento de implementação
**Escopo:** Piloto vertical, 1 consultoria SST + 1 empresa cliente, em produção
**Substitui:** as premissas de prazo, escopo, precificação e metodologia dos documentos `01` a `05`

---

## 1. Contexto regulatório — estado real

A Portaria MTE 1.419/2024 incluiu os fatores de risco psicossocial no Gerenciamento de
Riscos Ocupacionais (GRO) e no Programa de Gerenciamento de Riscos (PGR), previstos na NR-1.

Linha do tempo verificada:

| Data | Evento |
|---|---|
| 27/08/2024 | Publicação da Portaria MTE 1.419/2024 |
| Maio/2025 | Norma entra em vigor |
| Maio/2025 – 25/05/2026 | Fase educativa e orientativa, sem autuação |
| 26/05/2026 | Fiscalização passa a ter caráter punitivo |
| **03/09/2026 (hoje)** | **Fiscalização punitiva ativa há ~3 meses** |

Multas de R$ 2 mil a R$ 200 mil, proporcionais ao porte e à gravidade, com possibilidade de
interdição e de responsabilização civil e criminal em caso de adoecimento ocupacional.
A obrigação alcança todo empregador com empregados regidos pela CLT, sem exceção por porte.

O Ministério Público do Trabalho já atua de forma independente do prazo em setores de alta
incidência de adoecimento mental: teleatendimento, saúde, bancos e tecnologia da informação.

### Consequência estratégica

Os documentos anteriores foram escritos assumindo que a obrigação ainda estava por vir e que
havia 12 a 18 meses de vantagem de pioneirismo. **Essa premissa não é mais válida.**

- **A favor:** a urgência do comprador deixou de ser hipotética. A objeção "isso ainda não me
  afeta" desapareceu do processo de venda.
- **Contra:** a tese de exclusividade morreu. Concorrentes tiveram a fase educativa inteira
  para lançar. Qualquer alegação de diferencial precisa ser remapeada antes de virar
  argumento comercial.

---

## 2. Restrições que definem este desenho

| Restrição | Valor | Consequência |
|---|---|---|
| Equipe | Rodrigo sozinho, com Claude | Escopo mínimo viável; simplicidade operacional acima de elegância |
| Primeiro marco | Piloto real, 1 SST + 1 empresa, em produção | Fatia vertical fina ponta a ponta |
| Orçamento de infraestrutura | R$ 150–600/mês | Plataforma gerenciada; nada de serviço pago supérfluo |
| Anonimato | Anônimo com célula mínima | Define o schema e elimina o cofre clínico separado |
| Arquitetura | Monolito TypeScript gerenciado | Um repositório, uma linguagem, um deploy |

---

## 3. Correções ao material anterior

Registradas para que não voltem por inércia.

### 3.1 Prazo

Os documentos apresentam três números incompatíveis: 21 semanas (README e roadmap),
"32-35 semanas" (PRD §11) e 30 semanas (soma real das fases do PRD). Todos foram calculados
para uma equipe de seis pessoas — Senior Dev, Security Dev, DevOps, dois devs e um frontend.
Nenhum descreve a realidade de execução deste projeto. **O roadmap `05` está aposentado como
plano.**

### 3.2 Precificação

O documento de mercado diz que a SST paga R$ 400 por empresa/ano; o PRD diz R$ 100–150 por
empresa/ano; os planos falam em R$ 300–600 por mês. A diferença entre R$ 400/ano e R$ 600/mês
é de aproximadamente dezoito vezes. **A economia unitária não está definida** e não é resolvida
por esta especificação — é decisão comercial, a ser tomada com dados do piloto.

### 3.3 Projeção de receita

A tabela de TAM projeta R$ 100–130 milhões no ano 3; o cálculo bottom-up logo abaixo chega a
R$ 270 milhões, acima do próprio teto "otimista" da tabela. A projeção do ano 1 assume 50
consultorias SST fechadas, enquanto o mesmo documento define a meta de beta como 2 a 5.
**As projeções são inconsistentes entre si** e não devem ser usadas para decisão até serem
refeitas.

### 3.4 Duração do questionário

O PRD especifica 30–45 minutos por respondente e, simultaneamente, meta de participação acima
de 70%. Essas duas metas são incompatíveis em população de chão de fábrica ou teleatendimento.
**Corrigido:** instrumento curto, faixa de 10–15 minutos.

### 3.5 Limiares de risco configuráveis por tenant

O PRD define que os limiares de classificação são configuráveis por cliente. Isso permite a um
empregador calibrar o sistema para não registrar risco alto. **Corrigido: limiares pertencem à
versão do instrumento, são publicados e são iguais para todos os clientes.** O cliente comenta
e contextualiza; não move a linha.

### 3.6 Direção das dimensões

O PRD trata a escala como "0-100, quanto maior pior" de modo uniforme. Isso inverte metade do
instrumento: em apoio social, autonomia e previsibilidade, pontuação alta indica risco **baixo**.
**Corrigido: cada dimensão carrega sua direção, e o score exibido é sempre normalizado para
"quanto maior, mais risco".**

### 3.7 Tabela única de classificação

O PRD usa cortes globais (0-25 baixo, 26-50 moderado, 51-75 alto, 76-100 crítico). Os pontos de
corte do COPSOQ são por dimensão, porque a média populacional de cada uma difere.
**Corrigido: cortes por dimensão, pertencentes à versão do instrumento.**

### 3.8 Assédio e violência como itens de questionário

Os fatores 13 e 14 da lista original são assédio e violência, tratados como perguntas.
Não há fluxo definido para quando alguém relata algo grave. **Corrigido: canal de denúncia
separado, com destinatário designado, fora do relatório agregado** (ver §8).

### 3.9 LGPD na fase 10

Os documentos afirmam "segurança desde o dia 1" e alocam LGPD na décima fase, próxima ao
lançamento. Consentimento, minimização e anonimato são decisões de schema — não podem ser
adicionados depois. **Corrigido: incorporados ao modelo de dados desde a primeira migração.**

### 3.10 Instrumento indefinido

Os 18 fatores aparecem sem origem metodológica. **Corrigido: COPSOQ II-Br versão curta**
(ver §6 e a pendência em §13).

---

## 4. Escopo do piloto

### 4.1 Dentro

- Organização SST com empresas clientes, isolamento por Row-Level Security
- Papéis mínimos: administrador SST, técnico SST, RH da empresa
- Cadastro de empresa por CNPJ, com unidades, departamentos e cargos
- Importação do quadro de pessoal por CSV
- Instrumento COPSOQ II-Br curto, versionado
- Ciclo de avaliação com geração de tokens e PDF de convites com QR
- Questionário anônimo, mobile-first
- Cálculo determinístico, célula mínima e portão de participação
- Mapa de risco por dimensão e por recorte
- Plano de ação em linguagem de PGR
- Cofre de evidências com versionamento
- Relatório PDF imutável, com hash e assinatura do responsável técnico
- Canal de denúncia separado
- Trilha de auditoria
- Consentimento e aviso de privacidade

### 4.2 Fora, com motivo

| Item | Motivo do adiamento |
|---|---|
| IA | O piloto exige cálculo determinístico e defensável; IA não pertence ao caminho do cálculo |
| Billing / gateway | Com um cliente, cobra-se por contrato; integrar gateway é desperdício |
| White-label | Só faz sentido a partir da segunda ou terceira SST |
| Marketplace de profissionais | Produto distinto, com sua própria especificação |
| Módulo clínico / cuidado | Incompatível com a decisão de anonimato; produto distinto |
| WhatsApp | Custo por conversa e verificação Meta antes de haver receita |
| eSocial (S-2220, S-2240) | Diferencial futuro forte, complexidade alta demais para o piloto |
| API pública | Não há consumidor externo no piloto |
| Multi-idioma | Mercado nacional |

---

## 5. Arquitetura

Monolito TypeScript em plataforma gerenciada.

- **Aplicação:** Next.js (App Router), servindo interface e API no mesmo deploy
- **Banco:** PostgreSQL gerenciado, com Row-Level Security
- **Autenticação:** biblioteca sobre o próprio banco; sem Auth0
- **Armazenamento de evidências:** bucket compatível com S3
- **Geração de PDF:** no servidor
- **E-mail transacional:** para usuários do sistema (SST e RH), não para trabalhador

Justificativa: o gargalo do projeto não é capacidade de processamento, é a capacidade de uma
pessoa manter o sistema. Toda decisão de stack compra simplicidade operacional. A RLS coloca
o isolamento de tenant no banco, onde ele resiste a uma query mal escrita na aplicação.

---

## 6. Modelo de dados

### 6.1 Tabelas

**Organização e acesso**
`organizations`, `users`, `org_members`, `audit_logs`

**Estrutura**
`companies`, `units`, `departments`, `positions`, `roster`

**Instrumento**
`instruments`, `instrument_versions`, `instrument_items`, `dimensions`

**Coleta**
`assessment_cycles`, `invitations`, `responses`, `response_items`

**Resultado**
`dimension_scores`, `risks`, `actions`, `action_updates`

**Saída**
`evidence`, `evidence_versions`, `reports`

**Canal**
`disclosures`

Vinte e cinco tabelas. `organizations` é a raiz de tenancy; toda tabela carrega
`organization_id` e uma política de RLS amarrada à organização da sessão.

### 6.2 Versionamento do instrumento

Toda resposta referencia `instrument_version_id`. É o que permite reproduzir, anos depois,
exatamente como um score foi calculado — requisito para valor probatório.

---

## 7. Mecanismo de anonimato

### 7.1 O corte

O vínculo entre identidade e conteúdo é cortado no momento do envio. Duas escritas
independentes, na mesma transação:

```
invitations (identidade)                responses (conteúdo)
├─ roster_id  → pessoa real             ├─ cycle_id
├─ cycle_id                             ├─ instrument_version_id
├─ token_hash (uso único)               ├─ estrato: unidade, departamento,
├─ status: enviado→aberto→respondido    │           cargo, faixa de tempo de casa
└─ respondido_em (não exposto)          ├─ respondido_em_dia (apenas a data)
                                        └─ itens[] → valores Likert
```

Não existe coluna ligando as duas tabelas. O token prova elegibilidade e queima no uso.
A taxa de participação vem da contagem de convites com status `respondido`.

### 7.2 Carimbo de tempo grosso

`responses.respondido_em_dia` guarda apenas a data. Um carimbo com hora e minuto permitiria
reidentificação por correlação com `invitations.respondido_em`. É o vazamento mais fácil de
cometer e o mais difícil de perceber depois.

`invitations.respondido_em` nunca é exposto a usuários da organização; apenas contagens
agregadas são.

### 7.3 Célula mínima com piso rígido

Nenhum recorte é exibido com menos de N respondentes; sobe para o nível pai. N é configurável
para cima, **nunca abaixo de 5**.

**Supressão complementar obrigatória:** quando um recorte é suprimido, o segundo menor recorte
do mesmo nível também é, sob pena de o valor suprimido ser obtido por subtração do total.

**A regra vale para combinações de estrato, não apenas para o estrato isolado.** O cruzamento
de unidade, departamento, cargo e faixa de tempo de casa produz células pequenas rapidamente;
cada combinação exibida é submetida ao mesmo piso.

### 7.4 Ausência de campo livre

O instrumento é integralmente Likert. Texto livre é onde entra relato identificável de terceiro
dentro de um documento destinado ao empregador. Fica fora do questionário.

---

## 8. Canal de denúncia

Separado do instrumento, com fluxo próprio:

- Destinatário designado, nunca o gestor imediato do denunciante
- Não entra no relatório agregado nem no cálculo de risco
- Acesso restrito e integralmente auditado
- Tela de recursos de apoio acessível durante todo o questionário

Além de correto eticamente, atende a Lei 14.457/2022, que já obriga canal de recebimento de
denúncias — o que transforma a exigência em argumento comercial.

---

## 9. Motor de risco

### 9.1 Da resposta ao score

Itens Likert de 5 pontos convertidos para 0, 25, 50, 75, 100. O score da dimensão é a média
dos seus itens.

**Nada disso passa por IA.** O cálculo é determinístico e reproduzível, porque será contestado.

Cada dimensão declara sua direção. O score exibido é sempre normalizado para "quanto maior,
mais risco" (ver correção §3.6).

### 9.2 Da pontuação à classificação

Pontos de corte por dimensão, pertencentes à versão do instrumento, publicados e idênticos
para todos os clientes (ver correções §3.5 e §3.7).

### 9.3 Do risco à linguagem do PGR

O relatório precisa ser anexável ao PGR e falar seu vocabulário:

```
dimensão em risco  →  perigo / fonte geradora
                   →  grupo exposto (setor, cargo)
                   →  nível de risco
                   →  medidas de prevenção propostas
                   →  responsável e prazo
                   →  evidência de implementação
                   →  reavaliação
```

Consequência de escopo: o plano de ação não é módulo posterior. Um diagnóstico sem plano
cumpre metade da NR-1 — a metade que não evita autuação.

### 9.4 Portão de validade

Abaixo de um piso de participação, o sistema **não emite classificação de risco**. Emite
relatório de participação insuficiente com recomendação de nova coleta.

Publicar percentuais derivados de participação baixa produziria ficção assinada por um
responsável técnico. A recusa é característica de qualidade e deve ser comunicada como tal.

O valor do piso é pendência metodológica (§13).

---

## 10. Relatório

Imutável, com hash no momento da emissão. Reemissão gera nova versão; nunca sobrescreve.

Conteúdo obrigatório:

- Instrumento e versão, nominalmente
- População convidada, população respondente, taxa de participação
- Período de coleta
- Método de agregação e regra de célula mínima aplicada
- Resultados por dimensão e por recorte, com os recortes suprimidos **declarados como suprimidos**
- Limitações metodológicas, escritas
- Plano de ação vinculado
- Identificação e assinatura do responsável técnico, com registro no conselho (CRP, CREA ou CRM)

### Consequência de produto

Quem assina não é o PSICO360 nem Rodrigo: é o profissional habilitado da consultoria SST.
Isso reforça o modelo B2B2B — a SST já possui esses profissionais, e a plataforma passa a ser
a ferramenta que dá escala ao trabalho deles.

---

## 11. Integrações

### 11.1 Alcance ao trabalhador

Decisão do piloto: **nenhuma integração de mensageria.** O sistema gera os tokens e produz um
PDF de etiquetas destacáveis, cada uma com QR code e código curto individual. A empresa
distribui pelos canais que já usa — contracheque, reunião de turno, crachá, mural.

Justificativa: e-mail não alcança chão de fábrica, portaria, limpeza e produção; SMS entrega
mal e custa; WhatsApp exige conta Meta Business verificada, template de utilidade aprovado e
custo por conversa. A impressão custa zero, funciona onde e-mail não chega, e preserva o token
individual que garante uma resposta por pessoa.

WhatsApp entra quando houver receita que o pague.

### 11.2 Entra no piloto

| Integração | Uso |
|---|---|
| BrasilAPI (CNPJ) | Preenche razão social e CNAE no cadastro; gratuita |
| E-mail transacional | Usuários do sistema (SST, RH); não trabalhador |
| Bucket S3-compatível | Evidências |

### 11.3 Fora do piloto

Gateway de pagamento (PIX, boleto, cartão), NFS-e municipal, eSocial, assinatura ICP-Brasil,
WhatsApp Business API.

Sobre assinatura: no piloto o relatório carrega hash de integridade, identificação do
responsável técnico e registro no conselho. Certificado ICP-Brasil quando um cliente exigir.

---

## 12. Segurança e LGPD

- **Isolamento de tenant:** RLS no PostgreSQL em toda tabela, mais filtro na aplicação
- **Base legal:** consentimento do trabalhador para a coleta, registrado com a versão do aviso
- **Minimização:** a resposta não carrega identificador de pessoa (§7)
- **Retenção:** dados de contato do quadro são purgados após o encerramento do ciclo
- **Trilha de auditoria:** desde a primeira migração, não como fase posterior
- **Titular:** aviso de privacidade e canal de exercício de direitos

---

## 13. Pendências em aberto

Itens que esta especificação não resolve e que precisam de decisão antes ou durante a
implementação.

| # | Pendência | Natureza | Bloqueia |
|---|---|---|---|
| 1 | Confirmar termos de uso comercial do COPSOQ junto à COPSOQ International Network | Jurídica | Lançamento comercial |
| 2 | Obter a lista de itens e os pontos de corte da versão curta brasileira validada | Metodológica | Implementação do motor |
| 3 | Definir o valor do piso de participação | Metodológica | Portão de validade (§9.4) |
| 4 | Definir a economia unitária (preço por empresa, repasse à SST) | Comercial | Precificação, não o piloto |
| 5 | Remapear a concorrência após a fase educativa | Comercial | Argumento de venda |
| 6 | Identificar a consultoria SST parceira do piloto | Comercial | O piloto em si |
| 7 | Horas semanais disponíveis de Rodrigo | Planejamento | Dimensionamento do plano |

A pendência 6 merece destaque: o marco escolhido é um piloto real com uma SST. Sem essa
parceria, o produto pode ser construído mas não pode ser validado.

---

## 14. Testes obrigatórios

Antes de qualquer uso com dados reais:

1. **Isolamento de tenant** — usuário da organização A não alcança dado da organização B por
   nenhum caminho: interface, API, relatório ou busca
2. **Não vinculação** — nenhuma consulta, nem com acesso direto ao banco, liga uma resposta a
   uma pessoa do quadro
3. **Célula mínima** — recorte com menos de N respondentes não é exibido, e a supressão
   complementar impede a obtenção por subtração
4. **Carimbo grosso** — `responses` não expõe hora; correlação por tempo não reidentifica
5. **Token de uso único** — segunda submissão com o mesmo token é recusada
6. **Portão de participação** — abaixo do piso, o sistema recusa emitir classificação
7. **Direção das dimensões** — dimensão protetora com pontuação alta resulta em risco baixo
8. **Imutabilidade do relatório** — reemissão cria versão nova; hash da anterior permanece válido
9. **Fluxo ponta a ponta** — cadastro, ciclo, coleta, cálculo, plano, evidência, relatório

---

## 15. Definição de pronto para o piloto

O piloto está pronto quando uma consultoria SST consegue, sem assistência:

1. Cadastrar uma empresa cliente com sua estrutura
2. Importar o quadro de pessoal
3. Criar um ciclo de avaliação e imprimir os convites
4. Coletar respostas de trabalhadores reais
5. Obter o mapa de risco, respeitados célula mínima e portão de participação
6. Montar o plano de ação em linguagem de PGR
7. Anexar evidências
8. Emitir o relatório assinado pelo seu responsável técnico
9. Anexar esse relatório ao PGR da empresa
