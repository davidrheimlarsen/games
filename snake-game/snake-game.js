class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.cellSize = this.canvas.width / this.gridSize;
        
        this.snake = [
            {x: 10, y: 10},
            {x: 9, y: 10},
            {x: 8, y: 10}
        ];
        
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.food = this.generateFood();
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('snake-best-score') || '0');
        this.highScore = parseInt(localStorage.getItem('snake-high-score') || '0');
        this.gameMode = 'classic';
        this.gameState = 'waiting'; // waiting, playing, paused, gameover
        this.gameSpeed = 100;
        this.baseSpeed = 100;
        this.speedMultiplier = 1.0;
        
        // Timed mode variables
        this.timedDuration = 60000; // 60 seconds
        this.timedStartTime = 0;
        this.timeRemaining = this.timedDuration;
        
        // Survival mode variables
        this.survivalSpeedIncrease = 0.95; // Speed increases by 5% each food
        this.currentSurvivalSpeed = 1.0;
        
        this.lastUpdateTime = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.showStartScreen();
    }
    
    initializeElements() {
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.highScoreElement = document.getElementById('high-score');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverReasonElement = document.getElementById('game-over-reason');
        this.newBestElement = document.getElementById('new-best');
        this.timerElement = document.getElementById('timer');
        this.speedElement = document.getElementById('speed');
        this.lengthElement = document.getElementById('length');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.startOverlay = document.getElementById('start-overlay');
        this.instructionsElement = document.getElementById('instructions');
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Button controls
        document.getElementById('play-again-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // Game mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeGameMode(e.target.dataset.mode));
        });
        
        // Prevent arrow key scrolling
        window.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyPress(e) {
        // Allow pause/resume and game controls even when waiting
        
        // Pause/Resume
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
            return;
        }
        
        if (this.gameState !== 'playing') return;
        
        // Direction controls
        const key = e.key.toLowerCase();
        let newDirection = null;
        
        switch(key) {
            case 'arrowup':
            case 'w':
                if (this.direction.y === 0) newDirection = {x: 0, y: -1};
                break;
            case 'arrowdown':
            case 's':
                if (this.direction.y === 0) newDirection = {x: 0, y: 1};
                break;
            case 'arrowleft':
            case 'a':
                if (this.direction.x === 0) newDirection = {x: -1, y: 0};
                break;
            case 'arrowright':
            case 'd':
                if (this.direction.x === 0) newDirection = {x: 1, y: 0};
                break;
        }
        
        if (newDirection) {
            this.nextDirection = newDirection;
        }
    }
    
    changeGameMode(mode) {
        console.log('Mode button clicked:', mode, 'Game state:', this.gameState);
        if (this.gameState === 'playing' || this.gameState === 'paused') return;
        
        this.gameMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.mode === mode);
        });
        
        // Update instructions based on mode
        let newInstructions = '';
        switch(mode) {
            case 'classic':
                newInstructions = 'Use Arrow Keys or WASD to Move';
                break;
            case 'timed':
                newInstructions = 'Use Arrow Keys or WASD to Move - 60 Second Challenge!';
                break;
            case 'survival':
                newInstructions = 'Use Arrow Keys or WASD to Move - Speed Increases!';
                break;
        }
        
        console.log('Updating instructions to:', newInstructions);
        this.instructionsElement.textContent = newInstructions;
        console.log('Instructions element now contains:', this.instructionsElement.textContent);
    }
    
    showStartScreen() {
        console.log('showStartScreen called, setting game state to waiting');
        this.startOverlay.classList.add('active');
        this.gameState = 'waiting';
        console.log('Game state after showStartScreen:', this.gameState);
    }
    
    startGame() {
        this.startOverlay.classList.remove('active');
        this.gameState = 'playing';
        this.startTime = Date.now();
        
        if (this.gameMode === 'timed') {
            this.timedStartTime = Date.now();
        }
        
        this.gameLoop();
    }
    
    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'paused';
        this.pauseOverlay.classList.add('active');
    }
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        
        this.gameState = 'playing';
        this.pauseOverlay.classList.remove('active');
        this.gameLoop();
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        
        // Update game speed based on mode
        let currentSpeed = this.baseSpeed;
        
        if (this.gameMode === 'survival') {
            currentSpeed = this.baseSpeed * this.currentSurvivalSpeed;
        } else if (this.gameMode === 'timed') {
            // Check if time is up
            this.timeRemaining = this.timedDuration - (currentTime - this.timedStartTime);
            if (this.timeRemaining <= 0) {
                this.gameOver('Time\'s up!');
                return;
            }
        }
        
        if (deltaTime >= currentSpeed) {
            this.update();
            this.lastUpdateTime = currentTime;
        }
        
        this.updateStats();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update direction
        this.direction = {...this.nextDirection};
        
        // Calculate new head position
        const head = {...this.snake[0]};
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.gridSize || 
            head.y < 0 || head.y >= this.gridSize) {
            this.gameOver('Hit the wall!');
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver('Bit yourself!');
                return;
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }
    
    eatFood() {
        this.score += 10;
        this.createFoodParticles(this.food.x, this.food.y);
        this.food = this.generateFood();
        
        // Update speed for survival mode
        if (this.gameMode === 'survival') {
            this.currentSurvivalSpeed *= this.survivalSpeedIncrease;
        }
        
        // Update display
        this.updateDisplay();
    }
    
    createFoodParticles(gridX, gridY) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const centerX = canvasRect.left + gridX * this.cellSize + this.cellSize / 2;
        const centerY = canvasRect.top + gridY * this.cellSize + this.cellSize / 2;
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'food-particle';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 30 + Math.random() * 20;
            particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
            particle.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        return newFood;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            const gradient = this.ctx.createLinearGradient(
                segment.x * this.cellSize, 
                segment.y * this.cellSize,
                (segment.x + 1) * this.cellSize, 
                (segment.y + 1) * this.cellSize
            );
            
            if (index === 0) {
                // Head
                gradient.addColorStop(0, '#10b981');
                gradient.addColorStop(1, '#059669');
            } else {
                // Body
                const intensity = 1 - (index / this.snake.length) * 0.5;
                gradient.addColorStop(0, `rgba(16, 185, 129, ${intensity})`);
                gradient.addColorStop(1, `rgba(5, 150, 105, ${intensity})`);
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                segment.x * this.cellSize + 2,
                segment.y * this.cellSize + 2,
                this.cellSize - 4,
                this.cellSize - 4
            );
            
            // Add rounded corners effect
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                segment.x * this.cellSize + 2,
                segment.y * this.cellSize + 2,
                this.cellSize - 4,
                this.cellSize - 4
            );
        });
        
        // Draw food with pulsing effect
        const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
        const foodSize = (this.cellSize - 6) * pulseScale;
        const foodOffset = (this.cellSize - foodSize) / 2;
        
        const foodGradient = this.ctx.createRadialGradient(
            this.food.x * this.cellSize + this.cellSize / 2,
            this.food.y * this.cellSize + this.cellSize / 2,
            0,
            this.food.x * this.cellSize + this.cellSize / 2,
            this.food.y * this.cellSize + this.cellSize / 2,
            foodSize / 2
        );
        foodGradient.addColorStop(0, '#f59e0b');
        foodGradient.addColorStop(1, '#d97706');
        
        this.ctx.fillStyle = foodGradient;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.cellSize + this.cellSize / 2,
            this.food.y * this.cellSize + this.cellSize / 2,
            foodSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Add glow effect to food
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#f59e0b';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.bestScoreElement.textContent = `Best: ${this.bestScore}`;
        this.highScoreElement.textContent = `High Score: ${this.highScore}`;
    }
    
    updateStats() {
        if (this.gameState !== 'playing') return;
        
        // Update elapsed time
        this.elapsedTime = Date.now() - this.startTime;
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        this.timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update speed display
        if (this.gameMode === 'survival') {
            this.speedElement.textContent = `Speed: ${this.currentSurvivalSpeed.toFixed(2)}x`;
        } else {
            this.speedElement.textContent = `Speed: ${this.speedMultiplier.toFixed(1)}x`;
        }
        
        // Update length
        this.lengthElement.textContent = `Length: ${this.snake.length}`;
        
        // Update time remaining for timed mode
        if (this.gameMode === 'timed') {
            const timeRemainingSeconds = Math.ceil(this.timeRemaining / 1000);
            this.timerElement.textContent = `Time: ${timeRemainingSeconds}s`;
        }
    }
    
    gameOver(reason) {
        this.gameState = 'gameover';
        
        // Update scores
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('snake-best-score', this.bestScore.toString());
            this.newBestElement.classList.add('show');
        } else {
            this.newBestElement.classList.remove('show');
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snake-high-score', this.highScore.toString());
        }
        
        // Show game over screen
        this.finalScoreElement.textContent = this.score;
        this.gameOverReasonElement.textContent = reason;
        this.gameOverOverlay.classList.add('active');
        
        // Add death animation
        this.canvas.classList.add('snake-death');
        setTimeout(() => this.canvas.classList.remove('snake-death'), 500);
    }
    
    resetGame() {
        // Hide overlays
        this.gameOverOverlay.classList.remove('active');
        this.pauseOverlay.classList.remove('active');
        
        // Reset game state
        this.snake = [
            {x: 10, y: 10},
            {x: 9, y: 10},
            {x: 8, y: 10}
        ];
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.food = this.generateFood();
        this.score = 0;
        this.gameSpeed = this.baseSpeed;
        this.speedMultiplier = 1.0;
        this.currentSurvivalSpeed = 1.0;
        this.timeRemaining = this.timedDuration;
        this.lastUpdateTime = 0;
        this.elapsedTime = 0;
        
        // Update display
        this.updateDisplay();
        this.updateStats();
        
        // Show start screen
        this.showStartScreen();
        
        // Draw initial state
        this.draw();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
