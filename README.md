# PSICO360

**Plataforma SaaS de Inteligência e Gestão de Riscos Psicossociais**

---

## ⚠️ Documento vigente

A especificação em vigor é
[`docs/superpowers/specs/2026-09-03-psico360-piloto-design.md`](docs/superpowers/specs/2026-09-03-psico360-piloto-design.md).

Ela **substitui** as premissas de prazo, escopo, precificação e metodologia dos arquivos `01`
a `05` abaixo, que permanecem no repositório como registro histórico. Correções principais:

- O prazo regulatório assumido (maio de 2025) está desatualizado. A fiscalização punitiva
  começou em **26 de maio de 2026** e está ativa.
- O roadmap de 21 semanas foi dimensionado para uma equipe de seis pessoas e não descreve a
  realidade de execução deste projeto.
- Instrumento, anonimato, limiares de risco e canal de denúncia foram redefinidos.

Leia a especificação antes dos documentos históricos.

---

## 📋 Documentação Completa

Todos os arquivos de análise, especificação técnica, guia de implementação e roadmap estão nesta pasta:

1. **01_ANALISE_MERCADO_COMPLETA.md**
   - Validação de demanda e oportunidade de mercado
   - TAM calculado: R$ 100-200M em 3-4 anos
   - Análise de competição
   - Viabilidade: **VERDE para desenvolvimento**

2. **02_PRD_TECNICO_REFINADO.md**
   - Especificação técnica completa
   - Arquitetura de sistema
   - Workflows críticos
   - Requisitos de segurança e IA

3. **03_GUIA_IMPLEMENTACAO.md**
   - Guia prático para desenvolvimento
   - Checklist pré-desenvolvimento
   - Definition of Done
   - Milestones críticos

4. **04_CHECKLIST_SEGURANCA.md**
   - 10 seções de segurança e compliance
   - Testes automatizados (código incluído)
   - Validações obrigatórias
   - Performance targets

5. **05_ROADMAP_SPRINTS.md**
   - Timeline de 21 semanas (6 meses)
   - 13 fases de desenvolvimento
   - Dependências entre sprints
   - Beta testing e go-live

---

## 🚀 Próximos Passos

### Para Dev Lead
1. Revisar **02_PRD_TECNICO_REFINADO.md** (especificação)
2. Revisar **05_ROADMAP_SPRINTS.md** (timeline)
3. Confirmar team capacity para 6 meses

### Para Product
1. Revisar **01_ANALISE_MERCADO_COMPLETA.md** (validação)
2. Revisar **02_PRD_TECNICO_REFINADO.md** (arquitetura)
3. Coordenar com dev leads

### Para QA
1. Revisar **04_CHECKLIST_SEGURANCA.md** (testes)
2. Preparar test cases para cada fase
3. Configurar CI/CD pipeline

---

## 📊 Status

- **Mercado:** Validado ✅
- **Especificação:** Completa ✅
- **Roadmap:** 21 semanas definido ✅
- **Segurança:** Checklist criado ✅
- **MVP:** Fases 0-8 (13 semanas)
- **Go-Live:** Fase 13 (semana 21)

---

## 💼 Modelo de Negócio

- **Tipo:** SaaS B2B2B
- **Público Primário:** Consultorias SST (Segurança e Saúde do Trabalho)
- **Público Secundário:** Empresas 50+ pessoas
- **Pricing:** R$ 300-1.500/mês (3 planos)
- **TAM Ano 1:** R$ 10-15M | Ano 3: R$ 100-130M

---

## 🔐 Segurança

- Tenant isolation (obrigatório Fase 0)
- LGPD compliance (Fase 10)
- IA guardrails (Fase 9)
- Audit logging em todos os endpoints
- Penetration testing antes de launch

---

## 📞 Contato

Arquivo criado: Setembro 2026
Versão: 1.0
Status: Pronto para Desenvolvimento

---

**Próximo passo:** Plano de implementação do piloto, a partir da especificação vigente.
