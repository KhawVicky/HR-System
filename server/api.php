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
    } elseif ($method === "GET" && route_is($segments, ["applications"])) {
        applications($mysqli);
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
    } elseif ($method === "GET" && count($segments) === 3 && $segments[0] === "users" && $segments[2] === "actions") {
        user_action_logs($mysqli, (int) $segments[1]);
    } elseif ($method === "GET" && route_is($segments, ["email-templates"])) {
        email_templates($mysqli);
    } elseif ($method === "POST" && route_is($segments, ["email-templates"])) {
        update_email_templates($mysqli);
    } elseif ($method === "POST" && route_is($segments, ["email-templates", "interview-attachment"])) {
        upload_interview_attachment($mysqli);
    } elseif ($method === "GET" && route_is($segments, ["notifications"])) {
        notifications($mysqli);
    } elseif ($method === "PATCH" && route_is($segments, ["notifications", "read"])) {
        mark_notifications_read($mysqli);
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

function input_data(): array
{
    $contentType = (string) ($_SERVER["CONTENT_TYPE"] ?? "");
    if (stripos($contentType, "multipart/form-data") !== false) {
        return $_POST;
    }

    return input_json();
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
           r.role_name AS roleName
         FROM users u
         JOIN roles r ON r.id = u.role_id
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
        j.published_at AS publishedAt,
        j.created_at AS createdAt,
        al.public_path AS link,
        COUNT(a.id) AS applicants,
        SUM(CASE WHEN a.submitted_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) AS newApplicants,
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
          (SELECT COUNT(*) FROM applications WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) AS recentApplications"
    );
    respond(["summary" => $summary, "jobs" => $jobs]);
}

function jobs(mysqli $db): void
{
    respond(["jobs" => rows($db, jobs_query() . " ORDER BY j.department, j.created_at DESC")]);
}

function applications(mysqli $db): void
{
    $filter = (string) ($_GET["filter"] ?? "all");
    $where = "";

    if ($filter === "last24") {
        $where = "WHERE a.submitted_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
    } elseif ($filter === "pending") {
        $where = "WHERE a.application_status = 'new'";
    }

    $applications = rows(
        $db,
        "SELECT
           a.id AS applicationId,
           c.full_name AS candidateName,
           c.email AS candidateEmail,
           j.id AS jobId,
           j.title AS jobTitle,
           j.department AS jobDepartment,
           a.submitted_at AS submittedDate,
           a.eligibility_status AS eligibilityStatus,
           a.total_score AS score,
           a.application_status AS status,
           CASE
             WHEN a.total_score IS NULL THEN 'Pending Score'
             ELSE 'Scored'
           END AS scoreStatus
         FROM applications a
         JOIN candidates c ON c.id = a.candidate_id
         JOIN jobs j ON j.id = a.job_id
         {$where}
         ORDER BY a.submitted_at DESC, a.id DESC"
    );

    respond(["applications" => $applications]);
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
          a.assigned_hr_user_id AS assignedHrUserId,
          assigned_user.full_name AS assignedHrName,
          latest_email.email_type AS lastEmailType,
          latest_email.sent_at AS lastEmailSentAt,
          email_sender.full_name AS lastEmailSentBy,
          a.eligibility_status AS eligibilityStatus,
          a.total_score AS score,
          a.ai_summary AS summary,
          (
            SELECT r1.stored_file_path
            FROM resumes r1
            WHERE r1.application_id = a.id
            ORDER BY r1.uploaded_at DESC, r1.id DESC
            LIMIT 1
          ) AS resumeUrl,
          (
            SELECT r1.original_file_name
            FROM resumes r1
            WHERE r1.application_id = a.id
            ORDER BY r1.uploaded_at DESC, r1.id DESC
            LIMIT 1
          ) AS resumeFileName,
          (
            SELECT COUNT(*) + 1
            FROM application_submission_history ash
            WHERE ash.application_id = a.id
          ) AS currentSubmissionNo
        FROM applications a
        JOIN candidates c ON c.id = a.candidate_id
        LEFT JOIN users assigned_user ON assigned_user.id = a.assigned_hr_user_id
        LEFT JOIN (
          SELECT el.*
          FROM email_logs el
          JOIN (
            SELECT application_id, MAX(id) AS latest_email_id
            FROM email_logs
            WHERE status = 'sent'
            GROUP BY application_id
          ) latest ON latest.latest_email_id = el.id
        ) latest_email ON latest_email.application_id = a.id
        LEFT JOIN users email_sender ON email_sender.id = latest_email.sent_by_user_id
        WHERE a.job_id = ?
        ORDER BY
          CASE WHEN a.rank_no IS NULL THEN 999999 ELSE a.rank_no END,
          a.total_score DESC",
        "i",
        [$jobId]
    );

    foreach ($candidates as &$candidate) {
        if (isset($candidate["resumeUrl"])) {
            $candidate["resumeUrl"] = public_file_url((string) $candidate["resumeUrl"]);
        }
        $candidate["skills"] = rows(
            $db,
            "SELECT DISTINCT sbi.requirement_text AS name
             FROM score_breakdowns sb
             JOIN score_breakdown_items sbi ON sbi.score_breakdown_id = sb.id
             WHERE sb.application_id = ? AND sbi.match_status IN ('matched', 'partial')
             ORDER BY sbi.requirement_text",
            "i",
            [(int) $candidate["applicationId"]]
        );
        $candidate["currentSubmissionLabel"] = ordinal_submission_label((int) $candidate["currentSubmissionNo"]);
        $candidate["documents"] = application_documents($db, (int) $candidate["applicationId"]);
        $candidate["scoreBreakdown"] = candidate_breakdown($db, (int) $candidate["applicationId"]);
        $submissionHistory = rows(
            $db,
            "SELECT
               CONCAT('submission-', ash.id) AS historyKey,
               ash.job_id AS jobId,
               j.title AS jobTitle,
               j.department,
               ash.original_submitted_at AS submittedDate,
               ash.previous_score AS score,
               NULL AS rank,
               CONCAT(
                 ash.submission_no,
                 CASE
                   WHEN ash.submission_no % 100 BETWEEN 11 AND 13 THEN 'th'
                   WHEN ash.submission_no % 10 = 1 THEN 'st'
                   WHEN ash.submission_no % 10 = 2 THEN 'nd'
                   WHEN ash.submission_no % 10 = 3 THEN 'rd'
                   ELSE 'th'
                 END,
                 ' Submission'
               ) AS status
             FROM application_submission_history ash
             JOIN jobs j ON j.id = ash.job_id
             WHERE ash.application_id = ?
             ORDER BY ash.submission_no DESC, ash.recorded_at DESC",
            "i",
            [(int) $candidate["applicationId"]]
        );
        $otherJobHistory = rows(
            $db,
            "SELECT
               CONCAT('job-', a.id) AS historyKey,
               j.id AS jobId,
               j.title AS jobTitle,
               j.department,
               a.submitted_at AS submittedDate,
               a.total_score AS score,
               CASE
                 WHEN a.application_status IN ('filtered_out', 'rejected') THEN NULL
                 ELSE COALESCE(
                   a.rank_no,
                   (
                     SELECT COUNT(*) + 1
                     FROM applications ranked
                     WHERE ranked.job_id = a.job_id
                       AND ranked.application_status IN ('new', 'reviewed', 'shortlisted', 'interview')
                       AND COALESCE(ranked.total_score, 0) > COALESCE(a.total_score, 0)
                   )
                 )
               END AS rank,
               CASE
                 WHEN a.is_shortlisted = 1 AND a.application_status <> 'interview' THEN 'shortlisted'
                 ELSE a.application_status
             END AS status
             FROM applications a
             JOIN jobs j ON j.id = a.job_id
             WHERE a.candidate_id = ? AND a.id <> ?
             ORDER BY a.submitted_at DESC",
            "ii",
            [(int) $candidate["id"], (int) $candidate["applicationId"]]
        );
        $candidate["jobHistory"] = array_merge($submissionHistory, $otherJobHistory);
    }

    respond(["job" => $job, "candidates" => $candidates]);
}

function candidate_breakdown(mysqli $db, int $applicationId): array
{
    $breakdowns = rows(
        $db,
        "SELECT sb.id, jc.criteria_name AS title, sb.raw_score AS criteriaScore, sb.weight, sb.weighted_score AS weightedScore, sb.explanation AS justification
         FROM score_breakdowns sb
         JOIN job_criteria jc ON jc.id = sb.criteria_id
         WHERE sb.application_id = ?
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

function application_documents(mysqli $db, int $applicationId): array
{
    $documents = rows(
        $db,
        "SELECT
           id,
           original_file_name AS fileName,
           stored_file_path AS fileUrl,
           file_mime_type AS mimeType,
           file_size_bytes AS fileSize,
           uploaded_at AS uploadedAt
         FROM resumes
         WHERE application_id = ?
         ORDER BY uploaded_at DESC, id DESC",
        "i",
        [$applicationId]
    );

    foreach ($documents as &$document) {
        $document["fileUrl"] = public_file_url((string) $document["fileUrl"]);
    }

    return $documents;
}

function public_file_url(string $path): string
{
    if ($path === "" || preg_match("#^https?://#i", $path)) {
        return $path;
    }

    $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
    $host = (string) ($_SERVER["HTTP_HOST"] ?? "localhost");
    $basePath = rtrim(str_replace("\\", "/", dirname((string) ($_SERVER["SCRIPT_NAME"] ?? "/uwc-hr-api/api.php"))), "/");

    return "{$scheme}://{$host}{$basePath}" . (substr($path, 0, 1) === "/" ? $path : "/{$path}");
}

function update_application(mysqli $db, int $applicationId): void
{
    $data = input_json();
    $status = (string) ($data["status"] ?? "");
    $actionUserId = (int) ($data["actionUserId"] ?? 0);
    $interviewDateTime = trim((string) ($data["interviewDateTime"] ?? ""));
    $emailAction = filter_var($data["emailAction"] ?? false, FILTER_VALIDATE_BOOLEAN);
    $allowed = ["new", "reviewed", "shortlisted", "interview", "rejected", "filtered_out"];

    if (!in_array($status, $allowed, true)) {
        respond(["error" => "Invalid application status"], 422);
    }

    $before = row(
        $db,
        "SELECT application_status, is_shortlisted, interview_sent_at FROM applications WHERE id = ?",
        "i",
        [$applicationId]
    );

    if ($status === "shortlisted") {
        exec_stmt($db, "UPDATE applications SET assigned_hr_user_id = COALESCE(assigned_hr_user_id, (SELECT id FROM users WHERE id = NULLIF(?, 0) LIMIT 1)), is_shortlisted = 1, application_status = IF(application_status = 'interview', application_status, 'shortlisted'), reviewed_at = NOW() WHERE id = ?", "ii", [$actionUserId, $applicationId]);
    } elseif ($status === "reviewed") {
        exec_stmt($db, "UPDATE applications SET assigned_hr_user_id = COALESCE(assigned_hr_user_id, (SELECT id FROM users WHERE id = NULLIF(?, 0) LIMIT 1)), is_shortlisted = 0, application_status = IF(application_status = 'interview', application_status, 'reviewed'), reviewed_at = NOW() WHERE id = ?", "ii", [$actionUserId, $applicationId]);
    } elseif ($status === "interview") {
        if ($emailAction) {
            create_email_sent_notification($db, $applicationId, $actionUserId, "interview", $interviewDateTime);
        }
        exec_stmt($db, "UPDATE applications SET assigned_hr_user_id = COALESCE(assigned_hr_user_id, (SELECT id FROM users WHERE id = NULLIF(?, 0) LIMIT 1)), is_shortlisted = 1, interview_sent_at = COALESCE(interview_sent_at, NOW()), application_status = 'interview', reviewed_at = NOW() WHERE id = ?", "ii", [$actionUserId, $applicationId]);
    } elseif ($status === "rejected") {
        if ($emailAction) {
            create_email_sent_notification($db, $applicationId, $actionUserId, "reject", "");
        }
        exec_stmt($db, "UPDATE applications SET assigned_hr_user_id = COALESCE(assigned_hr_user_id, (SELECT id FROM users WHERE id = NULLIF(?, 0) LIMIT 1)), application_status = 'rejected', is_shortlisted = 0, reviewed_at = NOW() WHERE id = ?", "ii", [$actionUserId, $applicationId]);
    } else {
        exec_stmt($db, "UPDATE applications SET assigned_hr_user_id = COALESCE(assigned_hr_user_id, (SELECT id FROM users WHERE id = NULLIF(?, 0) LIMIT 1)), application_status = ?, reviewed_at = NOW() WHERE id = ?", "isi", [$actionUserId, $status, $applicationId]);
    }

    $updated = row($db, "SELECT application_status, is_shortlisted, interview_sent_at, assigned_hr_user_id FROM applications WHERE id = ?", "i", [$applicationId]);
    log_application_action($db, $applicationId, $actionUserId, $status, $emailAction, $interviewDateTime, $before ?: [], $updated ?: []);
    respond(["ok" => true, "application" => $updated ?: []]);
}

function log_application_action(
    mysqli $db,
    int $applicationId,
    int $userId,
    string $status,
    bool $emailAction,
    string $interviewDateTime,
    array $before,
    array $after
): void {
    if ($userId <= 0) {
        return;
    }

    $application = row(
        $db,
        "SELECT a.job_id AS jobId, a.candidate_id AS candidateId, j.title AS jobTitle, c.full_name AS candidateName
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         JOIN candidates c ON c.id = a.candidate_id
         WHERE a.id = ?",
        "i",
        [$applicationId]
    );

    if (!$application) {
        return;
    }

    $actionType = "status_update";
    $actionLabel = "Updated Application Status";
    $details = "";

    if ($status === "reviewed") {
        $actionType = "review_candidate";
        $actionLabel = "Reviewed Candidate";
        $details = "Opened candidate details and marked the application as reviewed.";
    } elseif ($status === "shortlisted") {
        $actionType = "shortlist_candidate";
        $actionLabel = "Shortlisted Candidate";
        $details = "Marked the candidate as shortlisted.";
    } elseif ($status === "interview") {
        $actionType = "send_interview_email";
        $actionLabel = "Sent Interview Email";
        $details = $emailAction
            ? "Sent interview email" . ($interviewDateTime !== "" ? " with interview date/time: {$interviewDateTime}." : ".")
            : "Moved the candidate into interview status.";
    } elseif ($status === "rejected") {
        $actionType = "reject_candidate";
        $actionLabel = "Rejected Candidate";
        $details = $emailAction ? "Rejected the candidate and sent rejection email." : "Rejected the candidate.";
    } elseif ($status === "filtered_out") {
        $actionType = "filter_out_candidate";
        $actionLabel = "Filtered Out Candidate";
        $details = "Marked the candidate as filtered out.";
    }

    $beforeStatus = (string) ($before["application_status"] ?? "");
    $afterStatus = (string) ($after["application_status"] ?? "");
    if ($beforeStatus !== "" || $afterStatus !== "") {
        $details .= ($details !== "" ? " " : "") . "Status: " . ($beforeStatus ?: "-") . " -> " . ($afterStatus ?: "-") . ".";
    }

    exec_stmt(
        $db,
        "INSERT INTO hr_action_logs (user_id, application_id, job_id, candidate_id, action_type, action_label, details)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        "iiiisss",
        [
            $userId,
            $applicationId,
            (int) $application["jobId"],
            (int) $application["candidateId"],
            $actionType,
            $actionLabel,
            $details,
        ]
    );
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
    $data = input_data();
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

    $candidate = row($db, "SELECT id FROM candidates WHERE email = ?", "s", [$email]);
    $existing = $candidate
        ? row($db, "SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?", "ii", [(int) $job["id"], (int) $candidate["id"]])
        : null;

    $eligibility = row($db, "SELECT min_cgpa AS minCgpa, max_notice_period_days AS maxNoticePeriodDays FROM eligibility_filters WHERE job_id = ?", "i", [(int) $job["id"]]);
    $eligible = (!$eligibility || ($cgpa >= (float) $eligibility["minCgpa"] && ($noticePeriodDays === 0 || $noticePeriodDays <= (int) $eligibility["maxNoticePeriodDays"])));
    $status = $eligible ? "new" : "filtered_out";
    $eligibilityStatus = $eligible ? "eligible" : "filtered_out";
    $score = $eligible ? 72.00 : 55.00;

    if ($existing) {
        $replaceExisting = filter_var($data["replaceExisting"] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (!$replaceExisting) {
            respond([
                "error" => "This email has already applied for this job.",
                "duplicate" => true,
                "applicationId" => (int) $existing["id"],
            ], 409);
        }

        exec_stmt(
            $db,
            "INSERT INTO candidates (full_name, email, phone, current_cgpa, years_experience, notice_period_days)
             VALUES (?, ?, ?, ?, NULL, ?)
             ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), current_cgpa = VALUES(current_cgpa), notice_period_days = VALUES(notice_period_days)",
            "sssdi",
            [$fullName, $email, $phone, $cgpa, $noticePeriodDays]
        );

        replace_existing_application(
            $db,
            (int) $existing["id"],
            (int) $candidate["id"],
            (int) $job["id"],
            $status,
            $eligibilityStatus,
            $score,
            $fullName,
            (string) ($data["resumeFileName"] ?? "resume.pdf")
        );
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

    exec_stmt(
        $db,
        "INSERT INTO applications (job_id, candidate_id, application_link_id, application_status, eligibility_status, total_score, ai_summary)
         VALUES (?, ?, (SELECT id FROM application_links WHERE job_id = ?), ?, ?, ?, ?)",
        "iiissds",
        [(int) $job["id"], (int) $candidate["id"], (int) $job["id"], $status, $eligibilityStatus, $score, "$fullName submitted an application and is ready for HR review."]
    );

    $applicationId = $db->insert_id;
    save_uploaded_documents($db, $applicationId, (string) ($data["resumeFileName"] ?? "resume.pdf"));
    create_score_breakdown($db, $applicationId, (int) $job["id"], $score);
    create_application_notifications($db, $applicationId, $fullName, (int) $job["id"], false);
    respond(["ok" => true, "applicationId" => $applicationId], 201);
}

function replace_existing_application(
    mysqli $db,
    int $applicationId,
    int $candidateId,
    int $jobId,
    string $status,
    string $eligibilityStatus,
    float $score,
    string $fullName,
    string $fallbackResumeName
): void {
    $existing = row(
        $db,
        "SELECT
           a.application_status,
           a.eligibility_status,
           a.total_score,
           a.rank_no,
           a.assigned_hr_user_id,
           a.ai_summary,
           a.submitted_at,
           r.original_file_name AS resumeFileName,
           r.stored_file_path AS resumeUrl
         FROM applications a
         LEFT JOIN resumes r ON r.application_id = a.id
         WHERE a.id = ?",
        "i",
        [$applicationId]
    );
    if (!$existing) {
        respond(["error" => "Existing application not found"], 404);
    }

    $historyCount = row($db, "SELECT COUNT(*) AS total FROM application_submission_history WHERE application_id = ?", "i", [$applicationId]);
    $submissionNo = (int) ($historyCount["total"] ?? 0) + 1;

    $db->begin_transaction();
    try {
        exec_stmt(
            $db,
            "INSERT INTO application_submission_history (
               candidate_id, application_id, job_id, submission_no,
               previous_application_status, previous_eligibility_status,
               previous_score, previous_rank_no, previous_assigned_hr_user_id, previous_resume_file_name,
               previous_resume_url, previous_ai_summary, original_submitted_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "iiiissdiissss",
            [
                $candidateId,
                $applicationId,
                $jobId,
                $submissionNo,
                (string) $existing["application_status"],
                (string) $existing["eligibility_status"],
                $existing["total_score"] === null ? null : (float) $existing["total_score"],
                $existing["rank_no"] === null ? null : (int) $existing["rank_no"],
                $existing["assigned_hr_user_id"] === null ? null : (int) $existing["assigned_hr_user_id"],
                (string) ($existing["resumeFileName"] ?? ""),
                (string) ($existing["resumeUrl"] ?? ""),
                (string) ($existing["ai_summary"] ?? ""),
                (string) ($existing["submitted_at"] ?? ""),
            ]
        );

        exec_stmt(
            $db,
            "UPDATE applications
             SET application_status = ?, is_shortlisted = 0, interview_sent_at = NULL,
                 assigned_hr_user_id = NULL, eligibility_status = ?, total_score = ?, rank_no = NULL,
                 ai_summary = ?, submitted_at = NOW(), reviewed_at = NULL
             WHERE id = ?",
            "ssdsi",
            [$status, $eligibilityStatus, $score, "$fullName resubmitted an application and is ready for HR review.", $applicationId]
        );

        exec_stmt(
            $db,
            "DELETE FROM resumes WHERE application_id = ?",
            "i",
            [$applicationId]
        );
        save_uploaded_documents($db, $applicationId, $fallbackResumeName);

        exec_stmt(
            $db,
            "DELETE FROM score_breakdowns WHERE application_id = ?",
            "i",
            [$applicationId]
        );
        create_score_breakdown($db, $applicationId, $jobId, $score);
        create_application_notifications($db, $applicationId, $fullName, $jobId, true);

        $db->commit();
    } catch (Throwable $error) {
        $db->rollback();
        throw $error;
    }

    respond(["ok" => true, "applicationId" => $applicationId, "replaced" => true], 200);
}

function create_score_breakdown(mysqli $db, int $applicationId, int $jobId, float $score): void
{
    $criteria = rows(
        $db,
        "SELECT id, criteria_name, weight, sort_order FROM job_criteria WHERE job_id = ? AND is_active = 1 ORDER BY sort_order",
        "i",
        [$jobId]
    );

    foreach ($criteria as $criterion) {
        $rawScore = max(0, min(100, $score));
        $weight = (float) $criterion["weight"];
        $weightedScore = round(($rawScore / 100) * $weight, 2);
        $criteriaName = (string) $criterion["criteria_name"];

        exec_stmt(
            $db,
            "INSERT INTO score_breakdowns (application_id, criteria_id, raw_score, weight, weighted_score, explanation)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               raw_score = VALUES(raw_score),
               weight = VALUES(weight),
               weighted_score = VALUES(weighted_score),
               explanation = VALUES(explanation)",
            "iiddds",
            [
                $applicationId,
                (int) $criterion["id"],
                $rawScore,
                $weight,
                $weightedScore,
                "$criteriaName evaluated from submitted resume information and job requirements.",
            ]
        );

        $breakdown = row(
            $db,
            "SELECT id FROM score_breakdowns WHERE application_id = ? AND criteria_id = ?",
            "ii",
            [$applicationId, (int) $criterion["id"]]
        );
        if ($breakdown) {
            exec_stmt(
                $db,
                "INSERT INTO score_breakdown_items (score_breakdown_id, requirement_text, match_status, evidence_text, item_score)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   match_status = VALUES(match_status),
                   evidence_text = VALUES(evidence_text),
                   item_score = VALUES(item_score)",
                "isssd",
                [
                    (int) $breakdown["id"],
                    $criteriaName,
                    $rawScore >= 80 ? "matched" : ($rawScore >= 60 ? "partial" : "missing"),
                    "The resume was submitted through the application form and is ready for HR review.",
                    $rawScore,
                ]
            );
        }
    }
}

function cleanup_old_notifications(mysqli $db): void
{
    exec_stmt($db, "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");
}

function create_application_notifications(mysqli $db, int $applicationId, string $candidateName, int $jobId, bool $isResubmission): void
{
    cleanup_old_notifications($db);

    $job = row($db, "SELECT title FROM jobs WHERE id = ?", "i", [$jobId]);
    $jobTitle = (string) ($job["title"] ?? "Job");
    $title = "New Application for $jobTitle";
    $message = $isResubmission
        ? "A candidate has resubmitted an application."
        : "A new candidate has submitted an application.";

    $recipients = rows($db, "SELECT id FROM users WHERE status = 'active'");
    foreach ($recipients as $user) {
        exec_stmt(
            $db,
            "INSERT INTO notifications (user_id, related_application_id, notification_type, title, message)
             VALUES (?, ?, 'new_application', ?, ?)",
            "iiss",
            [(int) $user["id"], $applicationId, $title, $message]
        );
    }
}

function create_email_sent_notification(mysqli $db, int $applicationId, int $userId, string $emailType, string $interviewDateTime): void
{
    if ($userId <= 0 || !in_array($emailType, ["interview", "reject"], true)) {
        throw new RuntimeException("Valid HR user is required to send email");
    }

    cleanup_old_notifications($db);

    $application = row(
        $db,
        "SELECT c.full_name AS candidateName, c.email AS candidateEmail, j.title AS jobTitle, u.full_name AS senderName, u.email AS senderEmail
         FROM applications a
         JOIN candidates c ON c.id = a.candidate_id
         JOIN jobs j ON j.id = a.job_id
         JOIN users u ON u.id = ?
         WHERE a.id = ?",
        "ii",
        [$userId, $applicationId]
    );
    if (!$application) {
        throw new RuntimeException("Application or sender not found");
    }

    $templateKey = $emailType === "interview" ? "interview_invitation" : "reject_application";
    $template = row($db, "SELECT id, subject, body, attachment_path AS attachmentPath, attachment_file_name AS attachmentFileName FROM email_templates WHERE template_key = ? AND is_active = 1 LIMIT 1", "s", [$templateKey]);
    $title = $emailType === "interview" ? "Interview Email Sent" : "Rejection Email Sent";
    $message = $emailType === "interview"
        ? "The interview email has been sent successfully."
        : "The rejection email has been sent successfully.";
    $subject = (string) ($template["subject"] ?? $title);
    $body = (string) ($template["body"] ?? $message);
    $scheduledAt = $emailType === "interview" && $interviewDateTime !== "" ? str_replace("T", " ", $interviewDateTime) : null;
    $replacements = [
        "{{candidate_name}}" => (string) $application["candidateName"],
        "{{job_title}}" => (string) $application["jobTitle"],
        "{{interview_datetime}}" => $interviewDateTime !== "" ? $interviewDateTime : "a scheduled time to be confirmed",
        "{candidateName}" => (string) $application["candidateName"],
        "{jobTitle}" => (string) $application["jobTitle"],
        "{companyName}" => "UWC Berhad",
        "{interviewDate}" => $interviewDateTime !== "" ? $interviewDateTime : "{interviewDateOptions}",
        "{interviewDateOptions}" => $interviewDateTime !== "" ? $interviewDateTime : "{interviewDateOptions}",
    ];
    $subject = strtr($subject, $replacements);
    $body = str_replace("\\n", "\n", strtr($body, $replacements));
    if ($emailType === "interview") {
        $subject = "Interview invitation for " . (string) $application["jobTitle"];
        $body = "Dear " . (string) $application["candidateName"] . ",\n\n"
            . "We would like to invite you for an interview for the " . (string) $application["jobTitle"] . " position.\n\n"
            . "Available interview date and time options: " . ($interviewDateTime !== "" ? $interviewDateTime : "{interviewDateOptions}") . "\n\n"
            . "Please reply to this email with your preferred interview time. Also, please complete the attached file and reply to this email before attending the interview.\n\n"
            . "Regards,\nUWC Berhad";
    }

    send_recruitment_email(
        (string) $application["candidateEmail"],
        (string) $application["candidateName"],
        $subject,
        $body,
        (string) $application["senderEmail"],
        (string) $application["senderName"],
        $emailType === "interview" ? resolve_attachment_path((string) ($template["attachmentPath"] ?? "")) : null,
        $emailType === "interview" ? (string) ($template["attachmentFileName"] ?? "") : ""
    );

    exec_stmt(
        $db,
        "INSERT INTO email_logs (
           application_id, sent_by_user_id, template_id, email_type,
           recipient_email, subject, body, scheduled_interview_at, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent')",
        "iiisssss",
        [
            $applicationId,
            $userId,
            $template["id"] ?? null,
            $emailType,
            (string) $application["candidateEmail"],
            $subject,
            $body,
            $scheduledAt,
        ]
    );

    exec_stmt(
        $db,
        "INSERT INTO notifications (user_id, related_application_id, notification_type, title, message)
         VALUES (?, ?, 'email_sent', ?, ?)",
        "iiss",
        [$userId, $applicationId, $title, $message]
    );
}

function upload_interview_attachment(mysqli $db): void
{
    if (!isset($_FILES["attachment"]) || !is_array($_FILES["attachment"])) {
        respond(["error" => "Attachment file is required"], 422);
    }

    $file = $_FILES["attachment"];
    if ((int) $file["error"] !== UPLOAD_ERR_OK) {
        respond(["error" => "Attachment upload failed"], 422);
    }

    $originalName = basename((string) $file["name"]);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($extension, ["pdf", "doc", "docx"], true)) {
        respond(["error" => "Attachment must be PDF, DOC, or DOCX"], 422);
    }

    $size = (int) $file["size"];
    if ($size <= 0 || $size > 10 * 1024 * 1024) {
        respond(["error" => "Attachment size must be between 1 byte and 10 MB"], 422);
    }

    $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR . "email-attachments";
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
        respond(["error" => "Unable to prepare attachment upload folder"], 500);
    }

    $storedName = sprintf("interview-attachment-%s.%s", bin2hex(random_bytes(6)), $extension);
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $storedName;
    if (!move_uploaded_file((string) $file["tmp_name"], $destination)) {
        respond(["error" => "Unable to save uploaded attachment"], 500);
    }

    $relativePath = "/uploads/email-attachments/{$storedName}";
    exec_stmt(
        $db,
        "UPDATE email_templates SET attachment_path = ?, attachment_file_name = ?, updated_at = CURRENT_TIMESTAMP WHERE template_key = 'interview_invitation'",
        "ss",
        [$relativePath, $originalName]
    );

    respond([
        "ok" => true,
        "fileName" => $originalName,
        "attachmentPath" => $relativePath,
    ]);
}

function email_templates(mysqli $db): void
{
    $templates = rows(
        $db,
        "SELECT
           template_key AS templateKey,
           subject,
           body,
           is_active AS isActive,
           attachment_path AS attachmentPath,
           attachment_file_name AS attachmentFileName
         FROM email_templates
         WHERE template_key IN ('interview_invitation', 'reject_application')"
    );

    $mapped = [];
    foreach ($templates as $template) {
        $mapped[(string) $template["templateKey"]] = $template;
    }

    respond(["templates" => $mapped]);
}

function update_email_templates(mysqli $db): void
{
    $data = input_json();
    $interview = is_array($data["interview"] ?? null) ? $data["interview"] : [];
    $reject = is_array($data["reject"] ?? null) ? $data["reject"] : [];

    update_email_template_row(
        $db,
        "interview_invitation",
        "Interview Invitation",
        (string) ($interview["subject"] ?? ""),
        (string) ($interview["body"] ?? ""),
        filter_var($interview["enabled"] ?? true, FILTER_VALIDATE_BOOLEAN)
    );
    update_email_template_row(
        $db,
        "reject_application",
        "Reject Application",
        (string) ($reject["subject"] ?? ""),
        (string) ($reject["body"] ?? ""),
        filter_var($reject["enabled"] ?? true, FILTER_VALIDATE_BOOLEAN)
    );

    respond(["ok" => true]);
}

function update_email_template_row(mysqli $db, string $key, string $name, string $subject, string $body, bool $enabled): void
{
    if ($subject === "" || $body === "") {
        respond(["error" => "Email template subject and message are required"], 422);
    }

    exec_stmt(
        $db,
        "INSERT INTO email_templates (template_key, template_name, subject, body, is_active, created_by_user_id)
         VALUES (?, ?, ?, ?, ?, 2)
         ON DUPLICATE KEY UPDATE
           template_name = VALUES(template_name),
           subject = VALUES(subject),
           body = VALUES(body),
           is_active = VALUES(is_active),
           updated_at = CURRENT_TIMESTAMP",
        "ssssi",
        [$key, $name, $subject, $body, $enabled ? 1 : 0]
    );
}

function mail_config(): array
{
    $configPath = __DIR__ . DIRECTORY_SEPARATOR . "mail-config.local.php";
    if (!is_file($configPath)) {
        throw new RuntimeException("Mail config is missing");
    }

    $config = require $configPath;
    if (!is_array($config) || empty($config["enabled"])) {
        throw new RuntimeException("Mail sending is not configured");
    }

    return $config;
}

function send_recruitment_email(string $toEmail, string $toName, string $subject, string $body, string $replyToEmail, string $replyToName, ?string $attachmentPath = null, string $attachmentFileName = ""): void
{
    $config = mail_config();
    smtp_send_mail(
        $config,
        $toEmail,
        $toName,
        $subject,
        $body,
        $replyToEmail,
        $replyToName,
        $attachmentPath,
        $attachmentFileName
    );
}

function smtp_send_mail(array $config, string $toEmail, string $toName, string $subject, string $body, string $replyToEmail, string $replyToName, ?string $attachmentPath = null, string $attachmentFileName = ""): void
{
    $host = (string) ($config["host"] ?? "");
    $port = (int) ($config["port"] ?? 587);
    $username = (string) ($config["username"] ?? "");
    $password = (string) ($config["password"] ?? "");
    $fromEmail = (string) ($config["from_email"] ?? $username);
    $fromName = (string) ($config["from_name"] ?? "UWC Recruitment");

    if ($host === "" || $username === "" || $password === "" || $fromEmail === "") {
        throw new RuntimeException("Mail config is incomplete");
    }

    $context = stream_context_create([
        "ssl" => [
            "verify_peer" => (bool) ($config["verify_peer"] ?? true),
            "verify_peer_name" => (bool) ($config["verify_peer"] ?? true),
            "allow_self_signed" => !(bool) ($config["verify_peer"] ?? true),
        ],
    ]);
    $socket = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 20, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        throw new RuntimeException("Unable to connect to SMTP server: {$errstr}");
    }

    stream_set_timeout($socket, 20);

    try {
        smtp_expect($socket, [220]);
        smtp_command($socket, "EHLO localhost", [250]);

        if (($config["encryption"] ?? "tls") === "tls") {
            smtp_command($socket, "STARTTLS", [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException("Unable to start SMTP TLS encryption");
            }
            smtp_command($socket, "EHLO localhost", [250]);
        }

        smtp_command($socket, "AUTH LOGIN", [334]);
        smtp_command($socket, base64_encode($username), [334]);
        smtp_command($socket, base64_encode($password), [235]);
        smtp_command($socket, "MAIL FROM:<{$fromEmail}>", [250]);
        smtp_command($socket, "RCPT TO:<{$toEmail}>", [250, 251]);
        smtp_command($socket, "DATA", [354]);

        $headers = [
            "From: " . mime_header_name($fromName) . " <{$fromEmail}>",
            "To: " . mime_header_name($toName) . " <{$toEmail}>",
            "Reply-To: " . mime_header_name($replyToName) . " <{$replyToEmail}>",
            "Subject: " . mime_header_text($subject),
            "MIME-Version: 1.0",
        ];
        $messageBody = build_email_message_body($body, $attachmentPath, $headers, $attachmentFileName);
        $message = implode("\r\n", $headers) . "\r\n\r\n" . $messageBody . "\r\n.";
        smtp_command($socket, $message, [250]);
        smtp_command($socket, "QUIT", [221]);
    } finally {
        fclose($socket);
    }
}

function build_email_message_body(string $body, ?string $attachmentPath, array &$headers, string $attachmentFileName = ""): string
{
    if ($attachmentPath === null || $attachmentPath === "" || !is_file($attachmentPath)) {
        $headers[] = "Content-Type: text/plain; charset=UTF-8";
        $headers[] = "Content-Transfer-Encoding: 8bit";
        return normalize_smtp_body($body);
    }

    $boundary = "uwc_boundary_" . bin2hex(random_bytes(8));
    $headers[] = "Content-Type: multipart/mixed; boundary=\"{$boundary}\"";
    $fileName = $attachmentFileName !== "" ? $attachmentFileName : basename($attachmentPath);
    $mimeType = attachment_mime_type($attachmentPath);
    $encodedFile = chunk_split(base64_encode((string) file_get_contents($attachmentPath)));

    return "--{$boundary}\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . normalize_smtp_body($body) . "\r\n"
        . "--{$boundary}\r\n"
        . "Content-Type: {$mimeType}; name=\"" . addcslashes($fileName, "\"\\") . "\"\r\n"
        . "Content-Transfer-Encoding: base64\r\n"
        . "Content-Disposition: attachment; filename=\"" . addcslashes($fileName, "\"\\") . "\"\r\n\r\n"
        . $encodedFile . "\r\n"
        . "--{$boundary}--";
}

function resolve_attachment_path(string $path): ?string
{
    if ($path === "") {
        return null;
    }

    if (preg_match("#^https?://#i", $path)) {
        return null;
    }

    $normalized = str_replace(["/", "\\"], DIRECTORY_SEPARATOR, ltrim($path, "/\\"));
    $fullPath = __DIR__ . DIRECTORY_SEPARATOR . $normalized;
    return is_file($fullPath) ? $fullPath : null;
}

function attachment_mime_type(string $path): string
{
    if (function_exists("finfo_open")) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $detectedType = finfo_file($finfo, $path);
            finfo_close($finfo);
            if (is_string($detectedType) && $detectedType !== "") {
                return $detectedType;
            }
        }
    }

    return "application/octet-stream";
}

function smtp_command($socket, string $command, array $expectedCodes): string
{
    fwrite($socket, $command . "\r\n");
    return smtp_expect($socket, $expectedCodes);
}

function smtp_expect($socket, array $expectedCodes): string
{
    $response = "";
    do {
        $line = fgets($socket, 515);
        if ($line === false) {
            throw new RuntimeException("SMTP server did not respond");
        }
        $response .= $line;
    } while (isset($line[3]) && $line[3] === "-");

    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException("SMTP error: " . trim($response));
    }

    return $response;
}

function normalize_smtp_body(string $body): string
{
    $body = preg_replace("/\r\n|\r|\n/", "\r\n", $body) ?? $body;
    return preg_replace("/^\./m", "..", $body) ?? $body;
}

function mime_header_text(string $value): string
{
    if (!function_exists("mb_encode_mimeheader")) {
        return $value;
    }

    return mb_encode_mimeheader($value, "UTF-8", "B", "\r\n");
}

function mime_header_name(string $value): string
{
    if ($value === "") {
        return "";
    }

    return mime_header_text($value);
}

function notifications(mysqli $db): void
{
    cleanup_old_notifications($db);

    $userId = (int) ($_GET["userId"] ?? 0);
    if ($userId <= 0) {
        respond(["error" => "userId is required"], 422);
    }

    $items = rows(
        $db,
        "SELECT
           n.id,
           n.related_application_id AS applicationId,
           a.job_id AS jobId,
           n.notification_type AS notificationType,
           n.title,
           n.message,
           n.is_read AS isRead,
           n.created_at AS createdAt
         FROM notifications n
         LEFT JOIN applications a ON a.id = n.related_application_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT 100",
        "i",
        [$userId]
    );
    $summary = row($db, "SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0", "i", [$userId]);

    respond([
        "items" => $items,
        "preview" => array_slice($items, 0, 3),
        "unreadCount" => (int) ($summary["unreadCount"] ?? 0),
    ]);
}

function mark_notifications_read(mysqli $db): void
{
    cleanup_old_notifications($db);

    $data = input_json();
    $userId = (int) ($data["userId"] ?? 0);
    if ($userId <= 0) {
        respond(["error" => "userId is required"], 422);
    }

    exec_stmt($db, "UPDATE notifications SET is_read = 1 WHERE user_id = ?", "i", [$userId]);
    respond(["ok" => true]);
}

function ordinal_submission_label(int $submissionNo): string
{
    $suffix = "th";
    if ($submissionNo % 100 < 11 || $submissionNo % 100 > 13) {
        $lastDigit = $submissionNo % 10;
        if ($lastDigit === 1) {
            $suffix = "st";
        } elseif ($lastDigit === 2) {
            $suffix = "nd";
        } elseif ($lastDigit === 3) {
            $suffix = "rd";
        }
    }

    return $submissionNo . $suffix . " Submission";
}

function save_uploaded_documents(mysqli $db, int $applicationId, string $fallbackName): void
{
    $fallbackName = basename($fallbackName) ?: "resume.pdf";

    if (!isset($_FILES["resume"])) {
        exec_stmt(
            $db,
            "INSERT INTO resumes (application_id, original_file_name, stored_file_path, file_mime_type, file_size_bytes, parsing_status)
             VALUES (?, ?, '/uploads/resumes/pending.pdf', 'application/pdf', 0, 'pending')",
            "is",
            [$applicationId, $fallbackName]
        );
        return;
    }

    $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR . "resumes";
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
        respond(["error" => "Unable to prepare resume upload folder"], 500);
    }

    $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
    $host = (string) ($_SERVER["HTTP_HOST"] ?? "localhost");
    $basePath = rtrim(str_replace("\\", "/", dirname((string) ($_SERVER["SCRIPT_NAME"] ?? "/uwc-hr-api/api.php"))), "/");
    $allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    $allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

    foreach (normalize_uploaded_files($_FILES["resume"]) as $file) {
        if ((int) $file["error"] !== UPLOAD_ERR_OK) {
            respond(["error" => "Application document upload failed"], 422);
        }

        $originalName = basename((string) $file["name"]);
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($extension, $allowedExtensions, true)) {
            respond(["error" => "Application documents must be PDF, JPG, JPEG, or PNG files"], 422);
        }

        $size = (int) $file["size"];
        if ($size <= 0 || $size > 10 * 1024 * 1024) {
            respond(["error" => "Application document file size must be between 1 byte and 10 MB"], 422);
        }

        $mimeType = (string) ($file["type"] ?? "application/octet-stream");
        if (function_exists("finfo_open")) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $detectedType = finfo_file($finfo, (string) $file["tmp_name"]);
                finfo_close($finfo);
                if (is_string($detectedType) && $detectedType !== "") {
                    $mimeType = $detectedType;
                }
            }
        }

        if (!in_array($mimeType, $allowedMimeTypes, true)) {
            respond(["error" => "Application documents must be PDF, JPG, JPEG, or PNG files"], 422);
        }

        $storedName = sprintf("application-%d-%s.%s", $applicationId, bin2hex(random_bytes(6)), $extension === "jpeg" ? "jpg" : $extension);
        $destination = $uploadDir . DIRECTORY_SEPARATOR . $storedName;
        if (!move_uploaded_file((string) $file["tmp_name"], $destination)) {
            respond(["error" => "Unable to save uploaded application document"], 500);
        }

        exec_stmt(
            $db,
            "INSERT INTO resumes (application_id, original_file_name, stored_file_path, file_mime_type, file_size_bytes, parsing_status)
             VALUES (?, ?, ?, ?, ?, 'pending')",
            "isssi",
            [$applicationId, $originalName, "{$scheme}://{$host}{$basePath}/uploads/resumes/{$storedName}", $mimeType, $size]
        );
    }
}

function normalize_uploaded_files(array $fileInput): array
{
    if (!isset($fileInput["name"]) || !is_array($fileInput["name"])) {
        return [$fileInput];
    }

    $files = [];
    foreach ($fileInput["name"] as $index => $name) {
        $files[] = [
            "name" => $name,
            "type" => $fileInput["type"][$index] ?? "",
            "tmp_name" => $fileInput["tmp_name"][$index] ?? "",
            "error" => $fileInput["error"][$index] ?? UPLOAD_ERR_NO_FILE,
            "size" => $fileInput["size"][$index] ?? 0,
        ];
    }

    return $files;
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
               r.role_name AS roleName,
               u.last_login_at AS lastLoginAt,
               u.created_at AS createdAt
             FROM users u
             JOIN roles r ON r.id = u.role_id
             ORDER BY u.role_id, u.full_name"
        )
    ]);
}

function user_action_logs(mysqli $db, int $userId): void
{
    if ($userId <= 0) {
        respond(["error" => "Invalid user"], 422);
    }

    respond([
        "actions" => rows(
            $db,
            "SELECT
               hal.id,
               hal.action_type AS actionType,
               hal.action_label AS actionLabel,
               hal.details,
               hal.created_at AS createdAt,
               hal.application_id AS applicationId,
               j.id AS jobId,
               j.title AS jobTitle,
               j.department AS jobDepartment,
               c.id AS candidateId,
               c.full_name AS candidateName,
               c.email AS candidateEmail,
               a.application_status AS applicationStatus
             FROM hr_action_logs hal
             LEFT JOIN applications a ON a.id = hal.application_id
             LEFT JOIN jobs j ON j.id = hal.job_id
             LEFT JOIN candidates c ON c.id = hal.candidate_id
             WHERE hal.user_id = ?
             ORDER BY hal.created_at DESC, hal.id DESC
             LIMIT 200",
            "i",
            [$userId]
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
           r.role_name AS roleName,
           u.last_login_at AS lastLoginAt,
           u.created_at AS createdAt
         FROM users u
         JOIN roles r ON r.id = u.role_id
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
          COUNT(latest_email.application_id) AS totalCandidates,
          ROUND(AVG(GREATEST(0, TIMESTAMPDIFF(MINUTE, a.submitted_at, latest_email.sent_at))) / 60, 1) AS avgProcessingHours,
          SUM(CASE WHEN a.application_status IN ('shortlisted', 'interview') THEN 1 ELSE 0 END) AS shortlisted,
          SUM(CASE WHEN a.application_status = 'rejected' THEN 1 ELSE 0 END) AS rejected
         FROM users u
         LEFT JOIN applications a ON a.assigned_hr_user_id = u.id
         LEFT JOIN (
           SELECT el.application_id, el.sent_at
           FROM email_logs el
           JOIN (
             SELECT email_log.application_id, MAX(email_log.id) AS latest_email_id
             FROM email_logs email_log
             JOIN applications current_application ON current_application.id = email_log.application_id
             WHERE email_log.status = 'sent'
               AND email_log.email_type IN ('interview', 'reject')
               AND email_log.sent_at >= current_application.submitted_at
             GROUP BY email_log.application_id
           ) latest ON latest.latest_email_id = el.id
         ) latest_email ON latest_email.application_id = a.id
         WHERE u.role_id IN (1, 2)
           AND a.reviewed_at IS NOT NULL
         GROUP BY u.id
         ORDER BY totalCandidates DESC"
    );
    $details = rows(
        $db,
        "SELECT
          c.full_name AS candidateName,
          c.email AS candidateEmail,
          j.id AS jobId,
          j.title AS jobTitle,
          a.submitted_at AS applicationDate,
          COALESCE(latest_email.sent_at, a.reviewed_at) AS lastActionDate,
          CASE
            WHEN latest_email.sent_at IS NULL THEN NULL
            ELSE GREATEST(0, TIMESTAMPDIFF(MINUTE, a.submitted_at, latest_email.sent_at))
          END AS processingMinutes,
          CASE latest_email.email_type
            WHEN 'interview' THEN 'interview_email_sent'
            WHEN 'reject' THEN 'rejection_email_sent'
            ELSE CASE
              WHEN a.is_shortlisted = 1 THEN 'shortlisted'
              ELSE 'reviewed'
            END
          END AS processingStatus,
          COALESCE(u.full_name, 'Unassigned') AS hrAssigned
         FROM applications a
         JOIN candidates c ON c.id = a.candidate_id
         JOIN jobs j ON j.id = a.job_id
         LEFT JOIN users u ON u.id = a.assigned_hr_user_id
         LEFT JOIN (
           SELECT el.application_id, el.email_type, el.sent_at
           FROM email_logs el
           JOIN (
             SELECT email_log.application_id, MAX(email_log.id) AS latest_email_id
             FROM email_logs email_log
             JOIN applications current_application ON current_application.id = email_log.application_id
             WHERE email_log.status = 'sent'
               AND email_log.email_type IN ('interview', 'reject')
               AND email_log.sent_at >= current_application.submitted_at
             GROUP BY email_log.application_id
           ) latest ON latest.latest_email_id = el.id
         ) latest_email ON latest_email.application_id = a.id
         WHERE a.reviewed_at IS NOT NULL
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
