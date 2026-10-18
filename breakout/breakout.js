const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game constants
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 8;
const BALL_RADIUS = 8;
const BALL_SPEED = 5;
const BRICK_ROWS = 6;
const BRICK_COLS = 8;
const BRICK_WIDTH = 52;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 6;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 20;

// Game state
let paddle = {
    x: canvas.width / 2 - PADDLE_WIDTH / 2,
    y: canvas.height - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: PADDLE_SPEED
};

let balls = [];
let bricks = [];
let powerUps = [];
let particles = [];
let score = 0;
let lives = 3;
let bestScore = parseInt(localStorage.getItem('breakoutBestScore')) || 0;
let gameOver = false;
let gameWon = false;
let keys = {
    left: false,
    right: false
};

// Power-up types
const POWERUP_TYPES = {
    WIDER: { color: '#10b981', symbol: '↔', label: 'Wider Paddle' },
    MULTI: { color: '#f59e0b', symbol: '×3', label: 'Multi-ball' },
    SLOW: { color: '#3b82f6', symbol: '⏱', label: 'Slow Ball' },
    LIFE: { color: '#ef4444', symbol: '❤', label: 'Extra Life' }
};

// Initialize game
function init() {
    paddle = {
        x: canvas.width / 2 - PADDLE_WIDTH / 2,
        y: canvas.height - 40,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: PADDLE_SPEED
    };
    
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 60,
        radius: BALL_RADIUS,
        dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
        dy: -BALL_SPEED,
        speed: BALL_SPEED
    }];
    
    bricks = [];
    powerUps = [];
    particles = [];
    score = 0;
    lives = 3;
    gameOver = false;
    gameWon = false;
    
    // Create bricks
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            const x = BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING);
            const y = BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING);
            
            // Determine brick type based on row
            let hits = 1;
            let color = '#3b82f6';
            
            if (row === 0) {
                hits = 4;
                color = '#ef4444';
            } else if (row === 1) {
                hits = 3;
                color = '#f59e0b';
            } else if (row === 2) {
                hits = 2;
                color = '#10b981';
            }
            
            bricks.push({
                x: x,
                y: y,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                hits: hits,
                maxHits: hits,
                color: color,
                visible: true
            });
        }
    }
    
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('best-score').textContent = `Best: ${bestScore}`;
    document.getElementById('game-over-overlay').classList.remove('active');
    document.getElementById('instructions-overlay').classList.remove('active');
    document.getElementById('new-best').classList.remove('show');
    document.getElementById('game-over-title').classList.remove('win');
    
    // Cancel any existing game loop
    if (window.currentGameLoop) {
        cancelAnimationFrame(window.currentGameLoop);
    }
    
    gameLoop();
}

// Create ball
function createBall(x, y, dx, dy) {
    return {
        x: x,
        y: y,
        radius: BALL_RADIUS,
        dx: dx,
        dy: dy,
        speed: BALL_SPEED
    };
}

// Create power-up
function createPowerUp(x, y) {
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        width: 30,
        height: 30,
        type: type,
        dy: 2
    });
}

// Create particles
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color: color,
            life: 1
        });
    }
}

// Draw paddle
function drawPaddle() {
    ctx.save();
    
    // Paddle gradient
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#8b5cf6');
    gradient.addColorStop(1, '#6d28d9');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fill();
    
    // Paddle highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(paddle.x + 4, paddle.y + 2, paddle.width - 8, 4, 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw ball
function drawBall(ball) {
    ctx.save();
    
    // Ball gradient
    const gradient = ctx.createRadialGradient(
        ball.x - 2, ball.y - 2, 0,
        ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#fbbf24');
    gradient.addColorStop(1, '#f59e0b');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Ball glow
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.fill();
    
    ctx.restore();
}

// Draw brick
function drawBrick(brick) {
    if (!brick.visible) return;
    
    ctx.save();
    
    // Calculate color based on remaining hits
    const alpha = 0.5 + (brick.hits / brick.maxHits) * 0.5;
    ctx.globalAlpha = alpha;
    
    // Brick gradient
    const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
    gradient.addColorStop(0, brick.color);
    gradient.addColorStop(1, adjustColor(brick.color, -30));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
    ctx.fill();
    
    // Brick border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Show hit count for multi-hit bricks
    if (brick.maxHits > 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(brick.hits, brick.x + brick.width / 2, brick.y + brick.height / 2);
    }
    
    ctx.restore();
}

// Draw power-up
function drawPowerUp(powerUp) {
    ctx.save();
    
    const type = POWERUP_TYPES[powerUp.type];
    
    // Power-up background
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.roundRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height, 6);
    ctx.fill();
    
    // Power-up glow
    ctx.shadowColor = type.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    
    // Power-up symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.symbol, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
    
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
        particle.vy += 0.2;
        particle.life -= 0.02;
        
        // Remove dead particles
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Adjust color brightness
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Update game
function update() {
    if (gameOver) return;
    
    // Move paddle
    if (keys.left) {
        paddle.x -= paddle.speed;
    }
    if (keys.right) {
        paddle.x += paddle.speed;
    }
    
    // Keep paddle in bounds
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    
    // Update balls
    balls.forEach((ball, ballIndex) => {
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Wall collisions
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.dx *= -1;
            createParticles(ball.x, ball.y, '#fbbf24', 5);
        }
        if (ball.y - ball.radius < 0) {
            ball.dy *= -1;
            createParticles(ball.x, ball.y, '#fbbf24', 5);
        }
        
        // Ball lost
        if (ball.y + ball.radius > canvas.height) {
            balls.splice(ballIndex, 1);
            createParticles(ball.x, ball.y, '#ef4444', 15);
        }
        
        // Paddle collision
        if (ball.y + ball.radius > paddle.y &&
            ball.y - ball.radius < paddle.y + paddle.height &&
            ball.x > paddle.x &&
            ball.x < paddle.x + paddle.width) {
            
            // Calculate bounce angle based on where ball hits paddle
            const hitPos = (ball.x - paddle.x) / paddle.width;
            const angle = (hitPos - 0.5) * Math.PI * 0.7; // Max 63 degrees
            
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = speed * Math.sin(angle);
            ball.dy = -Math.abs(speed * Math.cos(angle));
            
            ball.y = paddle.y - ball.radius;
            createParticles(ball.x, ball.y, '#8b5cf6', 8);
        }
        
        // Brick collisions
        bricks.forEach(brick => {
            if (!brick.visible) return;
            
            if (ball.x + ball.radius > brick.x &&
                ball.x - ball.radius < brick.x + brick.width &&
                ball.y + ball.radius > brick.y &&
                ball.y - ball.radius < brick.y + brick.height) {
                
                // Determine collision side
                const overlapLeft = ball.x + ball.radius - brick.x;
                const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
                const overlapTop = ball.y + ball.radius - brick.y;
                const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
                
                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);
                
                if (minOverlapX < minOverlapY) {
                    ball.dx *= -1;
                } else {
                    ball.dy *= -1;
                }
                
                // Damage brick
                brick.hits--;
                score += 10;
                document.getElementById('score').textContent = score;
                
                if (brick.hits <= 0) {
                    brick.visible = false;
                    score += 20;
                    document.getElementById('score').textContent = score;
                    createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 15);
                    
                    // Chance to spawn power-up
                    if (Math.random() < 0.2) {
                        createPowerUp(brick.x + brick.width / 2 - 15, brick.y);
                    }
                } else {
                    createParticles(ball.x, ball.y, brick.color, 5);
                }
            }
        });
    });
    
    // Check if all balls lost
    if (balls.length === 0) {
        lives--;
        document.getElementById('lives').textContent = lives;
        
        if (lives <= 0) {
            endGame();
        } else {
            // Reset ball
            balls.push({
                x: canvas.width / 2,
                y: canvas.height - 60,
                radius: BALL_RADIUS,
                dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
                dy: -BALL_SPEED,
                speed: BALL_SPEED
            });
        }
    }
    
    // Update power-ups
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.dy;
        
        // Check paddle collision
        if (powerUp.y + powerUp.height > paddle.y &&
            powerUp.y < paddle.y + paddle.height &&
            powerUp.x + powerUp.width > paddle.x &&
            powerUp.x < paddle.x + paddle.width) {
            
            // Apply power-up
            applyPowerUp(powerUp.type);
            powerUps.splice(index, 1);
            createParticles(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, POWERUP_TYPES[powerUp.type].color, 20);
        }
        
        // Remove if off screen
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
    
    // Check win condition
    if (bricks.every(brick => !brick.visible)) {
        gameWon = true;
        endGame();
    }
}

// Apply power-up effect
function applyPowerUp(type) {
    switch (type) {
        case 'WIDER':
            paddle.width = Math.min(paddle.width + 30, canvas.width * 0.4);
            setTimeout(() => {
                paddle.width = Math.max(paddle.width - 30, PADDLE_WIDTH);
            }, 10000);
            break;
        case 'MULTI':
            if (balls.length > 0) {
                const baseBall = balls[0];
                balls.push(createBall(baseBall.x, baseBall.y, baseBall.dx * 0.8, baseBall.dy));
                balls.push(createBall(baseBall.x, baseBall.y, -baseBall.dx * 0.8, baseBall.dy));
            }
            break;
        case 'SLOW':
            balls.forEach(ball => {
                ball.dx *= 0.7;
                ball.dy *= 0.7;
            });
            setTimeout(() => {
                balls.forEach(ball => {
                    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    if (currentSpeed < BALL_SPEED) {
                        const factor = BALL_SPEED / currentSpeed;
                        ball.dx *= factor;
                        ball.dy *= factor;
                    }
                });
            }, 8000);
            break;
        case 'LIFE':
            lives++;
            document.getElementById('lives').textContent = lives;
            break;
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bricks
    bricks.forEach(drawBrick);
    
    // Draw power-ups
    powerUps.forEach(drawPowerUp);
    
    // Draw paddle
    drawPaddle();
    
    // Draw balls
    balls.forEach(drawBall);
    
    // Draw particles
    drawParticles();
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
    gameOver = true;
    
    const title = document.getElementById('game-over-title');
    title.textContent = gameWon ? 'You Win!' : 'Game Over';
    
    if (gameWon) {
        title.classList.add('win');
    }
    
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-overlay').classList.add('active');
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('breakoutBestScore', bestScore);
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
    // Initialize for display
    paddle = {
        x: canvas.width / 2 - PADDLE_WIDTH / 2,
        y: canvas.height - 40,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: PADDLE_SPEED
    };
    
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 60,
        radius: BALL_RADIUS,
        dx: BALL_SPEED,
        dy: -BALL_SPEED,
        speed: BALL_SPEED
    }];
    
    // Create bricks for display
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            const x = BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING);
            const y = BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING);
            
            let hits = 1;
            let color = '#3b82f6';
            
            if (row === 0) {
                hits = 4;
                color = '#ef4444';
            } else if (row === 1) {
                hits = 3;
                color = '#f59e0b';
            } else if (row === 2) {
                hits = 2;
                color = '#10b981';
            }
            
            bricks.push({
                x: x,
                y: y,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                hits: hits,
                maxHits: hits,
                color: color,
                visible: true
            });
        }
    }
    
    draw();
}

drawInitialState();
