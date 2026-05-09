<?php

declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

$mysqli = new mysqli("127.0.0.1", "root", "", "uwc_hr_decision_support", 3306);

if ($mysqli->connect_errno) {
    respond(["error" => "Database connection failed", "detail" => $mysqli->connect_error], 500);
}

$mysqli->set_charset("utf8mb4");

$path = trim((string) ($_GET["route"] ?? ""), "/");
if ($path === "") {
    $path = trim((string) parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH), "/");
    $path = preg_replace("#^api\.php/?#", "", $path);
}
$segments = $path === "" ? [] : explode("/", $path);
$method = $_SERVER["REQUEST_METHOD"];

try {
    if ($method === "POST" && route_is($segments, ["auth", "login"])) {
        login($mysqli);
    } elseif ($method === "GET" && route_is($segments, ["dashboard"])) {
        dashboard($mysqli);
    } elseif ($method === "GET" && route_is($segments, ["jobs"])) {
        jobs($mysqli);
    } elseif ($method === "GET" && count($segments) === 2 && $segments[0] === "jobs") {
        job_details($mysqli, (int) $segments[1]);
    } elseif ($method === "PATCH" && count($segments) === 2 && $segments[0] === "jobs") {
        update_job($mysqli, (int) $segments[1]);
    } elseif ($method === "GET" && count($segments) === 3 && $segments[0] === "jobs" && $segments[2] === "candidates") {
        job_candidates($mysqli, (int) $segments[1]);
    } elseif ($method === "PATCH" && count($segments) === 2 && $segments[0] === "applications") {
        update_application($mysqli, (int) $segments[1]);
    } elseif ($method === "GET" && count($segments) === 2 && $segments[0] === "apply") {
        apply_job($mysqli, $segments[1]);
    } elseif ($method === "POST" && count($segments) === 2 && $segments[0] === "apply") {
        submit_application($mysqli, $segments[1]);
    } elseif ($method === "GET" && route_is($segments, ["users"])) {
        users($mysqli);
    } elseif ($method === "POST" && route_is($segments, ["users"])) {
        create_user($mysqli);
    } elseif ($method === "GET" && route_is($segments, ["hr-efficiency"])) {
        hr_efficiency($mysqli);
    } elseif ($method === "GET" && route_is($segments, ["attendance-analytics"])) {
        attendance_analytics($mysqli);
    } else {
        respond(["error" => "Route not found", "path" => $path], 404);
    }
} catch (Throwable $error) {
    respond(["error" => "Server error", "detail" => $error->getMessage()], 500);
}

function route_is(array $segments, array $expected): bool
{
    return $segments === $expected;
}

function input_json(): array
{
    $raw = file_get_contents("php://input");
    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function rows(mysqli $db, string $sql, string $types = "", array $params = []): array
{
    $stmt = $db->prepare($sql);
    if (!$stmt) {
        throw new RuntimeException($db->error);
    }

    if ($types !== "") {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
}

function row(mysqli $db, string $sql, string $types = "", array $params = []): ?array
{
    $all = rows($db, $sql, $types, $params);
    return $all[0] ?? null;
}

function exec_stmt(mysqli $db, string $sql, string $types = "", array $params = []): void
{
    $stmt = $db->prepare($sql);
    if (!$stmt) {
        throw new RuntimeException($db->error);
    }

    if ($types !== "") {
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        throw new RuntimeException($stmt->error);
    }
}

function login(mysqli $db): void
{
    $data = input_json();
    $email = trim((string) ($data["email"] ?? ""));

    if ($email === "") {
        respond(["error" => "Email is required"], 422);
    }

    $user = row(
        $db,
        "SELECT
           u.id,
           u.full_name AS name,
           u.email,
           u.department,
           u.status,
           u.role_id AS roleId,
           CASE WHEN u.role_id = 2 THEN 'hiring_manager' ELSE 'hr_staff' END AS roleKey,
           CASE WHEN u.role_id = 2 THEN 'Hiring Manager' ELSE 'HR Staff' END AS roleName
         FROM users u
         WHERE u.email = ? AND u.status = 'active'
         LIMIT 1",
        "s",
        [$email]
    );

    if (!$user) {
        respond(["error" => "Active user not found"], 401);
    }

    exec_stmt($db, "UPDATE users SET last_login_at = NOW() WHERE id = ?", "i", [(int) $user["id"]]);
    respond(["user" => $user]);
}

function jobs_query(): string
{
    return "SELECT
        j.id,
        j.job_code AS jobCode,
        j.title,
        j.department,
        j.location,
        j.salary_range AS salaryRange,
        j.employment_type AS employmentType,
        j.status,
        j.description,
        j.required_qualification AS requiredQualification,
        j.required_experience AS requiredExperience,
        j.jd_file_name AS jdFileName,
        j.created_at AS createdAt,
        al.public_path AS link,
        COUNT(a.id) AS applicants,
        SUM(CASE WHEN a.submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS newApplicants,
        ROUND(COALESCE(AVG(a.total_score), 0), 2) AS avgScore,
        SUM(CASE WHEN a.application_status = 'shortlisted' THEN 1 ELSE 0 END) AS shortlistedCount,
        SUM(CASE WHEN a.application_status = 'new' THEN 1 ELSE 0 END) AS pendingCount
      FROM jobs j
      LEFT JOIN application_links al ON al.job_id = j.id
      LEFT JOIN applications a ON a.job_id = j.id
      GROUP BY j.id, al.public_path";
}

function dashboard(mysqli $db): void
{
    $jobs = rows($db, jobs_query() . " ORDER BY j.created_at DESC");
    $summary = row(
        $db,
        "SELECT
          (SELECT COUNT(*) FROM jobs) AS totalJobs,
          (SELECT COUNT(*) FROM jobs WHERE status = 'active') AS activeJobs,
          (SELECT COUNT(*) FROM applications) AS totalCandidates,
          (SELECT COUNT(*) FROM applications WHERE application_status = 'new') AS pendingReview,
          (SELECT COUNT(*) FROM applications WHERE application_status = 'shortlisted') AS shortlisted,
          (SELECT COUNT(*) FROM applications WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS recentApplications"
    );
    respond(["summary" => $summary, "jobs" => $jobs]);
}

function jobs(mysqli $db): void
{
    respond(["jobs" => rows($db, jobs_query() . " ORDER BY j.department, j.created_at DESC")]);
}

function job_details(mysqli $db, int $jobId): void
{
    $job = row($db, jobs_query() . " HAVING j.id = ? LIMIT 1", "i", [$jobId]);
    if (!$job) {
        respond(["error" => "Job not found"], 404);
    }

    $job["responsibilities"] = rows($db, "SELECT responsibility FROM job_responsibilities WHERE job_id = ? ORDER BY sort_order", "i", [$jobId]);
    $job["skills"] = rows($db, "SELECT skill_name AS name, skill_type AS type, importance FROM job_required_skills WHERE job_id = ? ORDER BY importance, skill_name", "i", [$jobId]);
    $job["criteria"] = rows($db, "SELECT id, criteria_name AS name, weight, description FROM job_criteria WHERE job_id = ? ORDER BY sort_order", "i", [$jobId]);
    $job["eligibility"] = row($db, "SELECT min_cgpa AS minCgpa, min_years_experience AS minYearsExperience, internship_accepted AS internshipAccepted, required_qualification AS requiredQualification, required_language AS requiredLanguage, required_location AS requiredLocation, max_notice_period_days AS maxNoticePeriodDays FROM eligibility_filters WHERE job_id = ?", "i", [$jobId]);

    respond(["job" => $job]);
}

function update_job(mysqli $db, int $jobId): void
{
    $data = input_json();
    $status = (string) ($data["status"] ?? "");
    $allowed = ["draft", "active", "closed", "archived"];
    if (!in_array($status, $allowed, true)) {
        respond(["error" => "Invalid job status"], 422);
    }

    exec_stmt($db, "UPDATE jobs SET status = ?, closed_at = IF(? = 'closed', NOW(), closed_at) WHERE id = ?", "ssi", [$status, $status, $jobId]);
    job_details($db, $jobId);
}

function job_candidates(mysqli $db, int $jobId): void
{
    $job = row($db, "SELECT id, job_code AS jobCode, title, department FROM jobs WHERE id = ?", "i", [$jobId]);
    if (!$job) {
        respond(["error" => "Job not found"], 404);
    }

    $candidates = rows(
        $db,
        "SELECT
          a.id AS applicationId,
          c.id,
          c.full_name AS name,
          c.email,
          c.phone,
          c.current_cgpa AS cgpa,
          c.years_experience AS yearsExperience,
          c.notice_period_days AS noticePeriodDays,
          c.current_location AS currentLocation,
          a.submitted_at AS appliedDate,
          a.rank_no AS rank,
          a.application_status AS status,
          a.is_shortlisted AS isShortlisted,
          a.interview_sent_at AS interviewSentAt,
          a.eligibility_status AS eligibilityStatus,
          a.total_score AS score,
          a.ai_summary AS summary,
          r.stored_file_path AS resumeUrl,
          r.original_file_name AS resumeFileName
        FROM applications a
        JOIN candidates c ON c.id = a.candidate_id
        LEFT JOIN resumes r ON r.application_id = a.id
        WHERE a.job_id = ?
        ORDER BY
          CASE WHEN a.rank_no IS NULL THEN 999999 ELSE a.rank_no END,
          a.total_score DESC",
        "i",
        [$jobId]
    );

    foreach ($candidates as &$candidate) {
        $candidate["skills"] = rows(
            $db,
            "SELECT DISTINCT sbi.requirement_text AS name
             FROM candidate_scores cs
             JOIN score_breakdowns sb ON sb.candidate_score_id = cs.id
             JOIN score_breakdown_items sbi ON sbi.score_breakdown_id = sb.id
             WHERE cs.application_id = ? AND sbi.match_status IN ('matched', 'partial')
             ORDER BY sbi.requirement_text",
            "i",
            [(int) $candidate["applicationId"]]
        );
        $candidate["scoreBreakdown"] = candidate_breakdown($db, (int) $candidate["applicationId"]);
        $candidate["jobHistory"] = rows(
            $db,
            "SELECT j.id AS jobId, j.title AS jobTitle, j.department, cjh.score, cjh.rank_no AS rank, cjh.status
             FROM candidate_job_history cjh
             JOIN jobs j ON j.id = cjh.job_id
             WHERE cjh.candidate_id = ? AND cjh.application_id <> ?
             ORDER BY cjh.recorded_at DESC",
            "ii",
            [(int) $candidate["id"], (int) $candidate["applicationId"]]
        );
    }

    respond(["job" => $job, "candidates" => $candidates]);
}

function candidate_breakdown(mysqli $db, int $applicationId): array
{
    $breakdowns = rows(
        $db,
        "SELECT sb.id, jc.criteria_name AS title, sb.raw_score AS criteriaScore, sb.weight, sb.weighted_score AS weightedScore, sb.explanation AS justification
         FROM candidate_scores cs
         JOIN score_breakdowns sb ON sb.candidate_score_id = cs.id
         JOIN job_criteria jc ON jc.id = sb.criteria_id
         WHERE cs.application_id = ?
         ORDER BY jc.sort_order",
        "i",
        [$applicationId]
    );

    foreach ($breakdowns as &$breakdown) {
        $breakdown["items"] = rows(
            $db,
            "SELECT requirement_text AS requirement, match_status AS matchStatus, evidence_text AS evidence, item_score AS itemScore
             FROM score_breakdown_items
             WHERE score_breakdown_id = ?
             ORDER BY id",
            "i",
            [(int) $breakdown["id"]]
        );
    }

    return $breakdowns;
}

function update_application(mysqli $db, int $applicationId): void
{
    $data = input_json();
    $status = (string) ($data["status"] ?? "");
    $allowed = ["new", "reviewed", "shortlisted", "interview", "rejected", "filtered_out"];

    if (!in_array($status, $allowed, true)) {
        respond(["error" => "Invalid application status"], 422);
    }

    if ($status === "shortlisted") {
        exec_stmt($db, "UPDATE applications SET is_shortlisted = 1, application_status = IF(application_status = 'interview', application_status, 'shortlisted'), reviewed_at = NOW() WHERE id = ?", "i", [$applicationId]);
    } elseif ($status === "reviewed") {
        exec_stmt($db, "UPDATE applications SET is_shortlisted = 0, application_status = IF(application_status = 'interview', application_status, 'reviewed'), reviewed_at = NOW() WHERE id = ?", "i", [$applicationId]);
    } elseif ($status === "interview") {
        exec_stmt($db, "UPDATE applications SET is_shortlisted = 1, interview_sent_at = COALESCE(interview_sent_at, NOW()), application_status = 'interview', reviewed_at = NOW() WHERE id = ?", "i", [$applicationId]);
    } elseif ($status === "rejected") {
        exec_stmt($db, "UPDATE applications SET application_status = 'rejected', is_shortlisted = 0, reviewed_at = NOW() WHERE id = ?", "i", [$applicationId]);
    } else {
        exec_stmt($db, "UPDATE applications SET application_status = ?, reviewed_at = NOW() WHERE id = ?", "si", [$status, $applicationId]);
    }

    $updated = row($db, "SELECT application_status, is_shortlisted, interview_sent_at FROM applications WHERE id = ?", "i", [$applicationId]);
    $historyStatus = $updated && (int) $updated["is_shortlisted"] === 1 && $updated["application_status"] !== "interview"
        ? "shortlisted"
        : $status;
    exec_stmt($db, "UPDATE candidate_job_history SET status = ? WHERE application_id = ?", "si", [$historyStatus, $applicationId]);
    respond(["ok" => true, "application" => $updated ?: []]);
}

function apply_job(mysqli $db, string $jobCode): void
{
    $job = row(
        $db,
        "SELECT j.id, j.job_code AS jobCode, j.title, j.department, j.location, j.salary_range AS salaryRange, j.employment_type AS employmentType
         FROM jobs j
         JOIN application_links al ON al.job_id = j.id
         WHERE j.job_code = ? AND j.status = 'active' AND al.status = 'active'
         LIMIT 1",
        "s",
        [$jobCode]
    );

    if (!$job) {
        respond(["error" => "Application link not found or inactive"], 404);
    }

    respond(["job" => $job]);
}

function submit_application(mysqli $db, string $jobCode): void
{
    $data = input_json();
    $job = row($db, "SELECT id FROM jobs WHERE job_code = ? AND status = 'active'", "s", [$jobCode]);
    if (!$job) {
        respond(["error" => "Job is not open"], 404);
    }

    $fullName = trim((string) ($data["fullName"] ?? ""));
    $email = trim((string) ($data["email"] ?? ""));
    $phone = trim((string) ($data["phone"] ?? ""));
    $cgpa = (float) ($data["cgpa"] ?? 0);
    $noticePeriodDays = (int) ($data["noticePeriodDays"] ?? 0);

    if ($fullName === "" || $email === "" || $phone === "") {
        respond(["error" => "Full name, email, and phone are required"], 422);
    }

    exec_stmt(
        $db,
        "INSERT INTO candidates (full_name, email, phone, current_cgpa, years_experience, notice_period_days)
         VALUES (?, ?, ?, ?, NULL, ?)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), current_cgpa = VALUES(current_cgpa), notice_period_days = VALUES(notice_period_days)",
        "sssdi",
        [$fullName, $email, $phone, $cgpa, $noticePeriodDays]
    );

    $candidate = row($db, "SELECT id FROM candidates WHERE email = ?", "s", [$email]);
    $existing = row($db, "SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?", "ii", [(int) $job["id"], (int) $candidate["id"]]);

    if ($existing) {
        respond(["error" => "This email has already applied for this job."], 409);
    }

    $eligibility = row($db, "SELECT min_cgpa AS minCgpa, max_notice_period_days AS maxNoticePeriodDays FROM eligibility_filters WHERE job_id = ?", "i", [(int) $job["id"]]);
    $eligible = (!$eligibility || ($cgpa >= (float) $eligibility["minCgpa"] && ($noticePeriodDays === 0 || $noticePeriodDays <= (int) $eligibility["maxNoticePeriodDays"])));
    $status = $eligible ? "new" : "filtered_out";
    $eligibilityStatus = $eligible ? "eligible" : "filtered_out";
    $score = $eligible ? 72.00 : 55.00;

    exec_stmt(
        $db,
        "INSERT INTO applications (job_id, candidate_id, application_link_id, application_status, eligibility_status, total_score, ai_summary)
         VALUES (?, ?, (SELECT id FROM application_links WHERE job_id = ?), ?, ?, ?, ?)",
        "iiissds",
        [(int) $job["id"], (int) $candidate["id"], (int) $job["id"], $status, $eligibilityStatus, $score, "$fullName submitted an application and is ready for HR review."]
    );

    $applicationId = $db->insert_id;
    exec_stmt(
        $db,
        "INSERT INTO resumes (application_id, original_file_name, stored_file_path, file_mime_type, file_size_bytes, parsing_status)
         VALUES (?, ?, ?, 'application/pdf', 0, 'pending')",
        "iss",
        [$applicationId, (string) ($data["resumeFileName"] ?? "resume.pdf"), "/uploads/resumes/pending.pdf"]
    );
    exec_stmt($db, "INSERT INTO candidate_scores (application_id, total_raw_score, total_weighted_score) VALUES (?, ?, ?)", "idd", [$applicationId, $score, $score]);
    exec_stmt($db, "INSERT INTO candidate_job_history (candidate_id, application_id, job_id, score, rank_no, status) VALUES (?, ?, ?, ?, NULL, ?)", "iiids", [(int) $candidate["id"], $applicationId, (int) $job["id"], $score, $status]);

    respond(["ok" => true, "applicationId" => $applicationId], 201);
}

function users(mysqli $db): void
{
    respond([
        "users" => rows(
            $db,
            "SELECT
               u.id,
               u.full_name AS name,
               u.email,
               u.department,
               u.phone,
               u.status,
               u.role_id AS roleId,
               CASE WHEN u.role_id = 2 THEN 'hiring_manager' ELSE 'hr_staff' END AS roleKey,
               CASE WHEN u.role_id = 2 THEN 'Hiring Manager' ELSE 'HR Staff' END AS roleName,
               u.last_login_at AS lastLoginAt,
               u.created_at AS createdAt
             FROM users u
             ORDER BY u.role_id, u.full_name"
        )
    ]);
}

function create_user(mysqli $db): void
{
    $data = input_json();
    $fullName = trim((string) ($data["fullName"] ?? ""));
    $email = trim((string) ($data["email"] ?? ""));
    $roleId = (int) ($data["roleId"] ?? 0);
    $status = (string) ($data["status"] ?? "active");
    $temporaryPassword = (string) ($data["temporaryPassword"] ?? "");

    if ($fullName === "" || $email === "") {
        respond(["error" => "Full name and email are required"], 422);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(["error" => "Valid email is required"], 422);
    }

    if (!in_array($roleId, [1, 2], true)) {
        respond(["error" => "Role must be HR Staff or Hiring Manager"], 422);
    }

    if (!in_array($status, ["active", "inactive"], true)) {
        respond(["error" => "Invalid user status"], 422);
    }

    if (strlen($temporaryPassword) < 6) {
        respond(["error" => "Temporary password must be at least 6 characters"], 422);
    }

    $existing = row($db, "SELECT id FROM users WHERE email = ? LIMIT 1", "s", [$email]);
    if ($existing) {
        respond(["error" => "Email is already used by another user"], 409);
    }

    $passwordHash = password_hash($temporaryPassword, PASSWORD_DEFAULT);

    exec_stmt(
        $db,
        "INSERT INTO users (role_id, full_name, email, password_hash, department, phone, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        "issssss",
        [
            $roleId,
            $fullName,
            $email,
            $passwordHash,
            (string) ($data["department"] ?? "Human Resources"),
            (string) ($data["phone"] ?? ""),
            $status,
        ]
    );

    $userId = $db->insert_id;
    $user = row(
        $db,
        "SELECT
           u.id,
           u.full_name AS name,
           u.email,
           u.department,
           u.phone,
           u.status,
           u.role_id AS roleId,
           CASE WHEN u.role_id = 2 THEN 'hiring_manager' ELSE 'hr_staff' END AS roleKey,
           CASE WHEN u.role_id = 2 THEN 'Hiring Manager' ELSE 'HR Staff' END AS roleName,
           u.last_login_at AS lastLoginAt,
           u.created_at AS createdAt
         FROM users u
         WHERE u.id = ?
         LIMIT 1",
        "i",
        [$userId]
    );

    respond(["user" => $user], 201);
}

function hr_efficiency(mysqli $db): void
{
    $summary = rows(
        $db,
        "SELECT
          u.full_name AS hrName,
          COUNT(a.id) AS totalCandidates,
          ROUND(AVG(TIMESTAMPDIFF(HOUR, a.submitted_at, COALESCE(a.reviewed_at, NOW())) / 24), 1) AS avgProcessingDays,
          SUM(CASE WHEN a.application_status IN ('shortlisted', 'interview') THEN 1 ELSE 0 END) AS shortlisted,
          SUM(CASE WHEN a.application_status = 'rejected' THEN 1 ELSE 0 END) AS rejected
         FROM users u
         LEFT JOIN jobs j ON j.created_by_user_id = u.id
         LEFT JOIN applications a ON a.job_id = j.id
         WHERE u.role_id IN (1, 2)
         GROUP BY u.id
         ORDER BY totalCandidates DESC"
    );
    $details = rows(
        $db,
        "SELECT
          c.full_name AS candidateName,
          j.title AS jobTitle,
          DATE(a.submitted_at) AS applicationDate,
          DATE(COALESCE(a.reviewed_at, a.submitted_at)) AS interviewDate,
          GREATEST(1, TIMESTAMPDIFF(DAY, a.submitted_at, COALESCE(a.reviewed_at, NOW()))) AS processingDays,
          u.full_name AS hrAssigned
         FROM applications a
         JOIN candidates c ON c.id = a.candidate_id
         JOIN jobs j ON j.id = a.job_id
         JOIN users u ON u.id = j.created_by_user_id
         ORDER BY a.submitted_at DESC"
    );

    respond(["data" => $summary, "details" => $details]);
}

function attendance_analytics(mysqli $db): void
{
    $records = rows(
        $db,
        "SELECT
          a.id AS candidateId,
          c.full_name AS candidateName,
          j.title AS jobTitle,
          DATE(COALESCE(a.reviewed_at, a.submitted_at)) AS scheduledDate,
          CASE
            WHEN a.application_status = 'interview' THEN 'attended'
            WHEN a.application_status = 'rejected' THEN 'no-show'
            ELSE 'rescheduled'
          END AS status,
          CASE WHEN a.application_status = 'interview' THEN 1 ELSE 0 END AS onTime,
          'Recorded from recruitment workflow database.' AS notes
         FROM applications a
         JOIN candidates c ON c.id = a.candidate_id
         JOIN jobs j ON j.id = a.job_id
         WHERE a.application_status IN ('interview', 'rejected', 'shortlisted')
         ORDER BY COALESCE(a.reviewed_at, a.submitted_at) DESC"
    );

    respond(["records" => $records]);
}
