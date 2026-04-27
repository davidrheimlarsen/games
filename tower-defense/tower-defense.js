class TowerDefenseGame {
    constructor() {
        this.gridWidth = 12;
        this.gridHeight = 8;
        this.cellSize = 50;
        this.grid = [];
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.selectedTowerType = null;
        this.gameMode = 'place'; // place, sell, upgrade
        this.gameState = 'menu'; // menu, playing, paused, gameover
        this.wave = 0;
        this.health = 20;
        this.gold = 100;
        this.score = 0;
        this.difficulty = 'medium';
        this.waveInProgress = false;
        this.waveTimer = null;
        this.enemySpawnTimer = null;
        this.gameLoop = null;
        this.path = [];
        this.bestScores = {}; // Fallback for localStorage issues
        
        this.towerTypes = {
            basic: {
                name: 'Basic Tower',
                cost: 50,
                damage: 10,
                range: 100,
                fireRate: 1000,
                color: '#3b82f6',
                icon: '🔫',
                projectileSpeed: 5
            },
            sniper: {
                name: 'Sniper Tower',
                cost: 100,
                damage: 25,
                range: 180,
                fireRate: 2000,
                color: '#8b5cf6',
                icon: '🎯',
                projectileSpeed: 8
            },
            rapid: {
                name: 'Rapid Tower',
                cost: 150,
                damage: 5,
                range: 80,
                fireRate: 300,
                color: '#f59e0b',
                icon: '⚡',
                projectileSpeed: 6
            },
            freeze: {
                name: 'Freeze Tower',
                cost: 200,
                damage: 8,
                range: 90,
                fireRate: 1500,
                color: '#06b6d4',
                icon: '❄️',
                projectileSpeed: 4,
                slowEffect: 0.5,
                slowDuration: 2000
            }
        };
        
        this.enemyTypes = {
            basic: {
                health: 50,
                speed: 2,
                reward: 10,
                damage: 1,
                icon: '👾',
                color: '#ef4444'
            },
            fast: {
                health: 30,
                speed: 4,
                reward: 15,
                damage: 1,
                icon: '🏃',
                color: '#f59e0b'
            },
            tank: {
                health: 150,
                speed: 1,
                reward: 30,
                damage: 3,
                icon: '🛡️',
                color: '#6b7280'
            }
        };
        
        this.waveConfigs = {
            easy: [
                { enemies: [{ type: 'basic', count: 5 }], reward: 50 },
                { enemies: [{ type: 'basic', count: 8 }], reward: 60 },
                { enemies: [{ type: 'basic', count: 5 }, { type: 'fast', count: 3 }], reward: 80 },
                { enemies: [{ type: 'basic', count: 10 }, { type: 'fast', count: 5 }], reward: 100 },
                { enemies: [{ type: 'basic', count: 8 }, { type: 'fast', count: 8 }, { type: 'tank', count: 2 }], reward: 150 }
            ],
            medium: [
                { enemies: [{ type: 'basic', count: 8 }], reward: 50 },
                { enemies: [{ type: 'basic', count: 12 }, { type: 'fast', count: 4 }], reward: 80 },
                { enemies: [{ type: 'basic', count: 10 }, { type: 'fast', count: 8 }], reward: 100 },
                { enemies: [{ type: 'basic', count: 15 }, { type: 'fast', count: 10 }, { type: 'tank', count: 3 }], reward: 150 },
                { enemies: [{ type: 'basic', count: 20 }, { type: 'fast', count: 15 }, { type: 'tank', count: 5 }], reward: 200 }
            ],
            hard: [
                { enemies: [{ type: 'basic', count: 12 }, { type: 'fast', count: 6 }], reward: 80 },
                { enemies: [{ type: 'basic', count: 15 }, { type: 'fast', count: 10 }, { type: 'tank', count: 4 }], reward: 120 },
                { enemies: [{ type: 'basic', count: 20 }, { type: 'fast', count: 15 }, { type: 'tank', count: 6 }], reward: 180 },
                { enemies: [{ type: 'basic', count: 25 }, { type: 'fast', count: 20 }, { type: 'tank', count: 8 }], reward: 250 },
                { enemies: [{ type: 'basic', count: 30 }, { type: 'fast', count: 25 }, { type: 'tank', count: 10 }], reward: 350 }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.createGrid();
        this.setupEventListeners();
        this.updateUI();
        this.showStartOverlay();
    }
    
    createGrid() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        this.grid = [];
        
        // Define path (simple S-shaped path)
        this.path = [
            { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
            { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 0 },
            { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
            { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 },
            { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 7, y: 7 },
            { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }
        ];
        
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // Check if this cell is part of the path
                if (this.path.some(p => p.x === x && p.y === y)) {
                    cell.classList.add('path');
                }
                
                cell.addEventListener('click', (e) => this.handleCellClick(x, y));
                gameBoard.appendChild(cell);
                this.grid[y][x] = { element: cell, occupied: false, tower: null };
            }
        }
    }
    
    setupEventListeners() {
        // Tower selection
        document.querySelectorAll('.tower-card').forEach(card => {
            card.addEventListener('click', () => {
                const towerType = card.dataset.tower;
                this.selectTower(towerType);
            });
        });
        
        // Game controls
        document.getElementById('start-wave-btn').addEventListener('click', () => this.startWave());
        document.getElementById('sell-mode-btn').addEventListener('click', () => this.setGameMode('sell'));
        document.getElementById('upgrade-mode-btn').addEventListener('click', () => this.setGameMode('upgrade'));
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.difficulty = btn.dataset.difficulty;
            });
        });
        
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // Game over
        document.getElementById('play-again-btn').addEventListener('click', () => this.resetGame());
        
        // Pause
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
    }
    
    selectTower(towerType) {
        if (this.gameState !== 'playing') return;
        
        const tower = this.towerTypes[towerType];
        if (this.gold >= tower.cost) {
            this.selectedTowerType = towerType;
            this.setGameMode('place');
            
            // Update UI
            document.querySelectorAll('.tower-card').forEach(card => {
                card.classList.remove('selected');
            });
            document.querySelector(`[data-tower="${towerType}"]`).classList.add('selected');
        }
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
        if (mode !== 'place') {
            this.selectedTowerType = null;
        }
        
        // Update UI
        document.querySelectorAll('.tower-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.getElementById('sell-mode-btn').classList.toggle('active', mode === 'sell');
        document.getElementById('upgrade-mode-btn').classList.toggle('active', mode === 'upgrade');
        
        // Update cursor styles
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('sell-mode', 'upgrade-mode');
            if (mode === 'sell') {
                cell.classList.add('sell-mode');
            } else if (mode === 'upgrade') {
                cell.classList.add('upgrade-mode');
            }
        });
    }
    
    handleCellClick(x, y) {
        if (this.gameState !== 'playing') return;
        
        const cell = this.grid[y][x];
        
        if (this.gameMode === 'place' && this.selectedTowerType) {
            this.placeTower(x, y, this.selectedTowerType);
        } else if (this.gameMode === 'sell' && cell.tower) {
            this.sellTower(x, y);
        } else if (this.gameMode === 'upgrade' && cell.tower) {
            this.upgradeTower(x, y);
        }
    }
    
    placeTower(x, y, towerType) {
        const cell = this.grid[y][x];
        if (cell.occupied || this.path.some(p => p.x === x && p.y === y)) return;
        
        const tower = this.towerTypes[towerType];
        if (this.gold < tower.cost) return;
        
        // Create tower
        const towerObj = {
            x, y,
            type: towerType,
            level: 1,
            lastFired: 0,
            ...tower
        };
        
        this.towers.push(towerObj);
        cell.occupied = true;
        cell.tower = towerObj;
        
        // Create visual tower
        const towerElement = document.createElement('div');
        towerElement.className = `tower ${towerType}`;
        towerElement.innerHTML = tower.icon;
        cell.element.appendChild(towerElement);
        cell.element.classList.add('occupied');
        
        // Deduct gold
        this.gold -= tower.cost;
        this.updateUI();
        
        // Reset selection
        this.setGameMode('place');
    }
    
    sellTower(x, y) {
        const cell = this.grid[y][x];
        const tower = cell.tower;
        if (!tower) return;
        
        // Refund 50% of cost
        const sellPrice = Math.floor(this.towerTypes[tower.type].cost * 0.5);
        this.gold += sellPrice;
        
        // Remove tower
        this.towers = this.towers.filter(t => t !== tower);
        cell.occupied = false;
        cell.tower = null;
        cell.element.innerHTML = '';
        cell.element.classList.remove('occupied');
        
        this.updateUI();
    }
    
    upgradeTower(x, y) {
        const cell = this.grid[y][x];
        const tower = cell.tower;
        if (!tower || tower.level >= 3) return;
        
        const upgradeCost = this.towerTypes[tower.type].cost * tower.level;
        if (this.gold < upgradeCost) return;
        
        // Upgrade tower
        tower.level++;
        tower.damage = Math.floor(tower.damage * 1.5);
        tower.range = Math.floor(tower.range * 1.2);
        tower.fireRate = Math.floor(tower.fireRate * 0.9);
        
        // Update visual
        const towerElement = cell.element.querySelector('.tower');
        if (towerElement) {
            towerElement.style.transform = `scale(${1 + tower.level * 0.1})`;
        }
        
        this.gold -= upgradeCost;
        this.updateUI();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideAllOverlays();
        this.startGameLoop();
        this.updateUI();
    }
    
    startWave() {
        if (this.waveInProgress || this.gameState !== 'playing') return;
        
        this.wave++;
        this.waveInProgress = true;
        
        const waveConfig = this.waveConfigs[this.difficulty][Math.min(this.wave - 1, this.waveConfigs[this.difficulty].length - 1)];
        const enemies = waveConfig.enemies;
        
        // Update UI
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('start-wave-btn').disabled = true;
        document.getElementById('enemies-next').textContent = enemies.reduce((sum, e) => sum + e.count, 0);
        
        // Spawn enemies
        let totalSpawned = 0;
        const totalToSpawn = enemies.reduce((sum, e) => sum + e.count, 0);
        
        this.enemySpawnTimer = setInterval(() => {
            if (totalSpawned >= totalToSpawn) {
                clearInterval(this.enemySpawnTimer);
                this.enemySpawnTimer = null;
                return;
            }
            
            // Find next enemy type to spawn
            for (const enemyConfig of enemies) {
                const spawned = enemyConfig.spawned || 0;
                if (spawned < enemyConfig.count) {
                    this.spawnEnemy(enemyConfig.type);
                    enemyConfig.spawned = spawned + 1;
                    totalSpawned++;
                    break;
                }
            }
        }, 1000);
    }
    
    spawnEnemy(type) {
        const enemyType = this.enemyTypes[type];
        const enemy = {
            x: this.path[0].x * this.cellSize + this.cellSize / 2,
            y: this.path[0].y * this.cellSize + this.cellSize / 2,
            type,
            health: enemyType.health,
            maxHealth: enemyType.health,
            speed: enemyType.speed,
            pathIndex: 0,
            frozen: false,
            frozenUntil: 0,
            ...enemyType
        };
        
        this.enemies.push(enemy);
        this.createEnemyElement(enemy);
    }
    
    createEnemyElement(enemy) {
        const enemyElement = document.createElement('div');
        enemyElement.className = `enemy ${enemy.type}`;
        enemyElement.innerHTML = `
            ${enemy.icon}
            <div class="enemy-health-bar">
                <div class="enemy-health-fill" style="width: 100%"></div>
            </div>
        `;
        
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.appendChild(enemyElement);
        enemy.element = enemyElement;
        this.updateEnemyPosition(enemy);
    }
    
    updateEnemyPosition(enemy) {
        if (enemy.element) {
            enemy.element.style.left = `${enemy.x - 15}px`;
            enemy.element.style.top = `${enemy.y - 15}px`;
            
            // Update health bar
            const healthFill = enemy.element.querySelector('.enemy-health-fill');
            if (healthFill) {
                const healthPercent = (enemy.health / enemy.maxHealth) * 100;
                healthFill.style.width = `${healthPercent}%`;
            }
            
            // Update frozen state
            enemy.element.classList.toggle('frozen', enemy.frozen);
        }
    }
    
    startGameLoop() {
        const gameLoop = () => {
            if (this.gameState !== 'playing') return;
            
            // Update enemies
            this.updateEnemies();
            
            // Update towers
            this.updateTowers();
            
            // Update projectiles
            this.updateProjectiles();
            
            // Update particles
            this.updateParticles();
            
            // Check wave completion
            this.checkWaveCompletion();
            
            // Check game over
            if (this.health <= 0) {
                this.gameOver();
                return;
            }
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    updateEnemies() {
        const currentTime = Date.now();
        
        this.enemies.forEach((enemy, index) => {
            // Check frozen state
            if (enemy.frozen && currentTime > enemy.frozenUntil) {
                enemy.frozen = false;
            }
            
            // Move enemy
            if (enemy.pathIndex < this.path.length - 1) {
                const target = this.path[enemy.pathIndex + 1];
                const targetX = target.x * this.cellSize + this.cellSize / 2;
                const targetY = target.y * this.cellSize + this.cellSize / 2;
                
                const dx = targetX - enemy.x;
                const dy = targetY - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const speed = enemy.frozen ? enemy.speed * 0.3 : enemy.speed;
                
                if (distance < speed) {
                    enemy.pathIndex++;
                    if (enemy.pathIndex >= this.path.length - 1) {
                        // Enemy reached the end
                        this.health -= enemy.damage;
                        this.removeEnemy(index);
                        this.updateUI();
                    }
                } else {
                    enemy.x += (dx / distance) * speed;
                    enemy.y += (dy / distance) * speed;
                    this.updateEnemyPosition(enemy);
                }
            }
        });
    }
    
    updateTowers() {
        const currentTime = Date.now();
        
        this.towers.forEach(tower => {
            if (currentTime - tower.lastFired < tower.fireRate) return;
            
            // Find nearest enemy in range
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            this.enemies.forEach(enemy => {
                const distance = this.getDistance(tower, enemy);
                if (distance <= tower.range && distance < nearestDistance) {
                    nearestEnemy = enemy;
                    nearestDistance = distance;
                }
            });
            
            if (nearestEnemy) {
                this.fireProjectile(tower, nearestEnemy);
                tower.lastFired = currentTime;
            }
        });
    }
    
    fireProjectile(tower, target) {
        const projectile = {
            x: tower.x * this.cellSize + this.cellSize / 2,
            y: tower.y * this.cellSize + this.cellSize / 2,
            target,
            damage: tower.damage,
            speed: tower.projectileSpeed,
            type: tower.type,
            tower
        };
        
        this.projectiles.push(projectile);
        this.createProjectileElement(projectile);
    }
    
    createProjectileElement(projectile) {
        const projectileElement = document.createElement('div');
        projectileElement.className = `projectile ${projectile.type}`;
        
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.appendChild(projectileElement);
        projectile.element = projectileElement;
        this.updateProjectilePosition(projectile);
    }
    
    updateProjectilePosition(projectile) {
        if (projectile.element) {
            projectile.element.style.left = `${projectile.x - 3}px`;
            projectile.element.style.top = `${projectile.y - 3}px`;
        }
    }
    
    updateProjectiles() {
        this.projectiles.forEach((projectile, index) => {
            if (!this.enemies.includes(projectile.target)) {
                this.removeProjectile(index);
                return;
            }
            
            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.speed) {
                // Hit target
                this.damageEnemy(projectile.target, projectile.damage, projectile.type);
                this.createImpactEffect(projectile.x, projectile.y);
                this.removeProjectile(index);
            } else {
                // Move projectile
                projectile.x += (dx / distance) * projectile.speed;
                projectile.y += (dy / distance) * projectile.speed;
                this.updateProjectilePosition(projectile);
            }
        });
    }
    
    damageEnemy(enemy, damage, projectileType) {
        enemy.health -= damage;
        
        // Show damage text
        this.createDamageText(enemy.x, enemy.y, damage);
        
        // Apply freeze effect
        if (projectileType === 'freeze') {
            enemy.frozen = true;
            enemy.frozenUntil = Date.now() + 2000;
        }
        
        // Check if enemy is dead
        if (enemy.health <= 0) {
            this.gold += enemy.reward;
            this.score += enemy.reward * 2;
            this.createDeathEffect(enemy.x, enemy.y);
            this.removeEnemy(this.enemies.indexOf(enemy));
            this.updateUI();
        }
    }
    
    createDamageText(x, y, damage) {
        const damageElement = document.createElement('div');
        damageElement.className = 'damage-text';
        damageElement.textContent = `-${damage}`;
        damageElement.style.left = `${x}px`;
        damageElement.style.top = `${y - 20}px`;
        
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.appendChild(damageElement);
        
        setTimeout(() => damageElement.remove(), 1000);
    }
    
    createImpactEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            this.createParticle(x, y, this.towerTypes.basic.color);
        }
    }
    
    createDeathEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.createParticle(x, y, '#ef4444');
        }
    }
    
    createParticle(x, y, color) {
        const particle = {
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color,
            life: 500
        };
        
        this.particles.push(particle);
        
        const particleElement = document.createElement('div');
        particleElement.className = 'particle';
        particleElement.style.background = color;
        particleElement.style.left = `${x}px`;
        particleElement.style.top = `${y}px`;
        particleElement.style.setProperty('--dx', `${particle.vx * 10}px`);
        particleElement.style.setProperty('--dy', `${particle.vy * 10}px`);
        
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.appendChild(particleElement);
        particle.element = particleElement;
        
        setTimeout(() => {
            if (particle.element) particle.element.remove();
            const index = this.particles.indexOf(particle);
            if (index > -1) this.particles.splice(index, 1);
        }, particle.life);
    }
    
    updateParticles() {
        // Particles are handled by CSS animations
    }
    
    removeEnemy(index) {
        const enemy = this.enemies[index];
        if (enemy && enemy.element) {
            enemy.element.remove();
        }
        this.enemies.splice(index, 1);
    }
    
    removeProjectile(index) {
        const projectile = this.projectiles[index];
        if (projectile && projectile.element) {
            projectile.element.remove();
        }
        this.projectiles.splice(index, 1);
    }
    
    checkWaveCompletion() {
        if (this.waveInProgress && this.enemies.length === 0 && !this.enemySpawnTimer) {
            this.waveInProgress = false;
            
            // Wave completion bonus
            const waveConfig = this.waveConfigs[this.difficulty][Math.min(this.wave - 1, this.waveConfigs[this.difficulty].length - 1)];
            this.gold += waveConfig.reward;
            this.score += waveConfig.reward * 5;
            
            // Enable next wave button
            document.getElementById('start-wave-btn').disabled = false;
            document.getElementById('enemies-next').textContent = '0';
            
            this.updateUI();
        }
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pause-overlay').classList.add('active');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pause-overlay').classList.remove('active');
        this.startGameLoop();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        
        // Update game over screen
        document.getElementById('game-over-title').textContent = this.health <= 0 ? 'Game Over' : 'Victory!';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('waves-survived').textContent = `Waves Survived: ${this.wave}`;
        
        // Check for new best (with localStorage error handling)
        let bestScore = 0;
        try {
            bestScore = localStorage.getItem(`towerDefense_best_${this.difficulty}`) || 0;
        } catch (e) {
            // localStorage not available, use in-memory storage
            bestScore = this.bestScores?.[this.difficulty] || 0;
        }
        
        if (this.score > bestScore) {
            try {
                localStorage.setItem(`towerDefense_best_${this.difficulty}`, this.score);
            } catch (e) {
                // localStorage not available, use in-memory storage
                if (!this.bestScores) this.bestScores = {};
                this.bestScores[this.difficulty] = this.score;
            }
            document.getElementById('new-best').style.display = 'block';
        } else {
            document.getElementById('new-best').style.display = 'none';
        }
        
        document.getElementById('game-over-overlay').classList.add('active');
    }
    
    resetGame() {
        // Clear game objects
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        
        // Reset game state
        this.wave = 0;
        this.health = 20;
        this.gold = 100;
        this.score = 0;
        this.waveInProgress = false;
        this.gameMode = 'place';
        this.selectedTowerType = null;
        
        // Clear timers
        if (this.enemySpawnTimer) {
            clearInterval(this.enemySpawnTimer);
            this.enemySpawnTimer = null;
        }
        
        // Reset grid
        this.createGrid();
        
        // Update UI
        this.updateUI();
        document.getElementById('start-wave-btn').disabled = false;
        
        // Hide overlays
        this.hideAllOverlays();
        this.showStartOverlay();
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.health;
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('score').textContent = this.score;
        
        // Update tower card states
        document.querySelectorAll('.tower-card').forEach(card => {
            const towerType = card.dataset.tower;
            const tower = this.towerTypes[towerType];
            const canAfford = this.gold >= tower.cost;
            
            card.classList.toggle('disabled', !canAfford);
        });
    }
    
    showStartOverlay() {
        document.getElementById('start-overlay').classList.add('active');
        this.gameState = 'menu';
    }
    
    hideAllOverlays() {
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TowerDefenseGame();
});
