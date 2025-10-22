<?php
declare(strict_types=1);

/**
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * IMPORTANT:
 *
 * This is NOT A SECURE LOGIN SYSTEM! Do NOT USE THIS IN PRODUCTION!
 * It is here only for demonstration purposes!
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

session_start();

const USERS = [
    [1, 'tester'],
    [2, 'admin'],
    [3, 'user'],
    [4, 'guest'],
    [5, 'test'],
    [6, 'test2'],
    [7, 'test3'],
    [8, 'test4'],
    [9, 'test5'],
    [10, 'test6'],
];

function showError(string $message): never
{
    echo $message;
    echo '<script>setTimeout(() => { window.location.href = "/"; }, 2000);</script>';
    exit;
}

if ($_SESSION['userId'] ?? null) {
    http_response_code(403);
    showError('You are already logged in. Please log out first.');
}

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    showError('Username and password are required.');
}

$knownUser = null;
foreach (USERS as $user) {
    if ($user[1] === $username) {
        $knownUser = $user;
        break;
    }
}

if (!$knownUser || $password !== 'password') {
    http_response_code(401);
    showError('Invalid username or password.');
}

$_SESSION['userId'] = $knownUser[0];

header('Location: /');
