# Progress

## Current Status

- React frontend prototype has been created from the provided source archive.
- Vite, TypeScript, React, Tailwind, and project dependencies have been configured.
- Tailwind styling issue was fixed by adding `@tailwindcss/vite`.
- UWC Berhad logo image has replaced the temporary logo.
- Dev server has been tested locally.
- XAMPP MariaDB database has been created locally.
- Database schema and demo seed data are stored in `database/schema.sql`.
- XAMPP Apache PHP API has been added and connected to MariaDB.
- Core recruitment pages now read database records instead of frontend mock data.
- Hiring Manager-only navigation has been applied for HR Efficiency and User Management.
- The next major work area is create/update API support for job creation and resume upload files.

## Current Local Frontend

- Dev URL used recently: `http://localhost:5174`
- Build command: `npm run build`
- Build passes, with only bundle-size warning.

## Next Tasks

1. Implement backend create/update endpoints for job creation.
2. Implement real resume file upload handling.
3. Improve scoring service from current seeded/demo scoring records.
4. Add interview/reject email log creation.
5. Add full user create/update APIs for User Management.

## Database Build - 2026-05-07

- Created `database/schema.sql`.
- Imported schema into XAMPP MariaDB using root with no password.
- Created database: `uwc_hr_decision_support`.
- Verified 20 tables were created.
- Verified seed counts: users, jobs, candidates, applications, ranking, and score breakdown records.
- Verified criteria weights for `JOB001` total 100%.
- Verified demo ranking: Alice Chen ranked first with score 88.50; Daniel Tan is filtered out with score 67.00.

## DB Integration - 2026-05-07

- Added PHP API source in `server/api.php`.
- Deployed API to XAMPP Apache at `C:\xampp\htdocs\uwc-hr-api\api.php`.
- Frontend API base is `http://localhost/uwc-hr-api/api.php`.
- Added `database/seed-demo.sql` to expand job and candidate data.
- Restored original exported UI design after the first DB integration pass changed the page appearance too much.
- Reconnected DB data to the restored original UI with minimal JSX/layout changes.
- Login now validates against active users in the database by email.
- HR staff cannot see HR Efficiency or User Management.
- Hiring Manager can see HR Efficiency and User Management; HR Staff cannot.
- `npm run build` passes after integration.

## DB-Only UI Data Pass - 2026-05-07

- Removed frontend mock arrays from Dashboard, Department Jobs, Job Details, Candidate Ranking, Candidate Apply, User Management, HR Efficiency, and Attendance Analytics.
- Dashboard and Department Jobs now load job summaries from `/jobs`.
- Job Details now loads and updates job status through `/jobs/:id`.
- Candidate Ranking now loads `/jobs/:id/candidates` and writes status changes through `/applications/:id`.
- Candidate Apply now reads `/apply/:jobCode` or active jobs from `/jobs`, then submits applications through `/apply/:jobCode`.
- User Management now loads internal users from `/users`.
- HR Efficiency and Attendance Analytics now use database-derived API data.
- Deployed updated PHP API to `C:\xampp\htdocs\uwc-hr-api\api.php`.
- Verified XAMPP API responses for jobs, job candidates, HR efficiency details, and attendance analytics records.
- Added the Criteria & Weight tab back into Job Details using database criteria and weight records.
- Added pagination: Dashboard department groups show 10 per page, Department job lists show 10 per page, and Candidate Ranking shows 15 per page.
- Added `database/seed-more.sql` and imported it into XAMPP MariaDB.
- Expanded demo data to 42 jobs across 15 departments; Engineering now has 12 jobs and Job 1 now has 18 candidates for pagination testing.
- Removed the `roles` table. Role is now stored directly in `users.role_id` where `1 = HR Staff` and `2 = Hiring Manager`; Admin role has been removed.
- User Management Create Account now writes new users into the database through `POST /users`.
- Verified user creation with `test.staff@uwc.com.my` using role `1 = HR Staff`.
- HR Efficiency Dashboard Recent Processing Details now paginates at 15 records per page.
- Candidate shortlist and interview-sent state are now separate: candidates can show both Shortlisted and Interview, and the interview email button is disabled after sending.
- Removed candidate eligibility explanation from the Candidate UI and dropped `applications.eligibility_reason` from the database.
- Candidate cards now show experience again using `candidates.years_experience`, separate from eligibility explanation text.
- Applied Job History now excludes the current application so it only shows other jobs the candidate applied for.
- Candidate application now uploads the actual PDF resume through multipart form data, stores it under the XAMPP API uploads folder, and saves the public resume URL for the HR Candidate List resume button.
- Candidate duplicate applications now show a confirmation dialog; confirmed resubmissions replace the existing application and archive the previous version as submission history before other job history.
- Reworked the database to the final 20-table design: restored `roles`, removed `candidate_job_history`, expanded `application_submission_history`, rebuilt XAMPP data from schema plus seed files, and updated the API to derive job history from `applications`.
