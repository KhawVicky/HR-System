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
## 2026-06-04 - Email Send UI Showed Success Before SMTP Completed

- Symptom: HR could click interview/reject email actions and see a success message even when the email request had not actually completed yet.
- Cause: `CandidateList` triggered `updateCandidateStatus(...)` without awaiting the API response, then immediately closed the modal and showed a success toast. If SMTP or the API failed afterward, the UI could already look successful.
- Fix: Email actions now wait for the API result before showing success, closing the modal, or keeping the status update. Failed sends roll back the optimistic candidate state and show the API/SMTP error. Email buttons show a temporary `Sending...` state to prevent duplicate clicks.
- Note: Seed/demo candidates using fake `example.com` addresses may still appear as sent in `email_logs` but will not be received by a real person.

