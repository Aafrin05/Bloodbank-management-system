<?php
declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_NAME = 'blood_bank';
const DB_USER = 'root';
const DB_PASS = '';

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function json_response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function request_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function require_login(): array {
    if (empty($_SESSION['admin_id'])) {
        json_response(['error' => 'Please log in to continue.'], 401);
    }
    return ['id' => (int)$_SESSION['admin_id'], 'name' => $_SESSION['admin_name'], 'email' => $_SESSION['admin_email']];
}

function clean_string(array $data, string $key, int $max = 190, bool $required = true): ?string {
    $value = trim((string)($data[$key] ?? ''));
    if ($value === '' && !$required) return null;
    if ($value === '' || mb_strlen($value) > $max) {
        json_response(['error' => "Please enter a valid $key (maximum $max characters)."], 422);
    }
    return $value;
}
