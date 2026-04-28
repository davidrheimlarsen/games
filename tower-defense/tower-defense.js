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
        this.health = 25;
        this.gold = 150;
        this.score = 0;
        this.difficulty = 'medium';
        this.waveInProgress = false;
        this.waveTimer = null;
        this.enemySpawnTimer = null;
        this.gameLoop = null;
        this.path = [];
        this.bestScores = {}; // Fallback for localStorage issues
        this.previewRangeElement = null;
        this.gameSpeed = 1; // Default game speed
        this.autoWaveEnabled = false; // Auto-wave functionality
        
        // Achievements system
        this.achievements = {
            firstBlood: { id: 'firstBlood', name: 'First Blood', description: 'Defeat your first enemy', icon: '🩸', unlocked: false },
            towerMaster: { id: 'towerMaster', name: 'Tower Master', description: 'Place 10 towers', icon: '🏰', unlocked: false },
            waveSurvivor: { id: 'waveSurvivor', name: 'Wave Survivor', description: 'Survive 5 waves', icon: '🌊', unlocked: false },
            richKing: { id: 'richKing', name: 'Rich King', description: 'Accumulate 500 gold', icon: '👑', unlocked: false },
            speedDemon: { id: 'speedDemon', name: 'Speed Demon', description: 'Complete a wave at 2x speed', icon: '⚡', unlocked: false },
            perfectDefense: { id: 'perfectDefense', name: 'Perfect Defense', description: 'Complete a wave without losing health', icon: '🛡️', unlocked: false },
            sniperElite: { id: 'sniperElite', name: 'Sniper Elite', description: 'Kill 50 enemies with sniper towers', icon: '🎯', unlocked: false },
            freezeChampion: { id: 'freezeChampion', name: 'Freeze Champion', description: 'Kill 30 enemies with freeze towers', icon: '❄️', unlocked: false },
            rapidFire: { id: 'rapidFire', name: 'Rapid Fire', description: 'Kill 100 enemies with rapid towers', icon: '🔥', unlocked: false },
            veteran: { id: 'veteran', name: 'Veteran', description: 'Survive 10 waves', icon: '⭐', unlocked: false },
            legend: { id: 'legend', name: 'Legend', description: 'Survive 20 waves', icon: '🏆', unlocked: false },
            strategist: { id: 'strategist', name: 'Strategist', description: 'Use 0x speed for 30 seconds', icon: '🧠', unlocked: false }
        };
        this.achievementStats = {
            enemiesKilled: 0,
            towersPlaced: 0,
            wavesCompleted: 0,
            goldEarned: 0,
            sniperKills: 0,
            freezeKills: 0,
            rapidKills: 0,
            speedModeTime: 0,
            lastSpeedChange: Date.now(),
            perfectWaves: 0
        };
        this.unlockedAchievements = [];
        
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
            },
            cannon: {
                name: 'Cannon Tower',
                cost: 250,
                damage: 40,
                range: 120,
                innerRange: 40,
                fireRate: 3000,
                color: '#dc2626',
                icon: '💣',
                projectileSpeed: 3,
                areaDamage: true,
                areaRadius: 60
            },
            poison: {
                name: 'Poison Tower',
                cost: 175,
                damage: 6,
                range: 100,
                fireRate: 1200,
                color: '#84cc16',
                icon: '☠️',
                projectileSpeed: 5,
                poisonDamage: 3,
                poisonDuration: 4000
            },
            laser: {
                name: 'Laser Tower',
                cost: 300,
                damage: 15,
                range: 150,
                fireRate: 100,
                color: '#f97316',
                icon: '⚡',
                projectileSpeed: 20,
                continuous: true,
                beamWidth: 3
            }
        };
        
        this.enemyTypes = {
            basic: {
                health: 35,
                speed: 2,
                reward: 15,
                damage: 1,
                icon: '👾',
                color: '#ef4444'
            },
            fast: {
                health: 20,
                speed: 4,
                reward: 20,
                damage: 1,
                icon: '🏃',
                color: '#f59e0b'
            },
            tank: {
                health: 100,
                speed: 1,
                reward: 40,
                damage: 2,
                icon: '🛡️',
                color: '#6b7280'
            }
        };
        
        this.waveConfigs = {
            easy: [
                { enemies: [{ type: 'basic', count: 3 }], reward: 60 },
                { enemies: [{ type: 'basic', count: 5 }], reward: 80 },
                { enemies: [{ type: 'basic', count: 4 }, { type: 'fast', count: 2 }], reward: 100 },
                { enemies: [{ type: 'basic', count: 6 }, { type: 'fast', count: 3 }], reward: 120 },
                { enemies: [{ type: 'basic', count: 5 }, { type: 'fast', count: 5 }, { type: 'tank', count: 1 }], reward: 180 },
                { enemies: [{ type: 'basic', count: 8 }, { type: 'fast', count: 6 }, { type: 'tank', count: 2 }], reward: 220 },
                { enemies: [{ type: 'basic', count: 10 }, { type: 'fast', count: 8 }, { type: 'tank', count: 3 }], reward: 260 },
                { enemies: [{ type: 'basic', count: 12 }, { type: 'fast', count: 10 }, { type: 'tank', count: 4 }], reward: 300 },
                { enemies: [{ type: 'basic', count: 15 }, { type: 'fast', count: 12 }, { type: 'tank', count: 5 }], reward: 350 },
                { enemies: [{ type: 'basic', count: 18 }, { type: 'fast', count: 15 }, { type: 'tank', count: 6 }], reward: 400 }
            ],
            medium: [
                { enemies: [{ type: 'basic', count: 5 }], reward: 60 },
                { enemies: [{ type: 'basic', count: 8 }, { type: 'fast', count: 3 }], reward: 100 },
                { enemies: [{ type: 'basic', count: 7 }, { type: 'fast', count: 5 }], reward: 120 },
                { enemies: [{ type: 'basic', count: 10 }, { type: 'fast', count: 7 }, { type: 'tank', count: 2 }], reward: 180 },
                { enemies: [{ type: 'basic', count: 15 }, { type: 'fast', count: 10 }, { type: 'tank', count: 3 }], reward: 250 },
                { enemies: [{ type: 'basic', count: 18 }, { type: 'fast', count: 12 }, { type: 'tank', count: 4 }], reward: 300 },
                { enemies: [{ type: 'basic', count: 20 }, { type: 'fast', count: 15 }, { type: 'tank', count: 5 }], reward: 350 },
                { enemies: [{ type: 'basic', count: 25 }, { type: 'fast', count: 18 }, { type: 'tank', count: 6 }], reward: 400 },
                { enemies: [{ type: 'basic', count: 30 }, { type: 'fast', count: 20 }, { type: 'tank', count: 8 }], reward: 450 },
                { enemies: [{ type: 'basic', count: 35 }, { type: 'fast', count: 25 }, { type: 'tank', count: 10 }], reward: 500 }
            ],
            hard: [
                { enemies: [{ type: 'basic', count: 8 }, { type: 'fast', count: 4 }], reward: 100 },
                { enemies: [{ type: 'basic', count: 10 }, { type: 'fast', count: 7 }, { type: 'tank', count: 2 }], reward: 150 },
                { enemies: [{ type: 'basic', count: 15 }, { type: 'fast', count: 10 }, { type: 'tank', count: 4 }], reward: 220 },
                { enemies: [{ type: 'basic', count: 18 }, { type: 'fast', count: 15 }, { type: 'tank', count: 5 }], reward: 300 },
                { enemies: [{ type: 'basic', count: 20 }, { type: 'fast', count: 18 }, { type: 'tank', count: 6 }], reward: 400 },
                { enemies: [{ type: 'basic', count: 25 }, { type: 'fast', count: 20 }, { type: 'tank', count: 8 }], reward: 500 },
                { enemies: [{ type: 'basic', count: 30 }, { type: 'fast', count: 25 }, { type: 'tank', count: 10 }], reward: 600 },
                { enemies: [{ type: 'basic', count: 35 }, { type: 'fast', count: 30 }, { type: 'tank', count: 12 }], reward: 700 },
                { enemies: [{ type: 'basic', count: 40 }, { type: 'fast', count: 35 }, { type: 'tank', count: 15 }], reward: 800 },
                { enemies: [{ type: 'basic', count: 45 }, { type: 'fast', count: 40 }, { type: 'tank', count: 18 }], reward: 900 }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.createGrid();
        this.setupEventListeners();
        this.loadAchievements();
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
                cell.addEventListener('mouseenter', (e) => this.handleCellHover(x, y));
                cell.addEventListener('mouseleave', (e) => this.handleCellLeave(x, y));
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
        
        // Auto-wave button
        document.getElementById('auto-wave-btn').addEventListener('click', () => {
            this.autoWaveEnabled = !this.autoWaveEnabled;
            const btn = document.getElementById('auto-wave-btn');
            btn.textContent = this.autoWaveEnabled ? 'ON' : 'OFF';
            btn.classList.toggle('active', this.autoWaveEnabled);
            
            if (this.autoWaveEnabled && !this.waveInProgress && this.gameState === 'playing') {
                this.startWave();
            }
        });
        
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
        
        // Achievements
        document.getElementById('achievements-btn').addEventListener('click', () => this.showAchievements());
        document.getElementById('close-achievements-btn').addEventListener('click', () => this.hideAchievements());
        
        // Speed controls
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseFloat(btn.dataset.speed);
                this.setGameSpeed(speed);
            });
        });
        
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
    
    setGameSpeed(speed) {
        // Track speed mode time for strategist achievement
        if (this.gameSpeed === 0 && speed !== 0) {
            this.achievementStats.speedModeTime += (Date.now() - this.achievementStats.lastSpeedChange) / 1000;
            this.checkAchievement('strategist', this.achievementStats.speedModeTime >= 30);
        }
        this.achievementStats.lastSpeedChange = Date.now();
        
        this.gameSpeed = speed;
        
        // Update UI
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-speed="${speed}"]`).classList.add('active');
    }
    
    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.unlockedAchievements.push(achievement);
            this.showAchievementNotification(achievement);
            this.saveAchievements();
        }
    }
    
    checkAchievement(achievementId, condition) {
        if (condition && !this.achievements[achievementId].unlocked) {
            this.unlockAchievement(achievementId);
        }
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    saveAchievements() {
        try {
            const saveData = {
                achievements: Object.keys(this.achievements).reduce((acc, key) => {
                    acc[key] = this.achievements[key].unlocked;
                    return acc;
                }, {}),
                stats: this.achievementStats
            };
            localStorage.setItem('towerDefense_achievements', JSON.stringify(saveData));
        } catch (e) {
            console.log('Could not save achievements');
        }
    }
    
    loadAchievements() {
        try {
            const saveData = JSON.parse(localStorage.getItem('towerDefense_achievements'));
            if (saveData) {
                Object.keys(saveData.achievements).forEach(key => {
                    if (this.achievements[key]) {
                        this.achievements[key].unlocked = saveData.achievements[key];
                        if (saveData.achievements[key]) {
                            this.unlockedAchievements.push(this.achievements[key]);
                        }
                    }
                });
                this.achievementStats = { ...this.achievementStats, ...saveData.stats };
            }
        } catch (e) {
            console.log('Could not load achievements');
        }
    }
    
    showAchievements() {
        const overlay = document.getElementById('achievements-overlay');
        overlay.classList.add('active');
        this.populateAchievements();
    }
    
    hideAchievements() {
        const overlay = document.getElementById('achievements-overlay');
        overlay.classList.remove('active');
    }
    
    populateAchievements() {
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';
        
        Object.values(this.achievements).forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
                <div class="achievement-status">${achievement.unlocked ? '✓' : '🔒'}</div>
            `;
            grid.appendChild(achievementEl);
        });
        
        // Update stats
        const unlockedCount = this.unlockedAchievements.length;
        const totalCount = Object.keys(this.achievements).length;
        document.getElementById('unlocked-count').textContent = `${unlockedCount}/${totalCount}`;
        document.getElementById('enemies-defeated').textContent = this.achievementStats.enemiesKilled;
        document.getElementById('towers-placed').textContent = this.achievementStats.towersPlaced;
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
        if (mode !== 'place') {
            this.selectedTowerType = null;
            this.hideRangePreview();
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
    
    handleCellHover(x, y) {
        if (this.gameState !== 'playing' || this.gameMode !== 'place' || !this.selectedTowerType) return;
        
        const cell = this.grid[y][x];
        if (cell.occupied || this.path.some(p => p.x === x && p.y === y)) return;
        
        this.showRangePreview(x, y, this.selectedTowerType);
    }
    
    handleCellLeave(x, y) {
        this.hideRangePreview();
    }
    
    showRangePreview(x, y, towerType) {
        this.hideRangePreview();
        
        const tower = this.towerTypes[towerType];
        const preview = document.createElement('div');
        preview.className = `range-indicator ${towerType} preview`;
        
        // Calculate size and position
        const diameter = tower.range * 2;
        const centerX = x * this.cellSize + this.cellSize / 2;
        const centerY = y * this.cellSize + this.cellSize / 2;
        
        preview.style.width = `${diameter}px`;
        preview.style.height = `${diameter}px`;
        preview.style.left = `${centerX - tower.range}px`;
        preview.style.top = `${centerY - tower.range}px`;
        preview.style.position = 'absolute';
        
        // Add donut hole for cannon tower preview
        if (tower.innerRange) {
            preview.style.background = `
                radial-gradient(circle, transparent ${tower.innerRange}px, 
                rgba(220, 38, 38, 0.15) ${tower.innerRange}px, 
                rgba(220, 38, 38, 0.05) 70%, transparent 100%)
            `;
            preview.style.border = `2px dashed rgba(220, 38, 38, 0.4)`;
            preview.style.boxShadow = `
                inset 0 0 0 ${tower.innerRange}px transparent,
                0 0 0 2px rgba(220, 38, 38, 0.2)
            `;
        }
        
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.appendChild(preview);
        this.previewRangeElement = preview;
    }
    
    hideRangePreview() {
        if (this.previewRangeElement) {
            this.previewRangeElement.remove();
            this.previewRangeElement = null;
        }
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
        
        // Create range indicator
        this.createRangeIndicator(towerObj, cell.element);
        
        // Deduct gold
        this.gold -= tower.cost;
        
        // Track achievements
        this.achievementStats.towersPlaced++;
        this.checkAchievement('towerMaster', this.achievementStats.towersPlaced >= 10);
        
        this.updateUI();
        
        // Reset selection
        this.setGameMode('place');
        this.hideRangePreview();
    }
    
    createRangeIndicator(tower, cellElement) {
        const rangeIndicator = document.createElement('div');
        rangeIndicator.className = `range-indicator ${tower.type}`;
        
        // Calculate size and position
        const diameter = tower.range * 2;
        const centerX = this.cellSize / 2;
        const centerY = this.cellSize / 2;
        
        rangeIndicator.style.width = `${diameter}px`;
        rangeIndicator.style.height = `${diameter}px`;
        rangeIndicator.style.left = `${centerX - tower.range}px`;
        rangeIndicator.style.top = `${centerY - tower.range}px`;
        
        // Add donut hole for cannon tower
        if (tower.innerRange) {
            const innerDiameter = tower.innerRange * 2;
            rangeIndicator.style.background = `
                radial-gradient(circle, transparent ${tower.innerRange}px, 
                rgba(220, 38, 38, 0.15) ${tower.innerRange}px, 
                rgba(220, 38, 38, 0.05) 70%, transparent 100%)
            `;
            rangeIndicator.style.border = `2px dashed rgba(220, 38, 38, 0.4)`;
            rangeIndicator.style.boxShadow = `
                inset 0 0 0 ${tower.innerRange}px transparent,
                0 0 0 2px rgba(220, 38, 38, 0.2)
            `;
        }
        
        cellElement.appendChild(rangeIndicator);
        tower.rangeElement = rangeIndicator;
    }
    
    sellTower(x, y) {
        const cell = this.grid[y][x];
        const tower = cell.tower;
        if (!tower) return;
        
        // Cleanup laser beam if it exists
        if (tower.laserElement) {
            tower.laserElement.remove();
        }
        
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
        
        // Update range indicator
        if (tower.rangeElement) {
            const diameter = tower.range * 2;
            const centerX = this.cellSize / 2;
            const centerY = this.cellSize / 2;
            
            tower.rangeElement.style.width = `${diameter}px`;
            tower.rangeElement.style.height = `${diameter}px`;
            tower.rangeElement.style.left = `${centerX - tower.range}px`;
            tower.rangeElement.style.top = `${centerY - tower.range}px`;
        }
        
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
        
        const waveConfigs = this.waveConfigs[this.difficulty];
        let waveConfig;
        
        if (this.wave - 1 < waveConfigs.length) {
            // Use predefined wave config
            waveConfig = waveConfigs[this.wave - 1];
        } else {
            // Generate progressive wave beyond predefined configs
            const lastWave = waveConfigs[waveConfigs.length - 1];
            const waveMultiplier = 1 + (this.wave - waveConfigs.length) * 0.2; // 20% increase per extra wave
            
            waveConfig = {
                enemies: lastWave.enemies.map(enemyConfig => ({
                    type: enemyConfig.type,
                    count: Math.floor(enemyConfig.count * waveMultiplier)
                })),
                reward: Math.floor(lastWave.reward * waveMultiplier)
            };
        }
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
            
            // Update poisoned state
            enemy.element.classList.toggle('poisoned', enemy.poisoned);
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
            
            // Check poison state and apply damage
            if (enemy.poisoned && currentTime > enemy.poisonUntil) {
                enemy.poisoned = false;
            }
            if (enemy.poisoned && currentTime % 500 < 16) { // Apply poison damage every 500ms
                this.damageEnemy(enemy, enemy.poisonDamage, 'poison');
            }
            
            // Move enemy
            if (enemy.pathIndex < this.path.length - 1) {
                const target = this.path[enemy.pathIndex + 1];
                const targetX = target.x * this.cellSize + this.cellSize / 2;
                const targetY = target.y * this.cellSize + this.cellSize / 2;
                
                const dx = targetX - enemy.x;
                const dy = targetY - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const speed = this.gameSpeed === 0 ? 0 : (enemy.frozen ? enemy.speed * 0.3 : enemy.speed) * this.gameSpeed;
                
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
            // Find nearest enemy in range
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            this.enemies.forEach(enemy => {
                const distance = this.getDistance(tower, enemy);
                // Check if enemy is in range (consider donut shape for cannon towers)
                let inRange = distance <= tower.range;
                if (tower.innerRange) {
                    inRange = inRange && distance >= tower.innerRange;
                }
                
                if (inRange && distance < nearestDistance) {
                    nearestEnemy = enemy;
                    nearestDistance = distance;
                }
            });
            
            // Handle laser tower continuous beam
            if (tower.type === 'laser') {
                if (nearestEnemy && this.gameSpeed !== 0) {
                    if (currentTime - tower.lastFired >= tower.fireRate / this.gameSpeed) {
                        this.createLaserBeam(tower, nearestEnemy);
                        tower.lastFired = currentTime;
                    }
                    // Apply continuous damage
                    this.damageEnemy(nearestEnemy, tower.damage * 0.016 * this.gameSpeed, 'laser'); // 60fps timing
                } else {
                    // Remove laser beam if no target
                    if (tower.laserElement) {
                        tower.laserElement.remove();
                        tower.laserElement = null;
                    }
                }
            } else {
                // Handle other tower types
                if (this.gameSpeed === 0 || currentTime - tower.lastFired < tower.fireRate / this.gameSpeed) return;
                
                if (nearestEnemy) {
                    this.fireProjectile(tower, nearestEnemy);
                    tower.lastFired = currentTime;
                }
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
    
    createLaserBeam(tower, target) {
        // Remove existing laser beam
        if (tower.laserElement) {
            tower.laserElement.remove();
        }
        
        const laserElement = document.createElement('div');
        laserElement.className = 'laser-beam';
        
        const towerX = tower.x * this.cellSize + this.cellSize / 2;
        const towerY = tower.y * this.cellSize + this.cellSize / 2;
        
        const dx = target.x - towerX;
        const dy = target.y - towerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        laserElement.style.width = `${distance}px`;
        laserElement.style.height = '3px';
        laserElement.style.background = `linear-gradient(90deg, ${tower.color}, transparent)`;
        laserElement.style.left = `${towerX}px`;
        laserElement.style.top = `${towerY}px`;
        laserElement.style.transform = `rotate(${angle}deg)`;
        laserElement.style.transformOrigin = '0 50%';
        laserElement.style.position = 'absolute';
        laserElement.style.zIndex = '4';
        laserElement.style.boxShadow = `0 0 10px ${tower.color}`;
        
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.appendChild(laserElement);
        tower.laserElement = laserElement;
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
            
            if (this.gameSpeed === 0 || distance < projectile.speed * this.gameSpeed) {
                // Hit target
                this.damageEnemy(projectile.target, projectile.damage, projectile.type, projectile);
                this.createImpactEffect(projectile.x, projectile.y, projectile.type);
                this.removeProjectile(index);
            } else {
                // Move projectile
                projectile.x += (dx / distance) * projectile.speed * this.gameSpeed;
                projectile.y += (dy / distance) * projectile.speed * this.gameSpeed;
                this.updateProjectilePosition(projectile);
            }
        });
    }
    
    damageEnemy(enemy, damage, projectileType, projectile = null) {
        enemy.health -= damage;
        
        // Show damage text
        this.createDamageText(enemy.x, enemy.y, damage);
        
        // Apply freeze effect
        if (projectileType === 'freeze') {
            enemy.frozen = true;
            enemy.frozenUntil = Date.now() + 2000;
        }
        
        // Apply poison effect
        if (projectileType === 'poison' && !enemy.poisoned) {
            enemy.poisoned = true;
            enemy.poisonDamage = 3;
            enemy.poisonUntil = Date.now() + 4000;
        }
        
        // Apply area damage for cannon
        if (projectileType === 'cannon' && projectile) {
            this.applyAreaDamage(projectile.x, projectile.y, 60, 20);
        }
        
        // Track tower-specific kills (only count when enemy dies)
        if (enemy.health <= 0) {
            switch (projectileType) {
                case 'sniper':
                    this.achievementStats.sniperKills++;
                    this.checkAchievement('sniperElite', this.achievementStats.sniperKills >= 50);
                    break;
                case 'freeze':
                    this.achievementStats.freezeKills++;
                    this.checkAchievement('freezeChampion', this.achievementStats.freezeKills >= 30);
                    break;
                case 'rapid':
                    this.achievementStats.rapidKills++;
                    this.checkAchievement('rapidFire', this.achievementStats.rapidKills >= 100);
                    break;
            }
        }
        
        // Check if enemy is dead
        if (enemy.health <= 0) {
            this.gold += enemy.reward;
            this.score += enemy.reward * 2;
            this.createDeathEffect(enemy.x, enemy.y);
            
            // Track achievements
            this.achievementStats.enemiesKilled++;
            this.achievementStats.goldEarned += enemy.reward;
            
            // Check first blood
            this.checkAchievement('firstBlood', this.achievementStats.enemiesKilled >= 1);
            
            // Check rich king
            this.checkAchievement('richKing', this.achievementStats.goldEarned >= 500);
            
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
    
    createImpactEffect(x, y, projectileType = 'basic') {
        const color = this.towerTypes[projectileType].color;
        const particleCount = projectileType === 'cannon' ? 10 : 5;
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(x, y, color);
        }
    }
    
    applyAreaDamage(x, y, radius, damage) {
        this.enemies.forEach(enemy => {
            const distance = this.getDistance({ x, y }, enemy);
            if (distance <= radius && enemy !== this.projectiles.find(p => p.target === enemy)?.target) {
                this.damageEnemy(enemy, damage, 'cannon');
            }
        });
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
            
            // Track achievements
            this.achievementStats.wavesCompleted++;
            this.checkAchievement('waveSurvivor', this.achievementStats.wavesCompleted >= 5);
            this.checkAchievement('veteran', this.achievementStats.wavesCompleted >= 10);
            this.checkAchievement('legend', this.achievementStats.wavesCompleted >= 20);
            
            // Check speed demon achievement
            if (this.gameSpeed >= 2) {
                this.checkAchievement('speedDemon', true);
            }
            
            // Enable next wave button
            document.getElementById('start-wave-btn').disabled = false;
            document.getElementById('enemies-next').textContent = '0';
            
            // Auto-start next wave if enabled
            if (this.autoWaveEnabled) {
                setTimeout(() => {
                    if (this.autoWaveEnabled && !this.waveInProgress && this.gameState === 'playing') {
                        this.startWave();
                    }
                }, 2000); // 2 second delay between waves
            }
            
            this.updateUI();
        }
    }
    
    getDistance(obj1, obj2) {
        // Convert tower grid coordinates to pixel coordinates if needed
        const x1 = obj1.x < this.gridWidth ? obj1.x * this.cellSize + this.cellSize / 2 : obj1.x;
        const y1 = obj1.y < this.gridHeight ? obj1.y * this.cellSize + this.cellSize / 2 : obj1.y;
        const x2 = obj2.x < this.gridWidth ? obj2.x * this.cellSize + this.cellSize / 2 : obj2.x;
        const y2 = obj2.y < this.gridHeight ? obj2.y * this.cellSize + this.cellSize / 2 : obj2.y;
        
        const dx = x1 - x2;
        const dy = y1 - y2;
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
        this.health = 25;
        this.gold = 150;
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
