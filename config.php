<?php
// config.php
// Lê as credenciais do ambiente (Vercel) ou usa um valor fallback
$supabase_url = getenv('SUPABASE_URL') ?: 'SUA_SUPABASE_URL_AQUI';
$supabase_key = getenv('SUPABASE_KEY') ?: 'SUA_SUPABASE_KEY_AQUI';

define('SUPABASE_URL', $supabase_url);
define('SUPABASE_KEY', $supabase_key);

function getSupabaseHeaders() {
    return [
        'apikey: ' . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];
}
?>
