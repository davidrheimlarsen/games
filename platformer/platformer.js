class Platformer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = 800;
        this.canvas.height = 500;
        
        this.gravity = 0.6;
        this.friction = 0.8;
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameRunning = false;
        
        this.keys = {
            left: false,
            right: false,
            up: false
        };
        
        this.player = null;
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.flag = null;
        this.particles = [];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
    }
    
    handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
            this.keys.up = true;
            e.preventDefault();
        }
    }
    
    handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') this.keys.up = false;
    }
    
    startGame() {
        document.getElementById('startScreen').classList.add('hidden');
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.updateUI();
        this.loadLevel(1);
        this.gameRunning = true;
        this.gameLoop();
    }
    
    restartGame() {
        document.getElementById('gameOver').classList.add('hidden');
        this.startGame();
    }
    
    nextLevel() {
        document.getElementById('levelComplete').classList.add('hidden');
        this.level++;
        this.updateUI();
        this.loadLevel(this.level);
        this.gameRunning = true;
        this.gameLoop();
    }
    
    loadLevel(levelNum) {
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.particles = [];
        
        // Ground
        this.platforms.push({ x: 0, y: 450, width: 800, height: 50 });
        
        // Level design based on level number
        const levelDesigns = [
            // Level 1 - Easy
            [
                { x: 100, y: 380, width: 150, height: 20 },
                { x: 300, y: 320, width: 150, height: 20 },
                { x: 500, y: 260, width: 150, height: 20 },
                { x: 650, y: 200, width: 150, height: 20 }
            ],
            // Level 2 - Medium
            [
                { x: 50, y: 380, width: 100, height: 20 },
                { x: 200, y: 320, width: 100, height: 20 },
                { x: 350, y: 260, width: 100, height: 20 },
                { x: 500, y: 320, width: 100, height: 20 },
                { x: 650, y: 260, width: 100, height: 20 },
                { x: 500, y: 180, width: 150, height: 20 }
            ],
            // Level 3 - Hard
            [
                { x: 80, y: 400, width: 80, height: 20 },
                { x: 200, y: 350, width: 80, height: 20 },
                { x: 320, y: 300, width: 80, height: 20 },
                { x: 440, y: 250, width: 80, height: 20 },
                { x: 560, y: 200, width: 80, height: 20 },
                { x: 680, y: 150, width: 80, height: 20 },
                { x: 400, y: 150, width: 100, height: 20 },
                { x: 200, y: 200, width: 100, height: 20 }
            ]
        ];
        
        const designIndex = (levelNum - 1) % levelDesigns.length;
        const platforms = levelDesigns[designIndex];
        
        platforms.forEach(p => {
            this.platforms.push({ ...p });
        });
        
        // Add coins on platforms
        this.platforms.forEach((p, index) => {
            if (index > 0) { // Skip ground
                this.coins.push({
                    x: p.x + p.width / 2 - 10,
                    y: p.y - 30,
                    width: 20,
                    height: 20,
                    collected: false
                });
            }
        });
        
        // Add enemies
        const enemyCount = Math.min(levelNum, 5);
        for (let i = 0; i < enemyCount; i++) {
            const platform = this.platforms[Math.floor(Math.random() * (this.platforms.length - 1)) + 1];
            this.enemies.push({
                x: platform.x + platform.width / 2,
                y: platform.y - 30,
                width: 30,
                height: 30,
                speed: 1 + levelNum * 0.3,
                direction: 1,
                platform: platform
            });
        }
        
        // Flag at the end
        const lastPlatform = this.platforms[this.platforms.length - 1];
        this.flag = {
            x: lastPlatform.x + lastPlatform.width - 40,
            y: lastPlatform.y - 60,
            width: 30,
            height: 60
        };
        
        // Reset player
        this.player = {
            x: 50,
            y: 350,
            width: 40,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpForce: 12,
            grounded: false,
            color: '#ff6b6b'
        };
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Player movement
        if (this.keys.left) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys.right) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX *= this.friction;
        }
        
        // Jumping
        if (this.keys.up && this.player.grounded) {
            this.player.velocityY = -this.player.jumpForce;
            this.player.grounded = false;
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 5, '#87CEEB');
        }
        
        // Apply gravity
        this.player.velocityY += this.gravity;
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Platform collision
        this.player.grounded = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                // Landing on top
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.grounded = true;
                }
                // Hitting from below
                else if (this.player.velocityY < 0 && this.player.y - this.player.velocityY >= platform.y + platform.height) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
                // Hitting from sides
                else {
                    if (this.player.velocityX > 0) {
                        this.player.x = platform.x - this.player.width;
                    } else if (this.player.velocityX < 0) {
                        this.player.x = platform.x + platform.width;
                    }
                    this.player.velocityX = 0;
                }
            }
        });
        
        // Screen boundaries
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) this.player.x = this.canvas.width - this.player.width;
        
        // Fall death
        if (this.player.y > this.canvas.height) {
            this.loseLife();
        }
        
        // Coin collection
        this.coins.forEach(coin => {
            if (!coin.collected && this.checkCollision(this.player, coin)) {
                coin.collected = true;
                this.score += 10;
                this.createParticles(coin.x + coin.width / 2, coin.y + coin.height / 2, 10, '#ffd700');
                this.updateUI();
            }
        });
        
        // Enemy movement and collision
        this.enemies.forEach(enemy => {
            enemy.x += enemy.speed * enemy.direction;
            
            // Bounce off platform edges
            if (enemy.x <= enemy.platform.x || enemy.x + enemy.width >= enemy.platform.x + enemy.platform.width) {
                enemy.direction *= -1;
            }
            
            // Player collision with enemy
            if (this.checkCollision(this.player, enemy)) {
                // If player is above enemy, kill enemy
                if (this.player.velocityY > 0 && this.player.y + this.player.height < enemy.y + enemy.height / 2) {
                    enemy.speed = 0;
                    this.score += 20;
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15, '#ff4444');
                    this.updateUI();
                } else {
                    this.loseLife();
                }
            }
        });
        
        // Flag collision (level complete)
        if (this.checkCollision(this.player, this.flag)) {
            this.levelComplete();
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
            return p.life > 0;
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                life: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position
            this.player.x = 50;
            this.player.y = 350;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    levelComplete() {
        this.gameRunning = false;
        this.score += 50; // Bonus for completing level
        this.updateUI();
        document.getElementById('levelScore').textContent = this.score;
        document.getElementById('levelComplete').classList.remove('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw platforms
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
        });
        
        // Draw coins
        this.coins.forEach(coin => {
            if (!coin.collected) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ffed4a';
                this.ctx.beginPath();
                this.ctx.arc(coin.x + coin.width / 2 - 3, coin.y + coin.height / 2 - 3, coin.width / 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            if (enemy.speed > 0) {
                this.ctx.fillStyle = '#ff4444';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Eyes
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(enemy.x + 5, enemy.y + 8, 8, 8);
                this.ctx.fillRect(enemy.x + 17, enemy.y + 8, 8, 8);
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(enemy.x + 7, enemy.y + 10, 4, 4);
                this.ctx.fillRect(enemy.x + 19, enemy.y + 10, 4, 4);
            }
        });
        
        // Draw flag
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.flag.x, this.flag.y, 5, this.flag.height);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(this.flag.x + 5, this.flag.y);
        this.ctx.lineTo(this.flag.x + 35, this.flag.y + 15);
        this.ctx.lineTo(this.flag.x + 5, this.flag.y + 30);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        // Player eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 10, 8, 8);
        this.ctx.fillRect(this.player.x + 24, this.player.y + 10, 8, 8);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.player.x + 10, this.player.y + 12, 4, 4);
        this.ctx.fillRect(this.player.x + 26, this.player.y + 12, 4, 4);
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Platformer();
});
