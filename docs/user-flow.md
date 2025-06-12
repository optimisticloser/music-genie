# User Flow

> Last updated: 2024-06-12

This document outlines the key user flows for Music Genie, from initial onboarding to core actions like creating and sharing playlists.

---

## 1. New User Onboarding & First Playlist

This flow describes the journey of a brand new user from the landing page to creating their first playlist and saving it to Spotify. This is the primary activation funnel.

```mermaid
graph TD
    A[Visit Landing Page] --> B{Click 'Create Playlist'};
    B --> C[Redirect to /signup];
    C --> D{Sign up with Spotify};
    D --> E[Spotify OAuth Consent Screen];
    E --> F[Redirect back to app];
    F --> G[/dashboard - Welcome!];
    G --> H[Selects prompt components and/or adds custom text];
    H --> I[Click 'Generate'];
    I --> J[UI adds a 'loading' playlist to the list];
    J --> K[AI generates playlist & displays final results];
    K --> L{Review tracks};
    L --> M[Click 'Save to Spotify'];
    M --> N[Show success confirmation with link];
```

---

## 2. Returning User - Creating a New Playlist

This is the core loop for an existing, authenticated user.

```mermaid
graph TD
    A[Visit /dashboard] --> B[User is already logged in];
    B --> C[Selects new prompt components and/or adds custom text];
    C --> D[Clicks 'Generate'];
    D --> E[UI adds 'loading' playlist & displays skeleton state];
    E --> F[Show generated playlist];
    F --> G{Review tracks};
    G --> H[Clicks 'Save to Spotify'];
    H --> I[Confirmation toast: "Saved!"];
    I --> B;
```

---

## 3. Sharing a Playlist

This flow shows how a user shares a creation and how that drives new user acquisition (the growth loop).

```mermaid
graph TD
    subgraph Authenticated User
        A[/dashboard/playlist/id] --> B[Click 'Share'];
        B --> C[Copy public link to clipboard];
    end

    subgraph New User
        D[Clicks shared link] --> E[Views public playlist at /share/playlist/id];
        E --> F[Likes what they see];
        F --> G{Clicks 'Create Your Own'};
        G --> H[/signup];
    end

    C --> D;
```

---

## 5. Editing an Existing Playlist (Creating a New Version)

This flow shows how a user refines a playlist, creating a new version while preserving the old one.

```mermaid
graph TD
    subgraph Authenticated User
        A[/dashboard/playlist/id] --> B[Click 'Edit with AI'];
        B --> C[User is taken to Prompt Builder with previous selections loaded];
        C --> D[Modifies prompt, e.g., adds "more upbeat" text chip];
        D --> E{Click 'Generate'};
        E --> F[A new playlist version is created and displayed];
        F --> G[Old version is still available in History];
    end
```

---

## 4. Upgrading to a Pro Plan

This flow describes how a free user might hit a limit and upgrade their account.

```mermaid
graph TD
    A[Free user on /dashboard] --> B[Has used monthly quota];
    B --> C[Enters a new prompt];
    C --> D[Click 'Generate'];
    D --> E[Show modal: "You've reached your free limit"];
    E --> F{Click 'Upgrade to Pro'};
    F --> G[Redirect to /pricing];
    G --> H[Selects Pro plan];
    H --> I[Stripe Checkout flow];
    I --> J[Successful payment];
    J --> K[Redirect to /dashboard/settings/billing];
    K --> L[User is now Pro];
``` 