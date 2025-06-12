# Local Setup Walkthrough

This guide stitches together README, Supabase and shadcn instructions into a linear flow.

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourname/music-genie.git
   cd music-genie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate shadcn components** (optional first run)
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui add button
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # paste keys following docs/supabase-setup.md
   ```

5. **Run Supabase locally (optional)**
   ```bash
   supabase start
   ```

6. **Start dev server**
   ```bash
   npm run dev
   ```

7. **Lint & test**
   ```bash
   npm run lint
   npm run test   # if you add Vitest/Playwright
   ```

8. **Next steps**
   • Build something amazing ✨ 