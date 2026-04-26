class MemoryMatch {
    constructor() {
        this.emojis = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎲', '🎰', '🎳', '🎯', '🎪', '🎨', '🎭', '🎮', '🎸', '🎺', '🎲'];
        this.difficulties = {
            easy: { cols: 4, rows: 3 },
            medium: { cols: 4, rows: 4 },
            hard: { cols: 6, rows: 4 }
        };
        
        this.currentDifficulty = 'easy';
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.hints = 3;
        this.timer = null;
        this.seconds = 0;
        this.isProcessing = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadBestScore();
        this.startNewGame();
    }
    
    setupEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeDifficulty(e.target.dataset.difficulty);
            });
        });
        
        // Control buttons
        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('hint-btn').addEventListener('click', () => this.useHint());
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.startNewGame();
        });
        document.getElementById('change-difficulty-btn').addEventListener('click', () => {
            this.hideGameOverModal();
        });
    }
    
    changeDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        
        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
        
        this.startNewGame();
    }
    
    startNewGame() {
        // Reset game state
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.hints = 3;
        this.seconds = 0;
        this.isProcessing = false;
        
        // Clear timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Update UI
        this.updateStats();
        this.updateHintButton();
        
        // Create new game board
        this.createBoard();
    }
    
    createBoard() {
        const board = document.getElementById('game-board');
        const { cols, rows } = this.difficulties[this.currentDifficulty];
        const totalCards = cols * rows;
        const pairs = totalCards / 2;
        
        // Update board class
        board.className = `game-board ${this.currentDifficulty}`;
        
        // Clear existing cards
        board.innerHTML = '';
        
        // Create card pairs
        const selectedEmojis = this.emojis.slice(0, pairs);
        const cardValues = [...selectedEmojis, ...selectedEmojis];
        
        // Shuffle cards
        for (let i = cardValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
        }
        
        // Create card elements
        cardValues.forEach((value, index) => {
            const card = this.createCard(value, index);
            board.appendChild(card);
            this.cards.push({ element: card, value, index, isFlipped: false, isMatched: false });
        });
    }
    
    createCard(value, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.value = value;
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-face card-front';
        cardFront.textContent = '?';
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-face card-back';
        cardBack.textContent = value;
        
        card.appendChild(cardFront);
        card.appendChild(cardBack);
        
        card.addEventListener('click', () => this.flipCard(index));
        
        return card;
    }
    
    flipCard(index) {
        // Don't allow flipping if processing or already flipped/matched
        if (this.isProcessing) return;
        
        const card = this.cards[index];
        if (card.isFlipped || card.isMatched) return;
        
        // Start timer on first move
        if (this.moves === 0 && !this.timer) {
            this.startTimer();
        }
        
        // Flip the card
        card.isFlipped = true;
        card.element.classList.add('flipped');
        this.flippedCards.push(card);
        
        // Check for match if two cards are flipped
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }
    
    checkMatch() {
        this.isProcessing = true;
        const [card1, card2] = this.flippedCards;
        
        if (card1.value === card2.value) {
            // Match found
            setTimeout(() => {
                card1.isMatched = true;
                card2.isMatched = true;
                card1.element.classList.add('matched');
                card2.element.classList.add('matched');
                
                this.matchedPairs++;
                this.flippedCards = [];
                this.isProcessing = false;
                
                // Check for game over
                if (this.matchedPairs === this.cards.length / 2) {
                    this.gameOver();
                }
            }, 600);
        } else {
            // No match
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                card1.element.classList.remove('flipped');
                card2.element.classList.remove('flipped');
                
                this.flippedCards = [];
                this.isProcessing = false;
            }, 1000);
        }
    }
    
    useHint() {
        if (this.hints <= 0 || this.isProcessing) return;
        
        // Find unmatched cards
        const unmatchedCards = this.cards.filter(card => !card.isMatched && !card.isFlipped);
        if (unmatchedCards.length < 2) return;
        
        // Find a matching pair
        let hintCards = [];
        for (let i = 0; i < unmatchedCards.length; i++) {
            for (let j = i + 1; j < unmatchedCards.length; j++) {
                if (unmatchedCards[i].value === unmatchedCards[j].value) {
                    hintCards = [unmatchedCards[i], unmatchedCards[j]];
                    break;
                }
            }
            if (hintCards.length > 0) break;
        }
        
        if (hintCards.length === 2) {
            this.hints--;
            this.updateHintButton();
            
            // Show hint animation
            hintCards.forEach(card => {
                card.element.classList.add('hint');
                setTimeout(() => {
                    card.element.classList.remove('hint');
                }, 2000);
            });
        }
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateTimer();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateStats() {
        document.getElementById('moves').textContent = this.moves;
    }
    
    updateTimer() {
        const minutes = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateHintButton() {
        const hintBtn = document.getElementById('hint-btn');
        hintBtn.textContent = `Hint (${this.hints})`;
        hintBtn.disabled = this.hints <= 0;
    }
    
    gameOver() {
        this.stopTimer();
        
        // Update final stats
        document.getElementById('final-moves').textContent = this.moves;
        const minutes = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        document.getElementById('final-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Save best score
        this.saveBestScore();
        
        // Show game over modal
        setTimeout(() => {
            document.getElementById('gameOverModal').classList.add('active');
        }, 500);
    }
    
    hideGameOverModal() {
        document.getElementById('gameOverModal').classList.remove('active');
    }
    
    saveBestScore() {
        const key = `memoryMatch_best_${this.currentDifficulty}`;
        const currentBest = localStorage.getItem(key);
        
        if (!currentBest || this.moves < parseInt(currentBest)) {
            localStorage.setItem(key, this.moves.toString());
            this.loadBestScore();
        }
    }
    
    loadBestScore() {
        const key = `memoryMatch_best_${this.currentDifficulty}`;
        const best = localStorage.getItem(key);
        document.getElementById('best').textContent = best || '--';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MemoryMatch();
});
