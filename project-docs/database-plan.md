# Database Plan

## Local Development Recommendation

Use XAMPP MySQL with phpMyAdmin for local development and demonstration.

Suggested database name:

```sql
uwc_hr_decision_support
```

Current schema file:

```text
database/schema.sql
```

Current local status:

- Database has been created in XAMPP MariaDB.
- phpMyAdmin can be used to inspect the records.
- Demo seed data is included for users, jobs, application links, candidates, ranking, and score breakdown.
- User roles are defined in `roles`; `users.role_id` references `roles.id`.
- `candidate_job_history` has been removed. Candidate job history is read directly from `applications`.

## Core Tables

- `roles`
- `users`
- `jobs`
- `job_responsibilities`
- `job_required_skills`
- `job_criteria`
- `criteria_requirements`
- `eligibility_filters`
- `application_links`
- `candidates`
- `applications`
- `resumes`
- `score_breakdowns`
- `score_breakdown_items`
- `application_submission_history`
- `email_templates`
- `email_logs`
- `notifications`
- `attendance_records` optional

## Important Relationships

- One user can create many jobs.
- One job has many criteria.
- One job has one or more eligibility filters.
- One job has one application link.
- One candidate can apply to many jobs.
- One application belongs to one job and one candidate.
- One application can have multiple uploaded document records in `resumes`.
- One application stores the official total score used by the ranking list.
- One application has many score breakdown records.
- Duplicate submissions for the same job archive previous application/resume state in `application_submission_history`.
- One application can have email logs for interview or reject actions.
- Internal notification messages are stored in `notifications` and retained for 90 days.

## Scoring Notes

- Final score maximum is 100.
- Criteria raw score is converted using weight.
- Eligibility filter result should not erase score breakdown.
- Filtered out candidates should remain reviewable by HR.

## Notification Notes

- New candidate applications create unread notifications for all active internal user accounts.
- The header notification badge shows unread messages and caps the display at `99+`.
- Hover preview shows the latest three messages.
- Opening the notification page marks the user's notifications as read.
- Notification types are limited to `new_application` and `email_sent`.
- New application notifications are visible to all active internal user accounts.
- Email sent notifications are visible only to the HR user who sent the interview or rejection email; the sender is recorded in `email_logs.sent_by_user_id`.
- Notifications can store `related_application_id` so a user can open the related candidate details from the notification.

## Verified Tables

- `roles`
- `users`
- `jobs`
- `job_responsibilities`
- `job_required_skills`
- `job_criteria`
- `criteria_requirements`
- `eligibility_filters`
- `application_links`
- `candidates`
- `applications`
- `resumes`
- `score_breakdowns`
- `score_breakdown_items`
- `application_submission_history`
- `email_templates`
- `email_logs`
- `notifications`
- `attendance_records`
