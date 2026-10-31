<?php
declare(strict_types=1);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function crp_reply(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

$private = rtrim(getenv('CROSSROADS_PUBLIC_PRIVATE_DIR') ?: '/home/margar38/crossroads-public-private', '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$config = [];
$ready = false;
try {
    if (is_readable($private . '/mentor.php')) {
        require $private . '/mentor.php';
        $config = crp_config($private);
        $ready = crp_configured($config, $private);
    }
} catch (Throwable $error) {
    $ready = false;
}
if ($method === 'GET' && isset($_GET['status'])) {
    crp_reply(200, ['configured' => $ready, 'message' => $ready ? 'Your AI mentor is available.' : 'Your mission debrief is available. AI mentoring is currently unavailable.']);
}
if ($method !== 'POST') {
    header('Allow: GET, POST');
    crp_reply(405, ['message' => 'Use the game to ask your mentor.']);
}
if (!$ready) {
    crp_reply(503, ['configured' => false, 'message' => 'AI mentoring is currently unavailable. Your mission debrief is ready.']);
}
if (!crp_origin_allowed($_SERVER, is_string($config['public_origin'] ?? null) ? $config['public_origin'] : null)) {
    crp_reply(403, ['message' => 'Ask your mentor from the game page.']);
}
if (!preg_match('/\Aapplication\/json(?:\s*;|\s*\z)/i', $_SERVER['CONTENT_TYPE'] ?? '')) {
    crp_reply(415, ['message' => 'Use a JSON request.']);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) {
    crp_reply(413, ['message' => 'Your recommendation is too long.']);
}
try {
    $raw = file_get_contents('php://input', false, null, 0, 8193);
    if ($raw === false || strlen($raw) > 8192) {
        crp_reply(413, ['message' => 'Your recommendation is too long.']);
    }
    try {
        $body = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        throw new InvalidArgumentException('Invalid request.', 0, $error);
    }
    if (!is_array($body) || array_is_list($body)) {
        throw new InvalidArgumentException('Invalid request.');
    }
    $missions = json_decode((string) file_get_contents($private . '/missions.json'), true, 64, JSON_THROW_ON_ERROR);
    if (!is_array($missions)) {
        throw new RuntimeException('Mission information unavailable.');
    }
    $submission = crp_submission($body, $missions);
    $result = crp_run($submission, $config, $private, (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    crp_reply(200, ['configured' => true] + $result);
} catch (InvalidArgumentException $error) {
    crp_reply(400, ['message' => 'Complete your mission choices and write your own contribution (up to 1,200 characters).']);
} catch (OverflowException $error) {
    header('Retry-After: 30');
    crp_reply(429, ['message' => $error->getMessage()]);
} catch (Throwable $error) {
    crp_reply(502, ['message' => 'Your AI mentor could not respond just now. Your mission and debrief are saved; you can try again later.']);
}
