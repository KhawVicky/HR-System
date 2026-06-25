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
- Duplicate candidate applications for the same job keep one current row in `applications`; confirmed resubmissions archive the previous state in `application_submission_history`.
- XAMPP Apache is used to serve the local PHP API instead of PHP built-in server because it is more stable on the current Windows path setup.
- Frontend API requests use query routing through `api.php?route=...` to avoid Apache PATH_INFO configuration issues.
- User roles are defined in `roles`; `users.role_id` references `roles.id`. The system keeps only HR Staff and Hiring Manager roles.
- `candidate_job_history` was removed because candidate job history can be derived from `applications`.
- `candidate_scores` was removed because the prototype only needs one official score per application; `applications.total_score` is the score source of truth and `score_breakdowns` links directly to `applications`.
- Notifications are stored in the existing `notifications` table and are kept for 90 days. Hover preview does not mark a message as read; opening the full notifications page does. The feature keeps only two notification types: `new_application` for all active internal user accounts and `email_sent` for the HR user who sent the email.
- The system has no Admin role. HR Efficiency and User Management are visible only to Hiring Manager users.
- Project memory is stored in `project-docs/`.
- Main project rules are stored in `AGENTS.md`.
- HR Efficiency only includes applications that HR has reviewed. Reviewed and shortlisted applications show their review action time but leave Processing Time blank because the workflow is incomplete. Processing time is only measured from submission to the latest successful interview/rejection email after the current submission.
- User-visible dates use `DD/MM/YYYY`; user-visible timestamps use `DD/MM/YYYY, hh:mm AM/PM`. API values, form inputs, sorting values, and export filenames keep their machine-readable formats.
- HR processing analytics only includes applications with a successfully sent interview or rejection email after the current submission. Duration is measured from application submission to the latest qualifying email, while the HR grouping uses the application's assigned first reviewer.
- HR processing chart filters are shared between both charts and persist when either expanded chart modal is opened. Both expanded charts use the same Date Range, Job, Department, and Email Outcome filters.
- HR processing analytics filter options use the jobs catalog but only expose departments that contain active jobs. Department is the parent filter for Job: while `All Departments` is selected, Job has no individual options; selecting a department shows only its active jobs and clears an incompatible selected job.
- Processing Time Trend groups and filters completed applications by the latest successful interview/rejection email date. Processing duration itself remains measured from application submission to that completed action.
- Expanded analytics views may derive display-only summaries and CSV exports from the already-filtered completed application data. These summaries do not change the completed application definition, assigned HR logic, processing-time calculation, or established filters.
- Candidate Career Portal accounts are stored separately from internal HR users in `candidate_accounts`, with browser sessions stored in `candidate_sessions`. Candidate APIs require a bearer token and always check `candidate_id` before returning or updating application records.
- The existing public `/apply` flow is retained for compatibility, but it now reuses the candidate session when available. The newer career flow links logged-in candidates to `/apply/:jobCode`, while unauthenticated candidates are sent through candidate login/register with a return path.
- Candidate-facing application statuses are mapped from internal HR statuses. Candidates never see internal `filtered_out`, score, rank, HR notes, score breakdown, or eligibility details.
