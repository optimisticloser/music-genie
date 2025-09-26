# AGENTS.md

## 👋 Propósito

Este arquivo guia **agentes** (Codex/LLMs/CLI) e pessoas sobre **como trabalhar neste repositório** de forma consistente, segura e pronta para deploy no **Vercel**.

---

## 🔧 Como o agente deve agir neste repo (regras objetivas)

1. **Sempre** usar os scripts documentados abaixo; não inventar comandos.
2. Antes de sugerir mudanças grandes, propor um **plano incremental** (commits pequenos).
3. **Não** incluir credenciais; usar `.env` (ver seção Ambiente).
4. Executar local: `install → lint → typecheck → test → build` **nessa ordem**.
5. Ao abrir PR, **anexar saída** dos comandos-chave (ver PR Gate).
6. Em caso de erro no Vercel, seguir o **Runbook de Falhas** abaixo e **anexar logs**.

---

## 🧱 Stack & Estrutura

- **Runtime:** Node 20 LTS
- **Package manager:** `npm`
- **Build tool:** Next.js 15.3.3
- **Hospedagem:** Vercel (produção)
- **Estrutura:**
  - `src/app` – app principal (Next.js App Router)
  - `src/components` – componentes React (UI, layout, features)
  - `src/lib` – utilitários, configurações e serviços
  - `src/features` – funcionalidades organizadas por domínio
  - `src/hooks` – hooks customizados
  - `src/types` – definições TypeScript
  - `supabase/` – migrações e configurações do banco
  - `public/` – assets estáticos

---

## ▶️ Comandos Oficiais (caminho feliz)

> O agente **deve usar exatamente** estes comandos.

### Instalação

```bash
npm install
```

### Desenvolvimento local

```bash
# App principal (Next.js)
npm run dev
```

### Qualidade

```bash
npm run lint
# TypeScript check (via Next.js)
npx tsc --noEmit
# Testes (quando implementados)
npm test
```

### Build

```bash
npm run build
```

### Produção

```bash
npm start
```

---

## 🔐 Ambiente & Variáveis (.env)

> Nunca comitar `.env`. Manter um `.env.sample` com chaves **sem valores**.

**Mínimo esperado (baseado no .env.example):**

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Spotify API Configuration
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=

# WorkflowAI Configuration
WORKFLOWAI_API_KEY=

# Next.js Configuration
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Vercel Configuration (automático no Vercel)
VERCEL_ENV=
```

**Regras:**

- Para desenvolvimento local, copiar `.env.example` → `.env.local` e preencher.
- No Vercel, configurar as mesmas chaves em **Project Settings → Environment Variables**.
- O agente **valida** a presença das variáveis antes de buildar.

---

## 🚦 PR Gate (bloqueios antes de aprovar)

Para aprovar um PR, **tudo abaixo precisa passar** (o autor do PR cola os trechos de saída):

1. **Instalação**
   - `npm install` → sem erros
2. **Lint**
   - `npm run lint` → 0 erros (avisos tolerados se justificados)
3. **Typecheck**
   - `npx tsc --noEmit` → 0 erros
4. **Testes**
   - `npm test` → todos verdes (quando implementados)
5. **Build**
   - `npm run build` → sem erros
6. **Diff pequeno e descritivo**
   - Commits atômicos com Conventional Commits (`feat:`, `fix:`, `chore:`, …)

> ⚠️ LARGE CHANGE ALERT: se a mudança tocar em build tooling, env ou roteamento, **exigir** plano de rollback simples (2–3 passos).

---

## 🚀 Deploy no Vercel (produção)

- **Fluxo:** `merge na branch main` → **Vercel** cria **deployment** → promoção automática para **Production** (se configurado).
- **Regions/Edge:** usar **region padrão** a menos que especificado.
- **Build Command:** `npm run build`
- **Output (Next.js):** `.next`
- **Env no Vercel:** replicar `.env.example` (sem valores) e preencher no painel.

**Checklist antes do merge:**

-

---

## 🧭 Runbook de Falhas (pós-merge / Vercel)

Quando ocorrer erro de deploy/execução:

1. **Abrir Deployment** no Vercel → aba **“Functions/Logs”**
2. **Coletar logs** relevantes e **colar** no relatório de erro com este formato:

```
# Relatório de Erro - Vercel
- URL do deployment:
- Timestamp (UTC):
- Stack (Node/Next/etc):
- Rota/Recurso afetado:
- Log/Stacktrace (curto, com 1–3 blocos):
- Suspeita inicial (1 frase):
- Alterações do PR que podem ter causado:
```

3. **Classificar erro**:
   - Build-time (falta de env, imports, TS) → rodar `pnpm build` local e comparar
   - Run-time (API 500, edge/region, timeouts) → reproduzir local com `pnpm dev`, checar env/rotas
4. **Correção incremental**:
   - Criar branch `fix/<curto-contexto>`
   - Ajustar 1 coisa por commit (pequenos)
   - Repetir PR Gate; só então abrir PR

> 🔴 HIGH RISK MODIFICATION: se envolver **migrar** variáveis de ambiente, **renomear** rotas, **trocar** adaptador (edge/node), **pausar** e pedir revisão.

---

## 🧪 Testes & Cobertura (essencial para handoff)

- Framework: **Jest/Vitest** (quando implementado)
- Rodar rápido: `npm test`
- Snapshot updates (se aplicável): `npm test -- -u`
- Meta simples: cobertura crítica para **utils** e **APIs sensíveis**.

---

## 🧭 Estilo & Convenções

- ESLint + Prettier (configs na raiz)
- TypeScript estrito em apps/produção
- Commits: Conventional Commits
- Componentes React: funções puras, sem side-effects (exceto hooks)

---

## 🧩 Estrutura do Projeto Music Genie

- **App principal:** Next.js com App Router em `src/app/`
- **Componentes:** Organizados por domínio em `src/components/`
- **Features:** Funcionalidades em `src/features/` (auth, playlist, settings, history)
- **Serviços:** Integrações externas em `src/lib/services/` (Spotify, WorkflowAI)
- **Database:** Supabase com migrações em `supabase/migrations/`
- **UI:** shadcn/ui + Tailwind CSS + Magic UI

---

## 📎 Template de PR (copiar para `.github/pull_request_template.md`)

```
## Contexto
Breve descrição do problema/feature.

## O que foi feito
- [ ] Mudança 1
- [ ] Mudança 2

## Como testar
Passo-a-passo, incluindo rotas/URLs.

## Logs (PR Gate)
- `npm run lint`: [colar resumo]
- `npx tsc --noEmit`: [colar resumo]
- `npm test`: [colar resumo]
- `npm run build`: [colar resumo]

## Risco
- [ ] Baixo
- [ ] Médio
- [ ] Alto (⚠️ descreva rollback)

## Checklist
- [ ] Atualizei `.env.example` se necessário
- [ ] Documentei breaking changes
```

---

## 🤖 Prompt de arranque para agentes (opcional)

> Cole isto quando chamar o Codex/LLM:

> “Você é um agente de manutenção deste repo. Siga **estritamente** o `AGENTS.md`.
>
> 1. Planeje mudanças em **passos pequenos**.
> 2. Use **somente** os comandos oficiais.
> 3. Antes de abrir PR, rode **lint/typecheck/test/build** e cole os resultados.
> 4. Se o deploy no Vercel falhar, gere o **Relatório de Erro** no formato do Runbook e proponha **uma** correção por PR.”

