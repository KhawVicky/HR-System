<?php

declare(strict_types=1);

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
