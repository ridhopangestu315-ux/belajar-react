<?php
declare(strict_types=1);

// Pastikan warning/notices masuk ke log PHP dan tidak merusak body JSON API.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

/** Mengirim respons JSON dengan status HTTP yang sesuai. */
function kirimJson(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
