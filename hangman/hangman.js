class HangmanGame {
    constructor() {
        this.words = [
            { word: 'JAVASCRIPT', hint: 'Popular programming language' },
            { word: 'CANVAS', hint: 'HTML element for drawing' },
            { word: 'FUNCTION', hint: 'Reusable code block' },
            { word: 'VARIABLE', hint: 'Container for data' },
            { word: 'ALGORITHM', hint: 'Step-by-step procedure' },
            { word: 'DATABASE', hint: 'Organized data storage' },
            { word: 'FRAMEWORK', hint: 'Software development platform' },
            { word: 'DEBUGGING', hint: 'Finding and fixing errors' },
            { word: 'INTERFACE', hint: 'Point of interaction' },
            { word: 'COMPONENT', hint: 'Reusable UI element' },
            { word: 'ASYNCHRONOUS', hint: 'Non-executing order' },
            { word: 'RESPONSIVE', hint: 'Adapts to screen size' },
            { word: 'VALIDATION', hint: 'Checking correctness' },
            { word: 'OPTIMIZATION', hint: 'Improving performance' },
            { word: 'ARCHITECTURE', hint: 'System structure design' }
        ];
        
        this.currentWord = '';
        this.currentHint = '';
        this.guessedLetters = new Set();
        this.wrongGuesses = 0;
        this.maxWrongGuesses = 6;
        this.gameOver = false;
        this.hintUsed = false;
        
        // Statistics
        this.stats = {
            wins: parseInt(localStorage.getItem('hangman_wins') || '0'),
            losses: parseInt(localStorage.getItem('hangman_losses') || '0'),
            streak: parseInt(localStorage.getItem('hangman_streak') || '0')
        };
        
        this.bodyParts = ['head', 'body', 'leftarm', 'rightarm', 'leftleg', 'rightleg'];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateStats();
        this.startNewGame();
    }
    
    bindEvents() {
        // Keyboard events
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', () => {
                const letter = key.dataset.letter;
                this.guessLetter(letter);
            });
        });
        
        // Physical keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            const letter = e.key.toUpperCase();
            if (/^[A-Z]$/.test(letter) && !this.guessedLetters.has(letter)) {
                this.guessLetter(letter);
            }
        });
        
        // Control buttons
        document.getElementById('newGame').addEventListener('click', () => this.startNewGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.useHint());
    }
    
    startNewGame() {
        // Reset game state
        const wordObj = this.words[Math.floor(Math.random() * this.words.length)];
        this.currentWord = wordObj.word;
        this.currentHint = wordObj.hint;
        this.guessedLetters.clear();
        this.wrongGuesses = 0;
        this.gameOver = false;
        this.hintUsed = false;
        
        // Reset UI
        this.resetKeyboard();
        this.resetHangman();
        this.updateWordDisplay();
        this.hideMessage();
        document.getElementById('hint').textContent = '';
        document.getElementById('hintBtn').disabled = false;
    }
    
    resetKeyboard() {
        document.querySelectorAll('.key').forEach(key => {
            key.disabled = false;
            key.classList.remove('correct', 'wrong');
        });
    }
    
    resetHangman() {
        this.bodyParts.forEach(part => {
            document.getElementById(part).style.display = 'none';
        });
    }
    
    guessLetter(letter) {
        if (this.gameOver || this.guessedLetters.has(letter)) return;
        
        this.guessedLetters.add(letter);
        const key = document.querySelector(`[data-letter="${letter}"]`);
        key.disabled = true;
        
        if (this.currentWord.includes(letter)) {
            // Correct guess
            key.classList.add('correct');
            this.updateWordDisplay();
            
            if (this.checkWin()) {
                this.endGame(true);
            }
        } else {
            // Wrong guess
            key.classList.add('wrong');
            this.wrongGuesses++;
            this.showBodyPart();
            
            if (this.wrongGuesses >= this.maxWrongGuesses) {
                this.endGame(false);
            }
        }
    }
    
    showBodyPart() {
        const part = this.bodyParts[this.wrongGuesses - 1];
        document.getElementById(part).style.display = 'block';
    }
    
    updateWordDisplay() {
        const wordContainer = document.getElementById('word');
        wordContainer.innerHTML = '';
        
        for (let letter of this.currentWord) {
            const letterDiv = document.createElement('div');
            letterDiv.className = 'letter';
            
            if (this.guessedLetters.has(letter)) {
                letterDiv.textContent = letter;
                letterDiv.classList.add('revealed');
            } else {
                letterDiv.textContent = '';
            }
            
            wordContainer.appendChild(letterDiv);
        }
    }
    
    checkWin() {
        return this.currentWord.split('').every(letter => this.guessedLetters.has(letter));
    }
    
    endGame(won) {
        this.gameOver = true;
        
        if (won) {
            this.stats.wins++;
            this.stats.streak++;
            this.showMessage(`🎉 Congratulations! You won! The word was ${this.currentWord}`, 'success');
        } else {
            this.stats.losses++;
            this.stats.streak = 0;
            this.showMessage(`😔 Game Over! The word was ${this.currentWord}`, 'error');
            // Reveal all letters
            this.guessedLetters = new Set(this.currentWord.split(''));
            this.updateWordDisplay();
        }
        
        this.saveStats();
        this.updateStats();
        
        // Disable all keys
        document.querySelectorAll('.key').forEach(key => {
            key.disabled = true;
        });
        
        document.getElementById('hintBtn').disabled = true;
    }
    
    useHint() {
        if (this.hintUsed || this.gameOver) return;
        
        this.hintUsed = true;
        document.getElementById('hint').textContent = `Hint: ${this.currentHint}`;
        document.getElementById('hintBtn').disabled = true;
        
        // Penalty: show one random unguessed letter
        const unguessedLetters = this.currentWord.split('').filter(letter => !this.guessedLetters.has(letter));
        if (unguessedLetters.length > 0) {
            const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
            this.guessLetter(randomLetter);
        }
    }
    
    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
    }
    
    hideMessage() {
        const messageEl = document.getElementById('message');
        messageEl.textContent = '';
        messageEl.className = 'message';
    }
    
    updateStats() {
        document.getElementById('wins').textContent = this.stats.wins;
        document.getElementById('losses').textContent = this.stats.losses;
        document.getElementById('streak').textContent = this.stats.streak;
    }
    
    saveStats() {
        localStorage.setItem('hangman_wins', this.stats.wins.toString());
        localStorage.setItem('hangman_losses', this.stats.losses.toString());
        localStorage.setItem('hangman_streak', this.stats.streak.toString());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HangmanGame();
});
