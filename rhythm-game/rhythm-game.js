class RhythmGame {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.missNotes = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSong = null;
        this.currentDifficulty = 'medium';
        this.beatNotes = [];
        this.gameSpeed = 2;
        this.noteGenerationTimer = null;
        this.gameLoopTimer = null;
        this.audioContext = null;
        this.metronomeInterval = null;
        
        this.songs = {
            electronic: {
                name: 'Electronic Beat',
                bpm: 120,
                pattern: [0, 1, 2, 3, 0, 2, 1, 3, 0, 1, 1, 2, 3, 3, 0, 2],
                duration: 60
            },
            rock: {
                name: 'Rock Anthem',
                bpm: 140,
                pattern: [0, 0, 1, 2, 3, 1, 2, 3, 0, 2, 1, 3, 0, 1, 2, 3],
                duration: 45
            },
            classical: {
                name: 'Classical Symphony',
                bpm: 100,
                pattern: [0, 2, 1, 3, 0, 1, 2, 3, 2, 0, 3, 1, 0, 2, 1, 3],
                duration: 80
            }
        };
        
        this.difficulties = {
            easy: { speed: 1.5, noteInterval: 800, hitWindow: 150 },
            medium: { speed: 2, noteInterval: 600, hitWindow: 120 },
            hard: { speed: 2.5, noteInterval: 400, hitWindow: 100 }
        };
        
        this.keyBindings = {
            'd': 0,
            'f': 1,
            'j': 2,
            'k': 3
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupAudioContext();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('active');
            this.resetGame();
            this.startGame();
        });
        
        document.getElementById('songSelect').addEventListener('change', (e) => {
            this.currentSong = e.target.value;
        });
        
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
        });
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.addEventListener('keyup', (e) => this.handleKeyRelease(e));
        
        // Mobile touch controls
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        const laneButtons = document.querySelectorAll('.lane-btn');
        
        laneButtons.forEach(btn => {
            const lane = parseInt(btn.dataset.lane);
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.isPlaying && !this.isPaused) {
                    this.hitNote(lane);
                    this.animateLaneKey(lane, true);
                }
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.animateLaneKey(lane, false);
            });
            
            // Mouse fallback for testing
            btn.addEventListener('mousedown', (e) => {
                if (this.isPlaying && !this.isPaused) {
                    this.hitNote(lane);
                    this.animateLaneKey(lane, true);
                }
            });
            
            btn.addEventListener('mouseup', (e) => {
                this.animateLaneKey(lane, false);
            });
            
            btn.addEventListener('mouseleave', (e) => {
                this.animateLaneKey(lane, false);
            });
        });
    }
    
    setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    playMetronomeTick() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    playHitSound(judgment) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch(judgment) {
            case 'perfect':
                oscillator.frequency.value = 1200;
                break;
            case 'great':
                oscillator.frequency.value = 1000;
                break;
            case 'good':
                oscillator.frequency.value = 800;
                break;
            case 'miss':
                oscillator.frequency.value = 400;
                break;
        }
        
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    handleKeyPress(e) {
        if (!this.isPlaying || this.isPaused) return;
        
        const key = e.key.toLowerCase();
        if (this.keyBindings.hasOwnProperty(key)) {
            e.preventDefault();
            const lane = this.keyBindings[key];
            this.hitNote(lane);
            this.animateLaneKey(lane, true);
        }
    }
    
    handleKeyRelease(e) {
        const key = e.key.toLowerCase();
        if (this.keyBindings.hasOwnProperty(key)) {
            const lane = this.keyBindings[key];
            this.animateLaneKey(lane, false);
        }
    }
    
    animateLaneKey(lane, active) {
        const laneKey = document.querySelector(`.track[data-lane="${lane}"] .lane-key`);
        if (active) {
            laneKey.classList.add('active');
        } else {
            laneKey.classList.remove('active');
        }
    }
    
    startGame() {
        if (this.isPlaying) return;
        
        this.currentSong = document.getElementById('songSelect').value;
        this.currentDifficulty = document.getElementById('difficultySelect').value;
        
        const difficulty = this.difficulties[this.currentDifficulty];
        this.gameSpeed = difficulty.speed;
        
        this.isPlaying = true;
        this.isPaused = false;
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('songSelect').disabled = true;
        document.getElementById('difficultySelect').disabled = true;
        
        this.startMetronome();
        this.startNoteGeneration();
        this.startGameLoop();
    }
    
    startMetronome() {
        const song = this.songs[this.currentSong];
        const interval = 60000 / song.bpm;
        
        this.metronomeInterval = setInterval(() => {
            if (!this.isPaused) {
                this.playMetronomeTick();
            }
        }, interval);
    }
    
    startNoteGeneration() {
        const song = this.songs[this.currentSong];
        const difficulty = this.difficulties[this.currentDifficulty];
        const beatInterval = 60000 / song.bpm;
        
        let patternIndex = 0;
        
        this.noteGenerationTimer = setInterval(() => {
            if (!this.isPaused && patternIndex < song.pattern.length) {
                const lane = song.pattern[patternIndex];
                this.generateBeatNote(lane);
                patternIndex++;
                
                if (patternIndex >= song.pattern.length) {
                    patternIndex = 0;
                }
            }
        }, beatInterval);
        
        setTimeout(() => {
            this.endGame();
        }, song.duration * 1000);
    }
    
    generateBeatNote(lane) {
        const note = {
            lane: lane,
            position: -50,
            hit: false,
            missed: false,
            element: null
        };
        
        const noteElement = document.createElement('div');
        noteElement.className = 'beat-note';
        noteElement.style.top = '-50px';
        
        const track = document.querySelector(`.track[data-lane="${lane}"]`);
        track.appendChild(noteElement);
        
        note.element = noteElement;
        this.beatNotes.push(note);
        this.totalNotes++;
    }
    
    startGameLoop() {
        this.gameLoopTimer = setInterval(() => {
            if (!this.isPaused) {
                this.updateNotes();
                this.checkMissedNotes();
            }
        }, 1000 / 60);
    }
    
    updateNotes() {
        this.beatNotes.forEach(note => {
            if (!note.hit && !note.missed) {
                note.position += this.gameSpeed;
                note.element.style.top = note.position + 'px';
            }
        });
        
        this.beatNotes = this.beatNotes.filter(note => {
            if (note.position > window.innerHeight) {
                if (note.element) {
                    note.element.remove();
                }
                return false;
            }
            return true;
        });
    }
    
    checkMissedNotes() {
        this.beatNotes.forEach(note => {
            if (!note.hit && !note.missed && note.position > 600) {
                note.missed = true;
                this.missNotes++;
                this.combo = 0;
                this.showJudgment('miss');
                this.playHitSound('miss');
                this.createHitEffect(note.lane, 'miss');
                this.updateDisplay();
            }
        });
    }
    
    hitNote(lane) {
        const difficulty = this.difficulties[this.currentDifficulty];
        const hitZonePosition = 500;
        const hitWindow = difficulty.hitWindow;
        
        const notesInLane = this.beatNotes.filter(note => 
            note.lane === lane && !note.hit && !note.missed
        );
        
        if (notesInLane.length === 0) return;
        
        const closestNote = notesInLane.reduce((closest, note) => {
            const closestDistance = Math.abs(closest.position - hitZonePosition);
            const noteDistance = Math.abs(note.position - hitZonePosition);
            return noteDistance < closestDistance ? note : closest;
        });
        
        const distance = Math.abs(closestNote.position - hitZonePosition);
        
        if (distance <= hitWindow) {
            closestNote.hit = true;
            this.hitNotes++;
            
            let judgment;
            if (distance <= hitWindow * 0.3) {
                judgment = 'perfect';
                this.perfectHits++;
                this.score += 300;
                this.combo++;
            } else if (distance <= hitWindow * 0.6) {
                judgment = 'great';
                this.greatHits++;
                this.score += 200;
                this.combo++;
            } else {
                judgment = 'good';
                this.goodHits++;
                this.score += 100;
                this.combo++;
            }
            
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
            
            this.showJudgment(judgment);
            this.playHitSound(judgment);
            this.createHitEffect(lane, judgment);
            this.animateNoteHit(closestNote, judgment);
            this.updateDisplay();
        }
    }
    
    animateNoteHit(note, judgment) {
        note.element.classList.add(judgment);
        setTimeout(() => {
            if (note.element) {
                note.element.remove();
            }
        }, 200);
    }
    
    createHitEffect(lane, judgment) {
        const effect = document.createElement('div');
        effect.className = `hit-effect ${judgment}`;
        
        const track = document.querySelector(`.track[data-lane="${lane}"]`);
        const hitZone = track.querySelector('.hit-zone');
        
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        
        hitZone.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 500);
    }
    
    showJudgment(judgment) {
        const display = document.getElementById('judgmentDisplay');
        display.className = `judgment-display ${judgment}`;
        display.textContent = judgment.toUpperCase();
        display.classList.add('show');
        
        setTimeout(() => {
            display.classList.remove('show');
        }, 500);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
    endGame() {
        this.isPlaying = false;
        
        clearInterval(this.noteGenerationTimer);
        clearInterval(this.gameLoopTimer);
        clearInterval(this.metronomeInterval);
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('songSelect').disabled = false;
        document.getElementById('difficultySelect').disabled = false;
        
        this.showGameOverModal();
    }
    
    showGameOverModal() {
        const accuracy = this.totalNotes > 0 ? 
            Math.round((this.hitNotes / this.totalNotes) * 100) : 0;
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('maxCombo').textContent = this.maxCombo + 'x';
        document.getElementById('finalAccuracy').textContent = accuracy + '%';
        document.getElementById('perfectHits').textContent = this.perfectHits;
        
        document.getElementById('gameOverModal').classList.add('active');
    }
    
    resetGame() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.missNotes = 0;
        this.isPlaying = false;
        this.isPaused = false;
        
        clearInterval(this.noteGenerationTimer);
        clearInterval(this.gameLoopTimer);
        clearInterval(this.metronomeInterval);
        
        this.beatNotes.forEach(note => {
            if (note.element) {
                note.element.remove();
            }
        });
        this.beatNotes = [];
        
        document.querySelectorAll('.hit-effect').forEach(effect => effect.remove());
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('songSelect').disabled = false;
        document.getElementById('difficultySelect').disabled = false;
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.combo + 'x';
        
        const accuracy = this.totalNotes > 0 ? 
            Math.round((this.hitNotes / this.totalNotes) * 100) : 100;
        document.getElementById('accuracy').textContent = accuracy + '%';
    }
}

const game = new RhythmGame();
