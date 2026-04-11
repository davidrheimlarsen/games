const healthEl = document.getElementById('health');
const foodEl = document.getElementById('food');
const dayEl = document.getElementById('day');
const monsterCountEl = document.getElementById('monsterCount');
const logEl = document.getElementById('log');
const playerEl = document.getElementById('player');
const gameArea = document.getElementById('gameArea');

const nameInput = document.getElementById('playerName');
const colorInput = document.getElementById('playerColor');
const styleInput = document.getElementById('playerStyle');
const difficultyInput = document.getElementById('difficulty');
const avatarUploadInput = document.getElementById('avatarUpload');
const backgroundStyleInput = document.getElementById('backgroundStyle');
const backgroundUploadInput = document.getElementById('backgroundUpload');
const monsterColorInput = document.getElementById('monsterColor');
const monsterUploadInput = document.getElementById('monsterUpload');
const clearMonsterTextureButton = document.getElementById('clearMonsterTexture');
const backgroundColorInput = document.getElementById('backgroundColor');
const gameShell = document.querySelector('.game-shell');
const applyButton = document.getElementById('applyCharacter');
const resetButton = document.getElementById('resetGame');
const fullscreenButton = document.getElementById('fullscreen');
const attackButton = document.getElementById('attack');

const state = {
    health: 100,
    food: 100,
    day: 1,
    x: 240,
    y: 120,
    step: 40,
    searchCooldown: false,
    frozen: false,
    freezeEndTime: 0,
    color: '#4caf50',
    style: 'square',
    name: 'Survivor',
    difficulty: 'medium',
    backgroundStyle: 'wasteland',
    backgroundColor: '#2d2d2d',
    backgroundImage: null,
    monsterColor: '#e53935',
    monsterImage: null,
    avatarImage: null,
    monsters: [],
};

function updateHUD() {
    healthEl.textContent = state.health;
    foodEl.textContent = state.food;
    dayEl.textContent = state.day;
    monsterCountEl.textContent = state.monsters.length;
}

function updatePlayer() {
    playerEl.style.left = `${state.x}px`;
    playerEl.style.top = `${state.y}px`;
}

function updatePlayerStyle() {
    playerEl.style.backgroundSize = 'contain';
    playerEl.style.backgroundRepeat = 'no-repeat';
    playerEl.style.backgroundPosition = 'center';

    if (state.avatarImage) {
        playerEl.style.backgroundImage = `url('${state.avatarImage}')`;
        playerEl.style.backgroundColor = state.color;
    } else {
        playerEl.style.backgroundImage = "url('player.svg')";
        playerEl.style.backgroundColor = 'transparent';
    }

    playerEl.textContent = '';
    playerEl.classList.remove('square', 'rounded', 'circle');
    playerEl.classList.add(state.style);
}

function updateGameBackground() {
    gameArea.style.backgroundColor = state.backgroundColor;
    gameArea.style.backgroundRepeat = 'repeat';
    gameArea.style.backgroundPosition = 'center';
    if (state.backgroundStyle === 'forest') {
        gameArea.style.backgroundImage = 'linear-gradient(180deg, #294b2c 0%, #1b2c1d 100%)';
        gameArea.style.backgroundSize = '100% 100%';
    } else if (state.backgroundStyle === 'sand') {
        gameArea.style.backgroundImage = 'linear-gradient(180deg, #bfa56b 0%, #8f6c3b 100%)';
        gameArea.style.backgroundSize = '100% 100%';
    } else if (state.backgroundStyle === 'night') {
        gameArea.style.backgroundImage = 'linear-gradient(180deg, #1b2330 0%, #0a101a 100%)';
        gameArea.style.backgroundSize = '100% 100%';
    } else if (state.backgroundStyle === 'custom' && state.backgroundImage) {
        gameArea.style.backgroundImage = `url('${state.backgroundImage}')`;
        gameArea.style.backgroundSize = 'cover';
        gameArea.style.backgroundRepeat = 'no-repeat';
        gameArea.style.backgroundPosition = 'center';
    } else {
        gameArea.style.backgroundImage = "url('texture.svg')";
        gameArea.style.backgroundSize = '40px 40px';
    }
}

function showLog(message) {
    logEl.textContent = message;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getRandomPosition() {
    const maxX = Math.floor((gameArea.clientWidth - 40) / state.step);
    const maxY = Math.floor((gameArea.clientHeight - 40) / state.step);
    return {
        x: Math.floor(Math.random() * (maxX + 1)) * state.step,
        y: Math.floor(Math.random() * (maxY + 1)) * state.step,
    };
}

function getMonsterAtPosition(x, y) {
    return state.monsters.find(monster => monster.x === x && monster.y === y);
}

function getMonsterMaxHp(isBoss = false) {
    const base = isBoss ? 60 : 28;
    const dayBonus = state.day * (isBoss ? 6 : 3);
    const randomBonus = Math.floor(Math.random() * (isBoss ? 30 : 18));
    let hp = base + dayBonus + randomBonus;
    if (state.difficulty === 'easy') {
        hp = Math.max(isBoss ? 45 : 18, hp - (isBoss ? 12 : 8));
    } else if (state.difficulty === 'hard') {
        hp += isBoss ? 18 : 8;
    }
    return hp;
}

function getMonsterDamage(isBoss = false) {
    let damage = 8 + Math.floor(Math.random() * 10) + Math.floor(state.day * 0.8);
    if (isBoss) {
        damage += 4;
    }
    if (state.difficulty === 'easy') {
        damage = Math.max(4, damage - 5);
    } else if (state.difficulty === 'hard') {
        damage += 5;
    }
    return damage;
}

function getPlayerDamage() {
    let damage = 14 + Math.floor(Math.random() * 13) + Math.floor(state.day * 1.5);
    if (state.difficulty === 'easy') {
        damage += 5;
    } else if (state.difficulty === 'hard') {
        damage = Math.max(5, damage - 5);
    }
    return damage;
}

function moveMonsters() {
    if (state.health <= 0) {
        return;
    }

    const directions = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
    ];

    let collisionMessage = '';
    state.monsters = state.monsters.filter(monster => {
        if (monster.dead) {
            return false;
        }

        const hunterChance = Math.min(0.92, 0.18 + state.day * 0.04 + (monster.boss ? 0.1 : 0));
        const shouldHunt = Math.random() < hunterChance;
        const skipBossMove = monster.boss && Math.random() < 0.45;
        if (skipBossMove) {
            return true;
        }

        const dx = state.x - monster.x;
        const dy = state.y - monster.y;
        let candidateDirections = directions.slice();

        if (shouldHunt) {
            const prioritized = [];
            if (dx > 0) prioritized.push({ x: 1, y: 0 });
            else if (dx < 0) prioritized.push({ x: -1, y: 0 });
            if (dy > 0) prioritized.push({ x: 0, y: 1 });
            else if (dy < 0) prioritized.push({ x: 0, y: -1 });
            candidateDirections = prioritized.concat(candidateDirections.filter(dir => !prioritized.some(p => p.x === dir.x && p.y === dir.y)));
        } else {
            candidateDirections.sort(() => Math.random() - 0.5);
        }

        for (const direction of candidateDirections) {
            const nextX = clamp(monster.x + direction.x * state.step, 0, gameArea.clientWidth - 40);
            const nextY = clamp(monster.y + direction.y * state.step, 0, gameArea.clientHeight - 40);
            const collidesOther = state.monsters.some(other => other !== monster && other.x === nextX && other.y === nextY);
            if (!collidesOther) {
                monster.x = nextX;
                monster.y = nextY;
                if (monster.x === state.x && monster.y === state.y) {
                    const damage = getMonsterDamage(monster.boss);
                    state.health = Math.max(0, state.health - damage);
                    let counterDamage = 12 + Math.floor(Math.random() * 10) + Math.floor(state.day * 0.5);
                    if (state.difficulty === 'easy') {
                        counterDamage += 4;
                    } else if (state.difficulty === 'hard') {
                        counterDamage = Math.max(5, counterDamage - 4);
                    }
                    monster.hp = Math.max(0, monster.hp - counterDamage);
                    collisionMessage = `${monster.boss ? 'Boss' : 'Monster'} hits you for ${damage}. You counterattack for ${counterDamage}.`;
                    if (monster.hp <= 0) {
                        if (monster.boss) {
                            collisionMessage += " Congrats!";
                        }
                        return false;
                    }
                }
                break;
            }
        }
        return true;
    });

    if (collisionMessage) {
        showLog(collisionMessage);
        updateHUD();
        saveSettings();
        checkGameOver();
    }
}

function renderMonsters() {
    document.querySelectorAll('.monster').forEach(node => node.remove());
    state.monsters.forEach(monster => {
        const monsterEl = document.createElement('div');
        monsterEl.className = monster.boss ? 'monster boss' : 'monster';
        monsterEl.style.left = `${monster.x}px`;
        monsterEl.style.top = `${monster.y}px`;
        if (state.monsterImage) {
            monsterEl.style.backgroundImage = `url('${state.monsterImage}')`;
            monsterEl.style.backgroundSize = 'cover';
            monsterEl.style.backgroundRepeat = 'no-repeat';
            monsterEl.style.backgroundPosition = 'center';
        } else {
            monsterEl.style.backgroundImage = '';
            monsterEl.style.background = state.monsterColor;
        }
        monsterEl.textContent = monster.boss ? 'B' : monster.hp;
        monsterEl.title = monster.boss ? `Boss HP ${monster.hp}` : `Monster HP ${monster.hp}`;
        gameArea.appendChild(monsterEl);
    });
    updateHUD();
}

function spawnMonsters() {
    let count = 2 + Math.floor(state.day / 3);
    if (state.difficulty === 'easy') {
        count = Math.max(1, count - 1);
    } else if (state.difficulty === 'hard') {
        count += 1;
    }
    const hasBoss = state.day > 1 && state.day % 3 === 0;
    const existingBoss = state.monsters.some(m => m.boss);
    if (hasBoss && !existingBoss) {
        let position;
        do {
            position = getRandomPosition();
        } while ((position.x === state.x && position.y === state.y) || state.monsters.some(monster => monster.x === position.x && monster.y === position.y));
        state.monsters.push({
            x: position.x,
            y: position.y,
            hp: getMonsterMaxHp(true),
            boss: true,
        });
        showLog('A boss has arrived! Take it down or be crushed.');
    }
    const normalCount = state.monsters.filter(m => !m.boss).length;
    let toAdd = Math.max(0, count - normalCount);
    toAdd = Math.min(10 - state.monsters.length, toAdd); // cap total at 10
    while (toAdd > 0) {
        const position = getRandomPosition();
        const collidesPlayer = position.x === state.x && position.y === state.y;
        const collidesMonster = state.monsters.some(monster => monster.x === position.x && monster.y === position.y);
        if (collidesPlayer || collidesMonster) {
            continue;
        }
        state.monsters.push({
            x: position.x,
            y: position.y,
            hp: getMonsterMaxHp(false),
            boss: false,
        });
        toAdd--;
    }
    renderMonsters();
}

function move(dx, dy) {
    if (state.health <= 0 || state.frozen) {
        if (state.frozen) showLog('You are frozen and cannot move.');
        return;
    }

    state.x = clamp(state.x + dx * state.step, 0, gameArea.clientWidth - 40);
    state.y = clamp(state.y + dy * state.step, 0, gameArea.clientHeight - 40);
    let foodLoss = 4;
    if (state.difficulty === 'easy') {
        foodLoss = 2;
    } else if (state.difficulty === 'hard') {
        foodLoss = 6;
    }
    state.food = Math.max(0, state.food - foodLoss);
    if (state.food === 0) {
        let healthLoss = 8;
        if (state.difficulty === 'easy') {
            healthLoss = 4;
        } else if (state.difficulty === 'hard') {
            healthLoss = 12;
        }
        state.health = Math.max(0, state.health - healthLoss);
    }

    moveMonsters();
    updatePlayer();
    renderMonsters();

    const monster = getMonsterAtPosition(state.x, state.y);
    if (monster) {
        showLog('A monster moved close. Press Attack to fight it.');
    } else {
        showLog('You moved through the wasteland and consumed food.');
    }

    saveSettings();
    checkGameOver();
}

function attack() {
    if (state.health <= 0 || state.frozen) {
        if (state.frozen) showLog('You are frozen and cannot attack.');
        return;
    }

    const monster = getMonsterAtPosition(state.x, state.y);
    if (!monster) {
        showLog('No monster at your location. Move into one and attack.');
        return;
    }

    const playerDamage = getPlayerDamage();
    monster.hp = Math.max(0, monster.hp - playerDamage);
    let message = `You hit the monster for ${playerDamage} damage.`;

    if (monster.hp <= 0) {
        state.monsters = state.monsters.filter(item => item !== monster);
        let rewardFood = 12 + Math.floor(Math.random() * 11);
        if (state.difficulty === 'easy') {
            rewardFood += 5;
        } else if (state.difficulty === 'hard') {
            rewardFood = Math.max(5, rewardFood - 5);
        }
        state.food = Math.min(100, state.food + rewardFood);
        message += ` Monster defeated! You recovered ${rewardFood} food.`;
        if (monster.boss) {
            message += " Congrats!";
        }
        renderMonsters();
    } else {
        const monsterDamage = getMonsterDamage(monster.boss);
        state.health = Math.max(0, state.health - monsterDamage);
        message += ` The beast strikes back for ${monsterDamage} damage. ${monster.boss ? 'Boss' : 'Monster'} HP ${monster.hp}.`;
    }

    updateHUD();
    showLog(message);
    saveSettings();
    checkGameOver();
}

function searchArea() {
    if (state.searchCooldown || state.frozen) {
        if (state.frozen) showLog('You are frozen and cannot search.');
        return;
    }

    state.searchCooldown = true;
    setTimeout(() => (state.searchCooldown = false), 1200);

    const roll = Math.random();
    if (roll < 0.3) {
        const foundFood = 18 + Math.floor(Math.random() * 14);
        state.food = Math.min(100, state.food + foundFood);
        showLog(`You found ${foundFood} food supplies.`);
    } else if (roll < 0.55) {
        const foundHealth = 12 + Math.floor(Math.random() * 10);
        state.health = Math.min(100, state.health + foundHealth);
        showLog(`You patched yourself up and recovered ${foundHealth} health.`);
    } else if (roll < 0.75) {
        state.health = Math.max(0, state.health - 10);
        showLog('A hidden danger wounded you while searching.');
    } else {
        showLog('The search turned up nothing useful. Keep moving.');
    }

    updateHUD();
    saveSettings();
    checkGameOver();
}

function heal() {
    if (state.health <= 0 || state.frozen) {
        return;
    }

    const healAmount = 25 + Math.floor(Math.random() * 11);
    state.health = Math.min(100, state.health + healAmount);
    state.frozen = true;
    state.freezeEndTime = Date.now() + 5000;
    showLog(`You heal for ${healAmount} health but freeze in place for 5 seconds.`);

    setTimeout(() => {
        state.frozen = false;
        showLog('You can move again.');
    }, 5000);

    updateHUD();
    saveSettings();
}

function newDay() {
    state.day += 1;
    let dailyFoodLoss = 10;
    if (state.difficulty === 'easy') {
        dailyFoodLoss = 5;
    } else if (state.difficulty === 'hard') {
        dailyFoodLoss = 15;
    }
    state.food = Math.max(0, state.food - dailyFoodLoss);
    if (state.food === 0) {
        let dailyHealthLoss = 12;
        if (state.difficulty === 'easy') {
            dailyHealthLoss = 6;
        } else if (state.difficulty === 'hard') {
            dailyHealthLoss = 18;
        }
        state.health = Math.max(0, state.health - dailyHealthLoss);
    }
    spawnMonsters();
    updateHUD();
    const growthMessage = state.day > 1 ? ' Your survival sharpens you and your attacks grow stronger.' : '';
    showLog(`A new day begins. Day ${state.day}. More monsters appear.${growthMessage}`);
    saveSettings();
    checkGameOver();
}

function checkGameOver() {
    if (state.health <= 0) {
        showLog('Game over. Your survival ended in the wasteland. Refresh to try again.');
        disableControls();
    }
}

function disableControls() {
    document.querySelectorAll('button').forEach(button => button.disabled = true);
}

function applyCharacter() {
    state.name = nameInput.value.trim() || 'Survivor';
    state.color = colorInput.value;
    state.style = styleInput.value;
    state.difficulty = difficultyInput.value;
    state.backgroundStyle = backgroundStyleInput.value;
    state.backgroundColor = backgroundColorInput.value;
    state.monsterColor = monsterColorInput.value;
    updatePlayerStyle();
    updatePlayer();
    updateGameBackground();
    renderMonsters();
    saveSettings();
    showLog(`Settings updated: ${state.name}, ${state.difficulty} difficulty. Use arrow keys to move, space to attack, S to search.`);
}

function resetGame() {
    state.health = 100;
    state.food = 100;
    state.day = 1;
    state.x = 240;
    state.y = 120;
    state.monsters = [];
    updatePlayerStyle();
    updateHUD();
    updatePlayer();
    spawnMonsters();
    saveSettings();
    showLog('Game reset. Fresh start in the wasteland.');
}

function toggleFullscreen() {
    gameShell.classList.toggle('zoomed');
    // Re-clamp position after the layout updates
    setTimeout(() => {
        state.x = clamp(state.x, 0, gameArea.clientWidth - 40);
        state.y = clamp(state.y, 0, gameArea.clientHeight - 40);
        updatePlayer();
    }, 0);
}

function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        state.backgroundImage = reader.result;
        state.backgroundStyle = 'custom';
        backgroundStyleInput.value = 'custom';
        updateGameBackground();
        saveSettings();
        showLog('Custom background uploaded.');
    };
    reader.readAsDataURL(file);
}

function saveSettings() {
    const settings = {
        name: state.name,
        color: state.color,
        style: state.style,
        difficulty: state.difficulty,
        health: state.health,
        food: state.food,
        day: state.day,
        x: state.x,
        y: state.y,
        frozen: state.frozen,
        freezeEndTime: state.freezeEndTime,
        backgroundStyle: state.backgroundStyle,
        backgroundColor: state.backgroundColor,
        backgroundImage: state.backgroundImage,
        monsterColor: state.monsterColor,
        monsterImage: state.monsterImage,
        avatarImage: state.avatarImage,
    };
    localStorage.setItem('survivalGameSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('survivalGameSettings');
    if (saved) {
        const data = JSON.parse(saved);
        state.name = data.name || state.name;
        state.color = data.color || state.color;
        state.style = data.style || state.style;
        state.difficulty = data.difficulty || state.difficulty;
        state.backgroundStyle = data.backgroundStyle || state.backgroundStyle;
        state.backgroundColor = data.backgroundColor || state.backgroundColor;
        state.backgroundImage = data.backgroundImage || state.backgroundImage;
        state.monsterColor = data.monsterColor || state.monsterColor;
        state.monsterImage = data.monsterImage || state.monsterImage;
        state.avatarImage = data.avatarImage || state.avatarImage;
        state.health = data.health !== undefined ? data.health : state.health;
        state.food = data.food !== undefined ? data.food : state.food;
        state.day = data.day !== undefined ? data.day : state.day;
        state.x = data.x !== undefined ? data.x : state.x;
        state.y = data.y !== undefined ? data.y : state.y;
        state.frozen = data.frozen || false;
        state.freezeEndTime = data.freezeEndTime || 0;
        if (state.frozen && Date.now() > state.freezeEndTime) {
            state.frozen = false;
        }
        nameInput.value = state.name;
        colorInput.value = state.color;
        styleInput.value = state.style;
        difficultyInput.value = state.difficulty;
        backgroundStyleInput.value = state.backgroundStyle;
        backgroundColorInput.value = state.backgroundColor;
        monsterColorInput.value = state.monsterColor;
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        state.avatarImage = reader.result;
        updatePlayerStyle();
        updatePlayer();
        saveSettings();
        showLog('Custom avatar uploaded.');
    };
    reader.readAsDataURL(file);
}

function handleMonsterUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        state.monsterImage = reader.result;
        renderMonsters();
        saveSettings();
        showLog('Custom monster texture uploaded.');
    };
    reader.readAsDataURL(file);
}

function clearMonsterTexture() {
    state.monsterImage = null;
    monsterUploadInput.value = '';
    renderMonsters();
    saveSettings();
    showLog('Custom monster texture cleared. Using the monster color again.');
}

function setupControls() {
    document.getElementById('moveUp').addEventListener('click', () => move(0, -1));
    document.getElementById('moveLeft').addEventListener('click', () => move(-1, 0));
    document.getElementById('moveDown').addEventListener('click', () => move(0, 1));
    document.getElementById('moveRight').addEventListener('click', () => move(1, 0));
    document.getElementById('search').addEventListener('click', searchArea);
    document.getElementById('heal').addEventListener('click', heal);
    attackButton.addEventListener('click', attack);
    applyButton.addEventListener('click', applyCharacter);
    resetButton.addEventListener('click', resetGame);
    fullscreenButton.addEventListener('click', toggleFullscreen);
    backgroundUploadInput.addEventListener('change', handleBackgroundUpload);
    avatarUploadInput.addEventListener('change', handleAvatarUpload);
    monsterUploadInput.addEventListener('change', handleMonsterUpload);
    clearMonsterTextureButton.addEventListener('click', clearMonsterTexture);

    window.addEventListener('keydown', event => {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            move(0, -1);
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            move(-1, 0);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            move(0, 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            move(1, 0);
        } else if (event.key === ' ') {
            event.preventDefault();
            attack();
        } else if (event.key === 's' || event.key === 'S') {
            event.preventDefault();
            searchArea();
        } else if (event.key === 'h' || event.key === 'H') {
            event.preventDefault();
            heal();
        }
    });

    setInterval(newDay, 12000);
    setInterval(() => {
        moveMonsters();
        renderMonsters();
    }, 2200);
}

loadSettings();
updatePlayerStyle();
updateGameBackground();
updateHUD();
updatePlayer();
spawnMonsters();
setupControls();
