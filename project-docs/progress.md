# Progress

## Current Status

- React frontend prototype has been created from the provided source archive.
- Root `README.md` has been added with the GitHub project overview, workflow, features, setup instructions, status, limitations, and project information.
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
- Removed the `candidate_scores` table. `applications.total_score` is now the official application score, and `score_breakdowns` links directly to `applications`.
- Fixed candidate score display so new applications without score breakdowns show the official score instead of 0, and cleared stale breakdowns from resubmitted applications.
- Added header notifications: new candidate applications create unread HR notifications, the bell badge caps at `99+`, hover shows the latest three messages, `/notifications` shows all retained messages, and notification records are cleaned after 90 days.
- Limited notifications to `new_application` and `email_sent`; interview/rejection email actions now create an `email_logs` row and a confirmation notification only for the HR user who sent the email.
- Notification records now store the related application, and clicking a notification opens the matching job candidate page with that candidate details panel expanded.
- Candidate applications now support multiple uploaded documents per application, and HR can open all uploaded files from the candidate list Resume button.
- Standardized all pagination controls to use compact page numbers with ellipsis instead of rendering every page.
- Added responsible HR tracking on applications. Opening a new candidate review assigns the current HR user, duplicate resubmissions archive the previous assigned HR in submission history, and HR Efficiency now reports by assigned HR instead of job creator.
- Candidate cards now show the responsible HR and the latest sent email sender/type from `email_logs`.
- Notification settings now persist the interview email attachment in `email_templates` and store the uploaded file under the API uploads folder for SMTP attachment sending.
- Email templates are now persisted and reused by sending: interview uses the preview wording with `{interviewDateOptions}`, and reject email uses the Notification settings template with preserved blank lines.
- Combined HR Efficiency and User Management into one HR Management workspace with tabs, so Manager users use a single header entry for both features.
- Added `hr_action_logs` for candidate screening audit history. Application review, shortlist, interview email, rejection email, and status actions are recorded with HR user, candidate, job post, action type, details, and timestamp.
- User Management now has a View Action History popup from the account action menu to inspect what each HR user clicked or changed during candidate screening.
- Normalized rejection audit actions so rejection emails and direct rejections both appear as `Sent Rejected Email` / `reject_candidate`, avoiding duplicate rejection action types in HR action history.
- Normalized interview audit actions so interview status/email actions both appear as `Sent Interview Email` / `send_interview_email`, avoiding duplicate interview action types in HR action history.
- Updated the HR Dashboard Overview to three clickable DB-driven cards: Active Jobs, New Applications, and Pending Reviews. Added `/jobs?status=active` job management filtering and `/applications?filter=last24|pending` application list filtering for dashboard drill-down.
- Updated HR Efficiency Recent Processing Details to match the application list spacing and Candidate cell style, including candidate icon, name, and email loaded from the database.
- Reworked HR Efficiency processing time around reviewed applications. Reviewed and shortlisted rows show their Last Action Date and directional status label while leaving Processing Time blank; only successful interview/rejection emails after the current submission produce Processing Time. The table fits all columns without a horizontal scrollbar.
- Standardized user-visible dates across job, candidate, application, notification, user management, action history, attendance, and HR Efficiency pages to `DD/MM/YYYY`, with timestamps shown as `DD/MM/YYYY, hh:mm AM/PM`.
- Corrected HR Efficiency status handling so Recent Processing Details follows the current application status rather than inferring `Reviewed` from `reviewed_at`, and cleaned stale review timestamps/HR assignments from current `New` applications.
- Renamed rejection actions in Candidate Screening Action History from `Rejected Candidate` to `Sent Rejected Email` for existing and future audit records.
- Updated HR Efficiency processing charts to display average elapsed time in days instead of large hour totals, with human-readable day/hour tooltip values.
- Rebuilt HR processing analytics around completed applications only. Processing Time Trend groups completed applications by their latest successful interview/rejection email date, and Average Processing Time by HR uses the application's assigned first reviewer.
- Added Expand actions for both HR processing charts. Expanded charts open in a wide modal with shared Date Range, Job, Department, and Email Outcome filters.
- Added exact hour/minute-aware chart tooltips and completed application counts while keeping the chart axes in decimal days.
- Made expanded HR processing charts use the modal's remaining viewport height instead of a fixed chart height, so axes and labels stay fully visible at browser zoom levels and with Custom Range filters open.
- Updated HR processing analytics filters so Department only shows departments with active jobs. Job remains empty at `All Departments` and shows active jobs only after a department is selected.
- Linked the HR analytics Department and Job filters, and added a fixed-height scrollable Department dropdown for long department lists.
- Updated Processing Time Trend and its Date Range filter to use the completed processing date instead of the application submission date.
- Removed the Minimum Completed Applications filter from Average Processing Time by HR so all assigned HR users with completed applications are shown.
- Redesigned both expanded HR processing analytics modals to match the detailed analytics reference: icon headers, filter toolbar with reset, chart context, summary metrics, breakdown tables, calculation note, and CSV download.
- Added Trend daily completion breakdown and HR summary statistics including average, minimum, and maximum processing time without changing the established completed-application calculations or filters.
- Compacted both expanded analytics modals into a single-screen desktop layout: reduced header/filter spacing, responsive compact charts, summary cards, and denser breakdown tables. Standard filters require no vertical scrolling; Custom Range may scroll when its extra date inputs need space.
- Refined expanded analytics modal proportions to a true 80% viewport width with content-driven height and an 88% viewport maximum, keeping the background page visible and eliminating unused bottom space.
- Added 20 local demo completed processing records across 20 different completion dates from 29/05/2026 to 17/06/2026. Each record has an application, assigned HR user, sent interview/rejection email log, and HR action log so Recent Processing Details and HR processing analytics charts have wider date coverage.
- Updated the expanded Processing Time Trend Daily Breakdown table to remove horizontal scrolling. It now keeps the date-as-columns matrix layout with paginated date windows: 10 days per page on desktop and 7 days per page on smaller screens.
- Compacted the expanded Processing Time Trend modal so the header, filters, chart, summary cards, Daily Breakdown table, and pagination fit better on one desktop screen. The Daily Breakdown now opens on the latest date page in the selected period while keeping dates chronological within each page and left-aligning partial pages with empty trailing cells.
- Updated the candidate card interview flow to use one primary interview button. The button now shows `Send Interview Email`, then `Mark as Interviewed` after the interview email is sent, then disabled `Interview Completed` after HR marks the candidate as interviewed. Added the new `interviewed` application status in the database/API and kept rejection available through a confirmation popup.
- Updated the reject action popup into a rejection email preview modal. Candidate List now loads the Notification Settings rejection template, replaces candidate/job/company placeholders, and shows the same subject/body preview before HR sends the rejection email.
- Changed the HR analytics trend chart from average processing time to completed application volume. The chart is now titled `Completed Applications Trend`, uses completed application count on the y-axis, and keeps average processing time available in the tooltip/table context.
- Changed interview and rejection email actions into a two-step modal flow. HR now reviews the email preview first, then provides required reason type and reason details before sending; the selected reason is included in the HR action log details.
- Split HR action log reasons into dedicated `reason_type` and `reason_details` fields, removed use of the old `details` field, made email action reasons optional, and added an `Add Reason` follow-up button for interview/rejection email actions that were sent without a reason.
- Simplified interview email sending back to a single-step preview flow with no reason selection. Reason display now appears under Recruitment Handling only when a reason exists, and follow-up `Add Reason` is limited to rejection email actions.
- Split rejection audit actions into `Rejected`, `Rejection Email Sent`, and separate `Rejection Reason` action logs. Recent Processing and HR action history now use matching rejection badge wording, while reason text remains stored in `hr_action_logs.reason_type` and `hr_action_logs.reason_details`.
- Updated rejected candidate cards so Interview and Reject actions are hidden after rejection. If the rejected candidate has no saved rejection reason, only the `Add Reason` action remains visible.
- Fixed rejected candidates without email so `Add Reason` still appears when no rejection reason is saved. Candidate cards now show the rejecting HR user with `Rejected without email` in the handling panel when HR rejects without sending an email.
- Updated HR Efficiency Recent Processing Details so rejected candidates without a sent rejection email still show processing time, calculated from application submission to the reject action timestamp.
- Aligned HR processing analytics with Recent Processing Details: All Completed Actions now includes rejected-without-email applications that have processing time, while the specific Interview/Rejection Email filters still only count actual sent email outcomes.
- Locked HR Efficiency Recent Processing Details to the first completed processing action per application. If an interview email is sent first, later rejection actions no longer replace the original last action date, status, or processing time.
- Recent Processing Details now also shows a follow-up `Rejected` badge under `Interview Email Sent` when a candidate is rejected after the interview email, while keeping the original interview completion time locked.
- Recent Processing Details also shows a follow-up `Interviewed` badge under `Interview Email Sent` when HR later marks the interview as completed, without changing the locked processing time.
- Recent Processing Details follow-up rejection badges now match normal rejection wording: `Rejection Email Sent` when a later rejection email was sent, and `Rejected` when HR rejected without sending email.
- Moved candidate rejection Reason details to the top of the expanded candidate card and changed the Reason label into a section title outside the card, matching the Recruitment Handling section style.
- Added the Candidate Career Portal foundation. New public routes support active job browsing, job details, candidate registration/login/logout, profile management, candidate-only application listing/details, and withdraw-before-interview flow.
- Added candidate portal database support through `candidate_accounts`, `candidate_sessions`, `application_documents`, candidate profile fields, and the new `withdrawn` application status. A migration file was added at `database/migrations/2026-06-25-candidate-career-portal.sql`.
- Integrated the existing `/apply` form with candidate sessions. Logged-in candidates now submit under their own account identity, their email is locked on the form, and successful submissions can route back to My Applications.
- Added candidate-facing status mapping so applicants see `Submitted`, `Under Review`, `Shortlisted`, `Interview`, `Rejected`, or `Withdrawn` without exposing internal `filtered_out`, ranking, score, eligibility reason, or HR notes.
- Updated HR-facing candidate/application/status UI to recognize `withdrawn` applications after a candidate withdraws.
- Synced the updated PHP API to `C:\xampp\htdocs\uwc-hr-api\api.php` so the local XAMPP endpoint exposes the new candidate portal routes.
- Added HR-style breadcrumbs across the Candidate Career Portal pages, including Careers, Job Details, Candidate Login/Register, My Applications, Application Details, and Profile.
