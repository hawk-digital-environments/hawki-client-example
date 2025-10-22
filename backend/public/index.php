<?php
declare(strict_types=1);

/* ==========================================
 * Hello there!
 * This is the main backend entry point for handling API requests.
 * Most of the routes you see here resolve around the "login" status of the user.
 *
 * As you NEED an authenticated user to interact with Hawki.
 * If you just want to know how to retrieve the Hawki client configuration,
 * please check out the "getHawkiClientConfig.php" route handler.
 */
require_once __DIR__ . '/../Example.php';

Example::includeComposerAutoload();

Example::routeFile('GET', '/', __DIR__ . '/../routes/default.php');
Example::routeFile('GET', '/backend', __DIR__ . '/../routes/default.php');

Example::routeFile('GET', '/login-status', __DIR__ . '/../routes/getLoginStatus.php');
Example::routeFile('POST', '/login', __DIR__ . '/../routes/login.php');
Example::routeFile('GET', '/logout', __DIR__ . '/../routes/logout.php');

// This route is used by the Hawki client to get its configuration from your backend.
Example::routeFile('POST', '/hawki-client-config', __DIR__ . '/../routes/getHawkiClientConfig.php');

Example::handle();
