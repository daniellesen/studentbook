let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let timer;
let seconds = 60;
let fullTranscript = '';

// Инициализация распознавания речи
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.interimResults = true;

// Настройка распознавания речи
recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    // Обработка всех результатов
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }

    // Добавляем финальный текст к общему транскрипту
    if (finalTranscript) {
        fullTranscript += finalTranscript;
    }

    // Отображаем текущий текст и промежуточные результаты
    document.getElementById('transcription').innerHTML = 
        `<div style="color: var(--text-light)">${fullTranscript}</div>` +
        `<div style="color: var(--text-secondary)">${interimTranscript}</div>`;
};

// Обработка ошибок распознавания
recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'no-speech' && isRecording) {
        // Перезапускаем распознавание при отсутствии речи
        recognition.stop();
        setTimeout(() => {
            if (isRecording) {
                recognition.start();
            }
        }, 100);
    }
};

// Обработка окончания распознавания
recognition.onend = () => {
    if (isRecording) {
        // Автоматически перезапускаем распознавание, если запись все еще идет
        recognition.start();
    }
};

// Запуск записи
function startRecording() {
    if (isRecording) return;
    
    // Сброс предыдущих результатов
    fullTranscript = '';
    document.getElementById('transcription').textContent = '';
    document.getElementById('feedback').textContent = '';
    
    // Запуск таймера
    seconds = 60;
    updateTimer();
    timer = setInterval(updateTimer, 1000);
    
    // Запуск распознавания речи
    recognition.start();
    isRecording = true;
    
    // Обновление UI
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('stopButton').style.display = 'block';
    document.getElementById('timer').style.display = 'block';
}

// Остановка записи
function stopRecording() {
    if (!isRecording) return;
    
    // Остановка таймера
    clearInterval(timer);
    
    // Остановка распознавания речи
    recognition.stop();
    isRecording = false;
    
    // Обновление UI
    document.getElementById('startButton').style.display = 'block';
    document.getElementById('stopButton').style.display = 'none';
    
    // Анализ использования лексических паттернов
    analyzeSpeech();
}

// Обновление таймера
function updateTimer() {
    if (seconds <= 0) {
        stopRecording();
        return;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    seconds--;
}

// Анализ речи и проверка использования лексических паттернов
async function analyzeSpeech() {
    const transcript = fullTranscript;
    try {
        const requiredPatterns = await getRequiredPatterns();
        // Подсчет использованных паттернов
        const usedPatterns = requiredPatterns.patterns.filter(pattern => 
            transcript.toLowerCase().includes(pattern.text.toLowerCase())
        );
        // Формирование обратной связи
        const feedback = {
            totalPatterns: requiredPatterns.patterns.length,
            usedPatterns: usedPatterns.length,
            percentage: requiredPatterns.patterns.length > 0 ? Math.round((usedPatterns.length / requiredPatterns.patterns.length) * 100) : 0,
            usedExpressions: usedPatterns,
            totalWords: transcript.split(/\s+/).filter(word => word.length > 0).length
        };
        displayFeedback(feedback);
    } catch (error) {
        console.error('Error analyzing speech:', error);
        displayFeedback({
            totalPatterns: 0,
            usedPatterns: 0,
            percentage: 0,
            usedExpressions: [],
            totalWords: transcript.split(/\s+/).filter(word => word.length > 0).length
        });
    }
}

// Получение требуемых лексических паттернов для текущей темы
async function getRequiredPatterns() {
    try {
        const response = await fetch('php/get_speaking_data.php?action=get_patterns&unit_id=1', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching patterns:', error);
        return getDefaultPatterns();
    }
}

// Получение случайных слов из базы данных
async function getRandomWordsFromDB() {
    try {
        const response = await fetch('php/get_speaking_data.php?action=get_words&unit_id=1', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching words:', error);
        return getRandomWordsFromUnit();
    }
}

// Получение случайной темы из базы данных
async function getRandomTopicFromDB() {
    try {
        const response = await fetch('php/get_speaking_data.php?action=get_topic&unit_id=1', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching topic:', error);
        return getRandomTopic();
    }
}

// Дефолтные паттерны на случай ошибки
function getDefaultPatterns() {
    return [
        "in terms of",
        "with regard to",
        "as far as",
        "taking into account",
        "considering that",
        "on the other hand",
        "nevertheless",
        "however",
        "despite the fact",
        "although"
    ];
}

// Отображение результатов анализа
function displayFeedback(feedback) {
    const feedbackElement = document.getElementById('feedback');
    feedbackElement.innerHTML = `
        <h3>Результаты анализа:</h3>
        <p>Общее количество слов: ${feedback.totalWords}</p>
        <p>Использовано ${feedback.usedPatterns} из ${feedback.totalPatterns} необходимых выражений (${feedback.percentage}%)</p>
        <h4>Использованные выражения:</h4>
        <ul>
            ${feedback.usedExpressions.map(exp => `<li>${exp}</li>`).join('')}
        </ul>
        <p class="feedback-score">Общая оценка: ${getFeedbackScore(feedback.percentage)}</p>
    `;
}

// Определение оценки на основе процента использованных выражений
function getFeedbackScore(percentage) {
    if (percentage >= 90) return 'Отлично!';
    if (percentage >= 70) return 'Хорошо';
    if (percentage >= 50) return 'Удовлетворительно';
    return 'Нужно поработать над использованием лексических паттернов';
}

// Получение случайных слов из юнита
function getRandomWordsFromUnit() {
    const wordElements = document.querySelectorAll('.word-list li strong');
    const words = Array.from(wordElements).map(el => el.textContent);
    return getRandomElements(words, 5); // Возвращаем 5 случайных слов
}

// Получение случайных фразовых глаголов
function getRandomPhrasalVerbs() {
    const phrasalElements = document.querySelectorAll('.phrasal-list li strong');
    const phrasals = Array.from(phrasalElements).map(el => el.textContent);
    return getRandomElements(phrasals, 3); // Возвращаем 3 случайных фразовых глагола
}

// Получение случайных идиом
function getRandomIdioms() {
    const idiomElements = document.querySelectorAll('.idioms-list li strong');
    const idioms = Array.from(idiomElements).map(el => el.textContent);
    return getRandomElements(idioms, 2); // Возвращаем 2 случайные идиомы
}

// Вспомогательная функция для получения случайных элементов из массива
function getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Список тем для случайного выбора
const TOPICS = [
    "The impact of technology on modern education",
    "Environmental challenges and sustainable solutions",
    "The role of social media in contemporary society",
    "Work-life balance in the digital age",
    "Cultural diversity in global business",
    "The future of artificial intelligence",
    "Mental health awareness in modern society",
    "The importance of lifelong learning",
    "Urban development and city planning",
    "The role of government in healthcare"
];

// Получение случайной темы
function getRandomTopic() {
    return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

// Обновление темы и слов при загрузке страницы
async function updateSpeakingTask() {
    const topicElement = document.querySelector('.topic-card p');
    const patternsList = document.getElementById('patternsList');

    try {
        // Получаем данные из базы данных
        const [topicData, itemsData] = await Promise.all([
            getRandomTopicFromDB(),
            getRandomWordsFromDB()
        ]);

        // Обновляем тему
        topicElement.textContent = topicData.topic;
        if (topicData.description) {
            let descriptionElement = topicElement.parentNode.querySelector('.topic-description');
            if (!descriptionElement) {
                descriptionElement = document.createElement('p');
                descriptionElement.className = 'topic-description';
                topicElement.parentNode.appendChild(descriptionElement);
            }
            descriptionElement.textContent = topicData.description;
        }

        // Обновляем список паттернов
        patternsList.innerHTML = '';

        // Добавляем слова и выражения
        if (itemsData.items && itemsData.items.length > 0) {
            itemsData.items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${item.text}</strong> <em>${item.translation}</em> <span class="item-type">(${item.type})</span>`;
                patternsList.appendChild(li);
            });
        } else {
            patternsList.innerHTML = '<li>Нет данных для отображения</li>';
        }
    } catch (error) {
        console.error('Error updating speaking task:', error);
        patternsList.innerHTML = '<li>Ошибка загрузки данных из базы</li>';
        topicElement.textContent = 'Ошибка загрузки темы';
    }
}

// Вызываем обновление при загрузке страницы
document.addEventListener('DOMContentLoaded', updateSpeakingTask);

// Функция для поиска перевода
async function searchTranslation(text) {
    try {
        const response = await fetch(`php/get_speaking_data.php?action=search_translation&text=${encodeURIComponent(text)}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error searching translation:', error);
        return [];
    }
}

// Обработчик поиска
let searchTimeout;
const searchInput = document.getElementById('dictionary-search');
const searchButton = document.getElementById('search-button');

function performSearch() {
    const searchText = searchInput.value.trim();
    
    if (searchText.length < 2) {
        document.getElementById('dictionary-results').innerHTML = '<p class="no-results">Please enter at least 2 characters</p>';
        return;
    }
    
    searchTranslation(searchText).then(results => {
        displaySearchResults(results);
    });
}

// Поиск при вводе с задержкой
searchInput.addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    
    if (e.target.value.trim().length < 2) {
        document.getElementById('dictionary-results').innerHTML = '';
        return;
    }
    
    searchTimeout = setTimeout(performSearch, 300);
});

// Поиск при нажатии кнопки
searchButton.addEventListener('click', performSearch);

// Поиск при нажатии Enter
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Обновляем функцию отображения результатов
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('dictionary-results');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No results found</p>';
        return;
    }
    
    const ul = document.createElement('ul');
    ul.className = 'dictionary-list';
    
    results.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="dictionary-item">
                <span class="dictionary-text">${item.text}</span>
                <span class="dictionary-translation">${item.translation}</span>
                <span class="dictionary-type">${item.type}</span>
            </div>
        `;
        ul.appendChild(li);
    });
    
    resultsContainer.appendChild(ul);
} 