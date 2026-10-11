class ClickerGame {
    constructor() {
        this.currency = 0;
        this.perClick = 1;
        this.perSecond = 0;
        this.rainEnabled = false;
        this.radioEnabled = false;
        this.currentSong = 0;
        this.backgroundIndex = 0;
        this.activeCursor = 'default';
        this.audioContext = null;
        this.rainSound = null;
        this.radioSound = null;
        this.radioInterval = null;

        this.songs = [
            { 
                name: 'Morning Calm', 
                tempo: 120, 
                key: 'C',
                progression: [[0, 2, 4], [3, 5, 7], [4, 6, 8], [0, 2, 4]],
                melody: true,
                style: 'sine'
            },
            { 
                name: 'Ocean Breeze', 
                tempo: 100, 
                key: 'D',
                progression: [[0, 3, 7], [2, 5, 9], [4, 7, 11], [0, 3, 7]],
                melody: true,
                style: 'triangle'
            },
            { 
                name: 'Forest Dreams', 
                tempo: 90, 
                key: 'E',
                progression: [[0, 4, 7], [2, 6, 9], [5, 9, 12], [0, 4, 7]],
                melody: false,
                style: 'sine'
            },
            { 
                name: 'Starlight', 
                tempo: 110, 
                key: 'F',
                progression: [[0, 4, 7, 11], [3, 7, 10, 14], [5, 9, 12, 16], [0, 4, 7, 11]],
                melody: true,
                style: 'sine'
            },
            { 
                name: 'Sunset Glow', 
                tempo: 105, 
                key: 'G',
                progression: [[0, 3, 6], [2, 5, 8], [4, 7, 10], [0, 3, 6]],
                melody: true,
                style: 'triangle'
            },
            { 
                name: 'Rain Drops', 
                tempo: 95, 
                key: 'A',
                progression: [[0, 4, 7], [3, 7, 10], [5, 9, 12], [0, 4, 7]],
                melody: false,
                style: 'sine'
            },
            { 
                name: 'Mountain Peace', 
                tempo: 85, 
                key: 'B',
                progression: [[0, 5, 9], [2, 7, 11], [4, 9, 13], [0, 5, 9]],
                melody: true,
                style: 'sine'
            },
            { 
                name: 'River Flow', 
                tempo: 115, 
                key: 'C#',
                progression: [[0, 3, 7], [2, 5, 9], [4, 7, 11], [0, 3, 7]],
                melody: true,
                style: 'triangle'
            },
            { 
                name: 'Cloud Drift', 
                tempo: 100, 
                key: 'D#',
                progression: [[0, 4, 7], [3, 7, 10], [5, 9, 12], [0, 4, 7]],
                melody: false,
                style: 'sine'
            },
            { 
                name: 'Night Sky', 
                tempo: 80, 
                key: 'F#',
                progression: [[0, 4, 7, 11], [2, 6, 9, 13], [5, 9, 12, 16], [0, 4, 7, 11]],
                melody: true,
                style: 'sine'
            }
        ];

        this.clickUpgrades = [
            { id: 'click1', name: 'Better Clicking', cost: 10, effect: 1, level: 0, costMultiplier: 1.5 },
            { id: 'click2', name: 'Click Mastery', cost: 100, effect: 5, level: 0, costMultiplier: 1.6 },
            { id: 'click3', name: 'Click Expert', cost: 1000, effect: 25, level: 0, costMultiplier: 1.7 },
            { id: 'click4', name: 'Click Legend', cost: 10000, effect: 125, level: 0, costMultiplier: 1.8 },
            { id: 'click5', name: 'Click God', cost: 100000, effect: 625, level: 0, costMultiplier: 1.9 }
        ];
        this.autoUpgrades = [
            { id: 'auto1', name: 'Auto Clicker', cost: 50, effect: 1, level: 0, costMultiplier: 1.5 },
            { id: 'auto2', name: 'Farm Worker', cost: 500, effect: 5, level: 0, costMultiplier: 1.6 },
            { id: 'auto3', name: 'Factory', cost: 5000, effect: 25, level: 0, costMultiplier: 1.7 },
            { id: 'auto4', name: 'Empire', cost: 50000, effect: 125, level: 0, costMultiplier: 1.8 },
            { id: 'auto5', name: 'Universe', cost: 500000, effect: 625, level: 0, costMultiplier: 1.9 }
        ];
        this.cosmeticUpgrades = [
            { id: 'rain', name: '🌧️ Rain Effect', cost: 200, initialCost: 200, purchased: false, type: 'toggle' },
            { id: 'radio', name: '📻 Calming Radio', cost: 500, initialCost: 500, purchased: false, type: 'toggle' },
            { id: 'cursor_glitch', name: '👾 Glitched Cursor', cost: 750, initialCost: 750, purchased: false, type: 'cursor', cursor: 'glitch' },
            { id: 'cursor_cheese', name: '🧀 Cheese Cursor', cost: 1000, initialCost: 1000, purchased: false, type: 'cursor', cursor: 'cheese' },
            { id: 'cursor_fire', name: '🔥 Fire Cursor', cost: 1500, initialCost: 1500, purchased: false, type: 'cursor', cursor: 'fire' },
            { id: 'cursor_ice', name: '❄️ Ice Cursor', cost: 2000, initialCost: 2000, purchased: false, type: 'cursor', cursor: 'ice' },
            { id: 'cursor_rainbow', name: '🌈 Rainbow Cursor', cost: 3000, initialCost: 3000, purchased: false, type: 'cursor', cursor: 'rainbow' },
            { id: 'cursor_diamond', name: '💎 Diamond Cursor', cost: 5000, initialCost: 5000, purchased: false, type: 'cursor', cursor: 'diamond' },
            { id: 'bg1', name: '🎨 Sunset Theme', cost: 1000, initialCost: 1000, purchased: false, type: 'background', background: 'sunset' },
            { id: 'bg2', name: '🎨 Ocean Theme', cost: 2500, initialCost: 2500, purchased: false, type: 'background', background: 'ocean' },
            { id: 'bg3', name: '🎨 Forest Theme', cost: 5000, initialCost: 5000, purchased: false, type: 'background', background: 'forest' },
            { id: 'bg4', name: '🎨 Space Theme', cost: 10000, initialCost: 10000, purchased: false, type: 'background', background: 'space' }
        ];

        this.backgrounds = {
            default: 'radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.2) 0%, transparent 40%), linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            sunset: 'radial-gradient(circle at 30% 70%, rgba(239, 68, 68, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.4) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 40%), linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            ocean: 'radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.3) 0%, transparent 40%), linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0c4a6e 100%)',
            forest: 'radial-gradient(circle at 30% 70%, rgba(34, 197, 94, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(132, 204, 22, 0.4) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 40%), linear-gradient(135deg, #14532d 0%, #166534 50%, #14532d 100%)',
            space: 'radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.5) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.5) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.4) 0%, transparent 40%), linear-gradient(135deg, #030712 0%, #111827 50%, #030712 100%)'
        };

        this.init();
    }

    init() {
        this.loadGame();
        this.setupEventListeners();
        this.renderUpgrades();
        this.updateUI();
        this.startAutoClicker();
    }

    setupEventListeners() {
        document.getElementById('clickButton').addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('saveBtn').addEventListener('click', () => this.saveGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
    }

    handleClick(e) {
        this.currency += this.perClick;
        this.updateUI();
        this.showClickAnimation(e);
        this.checkUpgradeAvailability();
    }

    showClickAnimation(e) {
        const animation = document.createElement('div');
        animation.className = 'click-animation';
        animation.textContent = `+${this.formatNumber(this.perClick)}`;
        
        const clickArea = document.getElementById('clickAnimation');
        const rect = clickArea.getBoundingClientRect();
        
        animation.style.left = (e.clientX - rect.left) + 'px';
        animation.style.top = (e.clientY - rect.top) + 'px';
        
        clickArea.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 1000);
    }

    renderUpgrades() {
        const clickUpgradesContainer = document.getElementById('clickUpgrades');
        const autoUpgradesContainer = document.getElementById('autoUpgrades');
        const cosmeticUpgradesContainer = document.getElementById('cosmeticUpgrades');

        clickUpgradesContainer.innerHTML = '';
        autoUpgradesContainer.innerHTML = '';
        cosmeticUpgradesContainer.innerHTML = '';

        this.clickUpgrades.forEach(upgrade => {
            const element = this.createUpgradeElement(upgrade, 'click');
            clickUpgradesContainer.appendChild(element);
        });

        this.autoUpgrades.forEach(upgrade => {
            const element = this.createUpgradeElement(upgrade, 'auto');
            autoUpgradesContainer.appendChild(element);
        });

        this.cosmeticUpgrades.forEach(upgrade => {
            const element = this.createCosmeticUpgradeElement(upgrade);
            cosmeticUpgradesContainer.appendChild(element);
        });
    }

    createUpgradeElement(upgrade, type) {
        const element = document.createElement('div');
        element.className = 'upgrade-item';
        element.dataset.id = upgrade.id;
        element.dataset.type = type;

        const canAfford = this.currency >= upgrade.cost;
        if (!canAfford) {
            element.classList.add('disabled');
        }

        element.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name} <span class="upgrade-level">Lvl ${upgrade.level}</span></div>
                <div class="upgrade-cost">💰 ${this.formatNumber(upgrade.cost)}</div>
                <div class="upgrade-effect">+${this.formatNumber(upgrade.effect)} ${type === 'click' ? 'per click' : 'per second'}</div>
            </div>
        `;

        element.addEventListener('click', () => this.purchaseUpgrade(upgrade, type));

        return element;
    }

    createCosmeticUpgradeElement(upgrade) {
        const element = document.createElement('div');
        element.className = 'upgrade-item';
        element.dataset.id = upgrade.id;
        element.dataset.type = 'cosmetic';

        const canAfford = this.currency >= upgrade.cost;
        const isPurchased = upgrade.purchased;

        if (!canAfford && !isPurchased) {
            element.classList.add('disabled');
        }

        if (isPurchased) {
            element.classList.add('purchased');
        }

        let statusText, effectText, extraControls = '';
        if (isPurchased) {
            if (upgrade.id === 'radio') {
                if (this.radioEnabled) {
                    const song = this.songs[this.currentSong];
                    statusText = `🎵 ${song.name} (${this.currentSong + 1}/${this.songs.length})`;
                    effectText = 'Click card to Disable';
                    extraControls = `
                        <div class="radio-controls">
                            <button class="radio-btn prev-btn">⏮️</button>
                            <button class="radio-btn next-btn">⏭️</button>
                        </div>
                    `;
                } else {
                    statusText = '✓ Purchased';
                    effectText = 'Click to Enable';
                }
            } else if (upgrade.type === 'cursor') {
                statusText = this.activeCursor === upgrade.cursor ? '✓ Active' : '✓ Purchased';
                effectText = 'Click to Equip';
            } else {
                statusText = '✓ Purchased';
                effectText = upgrade.type === 'toggle' ? 'Click to Enable' : 'Change Background';
            }
        } else {
            statusText = '💰 ' + this.formatNumber(upgrade.cost);
            effectText = upgrade.type === 'toggle' ? 'Toggle Effect' : upgrade.type === 'cursor' ? 'Custom Cursor' : 'Change Background';
        }

        element.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-cost">${statusText}</div>
                <div class="upgrade-effect">${effectText}</div>
                ${extraControls}
            </div>
        `;

        element.addEventListener('click', (e) => {
            if (e.target.classList.contains('radio-btn')) {
                e.stopPropagation();
                if (e.target.classList.contains('prev-btn')) {
                    this.previousSong();
                } else if (e.target.classList.contains('next-btn')) {
                    this.nextSong();
                }
            } else {
                this.purchaseCosmeticUpgrade(upgrade, e);
            }
        });

        return element;
    }

    purchaseUpgrade(upgrade, type) {
        if (this.currency < upgrade.cost) return;

        const oldCost = upgrade.cost;
        this.currency -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * upgrade.costMultiplier);

        if (type === 'click') {
            this.perClick += upgrade.effect;
        } else {
            this.perSecond += upgrade.effect;
        }

        this.renderUpgrades();
        this.updateUI();
        this.saveGame();
    }

    purchaseCosmeticUpgrade(upgrade, event) {
        if (upgrade.purchased) {
            if (upgrade.type === 'toggle') {
                this.toggleCosmetic(upgrade);
            } else if (upgrade.type === 'background') {
                this.setBackground(upgrade.background);
            } else if (upgrade.type === 'cursor') {
                this.setCursor(upgrade.cursor);
            }
            return;
        }

        if (this.currency < upgrade.cost) return;

        this.currency -= upgrade.cost;
        upgrade.purchased = true;

        if (upgrade.type === 'toggle') {
            this.toggleCosmetic(upgrade);
        } else if (upgrade.type === 'background') {
            this.setBackground(upgrade.background);
        } else if (upgrade.type === 'cursor') {
            this.setCursor(upgrade.cursor);
        }

        this.renderUpgrades();
        this.updateUI();
        this.saveGame();
    }

    toggleCosmetic(upgrade) {
        if (upgrade.id === 'rain') {
            this.rainEnabled = !this.rainEnabled;
            this.toggleRain(this.rainEnabled);
        } else if (upgrade.id === 'radio') {
            this.radioEnabled = !this.radioEnabled;
            this.toggleRadio(this.radioEnabled);
        }
    }

    toggleRain(enabled) {
        let rainContainer = document.getElementById('rainContainer');
        if (enabled) {
            if (!rainContainer) {
                rainContainer = document.createElement('div');
                rainContainer.id = 'rainContainer';
                rainContainer.className = 'rain-container';
                document.body.appendChild(rainContainer);
            }
            this.createRain();
        } else {
            if (rainContainer) {
                rainContainer.remove();
            }
        }
    }

    createRain() {
        const rainContainer = document.getElementById('rainContainer');
        if (!rainContainer) return;

        const createDrop = () => {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
            rainContainer.appendChild(drop);

            setTimeout(() => {
                drop.remove();
            }, 1000);
        };

        this.rainInterval = setInterval(createDrop, 50);
    }

    toggleRadio(enabled) {
        if (enabled) {
            this.playCalmingMusic();
        } else {
            this.stopCalmingMusic();
        }
        this.renderUpgrades();
        this.saveGame();
    }

    playCalmingMusic() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        this.stopCalmingMusic();

        const song = this.songs[this.currentSong];
        const baseFrequencies = {
            'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23,
            'G': 392.00, 'A': 440.00, 'B': 493.88, 'C#': 277.18,
            'D#': 311.13, 'F#': 369.99
        };

        const getFrequency = (semitones) => {
            const baseFreq = baseFrequencies[song.key] || 261.63;
            return baseFreq * Math.pow(2, semitones / 12);
        };

        const playNote = (frequency, startTime, duration, type = song.style) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.06, startTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        let chordIndex = 0;
        const progression = song.progression;
        const chordDuration = 60 / song.tempo * 4;

        const playAmbientChord = () => {
            const now = this.audioContext.currentTime;
            const chord = progression[chordIndex % progression.length];
            
            chord.forEach((semitone, i) => {
                const freq = getFrequency(semitone);
                playNote(freq, now + i * 0.1, chordDuration);
            });

            if (song.melody) {
                const melodyNote = chord[0] + Math.floor(Math.random() * 5) + 7;
                playNote(getFrequency(melodyNote), now + chordDuration * 0.5, chordDuration * 0.4, 'sine');
            }

            chordIndex++;
        };

        this.radioInterval = setInterval(playAmbientChord, chordDuration * 1000);
        playAmbientChord();
    }

    stopCalmingMusic() {
        if (this.radioInterval) {
            clearInterval(this.radioInterval);
            this.radioInterval = null;
        }
    }

    nextSong() {
        this.currentSong = (this.currentSong + 1) % this.songs.length;
        if (this.radioEnabled) {
            this.playCalmingMusic();
        }
        this.renderUpgrades();
        this.saveGame();
    }

    previousSong() {
        this.currentSong = (this.currentSong - 1 + this.songs.length) % this.songs.length;
        if (this.radioEnabled) {
            this.playCalmingMusic();
        }
        this.renderUpgrades();
        this.saveGame();
    }

    setBackground(backgroundName) {
        this.backgroundIndex = backgroundName;
        document.body.style.background = this.backgrounds[backgroundName];
    }

    setCursor(cursorName) {
        this.activeCursor = cursorName;
        document.body.classList.remove('cursor-glitch', 'cursor-cheese', 'cursor-fire', 'cursor-ice', 'cursor-rainbow', 'cursor-diamond');
        if (cursorName !== 'default') {
            document.body.classList.add('cursor-' + cursorName);
        }
    }

    checkUpgradeAvailability() {
        document.querySelectorAll('.upgrade-item').forEach(element => {
            const id = element.dataset.id;
            const type = element.dataset.type;

            if (type === 'cosmetic') {
                const upgrade = this.cosmeticUpgrades.find(u => u.id === id);
                if (upgrade.purchased || this.currency >= upgrade.cost) {
                    element.classList.remove('disabled');
                } else {
                    element.classList.add('disabled');
                }
            } else {
                const upgrades = type === 'click' ? this.clickUpgrades : this.autoUpgrades;
                const upgrade = upgrades.find(u => u.id === id);

                if (this.currency >= upgrade.cost) {
                    element.classList.remove('disabled');
                } else {
                    element.classList.add('disabled');
                }
            }
        });
    }

    startAutoClicker() {
        setInterval(() => {
            if (this.perSecond > 0) {
                this.currency += this.perSecond;
                this.updateUI();
                this.checkUpgradeAvailability();
            }
        }, 1000);
    }

    updateUI() {
        document.getElementById('currencyAmount').textContent = this.formatNumber(this.currency);
        document.getElementById('perClick').textContent = this.formatNumber(this.perClick);
        document.getElementById('perSecond').textContent = this.formatNumber(this.perSecond);
    }

    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(2) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return Math.floor(num).toString();
    }

    saveGame() {
        const saveData = {
            currency: this.currency,
            perClick: this.perClick,
            perSecond: this.perSecond,
            rainEnabled: this.rainEnabled,
            radioEnabled: this.radioEnabled,
            currentSong: this.currentSong,
            backgroundIndex: this.backgroundIndex,
            activeCursor: this.activeCursor,
            clickUpgrades: this.clickUpgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
            autoUpgrades: this.autoUpgrades.map(u => ({ id: u.id, level: u.level, cost: u.cost })),
            cosmeticUpgrades: this.cosmeticUpgrades.map(u => ({ id: u.id, purchased: u.purchased }))
        };
        localStorage.setItem('clickerGameSave', JSON.stringify(saveData));
        alert('Game saved!');
    }

    loadGame() {
        const saveData = localStorage.getItem('clickerGameSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.currency = data.currency || 0;
            this.perClick = data.perClick || 1;
            this.perSecond = data.perSecond || 0;
            this.rainEnabled = data.rainEnabled || false;
            this.radioEnabled = data.radioEnabled || false;
            this.currentSong = data.currentSong || 0;
            this.backgroundIndex = data.backgroundIndex || 'default';
            this.activeCursor = data.activeCursor || 'default';

            if (data.clickUpgrades) {
                data.clickUpgrades.forEach(saved => {
                    const upgrade = this.clickUpgrades.find(u => u.id === saved.id);
                    if (upgrade) {
                        upgrade.level = saved.level;
                        upgrade.cost = saved.cost;
                    }
                });
            }

            if (data.autoUpgrades) {
                data.autoUpgrades.forEach(saved => {
                    const upgrade = this.autoUpgrades.find(u => u.id === saved.id);
                    if (upgrade) {
                        upgrade.level = saved.level;
                        upgrade.cost = saved.cost;
                    }
                });
            }

            if (data.cosmeticUpgrades) {
                data.cosmeticUpgrades.forEach(saved => {
                    const upgrade = this.cosmeticUpgrades.find(u => u.id === saved.id);
                    if (upgrade) {
                        upgrade.purchased = saved.purchased;
                    }
                });
            }

            if (this.backgroundIndex !== 'default') {
                this.setBackground(this.backgroundIndex);
            }

            if (this.activeCursor !== 'default') {
                this.setCursor(this.activeCursor);
            }

            if (this.rainEnabled) {
                this.toggleRain(true);
            }

            if (this.radioEnabled) {
                this.toggleRadio(true);
            }
        }
    }

    resetGame() {
        if (confirm('Are you sure you want to reset the game? This cannot be undone.')) {
            localStorage.removeItem('clickerGameSave');
            this.currency = 0;
            this.perClick = 1;
            this.perSecond = 0;
            this.rainEnabled = false;
            this.radioEnabled = false;
            this.currentSong = 0;
            this.backgroundIndex = 'default';
            this.activeCursor = 'default';

            this.toggleRain(false);
            this.toggleRadio(false);
            this.setBackground('default');
            this.setCursor('default');

            this.clickUpgrades.forEach(u => {
                u.level = 0;
                u.cost = this.getInitialCost(u.id);
            });
            this.autoUpgrades.forEach(u => {
                u.level = 0;
                u.cost = this.getInitialCost(u.id);
            });
            this.cosmeticUpgrades.forEach(u => {
                u.purchased = false;
                u.cost = u.initialCost;
            });

            this.renderUpgrades();
            this.updateUI();
        }
    }

    getInitialCost(id) {
        const costs = {
            click1: 10, click2: 100, click3: 1000, click4: 10000, click5: 100000,
            auto1: 50, auto2: 500, auto3: 5000, auto4: 50000, auto5: 500000
        };
        return costs[id];
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ClickerGame();
});
