class ConnectFourGame {
    constructor() {
        this.board = Array(6).fill(null).map(() => Array(7).fill(''));
        this.currentPlayer = 'red';
        this.playerColor = 'red';
        this.aiColor = 'yellow';
        this.gameActive = true;
        this.difficulty = 'medium';
        this.isAIThinking = false;
        this.winningCells = [];
        
        // Statistics
        this.stats = {
            wins: parseInt(localStorage.getItem('connectfour_wins') || '0'),
            draws: parseInt(localStorage.getItem('connectfour_draws') || '0'),
            losses: parseInt(localStorage.getItem('connectfour_losses') || '0'),
            streak: parseInt(localStorage.getItem('connectfour_streak') || '0'),
            history: JSON.parse(localStorage.getItem('connectfour_history') || '[]')
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.bindEvents();
        this.updateUI();
        this.loadHistory();
    }
    
    createBoard() {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
    }
    
    bindEvents() {
        // Column indicators
        document.querySelectorAll('.column-indicator').forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                const col = parseInt(e.target.dataset.column);
                this.makeMove(col);
            });
            
            indicator.addEventListener('mouseenter', (e) => {
                if (this.gameActive && !this.isAIThinking) {
                    const col = parseInt(e.target.dataset.column);
                    this.showColumnPreview(col);
                }
            });
            
            indicator.addEventListener('mouseleave', (e) => {
                this.hideColumnPreview();
            });
        });
        
        // Settings
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
        
        document.querySelectorAll('.player-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changePlayerColor(e.target.dataset.player);
            });
        });
        
        // Controls
        document.getElementById('newGame').addEventListener('click', () => this.resetGame());
        document.getElementById('resetStats').addEventListener('click', () => this.resetStatistics());
        document.getElementById('showHistory').addEventListener('click', () => this.showHistory());
        document.getElementById('closeHistory').addEventListener('click', () => this.hideHistory());
        
        // Modal close on outside click
        document.getElementById('historyModal').addEventListener('click', (e) => {
            if (e.target.id === 'historyModal') {
                this.hideHistory();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '7') {
                const col = parseInt(e.key) - 1;
                if (this.gameActive && !this.isAIThinking) {
                    this.makeMove(col);
                }
            } else if (e.key === 'n') {
                this.resetGame();
            } else if (e.key === 'h') {
                this.showHistory();
            } else if (e.key === 'Escape') {
                this.hideHistory();
            }
        });
    }
    
    changePlayerColor(color) {
        if (this.gameActive) return;
        
        this.playerColor = color;
        this.aiColor = color === 'red' ? 'yellow' : 'red';
        
        // Update button states
        document.querySelectorAll('.player-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.player === color);
        });
        
        this.resetGame();
    }
    
    showColumnPreview(col) {
        const indicator = document.querySelector(`[data-column="${col}"]`);
        indicator.classList.add('preview', this.currentPlayer);
    }
    
    hideColumnPreview() {
        document.querySelectorAll('.column-indicator').forEach(indicator => {
            indicator.classList.remove('preview', 'red', 'yellow');
        });
    }
    
    makeMove(col) {
        if (!this.gameActive || this.isAIThinking) return;
        
        const row = this.getAvailableRow(col);
        if (row === -1) return; // Column is full
        
        this.board[row][col] = this.currentPlayer;
        this.animatePiece(row, col, this.currentPlayer);
        
        const result = this.checkGameResult();
        if (result) {
            setTimeout(() => this.endGame(result), 600);
            return;
        }
        
        this.switchPlayer();
        
        // AI move
        if (this.currentPlayer === this.aiColor && this.gameActive) {
            setTimeout(() => this.makeAIMove(), 800);
        }
    }
    
    getAvailableRow(col) {
        for (let row = 5; row >= 0; row--) {
            if (this.board[row][col] === '') {
                return row;
            }
        }
        return -1;
    }
    
    animatePiece(row, col, color) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const piece = document.createElement('div');
        piece.className = `piece ${color} dropping`;
        cell.appendChild(piece);
        
        setTimeout(() => {
            piece.classList.remove('dropping');
        }, 500);
    }
    
    makeAIMove() {
        if (!this.gameActive) return;
        
        this.isAIThinking = true;
        document.getElementById('thinking').classList.add('active');
        
        setTimeout(() => {
            const move = this.getAIMove();
            if (move !== -1) {
                const row = this.getAvailableRow(move);
                this.board[row][move] = this.aiColor;
                this.animatePiece(row, move, this.aiColor);
                
                const result = this.checkGameResult();
                if (result) {
                    setTimeout(() => this.endGame(result), 600);
                    return;
                }
                
                this.switchPlayer();
            }
            
            this.isAIThinking = false;
            document.getElementById('thinking').classList.remove('active');
        }, 1000 + Math.random() * 1000);
    }
    
    getAIMove() {
        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove();
            case 'medium':
                return Math.random() < 0.6 ? this.getStrategicMove() : this.getRandomMove();
            case 'hard':
                return Math.random() < 0.8 ? this.getStrategicMove() : this.getRandomMove();
            case 'expert':
                return this.getBestMove();
            default:
                return this.getRandomMove();
        }
    }
    
    getRandomMove() {
        const availableCols = [];
        for (let col = 0; col < 7; col++) {
            if (this.getAvailableRow(col) !== -1) {
                availableCols.push(col);
            }
        }
        return availableCols.length > 0 
            ? availableCols[Math.floor(Math.random() * availableCols.length)]
            : -1;
    }
    
    getStrategicMove() {
        // Check for winning move
        for (let col = 0; col < 7; col++) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = this.aiColor;
                if (this.checkWin(this.aiColor)) {
                    this.board[row][col] = '';
                    return col;
                }
                this.board[row][col] = '';
            }
        }
        
        // Block player's winning move
        for (let col = 0; col < 7; col++) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = this.playerColor;
                if (this.checkWin(this.playerColor)) {
                    this.board[row][col] = '';
                    return col;
                }
                this.board[row][col] = '';
            }
        }
        
        // Prefer center columns
        const centerCols = [3, 2, 4, 1, 5, 0, 6];
        for (let col of centerCols) {
            if (this.getAvailableRow(col) !== -1) {
                return col;
            }
        }
        
        return this.getRandomMove();
    }
    
    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = -1;
        
        for (let col = 0; col < 7; col++) {
            const row = this.getAvailableRow(col);
            if (row !== -1) {
                this.board[row][col] = this.aiColor;
                const score = this.minimax(this.board, 5, false, -Infinity, Infinity);
                this.board[row][col] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = col;
                }
            }
        }
        
        return bestMove;
    }
    
    minimax(board, depth, isMaximizing, alpha, beta) {
        const result = this.checkGameResultStatic(board);
        
        if (result === this.aiColor) return 1000 - depth;
        if (result === this.playerColor) return depth - 1000;
        if (result === 'draw' || depth === 0) return this.evaluateBoard(board);
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            for (let col = 0; col < 7; col++) {
                const row = this.getAvailableRowForBoard(board, col);
                if (row !== -1) {
                    board[row][col] = this.aiColor;
                    const score = this.minimax(board, depth - 1, false, alpha, beta);
                    board[row][col] = '';
                    maxScore = Math.max(score, maxScore);
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) break;
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (let col = 0; col < 7; col++) {
                const row = this.getAvailableRowForBoard(board, col);
                if (row !== -1) {
                    board[row][col] = this.playerColor;
                    const score = this.minimax(board, depth - 1, true, alpha, beta);
                    board[row][col] = '';
                    minScore = Math.min(score, minScore);
                    beta = Math.min(beta, score);
                    if (beta <= alpha) break;
                }
            }
            return minScore;
        }
    }
    
    getAvailableRowForBoard(board, col) {
        for (let row = 5; row >= 0; row--) {
            if (board[row][col] === '') {
                return row;
            }
        }
        return -1;
    }
    
    evaluateBoard(board) {
        let score = 0;
        
        // Center column preference
        for (let row = 0; row < 6; row++) {
            if (board[row][3] === this.aiColor) score += 3;
            if (board[row][3] === this.playerColor) score -= 3;
        }
        
        // Check all 4-in-a-row possibilities
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                // Horizontal
                if (col <= 3) {
                    score += this.evaluateWindow(board, row, col, 0, 1);
                }
                // Vertical
                if (row <= 2) {
                    score += this.evaluateWindow(board, row, col, 1, 0);
                }
                // Diagonal (positive)
                if (row <= 2 && col <= 3) {
                    score += this.evaluateWindow(board, row, col, 1, 1);
                }
                // Diagonal (negative)
                if (row <= 2 && col >= 3) {
                    score += this.evaluateWindow(board, row, col, 1, -1);
                }
            }
        }
        
        return score;
    }
    
    evaluateWindow(board, row, col, deltaRow, deltaCol) {
        let score = 0;
        let aiCount = 0;
        let playerCount = 0;
        let emptyCount = 0;
        
        for (let i = 0; i < 4; i++) {
            const cell = board[row + i * deltaRow][col + i * deltaCol];
            if (cell === this.aiColor) aiCount++;
            else if (cell === this.playerColor) playerCount++;
            else emptyCount++;
        }
        
        if (aiCount === 3 && emptyCount === 1) score += 50;
        else if (aiCount === 2 && emptyCount === 2) score += 10;
        else if (playerCount === 3 && emptyCount === 1) score -= 50;
        else if (playerCount === 2 && emptyCount === 2) score -= 10;
        
        return score;
    }
    
    checkGameResult() {
        return this.checkGameResultStatic(this.board);
    }
    
    checkGameResultStatic(board) {
        // Check for win
        if (this.checkWin(this.playerColor, board)) return this.playerColor;
        if (this.checkWin(this.aiColor, board)) return this.aiColor;
        
        // Check for draw
        const isDraw = board.every(row => row.every(cell => cell !== ''));
        if (isDraw) return 'draw';
        
        return null;
    }
    
    checkWin(color, board = this.board) {
        // Check horizontal
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col <= 3; col++) {
                if (board[row][col] === color &&
                    board[row][col + 1] === color &&
                    board[row][col + 2] === color &&
                    board[row][col + 3] === color) {
                    this.winningCells = [[row, col], [row, col + 1], [row, col + 2], [row, col + 3]];
                    return true;
                }
            }
        }
        
        // Check vertical
        for (let row = 0; row <= 2; row++) {
            for (let col = 0; col < 7; col++) {
                if (board[row][col] === color &&
                    board[row + 1][col] === color &&
                    board[row + 2][col] === color &&
                    board[row + 3][col] === color) {
                    this.winningCells = [[row, col], [row + 1, col], [row + 2, col], [row + 3, col]];
                    return true;
                }
            }
        }
        
        // Check diagonal (positive)
        for (let row = 0; row <= 2; row++) {
            for (let col = 0; col <= 3; col++) {
                if (board[row][col] === color &&
                    board[row + 1][col + 1] === color &&
                    board[row + 2][col + 2] === color &&
                    board[row + 3][col + 3] === color) {
                    this.winningCells = [[row, col], [row + 1, col + 1], [row + 2, col + 2], [row + 3, col + 3]];
                    return true;
                }
            }
        }
        
        // Check diagonal (negative)
        for (let row = 0; row <= 2; row++) {
            for (let col = 3; col < 7; col++) {
                if (board[row][col] === color &&
                    board[row + 1][col - 1] === color &&
                    board[row + 2][col - 2] === color &&
                    board[row + 3][col - 3] === color) {
                    this.winningCells = [[row, col], [row + 1, col - 1], [row + 2, col - 2], [row + 3, col - 3]];
                    return true;
                }
            }
        }
        
        return false;
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
        this.updateTurnIndicator();
    }
    
    updateTurnIndicator() {
        const turnText = this.currentPlayer === this.playerColor 
            ? `Your turn (${this.playerColor.charAt(0).toUpperCase() + this.playerColor.slice(1)})`
            : `AI's turn (${this.aiColor.charAt(0).toUpperCase() + this.aiColor.slice(1)})`;
        const turnElement = document.getElementById('currentTurn');
        turnElement.textContent = turnText;
        turnElement.className = `current-turn ${this.currentPlayer}`;
    }
    
    endGame(result) {
        this.gameActive = false;
        
        let message, type, gameResult;
        
        if (result === this.playerColor) {
            message = `🎉 You Win!`;
            type = 'win';
            gameResult = 'win';
            this.stats.wins++;
            this.stats.streak++;
        } else if (result === this.aiColor) {
            message = `😔 AI Wins!`;
            type = 'lose';
            gameResult = 'lose';
            this.stats.losses++;
            this.stats.streak = 0;
        } else {
            message = `🤝 It's a Draw!`;
            type = 'draw';
            gameResult = 'draw';
            this.stats.draws++;
        }
        
        this.showResultMessage(message, type);
        this.saveGameToHistory(gameResult);
        this.saveStats();
        this.updateUI();
        this.highlightWinningPieces();
    }
    
    highlightWinningPieces() {
        if (this.winningCells.length === 0) return;
        
        this.winningCells.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            const piece = cell.querySelector('.piece');
            if (piece) {
                piece.classList.add('winner');
            }
        });
    }
    
    showResultMessage(message, type) {
        const messageEl = document.getElementById('resultMessage');
        messageEl.textContent = message;
        messageEl.className = `result-message ${type} show`;
    }
    
    hideResultMessage() {
        const messageEl = document.getElementById('resultMessage');
        messageEl.className = 'result-message';
    }
    
    resetGame() {
        this.board = Array(6).fill(null).map(() => Array(7).fill(''));
        this.currentPlayer = this.playerColor === 'red' ? 'red' : 'yellow';
        this.gameActive = true;
        this.isAIThinking = false;
        this.winningCells = [];
        
        // Clear board
        document.querySelectorAll('.piece').forEach(piece => piece.remove());
        
        this.updateTurnIndicator();
        this.hideResultMessage();
        document.getElementById('thinking').classList.remove('active');
        
        // If AI goes first
        if (this.playerColor === 'yellow' && this.gameActive) {
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }
    
    updateUI() {
        document.getElementById('wins').textContent = this.stats.wins;
        document.getElementById('draws').textContent = this.stats.draws;
        document.getElementById('losses').textContent = this.stats.losses;
        document.getElementById('streak').textContent = this.stats.streak;
    }
    
    saveStats() {
        localStorage.setItem('connectfour_wins', this.stats.wins.toString());
        localStorage.setItem('connectfour_draws', this.stats.draws.toString());
        localStorage.setItem('connectfour_losses', this.stats.losses.toString());
        localStorage.setItem('connectfour_streak', this.stats.streak.toString());
    }
    
    saveGameToHistory(result) {
        const historyItem = {
            result: result,
            playerColor: this.playerColor,
            aiDifficulty: this.difficulty,
            board: this.board.map(row => [...row]),
            timestamp: new Date().toISOString()
        };
        
        this.stats.history.unshift(historyItem);
        
        // Keep only last 20 games
        if (this.stats.history.length > 20) {
            this.stats.history = this.stats.history.slice(0, 20);
        }
        
        localStorage.setItem('connectfour_history', JSON.stringify(this.stats.history));
        this.loadHistory();
    }
    
    loadHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.stats.history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: var(--text-secondary);">No games played yet</div>';
            return;
        }
        
        historyList.innerHTML = '';
        
        this.stats.history.forEach(item => {
            const historyDiv = document.createElement('div');
            historyDiv.className = `history-item ${item.result}`;
            
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'history-details';
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'history-result';
            resultDiv.textContent = item.result;
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'history-info';
            const date = new Date(item.timestamp);
            infoDiv.textContent = `${item.playerColor} vs AI (${item.aiDifficulty}) - ${date.toLocaleDateString()}`;
            
            detailsDiv.appendChild(resultDiv);
            detailsDiv.appendChild(infoDiv);
            historyDiv.appendChild(detailsDiv);
            historyList.appendChild(historyDiv);
        });
    }
    
    showHistory() {
        document.getElementById('historyModal').classList.add('active');
    }
    
    hideHistory() {
        document.getElementById('historyModal').classList.remove('active');
    }
    
    resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            this.stats = {
                wins: 0,
                draws: 0,
                losses: 0,
                streak: 0,
                history: []
            };
            
            // Clear localStorage
            localStorage.removeItem('connectfour_wins');
            localStorage.removeItem('connectfour_draws');
            localStorage.removeItem('connectfour_losses');
            localStorage.removeItem('connectfour_streak');
            localStorage.removeItem('connectfour_history');
            
            this.updateUI();
            this.loadHistory();
            this.resetGame();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ConnectFourGame();
});
