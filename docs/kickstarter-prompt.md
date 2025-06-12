# Music Genie: The Perfect Kickstarter Prompt

This file contains the ideal prompt to give an AI assistant (like Cursor) in a new, empty project folder to scaffold the entire "Music Genie" web application.

---

### The Prompt

```markdown
Hello! Let's kickstart the "Music Genie" web application.

Your goal is to scaffold the entire project structure based on a set of pre-defined plans and rules. Please follow this multi-phase plan precisely.

**Context & Plans:**
Before you begin, I will provide you with the contents of several critical planning documents. You must read and internalize them first. They are:
1.  `docs/architecture.md`
2.  `docs/user-flow.md`
3.  `docs/sitemap.md`
4.  `docs/ai-prompt-generator.md`

*(User would paste the content of the project's doc files here)*

Now, execute the following plan:

**Phase 1: Project & Documentation Setup**
1.  Scaffold a new Next.js 14 project in the current directory using the command: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2.  Install the necessary dependencies: `npm install @supabase/supabase-js class-variance-authority tailwind-merge tailwindcss-animate @radix-ui/react-icons lucide-react zod`
3.  Initialize `shadcn/ui` with the recommended settings (Default style, `./src/app/globals.css`, component alias `@/components/ui`).
4.  Create a `docs/rules` directory. Inside it, create three files (`001-project-setup.md`, `002-architecture-and-structure.md`, `003-coding-style-and-patterns.md`) with the content I've outlined for the project.
5.  Create a `.env.example` file with placeholders for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SPOTIFY_CLIENT_ID`/`SECRET`.

**Phase 2: Core Directory & File Structure**
1.  Create the following directories: `src/features`, `src/lib`, `src/types`, `src/components/shared`, `src/features/auth`, `src/features/playlist/components`, `src/features/history`, `src/features/settings`, `src/lib/supabase`, `src/lib/spotify`.
2.  Create a `src/types/index.ts` file.

**Phase 3: Core Logic & Types**
1.  Based on the schema in `docs/architecture.md`, populate `src/types/index.ts` with TypeScript interfaces for `PlaylistLineage`, `Playlist`, and `PlaylistTrack`.
2.  Create placeholder files: `src/lib/supabase/client.ts`, `src/lib/spotify/api.ts`, and `src/lib/utils.ts`.

**Phase 4: Page & Layout Scaffolding**
1.  Create the main application layout file at `src/app/(dashboard)/layout.tsx`.
2.  Create placeholder page files: `src/app/(dashboard)/page.tsx` (the main generator page), `src/app/(dashboard)/history/page.tsx`, and `src/app/(dashboard)/settings/page.tsx`.

**Phase 5: Component Scaffolding**
1.  Use the `shadcn-ui` CLI to add the following components: `button`, `input`, `card`, `dialog`.
2.  Create a placeholder file for the main generator UI component: `src/features/playlist/components/PlaylistGenerator.tsx`.

Please proceed step-by-step and confirm upon completion of each phase.
```

### The To-Do List (Checklist version)

This is the step-by-step plan that the prompt instructs the AI to follow.

-   [ ] **Phase 1: Project & Documentation Setup**
    -   [ ] Execute the Next.js scaffolding command.
    -   [ ] Install all required dependencies.
    -   [ ] Initialize `shadcn/ui`.
    -   [ ] Create the `docs/rules` directory and populate it with the three rule files.
    -   [ ] Create the `.env.example` file.

-   [ ] **Phase 2: Core Directory & File Structure**
    -   [ ] Create the main source folders: `src/app`, `src/components`, `src/features`, `src/lib`, `src/types`.
    -   [ ] Create sub-folders inside `components`: `ui` and `shared`.
    -   [ ] Create sub-folders inside `features`: `auth`, `playlist`, `history`, `settings`.
    -   [ ] Create sub-folders inside `lib`: `supabase`, `spotify`.
    -   [ ] Create an empty `index.ts` file in `src/types`.

-   [ ] **Phase 3: Core Logic & Types**
    -   [ ] Populate `src/types/index.ts` with placeholder interfaces for `Playlist`, `PlaylistLineage`, `Track`, and `StreamingServiceSongStatus`.
    -   [ ] Create placeholder files for services in `src/lib`: `supabase/client.ts`, `spotify/api.ts`, and `spotify/enrichment-service.ts`.
    -   [ ] Create a `src/lib/utils.ts` file for the `cn` helper function required by shadcn/ui.

-   [ ] **Phase 4: Page & Layout Scaffolding**
    -   [ ] Modify the root `src/app/layout.tsx` and `src/app/page.tsx` to be basic placeholders.
    -   [ ] Create the main application layout in `src/app/(dashboard)/layout.tsx`.
    -   [ ] Create placeholder pages for `dashboard`, `history`, and `settings`.

-   [ ] **Phase 5: Component Scaffolding**
    -   [ ] Generate core `shadcn/ui` components needed for the UI: `button`, `input`, `card`, `dialog`.
    -   [ ] Create placeholder files for shared components like `PageHeader.tsx` and `SiteFooter.tsx` in `src/components/shared`.
    -   [ ] Create a placeholder for the main generator UI component in `src/features/playlist/components/PlaylistGenerator.tsx`.

</rewritten_file> 