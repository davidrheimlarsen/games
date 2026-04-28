class RockPaperScissorsGame {
    constructor() {
        this.choices = {
            rock: { icon: '✊', beats: 'scissors', name: 'Rock' },
            paper: { icon: '✋', beats: 'rock', name: 'Paper' },
            scissors: { icon: '✌️', beats: 'paper', name: 'Scissors' }
        };
        
        this.currentPlayerChoice = null;
        this.currentComputerChoice = null;
        this.isProcessing = false;
        
        // Statistics
        this.stats = {
            wins: parseInt(localStorage.getItem('rps_wins') || '0'),
            draws: parseInt(localStorage.getItem('rps_draws') || '0'),
            losses: parseInt(localStorage.getItem('rps_losses') || '0'),
            streak: parseInt(localStorage.getItem('rps_streak') || '0'),
            history: JSON.parse(localStorage.getItem('rps_history') || '[]')
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateStats();
        this.loadHistory();
    }
    
    bindEvents() {
        // Choice buttons
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = btn.dataset.choice;
                this.playGame(choice);
            });
        });
        
        // Control buttons
        document.getElementById('resetStats').addEventListener('click', () => this.resetStatistics());
        document.getElementById('showHistory').addEventListener('click', () => this.showHistory());
        document.getElementById('closeHistory').addEventListener('click', () => this.hideHistory());
        
        // Close modal on outside click
        document.getElementById('historyModal').addEventListener('click', (e) => {
            if (e.target.id === 'historyModal') {
                this.hideHistory();
            }
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.isProcessing) return;
            
            switch(e.key.toLowerCase()) {
                case 'r':
                    this.playGame('rock');
                    break;
                case 'p':
                    this.playGame('paper');
                    break;
                case 's':
                    this.playGame('scissors');
                    break;
            }
        });
    }
    
    playGame(playerChoice) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.currentPlayerChoice = playerChoice;
        this.currentComputerChoice = this.getComputerChoice();
        
        // Reset displays
        this.resetDisplays();
        
        // Show player choice immediately
        this.showPlayerChoice();
        
        // Add suspense with computer choice
        setTimeout(() => {
            this.showComputerChoice();
            this.determineWinner();
            this.updateStatistics();
            this.saveToHistory();
            
            setTimeout(() => {
                this.isProcessing = false;
            }, 1000);
        }, 1000);
    }
    
    getComputerChoice() {
        const choices = Object.keys(this.choices);
        return choices[Math.floor(Math.random() * choices.length)];
    }
    
    resetDisplays() {
        // Reset choice displays
        document.getElementById('playerChoice').innerHTML = '<div class="choice-placeholder">?</div>';
        document.getElementById('computerChoice').innerHTML = '<div class="choice-placeholder">?</div>';
        document.getElementById('playerChoiceName').textContent = 'Make your choice';
        document.getElementById('computerChoiceName').textContent = 'Waiting...';
        
        // Reset result displays
        document.getElementById('resultMessage').textContent = '';
        document.getElementById('resultDetails').textContent = '';
        
        // Remove winner/loser classes
        document.querySelectorAll('.choice-display').forEach(display => {
            display.classList.remove('winner', 'loser');
        });
    }
    
    showPlayerChoice() {
        const choice = this.choices[this.currentPlayerChoice];
        const display = document.getElementById('playerChoice');
        display.innerHTML = choice.icon;
        document.getElementById('playerChoiceName').textContent = choice.name;
        
        // Add animation
        display.style.transform = 'scale(0.8)';
        setTimeout(() => {
            display.style.transform = 'scale(1)';
        }, 100);
    }
    
    showComputerChoice() {
        const choice = this.choices[this.currentComputerChoice];
        const display = document.getElementById('computerChoice');
        display.innerHTML = choice.icon;
        document.getElementById('computerChoiceName').textContent = choice.name;
        
        // Add animation
        display.style.transform = 'scale(0.8) rotate(180deg)';
        setTimeout(() => {
            display.style.transform = 'scale(1) rotate(0deg)';
        }, 100);
    }
    
    determineWinner() {
        const playerChoice = this.currentPlayerChoice;
        const computerChoice = this.currentComputerChoice;
        
        let result, message, details;
        
        if (playerChoice === computerChoice) {
            result = 'draw';
            message = "It's a Draw!";
            details = `${this.choices[playerChoice].name} ties with ${this.choices[computerChoice].name}`;
        } else if (this.choices[playerChoice].beats === computerChoice) {
            result = 'win';
            message = '🎉 You Win!';
            details = `${this.choices[playerChoice].name} beats ${this.choices[computerChoice].name}`;
        } else {
            result = 'lose';
            message = '😔 You Lose!';
            details = `${this.choices[computerChoice].name} beats ${this.choices[playerChoice].name}`;
        }
        
        // Update UI
        const resultMessage = document.getElementById('resultMessage');
        resultMessage.textContent = message;
        resultMessage.className = `result-message ${result}`;
        
        document.getElementById('resultDetails').textContent = details;
        
        // Add winner/loser indicators
        if (result === 'win') {
            document.getElementById('playerChoice').classList.add('winner');
            document.getElementById('computerChoice').classList.add('loser');
        } else if (result === 'lose') {
            document.getElementById('playerChoice').classList.add('loser');
            document.getElementById('computerChoice').classList.add('winner');
        }
        
        return result;
    }
    
    updateStatistics() {
        const result = this.determineWinner();
        
        // Update stats based on result
        if (result === 'win') {
            this.stats.wins++;
            this.stats.streak++;
        } else if (result === 'lose') {
            this.stats.losses++;
            this.stats.streak = 0;
        } else {
            this.stats.draws++;
        }
        
        this.saveStats();
        this.updateStats();
    }
    
    updateStats() {
        document.getElementById('wins').textContent = this.stats.wins;
        document.getElementById('draws').textContent = this.stats.draws;
        document.getElementById('losses').textContent = this.stats.losses;
        document.getElementById('streak').textContent = this.stats.streak;
        
        const totalGames = this.stats.wins + this.stats.draws + this.stats.losses;
        document.getElementById('totalGames').textContent = totalGames;
        
        const winRate = totalGames > 0 ? Math.round((this.stats.wins / totalGames) * 100) : 0;
        document.getElementById('winRate').textContent = `${winRate}%`;
    }
    
    saveStats() {
        localStorage.setItem('rps_wins', this.stats.wins.toString());
        localStorage.setItem('rps_draws', this.stats.draws.toString());
        localStorage.setItem('rps_losses', this.stats.losses.toString());
        localStorage.setItem('rps_streak', this.stats.streak.toString());
    }
    
    saveToHistory() {
        const historyItem = {
            playerChoice: this.currentPlayerChoice,
            computerChoice: this.currentComputerChoice,
            result: this.determineWinner(),
            timestamp: new Date().toISOString()
        };
        
        this.stats.history.unshift(historyItem);
        
        // Keep only last 20 games
        if (this.stats.history.length > 20) {
            this.stats.history = this.stats.history.slice(0, 20);
        }
        
        localStorage.setItem('rps_history', JSON.stringify(this.stats.history));
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
            
            const choicesDiv = document.createElement('div');
            choicesDiv.className = 'history-choices';
            
            const playerChoice = this.choices[item.playerChoice];
            const computerChoice = this.choices[item.computerChoice];
            
            choicesDiv.innerHTML = `
                <span class="history-choice">${playerChoice.icon}</span>
                <span>vs</span>
                <span class="history-choice">${computerChoice.icon}</span>
            `;
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'history-result';
            resultDiv.textContent = item.result;
            
            historyDiv.appendChild(choicesDiv);
            historyDiv.appendChild(resultDiv);
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
            localStorage.removeItem('rps_wins');
            localStorage.removeItem('rps_draws');
            localStorage.removeItem('rps_losses');
            localStorage.removeItem('rps_streak');
            localStorage.removeItem('rps_history');
            
            this.updateStats();
            this.loadHistory();
            
            // Reset displays
            this.resetDisplays();
            
            // Show confirmation
            const resultMessage = document.getElementById('resultMessage');
            resultMessage.textContent = 'Statistics reset successfully!';
            resultMessage.className = 'result-message';
            document.getElementById('resultDetails').textContent = 'Start playing to build new stats!';
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RockPaperScissorsGame();
});
