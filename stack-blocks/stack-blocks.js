// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const INITIAL_BLOCK_WIDTH = 200;
const BLOCK_HEIGHT = 30;
let INITIAL_SPEED = 4;
let SPEED_INCREMENT = 0.15;
const MAX_SPEED = 12;
const PERFECT_THRESHOLD = 5;

// Game state
let canvas, ctx;
let blocks = [];
let fallingBlocks = [];
let movingBlock = null;
let score = 0;
let bestScore = parseInt(localStorage.getItem('stackBlocksBest') || '0');
let gameActive = false;
let gameStarted = false;
let combo = 0;
let speed = INITIAL_SPEED;
let direction = 1;
let cameraOffset = 0;
let targetCameraOffset = 0;
let hueShift = 0; // For color shifting

// Helper function to convert HSL to Hex
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Function to get shifting color based on index and time
function getShiftingColor(index) {
    const baseHue = (index * 36 + hueShift) % 360;
    const main = hslToHex(baseHue, 75, 60);
    const shadow = hslToHex(baseHue, 70, 45);
    return { main, shadow };
}

// Colors - beautiful gradient palette (kept as fallback)
const colors = [
    { main: '#667eea', shadow: '#4c5fd7' },
    { main: '#764ba2', shadow: '#5a3680' },
    { main: '#f093fb', shadow: '#d16dd8' },
    { main: '#f5576c', shadow: '#d43d52' },
    { main: '#4facfe', shadow: '#3690e0' },
    { main: '#00f2fe', shadow: '#00d4e0' },
    { main: '#43e97b', shadow: '#2bc962' },
    { main: '#fa709a', shadow: '#dc5880' },
    { main: '#fee140', shadow: '#e0c530' },
    { main: '#30cfd0', shadow: '#20b0b0' }
];

// DOM elements
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const instructionsElement = document.getElementById('instructions');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreElement = document.getElementById('final-score');
const newBestElement = document.getElementById('new-best');
const playAgainBtn = document.getElementById('play-again-btn');
const perfectIndicator = document.getElementById('perfect');
const comboDisplay = document.getElementById('combo');
const difficultySelector = document.getElementById('difficulty-selector');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    bestScoreElement.textContent = `Best: ${bestScore}`;
    
    // Event listeners
    canvas.addEventListener('click', handleInput);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleInput();
        }
    });
    playAgainBtn.addEventListener('click', resetGame);

    // Difficulty button listeners
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update selection
            difficultyBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Update game settings
            INITIAL_SPEED = parseInt(btn.dataset.speed);
            SPEED_INCREMENT = parseFloat(btn.dataset.increment);
            speed = INITIAL_SPEED;
        });
    });

    // Create foundation block
    createFoundation();
    
    // Start game loop
    gameLoop();
}

function createFoundation() {
    blocks = [{
        x: (CANVAS_WIDTH - INITIAL_BLOCK_WIDTH) / 2,
        y: CANVAS_HEIGHT - BLOCK_HEIGHT - 20,
        width: INITIAL_BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color: colors[0]
    }];
}

function createMovingBlock() {
    const topBlock = blocks[blocks.length - 1];
    const colorIndex = blocks.length % colors.length;
    
    // Alternate starting side
    const startX = direction > 0 ? -topBlock.width : CANVAS_WIDTH;
    
    movingBlock = {
        x: startX,
        y: topBlock.y - BLOCK_HEIGHT,
        width: topBlock.width,
        height: BLOCK_HEIGHT,
        color: colors[colorIndex],
        speed: speed * direction
    };
    
    // Flip direction for next block
    direction *= -1;
}

function handleInput() {
    // Ignore if game over screen is showing
    if (gameOverOverlay.classList.contains('active')) return;

    if (!gameStarted) {
        // First click - start game
        gameStarted = true;
        gameActive = true;
        instructionsElement.style.display = 'none';
        difficultySelector.classList.add('hidden');
        createMovingBlock();
        return;
    }

    if (!gameActive || !movingBlock) return;

    // Stack the block
    stackBlock();
}

function stackBlock() {
    const topBlock = blocks[blocks.length - 1];
    
    // Calculate overlap
    const overlapLeft = Math.max(movingBlock.x, topBlock.x);
    const overlapRight = Math.min(movingBlock.x + movingBlock.width, topBlock.x + topBlock.width);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 0) {
        // Missed completely - game over
        fallingBlocks.push({
            ...movingBlock,
            velocityY: 0,
            velocityX: movingBlock.speed * 0.5,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
        endGame();
        return;
    }

    // Check for perfect placement
    const isPerfect = Math.abs(movingBlock.x - topBlock.x) < PERFECT_THRESHOLD;

    if (isPerfect) {
        // Perfect placement - keep full width
        combo++;
        showPerfect();
        updateCombo();
        
        blocks.push({
            x: topBlock.x,
            y: movingBlock.y,
            width: topBlock.width,
            height: BLOCK_HEIGHT,
            color: movingBlock.color
        });
    } else {
        combo = 0;
        updateCombo();
        
        // Create the stacked block with overlap
        blocks.push({
            x: overlapLeft,
            y: movingBlock.y,
            width: overlapWidth,
            height: BLOCK_HEIGHT,
            color: movingBlock.color
        });

        // Create falling debris
        if (movingBlock.x < topBlock.x) {
            // Debris on the left
            fallingBlocks.push({
                x: movingBlock.x,
                y: movingBlock.y,
                width: topBlock.x - movingBlock.x,
                height: BLOCK_HEIGHT,
                color: movingBlock.color,
                velocityY: 0,
                velocityX: -2,
                rotation: 0,
                rotationSpeed: -0.1
            });
        }
        if (movingBlock.x + movingBlock.width > topBlock.x + topBlock.width) {
            // Debris on the right
            fallingBlocks.push({
                x: topBlock.x + topBlock.width,
                y: movingBlock.y,
                width: (movingBlock.x + movingBlock.width) - (topBlock.x + topBlock.width),
                height: BLOCK_HEIGHT,
                color: movingBlock.color,
                velocityY: 0,
                velocityX: 2,
                rotation: 0,
                rotationSpeed: 0.1
            });
        }
    }

    // Update score
    score++;
    updateScore();

    // Increase speed
    speed = Math.min(MAX_SPEED, INITIAL_SPEED + score * SPEED_INCREMENT);

    // Update camera
    if (blocks.length > 10) {
        targetCameraOffset = (blocks.length - 10) * BLOCK_HEIGHT;
    }

    // Check if block is too small
    const newBlock = blocks[blocks.length - 1];
    if (newBlock.width < 10) {
        endGame();
        return;
    }

    // Create next moving block
    movingBlock = null;
    setTimeout(() => {
        if (gameActive) {
            createMovingBlock();
        }
    }, 100);
}

function showPerfect() {
    perfectIndicator.classList.remove('show');
    void perfectIndicator.offsetWidth; // Trigger reflow
    perfectIndicator.classList.add('show');
}

function updateCombo() {
    if (combo >= 2) {
        comboDisplay.textContent = `🔥 x${combo}`;
        comboDisplay.classList.add('show');
    } else {
        comboDisplay.classList.remove('show');
    }
}

function updateScore() {
    scoreElement.textContent = score;
    scoreElement.classList.add('pop');
    setTimeout(() => scoreElement.classList.remove('pop'), 150);
}

function endGame() {
    gameActive = false;
    movingBlock = null;

    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('stackBlocksBest', bestScore.toString());
        newBestElement.classList.add('show');
    } else {
        newBestElement.classList.remove('show');
    }

    // Show game over screen
    finalScoreElement.textContent = score;
    setTimeout(() => {
        gameOverOverlay.classList.add('active');
    }, 500);
}

function resetGame() {
    // Reset state
    score = 0;
    const selectedBtn = document.querySelector('.difficulty-btn.selected');
    INITIAL_SPEED = parseInt(selectedBtn.dataset.speed);
    SPEED_INCREMENT = parseFloat(selectedBtn.dataset.increment);
    speed = INITIAL_SPEED;
    direction = 1;
    combo = 0;
    cameraOffset = 0;
    targetCameraOffset = 0;
    gameActive = false;
    gameStarted = false;
    movingBlock = null;
    fallingBlocks = [];

    // Reset UI
    scoreElement.textContent = '0';
    bestScoreElement.textContent = `Best: ${bestScore}`;
    instructionsElement.style.display = 'block';
    difficultySelector.classList.remove('hidden');
    gameOverOverlay.classList.remove('active');
    comboDisplay.classList.remove('show');

    // Reset blocks
    createFoundation();
}

function update() {
    // Update hue shift for color cycling (slow shift)
    hueShift = (hueShift + 0.3) % 360;

    // Smooth camera movement
    cameraOffset += (targetCameraOffset - cameraOffset) * 0.1;

    // Update moving block
    if (movingBlock && gameActive) {
        movingBlock.x += movingBlock.speed;

        // Bounce off edges
        if (movingBlock.x + movingBlock.width > CANVAS_WIDTH) {
            movingBlock.x = CANVAS_WIDTH - movingBlock.width;
            movingBlock.speed = -Math.abs(movingBlock.speed);
        } else if (movingBlock.x < 0) {
            movingBlock.x = 0;
            movingBlock.speed = Math.abs(movingBlock.speed);
        }
    }

    // Update falling blocks
    for (let i = fallingBlocks.length - 1; i >= 0; i--) {
        const block = fallingBlocks[i];
        block.velocityY += 0.5;
        block.y += block.velocityY;
        block.x += block.velocityX;
        block.rotation += block.rotationSpeed;

        if (block.y > CANVAS_HEIGHT + 100) {
            fallingBlocks.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_WIDTH, i);
        ctx.stroke();
    }

    ctx.save();
    ctx.translate(0, cameraOffset);

    blocks.forEach((block, index) => {
        const shiftedColor = getShiftingColor(index);
        drawBlock({...block, color: shiftedColor}, index === 0, false, index);
    });

    if (movingBlock) {
        const shiftedColor = getShiftingColor(blocks.length);
        drawBlock({...movingBlock, color: shiftedColor}, false, true, blocks.length);
    }

    ctx.restore();

    fallingBlocks.forEach((block, index) => {
        const shiftedColor = getShiftingColor(blocks.length + index);
        ctx.save();
        ctx.translate(block.x + block.width / 2, block.y + block.height / 2 + cameraOffset);
        ctx.rotate(block.rotation);

        const w = block.width;
        const h = block.height;
        const depth = 8;
        const topDepth = 6;

        const frontGradient = ctx.createLinearGradient(0, -h/2, 0, h/2);
        frontGradient.addColorStop(0, shiftedColor.main);
        frontGradient.addColorStop(1, shiftedColor.shadow);
        ctx.fillStyle = frontGradient;
        ctx.fillRect(-w/2, -h/2 + topDepth, w, h);
        
        ctx.fillStyle = shiftedColor.main;
        ctx.beginPath();
        ctx.moveTo(-w/2, -h/2 + topDepth);
        ctx.lineTo(-w/2 + depth, -h/2);
        ctx.lineTo(w/2 + depth, -h/2);
        ctx.lineTo(w/2, -h/2 + topDepth);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = shiftedColor.shadow;
        ctx.beginPath();
        ctx.moveTo(w/2, -h/2 + topDepth);
        ctx.lineTo(w/2 + depth, -h/2);
        ctx.lineTo(w/2 + depth, h/2);
        ctx.lineTo(w/2, h/2 + topDepth);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

function drawBlock(block, isFoundation = false, isMoving = false) {
    const x = block.x;
    const y = block.y;
    const w = block.width;
    const h = block.height;
    const depth = 12;
    const topDepth = 8;
    const mainColor = block.color.main;
    const shadowColor = block.color.shadow;

    function adjustColor(hex, amount) {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    const topColor = adjustColor(mainColor, 40);
    const frontColor = mainColor;
    const rightColor = adjustColor(shadowColor, -30);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + depth + 8, y + h + topDepth + 4);
    ctx.lineTo(x + w + depth + 8, y + h + topDepth + 4);
    ctx.lineTo(x + w + 8, y + h + 4);
    ctx.lineTo(x + 8, y + h + 4);
    ctx.closePath();
    ctx.fill();

    const rightGradient = ctx.createLinearGradient(x + w, y, x + w + depth, y);
    rightGradient.addColorStop(0, rightColor);
    rightGradient.addColorStop(1, adjustColor(shadowColor, -60));
    ctx.fillStyle = rightGradient;
    ctx.beginPath();
    ctx.moveTo(x + w, y + topDepth);
    ctx.lineTo(x + w + depth, y);
    ctx.lineTo(x + w + depth, y + h);
    ctx.lineTo(x + w, y + h + topDepth);
    ctx.closePath();
    ctx.fill();

    const topGradient = ctx.createLinearGradient(x, y, x + w, y + topDepth);
    topGradient.addColorStop(0, adjustColor(mainColor, 60));
    topGradient.addColorStop(0.5, topColor);
    topGradient.addColorStop(1, adjustColor(mainColor, 20));
    ctx.fillStyle = topGradient;
    ctx.beginPath();
    ctx.moveTo(x, y + topDepth);
    ctx.lineTo(x + depth, y);
    ctx.lineTo(x + w + depth, y);
    ctx.lineTo(x + w, y + topDepth);
    ctx.closePath();
    ctx.fill();

    const frontGradient = ctx.createLinearGradient(x, y + topDepth, x, y + h + topDepth);
    frontGradient.addColorStop(0, frontColor);
    frontGradient.addColorStop(0.7, shadowColor);
    frontGradient.addColorStop(1, adjustColor(shadowColor, -20));
    ctx.fillStyle = frontGradient;
    ctx.fillRect(x, y + topDepth, w, h);

    const glossGradient = ctx.createLinearGradient(x, y, x + w/2, y + topDepth);
    glossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    glossGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    glossGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glossGradient;
    ctx.beginPath();
    ctx.moveTo(x, y + topDepth);
    ctx.lineTo(x + depth, y);
    ctx.lineTo(x + w + depth, y);
    ctx.lineTo(x + w, y + topDepth);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + topDepth);
    ctx.lineTo(x + w, y + topDepth);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + topDepth);
    ctx.lineTo(x, y + h + topDepth);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + topDepth);
    ctx.lineTo(x + depth, y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y + h + topDepth);
    ctx.lineTo(x + w, y + h + topDepth);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w, y + topDepth);
    ctx.lineTo(x + w, y + h + topDepth);
    ctx.stroke();

    const innerGlow = ctx.createLinearGradient(x, y + topDepth, x, y + topDepth + 10);
    innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = innerGlow;
    ctx.fillRect(x + 2, y + topDepth, w - 4, 10);

    if (isMoving) {
        ctx.shadowColor = block.color.main;
        ctx.shadowBlur = 25;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + topDepth);
        ctx.lineTo(x + depth, y);
        ctx.lineTo(x + w + depth, y);
        ctx.lineTo(x + w + depth, y + h);
        ctx.lineTo(x + w, y + h + topDepth);
        ctx.lineTo(x, y + h + topDepth);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

init();
