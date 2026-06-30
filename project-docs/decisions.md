# Decisions

This file stores durable decisions that future Codex sessions must follow. Do not use it as a changelog.

## Product Decisions

- The system is a decision support system, not an automatic hiring decision system.
- Final hiring decisions remain with UWC Berhad staff.
- The system differentiates itself from a normal ATS through custom criteria scoring, weighted ranking, eligibility filtering, and transparent score breakdowns.
- Attendance analytics is optional and secondary to recruitment decision support.
- Internal HR users must log in.
- Candidate access is separated from internal HR access.
- Candidate-facing pages must not expose internal score, rank, score breakdown, HR notes, eligibility filter details, or other candidates.

## Roles and Access

- The system has two internal roles only: HR Staff and Hiring Manager.
- `roles.id = 1` is HR Staff.
- `roles.id = 2` is Hiring Manager.
- HR Efficiency and User Management are visible only to Hiring Manager users.
- Candidate accounts are stored separately from internal HR users in `candidate_accounts`.
- Candidate sessions are stored in `candidate_sessions`.
- Candidate APIs must verify candidate identity and check `candidate_id` before returning or updating application records.

## Database Decisions

- Local prototype database name is `uwc_hr_decision_support`.
- `database/schema.sql` is the schema source of truth.
- Dated migration files in `database/migrations/` document incremental schema changes.
- `candidate_job_history` was removed because candidate job history is derived from `applications`.
- `candidate_scores` was removed because `applications.total_score` is the official prototype score.
- `score_breakdowns` links directly to `applications`.
- Duplicate candidate applications for the same job keep one current row in `applications`.
- Confirmed resubmissions archive the previous application state in `application_submission_history`.
- Uploaded files are stored on disk; database tables store file metadata and paths.

## Local Development Decisions

- Frontend uses React, TypeScript, Vite, and Tailwind.
- XAMPP Apache serves the local PHP API.
- XAMPP MariaDB is acceptable for local prototype development, although MySQL instability may require a future replacement.
- API source is `server/api.php`.
- XAMPP deployed API copy is `C:\xampp\htdocs\uwc-hr-api\api.php`.
- `npm run dev:api` syncs the API source to XAMPP.
- Frontend API requests use query routing through `api.php?route=...` to avoid Apache PATH_INFO configuration issues.

## Application Status Decisions

- Shared frontend status helpers belong in `app/lib/applicationStatus.ts`.
- Candidate-facing statuses are:
  - Submitted
  - Under Review
  - Shortlisted
  - Interview
  - Rejected
  - Withdrawn
- Internal `filtered_out` must not be shown to candidates; candidate-facing display should map it to a non-internal result.
- Pending review means the application is still `new`.
- `withdrawn` is a valid HR-visible and candidate-visible status.

## Notification Decisions

- Notifications are stored in `notifications`.
- Notifications are retained for 90 days.
- Notification hover preview does not mark messages as read.
- Opening the full notifications page marks messages as read.
- New application notifications are visible to all active internal user accounts.
- Email sent notifications are visible only to the HR user who sent the email.

## Email and Action Log Decisions

- Email templates are stored in `email_templates`.
- Interview and rejection emails use persisted templates from Notification settings.
- Interview email can include a candidate attachment.
- Email logo is embedded inline in the email body, not sent as a downloadable logo attachment.
- Candidate screening actions are stored in `hr_action_logs`.
- Rejection reasons use `hr_action_logs.reason_type` and `hr_action_logs.reason_details`.
- Rejection email and direct rejection action wording must stay consistent across Candidate List, HR action history, and Recent Processing Details.

## HR Efficiency and Analytics Decisions

- Responsible HR is the first HR user assigned when reviewing the application unless explicitly reset by resubmission logic.
- Processing time is measured from application submission to the first completed processing action.
- A completed processing action can be an interview email, rejection email, or direct rejection when the UI treats it as completed.
- If an interview email is sent first, later rejection or interviewed follow-up badges may appear, but they do not replace the original processing time.
- HR processing analytics groups completed applications by the completed action date.
- HR processing analytics uses assigned HR for grouping, not job creator.
- Date filters in processing analytics use completed processing date.
- User-visible dates use `DD/MM/YYYY`.
- User-visible timestamps use `DD/MM/YYYY, hh:mm AM/PM`.
