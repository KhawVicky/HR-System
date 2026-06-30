# Progress

## Current Status

- The project is a React, TypeScript, Vite, Tailwind frontend with a local PHP API served through XAMPP.
- Core HR recruitment flows are database-backed: dashboard, job management, candidate ranking, candidate details, score breakdowns, resume/documents, notifications, HR action logs, email templates, HR efficiency analytics, and user management.
- Candidate Career Portal exists with active job browsing, candidate login/register, profile, application submission, My Applications, application details, and withdraw support.
- Database source of truth is `database/schema.sql` with dated migrations in `database/migrations/`.
- API source is `server/api.php`; the XAMPP copy is deployed with `npm run dev:api`.
- Frontend API base is `http://localhost/uwc-hr-api/api.php`.
- Build command is `npm run build`; latest build passed with only the existing Vite chunk-size warning.
- `.tmp/` is ignored in Git to avoid XAMPP backup noise.
- Shared application status helpers now live in `app/lib/applicationStatus.ts`.

## Current Local State

- Active branch: `main`.
- Local frontend normally runs at `http://localhost:5173` or the next available Vite port.
- XAMPP Apache serves the PHP API locally.
- XAMPP MariaDB is used for the local prototype database.

## Next Tasks

1. Continue reducing repeated status, badge, and date logic by using shared helpers.
2. Gradually split large files when touching them:
   - `CandidateList.tsx`
   - `CandidatePortal.tsx`
   - `UserProfile.tsx`
   - `HRProcessingAnalytics.tsx`
   - `server/api.php`
3. Keep improving Candidate Career Portal UI and flow polish.
4. Stabilize XAMPP/MySQL workflow or evaluate a more reliable local database setup if crashes continue.
5. Keep schema, migrations, and XAMPP database aligned after DB changes.

## Verification Checklist

- Frontend-only change: run `npm run build`.
- Backend PHP change: run `npm run dev:api`, then test the affected API route.
- Database change: update `database/schema.sql`, add a dated migration, then apply/import locally.
- Before commit: run `git status --short` and stage explicit files only.
