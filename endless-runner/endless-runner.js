class EndlessRunner {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('endlessRunnerBest') || '0');
        this.gameSpeed = 5;
        this.gravity = 0.8;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.speedMultiplier = 1;
        this.distance = 0;
        
        // Camera properties
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.cameraSmoothing = 0.1;
        this.maxCameraOffset = 150;
        
        // Speed limit properties
        this.maxSpeedMultiplier = 3.0; // Default max speed
        this.baseMaxSpeed = 3.0;
        
        // Player properties
        this.player = {
            x: 100,
            y: this.canvas.height - 100,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            jumpsRemaining: 2,
            maxJumps: 2,
            color: '#3b82f6',
            trail: []
        };
        
        // Ground properties
        this.ground = {
            y: this.canvas.height - 60,
            height: 60
        };
        
        // Obstacles array
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 120;
        this.baseObstacleInterval = 120;
        this.minObstacleInterval = 40;
        this.maxObstacleInterval = 120;
        
        // Aerial obstacles array
        this.aerialObstacles = [];
        this.aerialObstacleTimer = 0;
        this.aerialObstacleInterval = 180;
        
        // Ground platforms for aerial obstacles
        this.groundPlatforms = [];
        this.groundPlatformTimer = 0;
        this.groundPlatformInterval = 240;
        
        // Mountain platforms
        this.mountains = [];
        this.mountainTimer = 0;
        this.mountainInterval = 300;
        
        // Power-ups system
        this.powerUps = [];
        this.powerUpTimer = 0;
        this.basePowerUpInterval = 400;
        this.powerUpInterval = 400;
        
        // Power-up effects
        this.slowMotion = false;
        this.slowMotionDuration = 0;
        this.invincible = false;
        this.invincibleDuration = 0;
        
        // Shop system
        this.totalPoints = parseInt(localStorage.getItem('totalPoints') || '0');
        this.purchasedUpgrades = JSON.parse(localStorage.getItem('purchasedUpgrades') || '{}');
        this.shopItems = [
            { id: 'doubleJump', name: 'Double Jump', cost: 100, description: 'Start with double jump ability', purchased: false },
            { id: 'speedBoost', name: 'Speed Boost', cost: 150, description: '+10% permanent speed increase', purchased: false },
            { id: 'magnetPowerUp', name: 'Power-Up Magnet', cost: 200, description: 'Attract nearby power-ups', purchased: false },
            { id: 'extraLife', name: 'Extra Life', cost: 300, description: 'One-time respawn on death', purchased: false },
            { id: 'slowMotionPlus', name: 'Slow Motion+', cost: 250, description: 'Slow motion lasts 8 seconds instead of 5', purchased: false }
        ];
        
        // Ghost system
        this.ghostData = null;
        this.currentGhostRecording = [];
        this.bestRunData = JSON.parse(localStorage.getItem('bestRunData') || 'null');
        
        // Particles for effects
        this.particles = [];
        
        // Background elements
        this.clouds = [];
        this.backgroundElements = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.generateBackgroundElements();
        this.loadGhost();
        this.startGhostRecording();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Jump controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isGameOver) {
                e.preventDefault();
                this.jump();
            }
        });
        
        this.canvas.addEventListener('click', () => {
            if (!this.isGameOver) {
                this.jump();
            }
        });
        
        // Play again button
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficulty(e.target);
            });
        });
        
        // Shop button
        document.getElementById('shop-btn').addEventListener('click', () => {
            this.openShop();
        });
        
        // Close shop button
        document.getElementById('close-shop-btn').addEventListener('click', () => {
            this.closeShop();
        });
    }
    
    setDifficulty(btn) {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.gameSpeed = parseInt(btn.dataset.speed);
        this.gravity = parseFloat(btn.dataset.gravity);
        
        // Set speed limits based on difficulty
        const difficulty = btn.classList.contains('easy') ? 'easy' : 
                        btn.classList.contains('hard') ? 'hard' : 'medium';
        
        switch (difficulty) {
            case 'easy':
                this.maxSpeedMultiplier = 2.0;
                break;
            case 'medium':
                this.maxSpeedMultiplier = 3.0;
                break;
            case 'hard':
                this.maxSpeedMultiplier = 4.0;
                break;
        }
    }
    
    jump() {
        if (!this.isGameStarted) {
            this.isGameStarted = true;
            document.getElementById('instructions').style.display = 'none';
            document.getElementById('difficulty-selector').style.display = 'none';
            // Start ghost recording when game actually starts
            this.startGhostRecording();
        }
        
        if (this.player.jumpsRemaining > 0) {
            this.player.velocityY = -15;
            this.player.jumpsRemaining--;
            this.player.isJumping = true;
            this.createJumpParticles();
            
            // Create different colored particles for double jump
            if (this.player.jumpsRemaining === 0) {
                this.createDoubleJumpParticles();
            }
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -2 - 1,
                size: Math.random() * 4 + 2,
                color: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`,
                life: 1
            });
        }
    }
    
    createDoubleJumpParticles() {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * -3 - 2,
                size: Math.random() * 6 + 3,
                color: `hsl(${Math.random() * 60 + 280}, 80%, 65%)`,
                life: 1
            });
        }
    }
    
    generateBackgroundElements() {
        // Generate clouds
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 150 + 20,
                width: Math.random() * 60 + 40,
                height: Math.random() * 30 + 20,
                speed: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
        
        // Generate background mountains/hills
        for (let i = 0; i < 3; i++) {
            this.backgroundElements.push({
                x: i * 300,
                y: this.ground.y,
                width: 200,
                height: Math.random() * 100 + 50,
                color: `hsl(${Math.random() * 30 + 200}, 30%, 20%)`,
                speed: 0.3
            });
        }
    }
    
    updatePlayer() {
        // Apply gravity
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // Ground collision
        if (this.player.y + this.player.height >= this.ground.y) {
            this.player.y = this.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.jumpsRemaining = this.player.maxJumps;
        }
        
        // Update trail
        this.player.trail.push({
            x: this.player.x,
            y: this.player.y,
            opacity: 1
        });
        
        if (this.player.trail.length > 10) {
            this.player.trail.shift();
        }
        
        this.player.trail.forEach(point => {
            point.opacity *= 0.9;
        });
    }
    
    updateObstacles() {
        // Generate new ground obstacles
        if (this.isGameStarted && !this.isGameOver) {
            this.obstacleTimer++;
            
            if (this.obstacleTimer >= this.obstacleInterval) {
                this.spawnObstacle();
                this.obstacleTimer = 0;
                this.updateDynamicObstacleInterval();
            }
            
            // Generate aerial obstacles
            this.aerialObstacleTimer++;
            
            if (this.aerialObstacleTimer >= this.aerialObstacleInterval) {
                // Check if there's a ground platform nearby
                const hasNearbyPlatform = this.groundPlatforms.some(platform => 
                    Math.abs(platform.x - this.canvas.width) < 200
                );
                
                // Only spawn aerial obstacle if no platform nearby
                if (!hasNearbyPlatform) {
                    this.spawnAerialObstacle();
                }
                this.aerialObstacleTimer = 0;
            }
            
            // Generate ground platforms
            this.groundPlatformTimer++;
            
            if (this.groundPlatformTimer >= this.groundPlatformInterval) {
                this.spawnGroundPlatform();
                this.groundPlatformTimer = 0;
            }
            
            // Generate mountains
            this.mountainTimer++;
            
            if (this.mountainTimer >= this.mountainInterval) {
                this.spawnMountain();
                this.mountainTimer = 0;
            }
            
            // Generate power-ups
            this.powerUpTimer++;
            
            // Increase spawn rate based on survival time
            const survivalBonus = Math.floor(this.distance / 1000) * 50; // Faster spawning every 1000 distance
            this.powerUpInterval = Math.max(200, this.basePowerUpInterval - survivalBonus);
            
            if (this.powerUpTimer >= this.powerUpInterval) {
                this.spawnPowerUp();
                this.powerUpTimer = 0;
            }
        }
        
        // Update existing obstacles
        this.obstacles = this.obstacles.filter(obstacle => {
            const previousX = obstacle.x;
            obstacle.x -= this.gameSpeed * this.speedMultiplier;
            
            // Enhanced collision detection for high speeds
            // Use slightly smaller hitbox for better gameplay
            const playerHitbox = {
                x: this.player.x + 5,
                y: this.player.y + 5,
                width: this.player.width - 10,
                height: this.player.height - 10
            };
            
            // Check both current and previous positions to prevent tunneling
            if (!this.invincible && (this.checkCollision(playerHitbox, obstacle) || 
                this.checkTunnelingCollision(playerHitbox, obstacle, previousX))) {
                this.gameOver();
            }
            
            // Remove off-screen obstacles and add score
            if (obstacle.x + obstacle.width < 0) {
                this.score += 10;
                this.updateUI();
                return false;
            }
            
            return true;
        });
        
        // Update aerial obstacles
        this.aerialObstacles = this.aerialObstacles.filter(obstacle => {
            const previousX = obstacle.x;
            obstacle.x -= this.gameSpeed * this.speedMultiplier;
            
            // Check collision with player
            if (!this.invincible && (this.checkCollision(this.player, obstacle) || 
                this.checkTunnelingCollision(this.player, obstacle, previousX))) {
                this.gameOver();
            }
            
            // Remove off-screen obstacles
            return obstacle.x + obstacle.width > 0;
        });
        
        // Update ground platforms
        this.groundPlatforms = this.groundPlatforms.filter(platform => {
            platform.x -= this.gameSpeed * this.speedMultiplier;
            
            // Check collision with player (landing on platform)
            if (this.checkCollision(this.player, platform)) {
                // Player can land on top of platform
                if (this.player.velocityY > 0 && 
                    this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    this.player.jumpsRemaining = this.player.maxJumps;
                }
            }
            
            // Remove off-screen platforms
            return platform.x + platform.width > 0;
        });
        
        // Update mountains (landing only, no death)
        this.mountains = this.mountains.filter(mountain => {
            mountain.x -= this.gameSpeed * this.speedMultiplier;
            
            // Check collision with player (smooth mountain climbing)
            if (this.checkCollision(this.player, mountain)) {
                // Calculate player's relative position on mountain
                const playerRelativeX = this.player.x + this.player.width / 2 - mountain.x;
                const mountainWidth = mountain.width;
                const normalizedX = playerRelativeX / mountainWidth;
                
                // Calculate mountain height at player's position (triangle shape)
                const mountainPeakX = mountainWidth / 2;
                const distanceFromPeak = Math.abs(playerRelativeX - mountainPeakX);
                const maxDistance = mountainPeakX;
                const heightRatio = Math.max(0, 1 - (distanceFromPeak / maxDistance));
                const mountainHeightAtPlayer = mountain.y + (mountain.height * (1 - heightRatio));
                
                // Smooth climbing based on where player is on mountain
                if (this.player.velocityY >= 0) { // Falling or on ground
                    // Gradually adjust player to mountain surface
                    const targetY = mountainHeightAtPlayer - this.player.height;
                    const smoothing = 0.3;
                    this.player.y += (targetY - this.player.y) * smoothing;
                    
                    // Stop velocity when close to surface
                    if (Math.abs(this.player.y - targetY) < 2) {
                        this.player.velocityY = 0;
                        this.player.isJumping = false;
                        this.player.jumpsRemaining = this.player.maxJumps;
                    }
                }
                
                // Prevent player from going below mountain surface
                if (this.player.y + this.player.height > mountainHeightAtPlayer) {
                    this.player.y = mountainHeightAtPlayer - this.player.height;
                    this.player.velocityY = Math.min(this.player.velocityY, 0);
                }
            }
            
            // Remove off-screen mountains
            return mountain.x + mountain.width > 0;
        });
        
        // Update power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.x -= this.gameSpeed * this.speedMultiplier;
            powerUp.y += Math.sin(Date.now() * 0.002) * 0.5; // Floating animation
            
            // Check collision with player
            if (this.checkCollision(this.player, powerUp)) {
                this.activatePowerUp(powerUp);
                return false; // Remove collected power-up
            }
            
            // Remove off-screen power-ups
            return powerUp.x + powerUp.width > 0;
        });
        
        // Update power-up effects
        this.updatePowerUpEffects();
    }
    
    spawnObstacle() {
        const types = ['box', 'spike', 'tall'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let obstacle = {
            x: this.canvas.width,
            type: type,
            color: '#ef4444'
        };
        
        switch (type) {
            case 'box':
                obstacle.width = 30;
                obstacle.height = 45;
                obstacle.y = this.ground.y - obstacle.height;
                break;
            case 'spike':
                obstacle.width = 25;
                obstacle.height = 55;
                obstacle.y = this.ground.y - obstacle.height;
                break;
            case 'tall':
                obstacle.width = 20;
                obstacle.height = 80;
                obstacle.y = this.ground.y - obstacle.height;
                break;
        }
        
        // Check if obstacle would spawn in a mountain
        let safePosition = true;
        for (const mountain of this.mountains) {
            if (this.checkCollision(obstacle, mountain)) {
                safePosition = false;
                break;
            }
        }
        
        // Only add obstacle if it's in a safe position
        if (safePosition) {
            this.obstacles.push(obstacle);
        }
    }
    
    spawnAerialObstacle() {
        const types = ['floating', 'hanging'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let obstacle = {
            x: this.canvas.width,
            type: type,
            color: '#f59e0b'
        };
        
        // Calculate random height in the air
        const minHeight = 100; // Minimum height from ground
        const maxHeight = 250; // Maximum height from ground
        const randomHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        switch (type) {
            case 'floating':
                obstacle.width = 60;
                obstacle.height = 15;
                obstacle.y = this.ground.y - randomHeight;
                break;
            case 'hanging':
                obstacle.width = 40;
                obstacle.height = 30;
                obstacle.y = this.ground.y - randomHeight;
                break;
        }
        
        // Check if aerial obstacle would spawn in a mountain
        let safePosition = true;
        for (const mountain of this.mountains) {
            if (this.checkCollision(obstacle, mountain)) {
                safePosition = false;
                break;
            }
        }
        
        // Only add aerial obstacle if it's in a safe position
        if (safePosition) {
            this.aerialObstacles.push(obstacle);
        }
    }
    
    spawnGroundPlatform() {
        // Create a ground platform (safe zone) without aerial obstacles nearby
        const platformWidth = 80 + Math.random() * 40; // 80-120px wide
        const platformHeight = 15;
        
        // Ground platform only - safe zone
        const groundPlatform = {
            x: this.canvas.width,
            y: this.ground.y - platformHeight,
            width: platformWidth,
            height: platformHeight,
            type: 'ground-platform',
            color: '#10b981'
        };
        
        this.groundPlatforms.push(groundPlatform);
    }
    
    spawnMountain() {
        // Create large mountains that are part of level progression
        const mountainTypes = ['low', 'medium', 'high'];
        const type = mountainTypes[Math.floor(Math.random() * mountainTypes.length)];
        
        let mountain = {
            x: this.canvas.width,
            type: type,
            color: '#8b5cf6',
            isRequired: true // Player must go on these mountains
        };
        
        switch (type) {
            case 'low':
                mountain.width = 400;
                mountain.height = 200;
                mountain.y = this.ground.y - mountain.height; // Ground mountain
                break;
            case 'medium':
                mountain.width = 500;
                mountain.height = 300;
                mountain.y = this.ground.y - mountain.height; // Ground mountain
                break;
            case 'high':
                mountain.width = 600;
                mountain.height = 400;
                mountain.y = this.ground.y - mountain.height; // Ground mountain
                break;
        }
        
        this.mountains.push(mountain);
    }
    
    spawnPowerUp() {
        const types = ['slowMotion', 'invincibility'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let powerUp = {
            x: this.canvas.width,
            y: this.ground.y - 100 - Math.random() * 200, // Random height in air
            width: 30,
            height: 30,
            type: type,
            collected: false
        };
        
        // Find safe position that doesn't overlap with mountains
        let attempts = 0;
        let safePosition = false;
        
        while (!safePosition && attempts < 10) {
            safePosition = true;
            
            // Check collision with mountains
            for (const mountain of this.mountains) {
                if (this.checkCollision(powerUp, mountain)) {
                    safePosition = false;
                    // Try a new position
                    powerUp.y = this.ground.y - 100 - Math.random() * 200;
                    break;
                }
            }
            
            attempts++;
        }
        
        // Set color based on type
        switch (type) {
            case 'slowMotion':
                powerUp.color = '#3b82f6'; // Blue
                break;
            case 'invincibility':
                powerUp.color = '#fbbf24'; // Yellow
                break;
        }
        
        // Only add power-up if safe position found
        if (safePosition) {
            this.powerUps.push(powerUp);
        }
    }
    
    activatePowerUp(powerUp) {
        switch (powerUp.type) {
            case 'slowMotion':
                this.slowMotion = true;
                this.slowMotionDuration = 300; // 5 seconds at 60fps
                this.createPowerUpParticles(powerUp.x, powerUp.y, '#3b82f6');
                break;
            case 'invincibility':
                this.invincible = true;
                this.invincibleDuration = 300; // 5 seconds at 60fps
                this.createPowerUpParticles(powerUp.x, powerUp.y, '#fbbf24');
                break;
        }
        
        // Add score bonus for collecting power-up
        this.score += 50;
        this.updateUI();
    }
    
    updatePowerUpEffects() {
        // Update slow motion
        if (this.slowMotion) {
            this.slowMotionDuration--;
            if (this.slowMotionDuration <= 0) {
                this.slowMotion = false;
            }
        }
        
        // Update invincibility
        if (this.invincible) {
            this.invincibleDuration--;
            if (this.invincibleDuration <= 0) {
                this.invincible = false;
            }
        }
    }
    
    createPowerUpParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 6 + 2,
                color: color,
                life: 1
            });
        }
    }
    
    // Shop system methods
    purchaseItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return false;
        
        if (this.totalPoints >= item.cost && !this.purchasedUpgrades[itemId]) {
            this.totalPoints -= item.cost;
            this.purchasedUpgrades[itemId] = true;
            item.purchased = true;
            
            // Save to localStorage
            localStorage.setItem('totalPoints', this.totalPoints.toString());
            localStorage.setItem('purchasedUpgrades', JSON.stringify(this.purchasedUpgrades));
            
            // Apply upgrade effects
            this.applyUpgrade(itemId);
            
            this.updateUI();
            return true;
        }
        return false;
    }
    
    applyUpgrade(itemId) {
        switch (itemId) {
            case 'doubleJump':
                this.player.maxJumps = 2;
                break;
            case 'speedBoost':
                this.gameSpeed *= 1.1;
                break;
            case 'magnetPowerUp':
                // Applied in power-up collision
                break;
            case 'extraLife':
                this.player.hasExtraLife = true;
                break;
            case 'slowMotionPlus':
                // Applied when slow motion is activated
                break;
        }
    }
    
    addPoints(points) {
        this.totalPoints += points;
        localStorage.setItem('totalPoints', this.totalPoints.toString());
        this.updateUI();
    }
    
    // Ghost system methods
    startGhostRecording() {
        this.currentGhostRecording = [];
        this.recordingFrame = 0;
    }
    
    recordGhostFrame() {
        if (!this.isGameStarted || this.isGameOver) return;
        
        this.currentGhostRecording.push({
            frame: this.recordingFrame++,
            x: this.player.x,
            y: this.player.y,
            velocityY: this.player.velocityY,
            isJumping: this.player.isJumping
        });
    }
    
    saveBestRun() {
        // Only save if this is a new best score
        if (this.currentGhostRecording.length > 0 && this.score > this.bestScore) {
            this.bestRunData = {
                recording: this.currentGhostRecording,
                score: this.score,
                distance: this.distance,
                timestamp: Date.now()
            };
            localStorage.setItem('bestRunData', JSON.stringify(this.bestRunData));
        }
    }
    
    loadGhost() {
        if (this.bestRunData) {
            this.ghostData = {
                ...this.bestRunData,
                currentFrame: 0
            };
        }
    }
    
    updateGhost() {
        if (!this.ghostData || !this.isGameStarted) return;
        
        const recording = this.ghostData.recording;
        if (this.ghostData.currentFrame < recording.length) {
            const frame = recording[this.ghostData.currentFrame];
            this.ghostData.x = frame.x;
            this.ghostData.y = frame.y;
            this.ghostData.currentFrame++;
        }
    }
    
    // Shop UI methods
    openShop() {
        this.renderShopItems();
        document.getElementById('shop-overlay').classList.add('show');
    }
    
    closeShop() {
        document.getElementById('shop-overlay').classList.remove('show');
    }
    
    renderShopItems() {
        const shopContainer = document.getElementById('shop-items');
        shopContainer.innerHTML = '';
        
        this.shopItems.forEach(item => {
            const isPurchased = this.purchasedUpgrades[item.id];
            const canAfford = this.totalPoints >= item.cost;
            
            const shopItem = document.createElement('div');
            shopItem.className = `shop-item ${isPurchased ? 'purchased' : ''} ${!canAfford && !isPurchased ? 'cant-afford' : ''}`;
            
            shopItem.innerHTML = `
                <div class="shop-item-info">
                    <h3 class="shop-item-name">${item.name}</h3>
                    <p class="shop-item-description">${item.description}</p>
                    <div class="shop-item-cost">${isPurchased ? '✅ Purchased' : `${item.cost} Points`}</div>
                </div>
                <button class="shop-item-btn" 
                        data-item-id="${item.id}" 
                        ${isPurchased || !canAfford ? 'disabled' : ''}>
                    ${isPurchased ? 'Owned' : 'Buy'}
                </button>
            `;
            
            if (!isPurchased && canAfford) {
                shopItem.querySelector('.shop-item-btn').addEventListener('click', () => {
                    this.purchaseItem(item.id);
                    this.renderShopItems(); // Refresh shop display
                });
            }
            
            shopContainer.appendChild(shopItem);
        });
    }
    
    updateDynamicObstacleInterval() {
        // Calculate spacing based on distance traveled
        // Start at max interval, decrease to min interval as distance increases
        const distanceProgress = Math.min(this.distance / 2000, 1); // Full difficulty at 2000 distance
        const currentInterval = this.maxObstacleInterval - (this.maxObstacleInterval - this.minObstacleInterval) * distanceProgress;
        
        // Add some randomness to make it less predictable
        const randomVariation = Math.random() * 40 - 20; // ±20 frames variation
        this.obstacleInterval = Math.max(this.minObstacleInterval, Math.min(this.maxObstacleInterval, currentInterval + randomVariation));
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkTunnelingCollision(player, obstacle, previousX) {
        // Check if the obstacle moved through the player's space during this frame
        // This prevents tunneling at high speeds
        
        // Get the movement range of the obstacle this frame
        const minX = Math.min(previousX, obstacle.x);
        const maxX = Math.max(previousX, obstacle.x);
        
        // Check if player's horizontal range overlaps with obstacle's movement range
        const horizontalOverlap = player.x < maxX && player.x + player.width > minX;
        
        if (!horizontalOverlap) return false;
        
        // If there's horizontal overlap, check vertical collision
        return player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
    checkMountainWallCollision(mountain) {
        // Check if player is trying to go through the mountain (ground mountains)
        const playerRight = this.player.x + this.player.width;
        const playerBottom = this.player.y + this.player.height;
        const mountainRight = mountain.x + mountain.width;
        const mountainBottom = mountain.y + mountain.height;
        
        // Check if player is horizontally aligned with mountain
        const horizontalOverlap = playerRight > mountain.x && this.player.x < mountainRight;
        
        if (!horizontalOverlap) return false;
        
        // For ground mountains, check if player is trying to pass through the mountain body
        const inMountainBody = playerBottom > mountain.y && this.player.y < mountainBottom;
        
        // If player is in the mountain body, it's a collision (must go over)
        if (inMountainBody) {
            return true;
        }
        
        return false;
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // Gravity
            particle.life -= 0.02;
            
            return particle.life > 0;
        });
    }
    
    updateBackgroundElements() {
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= this.gameSpeed * this.speedMultiplier * 0.3; // Parallax effect
            
            // Reset cloud position when it goes off screen
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
                cloud.y = Math.random() * 150; // Random height
            }
        });
        
        // Update background elements
        this.backgroundElements.forEach(element => {
            element.x -= this.gameSpeed * this.speedMultiplier * 0.2; // Slower parallax
            
            // Reset element position when it goes off screen
            if (element.x + element.width < 0) {
                element.x = this.canvas.width;
                element.y = this.ground.y - element.height;
            }
        });
    }
    
    updateBackground() {
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed * this.speedMultiplier;
            
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
                cloud.y = Math.random() * 150 + 20;
            }
        });
        
        // Update background elements
        this.backgroundElements.forEach(element => {
            element.x -= element.speed * this.speedMultiplier;
            
            if (element.x + element.width < 0) {
                element.x = this.canvas.width;
                element.height = Math.random() * 100 + 50;
            }
        });
    }
    
    updateGameSpeed() {
        if (this.isGameStarted && !this.isGameOver) {
            const actualSpeedMultiplier = this.slowMotion ? this.speedMultiplier * 0.3 : this.speedMultiplier;
            this.distance += this.gameSpeed * actualSpeedMultiplier;
            this.speedMultiplier = 1 + Math.floor(this.distance / 500) * 0.2;
            
            // Apply speed limit based on difficulty
            this.speedMultiplier = Math.min(this.speedMultiplier, this.maxSpeedMultiplier);
            
            // Update speed display
            const displaySpeed = this.slowMotion ? `${(actualSpeedMultiplier).toFixed(1)}x (SLOW)` : `${actualSpeedMultiplier.toFixed(1)}x`;
            document.getElementById('speed').textContent = `Speed: ${displaySpeed}`;
        }
    }
    
    updateCamera() {
        // Calculate target camera position based on player position
        const playerTop = this.player.y;
        const screenTop = 100; // Start moving camera when player gets this high
        
        if (playerTop < screenTop) {
            // Player is above the trigger point, move camera up
            const offsetAmount = screenTop - playerTop;
            this.targetCameraY = Math.min(offsetAmount, this.maxCameraOffset);
        } else {
            // Player is below trigger point, return camera to normal
            this.targetCameraY = 0;
        }
        
        // Smooth camera movement
        this.cameraY += (this.targetCameraY - this.cameraY) * this.cameraSmoothing;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e293b');
        gradient.addColorStop(1, '#334155');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background elements
        this.drawBackground();
        
        // Draw ground
        this.drawGround();
        
        // Draw particles
        this.drawParticles();
        
        // Draw player trail
        this.drawPlayerTrail();
        
        // Draw player
        this.drawPlayer();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw aerial obstacles
        this.drawAerialObstacles();
        
        // Draw ground platforms
        this.drawGroundPlatforms();
        
        // Draw mountains
        this.drawMountains();
        
        // Draw power-ups
        this.drawPowerUps();
        
        // Draw ghost
        this.drawGhost();
        
        // Draw game over overlay
        if (this.isGameOver) {
            this.drawGameOverOverlay();
        }
    }
    
    drawBackground() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY * 0.3); // Parallax effect for background
        
        // Draw clouds
        this.clouds.forEach(cloud => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            this.ctx.beginPath();
            this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw background mountains
        this.backgroundElements.forEach(element => {
            this.ctx.fillStyle = element.color;
            this.ctx.beginPath();
            this.ctx.moveTo(element.x, this.ground.y);
            this.ctx.lineTo(element.x + element.width / 2, this.ground.y - element.height);
            this.ctx.lineTo(element.x + element.width, this.ground.y);
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    drawGround() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        // Main ground
        const groundGradient = this.ctx.createLinearGradient(0, this.ground.y, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#475569');
        groundGradient.addColorStop(1, '#1e293b');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // Ground line
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.ground.y);
        this.ctx.lineTo(this.canvas.width, this.ground.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        // Player shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.ellipse(
            this.player.x + this.player.width / 2,
            this.ground.y + 5,
            this.player.width / 2,
            5,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Player body with gradient
        const playerGradient = this.ctx.createLinearGradient(
            this.player.x, this.player.y,
            this.player.x, this.player.y + this.player.height
        );
        playerGradient.addColorStop(0, '#60a5fa');
        playerGradient.addColorStop(1, '#3b82f6');
        
        this.ctx.fillStyle = playerGradient;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Player highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 5, 10, 10);
        
        this.ctx.restore();
    }
    
    drawPlayerTrail() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        this.player.trail.forEach((point, index) => {
            this.ctx.fillStyle = `rgba(96, 165, 250, ${point.opacity * 0.3})`;
            const size = this.player.width * (index / this.player.trail.length);
            this.ctx.fillRect(
                point.x + (this.player.width - size) / 2,
                point.y + (this.player.height - size) / 2,
                size,
                size
            );
        });
        
        this.ctx.restore();
    }
    
    drawObstacles() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        this.obstacles.forEach(obstacle => {
            // Obstacle shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(
                obstacle.x - 2,
                this.ground.y + 2,
                obstacle.width,
                5
            );
            
            // Draw obstacle based on type
            const obstacleGradient = this.ctx.createLinearGradient(
                obstacle.x, obstacle.y,
                obstacle.x, obstacle.y + obstacle.height
            );
            obstacleGradient.addColorStop(0, '#f87171');
            obstacleGradient.addColorStop(1, '#ef4444');
            
            this.ctx.fillStyle = obstacleGradient;
            
            switch (obstacle.type) {
                case 'box':
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                    break;
                case 'spike':
                    this.ctx.beginPath();
                    this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                    this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                    this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                case 'tall':
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                    break;
            }
            
            // Obstacle highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(obstacle.x + 2, obstacle.y + 2, 8, 8);
        });
        
        this.ctx.restore();
    }
    
    drawAerialObstacles() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        this.aerialObstacles.forEach(obstacle => {
            // Draw obstacle based on type
            const obstacleGradient = this.ctx.createLinearGradient(
                obstacle.x, obstacle.y,
                obstacle.x, obstacle.y + obstacle.height
            );
            obstacleGradient.addColorStop(0, '#fbbf24');
            obstacleGradient.addColorStop(1, '#f59e0b');
            
            this.ctx.fillStyle = obstacleGradient;
            
            switch (obstacle.type) {
                case 'floating':
                    // Draw flat platform with rounded edges
                    this.ctx.beginPath();
                    this.ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 5);
                    this.ctx.fill();
                    
                    // Add highlight
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(obstacle.x + 5, obstacle.y + 2, obstacle.width - 10, 3);
                    break;
                    
                case 'hanging':
                    // Draw hanging obstacle with flat bottom
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                    
                    // Add spike-like bottom edge
                    this.ctx.beginPath();
                    this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                    this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height + 10);
                    this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    // Add highlight
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.fillRect(obstacle.x + 3, obstacle.y + 3, 8, 8);
                    break;
            }
            
            // Add shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(obstacle.x - 2, obstacle.y + obstacle.height + 2, obstacle.width + 4, 3);
        });
        
        this.ctx.restore();
    }
    
    drawGroundPlatforms() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        this.groundPlatforms.forEach(platform => {
            // Draw platform with gradient
            const platformGradient = this.ctx.createLinearGradient(
                platform.x, platform.y,
                platform.x, platform.y + platform.height
            );
            platformGradient.addColorStop(0, '#34d399');
            platformGradient.addColorStop(1, '#10b981');
            
            this.ctx.fillStyle = platformGradient;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Add highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(platform.x + 5, platform.y + 2, platform.width - 10, 3);
            
            // Add shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(platform.x - 2, platform.y + platform.height + 2, platform.width + 4, 3);
        });
        
        this.ctx.restore();
    }
    
    drawMountains() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        this.mountains.forEach(mountain => {
            // Draw mountain with gradient
            const mountainGradient = this.ctx.createLinearGradient(
                mountain.x, mountain.y,
                mountain.x, mountain.y + mountain.height
            );
            mountainGradient.addColorStop(0, '#a78bfa');
            mountainGradient.addColorStop(1, '#8b5cf6');
            
            // Draw main mountain body
            this.ctx.fillStyle = mountainGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(mountain.x, mountain.y + mountain.height);
            this.ctx.lineTo(mountain.x + mountain.width / 2, mountain.y);
            this.ctx.lineTo(mountain.x + mountain.width, mountain.y + mountain.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add snow cap for high mountains
            if (mountain.type === 'high') {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(mountain.x + mountain.width / 2 - 20, mountain.y + 15);
                this.ctx.lineTo(mountain.x + mountain.width / 2, mountain.y);
                this.ctx.lineTo(mountain.x + mountain.width / 2 + 20, mountain.y + 15);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            // Add highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(mountain.x + 10, mountain.y + 5, 15, 8);
            
            // Add shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(mountain.x - 3, mountain.y + mountain.height + 2, mountain.width + 6, 4);
        });
        
        this.ctx.restore();
    }
    
    drawPowerUps() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        this.powerUps.forEach(powerUp => {
            // Draw power-up with glow effect
            const glowSize = 5 + Math.sin(Date.now() * 0.005) * 2;
            
            // Draw glow
            this.ctx.shadowColor = powerUp.color;
            this.ctx.shadowBlur = glowSize;
            
            // Draw power-up circle
            this.ctx.fillStyle = powerUp.color;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw icon based on type
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            switch (powerUp.type) {
                case 'slowMotion':
                    this.ctx.fillText('S', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
                    break;
                case 'invincibility':
                    this.ctx.fillText('I', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
                    break;
            }
            
            this.ctx.shadowBlur = 0;
        });
        
        this.ctx.restore();
    }
    
    drawParticles() {
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
        this.ctx.globalAlpha = 1;
    }
    
    gameOver() {
        this.isGameOver = true;
        this.isGameStarted = false;
        
        // Save best run for ghost
        this.saveBestRun();
        
        // Add points to total (10% of score as points)
        const pointsEarned = Math.floor(this.score * 0.1);
        this.addPoints(pointsEarned);
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('endlessRunnerBest', this.bestScore.toString());
            document.getElementById('new-best').classList.add('show');
        } else {
            document.getElementById('new-best').classList.remove('show');
        }
        
        this.updateUI();
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('points-earned').textContent = `Points Earned: ${pointsEarned}`;
        
        // Show the game over overlay
        document.getElementById('game-over-overlay').classList.add('show');
    }
    
    drawGameOverOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Outfit';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        
        if (this.score > this.bestScore) {
            this.ctx.fillStyle = '#10b981';
            this.ctx.fillText('NEW BEST!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();
    }
    
    drawGhost() {
        if (!this.ghostData) return;
        
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        // Draw ghost as a distinct purple circle with glow effect
        const ghostX = this.ghostData.x + this.player.width / 2;
        const ghostY = this.ghostData.y + this.player.height / 2;
        
        // Add glow effect
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(147, 51, 234, 0.8)';
        
        // Draw ghost as a circle instead of rectangle
        this.ctx.fillStyle = 'rgba(147, 51, 234, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(ghostX, ghostY, this.player.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add inner circle for more distinction
        this.ctx.fillStyle = 'rgba(196, 181, 253, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(ghostX, ghostY, this.player.width / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add ghost label with better styling
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillStyle = '#9333ea';
        this.ctx.font = 'bold 10px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GHOST', ghostX, this.ghostData.y - 8);
        
        this.ctx.restore();
    }
    
    drawParticles() {
    this.ctx.save();
    this.ctx.translate(0, this.cameraY);
    
    this.particles.forEach(particle => {
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.life;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
    });
        
    this.ctx.restore();
    this.ctx.globalAlpha = 1;
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = `Best: ${this.bestScore}`;
        document.getElementById('total-points').textContent = this.totalPoints;
        document.getElementById('shop-points').textContent = this.totalPoints;
    }
    
    resetGame() {
        // Hide the game over overlay
        document.getElementById('game-over-overlay').classList.remove('show');
        
        // Reset game state
        this.isGameOver = false;
        this.isGameStarted = false;
        this.score = 0;
        this.speedMultiplier = 1;
        this.distance = 0;
        this.obstacleTimer = 0;
        this.aerialObstacleTimer = 0;
        this.groundPlatformTimer = 0;
        this.mountainTimer = 0;
        this.powerUpTimer = 0;
        
        // Clear arrays
        this.obstacles = [];
        this.aerialObstacles = [];
        this.groundPlatforms = [];
        this.mountains = [];
        this.powerUps = [];
        this.particles = [];
        
        // Reset player position
        this.player.y = this.canvas.height - 100;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.jumpsRemaining = this.player.maxJumps;
        this.player.trail = [];
        
        // Reset power-up effects
        this.slowMotion = false;
        this.slowMotionDuration = 0;
        this.invincible = false;
        this.invincibleDuration = 0;
        
        // Reset camera
        this.cameraY = 0;
        this.targetCameraY = 0;
        
        // Restart ghost recording
        this.startGhostRecording();
        
        // Update UI
        this.updateUI();
        
        // Show instructions and difficulty selector
        document.getElementById('instructions').style.display = 'block';
        document.getElementById('difficulty-selector').style.display = 'block';
    }
    
    gameLoop() {
        if (!this.isGameOver) {
            this.updateGameSpeed();
            this.updatePlayer();
            this.updateObstacles();
            this.updateCamera();
            this.updateParticles();
            this.updateBackgroundElements();
            this.updateGhost();
            this.recordGhostFrame();
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new EndlessRunner();
});
