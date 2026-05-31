class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.isCheck = false;
        this.isCheckmate = false;
        this.isStalemate = false;
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.lastMove = null;
        this.promotionPending = null;
        this.gameMode = 'pvp';
        this.aiDifficulty = 3;
        this.isAiThinking = false;
        
        this.pieces = {
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        };
        
        this.pieceSymbols = {
            white: { 'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙' },
            black: { 'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟' }
        };
        
        this.pieceValues = {
            'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000
        };
        
        this.positionBonus = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5, 5, 10, 25, 25, 10, 5, 5],
            [0, 0, 0, 20, 20, 0, 0, 0],
            [5, -5, -10, 0, 0, -10, -5, 5],
            [5, 10, 10, -20, -20, 10, 10, 5],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ];
        
        this.init();
    }
    
    init() {
        this.setupBoard();
        this.setupEventListeners();
        this.renderBoard();
        this.updateUI();
    }
    
    setupBoard() {
        // Initialize empty board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Set up pieces
        const pieceOrder = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        
        // Black pieces
        for (let i = 0; i < 8; i++) {
            this.board[0][i] = { type: pieceOrder[i], color: 'black' };
            this.board[1][i] = { type: 'p', color: 'black' };
        }
        
        // White pieces
        for (let i = 0; i < 8; i++) {
            this.board[6][i] = { type: 'P', color: 'white' };
            this.board[7][i] = { type: pieceOrder[i].toUpperCase(), color: 'white' };
        }
    }
    
    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        document.getElementById('resignBtn').addEventListener('click', () => this.resign());
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('active');
            this.newGame();
        });
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('active');
        });
        
        // Game mode selector
        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            const difficultyContainer = document.getElementById('aiDifficultyContainer');
            difficultyContainer.style.display = this.gameMode === 'ai' ? 'flex' : 'none';
            this.newGame();
        });
        
        // AI difficulty selector
        document.getElementById('aiDifficulty').addEventListener('change', (e) => {
            this.aiDifficulty = parseInt(e.target.value);
        });
        
        // Promotion pieces
        document.querySelectorAll('.promotion-piece').forEach(btn => {
            btn.addEventListener('click', () => {
                const piece = btn.dataset.piece;
                this.completePromotion(piece);
            });
        });
    }
    
    renderBoard() {
        const boardElement = document.getElementById('chessBoard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Add last move highlighting
                if (this.lastMove) {
                    if ((this.lastMove.from.row === row && this.lastMove.from.col === col) ||
                        (this.lastMove.to.row === row && this.lastMove.to.col === col)) {
                        square.classList.add('last-move');
                    }
                }
                
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.textContent = this.pieceSymbols[piece.color][piece.type.toUpperCase()];
                    pieceElement.draggable = true;
                    
                    // Add drag event listeners
                    pieceElement.addEventListener('dragstart', (e) => this.handleDragStart(e, row, col));
                    pieceElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
                    
                    square.appendChild(pieceElement);
                }
                
                // Add drop event listeners
                square.addEventListener('dragover', (e) => e.preventDefault());
                square.addEventListener('drop', (e) => this.handleDrop(e, row, col));
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                
                boardElement.appendChild(square);
            }
        }
    }
    
    handleDragStart(e, row, col) {
        const piece = this.board[row][col];
        if (!piece || piece.color !== this.currentPlayer) return;
        
        this.selectedPiece = piece;
        this.selectedSquare = { row, col };
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        
        this.showValidMoves(row, col);
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.clearHighlights();
    }
    
    handleDrop(e, row, col) {
        e.preventDefault();
        if (!this.selectedPiece || !this.selectedSquare) return;
        
        if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
            this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
        }
        
        this.selectedPiece = null;
        this.selectedSquare = null;
    }
    
    handleSquareClick(row, col) {
        const piece = this.board[row][col];
        
        if (this.selectedPiece) {
            if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
                this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            }
            this.selectedPiece = null;
            this.selectedSquare = null;
            this.clearHighlights();
        } else if (piece && piece.color === this.currentPlayer) {
            this.selectedPiece = piece;
            this.selectedSquare = { row, col };
            this.showValidMoves(row, col);
        }
    }
    
    showValidMoves(fromRow, fromCol) {
        this.clearHighlights();
        
        // Highlight selected square
        const selectedSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        selectedSquare.classList.add('selected');
        
        // Show valid moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(fromRow, fromCol, row, col)) {
                    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (this.board[row][col]) {
                        square.classList.add('valid-capture');
                    } else {
                        square.classList.add('valid-move');
                    }
                }
            }
        }
    }
    
    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'valid-capture');
        });
    }
    
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        // Can't capture own pieces
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        // Check piece-specific movement rules
        let isValid = false;
        
        switch (piece.type) {
            case 'P':
                isValid = this.isValidPawnMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'N':
                isValid = this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'B':
                isValid = this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'R':
                isValid = this.isValidRookMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'Q':
                isValid = this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'K':
                isValid = this.isValidKingMove(fromRow, fromCol, toRow, toCol);
                break;
        }
        
        if (!isValid) return false;
        
        // Check if move would leave king in check
        return !this.wouldBeInCheck(fromRow, fromCol, toRow, toCol);
    }
    
    isValidPawnMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        // Forward move
        if (fromCol === toCol) {
            if (toRow === fromRow + direction && !this.board[toRow][toCol]) {
                return true;
            }
            if (fromRow === startRow && toRow === fromRow + 2 * direction && 
                !this.board[fromRow + direction][fromCol] && !this.board[toRow][toCol]) {
                return true;
            }
        }
        
        // Capture
        if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
            if (this.board[toRow][toCol] && this.board[toRow][toCol].color !== piece.color) {
                return true;
            }
            // En passant
            if (this.enPassantTarget && this.enPassantTarget.row === toRow && this.enPassantTarget.col === toCol) {
                return true;
            }
        }
        
        return false;
    }
    
    isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }
    
    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        
        const rowDir = toRow > fromRow ? 1 : -1;
        const colDir = toCol > fromCol ? 1 : -1;
        
        for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
            if (this.board[fromRow + i * rowDir][fromCol + i * colDir]) return false;
        }
        
        return true;
    }
    
    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        
        if (fromRow === toRow) {
            const start = Math.min(fromCol, toCol) + 1;
            const end = Math.max(fromCol, toCol);
            for (let col = start; col < end; col++) {
                if (this.board[fromRow][col]) return false;
            }
        } else {
            const start = Math.min(fromRow, toRow) + 1;
            const end = Math.max(fromRow, toRow);
            for (let row = start; row < end; row++) {
                if (this.board[row][fromCol]) return false;
            }
        }
        
        return true;
    }
    
    isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidBishopMove(fromRow, fromCol, toRow, toCol) ||
               this.isValidRookMove(fromRow, fromCol, toRow, toCol);
    }
    
    isValidKingMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // Normal king move
        if (rowDiff <= 1 && colDiff <= 1) return true;
        
        // Castling
        if (rowDiff === 0 && colDiff === 2) {
            return this.canCastle(fromRow, fromCol, toRow, toCol);
        }
        
        return false;
    }
    
    canCastle(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (piece.type !== 'K' || this.isCheck) return false;
        
        const kingside = toCol > fromCol;
        const rookCol = kingside ? 7 : 0;
        const rook = this.board[fromRow][rookCol];
        
        if (!rook || rook.type !== 'R' || rook.color !== piece.color) return false;
        if (!this.castlingRights[piece.color][kingside ? 'kingside' : 'queenside']) return false;
        
        // Check if path is clear
        const start = Math.min(fromCol, rookCol) + 1;
        const end = Math.max(fromCol, rookCol);
        for (let col = start; col < end; col++) {
            if (this.board[fromRow][col]) return false;
        }
        
        // Check if king passes through check
        const kingPath = kingside ? [fromCol + 1, fromCol + 2] : [fromCol - 1, fromCol - 2];
        for (const col of kingPath) {
            if (this.wouldBeInCheck(fromRow, fromCol, fromRow, col)) return false;
        }
        
        return true;
    }
    
    wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
        // Make temporary move
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];
        
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;
        
        const inCheck = this.isKingInCheck(movingPiece.color);
        
        // Undo move
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;
        
        return inCheck;
    }
    
    isKingInCheck(color) {
        // Find king position
        let kingRow = -1, kingCol = -1;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'K' && piece.color === color) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== -1) break;
        }
        
        // Check if any enemy piece can attack the king
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color !== color) {
                    if (this.canAttack(row, col, kingRow, kingCol)) return true;
                }
            }
        }
        
        return false;
    }
    
    canAttack(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        // Temporarily remove target to check if path is clear
        const originalTarget = this.board[toRow][toCol];
        this.board[toRow][toCol] = null;
        
        let canAttack = false;
        
        switch (piece.type) {
            case 'P':
                const direction = piece.color === 'white' ? -1 : 1;
                canAttack = Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction;
                break;
            case 'N':
                canAttack = this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'B':
                canAttack = this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'R':
                canAttack = this.isValidRookMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'Q':
                canAttack = this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
                break;
            case 'K':
                const rowDiff = Math.abs(toRow - fromRow);
                const colDiff = Math.abs(toCol - fromCol);
                canAttack = rowDiff <= 1 && colDiff <= 1;
                break;
        }
        
        // Restore target
        this.board[toRow][toCol] = originalTarget;
        
        return canAttack;
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Handle capture
        if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece.type);
        }
        
        // Handle en passant capture
        if (piece.type === 'P' && this.enPassantTarget && 
            toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            const capturedPawn = this.board[fromRow][toCol];
            this.capturedPieces[capturedPawn.color].push(capturedPawn.type);
            this.board[fromRow][toCol] = null;
        }
        
        // Update en passant target
        this.enPassantTarget = null;
        if (piece.type === 'P' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = {
                row: (fromRow + toRow) / 2,
                col: fromCol
            };
        }
        
        // Handle castling
        if (piece.type === 'K' && Math.abs(toCol - fromCol) === 2) {
            const kingside = toCol > fromCol;
            const rookFromCol = kingside ? 7 : 0;
            const rookToCol = kingside ? toCol - 1 : toCol + 1;
            
            this.board[fromRow][rookToCol] = this.board[fromRow][rookFromCol];
            this.board[fromRow][rookFromCol] = null;
        }
        
        // Update castling rights
        if (piece.type === 'K') {
            this.castlingRights[piece.color].kingside = false;
            this.castlingRights[piece.color].queenside = false;
        }
        if (piece.type === 'R') {
            if (fromCol === 0) this.castlingRights[piece.color].queenside = false;
            if (fromCol === 7) this.castlingRights[piece.color].kingside = false;
        }
        
        // Make the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Store move in history
        this.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece,
            captured: capturedPiece,
            notation: this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece)
        });
        
        // Check for pawn promotion
        if (piece.type === 'P' && (toRow === 0 || toRow === 7)) {
            this.promotionPending = { row: toRow, col: toCol, color: piece.color };
            this.showPromotionModal();
            return;
        }
        
        this.finishTurn();
    }
    
    showPromotionModal() {
        const modal = document.getElementById('promotionModal');
        const pieces = modal.querySelectorAll('.promotion-piece');
        const color = this.promotionPending.color;
        
        pieces.forEach(btn => {
            const piece = btn.dataset.piece;
            btn.textContent = this.pieces[color === 'white' ? piece.toUpperCase() : piece];
        });
        
        modal.classList.add('active');
    }
    
    completePromotion(pieceType) {
        const { row, col, color } = this.promotionPending;
        this.board[row][col] = { type: pieceType.toUpperCase(), color };
        
        document.getElementById('promotionModal').classList.remove('active');
        this.promotionPending = null;
        
        this.finishTurn();
    }
    
    finishTurn() {
        // Switch players
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check game state
        this.isCheck = this.isKingInCheck(this.currentPlayer);
        this.isCheckmate = this.isCheckmate || this.isCheck && !this.hasValidMoves();
        this.isStalemate = !this.isCheck && !this.hasValidMoves();
        
        // Update UI
        this.renderBoard();
        this.updateUI();
        
        // Check for game over
        if (this.isCheckmate || this.isStalemate) {
            this.endGame();
            return;
        }
        
        // AI move if in AI mode and it's black's turn
        if (this.gameMode === 'ai' && this.currentPlayer === 'black' && !this.isAiThinking) {
            this.isAiThinking = true;
            setTimeout(() => this.makeAiMove(), 300);
        }
    }
    
    hasValidMoves() {
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece.color === this.currentPlayer) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
    
    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        const pieceSymbol = piece.type === 'P' ? '' : piece.type;
        const captureSymbol = captured ? 'x' : '';
        const from = piece.type === 'P' && captured ? files[fromCol] : '';
        const to = files[toCol] + ranks[toRow];
        
        return pieceSymbol + from + captureSymbol + to;
    }
    
    updateUI() {
        // Update turn indicator
        const turnPiece = document.getElementById('turnPiece');
        const turnText = document.getElementById('turnText');
        turnPiece.textContent = this.currentPlayer === 'white' ? '♔' : '♚';
        turnText.textContent = this.currentPlayer === 'white' ? 'White' : 'Black';
        
        // Update game status
        const statusElement = document.getElementById('gameStatus');
        if (this.isCheckmate) {
            statusElement.textContent = `Checkmate! ${this.currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
            statusElement.className = 'game-status checkmate';
        } else if (this.isStalemate) {
            statusElement.textContent = 'Stalemate! Draw!';
            statusElement.className = 'game-status stalemate';
        } else if (this.isCheck) {
            statusElement.textContent = 'Check!';
            statusElement.className = 'game-status check';
        } else {
            statusElement.textContent = 'Game in Progress';
            statusElement.className = 'game-status';
        }
        
        // Update captured pieces
        this.updateCapturedPieces();
        
        // Update move history
        this.updateMoveHistory();
        
        // Highlight king in check
        if (this.isCheck) {
            this.highlightKingInCheck();
        }
        
        // Update button states
        document.getElementById('undoBtn').disabled = this.moveHistory.length === 0;
    }
    
    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('whiteCaptured');
        const blackCaptured = document.getElementById('blackCaptured');
        
        whiteCaptured.innerHTML = '';
        blackCaptured.innerHTML = '';
        
        this.capturedPieces.white.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'captured-piece';
            pieceElement.textContent = this.pieces[piece];
            whiteCaptured.appendChild(pieceElement);
        });
        
        this.capturedPieces.black.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'captured-piece';
            pieceElement.textContent = this.pieces[piece.toLowerCase()];
            blackCaptured.appendChild(pieceElement);
        });
    }
    
    updateMoveHistory() {
        const moveList = document.getElementById('moveList');
        moveList.innerHTML = '';
        
        this.moveHistory.forEach((move, index) => {
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            
            const moveNumber = Math.floor(index / 2) + 1;
            const isWhite = index % 2 === 0;
            
            moveItem.innerHTML = `
                <span class="move-number">${moveNumber}.</span>
                <span class="move-notation">${isWhite ? move.notation : ''}</span>
            `;
            
            if (!isWhite) {
                const previousItem = moveList.lastElementChild;
                if (previousItem) {
                    previousItem.querySelector('.move-notation').textContent += ' ' + move.notation;
                }
            } else {
                moveList.appendChild(moveItem);
            }
        });
        
        moveList.scrollTop = moveList.scrollHeight;
    }
    
    highlightKingInCheck() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'K' && piece.color === this.currentPlayer) {
                    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    square.classList.add('check');
                    return;
                }
            }
        }
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        // This is a simplified undo - in a full implementation, you'd need to restore the complete game state
        this.moveHistory.pop();
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // For now, just restart the game (simplified)
        this.newGame();
    }
    
    resign() {
        const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
        this.showGameOver(`Resignation! ${winner} wins!`);
    }
    
    endGame() {
        if (this.isCheckmate) {
            const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
            this.showGameOver(`Checkmate! ${winner} wins!`);
        } else if (this.isStalemate) {
            this.showGameOver('Stalemate! Draw!');
        }
    }
    
    showGameOver(message) {
        document.getElementById('gameOverTitle').textContent = 'Game Over';
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverModal').classList.add('active');
    }
    
    newGame() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.isCheck = false;
        this.isCheckmate = false;
        this.isStalemate = false;
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.lastMove = null;
        this.promotionPending = null;
        this.isAiThinking = false;
        
        this.setupBoard();
        this.renderBoard();
        this.updateUI();
    }
    
    evaluateBoard() {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const value = this.pieceValues[piece.type];
                    const positionBonus = this.positionBonus[row][col];
                    
                    if (piece.color === 'white') {
                        score += value + positionBonus;
                    } else {
                        score -= value + positionBonus;
                    }
                }
            }
        }
        
        return score;
    }
    
    getAllValidMoves(color) {
        const moves = [];
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                moves.push({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }
    
    minimax(depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return this.evaluateBoard();
        }
        
        const color = isMaximizing ? 'black' : 'white';
        const moves = this.getAllValidMoves(color);
        
        if (moves.length === 0) {
            if (this.isKingInCheck(color)) {
                return isMaximizing ? -100000 : 100000;
            }
            return 0;
        }
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const capturedPiece = this.board[move.to.row][move.to.col];
                const movingPiece = this.board[move.from.row][move.from.col];
                
                this.board[move.to.row][move.to.col] = movingPiece;
                this.board[move.from.row][move.from.col] = null;
                
                const evalScore = this.minimax(depth - 1, alpha, beta, false);
                
                this.board[move.from.row][move.from.col] = movingPiece;
                this.board[move.to.row][move.to.col] = capturedPiece;
                
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const capturedPiece = this.board[move.to.row][move.to.col];
                const movingPiece = this.board[move.from.row][move.from.col];
                
                this.board[move.to.row][move.to.col] = movingPiece;
                this.board[move.from.row][move.from.col] = null;
                
                const evalScore = this.minimax(depth - 1, alpha, beta, true);
                
                this.board[move.from.row][move.from.col] = movingPiece;
                this.board[move.to.row][move.to.col] = capturedPiece;
                
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }
    
    makeAiMove() {
        const moves = this.getAllValidMoves('black');
        if (moves.length === 0) return;
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const capturedPiece = this.board[move.to.row][move.to.col];
            const movingPiece = this.board[move.from.row][move.from.col];
            
            this.board[move.to.row][move.to.col] = movingPiece;
            this.board[move.from.row][move.from.col] = null;
            
            const score = this.minimax(this.aiDifficulty - 1, -Infinity, Infinity, false);
            
            this.board[move.from.row][move.from.col] = movingPiece;
            this.board[move.to.row][move.to.col] = capturedPiece;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        if (bestMove) {
            this.makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
        }
        
        this.isAiThinking = false;
    }
}

const chessGame = new ChessGame();
