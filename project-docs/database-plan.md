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
- `candidate_scores`
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
- One application has one resume record.
- One application has one candidate score.
- One candidate score has many score breakdown records.
- Duplicate submissions for the same job archive previous application/resume state in `application_submission_history`.
- One application can have email logs for interview or reject actions.

## Scoring Notes

- Final score maximum is 100.
- Criteria raw score is converted using weight.
- Eligibility filter result should not erase score breakdown.
- Filtered out candidates should remain reviewable by HR.

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
- `candidate_scores`
- `score_breakdowns`
- `score_breakdown_items`
- `application_submission_history`
- `email_templates`
- `email_logs`
- `notifications`
- `attendance_records`
