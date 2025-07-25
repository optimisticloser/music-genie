# Music Genie 🎵

Uma aplicação web que usa IA para gerar playlists personalizadas e salvá-las diretamente no Spotify.

## 🚀 Funcionalidades

- **Geração de Playlists com IA**: Use prompts naturais ou seleções guiadas para criar playlists
- **Integração com Spotify**: Salve playlists diretamente na sua conta do Spotify
- **Interface Híbrida**: Combine seleções predefinidas com texto livre
- **Versionamento**: Crie múltiplas versões de uma playlist
- **Histórico**: Acesse todas as suas playlists geradas

## 🛠️ Configuração

### 1. Clone o repositório

```bash
git clone <repository-url>
cd music-genie
npm install
```

### 2. Configure o Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute as migrações do banco:
   ```bash
   # No dashboard do Supabase, vá para SQL Editor e execute:
   # supabase/migrations/001_initial_schema.sql
   # supabase/migrations/002_demo_prompts.sql
   ```
4. Copie as credenciais do projeto (Settings > API)

### 3. Configure o Spotify

1. Acesse [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crie uma nova aplicação
3. Configure as URLs de redirecionamento:
   - `http://localhost:3000/api/auth/spotify/callback` (desenvolvimento)
   - `https://yourdomain.com/api/auth/spotify/callback` (produção)
4. Copie o Client ID e Client Secret

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Spotify
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
SPOTIFY_REDIRECT_URI="http://localhost:3000/api/auth/spotify/callback"

# WorkflowAI (opcional)
WORKFLOWAI_API_KEY="your-workflowai-api-key"
```

### 5. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📱 Como usar

1. **Faça login** com sua conta
2. **Conecte o Spotify** clicando no botão "Conectar Spotify"
3. **Gere uma playlist**:
   - Selecione categorias (Gênero, Humor, Época, etc.)
   - Adicione texto livre
   - Clique em "Gerar com IA"
4. **Salve no Spotify** clicando em "Save to Spotify"

## 🏗️ Arquitetura

- **Frontend**: Next.js 14 com App Router
- **Backend**: API Routes do Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **IA**: WorkflowAI (alternativa ao OpenAI)
- **UI**: Tailwind CSS + shadcn/ui

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   └── dashboard/         # Interface principal
├── components/            # Componentes React
├── lib/                   # Utilitários e serviços
│   ├── spotify/           # Integração com Spotify
│   ├── supabase/          # Cliente Supabase
│   └── workflowai/        # Integração com WorkflowAI
└── types/                 # Definições TypeScript
```

## 🔧 Desenvolvimento

### Comandos úteis

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar linting
npm run lint
```

### Adicionar componentes UI

```bash
npx shadcn-ui@latest add [component-name]
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Confirme se o Spotify OAuth está configurado corretamente
3. Verifique os logs do console para erros
4. Abra uma issue no GitHub

---

Feito com ❤️ usando Next.js, Supabase e Spotify API
# Force new deployment
