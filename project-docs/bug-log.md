# Bug Log

## Tailwind Styles Not Applying

- Symptom: Browser showed mostly unstyled HTML.
- Cause: Tailwind v4 was imported without the required Vite plugin, causing utilities to be output inside invalid `@media source(none)`.
- Fix: Installed `@tailwindcss/vite`, added it to `vite.config.ts`, and changed Tailwind import to normal `@import 'tailwindcss';`.
- Verification: `npm run build` passed and generated actual Tailwind utility classes.

## Figma Asset Import Not Available

- Symptom: Build could not resolve `figma:asset/...` imports.
- Cause: Original source was exported from Figma environment.
- Fix: Replaced Figma asset imports with local project assets.
- Verification: Build passed.

