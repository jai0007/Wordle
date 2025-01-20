const WORD_LENGTH = 5;
const TRIES = 6;
const KEYBOARD_LETTERS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

let WORDS = [];

let currentWord = '';
let currentRow = 0;
let gameOver = false;
let targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];

async function loadDictionary() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/charlesreid1/five-letter-words/master/sgb-words.txt');
        const text = await response.text();
        WORDS = text.split('\n')
            .map(word => word.trim().toUpperCase())
            .filter(word => word.length === 5);
        
        // Initialize the game with a random word after dictionary is loaded
        targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    } catch (error) {
        console.error('Error loading dictionary:', error);
        // Fallback to a small set of words if fetch fails
        WORDS = ['APPLE', 'HOUSE', 'BRAIN', 'CLOUD', 'SMILE'];
        targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    }
}

function initializeBoard() {
    const board = document.getElementById('board');
    for (let i = 0; i < TRIES; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let j = 0; j < WORD_LENGTH; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
}

function initializeKeyboard() {
    const keyboard = document.getElementById('keyboard');
    KEYBOARD_LETTERS.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';
        row.forEach(letter => {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = letter;
            // Add data-key attribute for letter keys
            if (letter.length === 1) {
                key.setAttribute('data-key', letter);
            }
            key.addEventListener('click', () => handleKeyPress(letter));
            keyboardRow.appendChild(key);
        });
        keyboard.appendChild(keyboardRow);
    });
}

function handleKeyPress(key) {
    if (gameOver) return;

    if (key === '⌫') {
        if (currentWord.length > 0) {
            currentWord = currentWord.slice(0, -1);
            updateBoard();
        }
    } else if (key === 'Enter') {
        if (currentWord.length === WORD_LENGTH) {
            checkWord();
        }
    } else if (currentWord.length < WORD_LENGTH) {
        currentWord += key;
        updateBoard();
    }
}

function updateBoard() {
    const row = document.querySelectorAll('.row')[currentRow];
    const tiles = row.querySelectorAll('.tile');
    tiles.forEach((tile, index) => {
        tile.textContent = currentWord[index] || '';
    });
}

function resetGame() {
    // Reset game state
    currentWord = '';
    currentRow = 0;
    gameOver = false;
    targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    
    // Clear the board
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.textContent = '';
        tile.className = 'tile';
    });
    
    // Reset keyboard colors
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
    
    // Hide new game button
    document.getElementById('newGameBtn').style.display = 'none';
}

function checkWord() {
    if (!WORDS.includes(currentWord)) {
        alert('Not a valid word!');
        return;
    }

    const row = document.querySelectorAll('.row')[currentRow];
    const tiles = row.querySelectorAll('.tile');
    let correct = 0;
    const letterStates = new Map();

    // Create a map to count remaining letters in target word
    let remainingLetters = {};
    for (let letter of targetWord) {
        remainingLetters[letter] = (remainingLetters[letter] || 0) + 1;
    }

    // First pass: mark correct letters
    tiles.forEach((tile, index) => {
        const letter = currentWord[index];
        tile.textContent = letter;
        
        if (letter === targetWord[index]) {
            tile.classList.add('correct');
            remainingLetters[letter]--;
            letterStates.set(letter, 'correct');
            correct++;
        }
    });

    // Second pass: mark present and absent letters
    tiles.forEach((tile, index) => {
        const letter = currentWord[index];
        
        // Skip letters that were already marked as correct
        if (!tile.classList.contains('correct')) {
            if (remainingLetters[letter] && remainingLetters[letter] > 0) {
                tile.classList.add('present');
                remainingLetters[letter]--;
                if (!letterStates.has(letter) || letterStates.get(letter) !== 'correct') {
                    letterStates.set(letter, 'present');
                }
            } else {
                tile.classList.add('absent');
                if (!letterStates.has(letter)) {
                    letterStates.set(letter, 'absent');
                }
            }
        }
    });

    // Update keyboard colors
    letterStates.forEach((state, letter) => {
        const keyElement = document.querySelector(`.key[data-key="${letter}"]`);
        if (keyElement) {
            keyElement.classList.remove('correct', 'present', 'absent');
            keyElement.classList.add(state);
        }
    });

    if (correct === WORD_LENGTH) {
        gameOver = true;
        alert('Congratulations! You won!');
        document.getElementById('newGameBtn').style.display = 'block';
        return;
    }

    if (currentRow === TRIES - 1) {
        gameOver = true;
        alert(`Game Over! The word was ${targetWord}`);
        document.getElementById('newGameBtn').style.display = 'block';
        return;
    }

    currentRow++;
    currentWord = '';
}

// Modify the initialization to load dictionary first
document.addEventListener('DOMContentLoaded', async () => {
    await loadDictionary();
    initializeBoard();
    initializeKeyboard();
    
    // Add new game button listener
    document.getElementById('newGameBtn').addEventListener('click', resetGame);
});

// Add keyboard support
document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();
    if (key === 'BACKSPACE') {
        handleKeyPress('⌫');
    } else if (key === 'ENTER') {
        handleKeyPress('Enter');
    } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
    }
}); 