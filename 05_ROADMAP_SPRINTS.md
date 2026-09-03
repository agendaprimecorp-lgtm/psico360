# PSICO360 — ROADMAP DETALHADO POR SPRINT

**21 semanas de desenvolvimento estruturado**

---

## TIMELINE VISUAL

```
Setembro 2024        Janeiro 2025        Maio 2025         Setembro 2025
     |                   |                  |                    |
     v                   v                  v                    v
  [Validação]      [Development Starts]  [MVP Launch]      [Scale Up]
     |                   |                  |                    |
  Semana 1           Semanas 1-8        Semanas 21       Semanas 22+
```

---

## SEMANA 1-2: FASE 0 — ARQUITETURA

### Sprint 0.1: Database + Tenancy

**Goal:** Ter schema pronto para dev

**Tasks:**
```
Task 1: Database Design
├─ Criar schema.sql (migrations)
├─ Validar relationships
├─ Preparar índices
└─ Estimated: 3 dias | Owner: Tech Lead

Task 2: Multi-Tenancy Setup
├─ RLS (Row-Level Security) PostgreSQL
├─ Tenant context middleware
├─ Tenant isolation tests
└─ Estimated: 2 dias | Owner: Senior Dev

Task 3: Authentication Scaffold
├─ OAuth2 setup (Auth0/Okta)
├─ JWT implementation
├─ RBAC schema
└─ Estimated: 2 dias | Owner: Security Dev
```

**Deliverables:**
- [x] schema.sql versionado
- [x] ERD.pdf (visual)
- [x] RLS policies testadas
- [x] 5+ tenant isolation tests

**Acceptance:**
- [ ] Database boots com `migrations up`
- [ ] Tenant context isolado por request
- [ ] Tests passam (tenant isolation)

---

### Sprint 0.2: CI/CD + Infrastructure

**Goal:** Pipeline pronto para deploy automático

**Tasks:**
```
Task 1: CI/CD Pipeline
├─ GitHub Actions setup
├─ Lint + test automático
├─ Docker build + push
└─ Estimated: 2 dias | Owner: DevOps

Task 2: Cloud Infrastructure
├─ AWS (ou similar) setup
├─ VPC, RDS, S3, CloudFront
├─ Staging + Prod environments
└─ Estimated: 2 dias | Owner: DevOps

Task 3: Monitoring & Observability
├─ Sentry (error tracking)
├─ CloudWatch (metrics)
├─ Logging (ELK ou CloudWatch)
└─ Estimated: 1 dia | Owner: DevOps
```

**Deliverables:**
- [x] `.github/workflows/` prontos
- [x] Infrastructure as Code (Terraform/CloudFormation)
- [x] Monitoring dashboards criados

**Acceptance:**
- [ ] Push to main → Pipeline executa
- [ ] Tests passam → Deploy automático para staging
- [ ] Sentry recebe erros e alerta

---

## SEMANA 3-4: FASE 1 — CORE

### Sprint 1.1: Organizations & Companies

**Goal:** Estrutura base de multi-tenancy

**Tasks:**
```
Task 1: Organizations CRUD
├─ Modelo + migration
├─ Endpoints (POST, GET, PATCH, DELETE)
├─ Validações
├─ Tests (unit + integration)
└─ Estimated: 2 dias | Owner: Dev 1

Task 2: Companies CRUD
├─ Cadastro completo (CNPJ, setor, etc.)
├─ Relacionamento com organization
├─ Validação de CNPJ (algoritmo)
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 2

Task 3: UI (Login + Dashboard)
├─ Telas de login (OAuth2)
├─ Dashboard básico
├─ Navbar com nav principal
└─ Estimated: 2 dias | Owner: Frontend Dev
```

**Deliverables:**
- [x] API endpoints documentados (OpenAPI)
- [x] Validação CNPJ funcionando
- [x] Login screen + dashboard básico

**Acceptance:**
- [ ] Criar organização via API
- [ ] Fazer login via OAuth
- [ ] Ver dashboard vazio
- [ ] Criar primeira empresa

---

### Sprint 1.2: Users & RBAC

**Goal:** Sistema de permissões funcional

**Tasks:**
```
Task 1: Users & Roles
├─ User model + migration
├─ Roles (ADMIN, COMPANY_OWNER, HR, WORKER, SST, PROFESSIONAL)
├─ Role assignment
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 1

Task 2: RBAC Implementation
├─ Middleware de autorização
├─ Decoradores/guards (@RequireRole)
├─ Audit logging (para RBAC changes)
├─ Tests (matriz completa)
└─ Estimated: 3 dias | Owner: Dev 2

Task 3: Invitation Flow
├─ Email invitations
├─ Token-based signup
├─ Onboarding básico
└─ Estimated: 2 dias | Owner: Frontend Dev
```

**Deliverables:**
- [x] RBAC matriz implementada
- [x] 20+ tests de autorização
- [x] Email invitations funcionando

**Acceptance:**
- [ ] Criar user via invitation
- [ ] User vê apenas dados permitidos
- [ ] Tenta acessar recurso proibido → 403

---

## SEMANA 5-6: FASE 2 — WORKFORCE

### Sprint 2.1: Company Structure

**Goal:** Mapear estrutura organizacional

**Tasks:**
```
Task 1: Units (Matriz + Filiais)
├─ Unit model + migration
├─ CRUD + validações
├─ Relacionamento com company
├─ Tests
└─ Estimated: 1 dia | Owner: Dev 1

Task 2: Departments
├─ Department model
├─ CRUD
├─ Relatório de departamentos
└─ Estimated: 1 dia | Owner: Dev 1

Task 3: Positions & Employees
├─ Position model
├─ Employee model (CRUD)
├─ Bulk import (CSV)
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 2

Task 4: UI para Structure
├─ Form para units/depts/positions
├─ List + detail views
├─ CSV import interface
└─ Estimated: 2 dias | Owner: Frontend
```

**Deliverables:**
- [x] Company structure cadastrada
- [x] 50+ employees importados (seed data)
- [x] UI funcional para gestão

**Acceptance:**
- [ ] Cadastrar empresa + unidades + departamentos
- [ ] Importar 100 employees via CSV
- [ ] Ver estrutura organograma (básico)

---

## SEMANA 7-8: FASE 3 — ASSESSMENTS

### Sprint 3.1: Assessment Creation

**Goal:** Criar avaliações customizadas

**Tasks:**
```
Task 1: Question Engine
├─ Question model (tipos: likert, múltipla, texto, matriz, etc.)
├─ Conditional logic (if Q1 == X, mostrar Q2)
├─ Question templates (biblioteca)
├─ Tests
└─ Estimated: 3 dias | Owner: Dev 1

Task 2: Assessment Wizard
├─ Wizard de 10 passos (conforme PRD seção 5)
├─ Validações em cada step
├─ Revisão antes de publicar
└─ Estimated: 3 dias | Owner: Frontend Dev

Task 3: Assessment Templates
├─ Template de risk psicossocial (pré-built)
├─ Customização permitida
├─ Versionamento de templates
└─ Estimated: 1 dia | Owner: Dev 2
```

**Deliverables:**
- [x] Wizard funcional
- [x] 1 template pré-built
- [x] Question engine com condicionais

**Acceptance:**
- [ ] Criar assessment via wizard
- [ ] Perguntas aparecem condicionalmente
- [ ] Salvar e publicar assessment

---

### Sprint 3.2: Assessment Status & Publishing

**Goal:** Controle completo do ciclo de vida

**Tasks:**
```
Task 1: Assessment Statuses
├─ State machine (DRAFT → PUBLISHED → COMPLETED → FINALIZED)
├─ Transitions validadas
├─ Audit logs
└─ Estimated: 1 dia | Owner: Dev 1

Task 2: Publishing Flow
├─ Send invitations (email/SMS)
├─ Unique tokens por respondente
├─ Tracking de participação
└─ Estimated: 2 dias | Owner: Dev 2

Task 3: Dashboard de Avaliações
├─ List de assessments
├─ Status + participação
├─ Ações (view, edit, publish, close)
└─ Estimated: 2 dias | Owner: Frontend
```

**Deliverables:**
- [x] Assessment completo do ciclo
- [x] Email invitations enviadas
- [ ] Participation tracking (em tempo real)

**Acceptance:**
- [ ] Publicar assessment para 10 pessoas
- [ ] Receber emails
- [ ] Ver taxa de participação atualizar

---

## SEMANA 9-10: FASE 4 — WORKER PORTAL

### Sprint 4.1: Worker Experience

**Goal:** Trabalhador consegue responder avaliação

**Tasks:**
```
Task 1: Worker UI (Mobile-First)
├─ Responsive design
├─ Questionário otimizado para mobile
├─ Progress bar
├─ Offline capability (IndexedDB)
└─ Estimated: 3 dias | Owner: Frontend Dev

Task 2: Response Storage
├─ Responses model (encrypted)
├─ Partial submission (salvar progresso)
├─ Resume assessment (volta onde parou)
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 1

Task 3: Worker Resources
├─ FAQ section
├─ Contact support (chat ou email)
├─ Links úteis
└─ Estimated: 1 dia | Owner: Frontend
```

**Deliverables:**
- [x] Worker portal mobile-friendly
- [x] Responses encrypted e versionadas
- [x] FAQ + support link

**Acceptance:**
- [ ] Login como worker
- [ ] Responder avaliação (mobile)
- [ ] Salvar progresso e resumir
- [ ] Completar e submeter

---

## SEMANA 11: FASE 5 — RISK ENGINE

### Sprint 5.1: Risk Analysis

**Goal:** Dados transformados em riscos

**Tasks:**
```
Task 1: Aggregation & Scoring
├─ Agregar respostas por fator (18 fatores)
├─ Calcular scores (0-100)
├─ Classificar (LOW, MODERATE, HIGH, CRITICAL)
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 1

Task 2: Risk Visualization
├─ Matrix de riscos (fatores vs setores)
├─ Gráficos (bar, heatmap)
├─ Drill-down capability
└─ Estimated: 2 dias | Owner: Frontend Dev

Task 3: Risk Dashboard
├─ KPIs (críticos, altos, moderados, baixos)
├─ Evolução temporal
├─ Comparação setor
└─ Estimated: 1 dia | Owner: Frontend
```

**Deliverables:**
- [x] Scores calculados corretamente
- [x] Risk matrix visualizada
- [x] Dashboard com KPIs

**Acceptance:**
- [ ] Completar avaliação
- [ ] Executar análise (agregação)
- [ ] Ver riscos por fator e setor
- [ ] Dashboard atualiza

---

## SEMANA 12: FASE 6 — ACTIONS & TASKS

### Sprint 6.1: Action Planning

**Goal:** Transformar riscos em ações

**Tasks:**
```
Task 1: Action Model
├─ Action CRUD
├─ Relacionamento com risk
├─ Status workflow (PENDING → COMPLETED)
├─ Deadline tracking
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 1

Task 2: Task Assignment
├─ Atribuir ações a pessoas
├─ Notificações (email/in-app)
├─ Progress updates
└─ Estimated: 1 dia | Owner: Dev 2

Task 3: UI para Actions
├─ Form de criação (automático + manual)
├─ List + kanban board (opção)
├─ Detail view + edição
└─ Estimated: 2 dias | Owner: Frontend
```

**Deliverables:**
- [x] Actions criadas automaticamente de riscos
- [x] Notificações funcionando
- [x] UI para gestão de ações

**Acceptance:**
- [ ] Criar ação manualmente
- [ ] Atribuir a pessoa
- [ ] Enviar notificação
- [ ] Person vê no dashboard e atualiza status

---

## SEMANA 13: FASE 7 — EVIDENCE VAULT

### Sprint 7.1: Document Management

**Goal:** Armazenar e versionlr evidências

**Tasks:**
```
Task 1: Evidence Model
├─ File upload (S3)
├─ Metadata (tipo, descrição, data)
├─ Versioning (v1, v2, v3...)
├─ Permissions (quem vê)
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 1

Task 2: File Operations
├─ Upload (drag-drop)
├─ Delete (soft delete)
├─ Download
├─ Preview (PDF, images)
└─ Estimated: 2 dias | Owner: Frontend Dev

Task 3: Audit & Search
├─ Arquivo quem acessou quê (logs)
├─ Search por tipo/descrição
├─ Filter por data
└─ Estimated: 1 dia | Owner: Dev 2
```

**Deliverables:**
- [x] S3 bucket configurado
- [x] Upload/download funcionando
- [x] Versionamento em lugar

**Acceptance:**
- [ ] Upload documento
- [ ] Ver versão anterior
- [ ] Download documento
- [ ] Ver quem acessou (audit log)

---

## SEMANA 14: FASE 8 — RELATÓRIOS

### Sprint 8.1: Report Generation

**Goal:** PDF profissional gerado automaticamente

**Tasks:**
```
Task 1: Report Templates
├─ Executive report template
├─ Technical report template
├─ Customization (logos, cores)
├─ Tests (output validation)
└─ Estimated: 2 dias | Owner: Dev 1

Task 2: PDF Generation
├─ HTML → PDF (wkhtmltopdf ou similar)
├─ Async processing (queue)
├─ Email delivery
├─ Archive (Sentry/S3)
└─ Estimated: 2 dias | Owner: Dev 2

Task 3: Report UI
├─ Form de seleção (tipo, período)
├─ Download button
├─ Email report option
└─ Estimated: 1 dia | Owner: Frontend
```

**Deliverables:**
- [x] PDF gerado com qualidade profissional
- [x] Async job queue implementado
- [x] Email delivery funcionando

**Acceptance:**
- [ ] Solicitar relatório
- [ ] Download PDF
- [ ] Ver no dashboard
- [ ] Receber por email (opcional)

---

## SEMANA 15-16: FASE 9 — IA INTEGRATION

### Sprint 9.1: RAG + Prompt Versioning

**Goal:** IA fornecendo análises contextualizadas

**Tasks:**
```
Task 1: RAG Setup
├─ Coletar documentos (NR-1, CFP, etc.)
├─ Criar embeddings (OpenAI API)
├─ Vector DB (Pinecone/Weaviate)
├─ Retrieval pipeline
└─ Estimated: 2 dias | Owner: ML Dev

Task 2: Prompt Versioning
├─ Prompt model (versão, autor, status)
├─ Prompt management UI
├─ Rollback capability
├─ Tests
└─ Estimated: 1 dia | Owner: Dev 1

Task 3: Risk Analyzer Agent
├─ Input: agregated data
├─ Output: análise estruturada
├─ Confidence scoring
├─ Audit logging
└─ Estimated: 2 dias | Owner: ML Dev
```

**Deliverables:**
- [x] RAG pipeline funcionando
- [x] 50+ documentos indexados
- [x] IA análise gerando insights

**Acceptance:**
- [ ] Executar análise IA
- [ ] Ver recomendações com confiança
- [ ] Ver fontes citadas
- [ ] Revisar análise (aprove/edite/rejeite)

---

### Sprint 9.2: Safety & Human Review

**Goal:** IA segura e responsável

**Tasks:**
```
Task 1: AI Guardrails
├─ Prompt injection detection
├─ Output validation (não diagnóstico individual)
├─ Blocked patterns (conforme 6.3 PRD)
├─ Tests (conforme seção 6.3 do checklist)
└─ Estimated: 1 dia | Owner: Security Dev

Task 2: Human Review Workflow
├─ UI para revisor (approve/edit/reject)
├─ Feedback loop (treinar model?)
├─ Decision logging
└─ Estimated: 1 dia | Owner: Frontend

Task 3: IA Cost Control
├─ Token usage tracking
├─ Cost per tenant
├─ Alerts if exceeded
└─ Estimated: 0.5 dia | Owner: Dev
```

**Deliverables:**
- [x] Guardrails bloqueando prompts proibidos
- [x] Human review UI
- [x] Cost tracking

**Acceptance:**
- [ ] Tentar prompt injection → bloqueado
- [ ] IA análise correta → aprovar
- [ ] IA análise errada → editar + salvar

---

## SEMANA 17-18: FASE 10-11 — LGPD + SST

### Sprint 10.1: LGPD Compliance

**Goal:** Conformidade com lei de dados

**Tasks:**
```
Task 1: Privacy Center
├─ User data export (JSON/CSV)
├─ Deletion request workflow
├─ Access history
├─ Consent management
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 1

Task 2: Retention Policy
├─ Automated cleanup job
├─ Data retention rules (por tipo)
├─ Soft delete + hard delete
└─ Estimated: 1 dia | Owner: DevOps

Task 3: Compliance UI
├─ Privacy center accessible
├─ Consent banner (assessments)
├─ Legal documents (privacy, terms)
└─ Estimated: 1 dia | Owner: Frontend
```

**Deliverables:**
- [x] Privacy center online
- [x] LGPD policy documented
- [ ] DPA template pronto (legal review)

**Acceptance:**
- [ ] User exporta dados
- [ ] User deleta conta
- [ ] Consentimento solicitado antes de assessment
- [ ] 30 dias após deletar, conta removida

---

### Sprint 11.1: SST Portal

**Goal:** Consultorias gerenciando múltiplos clientes

**Tasks:**
```
Task 1: Multi-Company View
├─ SST vê todas as empresas clientes
├─ Filtros + busca
├─ Gestão de acesso
├─ Tests
└─ Estimated: 1.5 dia | Owner: Dev 1

Task 2: White-Label Config
├─ Customização por SST (logo, cores, domínio)
├─ Branding customizado
├─ Email templates
└─ Estimated: 1.5 dia | Owner: Frontend

Task 3: SST Billing
├─ Dashboard de faturamento
├─ Per-company usage
├─ Invoice management
└─ Estimated: 1 dia | Owner: Dev 2
```

**Deliverables:**
- [x] SST pode gerenciar 10+ clientes
- [x] White-label funcional
- [x] Billing dashboard

**Acceptance:**
- [ ] SST vê todas as empresas
- [ ] SST customiza branding
- [ ] Ver faturamento por cliente

---

## SEMANA 19: FASE 12 — BILLING

### Sprint 12.1: Subscription Management

**Goal:** Cobrança automática

**Tasks:**
```
Task 1: Stripe Integration
├─ Stripe API setup
├─ Webhook handling
├─ Subscription creation/update/cancel
├─ Tests
└─ Estimated: 2 dias | Owner: Dev 1

Task 2: Subscription Workflow
├─ Plano selection (STARTER/PRO/ENTERPRISE)
├─ Payment method
├─ Billing cycles
├─ Dunning (retry failed payments)
└─ Estimated: 1 dia | Owner: Dev 2

Task 3: Invoice & Billing UI
├─ Billing dashboard (organization)
├─ Invoice history
├─ Download invoices
├─ Self-serve cancellation
└─ Estimated: 1 dia | Owner: Frontend
```

**Deliverables:**
- [x] Stripe conectado
- [x] Cobranças recorrentes
- [x] Invoices geradas

**Acceptance:**
- [ ] Escolher plano
- [ ] Inserir cartão
- [ ] Cobrado mensalmente
- [ ] Ver invoices

---

## SEMANA 20-21: FASE 13 — LAUNCH

### Sprint 13.1: Quality Assurance

**Goal:** Sistema pronto para produção

**Tasks:**
```
Task 1: Testing & QA
├─ E2E testing completo
├─ Penetration testing (contratado)
├─ Load testing (1000+ concurrent)
├─ Browser compatibility
└─ Estimated: 2 dias | Owner: QA Lead

Task 2: Documentation
├─ API docs (OpenAPI completo)
├─ User guide (vídeos + texto)
├─ Admin guide
├─ Troubleshooting
└─ Estimated: 1.5 dia | Owner: Tech Writer

Task 3: Hardening
├─ Security headers
├─ Rate limiting
├─ DDoS protection (CloudFlare)
├─ SSL/TLS configuration
└─ Estimated: 1 dia | Owner: Security Dev
```

**Deliverables:**
- [x] 0 bloqueadores críticos
- [x] Documentação completa
- [x] Performance benchmarks

**Acceptance:**
- [ ] Todos testes passam
- [ ] Penetration test report ✅
- [ ] Load test OK (p95 < 500ms)

---

### Sprint 13.2: Beta & Go-Live

**Goal:** Produto em mãos de clientes reais

**Tasks:**
```
Task 1: Beta Testing
├─ 2-3 SSTs piloto
├─ 3-5 Empresas piloto
├─ Feedback collection
├─ NPS survey
└─ Estimated: 1 semana

Task 2: Go-Live
├─ Day 1: Soft launch (SSTs piloto)
├─ Day 2-3: Monitor (bugs críticos)
├─ Day 4: Abrir para SSTs
├─ Day 5-7: Empresas diretas
└─ Estimated: 1 semana

Task 3: Post-Launch Support
├─ On-call rotation
├─ Incident response
├─ Customer success calls
└─ Contínuo
```

**Deliverables:**
- [x] Produto em produção
- [x] Clientes pagando
- [x] Support operacional

**Acceptance:**
- [ ] NPS > 40 em beta
- [ ] 0 downtime em go-live
- [ ] 2+ SSTs em produção
- [ ] First paying customer

---

## MÉTRICAS POR SEMANA

```
Semana 1-2:   Infrastructure ✅
Semana 3-6:   Core Features ✅
Semana 7-12:  Main Product ✅
Semana 13-18: Advanced Features (IA, SST, LGPD) ✅
Semana 19:    Billing ✅
Semana 20-21: Quality & Launch ✅

Total: 21 semanas ~= 5 meses de dev + 1 mês buffer = 6 meses
```

---

## MARCOS CRÍTICOS

```
Semana 8:   MVP Mínimo (assessments + respostas + risks)
Semana 14:  MVP Completo (+ relatórios + ações)
Semana 18:  MVP Robusto (+ IA + LGPD + SST)
Semana 21:  Go-Live
```

---

**Versão:** 1.0  
**Status:** Pronto para Execução  
**Data:** Setembro 2026
