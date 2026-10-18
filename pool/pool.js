const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game constants
const BALL_RADIUS = 12;
const FRICTION = 0.985;
const MIN_VELOCITY = 0.1;
const POCKET_RADIUS = 20;
const MAX_POWER = 25;

// Ball colors
const BALL_COLORS = [
    '#ef4444', // Red
    '#f59e0b', // Orange
    '#eab308', // Yellow
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange-red
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#a855f7', // Purple
    '#22c55e', // Green
    '#0ea5e9', // Sky blue
];

// Pocket positions (4 corners + 2 sides)
const POCKETS = [
    { x: POCKET_RADIUS, y: POCKET_RADIUS }, // Top-left
    { x: canvas.width / 2, y: POCKET_RADIUS - 5 }, // Top-middle
    { x: canvas.width - POCKET_RADIUS, y: POCKET_RADIUS }, // Top-right
    { x: POCKET_RADIUS, y: canvas.height - POCKET_RADIUS }, // Bottom-left
    { x: canvas.width / 2, y: canvas.height - POCKET_RADIUS + 5 }, // Bottom-middle
    { x: canvas.width - POCKET_RADIUS, y: canvas.height - POCKET_RADIUS }, // Bottom-right
];

// Game state
let balls = [];
let cueBall = null;
let score = 0;
let shots = 0;
let bestScore = parseInt(localStorage.getItem('poolBestScore')) || 0;
let gameOver = false;
let gameWon = false;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragEnd = { x: 0, y: 0 };
let ballsMoving = false;

// Initialize game
function init() {
    balls = [];
    score = 0;
    shots = 0;
    gameOver = false;
    gameWon = false;
    ballsMoving = false;
    
    // Create cue ball
    cueBall = {
        x: canvas.width * 0.25,
        y: canvas.height / 2,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#ffffff',
        isCue: true
    };
    balls.push(cueBall);
    
    // Create rack of balls (triangle formation)
    const startX = canvas.width * 0.7;
    const startY = canvas.height / 2;
    const spacing = BALL_RADIUS * 2 + 2;
    
    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + row * spacing * 0.866;
            const y = startY + (col - row / 2) * spacing;
            
            balls.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                radius: BALL_RADIUS,
                color: BALL_COLORS[ballIndex % BALL_COLORS.length],
                isCue: false
            });
            
            ballIndex++;
        }
    }
    
    document.getElementById('score').textContent = score;
    document.getElementById('shots').textContent = shots;
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

// Check if balls are moving
function checkBallsMoving() {
    ballsMoving = balls.some(ball => {
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        return speed > MIN_VELOCITY;
    });
}

// Update ball physics
function updateBalls() {
    balls.forEach(ball => {
        // Apply velocity
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        // Apply friction
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;
        
        // Stop if very slow
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed < MIN_VELOCITY) {
            ball.vx = 0;
            ball.vy = 0;
        }
        
        // Wall collisions (cushions)
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx *= -0.9;
        }
        if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.vx *= -0.9;
        }
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy *= -0.9;
        }
        if (ball.y + ball.radius > canvas.height) {
            ball.y = canvas.height - ball.radius;
            ball.vy *= -0.9;
        }
    });
    
    // Ball-to-ball collisions
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const ball1 = balls[i];
            const ball2 = balls[j];
            
            const dx = ball2.x - ball1.x;
            const dy = ball2.y - ball1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ball1.radius + ball2.radius) {
                // Collision detected - resolve it
                const angle = Math.atan2(dy, dx);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);
                
                // Rotate velocities
                const vx1 = ball1.vx * cos + ball1.vy * sin;
                const vy1 = ball1.vy * cos - ball1.vx * sin;
                const vx2 = ball2.vx * cos + ball2.vy * sin;
                const vy2 = ball2.vy * cos - ball2.vx * sin;
                
                // Swap x velocities (elastic collision)
                const finalVx1 = vx2;
                const finalVx2 = vx1;
                
                // Rotate back
                ball1.vx = finalVx1 * cos - vy1 * sin;
                ball1.vy = vy1 * cos + finalVx1 * sin;
                ball2.vx = finalVx2 * cos - vy2 * sin;
                ball2.vy = vy2 * cos + finalVx2 * sin;
                
                // Separate balls to prevent sticking
                const overlap = (ball1.radius + ball2.radius - distance) / 2;
                ball1.x -= overlap * cos;
                ball1.y -= overlap * sin;
                ball2.x += overlap * cos;
                ball2.y += overlap * sin;
            }
        }
    }
    
    // Check pocket collisions
    balls.forEach((ball, index) => {
        POCKETS.forEach(pocket => {
            const dx = ball.x - pocket.x;
            const dy = ball.y - pocket.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < POCKET_RADIUS) {
                // Ball sunk!
                if (ball.isCue) {
                    // Cue ball sunk - penalty and reset
                    score = Math.max(0, score - 50);
                    document.getElementById('score').textContent = score;
                    
                    // Reset cue ball position
                    ball.x = canvas.width * 0.25;
                    ball.y = canvas.height / 2;
                    ball.vx = 0;
                    ball.vy = 0;
                } else {
                    // Colored ball sunk - score points
                    score += 100;
                    document.getElementById('score').textContent = score;
                    balls.splice(index, 1);
                }
            }
        });
    });
    
    checkBallsMoving();
}

// Draw table
function drawTable() {
    // Table surface (green felt)
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pockets
    POCKETS.forEach(pocket => {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Pocket highlight
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 3;
        ctx.stroke();
    });
}

// Draw ball
function drawBall(ball) {
    ctx.save();
    
    // Ball gradient
    const gradient = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
        ball.x, ball.y, ball.radius
    );
    
    if (ball.isCue) {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#f0f0f0');
        gradient.addColorStop(1, '#d0d0d0');
    } else {
        gradient.addColorStop(0, adjustColor(ball.color, 50));
        gradient.addColorStop(0.5, ball.color);
        gradient.addColorStop(1, adjustColor(ball.color, -30));
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Ball shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw aiming line
function drawAimLine() {
    if (!isDragging || !cueBall || ballsMoving) return;
    
    const dx = dragStart.x - dragEnd.x;
    const dy = dragStart.y - dragEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) return;
    
    const power = Math.min(distance / 10, MAX_POWER);
    const angle = Math.atan2(dy, dx);
    
    // Draw power line
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + power / MAX_POWER * 0.7})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(cueBall.x, cueBall.y);
    ctx.lineTo(
        cueBall.x + Math.cos(angle) * 200,
        cueBall.y + Math.sin(angle) * 200
    );
    ctx.stroke();
    
    // Draw power indicator
    const powerPercent = (power / MAX_POWER) * 100;
    ctx.fillStyle = powerPercent < 33 ? '#10b981' : powerPercent < 66 ? '#f59e0b' : '#ef4444';
    ctx.font = 'bold 16px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText(`Power: ${Math.round(powerPercent)}%`, cueBall.x, cueBall.y - 30);
    
    ctx.restore();
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
    
    updateBalls();
    
    // Check win condition (all colored balls sunk)
    const coloredBalls = balls.filter(ball => !ball.isCue);
    if (coloredBalls.length === 0) {
        gameWon = true;
        endGame();
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw table
    drawTable();
    
    // Draw balls
    balls.forEach(drawBall);
    
    // Draw aim line
    drawAimLine();
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
        localStorage.setItem('poolBestScore', bestScore);
        document.getElementById('best-score').textContent = `Best: ${bestScore}`;
        document.getElementById('new-best').classList.add('show');
    }
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    if (gameOver || ballsMoving || !cueBall) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on cue ball
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < cueBall.radius * 2) {
        isDragging = true;
        dragStart = { x: cueBall.x, y: cueBall.y };
        dragEnd = { x, y };
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    // Allow dragging outside canvas - just calculate relative position
    dragEnd = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
});

document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    
    const dx = dragStart.x - dragEnd.x;
    const dy = dragStart.y - dragEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 10) {
        // Calculate shot power and angle
        const power = Math.min(distance / 10, MAX_POWER);
        const angle = Math.atan2(dy, dx);
        
        // Apply velocity to cue ball
        cueBall.vx = Math.cos(angle) * power;
        cueBall.vy = Math.sin(angle) * power;
        
        shots++;
        document.getElementById('shots').textContent = shots;
    }
    
    isDragging = false;
});

// Touch events (for mobile)
canvas.addEventListener('touchstart', (e) => {
    if (gameOver || ballsMoving || !cueBall) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const dx = x - cueBall.x;
    const dy = y - cueBall.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < cueBall.radius * 3) {
        e.preventDefault();
        isDragging = true;
        dragStart = { x: cueBall.x, y: cueBall.y };
        dragEnd = { x, y };
    }
});

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    // Allow dragging outside canvas - just calculate relative position
    dragEnd = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
});

document.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    
    const dx = dragStart.x - dragEnd.x;
    const dy = dragStart.y - dragEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 10) {
        const power = Math.min(distance / 10, MAX_POWER);
        const angle = Math.atan2(dy, dx);
        
        cueBall.vx = Math.cos(angle) * power;
        cueBall.vy = Math.sin(angle) * power;
        
        shots++;
        document.getElementById('shots').textContent = shots;
    }
    
    isDragging = false;
});

// Play again button
document.getElementById('play-again-btn').addEventListener('click', init);

// Start button
document.getElementById('start-btn').addEventListener('click', init);

// Draw initial state
function drawInitialState() {
    // Initialize for display
    balls = [];
    
    cueBall = {
        x: canvas.width * 0.25,
        y: canvas.height / 2,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        color: '#ffffff',
        isCue: true
    };
    balls.push(cueBall);
    
    const startX = canvas.width * 0.7;
    const startY = canvas.height / 2;
    const spacing = BALL_RADIUS * 2 + 2;
    
    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + row * spacing * 0.866;
            const y = startY + (col - row / 2) * spacing;
            
            balls.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                radius: BALL_RADIUS,
                color: BALL_COLORS[ballIndex % BALL_COLORS.length],
                isCue: false
            });
            
            ballIndex++;
        }
    }
    
    draw();
}

drawInitialState();
