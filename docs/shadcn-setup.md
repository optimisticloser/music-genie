# shadcn/ui Setup Guide

This project uses [shadcn/ui](https://ui.shadcn.com) – a copy/paste Tailwind + Radix UI component library.

---

## 1. Install the CLI

```bash
npx shadcn-ui@latest init
```

The CLI will ask:

| Prompt | Recommended answer |
| --- | --- |
| **Which style of components do you want to install?** | `default` |
| **Where is your global CSS file?** | `./src/app/globals.css` |
| **Where do you want to save the components?** | `src/components/ui` |
| **Configure aliases?** | `@` |

The tool will update `tailwind.config.ts` with Radix UI colours and utilities.

---

## 2. Add the `cn` Helper

Many shadcn components rely on a class name merge utility:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 3. Generate Components

```bash
npx shadcn-ui add button
npx shadcn-ui add dialog
npx shadcn-ui add input
```

Each command copies the component source into `src/components/ui/` so you can tweak styles freely.

---

## 4. Keeping Components Up-to-date

Because you own the source, updating is manual:

1. Run `npx shadcn-ui@latest add <component>` again.  
2. Inspect the diff and keep / discard changes.

---

## 5. Animations

Some components use the [`tailwindcss-animate`](https://github.com/jamiebuilds/tailwindcss-animate) plugin. Ensure it is present in `tailwind.config.ts`:

```ts
plugins: [
  require("tailwindcss-animate"),
]
```

---

## 6. Tips

• Use the `class-variance-authority` library (`cva`) for variant-heavy custom components.  
• Keep design tokens (spacing, colour palette) in `tailwind.config.ts` so shadcn components inherit them. 