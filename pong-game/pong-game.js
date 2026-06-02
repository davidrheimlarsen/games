class PongGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Paddle settings
        this.paddleWidth = 12;
        this.paddleHeight = 100;
        this.paddleSpeed = 8;
        
        // Ball settings
        this.ballSize = 12;
        this.ballSpeed = 6;
        this.maxBallSpeed = 15;
        
        // Player paddle (left)
        this.player = {
            x: 20,
            y: this.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            score: 0
        };
        
        // AI paddle (right)
        this.ai = {
            x: this.width - 20 - this.paddleWidth,
            y: this.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            score: 0,
            speed: 5,
            reactionDelay: 0,
            errorMargin: 0
        };
        
        // Ball
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            size: this.ballSize,
            speedX: this.ballSpeed,
            speedY: this.ballSpeed * 0.5
        };
        
        // Game state
        this.gameState = 'waiting'; // waiting, playing, paused, gameover
        this.difficulty = 'medium';
        this.winningScore = 5;
        this.round = 1;
        
        // Difficulty settings
        this.difficultySettings = {
            easy: { aiSpeed: 3, reactionDelay: 150, errorMargin: 50 },
            medium: { aiSpeed: 5, reactionDelay: 80, errorMargin: 25 },
            hard: { aiSpeed: 7, reactionDelay: 30, errorMargin: 10 },
            impossible: { aiSpeed: 9, reactionDelay: 0, errorMargin: 0 }
        };
        
        // Input handling
        this.keys = {};
        this.mouseY = this.height / 2;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.showStartScreen();
    }
    
    initializeElements() {
        this.playerScoreElement = document.getElementById('player-score');
        this.aiScoreElement = document.getElementById('ai-score');
        this.difficultyDisplay = document.getElementById('difficulty-display');
        this.roundDisplay = document.getElementById('round-display');
        this.winnerText = document.getElementById('winner-text');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverReasonElement = document.getElementById('game-over-reason');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.startOverlay = document.getElementById('start-overlay');
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.handleKeyPress(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleY = this.canvas.height / rect.height;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });
        
        // Touch controls for mobile
        const touchArea = document.getElementById('touch-area');
        touchArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = touchArea.getBoundingClientRect();
            const touch = e.touches[0];
            const relativeY = (touch.clientY - rect.top) / rect.height;
            this.mouseY = relativeY * this.height;
        });
        
        // Button controls
        document.getElementById('play-again-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeDifficulty(e.target.dataset.difficulty));
        });
    }
    
    handleKeyPress(e) {
        // Pause/Resume
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
            return;
        }
    }
    
    changeDifficulty(difficulty) {
        if (this.gameState === 'playing' || this.gameState === 'paused') return;
        
        this.difficulty = difficulty;
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.difficulty === difficulty);
        });
        
        // Update AI settings based on difficulty
        const settings = this.difficultySettings[difficulty];
        this.ai.speed = settings.aiSpeed;
        this.ai.reactionDelay = settings.reactionDelay;
        this.ai.errorMargin = settings.errorMargin;
        
        // Update display
        const difficultyLabels = {
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            impossible: 'Impossible'
        };
        this.difficultyDisplay.textContent = `Difficulty: ${difficultyLabels[difficulty]}`;
    }
    
    showStartScreen() {
        this.startOverlay.classList.add('active');
        this.gameState = 'waiting';
    }
    
    startGame() {
        this.startOverlay.classList.remove('active');
        this.gameState = 'playing';
        this.resetBall();
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
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update player paddle (keyboard)
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.player.y -= this.paddleSpeed;
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.player.y += this.paddleSpeed;
        }
        
        // Update player paddle (mouse/touch)
        const targetY = this.mouseY - this.player.height / 2;
        const lerpFactor = 0.15;
        this.player.y += (targetY - this.player.y) * lerpFactor;
        
        // Keep player paddle in bounds
        this.player.y = Math.max(0, Math.min(this.height - this.player.height, this.player.y));
        
        // Update AI paddle
        this.updateAI();
        
        // Update ball position
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
        
        // Ball collision with top/bottom walls
        if (this.ball.y - this.ball.size / 2 <= 0 || this.ball.y + this.ball.size / 2 >= this.height) {
            this.ball.speedY *= -1;
            this.ball.y = this.ball.y - this.ball.size / 2 <= 0 ? 
                this.ball.size / 2 : this.height - this.ball.size / 2;
        }
        
        // Ball collision with player paddle
        if (this.ball.x - this.ball.size / 2 <= this.player.x + this.player.width &&
            this.ball.x + this.ball.size / 2 >= this.player.x &&
            this.ball.y >= this.player.y &&
            this.ball.y <= this.player.y + this.player.height) {
            
            this.ball.speedX = Math.abs(this.ball.speedX);
            this.increaseBallSpeed();
            
            // Add spin based on where ball hits paddle
            const hitPos = (this.ball.y - this.player.y) / this.player.height;
            this.ball.speedY = (hitPos - 0.5) * 10;
            
            this.ball.x = this.player.x + this.player.width + this.ball.size / 2;
        }
        
        // Ball collision with AI paddle
        if (this.ball.x + this.ball.size / 2 >= this.ai.x &&
            this.ball.x - this.ball.size / 2 <= this.ai.x + this.ai.width &&
            this.ball.y >= this.ai.y &&
            this.ball.y <= this.ai.y + this.ai.height) {
            
            this.ball.speedX = -Math.abs(this.ball.speedX);
            this.increaseBallSpeed();
            
            // Add spin based on where ball hits paddle
            const hitPos = (this.ball.y - this.ai.y) / this.ai.height;
            this.ball.speedY = (hitPos - 0.5) * 10;
            
            this.ball.x = this.ai.x - this.ball.size / 2;
        }
        
        // Ball out of bounds (scoring)
        if (this.ball.x < 0) {
            this.ai.score++;
            this.checkWin();
            this.resetBall();
        } else if (this.ball.x > this.width) {
            this.player.score++;
            this.checkWin();
            this.resetBall();
        }
        
        this.updateDisplay();
    }
    
    updateAI() {
        // AI target position with error margin based on difficulty
        const targetY = this.ball.y - this.ai.height / 2;
        const error = (Math.random() - 0.5) * this.ai.errorMargin;
        const finalTarget = targetY + error;
        
        // Simple AI movement
        if (this.ai.y < finalTarget - 10) {
            this.ai.y += this.ai.speed;
        } else if (this.ai.y > finalTarget + 10) {
            this.ai.y -= this.ai.speed;
        }
        
        // Keep AI paddle in bounds
        this.ai.y = Math.max(0, Math.min(this.height - this.ai.height, this.ai.y));
    }
    
    increaseBallSpeed() {
        const speedIncrease = 0.3;
        const currentSpeed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
        
        if (currentSpeed < this.maxBallSpeed) {
            const factor = (currentSpeed + speedIncrease) / currentSpeed;
            this.ball.speedX *= factor;
            this.ball.speedY *= factor;
        }
    }
    
    resetBall() {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        
        // Random direction
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.ball.speedX = this.ballSpeed * direction;
        this.ball.speedY = (Math.random() - 0.5) * this.ballSpeed;
        
        this.round++;
        this.roundDisplay.textContent = `Round: ${this.round}`;
    }
    
    checkWin() {
        if (this.player.score >= this.winningScore || this.ai.score >= this.winningScore) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        const playerWon = this.player.score >= this.winningScore;
        this.winnerText.textContent = playerWon ? 'You Win!' : 'AI Wins!';
        this.finalScoreElement.textContent = `${this.player.score} - ${this.ai.score}`;
        this.gameOverReasonElement.textContent = `First to ${this.winningScore} points wins!`;
        
        this.gameOverOverlay.classList.add('active');
    }
    
    resetGame() {
        // Hide overlays
        this.gameOverOverlay.classList.remove('active');
        this.pauseOverlay.classList.remove('active');
        
        // Reset scores
        this.player.score = 0;
        this.ai.score = 0;
        this.round = 1;
        
        // Reset positions
        this.player.y = this.height / 2 - this.player.height / 2;
        this.ai.y = this.height / 2 - this.ai.height / 2;
        
        // Reset ball
        this.resetBall();
        
        // Update display
        this.updateDisplay();
        
        // Show start screen
        this.showStartScreen();
        
        // Draw initial state
        this.draw();
    }
    
    updateDisplay() {
        this.playerScoreElement.textContent = this.player.score;
        this.aiScoreElement.textContent = this.ai.score;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw center line
        this.ctx.setLineDash([10, 10]);
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw center circle
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.width / 2, this.height / 2, 50, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw player paddle
        const playerGradient = this.ctx.createLinearGradient(
            this.player.x, this.player.y,
            this.player.x + this.player.width, this.player.y + this.player.height
        );
        playerGradient.addColorStop(0, '#3b82f6');
        playerGradient.addColorStop(1, '#1d4ed8');
        
        this.ctx.fillStyle = playerGradient;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#3b82f6';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.shadowBlur = 0;
        
        // Draw AI paddle
        const aiGradient = this.ctx.createLinearGradient(
            this.ai.x, this.ai.y,
            this.ai.x + this.ai.width, this.ai.y + this.ai.height
        );
        aiGradient.addColorStop(0, '#ef4444');
        aiGradient.addColorStop(1, '#b91c1c');
        
        this.ctx.fillStyle = aiGradient;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ef4444';
        this.ctx.fillRect(this.ai.x, this.ai.y, this.ai.width, this.ai.height);
        this.ctx.shadowBlur = 0;
        
        // Draw ball
        const ballGradient = this.ctx.createRadialGradient(
            this.ball.x, this.ball.y, 0,
            this.ball.x, this.ball.y, this.ball.size
        );
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(1, '#94a3b8');
        
        this.ctx.fillStyle = ballGradient;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Draw ball trail
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 1; i <= 5; i++) {
            const trailX = this.ball.x - this.ball.speedX * i * 0.5;
            const trailY = this.ball.y - this.ball.speedY * i * 0.5;
            const trailSize = this.ball.size / 2 * (1 - i * 0.15);
            this.ctx.beginPath();
            this.ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PongGame();
});
