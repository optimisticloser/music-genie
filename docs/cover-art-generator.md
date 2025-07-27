# 🎨 Gerador de Capas de Playlist com IA

Este documento descreve a implementação do gerador de capas de playlist usando WorkflowAI para criar imagens personalizadas baseadas no conteúdo e estilo das playlists.

## 📋 Visão Geral

O gerador de capas utiliza um workflow do WorkflowAI que combina:
- **Nome da playlist** - para contexto temático
- **Descrição da playlist** - para entender o mood e estilo
- **Lista de músicas** - para referência artística
- **Preferências de estilo** - para direcionar o design visual
- **Preferências de cor** - para definir a paleta cromática

## 🏗️ Arquitetura

### Componentes Principais

1. **Agente WorkflowAI** (`src/lib/workflowai/agents.ts`)
   - Interface TypeScript para input/output
   - Configuração do agente com cache automático
   - Integração com o tipo `Image` do WorkflowAI

2. **API Route** (`src/app/api/playlist/generate-cover/route.ts`)
   - Endpoint REST para geração de capas
   - Autenticação via Supabase
   - Logging detalhado e tratamento de erros

3. **Componente React** (`src/components/playlist/CoverArtGenerator.tsx`)
   - Interface de usuário para configuração
   - Preview da imagem gerada
   - Exibição de metadados (custo, tempo, modelo)

4. **Página de Teste** (`src/app/test-cover-generator/page.tsx`)
   - Ambiente de desenvolvimento para testes
   - Exemplo com dados pré-preenchidos

## 🔧 Configuração

### 1. Variáveis de Ambiente

Certifique-se de que a chave da API do WorkflowAI está configurada:

```env
WORKFLOWAI_API_KEY="your-workflowai-api-key"
```

### 2. Workflow no WorkflowAI

O workflow deve estar configurado no WorkflowAI com:
- **ID**: `playlist-cover-art-generation`
- **Schema ID**: `1`
- **Version**: `dev`
- **Input Schema**: Campos para nome, descrição, músicas, estilo e cores
- **Output Schema**: Imagem gerada e descrição do design

## 🚀 Como Usar

### Fluxo Automático (Recomendado)

A geração da capa acontece automaticamente após a criação da playlist:

```typescript
// 1. Gerar playlist (a capa será gerada automaticamente)
const response = await fetch("/api/playlist/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Contemporary indie party anthems with energetic vibes"
  })
});

const { playlist, cover_generation_started } = await response.json();

// 2. Verificar status da capa
const coverStatus = await fetch(`/api/playlist/cover-status/${playlist.id}`);
const { has_cover_art, cover_art_url, metadata } = await coverStatus.json();
```

### Geração Manual

```typescript
const response = await fetch("/api/playlist/generate-cover", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    playlist_name: "Contemporary Indie Party Anthems",
    playlist_description: "Energetic indie tracks for parties...",
    song_list: "The Strokes - Reptilia; Franz Ferdinand - Take Me Out...",
    style_preferences: "Bright, energetic, vibrant",
    color_preferences: "Vibrant yellows, energetic oranges, and bright magentas"
  })
});

const { cover_art, design_description, metadata } = await response.json();
```

### Via Componente React

```tsx
<CoverArtGenerator
  playlistName="Contemporary Indie Party Anthems"
  playlistDescription="Energetic indie tracks for parties..."
  songList="The Strokes - Reptilia; Franz Ferdinand - Take Me Out..."
  onCoverGenerated={(coverArt, description) => {
    console.log("Capa gerada:", coverArt.url);
  }}
/>
```

### Via Script de Teste

```bash
npx tsx scripts/test-cover-generation.ts
```

## 📊 Estrutura de Dados

### Input

```typescript
interface PlaylistCoverArtGenerationInput {
  playlist_name?: string;           // Nome da playlist
  playlist_description?: string;    // Descrição detalhada
  song_list?: string;              // Lista de músicas (separadas por ;)
  style_preferences?: string;      // Preferências de estilo visual
  color_preferences?: string;      // Preferências de cor
}
```

### Output

```typescript
interface PlaylistCoverArtGenerationOutput {
  cover_art?: Image;               // Imagem gerada (tipo WorkflowAI)
  design_description?: string;     // Descrição do design criado
}
```

### Metadados

```typescript
interface GenerationMetadata {
  model?: string;                  // Modelo de IA usado
  cost_usd?: number;              // Custo da geração
  duration_seconds?: number;      // Tempo de processamento
}
```

## 🎨 Exemplos de Uso

### 1. Playlist Indie Energética

```json
{
  "playlist_name": "Contemporary Indie Party Anthems",
  "playlist_description": "Energetic indie tracks designed to create the perfect party atmosphere...",
  "song_list": "The Strokes - Reptilia; Franz Ferdinand - Take Me Out; The Black Keys - Lonely Boy",
  "style_preferences": "Bright, energetic, vibrant",
  "color_preferences": "Vibrant yellows, energetic oranges, and bright magentas"
}
```

### 2. Playlist Relaxante

```json
{
  "playlist_name": "Chill Vibes & Coffee",
  "playlist_description": "Relaxing acoustic tracks perfect for coffee shops and quiet moments...",
  "song_list": "Bon Iver - Skinny Love; Iron & Wine - Flightless Bird; Sufjan Stevens - Chicago",
  "style_preferences": "Soft, minimal, peaceful",
  "color_preferences": "Warm earth tones, soft blues, and gentle greens"
}
```

### 3. Playlist Nostálgica

```json
{
  "playlist_name": "90s Alternative Throwback",
  "playlist_description": "Classic alternative rock from the golden era of the 90s...",
  "song_list": "Nirvana - Smells Like Teen Spirit; Pearl Jam - Alive; Soundgarden - Black Hole Sun",
  "style_preferences": "Grunge, vintage, nostalgic",
  "color_preferences": "Dark grays, deep purples, and muted earth tones"
}
```

## 🔍 Monitoramento e Logs

### Logs da API

A API gera logs detalhados para monitoramento:

```
🎨 Starting playlist cover art generation...
📦 Request body received: { playlist_name: "...", ... }
🎨 Generating cover art with input: { ... }
✅ Cover art generated successfully: {
  hasCoverArt: true,
  designDescription: "...",
  model: "dall-e-3",
  cost: 0.0400,
  latency: "12.34"
}
```

### Métricas Importantes

- **Tempo de resposta**: Geralmente 10-30 segundos
- **Custo por geração**: ~$0.02-0.08 dependendo do modelo
- **Taxa de sucesso**: >95% com inputs válidos
- **Qualidade da imagem**: 1024x1024px, alta resolução

## 🛠️ Desenvolvimento

### Adicionando Novos Campos

1. Atualize a interface `PlaylistCoverArtGenerationInput`
2. Modifique o workflow no WorkflowAI
3. Atualize o componente React
4. Teste com diferentes inputs

### Customizando o Estilo

O workflow pode ser ajustado para diferentes estilos:
- **Artístico**: Pinturas, ilustrações
- **Fotográfico**: Fotos realistas
- **Abstrato**: Formas geométricas
- **Minimalista**: Design limpo e simples

### Integração com Spotify

Para integrar com o Spotify, você pode:
1. Usar a capa gerada ao criar playlists
2. Salvar a URL da imagem no banco de dados
3. Exibir a capa personalizada na interface

## 🚨 Troubleshooting

### Erros Comuns

1. **"Unauthorized"**
   - Verifique se o usuário está autenticado
   - Confirme as configurações do Supabase

2. **"Failed to generate cover art"**
   - Verifique a chave da API do WorkflowAI
   - Confirme se o workflow está ativo
   - Verifique os logs para detalhes

3. **"playlist_name is required"**
   - Certifique-se de que o nome da playlist foi fornecido
   - Valide o formato do input

### Debug

Para debug detalhado:

```typescript
// Habilite logs detalhados
console.log("Input:", JSON.stringify(input, null, 2));
console.log("WorkflowAI response:", response);
```

## 🔮 Próximos Passos

### Melhorias Planejadas

1. **Múltiplas variações**: Gerar 3-4 opções de capa
2. **Estilos predefinidos**: Templates para diferentes gêneros
3. **Integração direta**: Usar capas geradas no Spotify
4. **Histórico de capas**: Salvar e reutilizar designs
5. **A/B testing**: Testar diferentes prompts

### Recursos Avançados

1. **Batch generation**: Gerar capas para múltiplas playlists
2. **Customização avançada**: Controle fino sobre estilo e cores
3. **Análise de músicas**: Usar dados das músicas para influenciar o design
4. **Feedback loop**: Aprender com preferências do usuário

## 📚 Referências

- [WorkflowAI Documentation](https://docs.workflowai.com)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth) 