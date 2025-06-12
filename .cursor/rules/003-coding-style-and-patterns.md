# Rule: Coding Style & Patterns

1.  **Server-First Mentality**: Default to using React Server Components (RSCs) for data fetching and rendering static content. Only use client components (`"use client"`) when interactivity is required.

2.  **Responsive Design**: All components, especially in `components/shared`, must be built with responsiveness in mind, using Tailwind CSS utility classes to adapt from mobile to desktop layouts. Use `class-variance-authority` (CVA) for creating component variants.

3.  **Type Safety**:
    *   Enable strict TypeScript mode.
    *   Define all shared, custom types in `src/types/index.ts`. This includes interfaces for `Playlist`, `Song`, and `StreamingServiceSongStatus`.
    *   Use Zod for runtime validation of API route and Server Action inputs.

4.  **State Management**:
    *   For server state and data fetching, use native RSC `async/await` patterns.
    *   For simple client-side UI state, use `useState` or `useReducer`.
    *   For complex global client state, consider a minimal library like Zustand.

5.  **User Experience**: When initiating asynchronous operations (like playlist generation), immediately update the UI to show a loading/placeholder state, as specified in `docs/user-flow.md`. 