# WorkflowAI Integration Guide

## Visão geral

A aplicação web do Music Genie usa o WorkflowAI para gerar prompts, playlists e artes de capa diretamente a partir da camada Next.js. Toda a comunicação acontece através do SDK oficial `@workflowai/workflowai`, e os serviços do app encapsulam as chamadas para manter um ponto único de configuração e de logs.

## Principais módulos

### `src/services/workflowai.ts`

- Serviço server-side responsável por enviar requisições HTTP para o endpoint de geração de playlists.
- Normaliza o payload esperado (`task_input`, `version`, `use_cache`) e converte a resposta para o formato interno (`name`, `description`, `tracks`).
- Valida a presença da variável de ambiente `WORKFLOWAI_API_KEY` (com fallback para `NEXT_PUBLIC_WORKFLOWAI_API_KEY` somente para compatibilidade legada).
- Expõe helpers `isConfigured()` e `getStatus()` para superfícies de diagnóstico.

### `src/lib/workflowai/client.ts`

- Instancia o cliente do WorkflowAI com a mesma `WORKFLOWAI_API_KEY`.
- Deve ser importado por módulos que precisam usar os agentes gerenciados pelo WorkflowAI sem repetir configuração.

### `src/lib/workflowai/agents.ts`

- Define os agentes usados pelo app (`playlistPromptAgent`, `playlistGeneratorAgent` e `playlistCoverArtGeneration`).
- Cada agente referencia explicitamente `id`, `schemaId`, `version` e política de cache, mantendo as versões alinhadas com o WorkflowAI Studio.

## Configuração de ambiente

1. Adicione a chave no `.env.local`:
   ```bash
   WORKFLOWAI_API_KEY="sua-chave-workflowai"
   ```
2. Opcionalmente remova `NEXT_PUBLIC_WORKFLOWAI_API_KEY` caso ainda exista; o serviço continuará aceitando-a, mas registrará um aviso incentivando a migração para a variável server-side.
3. Reinicie o servidor de desenvolvimento para garantir que a chave seja recarregada.

## Fluxo de geração de playlists

1. O frontend coleta prompt, seleções guiadas e outras preferências do usuário.
2. A rota/ação server-side utiliza `workflowAIService.generatePlaylist()` para enviar o pedido ao WorkflowAI.
3. A resposta é normalizada e retornada para o cliente junto com metadados (nome, descrição e faixas).
4. Logs úteis (`🎵 …`) são emitidos no servidor para facilitar troubleshooting quando há falha na API externa.

## Boas práticas

- Mantenha os agentes (`agents.ts`) sincronizados com os schemas publicados no WorkflowAI. Mudanças de versão devem ser commitadas junto com o update no Studio.
- Sempre que ajustar escopos de cache ou parâmetros default, atualize esta documentação e os logs emitidos pelo serviço.
- Utilize `isConfigured()` antes de expor o provider em ambientes onde a chave pode não estar presente (por exemplo, deploys de pré-visualização).

## Recursos adicionais

- [WorkflowAI Studio](https://workflowai.com) para gerenciamento de agentes e schemas.
- [SDK `@workflowai/workflowai`](https://www.npmjs.com/package/@workflowai/workflowai) para detalhes de uso avançado.
