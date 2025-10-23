<?php
declare(strict_types=1);

use GuzzleHttp\Client;
use Hawk\HawkiClientBackend\Exception\HawkiClientBackendExceptionInterface;
use Hawk\HawkiClientBackend\HawkiClientBackend;

session_start();
if (empty($_SESSION['userId'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if (empty($_POST['public_key'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Public key is required']);
    exit;
}

$httpClient = null;
if(getenv('HAWKI_USES_SELF_SIGNED_CERTIFICATE') === 'true'){
    $httpClient = new Client([
        'verify' => false, // Disable SSL verification for local development
    ]);
}

$hawkiApp = new HawkiClientBackend(
    hawkiUrl: getenv('HAWKI_URL'),
    apiToken: getenv('HAWKI_API_TOKEN'),
    privateKey: getenv('HAWKI_PRIVATE_KEY'),
    httpClient: $httpClient
);

try {
    echo json_encode($hawkiApp->getClientConfig(
        $_SESSION['userId'],
        $_POST['public_key']
    ), JSON_THROW_ON_ERROR);
} catch (HawkiClientBackendExceptionInterface $e) {
    // Write a simple log entry
    // Can be seen in the docker container logs
    $previousMessage = $e->getPrevious() ? ' Previous: ' . $e->getPrevious()->getMessage() : '';
    error_log('Failed to get Hawki client config: ' . $e->getMessage().$previousMessage);
    
    http_response_code(500);
    
    echo json_encode([
        'error' => $e->getMessage()
    ], JSON_THROW_ON_ERROR);
}
