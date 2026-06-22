# Bug Log

## Tailwind Styles Not Applying

- Symptom: Browser showed mostly unstyled HTML.
- Cause: Tailwind v4 was imported without the required Vite plugin, causing utilities to be output inside invalid `@media source(none)`.
- Fix: Installed `@tailwindcss/vite`, added it to `vite.config.ts`, and changed Tailwind import to normal `@import 'tailwindcss';`.
- Verification: `npm run build` passed and generated actual Tailwind utility classes.

## Figma Asset Import Not Available

- Symptom: Build could not resolve `figma:asset/...` imports.
- Cause: Original source was exported from Figma environment.
- Fix: Replaced Figma asset imports with local project assets.
- Verification: Build passed.
## 2026-06-04 - Email Send UI Showed Success Before SMTP Completed

- Symptom: HR could click interview/reject email actions and see a success message even when the email request had not actually completed yet.
- Cause: `CandidateList` triggered `updateCandidateStatus(...)` without awaiting the API response, then immediately closed the modal and showed a success toast. If SMTP or the API failed afterward, the UI could already look successful.
- Fix: Email actions now wait for the API result before showing success, closing the modal, or keeping the status update. Failed sends roll back the optimistic candidate state and show the API/SMTP error. Email buttons show a temporary `Sending...` state to prevent duplicate clicks.
- Note: Seed/demo candidates using fake `example.com` addresses may still appear as sent in `email_logs` but will not be received by a real person.

## 2026-06-08 - Pending Reviews Included Reviewed Candidates

- Symptom: The Pending Reviews dashboard drill-down showed candidates with `REVIEWED` status.
- Cause: The deployed XAMPP API still used the older pending condition `application_status = 'new' OR reviewed_at IS NULL`. Some reviewed seed/demo rows had a null `reviewed_at`, so they were incorrectly included.
- Fix: Pending review now means only `application_status = 'new'` in both dashboard count and application list filtering, then redeployed `server/api.php` to the XAMPP API folder.
- Verification: PHP syntax check passed for `server/api.php`.

## 2026-06-09 - HR Efficiency API Returned Server Error

- Symptom: Opening HR Efficiency showed repeated `Server error` messages after the processing timeline update.
- Cause: The latest-email subqueries joined `email_logs` and `applications` but selected unqualified `application_id` and `id` columns, causing MariaDB to report an ambiguous column error.
- Fix: Qualified the grouped fields as `email_log.application_id` and `MAX(email_log.id)` in both HR Efficiency queries.

## 2026-06-17 - Recent Processing Details Sorted by Application Date

- Symptom: Recent Processing Details did not follow the visible Last Action Date order.
- Cause: The HR Efficiency details query calculated `lastActionDate` but still ordered rows by `applications.submitted_at`.
- Fix: Sorted the query by `COALESCE(latest_email.sent_at, applications.reviewed_at)` so the table follows Last Action Date.
- Verification: PHP syntax check passed for `server/api.php`.

## 2026-06-10 - XAMPP MySQL Stopped Unexpectedly

- Symptom: XAMPP MySQL started briefly and then stopped unexpectedly.
- Cause: MariaDB had a corrupted Aria checkpoint/control log and a corrupted InnoDB page in the system table `mysql.gtid_slave_pos`. Recreating the Aria control log also left several MariaDB system tables requiring repair.
- Fix: Backed up the damaged Aria logs and `gtid_slave_pos` files, repaired the Aria system tables, temporarily started MariaDB with `innodb_force_recovery=3`, rebuilt `mysql.gtid_slave_pos`, then repaired and checked the remaining `mysql` system tables.
- Verification: MariaDB restarted normally without recovery mode, remained alive after a delayed ping, all `uwc_hr_decision_support` tables passed `mysqlcheck`, all `mysql` system tables passed `mysqlcheck`, and the project database returned 449 applications.

## 2026-06-11 - HR Efficiency Job Title Was Not Vertically Centered

- Symptom: Job titles appeared near the top of Recent Processing Details rows while the other values were vertically centered.
- Cause: The Job Title table cell explicitly used `align-top`.
- Fix: Changed the Job Title cell to `align-middle`.

## 2026-06-11 - HR Efficiency Showed New Applications as Reviewed

- Symptom: Recent Processing Details showed `Reviewed` for applications whose current database status and candidate card status were `New`.
- Cause: The HR Efficiency API used `reviewed_at IS NOT NULL` to include rows and defaulted every non-shortlisted row without an email to `reviewed`, even when the current `application_status` was `new`.
- Fix: Recent Processing Details and HR Efficiency summary now exclude current `new` applications. Without a successful email action, the status badge uses the current `application_status` instead of inferring it from `reviewed_at`. Existing `new` applications also had stale `reviewed_at` and assigned HR values cleared.

## 2026-06-11 - Rejection Action Label Did Not Match Email Action

- Symptom: Candidate Screening Action History displayed `Rejected Candidate` for rejection email actions.
- Cause: Rejection audit records used the normalized internal type `reject_candidate` with the older `Rejected Candidate` display label.
- Fix: Existing and future `reject_candidate` audit records now display `Sent Rejected Email`.

## 2026-06-11 - MySQL Failed to Start After Project Table Corruption

- Symptom: MariaDB started briefly and crashed, then rejected the local root account after the damaged project table was rebuilt.
- Cause: The InnoDB indexes for `uwc_hr_decision_support.job_criteria` were corrupted. The MariaDB Aria privilege table `mysql.global_priv` also had checksum damage and lost its unreadable account rows during repair.
- Fix: Exported a full project recovery backup and a separate readable `job_criteria` dump, rebuilt `job_criteria`, repaired all MariaDB system tables, and restored local-only XAMPP root accounts for `localhost`, `127.0.0.1`, and `::1`.
- Backup: `C:\xampp\mysql\recovery_backup_20260611_2120`.
- Verification: MariaDB runs normally without recovery flags, delayed `mysqladmin ping` returned alive, all project and MariaDB system tables passed `mysqlcheck`, and the project database returned 449 applications and 168 job criteria.
# Expanded HR processing chart was clipped

- Cause: Expanded charts used a fixed `520px` height inside a modal limited to `92vh`. Browser zoom and taller filter layouts could make the chart exceed the modal's available content area, clipping its lower axis and labels.
- Fix: Changed the modal to explicit header/filter/chart grid rows and made the expanded chart fill only the remaining row height.
- Verification: Playwright confirmed Trend, HR, and Custom Range expanded views fit completely inside the modal at a zoom-equivalent `1600x777` viewport.

# Expanded analytics required vertical scrolling

- Cause: The detailed expanded analytics layout used large fixed chart heights, generous section gaps, and spacious table rows, making the summary and breakdown sections fall below the viewport.
- Fix: Increased modal viewport usage and introduced a compact single-screen layout for standard filters while preserving scroll support for Custom Range.
- Verification: Playwright confirmed both Trend and HR expanded views render their charts, summary cards, and breakdown tables without vertical overflow at `1740x815`.

# Expanded analytics modal felt oversized and left unused space

- Cause: A fixed near-full-screen modal height made the frame cover most of the page even when its compact content did not need the space.
- Fix: Changed the expanded modal to a true 80% viewport width with content-driven height and an 88% viewport height cap.
- Verification: Playwright confirmed both expanded views render at approximately 80% width, keep their charts visible, and remain below the configured height cap at `1920x900`.
