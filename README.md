# Music Genie 🎵

**Gerador de Playlists com Inteligência Artificial**

Uma aplicação web moderna que utiliza IA avançada para criar playlists personalizadas baseadas no seu gosto musical e salvá-las diretamente no Spotify. Descubra novas músicas e artistas através de prompts naturais ou seleções guiadas.

## 🚀 Funcionalidades

- **Geração de Playlists com IA**: Use prompts naturais ou seleções guiadas para criar playlists
- **Integração com Spotify**: Salve playlists diretamente na sua conta do Spotify
- **Interface Híbrida**: Combine seleções predefinidas com texto livre
- **Versionamento**: Crie múltiplas versões de uma playlist
- **Histórico**: Acesse todas as suas playlists geradas

## 🛠️ Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/optimisticloser/music-genie.git
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

### 🎯 Passo a Passo

1. **Crie sua conta** ou faça login
2. **Conecte o Spotify** para acessar sua biblioteca
3. **Gere playlists personalizadas**:
   - Escolha categorias (Gênero, Humor, Época, Ocasião)
   - Adicione descrições em texto livre
   - Combine seleções predefinidas com suas preferências
   - Clique em "Gerar com IA"
4. **Salve no Spotify** com um clique
5. **Explore suas playlists** no histórico
6. **Marque como favoritas** suas criações preferidas

### 🎨 Recursos Avançados

- **Preview de áudio** das músicas antes de salvar
- **Capas dos álbuns** para identificação visual
- **Atualização automática** de imagens e previews
- **Interface responsiva** para desktop e mobile

## 🏗️ Arquitetura

### 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14 com App Router e TypeScript
- **Backend**: API Routes do Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **IA**: WorkflowAI (integração avançada com IA)
- **UI/UX**: Tailwind CSS + shadcn/ui
- **Deploy**: Vercel (otimizado para Next.js)

### 🔧 Integrações

- **Spotify Web API**: Para busca de músicas e criação de playlists
- **Supabase**: Banco de dados, autenticação e armazenamento
- **WorkflowAI**: Processamento de linguagem natural para geração de playlists

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

1. **Conecte seu repositório** ao Vercel
2. **Configure as variáveis de ambiente** (veja seção de configuração)
3. **Deploy automático** a cada push para a branch main
4. **Domínio personalizado** (opcional)

### Outras plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contribuindo

Agradecemos seu interesse em contribuir com o Music Genie! 

### Como contribuir

1. **Fork o projeto** no GitHub
2. **Crie uma branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit suas mudanças** (`git commit -m 'Add some AmazingFeature'`)
4. **Push para a branch** (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request** com descrição detalhada

### Diretrizes

- Mantenha o código limpo e bem documentado
- Siga os padrões de TypeScript e ESLint
- Teste suas mudanças antes de submeter
- Adicione testes quando apropriado

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

### Problemas Comuns

Se você encontrar algum problema ou tiver dúvidas:

1. **Verifique as variáveis de ambiente** estão configuradas corretamente
2. **Confirme a configuração do Spotify OAuth** no Developer Dashboard
3. **Verifique os logs do console** para identificar erros específicos
4. **Teste a conexão com Supabase** e Spotify separadamente

### Como obter ajuda

- 📧 **Email**: support@musicgenie.app
- 🐛 **Issues**: [GitHub Issues](https://github.com/optimisticloser/music-genie/issues)
- 📖 **Documentação**: [Wiki do projeto](https://github.com/optimisticloser/music-genie/wiki)
- 💬 **Discord**: [Servidor da comunidade](https://discord.gg/musicgenie)

---

## 🌟 Agradecimentos

- **Spotify** pela API incrível
- **Supabase** pela infraestrutura robusta
- **WorkflowAI** pela tecnologia de IA
- **Vercel** pela plataforma de deploy
- **Comunidade open source** por todas as contribuições

---

**Feito com ❤️ pela equipe Music Genie**

*Transformando a forma como você descobre música através da inteligência artificial*
