<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
try {
    $pdo = db();
    $email = 'admin@bloodbank.local';
    $stmt = $pdo->prepare('SELECT id FROM admins WHERE email = ?');
    $stmt->execute([$email]);
    if (!$stmt->fetch()) {
        $stmt = $pdo->prepare('INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)');
        $stmt->execute(['System Admin', $email, password_hash('Admin@123', PASSWORD_DEFAULT)]);
    }
    echo '<h2>Blood Bank installer complete</h2><p>Admin email: <b>admin@bloodbank.local</b></p><p>Temporary password: <b>Admin@123</b></p><p><b>Delete install.php now.</b> Change the default password before any real deployment.</p>';
} catch (Throwable $e) {
    http_response_code(500);
    echo 'Installation failed. Check database/schema.sql and backend/config.php. Details: ' . htmlspecialchars($e->getMessage());
}
