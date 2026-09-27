class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.previousGrid = [];
        this.score = 0;
        this.best = parseInt(localStorage.getItem('best2048')) || 0;
        this.gameOver = false;
        this.won = false;
        this.continuePlaying = false;
        this.tileMoves = [];
        
        this.init();
    }
    
    init() {
        this.setupGrid();
        this.setupEventListeners();
        this.updateBestDisplay();
        this.newGame();
    }
    
    setupGrid() {
        const gridContainer = document.getElementById('grid');
        gridContainer.innerHTML = '';
        
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gridContainer.appendChild(cell);
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        document.getElementById('newGame').addEventListener('click', () => this.newGame());
        document.getElementById('tryAgain').addEventListener('click', () => this.newGame());
        document.getElementById('continueGame').addEventListener('click', () => this.continueGame());
        document.getElementById('newGameWin').addEventListener('click', () => this.newGame());
        
        // Touch support
        let touchStartX, touchStartY;
        const gameContainer = document.querySelector('.game-container');
        
        gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        gameContainer.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            const minSwipe = 50;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > minSwipe) {
                    if (diffX > 0) this.move('right');
                    else this.move('left');
                }
            } else {
                if (Math.abs(diffY) > minSwipe) {
                    if (diffY > 0) this.move('down');
                    else this.move('up');
                }
            }
            
            touchStartX = null;
            touchStartY = null;
        });
    }
    
    newGame() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.continuePlaying = false;
        
        this.addRandomTile();
        this.addRandomTile();
        this.render();
        this.hideGameOver();
        this.hideGameWon();
        this.updateScore();
    }
    
    continueGame() {
        this.continuePlaying = true;
        this.hideGameWon();
    }
    
    addRandomTile() {
        const emptyCells = [];
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
            return { r, c };
        }
        
        return null;
    }
    
    handleKeyDown(e) {
        if (this.gameOver) return;
        
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.move(direction);
        }
    }
    
    move(direction) {
        if (this.gameOver) return;
        
        // Store previous grid state for animation
        this.previousGrid = this.grid.map(row => [...row]);
        this.tileMoves = [];
        
        let moved = false;
        const mergedPositions = [];
        
        const rotateGrid = (times) => {
            for (let t = 0; t < times; t++) {
                const newGrid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
                for (let r = 0; r < this.size; r++) {
                    for (let c = 0; c < this.size; c++) {
                        newGrid[c][this.size - 1 - r] = this.grid[r][c];
                    }
                }
                this.grid = newGrid;
            }
        };
        
        const rotatePoint = (r, c, times) => {
            let newR = r;
            let newC = c;
            for (let t = 0; t < times; t++) {
                const tempR = newR;
                newR = newC;
                newC = this.size - 1 - tempR;
            }
            return { r: newR, c: newC };
        };
        
        const rotations = { 'up': 0, 'right': 3, 'down': 2, 'left': 1 };
        rotateGrid(rotations[direction]);
        
        // Move up
        for (let c = 0; c < this.size; c++) {
            let writeRow = 0;
            let lastValue = 0;
            let lastWriteRow = -1;
            
            for (let r = 0; r < this.size; r++) {
                if (this.grid[r][c] !== 0) {
                    if (lastValue === this.grid[r][c] && lastWriteRow >= 0) {
                        this.grid[lastWriteRow][c] = lastValue * 2;
                        this.score += lastValue * 2;
                        this.grid[r][c] = 0;
                        mergedPositions.push({ r: lastWriteRow, c });
                        lastValue = 0;
                        lastWriteRow = -1;
                        moved = true;
                    } else {
                        lastValue = this.grid[r][c];
                        if (r !== writeRow) {
                            this.grid[writeRow][c] = this.grid[r][c];
                            this.grid[r][c] = 0;
                            this.tileMoves.push({ fromR: r, fromC: c, toR: writeRow, toC: c, value: lastValue });
                            moved = true;
                        }
                        lastWriteRow = writeRow;
                        writeRow++;
                    }
                }
            }
        }
        
        // Rotate back
        rotateGrid((4 - rotations[direction]) % 4);
        
        // Transform tile moves back to original coordinates
        this.tileMoves = this.tileMoves.map(move => {
            const from = rotatePoint(move.fromR, move.fromC, (4 - rotations[direction]) % 4);
            const to = rotatePoint(move.toR, move.toC, (4 - rotations[direction]) % 4);
            return { fromR: from.r, fromC: from.c, toR: to.r, toC: to.c, value: move.value };
        });
        
        // Transform merged positions back to original coordinates
        const transformedMergedPositions = mergedPositions.map(pos => {
            const transformed = rotatePoint(pos.r, pos.c, (4 - rotations[direction]) % 4);
            return { r: transformed.r, c: transformed.c };
        });
        
        if (moved) {
            const newTile = this.addRandomTile();
            this.render(newTile, transformedMergedPositions);
            this.updateScore();
            
            // Wait for animation to complete before allowing next move
            setTimeout(() => {
                this.tileMoves = [];
            }, 150);
            
            if (!this.continuePlaying && this.checkWin()) {
                this.showGameWon();
            } else if (this.checkGameOver()) {
                this.showGameOver();
            }
        }
    }
    
    checkWin() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] >= 2048) return true;
            }
        }
        return false;
    }
    
    checkGameOver() {
        // Check for empty cells
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }
        
        // Check for possible merges
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const current = this.grid[r][c];
                if (r < this.size - 1 && this.grid[r + 1][c] === current) return false;
                if (c < this.size - 1 && this.grid[r][c + 1] === current) return false;
            }
        }
        
        return true;
    }
    
    render(newTilePos = null, mergedPositions = []) {
        const tileContainer = document.getElementById('tiles');
        const containerSize = tileContainer.offsetWidth;
        const gap = 12;
        const tileSize = (containerSize - gap * (this.size - 1)) / this.size;
        
        // Create a map of current tiles to their DOM elements
        const existingTiles = {};
        tileContainer.querySelectorAll('.tile').forEach(tile => {
            const r = parseInt(tile.dataset.row);
            const c = parseInt(tile.dataset.col);
            if (!isNaN(r) && !isNaN(c)) {
                existingTiles[`${r},${c}`] = tile;
            }
        });
        
        // Track which positions have been handled
        const handledPositions = new Set();
        
        // Animate moving tiles
        this.tileMoves.forEach(move => {
            const fromKey = `${move.fromR},${move.fromC}`;
            const toKey = `${move.toR},${move.toC}`;
            
            if (existingTiles[fromKey]) {
                const tile = existingTiles[fromKey];
                const newX = move.toC * (tileSize + gap);
                const newY = move.toR * (tileSize + gap);
                
                tile.style.transition = 'left 0.15s ease, top 0.15s ease';
                tile.style.left = `${newX}px`;
                tile.style.top = `${newY}px`;
                tile.dataset.row = move.toR;
                tile.dataset.col = move.toC;
                
                handledPositions.add(toKey);
                delete existingTiles[fromKey];
            }
        });
        
        // Remove tiles that were merged or moved
        Object.values(existingTiles).forEach(tile => {
            const r = parseInt(tile.dataset.row);
            const c = parseInt(tile.dataset.col);
            const key = `${r},${c}`;
            
            // Check if this position is now empty or has a different value
            if (this.grid[r][c] === 0 || handledPositions.has(key)) {
                tile.remove();
            }
        });
        
        // Create new tiles and update merged tiles
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const value = this.grid[r][c];
                const key = `${r},${c}`;
                
                if (value !== 0) {
                    const existingTile = tileContainer.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    const isMerged = mergedPositions.some(pos => pos.r === r && pos.c === c);
                    
                    if (existingTile) {
                        // Update existing tile (for merged tiles or tiles that stayed in place)
                        const tileClass = value <= 2048 ? `tile-${value}` : 'tile-super';
                        existingTile.className = `tile ${tileClass}`;
                        existingTile.textContent = value;
                        
                        if (isMerged) {
                            existingTile.classList.add('tile-merged');
                        }
                    } else if (!handledPositions.has(key)) {
                        // Create new tile (only if not already handled by move animation)
                        const tile = document.createElement('div');
                        const tileClass = value <= 2048 ? `tile-${value}` : 'tile-super';
                        tile.className = `tile ${tileClass}`;
                        tile.dataset.row = r;
                        tile.dataset.col = c;
                        
                        if (newTilePos && newTilePos.r === r && newTilePos.c === c) {
                            tile.classList.add('tile-new');
                        }
                        
                        if (isMerged) {
                            tile.classList.add('tile-merged');
                        }
                        
                        tile.textContent = value;
                        
                        const x = c * (tileSize + gap);
                        const y = r * (tileSize + gap);
                        
                        tile.style.width = `${tileSize}px`;
                        tile.style.height = `${tileSize}px`;
                        tile.style.left = `${x}px`;
                        tile.style.top = `${y}px`;
                        
                        tileContainer.appendChild(tile);
                    }
                }
            }
        }
        
        // Clean up any remaining tiles that shouldn't exist
        tileContainer.querySelectorAll('.tile').forEach(tile => {
            const r = parseInt(tile.dataset.row);
            const c = parseInt(tile.dataset.col);
            if (this.grid[r][c] === 0) {
                tile.remove();
            }
        });
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('best2048', this.best);
            this.updateBestDisplay();
        }
    }
    
    updateBestDisplay() {
        document.getElementById('best').textContent = this.best;
    }
    
    showGameOver() {
        this.gameOver = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.add('active');
    }
    
    hideGameOver() {
        document.getElementById('gameOver').classList.remove('active');
    }
    
    showGameWon() {
        this.won = true;
        document.getElementById('gameWon').classList.add('active');
    }
    
    hideGameWon() {
        document.getElementById('gameWon').classList.remove('active');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
