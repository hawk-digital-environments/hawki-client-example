<?php
declare(strict_types=1);

session_start();

if (empty($_SESSION['userId'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'userId' => $_SESSION['userId']
]);
