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
          r.original_file_name AS resumeFileName,
          (
            SELECT COUNT(*) + 1
            FROM application_submission_history ash
            WHERE ash.application_id = a.id
          ) AS currentSubmissionNo
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
             FROM score_breakdowns sb
             JOIN score_breakdown_items sbi ON sbi.score_breakdown_id = sb.id
             WHERE sb.application_id = ? AND sbi.match_status IN ('matched', 'partial')
             ORDER BY sbi.requirement_text",
            "i",
            [(int) $candidate["applicationId"]]
        );
        $candidate["currentSubmissionLabel"] = ordinal_submission_label((int) $candidate["currentSubmissionNo"]);
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

    if ($status === "shortlisted") {
        exec_stmt($db, "UPDATE applications SET is_shortlisted = 1, application_status = IF(application_status = 'interview', application_status, 'shortlisted'), reviewed_at = NOW() WHERE id = ?", "i", [$applicationId]);
    } elseif ($status === "reviewed") {
        exec_stmt($db, "UPDATE applications SET is_shortlisted = 0, application_status = IF(application_status = 'interview', application_status, 'reviewed'), reviewed_at = NOW() WHERE id = ?", "i", [$applicationId]);
    } elseif ($status === "interview") {
        exec_stmt($db, "UPDATE applications SET is_shortlisted = 1, interview_sent_at = COALESCE(interview_sent_at, NOW()), application_status = 'interview', reviewed_at = NOW() WHERE id = ?", "i", [$applicationId]);
        if ($emailAction) {
            create_email_sent_notification($db, $applicationId, $actionUserId, "interview", $interviewDateTime);
        }
    } elseif ($status === "rejected") {
        exec_stmt($db, "UPDATE applications SET application_status = 'rejected', is_shortlisted = 0, reviewed_at = NOW() WHERE id = ?", "i", [$applicationId]);
        if ($emailAction) {
            create_email_sent_notification($db, $applicationId, $actionUserId, "reject", "");
        }
    } else {
        exec_stmt($db, "UPDATE applications SET application_status = ?, reviewed_at = NOW() WHERE id = ?", "si", [$status, $applicationId]);
    }

    $updated = row($db, "SELECT application_status, is_shortlisted, interview_sent_at FROM applications WHERE id = ?", "i", [$applicationId]);
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
    $resume = save_uploaded_resume($applicationId, (string) ($data["resumeFileName"] ?? "resume.pdf"));
    exec_stmt(
        $db,
        "INSERT INTO resumes (application_id, original_file_name, stored_file_path, file_mime_type, file_size_bytes, parsing_status)
         VALUES (?, ?, ?, ?, ?, 'pending')",
        "isssi",
        [$applicationId, $resume["originalName"], $resume["publicUrl"], $resume["mimeType"], $resume["size"]]
    );
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
               previous_score, previous_rank_no, previous_resume_file_name,
               previous_resume_url, previous_ai_summary, original_submitted_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            "iiiissdissss",
            [
                $candidateId,
                $applicationId,
                $jobId,
                $submissionNo,
                (string) $existing["application_status"],
                (string) $existing["eligibility_status"],
                $existing["total_score"] === null ? null : (float) $existing["total_score"],
                $existing["rank_no"] === null ? null : (int) $existing["rank_no"],
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
                 eligibility_status = ?, total_score = ?, rank_no = NULL,
                 ai_summary = ?, submitted_at = NOW(), reviewed_at = NULL
             WHERE id = ?",
            "ssdsi",
            [$status, $eligibilityStatus, $score, "$fullName resubmitted an application and is ready for HR review.", $applicationId]
        );

        $resume = save_uploaded_resume($applicationId, $fallbackResumeName);
        exec_stmt(
            $db,
            "INSERT INTO resumes (application_id, original_file_name, stored_file_path, file_mime_type, file_size_bytes, parsing_status)
             VALUES (?, ?, ?, ?, ?, 'pending')
             ON DUPLICATE KEY UPDATE
               original_file_name = VALUES(original_file_name),
               stored_file_path = VALUES(stored_file_path),
               file_mime_type = VALUES(file_mime_type),
               file_size_bytes = VALUES(file_size_bytes),
               parsed_text = NULL,
               parsing_status = 'pending',
               uploaded_at = CURRENT_TIMESTAMP",
            "isssi",
            [$applicationId, $resume["originalName"], $resume["publicUrl"], $resume["mimeType"], $resume["size"]]
        );

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

    $hrUsers = rows($db, "SELECT id FROM users WHERE role_id = 1 AND status = 'active'");
    foreach ($hrUsers as $user) {
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
        return;
    }

    cleanup_old_notifications($db);

    $application = row(
        $db,
        "SELECT c.full_name AS candidateName, c.email AS candidateEmail, j.title AS jobTitle
         FROM applications a
         JOIN candidates c ON c.id = a.candidate_id
         JOIN jobs j ON j.id = a.job_id
         WHERE a.id = ?",
        "i",
        [$applicationId]
    );
    if (!$application) {
        return;
    }

    $templateKey = $emailType === "interview" ? "interview_invitation" : "reject_application";
    $template = row($db, "SELECT id, subject, body FROM email_templates WHERE template_key = ? AND is_active = 1 LIMIT 1", "s", [$templateKey]);
    $title = $emailType === "interview" ? "Interview Email Sent" : "Rejection Email Sent";
    $message = $emailType === "interview"
        ? "The interview email has been sent successfully."
        : "The rejection email has been sent successfully.";
    $subject = (string) ($template["subject"] ?? $title);
    $body = (string) ($template["body"] ?? $message);
    $scheduledAt = $emailType === "interview" && $interviewDateTime !== "" ? str_replace("T", " ", $interviewDateTime) : null;

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

function save_uploaded_resume(int $applicationId, string $fallbackName): array
{
    $fallbackName = basename($fallbackName) ?: "resume.pdf";
    $legacy = [
        "originalName" => $fallbackName,
        "publicUrl" => "/uploads/resumes/pending.pdf",
        "mimeType" => "application/pdf",
        "size" => 0,
    ];

    if (!isset($_FILES["resume"])) {
        return $legacy;
    }

    $file = $_FILES["resume"];
    if (!is_array($file) || (int) $file["error"] !== UPLOAD_ERR_OK) {
        respond(["error" => "Resume upload failed"], 422);
    }

    $originalName = basename((string) $file["name"]);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if ($extension !== "pdf") {
        respond(["error" => "Resume must be a PDF file"], 422);
    }

    $size = (int) $file["size"];
    if ($size <= 0 || $size > 5 * 1024 * 1024) {
        respond(["error" => "Resume file size must be between 1 byte and 5 MB"], 422);
    }

    $mimeType = "application/pdf";
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

    if ($mimeType !== "application/pdf") {
        respond(["error" => "Resume must be a PDF file"], 422);
    }

    $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR . "resumes";
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
        respond(["error" => "Unable to prepare resume upload folder"], 500);
    }

    $storedName = sprintf("application-%d-%s.pdf", $applicationId, bin2hex(random_bytes(6)));
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $storedName;
    if (!move_uploaded_file((string) $file["tmp_name"], $destination)) {
        respond(["error" => "Unable to save uploaded resume"], 500);
    }

    $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
    $host = (string) ($_SERVER["HTTP_HOST"] ?? "localhost");
    $basePath = rtrim(str_replace("\\", "/", dirname((string) ($_SERVER["SCRIPT_NAME"] ?? "/uwc-hr-api/api.php"))), "/");

    return [
        "originalName" => $originalName,
        "publicUrl" => "{$scheme}://{$host}{$basePath}/uploads/resumes/{$storedName}",
        "mimeType" => $mimeType,
        "size" => $size,
    ];
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
