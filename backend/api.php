<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

try {
    $pdo = db();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = (string)($_GET['action'] ?? '');

    if ($action === 'login' && $method === 'POST') {
        $body = request_body();
        $email = filter_var(trim((string)($body['email'] ?? '')), FILTER_VALIDATE_EMAIL);
        $password = (string)($body['password'] ?? '');
        if (!$email || $password === '') json_response(['error' => 'Enter a valid email and password.'], 422);
        $stmt = $pdo->prepare('SELECT * FROM admins WHERE email = ?');
        $stmt->execute([$email]);
        $admin = $stmt->fetch();
        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            json_response(['error' => 'Incorrect email or password.'], 401);
        }
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int)$admin['id'];
        $_SESSION['admin_name'] = $admin['name'];
        $_SESSION['admin_email'] = $admin['email'];
        json_response(['user' => ['id' => (int)$admin['id'], 'name' => $admin['name'], 'email' => $admin['email']]]);
    }

    if ($action === 'logout' && $method === 'POST') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], '', $params['secure'], $params['httponly']);
        }
        session_destroy();
        json_response(['message' => 'Logged out.']);
    }

    if ($action === 'me' && $method === 'GET') {
        json_response(['user' => !empty($_SESSION['admin_id']) ? [
            'id' => (int)$_SESSION['admin_id'], 'name' => $_SESSION['admin_name'], 'email' => $_SESSION['admin_email']
        ] : null]);
    }

    require_login();

    if ($action === 'dashboard' && $method === 'GET') {
        $donors = (int)$pdo->query('SELECT COUNT(*) FROM donors')->fetchColumn();
        $units = (int)$pdo->query('SELECT COALESCE(SUM(units),0) FROM inventory')->fetchColumn();
        $pending = (int)$pdo->query("SELECT COUNT(*) FROM blood_requests WHERE status = 'Pending'")->fetchColumn();
        $requests = (int)$pdo->query('SELECT COUNT(*) FROM blood_requests')->fetchColumn();
        $inventory = $pdo->query('SELECT blood_group, units FROM inventory ORDER BY FIELD(blood_group,"O+","O-","A+","A-","B+","B-","AB+","AB-")')->fetchAll();
        $recent = $pdo->query('SELECT id, requester_name, hospital, blood_group, units, urgency, status, created_at FROM blood_requests ORDER BY created_at DESC LIMIT 5')->fetchAll();
        json_response(compact('donors', 'units', 'pending', 'requests', 'inventory', 'recent'));
    }

    if ($action === 'donors') {
        if ($method === 'GET') {
            $q = trim((string)($_GET['q'] ?? ''));
            if ($q !== '') {
                $stmt = $pdo->prepare('SELECT * FROM donors WHERE name LIKE ? OR phone LIKE ? OR blood_group LIKE ? OR city LIKE ? ORDER BY created_at DESC');
                $like = "%$q%"; $stmt->execute([$like, $like, $like, $like]); $rows = $stmt->fetchAll();
            } else {
                $rows = $pdo->query('SELECT * FROM donors ORDER BY created_at DESC')->fetchAll();
            }
            json_response(['donors' => $rows]);
        }
        if ($method === 'POST' || $method === 'PUT') {
            $body = request_body();
            $name = clean_string($body, 'name', 120);
            $age = filter_var($body['age'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 18, 'max_range' => 65]]);
            if (!$age) json_response(['error' => 'Donor age must be between 18 and 65 for this demo.'], 422);
            $gender = (string)($body['gender'] ?? '');
            $group = (string)($body['blood_group'] ?? '');
            if (!in_array($gender, ['Female','Male','Other'], true)) json_response(['error' => 'Choose a valid gender.'], 422);
            if (!in_array($group, ['A+','A-','B+','B-','AB+','AB-','O+','O-'], true)) json_response(['error' => 'Choose a valid blood group.'], 422);
            $phone = clean_string($body, 'phone', 30);
            $email = trim((string)($body['email'] ?? ''));
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error' => 'Enter a valid email address.'], 422);
            $city = clean_string($body, 'city', 100);
            $date = trim((string)($body['last_donation_date'] ?? ''));
            if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) json_response(['error' => 'Enter a valid donation date.'], 422);
            if ($method === 'POST') {
                $stmt = $pdo->prepare('INSERT INTO donors (name, age, gender, blood_group, phone, email, city, last_donation_date) VALUES (?,?,?,?,?,?,?,?)');
                $stmt->execute([$name,$age,$gender,$group,$phone,$email ?: null,$city,$date ?: null]);
                json_response(['message' => 'Donor added.', 'id' => (int)$pdo->lastInsertId()], 201);
            }
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) json_response(['error' => 'Invalid donor ID.'], 422);
            $stmt = $pdo->prepare('UPDATE donors SET name=?, age=?, gender=?, blood_group=?, phone=?, email=?, city=?, last_donation_date=? WHERE id=?');
            $stmt->execute([$name,$age,$gender,$group,$phone,$email ?: null,$city,$date ?: null,$id]);
            json_response(['message' => 'Donor updated.']);
        }
        if ($method === 'DELETE') {
            $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) json_response(['error' => 'Invalid donor ID.'], 422);
            $stmt = $pdo->prepare('DELETE FROM donors WHERE id=?'); $stmt->execute([$id]);
            json_response(['message' => 'Donor deleted.']);
        }
    }

    if ($action === 'inventory') {
        if ($method === 'GET') json_response(['inventory' => $pdo->query('SELECT * FROM inventory ORDER BY FIELD(blood_group,"O+","O-","A+","A-","B+","B-","AB+","AB-")')->fetchAll()]);
        if ($method === 'PUT') {
            $body = request_body();
            $group = (string)($body['blood_group'] ?? '');
            $units = filter_var($body['units'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 100000]]);
            if (!in_array($group, ['A+','A-','B+','B-','AB+','AB-','O+','O-'], true) || $units === false) json_response(['error' => 'Choose a valid group and non-negative unit count.'], 422);
            $stmt = $pdo->prepare('INSERT INTO inventory (blood_group, units) VALUES (?, ?) ON DUPLICATE KEY UPDATE units=VALUES(units)');
            $stmt->execute([$group, $units]);
            json_response(['message' => 'Inventory updated.']);
        }
    }

    if ($action === 'requests') {
        if ($method === 'GET') {
            $rows = $pdo->query('SELECT * FROM blood_requests ORDER BY created_at DESC')->fetchAll();
            json_response(['requests' => $rows]);
        }
        if ($method === 'POST') {
            $body = request_body();
            $name = clean_string($body, 'requester_name', 120);
            $hospital = clean_string($body, 'hospital', 160);
            $group = (string)($body['blood_group'] ?? '');
            if (!in_array($group, ['A+','A-','B+','B-','AB+','AB-','O+','O-'], true)) json_response(['error' => 'Choose a valid blood group.'], 422);
            $units = filter_var($body['units'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 1000]]);
            if (!$units) json_response(['error' => 'Units must be at least 1.'], 422);
            $phone = clean_string($body, 'contact_phone', 30);
            $urgency = (string)($body['urgency'] ?? 'Normal');
            if (!in_array($urgency, ['Normal','Urgent','Critical'], true)) json_response(['error' => 'Choose a valid urgency.'], 422);
            $notes = trim((string)($body['notes'] ?? ''));
            $stmt = $pdo->prepare('INSERT INTO blood_requests (requester_name, hospital, blood_group, units, contact_phone, urgency, notes) VALUES (?,?,?,?,?,?,?)');
            $stmt->execute([$name,$hospital,$group,$units,$phone,$urgency,substr($notes,0,500)]);
            json_response(['message' => 'Blood request created.'], 201);
        }
        if ($method === 'PUT') {
            $body = request_body();
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            $status = (string)($body['status'] ?? '');
            if (!$id || !in_array($status, ['Pending','Approved','Rejected','Completed'], true)) json_response(['error' => 'Choose a valid request and status.'], 422);
            $stmt = $pdo->prepare('UPDATE blood_requests SET status=? WHERE id=?'); $stmt->execute([$status,$id]);
            json_response(['message' => 'Request status updated.']);
        }
        if ($method === 'DELETE') {
            $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) json_response(['error' => 'Invalid request ID.'], 422);
            $stmt = $pdo->prepare('DELETE FROM blood_requests WHERE id=?'); $stmt->execute([$id]);
            json_response(['message' => 'Request deleted.']);
        }
    }

    json_response(['error' => 'Endpoint not found.'], 404);
} catch (Throwable $e) {
    error_log((string)$e);
    json_response(['error' => 'Server error. Check PHP error logs and database configuration.'], 500);
}
