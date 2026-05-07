# Decisions

## Product Decisions

- The system is a decision support system, not an automatic hiring decision system.
- Candidate access is limited to the application page through a unique application link.
- HR and hiring manager users require login.
- Score breakdown is a key system differentiator.
- Eligibility filters are separate from ranking score.
- Filtered out candidates may still have a score and score breakdown.
- Attendance analytics is optional and secondary to recruitment decision support.

## Technical Decisions

- Frontend uses React, TypeScript, Vite, and Tailwind.
- XAMPP MySQL is acceptable for local development and prototype demonstration.
- Local database name is `uwc_hr_decision_support`.
- The schema source of truth is `database/schema.sql`.
- Duplicate candidate applications for the same job are prevented by the unique key on `(job_id, candidate_id)` in `applications`.
- XAMPP Apache is used to serve the local PHP API instead of PHP built-in server because it is more stable on the current Windows path setup.
- Frontend API requests use query routing through `api.php?route=...` to avoid Apache PATH_INFO configuration issues.
- User roles are stored directly in `users.role_id`; `1 = HR Staff` and `2 = Hiring Manager`.
- The system has no Admin role. HR Efficiency and User Management are visible only to Hiring Manager users.
- Project memory is stored in `project-docs/`.
- Main project rules are stored in `AGENTS.md`.
