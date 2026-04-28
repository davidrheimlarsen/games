class RacingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.miniMapCanvas = document.getElementById('miniMapCanvas');
        this.miniMapCtx = this.miniMapCanvas.getContext('2d');
        
        this.gameState = 'menu';
        this.isPaused = false;
        this.currentVehicle = 'sports';
        this.currentTrack = 'circuit';
        this.currentDifficulty = 'easy';
        
        this.player = null;
        this.vehicles = [];
        this.checkpoints = [];
        this.track = null;
        
        this.lapCount = 3;
        this.currentLap = 1;
        this.lapStartTime = 0;
        this.bestLapTime = null;
        this.raceStartTime = 0;
        this.totalRaceTime = 0;
        
        this.keys = {};
        this.animationId = null;
        
        this.vehiclesConfig = {
            sports: {
                name: 'Sports Car',
                color: '#ef4444',
                maxSpeed: 8,
                acceleration: 0.3,
                handling: 0.08,
                braking: 0.2,
                size: { width: 30, height: 20 }
            },
            racing: {
                name: 'Racing Car',
                color: '#3b82f6',
                maxSpeed: 10,
                acceleration: 0.25,
                handling: 0.1,
                braking: 0.25,
                size: { width: 28, height: 18 }
            },
            muscle: {
                name: 'Muscle Car',
                color: '#f59e0b',
                maxSpeed: 7,
                acceleration: 0.4,
                handling: 0.06,
                braking: 0.15,
                size: { width: 32, height: 22 }
            }
        };
        
        this.tracks = {
            circuit: {
                name: 'Circuit',
                checkpoints: [
                    { x: 400, y: 100, width: 100, height: 20, angle: 0 },
                    { x: 700, y: 300, width: 20, height: 100, angle: Math.PI / 2 },
                    { x: 400, y: 500, width: 100, height: 20, angle: Math.PI },
                    { x: 100, y: 300, width: 20, height: 100, angle: -Math.PI / 2 }
                ],
                startFinish: { x: 400, y: 100, width: 100, height: 20 }
            },
            oval: {
                name: 'Oval',
                checkpoints: [
                    { x: 400, y: 100, width: 150, height: 20, angle: 0 },
                    { x: 700, y: 300, width: 20, height: 150, angle: Math.PI / 2 },
                    { x: 400, y: 500, width: 150, height: 20, angle: Math.PI },
                    { x: 100, y: 300, width: 20, height: 150, angle: -Math.PI / 2 }
                ],
                startFinish: { x: 400, y: 100, width: 150, height: 20 }
            },
            figure8: {
                name: 'Figure 8',
                checkpoints: [
                    { x: 300, y: 200, width: 80, height: 20, angle: 0 },
                    { x: 500, y: 200, width: 80, height: 20, angle: Math.PI },
                    { x: 400, y: 300, width: 20, height: 80, angle: Math.PI / 2 },
                    { x: 400, y: 400, width: 20, height: 80, angle: -Math.PI / 2 },
                    { x: 200, y: 350, width: 80, height: 20, angle: 0 },
                    { x: 600, y: 350, width: 80, height: 20, angle: Math.PI }
                ],
                startFinish: { x: 300, y: 200, width: 80, height: 20 }
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCanvas();
    }
    
    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.miniMapCanvas.width = 120;
        this.miniMapCanvas.height = 120;
    }
    
    setupEventListeners() {
        // Menu interactions
        document.querySelectorAll('.vehicle-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.currentVehicle = card.dataset.vehicle;
            });
        });
        
        document.querySelectorAll('.track-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTrack = btn.dataset.track;
            });
        });
        
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentDifficulty = btn.dataset.difficulty;
            });
        });
        
        document.getElementById('startRaceBtn').addEventListener('click', () => this.startRace());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeRace());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartRace());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('raceAgainBtn').addEventListener('click', () => this.raceAgain());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.quitToMenu());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ' && this.gameState === 'playing') {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    startRace() {
        document.getElementById('menuScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.add('active');
        
        this.initializeRace();
        this.showCountdown();
    }
    
    initializeRace() {
        const vehicleConfig = this.vehiclesConfig[this.currentVehicle];
        const trackConfig = this.tracks[this.currentTrack];
        
        // Create player vehicle
        this.player = {
            x: trackConfig.startFinish.x,
            y: trackConfig.startFinish.y + 50,
            angle: 0,
            speed: 0,
            maxSpeed: vehicleConfig.maxSpeed,
            acceleration: vehicleConfig.acceleration,
            handling: vehicleConfig.handling,
            braking: vehicleConfig.braking,
            color: vehicleConfig.color,
            size: vehicleConfig.size,
            currentCheckpoint: 0,
            lap: 0,
            lapTimes: [],
            isPlayer: true,
            finished: false,
            finishTime: 0
        };
        
        // Create AI opponents
        this.vehicles = [this.player];
        const aiCount = this.currentDifficulty === 'easy' ? 2 : this.currentDifficulty === 'medium' ? 3 : 4;
        const aiColors = ['#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
        
        // Difficulty-based AI performance modifiers
        const difficultyModifiers = {
            easy: {
                speedMultiplier: 0.6,      // 60% of player speed
                accelerationMultiplier: 0.7, // 70% of player acceleration  
                handlingMultiplier: 0.8,     // 80% of player handling
                aiSpeedMultiplier: 0.6       // Slower reaction time
            },
            medium: {
                speedMultiplier: 0.8,       // 80% of player speed
                accelerationMultiplier: 0.85, // 85% of player acceleration
                handlingMultiplier: 0.9,      // 90% of player handling
                aiSpeedMultiplier: 0.8       // Moderate reaction time
            },
            hard: {
                speedMultiplier: 1.0,        // Same as player speed
                accelerationMultiplier: 1.0, // Same as player acceleration
                handlingMultiplier: 1.0,     // Same as player handling
                aiSpeedMultiplier: 1.0       // Fast reaction time
            }
        };
        
        const modifiers = difficultyModifiers[this.currentDifficulty];
        
        for (let i = 0; i < aiCount; i++) {
            const aiVehicle = {
                x: trackConfig.startFinish.x - 30 + (i * 20),
                y: trackConfig.startFinish.y + 50,
                angle: 0,
                speed: 0,
                maxSpeed: vehicleConfig.maxSpeed * modifiers.speedMultiplier * (0.9 + Math.random() * 0.2),
                acceleration: vehicleConfig.acceleration * modifiers.accelerationMultiplier * (0.9 + Math.random() * 0.2),
                handling: vehicleConfig.handling * modifiers.handlingMultiplier * (0.9 + Math.random() * 0.2),
                braking: vehicleConfig.braking * (0.9 + Math.random() * 0.2),
                color: aiColors[i],
                size: vehicleConfig.size,
                currentCheckpoint: 0,
                lap: 0,
                lapTimes: [],
                isPlayer: false,
                finished: false,
                finishTime: 0,
                aiTarget: null,
                aiSpeed: (0.3 + Math.random() * 0.3) * modifiers.aiSpeedMultiplier
            };
            this.vehicles.push(aiVehicle);
        }
        
        this.checkpoints = trackConfig.checkpoints;
        this.track = trackConfig;
        
        this.currentLap = 1;
        this.lapStartTime = Date.now();
        this.raceStartTime = Date.now();
        this.bestLapTime = null;
    }
    
    showCountdown() {
        const countdownEl = document.getElementById('countdown');
        const countdownNumber = document.getElementById('countdownNumber');
        countdownEl.classList.add('active');
        
        let count = 3;
        countdownNumber.textContent = count;
        
        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
                countdownNumber.style.animation = 'none';
                setTimeout(() => {
                    countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
                }, 10);
            } else if (count === 0) {
                countdownNumber.textContent = 'GO!';
                countdownNumber.style.color = '#10b981';
            } else {
                clearInterval(countInterval);
                countdownEl.classList.remove('active');
                this.gameState = 'playing';
                this.gameLoop();
            }
        }, 1000);
    }
    
    gameLoop() {
        if (this.gameState !== 'playing' || this.isPaused) return;
        
        this.update();
        this.render();
        this.updateUI();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update player
        this.updateVehicle(this.player);
        
        // Update AI vehicles
        this.vehicles.forEach(vehicle => {
            if (!vehicle.isPlayer) {
                this.updateAI(vehicle);
            }
        });
        
        // Check checkpoints and laps
        this.vehicles.forEach(vehicle => {
            this.checkCheckpoints(vehicle);
            this.checkRaceCompletion(vehicle);
        });
    }
    
    updateVehicle(vehicle) {
        // Handle input for player
        if (vehicle.isPlayer) {
            if (this.keys['ArrowUp']) {
                vehicle.speed = Math.min(vehicle.speed + vehicle.acceleration, vehicle.maxSpeed);
            } else if (this.keys['ArrowDown']) {
                vehicle.speed = Math.max(vehicle.speed - vehicle.braking, -vehicle.maxSpeed / 2);
            } else {
                vehicle.speed *= 0.95;
            }
            
            if (this.keys['ArrowLeft']) {
                vehicle.angle -= vehicle.handling * (vehicle.speed / vehicle.maxSpeed);
            }
            if (this.keys['ArrowRight']) {
                vehicle.angle += vehicle.handling * (vehicle.speed / vehicle.maxSpeed);
            }
        }
        
        // Update position
        vehicle.x += Math.cos(vehicle.angle) * vehicle.speed;
        vehicle.y += Math.sin(vehicle.angle) * vehicle.speed;
        
        // Keep vehicle on screen
        vehicle.x = Math.max(20, Math.min(this.canvas.width - 20, vehicle.x));
        vehicle.y = Math.max(20, Math.min(this.canvas.height - 20, vehicle.y));
        
        // Apply rails on easy mode (only for player)
        if (vehicle.isPlayer && this.currentDifficulty === 'easy') {
            this.checkTrackBounds(vehicle);
        }
    }
    
    updateAI(ai) {
        // Simple AI behavior
        const targetCheckpoint = this.checkpoints[ai.currentCheckpoint];
        const dx = targetCheckpoint.x - ai.x;
        const dy = targetCheckpoint.y - ai.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Adjust angle towards target
        let angleDiff = targetAngle - ai.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        if (Math.abs(angleDiff) > 0.1) {
            ai.angle += Math.sign(angleDiff) * ai.handling;
        }
        
        // Adjust speed
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 50) {
            ai.speed = Math.min(ai.speed + ai.acceleration * ai.aiSpeed, ai.maxSpeed);
        } else {
            ai.speed *= 0.95;
        }
        
        // Ensure AI has minimum speed to start moving and prevent getting stuck
        if (ai.speed < 1.0 && distance > 20) {
            ai.speed = 1.0;
        } else if (ai.speed < 0.1) {
            ai.speed = 1.0; // Reset speed if it gets too low
        }
        
        // Update position for AI (skip the input handling part)
        ai.x += Math.cos(ai.angle) * ai.speed;
        ai.y += Math.sin(ai.angle) * ai.speed;
        
        // Keep AI vehicle on screen
        ai.x = Math.max(20, Math.min(this.canvas.width - 20, ai.x));
        ai.y = Math.max(20, Math.min(this.canvas.height - 20, ai.y));
    }
    
    checkTrackBounds(vehicle) {
        // Define track boundaries for each track type - matching actual checkpoint positions
        const trackBounds = {
            circuit: {
                centerX: 400,
                centerY: 300,
                outerRadius: 320,  // Large enough to reach checkpoints at y=100 and y=500
                innerRadius: 80     // Small enough to not block inner area
            },
            oval: {
                centerX: 400,
                centerY: 300,
                outerRadius: 350,  // Large enough for oval checkpoints
                innerRadius: 50     // Small inner boundary
            },
            figure8: {
                // Figure 8 has two circles - adjust to match checkpoint positions
                leftCircle: { x: 300, y: 300, outerRadius: 150, innerRadius: 50 },
                rightCircle: { x: 500, y: 300, outerRadius: 150, innerRadius: 50 }
            }
        };
        
        if (this.currentTrack === 'figure8') {
            // Check if player is in either circle of figure 8
            const leftDist = Math.sqrt(Math.pow(vehicle.x - trackBounds.figure8.leftCircle.x, 2) + 
                                      Math.pow(vehicle.y - trackBounds.figure8.leftCircle.y, 2));
            const rightDist = Math.sqrt(Math.pow(vehicle.x - trackBounds.figure8.rightCircle.x, 2) + 
                                       Math.pow(vehicle.y - trackBounds.figure8.rightCircle.y, 2));
            
            // Check left circle bounds
            if (leftDist < trackBounds.figure8.leftCircle.innerRadius) {
                // Push player back to inner boundary
                const angle = Math.atan2(vehicle.y - trackBounds.figure8.leftCircle.y, 
                                       vehicle.x - trackBounds.figure8.leftCircle.x);
                vehicle.x = trackBounds.figure8.leftCircle.x + Math.cos(angle) * trackBounds.figure8.leftCircle.innerRadius;
                vehicle.y = trackBounds.figure8.leftCircle.y + Math.sin(angle) * trackBounds.figure8.leftCircle.innerRadius;
                vehicle.speed *= 0.5; // Slow down when hitting rail
            } else if (leftDist > trackBounds.figure8.leftCircle.outerRadius) {
                // Push player back to outer boundary
                const angle = Math.atan2(vehicle.y - trackBounds.figure8.leftCircle.y, 
                                       vehicle.x - trackBounds.figure8.leftCircle.x);
                vehicle.x = trackBounds.figure8.leftCircle.x + Math.cos(angle) * trackBounds.figure8.leftCircle.outerRadius;
                vehicle.y = trackBounds.figure8.leftCircle.y + Math.sin(angle) * trackBounds.figure8.leftCircle.outerRadius;
                vehicle.speed *= 0.5; // Slow down when hitting rail
            }
            
            // Check right circle bounds
            if (rightDist < trackBounds.figure8.rightCircle.innerRadius) {
                const angle = Math.atan2(vehicle.y - trackBounds.figure8.rightCircle.y, 
                                       vehicle.x - trackBounds.figure8.rightCircle.x);
                vehicle.x = trackBounds.figure8.rightCircle.x + Math.cos(angle) * trackBounds.figure8.rightCircle.innerRadius;
                vehicle.y = trackBounds.figure8.rightCircle.y + Math.sin(angle) * trackBounds.figure8.rightCircle.innerRadius;
                vehicle.speed *= 0.5;
            } else if (rightDist > trackBounds.figure8.rightCircle.outerRadius) {
                const angle = Math.atan2(vehicle.y - trackBounds.figure8.rightCircle.y, 
                                       vehicle.x - trackBounds.figure8.rightCircle.x);
                vehicle.x = trackBounds.figure8.rightCircle.x + Math.cos(angle) * trackBounds.figure8.rightCircle.outerRadius;
                vehicle.y = trackBounds.figure8.rightCircle.y + Math.sin(angle) * trackBounds.figure8.rightCircle.outerRadius;
                vehicle.speed *= 0.5;
            }
        } else {
            // Circuit and Oval tracks (circular bounds)
            const bounds = trackBounds[this.currentTrack];
            const distance = Math.sqrt(Math.pow(vehicle.x - bounds.centerX, 2) + Math.pow(vehicle.y - bounds.centerY, 2));
            
            if (distance < bounds.innerRadius) {
                // Push player back to inner boundary
                const angle = Math.atan2(vehicle.y - bounds.centerY, vehicle.x - bounds.centerX);
                vehicle.x = bounds.centerX + Math.cos(angle) * bounds.innerRadius;
                vehicle.y = bounds.centerY + Math.sin(angle) * bounds.innerRadius;
                vehicle.speed *= 0.5; // Slow down when hitting rail
            } else if (distance > bounds.outerRadius) {
                // Push player back to outer boundary
                const angle = Math.atan2(vehicle.y - bounds.centerY, vehicle.x - bounds.centerX);
                vehicle.x = bounds.centerX + Math.cos(angle) * bounds.outerRadius;
                vehicle.y = bounds.centerY + Math.sin(angle) * bounds.outerRadius;
                vehicle.speed *= 0.5; // Slow down when hitting rail
            }
        }
    }
    
    checkCheckpoints(vehicle) {
        const checkpoint = this.checkpoints[vehicle.currentCheckpoint];
        
        if (this.isInCheckpoint(vehicle, checkpoint)) {
            vehicle.currentCheckpoint = (vehicle.currentCheckpoint + 1) % this.checkpoints.length;
            
            // Check for lap completion
            if (vehicle.currentCheckpoint === 0) {
                vehicle.lap++;
                
                if (vehicle.isPlayer) {
                    const lapTime = Date.now() - this.lapStartTime;
                    vehicle.lapTimes.push(lapTime);
                    
                    if (!this.bestLapTime || lapTime < this.bestLapTime) {
                        this.bestLapTime = lapTime;
                    }
                    
                    this.currentLap = vehicle.lap + 1;
                    this.lapStartTime = Date.now();
                }
            }
        }
    }
    
    isInCheckpoint(vehicle, checkpoint) {
        const halfWidth = checkpoint.width / 2;
        const halfHeight = checkpoint.height / 2;
        
        return vehicle.x > checkpoint.x - halfWidth &&
               vehicle.x < checkpoint.x + halfWidth &&
               vehicle.y > checkpoint.y - halfHeight &&
               vehicle.y < checkpoint.y + halfHeight;
    }
    
    checkRaceCompletion(vehicle) {
        if (vehicle.lap >= this.lapCount && !vehicle.finished) {
            vehicle.finished = true;
            vehicle.finishTime = Date.now() - this.raceStartTime;
            
            if (vehicle.isPlayer) {
                this.totalRaceTime = vehicle.finishTime;
                this.endRace();
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#065f46';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw track
        this.drawTrack();
        
        // Draw checkpoints
        this.drawCheckpoints();
        
        // Draw vehicles
        this.vehicles.forEach(vehicle => {
            this.drawVehicle(vehicle);
        });
        
        // Draw minimap
        this.drawMiniMap();
    }
    
    drawTrack() {
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 100;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.checkpoints.forEach((checkpoint, index) => {
            if (index === 0) {
                this.ctx.moveTo(checkpoint.x, checkpoint.y);
            } else {
                this.ctx.lineTo(checkpoint.x, checkpoint.y);
            }
        });
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Draw track borders
        this.ctx.strokeStyle = '#1f2937';
        this.ctx.lineWidth = 110;
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 90;
        this.ctx.stroke();
        
        // Draw rails on easy mode
        if (this.currentDifficulty === 'easy') {
            this.drawRails();
        }
        
        // Draw start/finish line
        const startFinish = this.track.startFinish;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(startFinish.x - startFinish.width/2, startFinish.y - startFinish.height/2, 
                         startFinish.width, startFinish.height);
        
        // Checkered pattern
        const squareSize = 10;
        for (let i = 0; i < startFinish.width / squareSize; i++) {
            for (let j = 0; j < startFinish.height / squareSize; j++) {
                if ((i + j) % 2 === 0) {
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(startFinish.x - startFinish.width/2 + i * squareSize, 
                                   startFinish.y - startFinish.height/2 + j * squareSize, 
                                   squareSize, squareSize);
                }
            }
        }
    }
    
    drawRails() {
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        
        if (this.currentTrack === 'figure8') {
            // Draw rails for figure 8 (two circles) - updated boundaries
            // Left circle rails
            this.ctx.beginPath();
            this.ctx.arc(300, 300, 50, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(300, 300, 150, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Right circle rails
            this.ctx.beginPath();
            this.ctx.arc(500, 300, 50, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(500, 300, 150, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            // Draw rails for circuit and oval tracks - updated boundaries
            const bounds = {
                circuit: { centerX: 400, centerY: 300, outerRadius: 320, innerRadius: 80 },
                oval: { centerX: 400, centerY: 300, outerRadius: 350, innerRadius: 50 }
            };
            
            const trackBounds = bounds[this.currentTrack];
            
            // Inner rail
            this.ctx.beginPath();
            this.ctx.arc(trackBounds.centerX, trackBounds.centerY, trackBounds.innerRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Outer rail
            this.ctx.beginPath();
            this.ctx.arc(trackBounds.centerX, trackBounds.centerY, trackBounds.outerRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawCheckpoints() {
        this.checkpoints.forEach((checkpoint, index) => {
            this.ctx.strokeStyle = index === 0 ? '#10b981' : 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(checkpoint.x - checkpoint.width/2, checkpoint.y - checkpoint.height/2,
                              checkpoint.width, checkpoint.height);
            this.ctx.setLineDash([]);
        });
    }
    
    drawVehicle(vehicle) {
        this.ctx.save();
        this.ctx.translate(vehicle.x, vehicle.y);
        this.ctx.rotate(vehicle.angle);
        
        // Draw car body
        this.ctx.fillStyle = vehicle.color;
        this.ctx.fillRect(-vehicle.size.width/2, -vehicle.size.height/2, 
                         vehicle.size.width, vehicle.size.height);
        
        // Draw windshield
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-vehicle.size.width/4, -vehicle.size.height/3, 
                         vehicle.size.width/2, vehicle.size.height/1.5);
        
        // Draw player indicator
        if (vehicle.isPlayer) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-vehicle.size.width/2 - 2, -vehicle.size.height/2 - 2,
                               vehicle.size.width + 4, vehicle.size.height + 4);
        }
        
        this.ctx.restore();
    }
    
    drawMiniMap() {
        const scale = 0.15;
        
        // Clear minimap
        this.miniMapCtx.fillStyle = '#065f46';
        this.miniMapCtx.fillRect(0, 0, 120, 120);
        
        // Draw track on minimap
        this.miniMapCtx.strokeStyle = '#374151';
        this.miniMapCtx.lineWidth = 15;
        this.miniMapCtx.beginPath();
        this.checkpoints.forEach((checkpoint, index) => {
            const x = checkpoint.x * scale;
            const y = checkpoint.y * scale;
            if (index === 0) {
                this.miniMapCtx.moveTo(x, y);
            } else {
                this.miniMapCtx.lineTo(x, y);
            }
        });
        this.miniMapCtx.closePath();
        this.miniMapCtx.stroke();
        
        // Draw vehicles on minimap
        this.vehicles.forEach(vehicle => {
            this.miniMapCtx.fillStyle = vehicle.color;
            this.miniMapCtx.beginPath();
            this.miniMapCtx.arc(vehicle.x * scale, vehicle.y * scale, 3, 0, Math.PI * 2);
            this.miniMapCtx.fill();
            
            if (vehicle.isPlayer) {
                this.miniMapCtx.strokeStyle = '#ffffff';
                this.miniMapCtx.lineWidth = 1;
                this.miniMapCtx.stroke();
            }
        });
    }
    
    updateUI() {
        if (!this.player) return;
        
        // Update lap counter
        document.getElementById('currentLap').textContent = Math.min(this.player.lap + 1, this.lapCount);
        document.getElementById('totalLaps').textContent = this.lapCount;
        
        // Update lap time
        const currentLapTime = Date.now() - this.lapStartTime;
        document.getElementById('lapTime').textContent = this.formatTime(currentLapTime);
        
        // Update best lap
        if (this.bestLapTime) {
            document.getElementById('bestLap').textContent = this.formatTime(this.bestLapTime);
        }
        
        // Update position
        const position = this.vehicles.filter(v => v.lap > this.player.lap || 
                                               (v.lap === this.player.lap && v.currentCheckpoint > this.player.currentCheckpoint)).length + 1;
        document.getElementById('position').textContent = this.getOrdinal(position);
        
        // Update speed
        const speed = Math.round(Math.abs(this.player.speed) * 15);
        document.getElementById('speedValue').textContent = speed + ' mph';
        document.getElementById('speedFill').style.width = (speed / 150 * 100) + '%';
    }
    
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
    
    getOrdinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseMenu').classList.toggle('active', this.isPaused);
        
        if (!this.isPaused) {
            this.gameLoop();
        }
    }
    
    resumeRace() {
        this.isPaused = false;
        document.getElementById('pauseMenu').classList.remove('active');
        this.gameLoop();
    }
    
    restartRace() {
        cancelAnimationFrame(this.animationId);
        document.getElementById('pauseMenu').classList.remove('active');
        this.initializeRace();
        this.showCountdown();
    }
    
    quitToMenu() {
        cancelAnimationFrame(this.animationId);
        this.gameState = 'menu';
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('raceResults').classList.remove('active');
        document.getElementById('pauseMenu').classList.remove('active');
        document.getElementById('menuScreen').classList.remove('hidden');
    }
    
    raceAgain() {
        document.getElementById('raceResults').classList.remove('active');
        this.initializeRace();
        this.showCountdown();
    }
    
    endRace() {
        cancelAnimationFrame(this.animationId);
        this.gameState = 'finished';
        
        // Calculate results
        const sortedVehicles = [...this.vehicles].sort((a, b) => {
            if (a.finished && !b.finished) return -1;
            if (!a.finished && b.finished) return 1;
            if (a.finished && b.finished) return a.finishTime - b.finishTime;
            return b.lap - a.lap;
        });
        
        const playerPosition = sortedVehicles.findIndex(v => v.isPlayer) + 1;
        
        // Update results screen
        document.getElementById('finalPosition').textContent = this.getOrdinal(playerPosition);
        document.getElementById('totalTime').textContent = this.formatTime(this.totalRaceTime);
        document.getElementById('finalBestLap').textContent = this.formatTime(this.bestLapTime);
        
        // Calculate average and top speed
        const avgSpeed = Math.round(this.player.lapTimes.reduce((sum, time) => sum + (this.canvas.width * 4 / (time / 1000)), 0) / this.player.lapTimes.length);
        const topSpeed = Math.round(this.player.maxSpeed * 15);
        
        document.getElementById('avgSpeed').textContent = avgSpeed + ' mph';
        document.getElementById('topSpeed').textContent = topSpeed + ' mph';
        
        // Update leaderboard
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';
        
        sortedVehicles.forEach((vehicle, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            if (vehicle.isPlayer) item.classList.add('current');
            
            const position = this.getOrdinal(index + 1);
            const time = vehicle.finished ? this.formatTime(vehicle.finishTime) : 'DNF';
            
            item.innerHTML = `
                <span>${position} - ${vehicle.isPlayer ? 'You' : 'AI ' + index}</span>
                <span>${time}</span>
            `;
            
            leaderboardList.appendChild(item);
        });
        
        document.getElementById('raceResults').classList.add('active');
    }
}

const racingGame = new RacingGame();
