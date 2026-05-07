# AGENTS.md

## Project

AI-Based Human Resource Decision Support System for UWC Berhad.

This project is a web-based HR decision support system. Its main purpose is to help HR staff and hiring managers manage recruitment workflows, evaluate resumes, rank candidates, and explain scoring results. The system supports decisions; it does not make final hiring decisions automatically.

## Main Scope

- Login and role-based internal access.
- HR dashboard and job post management.
- Job description upload and extracted job detail review.
- Criteria and weight setting.
- Eligibility filter management.
- Unique application link generation.
- Candidate application form and resume upload.
- Resume parsing, evaluation, score calculation, and ranking.
- Candidate details, score breakdown, and job history.
- Shortlist, interview, and reject workflow.
- User profile, security, notification, and email templates.
- User management for admin or hiring manager roles.
- Attendance analytics is optional and secondary.

## Working Rules

- Use `AGENTS.md` as the main project rule file.
- Use `project-docs/` as the project memory folder.
- Before large changes, read relevant files in `project-docs/`.
- Keep frontend, backend, database, and bug-fixing work separated when possible.
- Update `project-docs/progress.md` after meaningful changes.
- Record important architecture or product decisions in `project-docs/decisions.md`.
- Record bug causes and fixes in `project-docs/bug-log.md`.
- Use `project-docs/handover.md` when handing work between threads or sessions.

## Thread Responsibilities

### Main Control Thread

- Understand current code and project documents.
- Break work into smaller tasks.
- Decide task priority and ownership.
- Integrate frontend, backend, database, and bug-fix work.
- Keep project documents up to date.

### Frontend Thread

- Own React pages, routing, layout, UI states, and user flows.
- Keep UI consistent with the UWC HR decision support scope.
- Avoid unrelated refactors.
- Verify major flows in the browser when possible.

### Backend Thread

- Own API routes, business logic, database connection, authentication, scoring services, and file upload handling.
- Keep scoring logic explainable and traceable.
- Do not hide decision logic inside unclear code.

### Database Thread

- Own schema design, seed data, migrations, and relationship integrity.
- Keep candidate scoring, eligibility, and status history auditable.
- Prefer clear relational tables over overloaded JSON fields unless justified.

### Bug-Fixing Thread

- Reproduce the bug when possible.
- Identify root cause before changing code.
- Keep fixes small.
- Update `project-docs/bug-log.md`.

## Worktree Rule

If a task is independent, risky, or likely to touch many files, create a short-term worktree or branch to isolate the changes. After completion:

1. Verify the task.
2. Commit changes locally.
3. Merge back into the main branch.
4. Update `project-docs/` with progress, handover notes, bug causes, and decisions.

## Git Rule

- Do not overwrite user changes.
- Do not use destructive git commands unless explicitly requested.
- Make local commits at stable checkpoints.
- Push the main branch to cloud only when the user asks or confirms the remote target.

## Product Positioning

The system is different from a normal ATS because it focuses on:

- Custom criteria scoring.
- Weighted ranking.
- Eligibility filtering.
- Transparent score breakdown.
- Candidate decision support for HR and hiring managers.

