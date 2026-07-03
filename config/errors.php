<?php
/**
 * Production-safe API error messages.
 *
 * Set TCG_DEBUG=1 for full exception text (local dev / PHPUnit).
 * Set TCG_PRODUCTION=1 to force sanitization; default is sanitized when TCG_DEBUG is unset.
 */

function tcgIsDebugErrors(): bool {
    $debug = getenv('TCG_DEBUG');
    return $debug === '1' || strtolower((string)$debug) === 'true';
}

function tcgIsProduction(): bool {
    if (tcgIsDebugErrors()) {
        return false;
    }
    $prod = getenv('TCG_PRODUCTION');
    if ($prod === '0' || strtolower((string)$prod) === 'false') {
        return false;
    }
    if ($prod === '1' || strtolower((string)$prod) === 'true') {
        return true;
    }
    return true;
}

function tcgPublicErrorMessage(Throwable $e, int $httpCode): string {
    if (tcgIsDebugErrors()) {
        return $e->getMessage();
    }
    if ($httpCode >= 500) {
        return 'Server error';
    }
    if ($e instanceof InvalidArgumentException) {
        return $e->getMessage();
    }
    $msg = trim($e->getMessage());
    if ($httpCode === 400 && $msg !== '') {
        return $msg;
    }
    return $msg !== '' ? $msg : 'Request failed';
}
