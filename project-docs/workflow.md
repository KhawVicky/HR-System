# Development Workflow

`AGENTS.md` is the main rule file. This file is only a quick checklist for daily work.

## Small Tasks

- Read only the relevant source files.
- Keep the change focused.
- Run the most relevant check, usually `npm run build`.
- Do not update project memory unless the change affects behavior, database structure, workflow, or a verified bug.

## Larger Tasks

- Read `AGENTS.md` and the relevant files in `project-docs/`.
- Split work into frontend, backend, database, and bug-fix parts when useful.
- Use sub-agents for independent investigation or review tasks.
- Use a worktree or branch only for risky or broad changes.

## Project Memory Routing

- `progress.md`: current status and next tasks.
- `decisions.md`: decisions future Codex sessions must obey.
- `bug-log.md`: symptom, cause, fix, and verification.
- `handover.md`: unfinished work or blockers.
- `database-plan.md`: schema and data-model planning.

## Local Workflow

- Frontend source runs with `npm run dev`.
- Frontend verification uses `npm run build`.
- PHP API source is `server/api.php`.
- XAMPP API copy is updated with `npm run dev:api`.
- Database source of truth is `database/schema.sql` plus dated migrations.

## Git Workflow

- Do not use `git add .`.
- Stage explicit paths only.
- Keep `.tmp/` out of commits.
- Push to GitHub only when the user asks.
