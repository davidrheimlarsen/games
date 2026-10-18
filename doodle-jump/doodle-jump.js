const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.4;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;
const PLATFORM_WIDTH = 60;
const PLATFORM_HEIGHT = 15;
const PLAYER_SIZE = 30;

// Game state
let player = {
    x: canvas.width / 2 - PLAYER_SIZE / 2,
    y: canvas.height - 100,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    velocityY: 0,
    velocityX: 0
};

let platforms = [];
let particles = [];
let score = 0;
let bestScore = parseInt(localStorage.getItem('doodleJumpBestScore')) || 0;
let gameOver = false;
let keys = {
    left: false,
    right: false
};
let checkpointScore = 0;
let hasCheckpoint = false;
let checkpointPlatforms = [];

// Initialize game
function init() {
    player = {
        x: canvas.width / 2 - PLAYER_SIZE / 2,
        y: canvas.height - 100,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        velocityY: 0,
        velocityX: 0
    };
    
    platforms = [];
    particles = [];
    score = 0;
    gameOver = false;
    checkpointScore = 0;
    hasCheckpoint = false;
    checkpointPlatforms = [];
    
    // Create initial platforms
    const platformCount = 10;
    const spacing = canvas.height / platformCount;
    
    for (let i = 0; i < platformCount; i++) {
        platforms.push({
            x: Math.random() * (canvas.width - PLATFORM_WIDTH),
            y: canvas.height - 50 - i * spacing,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: 'normal'
        });
    }
    
    // Ensure first platform is under player
    platforms[0].x = canvas.width / 2 - PLATFORM_WIDTH / 2;
    platforms[0].y = canvas.height - 50;
    
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

// Generate new platform
function generatePlatform(y) {
    const types = ['normal', 'normal', 'normal', 'moving', 'breakable', 'checkpoint'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
        x: Math.random() * (canvas.width - PLATFORM_WIDTH),
        y: y,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: type,
        direction: Math.random() > 0.5 ? 1 : -1,
        broken: false,
        breaking: false,
        breakProgress: 0
    };
}

// Create break particles
function createBreakParticles(x, y, width, height) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x + Math.random() * width,
            y: y + Math.random() * height,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
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
    ctx.fillStyle = '#10b981';
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
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2 + 5, 5, 0, Math.PI);
    ctx.stroke();
    
    ctx.restore();
}

// Draw platform
function drawPlatform(platform) {
    if (platform.broken) return;
    
    ctx.save();
    
    let color;
    switch (platform.type) {
        case 'moving':
            color = '#f59e0b';
            break;
        case 'breakable':
            color = '#ef4444';
            break;
        case 'checkpoint':
            color = '#10b981';
            break;
        default:
            color = '#3b82f6';
    }
    
    // Handle breaking animation
    if (platform.breaking) {
        ctx.globalAlpha = 1 - platform.breakProgress;
        const scale = 1 + platform.breakProgress * 0.3;
        const offsetX = (platform.width * scale - platform.width) / 2;
        const offsetY = (platform.height * scale - platform.height) / 2;
        ctx.translate(platform.x + platform.width / 2, platform.y + platform.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(platform.x + platform.width / 2), -(platform.y + platform.height / 2));
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Platform border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // Draw star on checkpoint platforms
    if (platform.type === 'checkpoint') {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', platform.x + platform.width / 2, platform.y + platform.height / 2);
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
    
    // Apply gravity
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
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
    
    // Check platform collisions (only when falling)
    if (player.velocityY > 0) {
        platforms.forEach(platform => {
            if (platform.broken || platform.breaking) return;
            
            if (player.x + player.width > platform.x &&
                player.x < platform.x + platform.width &&
                player.y + player.height > platform.y &&
                player.y + player.height < platform.y + platform.height + player.velocityY) {
                
                // Jump
                player.velocityY = JUMP_FORCE;
                
                // Handle checkpoint
                if (platform.type === 'checkpoint') {
                    checkpointScore = score;
                    hasCheckpoint = true;
                    // Save current platforms state
                    checkpointPlatforms = platforms.map(p => ({
                        x: p.x,
                        y: p.y,
                        width: p.width,
                        height: p.height,
                        type: p.type === 'checkpoint' ? 'normal' : p.type,
                        direction: p.direction,
                        broken: p.broken,
                        breaking: p.breaking,
                        breakProgress: p.breakProgress
                    }));
                    // Flash effect
                    document.getElementById('score').style.color = '#fbbf24';
                    setTimeout(() => {
                        document.getElementById('score').style.color = '#f59e0b';
                    }, 300);
                }
                
                // Break breakable platforms with animation
                if (platform.type === 'breakable') {
                    platform.breaking = true;
                    createBreakParticles(platform.x, platform.y, platform.width, platform.height);
                }
            }
        });
    }
    
    // Move moving platforms and update breaking animation
    platforms.forEach(platform => {
        if (platform.type === 'moving') {
            platform.x += platform.direction * 2;
            
            if (platform.x <= 0 || platform.x + platform.width >= canvas.width) {
                platform.direction *= -1;
            }
        }
        
        // Update breaking animation
        if (platform.breaking) {
            platform.breakProgress += 0.1;
            if (platform.breakProgress >= 1) {
                platform.broken = true;
            }
        }
    });
    
    // Scroll screen when player goes up
    if (player.y < canvas.height / 2) {
        const scrollAmount = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        
        platforms.forEach(platform => {
            platform.y += scrollAmount;
        });
        
        // Update score
        score += Math.floor(scrollAmount);
        document.getElementById('score').textContent = score;
        
        // Remove platforms below screen and add new ones above
        platforms = platforms.filter(p => p.y < canvas.height);
        
        while (platforms.length < 10) {
            const highestPlatform = platforms.reduce((highest, p) => p.y < highest.y ? p : highest, platforms[0]);
            const newY = highestPlatform.y - 60 - Math.random() * 40;
            platforms.push(generatePlatform(newY));
        }
    }
    
    // Game over check
    if (player.y > canvas.height) {
        endGame();
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw platforms
    platforms.forEach(drawPlatform);
    
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
    if (hasCheckpoint && score > checkpointScore + 500) {
        // Respawn at checkpoint
        player.y = canvas.height - 100;
        player.velocityY = 0;
        player.x = canvas.width / 2 - PLAYER_SIZE / 2;
        score = checkpointScore;
        document.getElementById('score').textContent = score;
        
        // Restore checkpoint platforms and shift them to be visible
        if (checkpointPlatforms.length > 0) {
            // Find the lowest platform in the saved state
            const lowestPlatform = checkpointPlatforms.reduce((lowest, p) => p.y > lowest.y ? p : lowest, checkpointPlatforms[0]);
            const shiftAmount = (canvas.height - 50) - lowestPlatform.y;
            
            platforms = checkpointPlatforms.map(p => ({
                ...p,
                y: p.y + shiftAmount
            }));
            
            // Ensure there's a platform under the player
            platforms[0].x = canvas.width / 2 - PLATFORM_WIDTH / 2;
            platforms[0].y = canvas.height - 50;
        } else {
            // Fallback if no saved platforms
            platforms = [];
            const platformCount = 10;
            const spacing = canvas.height / platformCount;
            
            for (let i = 0; i < platformCount; i++) {
                platforms.push({
                    x: Math.random() * (canvas.width - PLATFORM_WIDTH),
                    y: canvas.height - 50 - i * spacing,
                    width: PLATFORM_WIDTH,
                    height: PLATFORM_HEIGHT,
                    type: 'normal',
                    direction: Math.random() > 0.5 ? 1 : -1,
                    broken: false,
                    breaking: false,
                    breakProgress: 0
                });
            }
            
            platforms[0].x = canvas.width / 2 - PLATFORM_WIDTH / 2;
            platforms[0].y = canvas.height - 50;
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
        localStorage.setItem('doodleJumpBestScore', bestScore);
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

// Don't auto-start - wait for user to click Start
// Instead, draw the initial state without starting the game loop
function drawInitialState() {
    // Initialize player position for display
    player = {
        x: canvas.width / 2 - PLAYER_SIZE / 2,
        y: canvas.height - 100,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        velocityY: 0,
        velocityX: 0
    };
    
    // Create initial platforms for display
    const platformCount = 10;
    const spacing = canvas.height / platformCount;
    
    for (let i = 0; i < platformCount; i++) {
        platforms.push({
            x: Math.random() * (canvas.width - PLATFORM_WIDTH),
            y: canvas.height - 50 - i * spacing,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: 'normal'
        });
    }
    
    platforms[0].x = canvas.width / 2 - PLATFORM_WIDTH / 2;
    platforms[0].y = canvas.height - 50;
    
    draw();
}

drawInitialState();
