<?php
declare(strict_types=1);

// Save as /home/margar38/crossroads-public-private/config.php, outside public_html.
// Read only the existing key and model; keep this game's cache and limits separate.
$sharedFile = '/home/margar38/crossroads-private/config.php';
$shared = [];
if (is_readable($sharedFile)) {
    $loaded = require $sharedFile;
    if (is_array($loaded)) {
        $shared = $loaded;
    }
}

return [
    'api_key' => getenv('OPENAI_API_KEY') ?: ($shared['api_key'] ?? ''),
    'model' => getenv('CROSSROADS_PUBLIC_MODEL') ?: ($shared['model'] ?? ''),
    'hourly_ip_limit' => 8,
    'daily_limit' => 100,
    'cache_ttl' => 86400,
    // Set this only if your host's TLS proxy prevents automatic origin detection:
    // 'public_origin' => 'https://lukajuri.eu',
];
