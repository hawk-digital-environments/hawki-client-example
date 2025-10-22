<?php
declare(strict_types=1);

session_start();

unset($_SESSION['userId']);

echo json_encode(['success' => true, 'message' => 'You have been logged out.']);
