<?php
/**
 * Serve permanently cached card images (tcg/cardimg/*.png).
 * GET ?card_no=LL-bp1-001-R+  → image bytes or 404
 */

require_once __DIR__ . '/cardimg_cache.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    http_response_code(200);
    exit;
}

$cardNo = (string)($_GET['card_no'] ?? '');
$file = localCardImageFile($cardNo);

if (!$file && $cardNo !== '') {
    $url = lookupCardImageUrl($cardNo);
    if ($url !== '') {
        try {
            cacheCardImageFromUrl($cardNo, $url);
            $file = localCardImageFile($cardNo);
        } catch (Throwable $e) {
            // fall through to 404
        }
    }
}

if (!$file) {
    header('Access-Control-Allow-Origin: *');
    http_response_code(404);
    exit;
}

$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$types = [
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'webp' => 'image/webp',
    'gif'  => 'image/gif',
];

header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('Cache-Control: public, max-age=31536000, immutable');
header('Access-Control-Allow-Origin: *');
readfile($file);
