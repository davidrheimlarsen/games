class FruitNinjaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('gameOverlay');
        
        // Game state
        this.gameState = 'ready'; // ready, playing, paused, gameover
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.highScore = parseInt(localStorage.getItem('fruit_ninja_highscore') || '0');
        
        // Game objects
        this.fruits = [];
        this.particles = [];
        this.slices = [];
        this.bombs = [];
        
        // Swipe tracking
        this.isSwiping = false;
        this.swipePath = [];
        this.lastSwipeTime = 0;
        
        // Game timing
        this.lastSpawnTime = 0;
        this.spawnInterval = 1500;
        this.gameSpeed = 1;
        
        // Fruit types
        this.fruitTypes = [
            { emoji: '🍎', name: 'apple', points: 10, color: '#ff6b6b' },
            { emoji: '🍊', name: 'orange', points: 15, color: '#ffa500' },
            { emoji: '🍋', name: 'lemon', points: 20, color: '#ffd93d' },
            { emoji: '🍇', name: 'grapes', points: 25, color: '#9b59b6' },
            { emoji: '🍓', name: 'strawberry', points: 30, color: '#e74c3c' },
            { emoji: '🍉', name: 'watermelon', points: 35, color: '#27ae60' },
            { emoji: '🥝', name: 'kiwi', points: 40, color: '#16a085' },
            { emoji: '🍑', name: 'peach', points: 45, color: '#ff9ff3' }
        ];
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.bindEvents();
        this.updateUI();
        this.showOverlay('ready');
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Handle resize
        window.addEventListener('resize', () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        });
    }
    
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startSwipe(e));
        this.canvas.addEventListener('mousemove', (e) => this.continueSwipe(e));
        this.canvas.addEventListener('mouseup', () => this.endSwipe());
        this.canvas.addEventListener('mouseleave', () => this.endSwipe());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.startSwipe(e.touches[0]));
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.continueSwipe(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.endSwipe());
        
        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && this.gameState === 'ready') {
                this.startGame();
            } else if (e.key === 'p' && this.gameState === 'playing') {
                this.togglePause();
            } else if (e.key === 'r') {
                this.resetGame();
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.fruits = [];
        this.bombs = [];
        this.particles = [];
        this.slices = [];
        this.gameSpeed = 1;
        this.spawnInterval = 1500;
        
        this.hideOverlay();
        this.updateUI();
        this.gameLoop();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showOverlay('paused');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.hideOverlay();
            this.gameLoop();
        }
    }
    
    resetGame() {
        this.gameState = 'ready';
        this.startGame();
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        const currentTime = Date.now();
        
        // Spawn new fruits/bombs
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawnObject();
            this.lastSpawnTime = currentTime;
            
            // Increase difficulty over time
            this.spawnInterval = Math.max(800, this.spawnInterval - 10);
            this.gameSpeed = Math.min(2, this.gameSpeed + 0.01);
        }
        
        // Update fruits
        this.fruits = this.fruits.filter(fruit => {
            fruit.update();
            
            // Check if fruit is sliced
            if (this.isSwiping && this.checkSliceCollision(fruit)) {
                this.sliceFruit(fruit);
                return false;
            }
            
            // Remove if off screen
            if (fruit.y > this.canvas.height + 50) {
                if (!fruit.sliced) {
                    this.missedFruit();
                }
                return false;
            }
            
            return true;
        });
        
        // Update bombs
        this.bombs = this.bombs.filter(bomb => {
            bomb.update();
            
            // Check if bomb is sliced
            if (this.isSwiping && this.checkSliceCollision(bomb)) {
                this.sliceBomb(bomb);
                return false;
            }
            
            // Remove if off screen
            return bomb.y <= this.canvas.height + 50;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
        
        // Update slices
        this.slices = this.slices.filter(slice => {
            slice.update();
            return slice.life > 0;
        });
        
        // Update combo
        if (currentTime - this.lastSwipeTime > 2000) {
            this.combo = 0;
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8C8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw fruits
        this.fruits.forEach(fruit => fruit.draw(this.ctx));
        
        // Draw bombs
        this.bombs.forEach(bomb => bomb.draw(this.ctx));
        
        // Draw particles
        this.particles.forEach(particle => particle.draw(this.ctx));
        
        // Draw swipe trail
        if (this.isSwiping && this.swipePath.length > 1) {
            this.drawSwipeTrail();
        }
        
        // Draw slices
        this.slices.forEach(slice => slice.draw(this.ctx));
        
        // Draw combo indicator
        if (this.combo > 1) {
            this.drawComboIndicator();
        }
    }
    
    spawnObject() {
        const isBomb = Math.random() < 0.15; // 15% chance for bomb
        
        if (isBomb) {
            this.spawnBomb();
        } else {
            this.spawnFruit();
        }
    }
    
    spawnFruit() {
        const type = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const velocityX = (Math.random() - 0.5) * 4;
        const velocityY = -15 - Math.random() * 5;
        
        this.fruits.push(new Fruit(x, this.canvas.height, velocityX, velocityY, type));
    }
    
    spawnBomb() {
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const velocityX = (Math.random() - 0.5) * 4;
        const velocityY = -15 - Math.random() * 5;
        
        this.bombs.push(new Bomb(x, this.canvas.height, velocityX, velocityY));
    }
    
    startSwipe(e) {
        if (this.gameState !== 'playing') return;
        
        this.isSwiping = true;
        this.swipePath = [];
        this.addSwipePoint(e);
    }
    
    continueSwipe(e) {
        if (!this.isSwiping || this.gameState !== 'playing') return;
        
        this.addSwipePoint(e);
    }
    
    endSwipe() {
        this.isSwiping = false;
        this.swipePath = [];
    }
    
    addSwipePoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.swipePath.push({ x, y, time: Date.now() });
        
        // Keep only recent points
        const cutoff = Date.now() - 500;
        this.swipePath = this.swipePath.filter(point => point.time > cutoff);
        
        this.lastSwipeTime = Date.now();
    }
    
    drawSwipeTrail() {
        if (this.swipePath.length < 2) return;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.swipePath[0].x, this.swipePath[0].y);
        
        for (let i = 1; i < this.swipePath.length; i++) {
            this.ctx.lineTo(this.swipePath[i].x, this.swipePath[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    checkSliceCollision(obj) {
        if (this.swipePath.length < 2) return false;
        
        for (let i = 0; i < this.swipePath.length - 1; i++) {
            const p1 = this.swipePath[i];
            const p2 = this.swipePath[i + 1];
            
            if (this.lineIntersectsCircle(p1, p2, obj.x, obj.y, obj.size)) {
                return true;
            }
        }
        
        return false;
    }
    
    lineIntersectsCircle(p1, p2, cx, cy, radius) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const fx = p1.x - cx;
        const fy = p1.y - cy;
        
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = (fx * fx + fy * fy) - radius * radius;
        
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return false;
        
        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
        
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }
    
    sliceFruit(fruit) {
        fruit.sliced = true;
        
        // Add score
        const points = fruit.type.points * (1 + this.combo * 0.5);
        this.score += Math.round(points);
        this.combo++;
        
        // Create particles
        this.createFruitParticles(fruit);
        
        // Create slice effect
        this.slices.push(new Slice(fruit.x, fruit.y, fruit.type.color));
        
        // Update UI
        this.updateUI();
        
        // Screen shake effect
        this.canvas.style.transform = 'translate(2px, 2px)';
        setTimeout(() => {
            this.canvas.style.transform = 'translate(-2px, -2px)';
            setTimeout(() => {
                this.canvas.style.transform = 'translate(0, 0)';
            }, 50);
        }, 50);
    }
    
    sliceBomb(bomb) {
        bomb.exploded = true;
        
        // Lose life
        this.lives--;
        this.combo = 0;
        
        // Create explosion particles
        this.createBombParticles(bomb);
        
        // Update UI
        this.updateUI();
        
        // Check game over
        if (this.lives <= 0) {
            this.gameOver();
        }
        
        // Screen shake
        this.canvas.style.transform = 'translate(5px, 5px)';
        setTimeout(() => {
            this.canvas.style.transform = 'translate(-5px, -5px)';
            setTimeout(() => {
                this.canvas.style.transform = 'translate(0, 0)';
            }, 100);
        }, 100);
    }
    
    missedFruit() {
        this.combo = 0;
        this.updateUI();
    }
    
    createFruitParticles(fruit) {
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const velocity = 3 + Math.random() * 3;
            const particle = new Particle(
                fruit.x,
                fruit.y,
                Math.cos(angle) * velocity,
                Math.sin(angle) * velocity,
                fruit.type.color
            );
            this.particles.push(particle);
        }
    }
    
    createBombParticles(bomb) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const velocity = 5 + Math.random() * 5;
            const particle = new Particle(
                bomb.x,
                bomb.y,
                Math.cos(angle) * velocity,
                Math.sin(angle) * velocity,
                '#ff0000'
            );
            this.particles.push(particle);
        }
    }
    
    drawComboIndicator() {
        this.ctx.save();
        this.ctx.font = 'bold 24px Inter';
        this.ctx.fillStyle = '#ffd93d';
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.textAlign = 'center';
        
        const text = `${this.combo}x COMBO!`;
        const x = this.canvas.width / 2;
        const y = 50;
        
        this.ctx.strokeText(text, x, y);
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('fruit_ninja_highscore', this.highScore.toString());
        }
        
        this.showOverlay('gameover');
    }
    
    showOverlay(type) {
        const overlay = this.overlay;
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const startBtn = document.getElementById('startBtn');
        
        overlay.classList.remove('hidden');
        
        switch (type) {
            case 'ready':
                title.textContent = '🍉 Ready to Slice?';
                message.textContent = 'Click or tap to start slicing fruits!';
                startBtn.textContent = 'Start Game';
                startBtn.style.display = 'block';
                break;
            case 'paused':
                title.textContent = '⏸️ Game Paused';
                message.textContent = 'Press P or click to resume';
                startBtn.style.display = 'none';
                break;
            case 'gameover':
                title.textContent = '💥 Game Over!';
                message.textContent = `Final Score: ${this.score} | High Score: ${this.highScore}`;
                startBtn.textContent = 'Play Again';
                startBtn.style.display = 'block';
                break;
        }
    }
    
    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('highScore').textContent = this.highScore;
        
        // Add combo animation
        if (this.combo > 1) {
            document.getElementById('combo').parentElement.classList.add('combo-active');
            setTimeout(() => {
                document.getElementById('combo').parentElement.classList.remove('combo-active');
            }, 500);
        }
    }
}

// Game object classes
class Fruit {
    constructor(x, y, vx, vy, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.size = 30;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.sliced = false;
        this.gravity = 0.5;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.emoji, 0, 0);
        ctx.restore();
    }
}

class Bomb {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = 25;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.exploded = false;
        this.gravity = 0.5;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 0);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = 3 + Math.random() * 3;
        this.life = 1;
        this.decay = 0.02;
        this.gravity = 0.2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.size *= 0.98;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Slice {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 1;
        this.decay = 0.05;
        this.size = 20;
    }
    
    update() {
        this.life -= this.decay;
        this.size *= 1.1;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FruitNinjaGame();
});
