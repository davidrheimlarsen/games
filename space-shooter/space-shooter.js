class SpaceShooter {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'waiting'; // waiting, playing, paused, gameover, waveComplete
        this.difficulty = 'medium';
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('space-shooter-best-score') || '0');
        this.highScore = parseInt(localStorage.getItem('space-shooter-high-score') || '0');
        this.wave = 1;
        this.lives = 3;
        this.powerLevel = 1;
        this.enemiesDestroyed = 0;
        this.waveStartTime = 0;
        
        // Player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 60,
            width: 40,
            height: 40,
            speed: 5,
            color: '#3b82f6'
        };
        
        // Game objects
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.stars = [];
        this.boss = null;
        this.isBossWave = false;
        
        // Controls
        this.keys = {};
        this.lastShot = 0;
        this.shotCooldown = 250;
        
        // Difficulty settings
        this.difficultySettings = {
            easy: {
                enemySpeed: 1,
                enemyFireRate: 0.002,
                enemyHealth: 1,
                powerUpChance: 0.3
            },
            medium: {
                enemySpeed: 2,
                enemyFireRate: 0.004,
                enemyHealth: 2,
                powerUpChance: 0.2
            },
            hard: {
                enemySpeed: 3,
                enemyFireRate: 0.006,
                enemyHealth: 3,
                powerUpChance: 0.1
            }
        };
        
        // Power-up types
        this.powerUpTypes = [
            { type: 'rapid', color: '#ef4444', duration: 5000, symbol: '⚡' },
            { type: 'triple', color: '#10b981', duration: 5000, symbol: '▲▲▲' },
            { type: 'shield', color: '#3b82f6', duration: 8000, symbol: '🛡' },
            { type: 'spread', color: '#f59e0b', duration: 5000, symbol: '✦' }
        ];
        
        this.activePowerUps = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.createStarfield();
        this.updateDisplay();
        this.showStartScreen();
    }
    
    initializeElements() {
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.highScoreElement = document.getElementById('high-score');
        this.finalScoreElement = document.getElementById('final-score');
        this.waveElement = document.getElementById('wave');
        this.livesElement = document.getElementById('lives');
        this.powerElement = document.getElementById('power');
        this.wavesCompletedElement = document.getElementById('waves-completed');
        this.enemiesDestroyedElement = document.getElementById('enemies-destroyed');
        this.waveScoreElement = document.getElementById('wave-score');
        this.waveBonusElement = document.getElementById('wave-bonus');
        this.nextWaveWarningElement = document.getElementById('next-wave-warning');
        this.newBestElement = document.getElementById('new-best');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.startOverlay = document.getElementById('start-overlay');
        this.waveCompleteOverlay = document.getElementById('wave-complete-overlay');
        this.instructionsElement = document.getElementById('instructions');
        this.activePowerUpsElement = document.getElementById('active-power-ups');
        this.bossHealthContainer = document.getElementById('boss-health-container');
        this.bossHealthFill = document.getElementById('boss-health-fill');
        this.bossNameElement = document.getElementById('boss-name');
        this.bossWarningOverlay = document.getElementById('boss-warning-overlay');
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Button controls
        document.getElementById('play-again-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('next-wave-btn').addEventListener('click', () => this.nextWave());
        
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeDifficulty(e.target.dataset.difficulty));
        });
        
        // Prevent space bar scrolling
        window.addEventListener('keydown', (e) => {
            if(e.key === ' ') {
                e.preventDefault();
            }
        });
    }
    
    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        
        // Pause/Resume
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }
    
    changeDifficulty(difficulty) {
        if (this.gameState === 'playing' || this.gameState === 'paused') return;
        
        this.difficulty = difficulty;
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.difficulty === difficulty);
        });
    }
    
    createStarfield() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.1,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
    }
    
    showStartScreen() {
        this.startOverlay.classList.add('active');
        this.gameState = 'waiting';
    }
    
    startGame() {
        this.startOverlay.classList.remove('active');
        this.gameState = 'playing';
        this.waveStartTime = Date.now();
        this.spawnWave();
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
        // Update player
        this.updatePlayer();
        
        // Update bullets
        this.updateBullets();
        
        // Update enemies
        this.updateEnemies();
        
        // Update power-ups
        this.updatePowerUps();
        
        // Update particles
        this.updateParticles();
        
        // Update stars
        this.updateStars();
        
        // Update boss if active
        this.updateBoss();
        
        // Check collisions
        this.checkCollisions();
        
        // Check wave completion (only if not boss wave)
        if (!this.isBossWave && this.enemies.length === 0) {
            this.completeWave();
        }
        
        // Check boss defeat
        if (this.boss && this.boss.health <= 0) {
            this.destroyBoss();
        }
        
        // Update display
        this.updateDisplay();
    }
    
    updatePlayer() {
        // Movement
        if (this.keys['arrowleft'] || this.keys['a']) {
            this.player.x = Math.max(this.player.width / 2, this.player.x - this.player.speed);
        }
        if (this.keys['arrowright'] || this.keys['d']) {
            this.player.x = Math.min(this.canvas.width - this.player.width / 2, this.player.x + this.player.speed);
        }
        if (this.keys['arrowup'] || this.keys['w']) {
            this.player.y = Math.max(this.player.height / 2, this.player.y - this.player.speed);
        }
        if (this.keys['arrowdown'] || this.keys['s']) {
            this.player.y = Math.min(this.canvas.height - this.player.height / 2, this.player.y + this.player.speed);
        }
        
        // Shooting
        if (this.keys[' ']) {
            this.shoot();
        }
        
        // Update power-ups
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            powerUp.remaining -= 16; // Assuming 60 FPS
            return powerUp.remaining > 0;
        });
        
        this.updatePowerUpsDisplay();
    }
    
    shoot() {
        const now = Date.now();
        const cooldown = this.activePowerUps.find(p => p.type === 'rapid') ? 100 : this.shotCooldown;
        
        if (now - this.lastShot < cooldown) return;
        
        const hasTriple = this.activePowerUps.find(p => p.type === 'triple');
        const hasSpread = this.activePowerUps.find(p => p.type === 'spread');
        
        if (hasTriple) {
            // Triple shot
            this.bullets.push(
                { x: this.player.x - 10, y: this.player.y - 20, vx: 0, vy: -8, damage: 1 },
                { x: this.player.x, y: this.player.y - 20, vx: 0, vy: -8, damage: 1 },
                { x: this.player.x + 10, y: this.player.y - 20, vx: 0, vy: -8, damage: 1 }
            );
        } else if (hasSpread) {
            // Spread shot
            for (let i = -2; i <= 2; i++) {
                this.bullets.push({
                    x: this.player.x,
                    y: this.player.y - 20,
                    vx: i * 2,
                    vy: -8,
                    damage: 1
                });
            }
        } else {
            // Normal shot
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 20,
                vx: 0,
                vy: -8,
                damage: this.powerLevel
            });
        }
        
        this.lastShot = now;
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            return bullet.y > -10 && bullet.x > -10 && bullet.x < this.canvas.width + 10;
        });
    }
    
    updateEnemies() {
        const settings = this.difficultySettings[this.difficulty];
        
        this.enemies.forEach(enemy => {
            // Movement patterns
            switch(enemy.pattern) {
                case 'straight':
                    enemy.y += enemy.speed;
                    break;
                case 'zigzag':
                    enemy.y += enemy.speed;
                    enemy.x += Math.sin(enemy.y * 0.05) * 2;
                    break;
                case 'circle':
                    enemy.angle += 0.05;
                    enemy.x += Math.cos(enemy.angle) * 2;
                    enemy.y += enemy.speed;
                    break;
            }
            
            // Enemy shooting
            if (Math.random() < settings.enemyFireRate) {
                this.enemyShoot(enemy);
            }
        });
        
        // Remove enemies that are off screen
        this.enemies = this.enemies.filter(enemy => enemy.y < this.canvas.height + 50);
    }
    
    enemyShoot(enemy) {
        this.bullets.push({
            x: enemy.x,
            y: enemy.y + 20,
            vx: 0,
            vy: 3,
            damage: 1,
            isEnemy: true
        });
    }
    
    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += 2;
            powerUp.rotation += 0.05;
            
            return powerUp.y < this.canvas.height + 30;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.size *= 0.98;
            
            return particle.life > 0 && particle.size > 0.5;
        });
    }
    
    updateStars() {
        this.stars.forEach(star => {
            star.y += star.speed;
            
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
    }
    
    updateBoss() {
        if (!this.boss) return;
        
        const boss = this.boss;
        
        // Handle entrance animation
        if (boss.entranceTimer > 0) {
            boss.entranceTimer--;
            boss.y += 2; // Slow descent during entrance
            return; // Don't do other movement during entrance
        }
        
        // Update boss position based on phase
        switch(boss.phase) {
            case 1:
                // Phase 1: Horizontal movement
                boss.x += boss.vx;
                if (boss.x <= 50 || boss.x >= this.canvas.width - 50) {
                    boss.vx = -boss.vx;
                }
                boss.y = 100;
                break;
                
            case 2:
                // Phase 2: Figure-8 pattern
                boss.angle += 0.02;
                boss.x = this.canvas.width / 2 + Math.cos(boss.angle) * 150;
                boss.y = 100 + Math.sin(boss.angle * 2) * 50;
                break;
                
            case 3:
                // Phase 3: Less aggressive pursuit
                const dx = this.player.x - boss.x;
                const dy = this.player.y - boss.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 200) { // Only pursue if far away
                    boss.x += (dx / distance) * 1.5;
                    boss.y += (dy / distance) * 0.8;
                }
                boss.y = Math.max(80, Math.min(120, boss.y));
                break;
        }
        
        // Boss attack patterns
        boss.attackCooldown--;
        if (boss.attackCooldown <= 0) {
            this.bossAttack();
            boss.attackCooldown = boss.attackRate;
        }
        
        // Check phase transitions
        if (boss.health <= boss.maxHealth * 0.66 && boss.phase === 1) {
            boss.phase = 2;
            this.createBossPhaseTransition();
        } else if (boss.health <= boss.maxHealth * 0.33 && boss.phase === 2) {
            boss.phase = 3;
            boss.attackRate = 180; // More manageable in phase 3
            this.createBossPhaseTransition();
        }
        
        // Update boss health bar
        this.updateBossHealthBar();
    }
    
    bossAttack() {
        if (!this.boss) return;
        
        const boss = this.boss;
        
        switch(boss.phase) {
            case 1:
                // Phase 1: Single aimed shot
                this.bossShoot(this.player.x, this.player.y);
                break;
                
            case 2:
                // Phase 2: Triple spread shot
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
                    const spread = angle + (i * 0.2);
                    this.bossShoot(
                        boss.x + Math.cos(spread) * 100,
                        boss.y + Math.sin(spread) * 100,
                        Math.cos(spread) * 4,
                        Math.sin(spread) * 4
                    );
                }
                break;
                
            case 3:
                // Phase 3: Slower bullet hell pattern with gaps
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6 + boss.angle;
                    this.bossShoot(
                        boss.x,
                        boss.y,
                        Math.cos(angle) * 2.5,
                        Math.sin(angle) * 2.5
                    );
                }
                break;
        }
    }
    
    bossShoot(x, y, vx = 0, vy = 2) {
        this.bullets.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            damage: 1,
            isEnemy: true,
            isBossBullet: true
        });
    }
    
    createBoss() {
        const bossTypes = [
            { name: 'Destroyer', color: '#ef4444', maxHealth: 10, size: 60 },
            { name: 'Annihilator', color: '#f59e0b', maxHealth: 15, size: 70 },
            { name: 'Terminator', color: '#8b5cf6', maxHealth: 20, size: 80 }
        ];
        
        const bossType = bossTypes[Math.min(Math.floor(this.wave / 5), bossTypes.length - 1)];
        
        this.boss = {
            x: this.canvas.width / 2,
            y: -200,
            size: bossType.size,
            color: bossType.color,
            name: bossType.name,
            maxHealth: bossType.maxHealth,
            health: bossType.maxHealth,
            phase: 1,
            angle: 0,
            vx: 2,
            attackRate: 180,
            attackCooldown: 300, // Much longer cooldown before first attack
            entranceTimer: 120  // Longer entrance animation
        };
        
        this.showBossWarning();
    }
    
    showBossWarning() {
        this.bossWarningOverlay.classList.add('active');
        
        setTimeout(() => {
            this.bossWarningOverlay.classList.remove('active');
            this.bossHealthContainer.style.display = 'block';
            this.bossNameElement.textContent = this.boss.name;
        }, 3000); // 1 second longer warning
    }
    
    updateBossHealthBar() {
        if (!this.boss) return;
        
        const healthPercent = Math.max(0, this.boss.health / this.boss.maxHealth);
        this.bossHealthFill.style.width = `${healthPercent * 100}%`;
    }
    
    createBossPhaseTransition() {
        // Create explosion effect for phase transition
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = Math.random() * 8 + 4;
            
            this.particles.push({
                x: this.boss.x,
                y: this.boss.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                color: this.boss.color,
                life: 1
            });
        }
    }
    
    destroyBoss() {
        if (!this.boss) return;
        
        // Create massive explosion
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = Math.random() * 10 + 5;
            
            this.particles.push({
                x: this.boss.x,
                y: this.boss.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 8 + 4,
                color: this.boss.color,
                life: 1
            });
        }
        
        // Drop multiple power-ups as rewards
        for (let i = 0; i < 3; i++) {
            this.dropPowerUp(
                this.boss.x + (Math.random() - 0.5) * 100,
                this.boss.y + (Math.random() - 0.5) * 50
            );
        }
        
        // Award bonus points
        this.score += 500;
        this.enemiesDestroyed += 1;
        
        // Hide boss health bar
        this.bossHealthContainer.style.display = 'none';
        
        // Clear boss
        this.boss = null;
        this.isBossWave = false;
    }
    
    checkCollisions() {
        // Bullet-enemy collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.isEnemy) {
                // Check collision with player
                if (this.checkCollision(bullet, this.player, 10, 20)) {
                    if (!this.hasShield()) {
                        this.playerHit();
                    }
                    this.bullets.splice(bulletIndex, 1);
                }
            } else {
                // Check collision with enemies
                this.enemies.forEach((enemy, enemyIndex) => {
                    if (this.checkCollision(bullet, enemy, 4, enemy.size / 2)) {
                        enemy.health -= bullet.damage;
                        
                        if (enemy.health <= 0) {
                            this.createExplosion(enemy.x, enemy.y);
                            this.enemies.splice(enemyIndex, 1);
                            this.score += enemy.points;
                            this.enemiesDestroyed++;
                            
                            // Chance to drop power-up
                            if (Math.random() < this.difficultySettings[this.difficulty].powerUpChance) {
                                this.dropPowerUp(enemy.x, enemy.y);
                            }
                        }
                        
                        this.bullets.splice(bulletIndex, 1);
                    }
                });
                
                // Check collision with boss
                if (this.boss && this.checkCollision(bullet, this.boss, 4, this.boss.size / 2)) {
                    this.boss.health -= bullet.damage;
                    this.createExplosion(bullet.x, bullet.y, this.boss.color);
                    this.bullets.splice(bulletIndex, 1);
                }
            }
        });
        
        // Player-enemy collisions
        this.enemies.forEach((enemy, index) => {
            if (this.checkCollision(this.player, enemy, 20, enemy.size / 2)) {
                if (!this.hasShield()) {
                    this.playerHit();
                }
                this.createExplosion(enemy.x, enemy.y);
                this.enemies.splice(index, 1);
            }
        });
        
        // Player-boss collision - reduced damage
        if (this.boss && this.checkCollision(this.player, this.boss, 20, this.boss.size / 2)) {
            if (!this.hasShield() && !this.player.invulnerable) {
                this.playerHit();
                // Knockback to prevent repeated collision
                this.player.y = Math.min(this.canvas.height - 60, this.player.y + 30);
            }
            this.createExplosion(this.player.x, this.player.y, '#ef4444');
        }
        
        // Player-powerup collisions
        this.powerUps.forEach((powerUp, index) => {
            if (this.checkCollision(this.player, powerUp, 20, 15)) {
                this.collectPowerUp(powerUp);
                this.powerUps.splice(index, 1);
            }
        });
    }
    
    checkCollision(obj1, obj2, radius1, radius2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < radius1 + radius2;
    }
    
    hasShield() {
        return this.activePowerUps.some(p => p.type === 'shield');
    }
    
    playerHit() {
        this.lives--;
        this.createExplosion(this.player.x, this.player.y, '#ef4444');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Brief invulnerability
            this.player.invulnerable = true;
            setTimeout(() => {
                this.player.invulnerable = false;
            }, 2000);
        }
    }
    
    createExplosion(x, y, color = '#f59e0b') {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 5 + 2;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1
            });
        }
    }
    
    dropPowerUp(x, y) {
        const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
        
        this.powerUps.push({
            x: x,
            y: y,
            type: type.type,
            color: type.color,
            duration: type.duration,
            symbol: type.symbol,
            rotation: 0
        });
    }
    
    collectPowerUp(powerUp) {
        this.activePowerUps.push({
            type: powerUp.type,
            remaining: powerUp.duration
        });
        
        // Apply immediate effects
        if (powerUp.type === 'shield') {
            this.createShieldEffect();
        }
        
        this.score += 50;
    }
    
    createShieldEffect() {
        // Visual shield effect around player
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            
            this.particles.push({
                x: this.player.x + Math.cos(angle) * 30,
                y: this.player.y + Math.sin(angle) * 30,
                vx: 0,
                vy: 0,
                size: 3,
                color: '#3b82f6',
                life: 1
            });
        }
    }
    
    spawnWave() {
        // Check if this should be a boss wave (every 5 waves)
        if (this.wave % 5 === 0) {
            this.isBossWave = true;
            this.createBoss();
            return;
        }
        
        this.isBossWave = false;
        const settings = this.difficultySettings[this.difficulty];
        const enemyCount = 3 + this.wave * 2;
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = Math.random() < 0.7 ? 'basic' : 'advanced';
            
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 60) + 30,
                y: -50 - (i * 60),
                size: enemyType === 'basic' ? 20 : 30,
                speed: settings.enemySpeed + (enemyType === 'advanced' ? 1 : 0),
                health: enemyType === 'basic' ? settings.enemyHealth : settings.enemyHealth * 2,
                maxHealth: enemyType === 'basic' ? settings.enemyHealth : settings.enemyHealth * 2,
                pattern: ['straight', 'zigzag', 'circle'][Math.floor(Math.random() * 3)],
                angle: 0,
                color: enemyType === 'basic' ? '#ef4444' : '#f59e0b',
                points: enemyType === 'basic' ? 10 : 25
            });
        }
    }
    
    completeWave() {
        this.gameState = 'waveComplete';
        
        const waveTime = Date.now() - this.waveStartTime;
        const timeBonus = Math.max(0, Math.floor((30000 - waveTime) / 100));
        const waveScore = this.score;
        
        this.score += timeBonus;
        
        // Show wave complete screen
        this.waveScoreElement.textContent = `Wave Score: ${waveScore}`;
        this.waveBonusElement.textContent = `Time Bonus: ${timeBonus}`;
        this.nextWaveWarningElement.textContent = `Get ready for Wave ${this.wave + 1}!`;
        this.waveCompleteOverlay.classList.add('active');
    }
    
    nextWave() {
        this.waveCompleteOverlay.classList.remove('active');
        this.wave++;
        this.waveStartTime = Date.now();
        this.gameState = 'playing';
        this.spawnWave();
        this.gameLoop();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.drawStars();
        
        // Draw game objects
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawBoss();
        this.drawPowerUps();
        this.drawParticles();
    }
    
    drawStars() {
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
    
    drawPlayer() {
        this.ctx.save();
        
        // Draw shield if active
        if (this.hasShield()) {
            this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 35, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw player ship
        this.ctx.fillStyle = this.player.invulnerable && Math.floor(Date.now() / 100) % 2 ? 
            'rgba(59, 130, 246, 0.5)' : this.player.color;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y - 20);
        this.ctx.lineTo(this.player.x - 15, this.player.y + 20);
        this.ctx.lineTo(this.player.x, this.player.y + 10);
        this.ctx.lineTo(this.player.x + 15, this.player.y + 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.player.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            if (bullet.isEnemy) {
                // Boss bullets - bigger and brighter
                if (bullet.isBossBullet) {
                    this.ctx.fillStyle = '#ff6b6b';
                    this.ctx.fillRect(bullet.x - 4, bullet.y - 6, 8, 12);
                    
                    // Add bright glow
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = '#ff6b6b';
                    this.ctx.fillRect(bullet.x - 4, bullet.y - 6, 8, 12);
                    this.ctx.shadowBlur = 0;
                } else {
                    // Regular enemy bullets
                    this.ctx.fillStyle = '#ef4444';
                    this.ctx.fillRect(bullet.x - 2, bullet.y - 4, 4, 8);
                    
                    this.ctx.shadowBlur = 5;
                    this.ctx.shadowColor = '#ef4444';
                    this.ctx.fillRect(bullet.x - 2, bullet.y - 4, 4, 8);
                    this.ctx.shadowBlur = 0;
                }
            } else {
                // Player bullets
                this.ctx.fillStyle = '#3b82f6';
                this.ctx.fillRect(bullet.x - 2, bullet.y - 4, 4, 8);
                
                this.ctx.shadowBlur = 5;
                this.ctx.shadowColor = '#3b82f6';
                this.ctx.fillRect(bullet.x - 2, bullet.y - 4, 4, 8);
                this.ctx.shadowBlur = 0;
            }
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            
            if (enemy.size === 20) {
                // Basic enemy - triangle
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.x, enemy.y + enemy.size / 2);
                this.ctx.lineTo(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2);
                this.ctx.lineTo(enemy.x + enemy.size / 2, enemy.y - enemy.size / 2);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Advanced enemy - diamond
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.x, enemy.y - enemy.size / 2);
                this.ctx.lineTo(enemy.x + enemy.size / 2, enemy.y);
                this.ctx.lineTo(enemy.x, enemy.y + enemy.size / 2);
                this.ctx.lineTo(enemy.x - enemy.size / 2, enemy.y);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            // Health bar for advanced enemies
            if (enemy.maxHealth > 1) {
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
                this.ctx.fillRect(enemy.x - 15, enemy.y - enemy.size / 2 - 10, 30 * healthPercent, 3);
            }
        });
    }
    
    drawBoss() {
        if (!this.boss) return;
        
        const boss = this.boss;
        
        // Draw boss entrance effect
        if (boss.entranceTimer > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = boss.entranceTimer / 60;
            boss.entranceTimer--;
        } else {
            this.ctx.save();
        }
        
        // Draw boss ship
        this.ctx.fillStyle = boss.color;
        
        // Main body - large hexagon
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const x = boss.x + Math.cos(angle) * boss.size / 2;
            const y = boss.y + Math.sin(angle) * boss.size / 2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = boss.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Draw core
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(boss.x, boss.y, boss.size / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw phase indicator
        this.ctx.fillStyle = `hsl(${boss.phase * 120}, 70%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(boss.x, boss.y, boss.size / 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw rotating parts
        this.ctx.save();
        this.ctx.translate(boss.x, boss.y);
        this.ctx.rotate(boss.angle);
        
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            const x = Math.cos(angle) * boss.size / 1.5;
            const y = Math.sin(angle) * boss.size / 1.5;
            
            this.ctx.fillStyle = boss.color;
            this.ctx.fillRect(x - 5, y - 5, 10, 10);
        }
        
        this.ctx.restore();
        this.ctx.restore();
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            this.ctx.save();
            this.ctx.translate(powerUp.x, powerUp.y);
            this.ctx.rotate(powerUp.rotation);
            
            // Draw power-up background
            this.ctx.fillStyle = powerUp.color;
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillRect(-10, -10, 20, 20);
            
            // Draw symbol
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.symbol, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        });
        this.ctx.globalAlpha = 1;
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.bestScoreElement.textContent = `Best: ${this.bestScore}`;
        this.highScoreElement.textContent = `High Score: ${this.highScore}`;
        this.waveElement.textContent = `Wave: ${this.wave}`;
        this.livesElement.textContent = `Lives: ${this.lives}`;
        this.powerElement.textContent = `Power: ${this.powerLevel}`;
    }
    
    updatePowerUpsDisplay() {
        this.activePowerUpsElement.innerHTML = '';
        
        this.activePowerUps.forEach(powerUp => {
            const powerUpInfo = this.powerUpTypes.find(p => p.type === powerUp.type);
            const element = document.createElement('div');
            element.className = 'power-up-icon';
            element.textContent = powerUpInfo.symbol;
            element.style.background = `${powerUpInfo.color}33`;
            element.style.borderColor = powerUpInfo.color;
            this.activePowerUpsElement.appendChild(element);
        });
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        // Update scores
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('space-shooter-best-score', this.bestScore.toString());
            this.newBestElement.classList.add('show');
        } else {
            this.newBestElement.classList.remove('show');
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('space-shooter-high-score', this.highScore.toString());
        }
        
        // Show game over screen
        this.finalScoreElement.textContent = this.score;
        this.wavesCompletedElement.textContent = `Waves Completed: ${this.wave - 1}`;
        this.enemiesDestroyedElement.textContent = `Enemies Destroyed: ${this.enemiesDestroyed}`;
        this.gameOverOverlay.classList.add('active');
    }
    
    resetGame() {
        // Hide overlays
        this.gameOverOverlay.classList.remove('active');
        this.pauseOverlay.classList.remove('active');
        this.waveCompleteOverlay.classList.remove('active');
        
        // Reset game state
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.powerLevel = 1;
        this.enemiesDestroyed = 0;
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.activePowerUps = [];
        this.boss = null;
        this.isBossWave = false;
        
        // Hide boss health bar
        this.bossHealthContainer.style.display = 'none';
        
        // Reset player position
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 60;
        
        // Update display
        this.updateDisplay();
        this.updatePowerUpsDisplay();
        
        // Show start screen
        this.showStartScreen();
        
        // Draw initial state
        this.draw();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpaceShooter();
});
