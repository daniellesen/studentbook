<?php
$host = 'localhost';
$dbname = 'senelschi2_senel';
$username = 'senelschi2_senel';
$password = 'ckhd&rdS8vsUunq5';

try {
    $conn = new mysqli($host, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    die("Database connection failed: " . $e->getMessage());
}
?> 