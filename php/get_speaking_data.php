<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

function getRandomTopic($unit_id) {
    global $conn;
    
    // Получаем случайную тему из существующих фраз
    $sql = "SELECT phrase_text as topic, translation_ru as description 
            FROM phrases 
            WHERE unit_id = ? 
            ORDER BY RAND() 
            LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $unit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return [
            'topic' => $row['topic'],
            'description' => $row['description']
        ];
    }
    
    return null;
}

function getSpeakingItems($unit_id) {
    global $conn;
    
    $items = [];
    
    // Получаем 2 случайные фразы
    $sql = "SELECT phrase_text as text, translation_ru as translation, 'phrase' as type 
            FROM phrases 
            WHERE unit_id = ? 
            ORDER BY RAND() 
            LIMIT 2";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $unit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    // Получаем 1 случайную идиому
    $sql = "SELECT idiom_text as text, translation_ru as translation, 'idiom' as type 
            FROM idioms 
            WHERE unit_id = ? 
            ORDER BY RAND() 
            LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $unit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    // Получаем 1 случайный фразовый глагол
    $sql = "SELECT phrasal_verb as text, translation_ru as translation, 'phrasal' as type 
            FROM phrasal_verbs 
            WHERE unit_id = ? 
            ORDER BY RAND() 
            LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $unit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    return ['items' => $items];
}

function getRequiredPatterns($unit_id) {
    global $conn;
    
    $patterns = [];
    
    // Получаем 2 случайные фразы
    $sql = "SELECT phrase_text as text, translation_ru as translation 
            FROM phrases 
            WHERE unit_id = ? 
            ORDER BY RAND() 
            LIMIT 2";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $unit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $patterns[] = $row;
    }
    
    // Получаем 1 случайную идиому
    $sql = "SELECT idiom_text as text, translation_ru as translation 
            FROM idioms 
            WHERE unit_id = ? 
            ORDER BY RAND() 
            LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $unit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $patterns[] = $row;
    }
    
    // Получаем 1 случайный фразовый глагол
    $sql = "SELECT phrasal_verb as text, translation_ru as translation 
            FROM phrasal_verbs 
            WHERE unit_id = ? 
            ORDER BY RAND() 
            LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $unit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $patterns[] = $row;
    }
    
    return ['patterns' => $patterns];
}

// Обработка AJAX-запросов
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $unit_id = isset($_GET['unit_id']) ? (int)$_GET['unit_id'] : 1; // По умолчанию Unit 2 (id=1)
    
    switch ($action) {
        case 'get_topic':
            echo json_encode(getRandomTopic($unit_id));
            break;
            
        case 'get_words':
            echo json_encode(getSpeakingItems($unit_id));
            break;
            
        case 'get_patterns':
            echo json_encode(getRequiredPatterns($unit_id));
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?> 