# Rule: Project Setup & Dependencies

1.  **Scaffolding**: The project must be initialized using Next.js 14+ with the App Router. Use the following command:
    `npx create-next-app@latest music-genie --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`

2.  **Core Dependencies**: Immediately after scaffolding, install the necessary libraries for UI, state, and database interaction:
    `npm install @supabase/supabase-js class-variance-authority tailwind-merge tailwindcss-animate @radix-ui/react-icons lucide-react`

3.  **UI Library**: Initialize `shadcn/ui` using its CLI. Set up `globals.css`, use the `default` style, and configure the component alias to `@/components/ui`.

4.  **Environment Variables**: Create a `.env.local` file by copying `.env.example`. This file should contain placeholders for Supabase and Spotify keys. 