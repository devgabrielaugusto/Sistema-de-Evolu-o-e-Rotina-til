<?php
// api/tasks.php
require_once '../config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = SUPABASE_URL . '/rest/v1/tasks';

function makeRequest($url, $method, $data = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, getSupabaseHeaders());
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

switch ($method) {
    case 'GET':
        // Fetch all tasks, ordered by created_at
        $url = $endpoint . '?select=*&order=created_at.desc';
        $res = makeRequest($url, 'GET');
        http_response_code($res['code']);
        echo json_encode($res['body']);
        break;

    case 'POST':
        // Create a new task
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            exit;
        }

        $data = [
            'title' => $input['title'],
            'description' => $input['description'] ?? '',
            'status' => $input['status'] ?? 'todo',
            'repetition' => $input['repetition'] ?? 'none'
        ];

        $res = makeRequest($endpoint, 'POST', $data);
        http_response_code($res['code']);
        echo json_encode($res['body']);
        break;

    case 'PUT':
        // Update an existing task (e.g., changing status or repeating)
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Task ID is required']);
            exit;
        }

        $id = $_GET['id'];
        $url = $endpoint . '?id=eq.' . $id;
        
        $data = [];
        if (isset($input['status'])) $data['status'] = $input['status'];
        if (isset($input['title'])) $data['title'] = $input['title'];
        if (isset($input['description'])) $data['description'] = $input['description'];
        if (isset($input['repetition'])) $data['repetition'] = $input['repetition'];

        // Repetition logic: If marking as done and it has repetition, recycle it
        // Note: A more advanced CRM would create a new instance and keep history.
        // For MVP, we reset status to 'todo' if it's recurring.
        if (isset($input['status']) && $input['status'] === 'done') {
            // We need to know its repetition to decide. It should be sent from frontend
            if (isset($input['repetition']) && $input['repetition'] !== 'none') {
                $data['status'] = 'todo';
            }
        }

        $data['updated_at'] = gmdate('Y-m-d\TH:i:s\Z');

        $res = makeRequest($url, 'PATCH', $data); // Supabase uses PATCH for updates
        http_response_code($res['code']);
        echo json_encode($res['body']);
        break;

    case 'DELETE':
        // Delete a task
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Task ID is required']);
            exit;
        }

        $id = $_GET['id'];
        $url = $endpoint . '?id=eq.' . $id;
        $res = makeRequest($url, 'DELETE');
        http_response_code($res['code']);
        echo json_encode(['message' => 'Task deleted']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
