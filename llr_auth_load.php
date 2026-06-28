<?php
/**
 * Auth bootstrap for account.php and deck preset loading.
 *
 * Production: gitignored llr_auth.php (Discord session, same scheme as wrapped/).
 * Contributors: llr_auth_offline.php (guest/CPU only; account APIs return 401).
 */
if (is_file(__DIR__ . '/llr_auth.php')) {
    require_once __DIR__ . '/llr_auth.php';
} else {
    require_once __DIR__ . '/llr_auth_offline.php';
}
