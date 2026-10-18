const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game constants
const FALL_SPEED = 2;
const PLAYER_SPEED = 5;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_HEIGHT = 15;
const PLAYER_SIZE = 30;

// Game state
let player = {
    x: canvas.width / 2 - PLAYER_SIZE / 2,
    y: 50,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    velocityX: 0
};

let obstacles = [];
let safeZones = [];
let particles = [];
let score = 0;
let bestScore = parseInt(localStorage.getItem('reverseDoodleJumpBestScore')) || 0;
let gameOver = false;
let keys = {
    left: false,
    right: false
};
let checkpointScore = 0;
let hasCheckpoint = false;
let checkpointObstacles = [];

// Initialize game
function init() {
    player = {
        x: canvas.width / 2 - PLAYER_SIZE / 2,
        y: 50,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        velocityX: 0
    };

    obstacles = [];
    safeZones = [];
    particles = [];
    score = 0;
    gameOver = false;
    checkpointScore = 0;
    hasCheckpoint = false;
    checkpointObstacles = [];

    // Create initial obstacles with safe zone at top
    const obstacleCount = 10;
    const spacing = canvas.height / obstacleCount;
    const safeZone = 200; // Safe zone at top

    for (let i = 0; i < obstacleCount; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - OBSTACLE_WIDTH),
            y: safeZone + i * spacing,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
            type: 'static'
        });
    }

    // Add initial safe zone at start
    safeZones.push({
        x: 0,
        y: 0,
        width: canvas.width,
        height: 150,
        isCheckpoint: true
    });

    document.getElementById('score').textContent = score;
    document.getElementById('best-score').textContent = `Best: ${bestScore}`;
    document.getElementById('game-over-overlay').classList.remove('active');
    document.getElementById('instructions-overlay').classList.remove('active');
    document.getElementById('new-best').classList.remove('show');

    // Cancel any existing game loop
    if (window.currentGameLoop) {
        cancelAnimationFrame(window.currentGameLoop);
    }

    gameLoop();
}

// Generate new obstacle
function generateObstacle(y) {
    const types = ['static', 'static', 'static', 'moving', 'large'];
    const type = types[Math.floor(Math.random() * types.length)];

    let width = OBSTACLE_WIDTH;
    let height = OBSTACLE_HEIGHT;

    if (type === 'large') {
        width = OBSTACLE_WIDTH * 1.5;
        height = OBSTACLE_HEIGHT * 1.5;
    }

    return {
        x: Math.random() * (canvas.width - width),
        y: y,
        width: width,
        height: height,
        type: type,
        direction: Math.random() > 0.5 ? 1 : -1
    };
}

// Generate safe zone
function generateSafeZone(y) {
    return {
        x: 0,
        y: y,
        width: canvas.width,
        height: 150,
        isCheckpoint: true
    };
}

// Create hit particles
function createHitParticles(x, y, width, height) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x + Math.random() * width,
            y: y + Math.random() * height,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 8 + 4,
            color: '#ef4444',
            life: 1
        });
    }
}

// Draw player
function drawPlayer() {
    ctx.save();

    // Body
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 5, player.y + player.height / 2 - 3, 4, 0, Math.PI * 2);
    ctx.arc(player.x + player.width / 2 + 5, player.y + player.height / 2 - 3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 5 + player.velocityX * 0.5, player.y + player.height / 2 - 3, 2, 0, Math.PI * 2);
    ctx.arc(player.x + player.width / 2 + 5 + player.velocityX * 0.5, player.y + player.height / 2 - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2 + 5, 5, Math.PI, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

// Draw obstacle
function drawObstacle(obstacle) {
    ctx.save();

    let color;
    switch (obstacle.type) {
        case 'moving':
            color = '#f59e0b';
            break;
        case 'large':
            color = '#a855f7';
            break;
        default:
            color = '#ef4444';
    }

    ctx.fillStyle = color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    // Obstacle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    // Warning pattern on obstacles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < obstacle.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(obstacle.x + i, obstacle.y);
        ctx.lineTo(obstacle.x + i + 10, obstacle.y);
        ctx.lineTo(obstacle.x + i, obstacle.y + 10);
        ctx.fill();
    }

    ctx.restore();
}

// Draw safe zone
function drawSafeZone(safeZone) {
    ctx.save();

    // Gradient background for safe zone
    const gradient = ctx.createLinearGradient(0, safeZone.y, 0, safeZone.y + safeZone.height);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)');

    ctx.fillStyle = gradient;
    ctx.fillRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);

    // Border
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);

    // Checkpoint star
    if (safeZone.isCheckpoint) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐ SAFE ZONE ⭐', canvas.width / 2, safeZone.y + safeZone.height / 2);
    }

    ctx.restore();
}

// Draw particles
function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        ctx.restore();

        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3;
        particle.life -= 0.03;

        // Remove dead particles
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Update game
function update() {
    if (gameOver) return;

    // Apply constant fall
    player.y += FALL_SPEED;

    // Handle horizontal movement
    if (keys.left) {
        player.velocityX = -PLAYER_SPEED;
    } else if (keys.right) {
        player.velocityX = PLAYER_SPEED;
    } else {
        player.velocityX *= 0.9;
    }

    player.x += player.velocityX;

    // Screen wrapping
    if (player.x + player.width < 0) {
        player.x = canvas.width;
    } else if (player.x > canvas.width) {
        player.x = -player.width;
    }

    // Check if player is in safe zone
    let inSafeZone = false;
    safeZones.forEach(safeZone => {
        if (player.x + player.width > safeZone.x &&
            player.x < safeZone.x + safeZone.width &&
            player.y + player.height > safeZone.y &&
            player.y < safeZone.y + safeZone.height) {
            inSafeZone = true;

            // Save checkpoint if this is a checkpoint zone
            if (safeZone.isCheckpoint && score > checkpointScore + 200) {
                checkpointScore = score;
                hasCheckpoint = true;
                // Save current obstacles state
                checkpointObstacles = obstacles.map(o => ({
                    x: o.x,
                    y: o.y,
                    width: o.width,
                    height: o.height,
                    type: o.type,
                    direction: o.direction
                }));
                // Flash effect
                document.getElementById('score').style.color = '#fbbf24';
                setTimeout(() => {
                    document.getElementById('score').style.color = '#f59e0b';
                }, 300);
            }
        }
    });

    // Check obstacle collisions (only if not in safe zone)
    if (!inSafeZone) {
        obstacles.forEach(obstacle => {
            if (player.x + player.width > obstacle.x &&
                player.x < obstacle.x + obstacle.width &&
                player.y + player.height > obstacle.y &&
                player.y < obstacle.y + obstacle.height) {

                // Game over - hit obstacle
                createHitParticles(player.x, player.y, player.width, player.height);
                endGame();
            }
        });
    }

    // Move moving obstacles
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'moving') {
            obstacle.x += obstacle.direction * 2;

            if (obstacle.x <= 0 || obstacle.x + obstacle.width >= canvas.width) {
                obstacle.direction *= -1;
            }
        }
    });

    // Scroll screen when player goes down
    if (player.y > canvas.height / 2) {
        const scrollAmount = player.y - canvas.height / 2;
        player.y = canvas.height / 2;

        obstacles.forEach(obstacle => {
            obstacle.y -= scrollAmount;
        });

        safeZones.forEach(safeZone => {
            safeZone.y -= scrollAmount;
        });

        // Update score
        score += Math.floor(scrollAmount);
        document.getElementById('score').textContent = score;

        // Remove obstacles above screen and add new ones below
        obstacles = obstacles.filter(o => o.y > -50);

        while (obstacles.length < 10) {
            const lowestObstacle = obstacles.reduce((lowest, o) => o.y > lowest.y ? o : lowest, obstacles[0]);
            const newY = lowestObstacle.y + 60 + Math.random() * 40;
            const newObstacle = generateObstacle(newY);

            // Ensure obstacle doesn't spawn where player is
            if (!(newObstacle.x < player.x + player.width &&
                  newObstacle.x + newObstacle.width > player.x &&
                  newObstacle.y < player.y + player.height &&
                  newObstacle.y + newObstacle.height > player.y)) {
                obstacles.push(newObstacle);
            }
        }

        // Add safe zones periodically (every 2500 points)
        if (score > 0 && score % 2500 < scrollAmount && safeZones.length < 2) {
            const lowestObstacle = obstacles.reduce((lowest, o) => o.y > lowest.y ? o : lowest, obstacles[0]);
            safeZones.push(generateSafeZone(lowestObstacle.y + 200));
        }

        // Remove safe zones above screen
        safeZones = safeZones.filter(z => z.y > -200);
    }

    // Game over check if player goes off top
    if (player.y < -player.height) {
        endGame();
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw safe zones
    safeZones.forEach(drawSafeZone);

    // Draw obstacles
    obstacles.forEach(drawObstacle);

    // Draw particles
    drawParticles();

    // Draw player
    drawPlayer();

    // Draw checkpoint indicator
    if (hasCheckpoint && checkpointScore > 0) {
        ctx.save();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px Outfit';
        ctx.textAlign = 'right';
        ctx.fillText(`Checkpoint: ${checkpointScore}`, canvas.width - 10, 25);
        ctx.restore();
    }
}

// Game loop
function gameLoop() {
    if (gameOver) return;

    update();
    draw();
    window.currentGameLoop = requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    // Check if we have a checkpoint and can respawn
    if (hasCheckpoint && score > checkpointScore + 200) {
        // Respawn at checkpoint
        player.y = 50;
        player.x = canvas.width / 2 - PLAYER_SIZE / 2;
        score = checkpointScore;
        document.getElementById('score').textContent = score;

        // Restore checkpoint obstacles and shift them to be visible
        if (checkpointObstacles.length > 0) {
            // Find the lowest obstacle in the saved state
            const lowestObstacle = checkpointObstacles.reduce((lowest, o) => o.y > lowest.y ? o : lowest, checkpointObstacles[0]);
            const shiftAmount = 250 - lowestObstacle.y;

            obstacles = checkpointObstacles.map(o => ({
                ...o,
                y: o.y + shiftAmount
            }));

            // Reset safe zones to start
            safeZones = [{
                x: 0,
                y: 0,
                width: canvas.width,
                height: 150,
                isCheckpoint: true
            }];
        } else {
            // Fallback if no saved obstacles
            obstacles = [];
            const obstacleCount = 10;
            const spacing = canvas.height / obstacleCount;
            const safeZone = 200;

            for (let i = 0; i < obstacleCount; i++) {
                obstacles.push({
                    x: Math.random() * (canvas.width - OBSTACLE_WIDTH),
                    y: safeZone + i * spacing,
                    width: OBSTACLE_WIDTH,
                    height: OBSTACLE_HEIGHT,
                    type: 'static',
                    direction: Math.random() > 0.5 ? 1 : -1
                });
            }

            safeZones = [{
                x: 0,
                y: 0,
                width: canvas.width,
                height: 150,
                isCheckpoint: true
            }];
        }

        // Show checkpoint respawn message
        const instructions = document.getElementById('instructions');
        instructions.textContent = 'Respawned at Checkpoint!';
        instructions.style.color = '#fbbf24';
        setTimeout(() => {
            instructions.textContent = 'Use Left/Right Arrow Keys or A/D to Move';
            instructions.style.color = 'rgba(255, 255, 255, 0.8)';
        }, 2000);

        return;
    }

    gameOver = true;

    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-overlay').classList.add('active');

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('reverseDoodleJumpBestScore', bestScore);
        document.getElementById('best-score').textContent = `Best: ${bestScore}`;
        document.getElementById('new-best').classList.add('show');
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
    }
});

// Mobile controls
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

btnLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.left = true;
});

btnLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.left = false;
});

btnRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.right = true;
});

btnRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.right = false;
});

// Play again button
document.getElementById('play-again-btn').addEventListener('click', init);

// Start button
document.getElementById('start-btn').addEventListener('click', init);

// Draw initial state
function drawInitialState() {
    // Initialize player position for display
    player = {
        x: canvas.width / 2 - PLAYER_SIZE / 2,
        y: 50,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        velocityX: 0
    };

    // Create initial obstacles for display with safe zone
    const obstacleCount = 10;
    const spacing = canvas.height / obstacleCount;
    const safeZone = 200; // Safe zone at top

    for (let i = 0; i < obstacleCount; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - OBSTACLE_WIDTH),
            y: safeZone + i * spacing,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
            type: 'static'
        });
    }

    // Add initial safe zone at start
    safeZones = [{
        x: 0,
        y: 0,
        width: canvas.width,
        height: 150,
        isCheckpoint: true
    }];

    draw();
}

drawInitialState();
