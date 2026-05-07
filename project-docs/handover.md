# Handover Notes

## Current Context

The project is a UWC Berhad HR recruitment decision support system. The current codebase contains a React frontend prototype with multiple HR pages and mock data.

## Current Priorities

1. Add create/update APIs for job creation and criteria management.
2. Implement real resume file upload handling.
3. Implement interview/reject email log creation.
4. Preserve the project scope around recruitment decision support.

## Important Notes

- Original UI design has been restored for the main pages after the first DB integration changed too much of the layout.
- The PHP API and database seed are ready, but core recruitment pages should be reconnected carefully without rewriting page structure.
- The database schema is ready at `database/schema.sql`.
- Additional demo data is stored in `database/seed-demo.sql`.
- API source is `server/api.php`; deployed copy is `C:\xampp\htdocs\uwc-hr-api\api.php`.
- Frontend API helper is `app/lib/api.ts`.
- XAMPP MariaDB import has been verified.
- Candidate score breakdown and ranking are central features.
- Attendance analytics should remain optional.
- Use `project-docs/` to keep project memory updated.
