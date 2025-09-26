# WorkflowAI Integration Guide

## Visão geral

A aplicação web do Music Genie usa o WorkflowAI para gerar prompts, playlists e artes de capa diretamente a partir da camada Next.js. A implementação atual usa uma camada de serviço leve que realiza requisições HTTP diretas com `fetch`, substituindo o uso anterior do SDK `@workflowai/workflowai`. Os serviços do app encapsulam as chamadas para manter um ponto único de configuração e de logs.

## Principais módulos

### `src/services/workflowai.ts`

- Serviço server-side responsável por enviar requisições HTTP para o endpoint de geração de playlists.
- Normaliza o payload esperado (`task_input`, `version`, `use_cache`) e converte a resposta para o formato interno (`name`, `description`, `tracks`).
- Valida a presença da variável de ambiente `WORKFLOWAI_API_KEY` (com fallback para `NEXT_PUBLIC_WORKFLOWAI_API_KEY` somente para compatibilidade legada).
- Expõe helpers `isConfigured()` e `getStatus()` para superfícies de diagnóstico.

### `src/lib/workflowai/client.ts`

- Instancia o cliente do WorkflowAI com a mesma `WORKFLOWAI_API_KEY`.
- Deve ser importado por módulos que precisam usar os agentes gerenciados pelo WorkflowAI sem repetir configuração.

### Core Pieces

- **Service layer** – `workflowAIService` exposes a `generatePlaylist` helper for playlist prompts and wraps configuration checks.
- **Consumers** – API routes or React components import the service to request playlists and handle the transformed response payloads.
- **Configuration** – Environment variables (e.g., `NEXT_PUBLIC_WORKFLOWAI_API_KEY`) determine whether the WorkflowAI option is available.

This structure keeps the integration small and testable while making it easy to swap providers if needed.

### `src/lib/workflowai/agents.ts`

- Define os agentes usados pelo app (`playlistPromptAgent`, `playlistGeneratorAgent` e `playlistCoverArtGeneration`).
- Cada agente referencia explicitamente `id`, `schemaId`, `version` e política de cache, mantendo as versões alinhadas com o WorkflowAI Studio.

### WorkflowAI Service

**File**: `src/services/workflowai.ts`

The `workflowAIService` encapsulates the direct integration with WorkflowAI's REST API. Key responsibilities include:

- Constructing the request body with `task_input.prompt`, `version`, and `use_cache` options.
- Performing a `fetch` call against `https://run.workflowai.com/v1/@sergiowpfmecom/tasks/playlist-generator/schemas/1/run` with the appropriate headers.
- Logging request/response metadata for debugging purposes.
- Normalizing the API response into the application's `PlaylistGenerationResult` shape.
- Surfacing configuration helpers such as `isConfigured()` and `getStatus()`.

Consult the service class for the full implementation, including TypeScript interfaces describing request and response payloads.

### Example Usage

```ts
import { workflowAIService } from "@/services/workflowai";

const playlist = await workflowAIService.generatePlaylist(prompt, {
  version: "dev",
  useCache: "auto",
});
```

The returned object contains the playlist name, description, and normalized song metadata ready to pass to UI components or persistence layers.

## WorkflowAI API Integration

### Endpoint Configuration

```
POST /v1/@sergiowpfmecom/tasks/playlist-generator/schemas/1/run
Host: https://run.workflowai.com
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

### Request Format

```json
{
  "task_input": {
    "prompt": "Your playlist prompt here"
  },
  "version": "dev",
  "use_cache": "auto"
}
```

### Response Format

```json
{
  "task_output": {
    "name": "Playlist Name",
    "essay": "Playlist description...",
    "songs": [
      {
        "title": "Song Title",
        "artist": "Artist Name"
      }
    ]
  }
}
```

### Cache Options

- `"auto"` (default): Uses cache if temperature is 0 and previous run exists.
- `"always"`: Always uses cached output when available.
- `"never"`: Never uses cache.

## Configuração de ambiente

1. Adicione a chave no `.env.local`:
   ```bash
   WORKFLOWAI_API_KEY="sua-chave-workflowai"
   # ou para compatibilidade legada:
   NEXT_PUBLIC_WORKFLOWAI_API_KEY="sua-chave-workflowai"
   ```
2. Reinicie o servidor de desenvolvimento para garantir que a chave seja recarregada.

## Fluxo de geração de playlists

1. O frontend coleta prompt, seleções guiadas e outras preferências do usuário.
2. A rota/ação server-side utiliza `workflowAIService.generatePlaylist()` para enviar o pedido ao WorkflowAI.
3. A resposta é normalizada e retornada para o cliente junto com metadados (nome, descrição e faixas).
4. Logs úteis (`🎵 …`) são emitidos no servidor para facilitar troubleshooting quando há falha na API externa.

## Boas práticas

- Mantenha os agentes (`agents.ts`) sincronizados com os schemas publicados no WorkflowAI. Mudanças de versão devem ser commitadas junto com o update no Studio.
- Sempre que ajustar escopos de cache ou parâmetros default, atualize esta documentação e os logs emitidos pelo serviço.
- Utilize `isConfigured()` antes de expor o provider em ambientes onde a chave pode não estar presente (por exemplo, deploys de pré-visualização).

## Benefits of WorkflowAI Integration

1. **Centralized Prompt Management** – Prompt templates can be iterated on server-side without client updates.
2. **Provider Flexibility** – Seamless switching between AI models for cost and performance optimization.
3. **Enhanced Monitoring** – Access to WorkflowAI's analytics and performance metrics.
4. **Simplified Deployment** – Managed infrastructure, automatic scaling, and built-in caching.

## Troubleshooting

- If requests fail with `WorkflowAI API key is required`, ensure `WORKFLOWAI_API_KEY` or `NEXT_PUBLIC_WORKFLOWAI_API_KEY` is defined in your environment (e.g., `.env.local`).
- Inspect console logs for detailed request/response diagnostics emitted by `workflowAIService`.

## Recursos adicionais

- [WorkflowAI Studio](https://workflowai.com) para gerenciamento de agentes e schemas.
- [SDK `@workflowai/workflowai`](https://www.npmjs.com/package/@workflowai/workflowai) para detalhes de uso avançado.
