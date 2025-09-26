# Sitemap

> Last updated: 2024-06-12

This document provides a detailed sitemap for the Music Genie web application, covering all pages from marketing to the core authenticated experience. The entire site is designed to be fully responsive.

---

## 1. Public & Marketing Pages (`/app/(marketing)`)

These pages are accessible to everyone and are focused on acquisition and information.

- **`/` (Landing Page)**
  - **Purpose**: Attract and convert new users.
  - **Content**:
    - Hero section with a compelling headline, a brief description of Music Genie, and a primary CTA (Call to Action) to "Create a playlist for free".
    - "How it works" section with 3-4 steps (e.g., 1. Write your idea, 2. AI finds the music, 3. Save to Spotify).
    - Feature highlights (e.g., "Powered by GPT-4," "Seamless Spotify Integration," "Discover Hidden Gems").
    - Testimonials or social proof.
    - A secondary CTA to the `/pricing` page.
    - Footer with links to legal docs, blog, and social media.

- **`/about`**
  - **Purpose**: Share the story and mission behind Music Genie.
  - **Content**: The "why" behind the project, team info (if applicable), and contact information.

- **`/pricing`**
  - **Purpose**: Detail the available plans (Free vs. Pro).
  - **Content**:
    - A comparison table showing features for each tier.
    - **Free Tier**: Limited playlist generations per month, standard AI model, ads may be shown.
    - **Pro Tier**: Unlimited generations, advanced AI model, no ads, priority support, access to beta features.
    - A clear CTA for each plan ("Sign up for Free" / "Go Pro").
    - FAQ section about billing.

- **`/blog`**
  - **Purpose**: Content marketing to drive organic traffic.
  - **Content**: A list of blog posts with featured images and summaries.

- **`/blog/[slug]`**
  - **Purpose**: Individual blog post.
  - **Content**: Article content, author information, share buttons.

---

## 2. Authentication Pages (`/auth`)

A minimal, clean interface for user authentication.

- **`/auth/login`**: Standard login form (Email/Password or social providers).
- **`/auth/signup`**: Signup form.
- **`/auth/forgot-password`**: Form to request a password reset link.
- **`/auth/callback`**: Handles the OAuth redirect from Spotify/other providers.

---

## 3. Core Application Pages (`/app/(dashboard)`)

This is the main, authenticated part of the application.

- **`/dashboard` (Home / Generator)**
  - **Purpose**: The primary interface for creating playlists using a guided, hybrid approach.
  - **Content**:
    - **Guided Selections**: A component allowing users to select from predefined categories like Genre, Mood, and Era. Selections appear as removable chips.
    - **Custom Text Input**: A text field for adding free-form creative prompts, which also become removable chips.
    - **"Generate" Button**: Becomes active once at least one chip exists.
    - **"Surprise Me" Button**: Populates the selections with a random, interesting combination of prompts.
    - On mobile, this may be a stacked, single-column layout. On desktop, it could be a multi-column view.

- **`/dashboard/history`**
  - **Purpose**: Browse and manage previously generated playlists.
  - **Content**: A list or grid of past playlists, showing title, cover art, and creation date. Each item links to its detail view. Includes search and filter functionality.

- **`/dashboard/playlist/[id]`**
  - **Purpose**: View, edit, and manage a specific playlist.
  - **Content**:
    - Playlist title and description (editable).
    - A list of tracks with artist/album info.
    - Actions: "Save to Spotify," "Share," "Delete."
    - An "Edit with AI" feature to refine the playlist with a new prompt (e.g., "add more upbeat tracks").

- **`/dashboard/settings`**
  - **Purpose**: Manage user account and application settings.
  - **Content**: A tabbed interface for:
    - **`/settings/profile`**: Update name, email, avatar.
    - **`/settings/billing`**: (For Pro users) Manage subscription, view invoices.
    - **`/settings/integrations`**: Manage Spotify connection.

---

## 4. Publicly Shared Pages

- **`/share/playlist/[id]`**
  - **Purpose**: A public, read-only view of a shared playlist.
  - **Content**:
    - Playlist title, description, and creator's name/avatar.
    - List of tracks.
    - A prominent CTA for viewers to "Sign up to create your own AI playlist." This is a key growth loop.

---

## 5. Legal Pages

- **`/privacy-policy`**: Standard privacy policy.
- **`/terms-of-service`**: Standard terms of service. 