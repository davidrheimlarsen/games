class MemoryMatch {
    constructor() {
        this.themes = {
            emojis: ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎲', '🎰', '🎳', '🎯', '🎪', '🎨', '🎭', '🎮', '🎸', '🎺', '🎲'],
            numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦']
        };
        this.currentTheme = 'emojis';
        this.customTheme = null;
        
        this.difficulties = {
            easy: { cols: 4, rows: 3 },
            medium: { cols: 4, rows: 4 },
            hard: { cols: 6, rows: 4 }
        };
        
        this.currentDifficulty = 'easy';
        this.gameMode = 'single';
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.hints = 3;
        this.timer = null;
        this.seconds = 0;
        this.isProcessing = false;
        
        this.multiplayer = {
            currentPlayer: 1,
            player1Score: 0,
            player2Score: 0,
            player1Moves: 0,
            player2Moves: 0
        };
        
        this.statistics = this.loadStatistics();
        this.tutorialStep = 1;
        
        // Score system
        this.score = 0;
        this.baseScore = 100;
        this.timeBonus = 0;
        this.accuracyBonus = 0;
        
        // Achievements system
        this.achievements = this.loadAchievements();
        
        // Theme system
        this.currentUITheme = this.loadUITheme();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadBestScore();
        this.applyUITheme();
        this.startNewGame();
    }
    
    setupEventListeners() {
        // Mode buttons
        document.getElementById('single-player-btn').addEventListener('click', () => this.changeMode('single'));
        document.getElementById('multiplayer-btn').addEventListener('click', () => this.changeMode('multiplayer'));
        document.getElementById('tutorial-btn').addEventListener('click', () => this.startTutorial());
        
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
        
        // Theme and stats buttons
        document.getElementById('themes-btn').addEventListener('click', () => this.showThemesModal());
        document.getElementById('stats-btn').addEventListener('click', () => this.showStatsModal());
        document.getElementById('achievements-btn').addEventListener('click', () => this.showAchievementsModal());
        document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleUITheme());
        document.getElementById('close-themes-btn').addEventListener('click', () => this.hideThemesModal());
        document.getElementById('close-stats-btn').addEventListener('click', () => this.hideStatsModal());
        document.getElementById('close-achievements-btn').addEventListener('click', () => this.hideAchievementsModal());
        document.getElementById('reset-stats-btn').addEventListener('click', () => this.resetStatistics());
        document.getElementById('apply-custom-theme').addEventListener('click', () => this.applyCustomTheme());
        
        // Theme selection
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTheme(e.target.dataset.theme);
            });
        });
        
        // Tutorial navigation
        document.querySelectorAll('.tutorial-next').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.nextTutorialStep(parseInt(e.target.dataset.step));
            });
        });
        document.querySelector('.tutorial-start').addEventListener('click', () => this.endTutorial());
    }
    
    changeMode(mode) {
        this.gameMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Show/hide multiplayer info
        const multiplayerInfo = document.getElementById('multiplayer-info');
        if (mode === 'multiplayer') {
            multiplayerInfo.style.display = 'block';
        } else {
            multiplayerInfo.style.display = 'none';
        }
        
        this.startNewGame();
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
        
        // Reset score
        this.score = 0;
        this.timeBonus = 0;
        this.accuracyBonus = 0;
        this.updateScoreDisplay();
        
        // Reset multiplayer state
        if (this.gameMode === 'multiplayer') {
            this.multiplayer.currentPlayer = 1;
            this.multiplayer.player1Score = 0;
            this.multiplayer.player2Score = 0;
            this.multiplayer.player1Moves = 0;
            this.multiplayer.player2Moves = 0;
            this.updateMultiplayerUI();
        }
        
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
        
        // Get current theme items
        const themeItems = this.getCurrentThemeItems();
        
        // Create card pairs
        const selectedItems = themeItems.slice(0, pairs);
        const cardValues = [...selectedItems, ...selectedItems];
        
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
        
        // Track moves for multiplayer
        if (this.gameMode === 'multiplayer') {
            if (this.multiplayer.currentPlayer === 1) {
                this.multiplayer.player1Moves++;
            } else {
                this.multiplayer.player2Moves++;
            }
        }
        
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
                
                // Update multiplayer score
                if (this.gameMode === 'multiplayer') {
                    if (this.multiplayer.currentPlayer === 1) {
                        this.multiplayer.player1Score++;
                    } else {
                        this.multiplayer.player2Score++;
                    }
                    this.updateMultiplayerUI();
                    // Player gets another turn on match
                } else {
                    // Single player - switch turns doesn't apply
                }
                
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
                
                // Switch turns in multiplayer
                if (this.gameMode === 'multiplayer') {
                    this.multiplayer.currentPlayer = this.multiplayer.currentPlayer === 1 ? 2 : 1;
                    this.updateMultiplayerUI();
                }
                
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
    
    updateScoreDisplay() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }
    
    calculateFinalScore() {
        const { cols, rows } = this.difficulties[this.currentDifficulty];
        const totalPairs = (cols * rows) / 2;
        
        // Base score per pair
        this.score = totalPairs * this.baseScore;
        
        // Time bonus (faster = more points)
        const timeLimit = totalPairs * 10; // 10 seconds per pair as baseline
        if (this.seconds < timeLimit) {
            this.timeBonus = Math.max(0, (timeLimit - this.seconds) * 2);
        }
        
        // Accuracy bonus (fewer moves = more points)
        const minMoves = totalPairs;
        const maxMoves = totalPairs * 3;
        if (this.moves <= minMoves) {
            this.accuracyBonus = 500; // Perfect accuracy bonus
        } else if (this.moves < maxMoves) {
            const accuracyRatio = (maxMoves - this.moves) / (maxMoves - minMoves);
            this.accuracyBonus = Math.round(accuracyRatio * 500);
        }
        
        // Hint penalty
        const hintPenalty = (3 - this.hints) * 50;
        
        this.score += this.timeBonus + this.accuracyBonus - hintPenalty;
        this.score = Math.max(0, this.score); // Ensure score doesn't go negative
        
        this.updateScoreDisplay();
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
        
        // Calculate final score
        this.calculateFinalScore();
        
        // Update statistics
        this.updateStatistics();
        
        // Check for achievements
        this.checkAchievements();
        
        // Update final stats
        document.getElementById('final-moves').textContent = this.moves;
        const minutes = Math.floor(this.seconds / 60);
        const secs = this.seconds % 60;
        document.getElementById('final-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Customize game over message for multiplayer
        const messageElement = document.getElementById('game-over-message');
        if (this.gameMode === 'multiplayer') {
            const winner = this.multiplayer.player1Score > this.multiplayer.player2Score ? 'Player 1' : 
                          this.multiplayer.player2Score > this.multiplayer.player1Score ? 'Player 2' : 'Nobody';
            messageElement.innerHTML = `${winner} wins! Player 1: ${this.multiplayer.player1Score} pairs, Player 2: ${this.multiplayer.player2Score} pairs. Total moves: ${this.moves} in ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}! Score: ${this.score}`;
        } else {
            messageElement.innerHTML = `You completed the game in <span id="final-moves">${this.moves}</span> moves and <span id="final-time">${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}</span>! Score: ${this.score}`;
        }
        
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
    
    // Multiplayer methods
    updateMultiplayerUI() {
        const player1Info = document.getElementById('player-1-info');
        const player2Info = document.getElementById('player-2-info');
        
        player1Info.querySelector('.player-score').textContent = this.multiplayer.player1Score;
        player2Info.querySelector('.player-score').textContent = this.multiplayer.player2Score;
        
        // Update active player indicator
        if (this.multiplayer.currentPlayer === 1) {
            player1Info.classList.add('active');
            player2Info.classList.remove('active');
        } else {
            player1Info.classList.remove('active');
            player2Info.classList.add('active');
        }
    }
    
    // Theme methods
    getCurrentThemeItems() {
        if (this.customTheme) {
            return this.customTheme;
        }
        return this.themes[this.currentTheme];
    }
    
    selectTheme(theme) {
        this.currentTheme = theme;
        this.customTheme = null;
        
        // Update UI
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
        
        this.startNewGame();
    }
    
    applyCustomTheme() {
        const input = document.getElementById('custom-theme-input').value.trim();
        if (!input) return;
        
        const items = input.split('\n').map(item => item.trim()).filter(item => item.length > 0);
        if (items.length < 12) {
            alert('Please enter at least 12 items for a custom theme.');
            return;
        }
        
        this.customTheme = items;
        this.currentTheme = 'custom';
        
        // Update UI
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.hideThemesModal();
        this.startNewGame();
    }
    
    // Modal methods
    showThemesModal() {
        document.getElementById('themesModal').classList.add('active');
    }
    
    hideThemesModal() {
        document.getElementById('themesModal').classList.remove('active');
    }
    
    showStatsModal() {
        this.updateStatsDisplay();
        document.getElementById('statsModal').classList.add('active');
    }
    
    hideStatsModal() {
        document.getElementById('statsModal').classList.remove('active');
    }
    
    showAchievementsModal() {
        this.updateAchievementsDisplay();
        document.getElementById('achievementsModal').classList.add('active');
    }
    
    hideAchievementsModal() {
        document.getElementById('achievementsModal').classList.remove('active');
    }
    
    // Statistics methods
    loadStatistics() {
        const stats = localStorage.getItem('memoryMatch_statistics');
        return stats ? JSON.parse(stats) : {
            gamesPlayed: 0,
            bestScores: { easy: null, medium: null, hard: null },
            totalMoves: 0,
            totalTime: 0,
            highScore: null
        };
    }
    
    saveStatistics() {
        localStorage.setItem('memoryMatch_statistics', JSON.stringify(this.statistics));
    }
    
    updateStatistics() {
        this.statistics.gamesPlayed++;
        this.statistics.totalMoves += this.moves;
        this.statistics.totalTime += this.seconds;
        
        // Update high score
        if (!this.statistics.highScore || this.score > this.statistics.highScore) {
            this.statistics.highScore = this.score;
        }
        
        const key = `memoryMatch_best_${this.currentDifficulty}`;
        const currentBest = this.statistics.bestScores[this.currentDifficulty];
        
        if (!currentBest || this.moves < currentBest) {
            this.statistics.bestScores[this.currentDifficulty] = this.moves;
        }
        
        this.saveStatistics();
    }
    
    updateStatsDisplay() {
        document.getElementById('total-games').textContent = this.statistics.gamesPlayed;
        document.getElementById('best-easy').textContent = this.statistics.bestScores.easy || '--';
        document.getElementById('best-medium').textContent = this.statistics.bestScores.medium || '--';
        document.getElementById('best-hard').textContent = this.statistics.bestScores.hard || '--';
        
        const avgMoves = this.statistics.gamesPlayed > 0 ? 
            Math.round(this.statistics.totalMoves / this.statistics.gamesPlayed) : '--';
        document.getElementById('avg-moves').textContent = avgMoves;
        
        const totalMinutes = Math.floor(this.statistics.totalTime / 60);
        const totalSeconds = this.statistics.totalTime % 60;
        document.getElementById('total-time').textContent = 
            `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
        
        document.getElementById('high-score').textContent = this.statistics.highScore || '--';
    }
    
    resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            this.statistics = {
                gamesPlayed: 0,
                bestScores: { easy: null, medium: null, hard: null },
                totalMoves: 0,
                totalTime: 0,
                highScore: null
            };
            this.saveStatistics();
            this.updateStatsDisplay();
        }
    }
    
    // Tutorial methods
    startTutorial() {
        this.tutorialStep = 1;
        document.getElementById('tutorialOverlay').classList.add('active');
        this.showTutorialStep(1);
    }
    
    showTutorialStep(step) {
        document.querySelectorAll('.tutorial-step').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById(`tutorial-step-${step}`).style.display = 'block';
    }
    
    nextTutorialStep(step) {
        this.tutorialStep = step;
        this.showTutorialStep(step);
    }
    
    endTutorial() {
        document.getElementById('tutorialOverlay').classList.remove('active');
        this.changeMode('single');
    }
    
    // Score system methods
    updateScoreDisplay() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }
    
    calculateFinalScore() {
        const { cols, rows } = this.difficulties[this.currentDifficulty];
        const totalPairs = (cols * rows) / 2;
        
        // Base score per pair
        this.score = totalPairs * this.baseScore;
        
        // Time bonus (faster = more points)
        const timeLimit = totalPairs * 10; // 10 seconds per pair as baseline
        if (this.seconds < timeLimit) {
            this.timeBonus = Math.max(0, (timeLimit - this.seconds) * 2);
        }
        
        // Accuracy bonus (fewer moves = more points)
        const minMoves = totalPairs;
        const maxMoves = totalPairs * 3;
        if (this.moves <= minMoves) {
            this.accuracyBonus = 500; // Perfect accuracy bonus
        } else if (this.moves < maxMoves) {
            const accuracyRatio = (maxMoves - this.moves) / (maxMoves - minMoves);
            this.accuracyBonus = Math.round(accuracyRatio * 500);
        }
        
        // Hint penalty
        const hintPenalty = (3 - this.hints) * 50;
        
        this.score += this.timeBonus + this.accuracyBonus - hintPenalty;
        this.score = Math.max(0, this.score); // Ensure score doesn't go negative
        
        this.updateScoreDisplay();
    }
    
    // Achievements system methods
    loadAchievements() {
        const achievements = localStorage.getItem('memoryMatch_achievements');
        return achievements ? JSON.parse(achievements) : {
            firstGame: { unlocked: false, name: 'First Steps', description: 'Complete your first game', icon: '🎯' },
            speedDemon: { unlocked: false, name: 'Speed Demon', description: 'Complete a game in under 30 seconds', icon: '⚡' },
            perfectMemory: { unlocked: false, name: 'Perfect Memory', description: 'Complete a game with minimum moves', icon: '🧠' },
            noHints: { unlocked: false, name: 'No Hints Needed', description: 'Complete a game without using hints', icon: '🚫' },
            hardMode: { unlocked: false, name: 'Hard Mode Master', description: 'Complete a hard difficulty game', icon: '💪' },
            multiplayerWinner: { unlocked: false, name: 'Champion', description: 'Win a multiplayer game', icon: '🏆' },
            themeExplorer: { unlocked: false, name: 'Theme Explorer', description: 'Try all different themes', icon: '🎨' },
            scoreMaster: { unlocked: false, name: 'Score Master', description: 'Score over 1000 points', icon: '⭐' },
            persistent: { unlocked: false, name: 'Persistent Player', description: 'Play 10 games', icon: '🎮' },
            collector: { unlocked: false, name: 'Achievement Collector', description: 'Unlock 5 achievements', icon: '🏅' }
        };
    }
    
    saveAchievements() {
        localStorage.setItem('memoryMatch_achievements', JSON.stringify(this.achievements));
    }
    
    checkAchievements() {
        let newUnlocks = [];
        
        // First game
        if (!this.achievements.firstGame.unlocked && this.statistics.gamesPlayed === 1) {
            this.achievements.firstGame.unlocked = true;
            newUnlocks.push(this.achievements.firstGame);
        }
        
        // Speed demon
        if (!this.achievements.speedDemon.unlocked && this.seconds < 30) {
            this.achievements.speedDemon.unlocked = true;
            newUnlocks.push(this.achievements.speedDemon);
        }
        
        // Perfect memory
        const { cols, rows } = this.difficulties[this.currentDifficulty];
        const minMoves = (cols * rows) / 2;
        if (!this.achievements.perfectMemory.unlocked && this.moves === minMoves) {
            this.achievements.perfectMemory.unlocked = true;
            newUnlocks.push(this.achievements.perfectMemory);
        }
        
        // No hints
        if (!this.achievements.noHints.unlocked && this.hints === 3) {
            this.achievements.noHints.unlocked = true;
            newUnlocks.push(this.achievements.noHints);
        }
        
        // Hard mode
        if (!this.achievements.hardMode.unlocked && this.currentDifficulty === 'hard') {
            this.achievements.hardMode.unlocked = true;
            newUnlocks.push(this.achievements.hardMode);
        }
        
        // Multiplayer winner
        if (!this.achievements.multiplayerWinner.unlocked && this.gameMode === 'multiplayer') {
            const winner = this.multiplayer.player1Score > this.multiplayer.player2Score ? 1 : 2;
            if ((winner === 1 && this.multiplayer.player1Score > this.multiplayer.player2Score) ||
                (winner === 2 && this.multiplayer.player2Score > this.multiplayer.player1Score)) {
                this.achievements.multiplayerWinner.unlocked = true;
                newUnlocks.push(this.achievements.multiplayerWinner);
            }
        }
        
        // Score master
        if (!this.achievements.scoreMaster.unlocked && this.score > 1000) {
            this.achievements.scoreMaster.unlocked = true;
            newUnlocks.push(this.achievements.scoreMaster);
        }
        
        // Persistent player
        if (!this.achievements.persistent.unlocked && this.statistics.gamesPlayed >= 10) {
            this.achievements.persistent.unlocked = true;
            newUnlocks.push(this.achievements.persistent);
        }
        
        // Achievement collector
        const unlockedCount = Object.values(this.achievements).filter(a => a.unlocked).length;
        if (!this.achievements.collector.unlocked && unlockedCount >= 5) {
            this.achievements.collector.unlocked = true;
            newUnlocks.push(this.achievements.collector);
        }
        
        if (newUnlocks.length > 0) {
            this.saveAchievements();
            this.showAchievementNotifications(newUnlocks);
        }
    }
    
    showAchievementNotifications(unlocks) {
        unlocks.forEach((achievement, index) => {
            setTimeout(() => {
                this.showAchievementNotification(achievement);
            }, index * 2000);
        });
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-info">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    
    // Theme system methods
    loadUITheme() {
        return localStorage.getItem('memoryMatch_uiTheme') || 'dark';
    }
    
    saveUITheme() {
        localStorage.setItem('memoryMatch_uiTheme', this.currentUITheme);
    }
    
    toggleUITheme() {
        this.currentUITheme = this.currentUITheme === 'dark' ? 'light' : 'dark';
        this.applyUITheme();
        this.saveUITheme();
    }
    
    applyUITheme() {
        const root = document.documentElement;
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        
        if (this.currentUITheme === 'light') {
            root.style.setProperty('--primary-color', '#3b82f6');
            root.style.setProperty('--secondary-color', '#8b5cf6');
            root.style.setProperty('--success-color', '#10b981');
            root.style.setProperty('--warning-color', '#f59e0b');
            root.style.setProperty('--danger-color', '#ef4444');
            root.style.setProperty('--dark-bg', '#ffffff');
            root.style.setProperty('--card-bg', '#f8fafc');
            root.style.setProperty('--card-hover', '#e2e8f0');
            root.style.setProperty('--text-primary', '#1e293b');
            root.style.setProperty('--text-secondary', '#64748b');
            root.style.setProperty('--border-color', 'rgba(100, 116, 139, 0.2)');
            document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            if (themeToggleBtn) themeToggleBtn.textContent = '☀️ Theme';
        } else {
            root.style.setProperty('--primary-color', '#3b82f6');
            root.style.setProperty('--secondary-color', '#8b5cf6');
            root.style.setProperty('--success-color', '#10b981');
            root.style.setProperty('--warning-color', '#f59e0b');
            root.style.setProperty('--danger-color', '#ef4444');
            root.style.setProperty('--dark-bg', '#0f172a');
            root.style.setProperty('--card-bg', '#1e293b');
            root.style.setProperty('--card-hover', '#334155');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#94a3b8');
            root.style.setProperty('--border-color', 'rgba(148, 163, 184, 0.2)');
            document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            if (themeToggleBtn) themeToggleBtn.textContent = '🌙 Theme';
        }
    }
    
    updateAchievementsDisplay() {
        const achievementsGrid = document.getElementById('achievementsGrid');
        achievementsGrid.innerHTML = '';
        
        Object.entries(this.achievements).forEach(([key, achievement]) => {
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            achievementElement.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-status">${achievement.unlocked ? '✅ Unlocked' : '🔒 Locked'}</div>
                </div>
            `;
            achievementsGrid.appendChild(achievementElement);
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MemoryMatch();
});
