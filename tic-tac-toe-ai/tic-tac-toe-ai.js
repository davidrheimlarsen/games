class TicTacToeAI {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.playerSymbol = 'X';
        this.aiSymbol = 'O';
        this.gameActive = true;
        this.difficulty = 'medium';
        this.isAIThinking = false;
        
        // Statistics
        this.stats = {
            wins: parseInt(localStorage.getItem('tictactoe_wins') || '0'),
            draws: parseInt(localStorage.getItem('tictactoe_draws') || '0'),
            losses: parseInt(localStorage.getItem('tictactoe_losses') || '0'),
            streak: parseInt(localStorage.getItem('tictactoe_streak') || '0'),
            history: JSON.parse(localStorage.getItem('tictactoe_history') || '[]')
        };
        
        // Winning combinations
        this.winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateUI();
        this.loadHistory();
    }
    
    bindEvents() {
        // Board cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        
        // Settings
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
        
        document.querySelectorAll('.player-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changePlayerSymbol(e.target.dataset.player);
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
            if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                if (this.board[index] === '' && this.gameActive && !this.isAIThinking) {
                    this.makeMove(index);
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
    
    changePlayerSymbol(symbol) {
        if (this.gameActive) return;
        
        this.playerSymbol = symbol;
        this.aiSymbol = symbol === 'X' ? 'O' : 'X';
        
        // Update button states
        document.querySelectorAll('.player-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.player === symbol);
        });
        
        this.resetGame();
    }
    
    handleCellClick(e) {
        const index = parseInt(e.target.dataset.index);
        
        if (this.board[index] !== '' || !this.gameActive || this.isAIThinking) {
            return;
        }
        
        this.makeMove(index);
    }
    
    makeMove(index) {
        this.board[index] = this.currentPlayer;
        this.updateBoard();
        
        const result = this.checkGameResult();
        if (result) {
            this.endGame(result);
            return;
        }
        
        this.switchPlayer();
        
        // AI move
        if (this.currentPlayer === this.aiSymbol && this.gameActive) {
            this.makeAIMove();
        }
    }
    
    makeAIMove() {
        this.isAIThinking = true;
        document.getElementById('thinking').classList.add('active');
        
        setTimeout(() => {
            const move = this.getAIMove();
            if (move !== -1) {
                this.board[move] = this.aiSymbol;
                this.updateBoard();
                
                const result = this.checkGameResult();
                if (result) {
                    this.endGame(result);
                    return;
                }
                
                this.switchPlayer();
            }
            
            this.isAIThinking = false;
            document.getElementById('thinking').classList.remove('active');
        }, 500 + Math.random() * 500);
    }
    
    getAIMove() {
        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove();
            case 'medium':
                return Math.random() < 0.5 ? this.getBestMove() : this.getRandomMove();
            case 'hard':
                return Math.random() < 0.8 ? this.getBestMove() : this.getRandomMove();
            case 'unbeatable':
                return this.getBestMove();
            default:
                return this.getRandomMove();
        }
    }
    
    getRandomMove() {
        const availableMoves = [];
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                availableMoves.push(i);
            }
        }
        return availableMoves.length > 0 
            ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
            : -1;
    }
    
    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = -1;
        
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.aiSymbol;
                const score = this.minimax(this.board, 0, false);
                this.board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }
    
    minimax(board, depth, isMaximizing) {
        const result = this.checkWinner(board);
        
        if (result === this.aiSymbol) return 10 - depth;
        if (result === this.playerSymbol) return depth - 10;
        if (result === 'draw') return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = this.aiSymbol;
                    const score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = this.playerSymbol;
                    const score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    checkWinner(board = this.board) {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        
        if (board.every(cell => cell !== '')) {
            return 'draw';
        }
        
        return null;
    }
    
    checkGameResult() {
        const winner = this.checkWinner();
        if (winner) {
            return winner;
        }
        return null;
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateTurnIndicator();
    }
    
    updateBoard() {
        document.querySelectorAll('.cell').forEach((cell, index) => {
            const value = this.board[index];
            cell.textContent = value;
            cell.className = 'cell';
            
            if (value) {
                cell.classList.add('taken', value.toLowerCase());
            }
        });
    }
    
    updateTurnIndicator() {
        const turnText = this.currentPlayer === this.playerSymbol 
            ? `Your turn (${this.playerSymbol})`
            : `AI's turn (${this.aiSymbol})`;
        document.getElementById('currentTurn').textContent = turnText;
    }
    
    endGame(result) {
        this.gameActive = false;
        
        let message, type, gameResult;
        
        if (result === this.playerSymbol) {
            message = `🎉 You Win!`;
            type = 'win';
            gameResult = 'win';
            this.stats.wins++;
            this.stats.streak++;
        } else if (result === this.aiSymbol) {
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
        this.highlightWinningLine(result);
    }
    
    highlightWinningLine(winner) {
        if (winner === 'draw') return;
        
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] === winner && this.board[b] === winner && this.board[c] === winner) {
                document.querySelectorAll('.cell')[a].classList.add('winner');
                document.querySelectorAll('.cell')[b].classList.add('winner');
                document.querySelectorAll('.cell')[c].classList.add('winner');
                break;
            }
        }
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
        this.board = Array(9).fill('');
        this.currentPlayer = this.playerSymbol === 'X' ? 'X' : 'O';
        this.gameActive = true;
        this.isAIThinking = false;
        
        this.updateBoard();
        this.updateTurnIndicator();
        this.hideResultMessage();
        document.getElementById('thinking').classList.remove('active');
        
        // Remove winner highlights
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('winner');
        });
        
        // If AI goes first
        if (this.playerSymbol === 'O' && this.gameActive) {
            this.makeAIMove();
        }
    }
    
    updateUI() {
        document.getElementById('wins').textContent = this.stats.wins;
        document.getElementById('draws').textContent = this.stats.draws;
        document.getElementById('losses').textContent = this.stats.losses;
        document.getElementById('streak').textContent = this.stats.streak;
    }
    
    saveStats() {
        localStorage.setItem('tictactoe_wins', this.stats.wins.toString());
        localStorage.setItem('tictactoe_draws', this.stats.draws.toString());
        localStorage.setItem('tictactoe_losses', this.stats.losses.toString());
        localStorage.setItem('tictactoe_streak', this.stats.streak.toString());
    }
    
    saveGameToHistory(result) {
        const historyItem = {
            result: result,
            playerSymbol: this.playerSymbol,
            aiDifficulty: this.difficulty,
            board: [...this.board],
            timestamp: new Date().toISOString()
        };
        
        this.stats.history.unshift(historyItem);
        
        // Keep only last 20 games
        if (this.stats.history.length > 20) {
            this.stats.history = this.stats.history.slice(0, 20);
        }
        
        localStorage.setItem('tictactoe_history', JSON.stringify(this.stats.history));
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
            infoDiv.textContent = `${item.playerSymbol} vs AI (${item.aiDifficulty}) - ${date.toLocaleDateString()}`;
            
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
            localStorage.removeItem('tictactoe_wins');
            localStorage.removeItem('tictactoe_draws');
            localStorage.removeItem('tictactoe_losses');
            localStorage.removeItem('tictactoe_streak');
            localStorage.removeItem('tictactoe_history');
            
            this.updateUI();
            this.loadHistory();
            this.resetGame();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToeAI();
});
