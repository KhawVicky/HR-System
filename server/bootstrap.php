<?php

declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
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
