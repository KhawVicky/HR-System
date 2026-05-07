# Development Workflow

## Main Rule

Use `AGENTS.md` as the main project rule file and `project-docs/` as the project memory folder.

## Main Control Thread

The main control thread reads current code and project documents, understands project status, and breaks the work into smaller tasks.

Responsibilities:

- Read current code before planning changes.
- Read relevant `project-docs/` files.
- Split work into frontend, backend, database, and bug-fixing tasks.
- Decide when to use a short-term worktree or branch.
- Integrate completed work.
- Update project memory.

## Specialist Threads

Frontend, backend, database, and bug-fixing threads handle their own responsibilities.

Each thread should:

- Work within its assigned scope.
- Avoid unrelated edits.
- Leave handover notes when work is incomplete.
- Record important findings in `project-docs/`.

## Worktree Flow

Use a short-term worktree or branch when a task is independent, risky, or touches many files.

Flow:

1. Create isolated worktree or branch.
2. Complete task.
3. Run relevant checks.
4. Commit locally.
5. Merge back into main branch.
6. Update `project-docs/progress.md`.
7. Update `project-docs/handover.md` when needed.

## Documentation Flow

Update these files during development:

- `progress.md` for completed work and next tasks.
- `decisions.md` for product or technical decisions.
- `bug-log.md` for root causes and fixes.
- `handover.md` for session transfer notes.
- `database-plan.md` for schema planning.

## Backup Flow

The final main branch should be pushed to cloud for backup and synchronization after the user confirms the remote repository.

