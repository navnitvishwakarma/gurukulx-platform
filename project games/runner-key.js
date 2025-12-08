const GAME_CONFIG = {
    lanes: [-1, 0, 1],
    laneWidth: 200,
    spawnZ: -6000,
    playerZ: 0,
    speed: 8, // Pixels per frame approx - SLOWER START
    spawnInterval: 4500 // ms - More space between questions
};

const STATE = {
    isPlaying: false,
    score: 0,
    currentLane: 1,
    objects: [],
    lastSpawnTime: 0,
    currentAnswer: 0,
    speedMultiplier: 1,
    groundOffset: 0,
    gameStartTime: 0 // Track when game started
};

// DOM Elements
const playerEl = document.getElementById('player');
const sceneEl = document.getElementById('scene');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const questionText = document.getElementById('question-text');
const groundEl = document.getElementById('ground');

// Input Handling
document.addEventListener('keydown', (e) => {
    if (!STATE.isPlaying && e.code === 'Space') startGame();
    if (!STATE.isPlaying) return;

    if (e.key === 'ArrowLeft') moveLane(-1);
    if (e.key === 'ArrowRight') moveLane(1);
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    startGame();
});

function moveLane(dir) {
    const newLane = STATE.currentLane + dir;
    if (newLane >= 0 && newLane <= 2) {
        STATE.currentLane = newLane;
        updatePlayerPosition();
    }
}

function updatePlayerPosition() {
    // Lane 0: -200, Lane 1: 0, Lane 2: +200
    const x = (STATE.currentLane - 1) * GAME_CONFIG.laneWidth;

    // Player is a child of #scene (0,0,0).
    const y = 0; // Push down to match floor
    const z = 0; // Close to camera
    playerEl.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
}

// Math Generator
function generateQuestion() {
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;

    let ans;
    if (op === '+') ans = a + b;
    else if (op === '-') {
        if (a < b) [a, b] = [b, a];
        ans = a - b;
    } else {
        a = Math.min(a, 5);
        b = Math.min(b, 5);
        ans = a * b;
    }

    return { text: `${a} ${op} ${b} = ?`, val: ans };
}

function spawnRow() {
    const q = generateQuestion();

    const correctAnswerLane = Math.floor(Math.random() * 3);
    const answers = [];

    for (let i = 0; i < 3; i++) {
        if (i === correctAnswerLane) answers.push(q.val);
        else {
            let wrongKey;
            do { wrongKey = q.val + Math.floor(Math.random() * 10) - 5; }
            while (wrongKey === q.val || answers.includes(wrongKey));
            answers.push(wrongKey);
        }
    }

    const rowId = Date.now();
    answers.forEach((val, laneIndex) => {
        const el = document.createElement('div');
        el.className = 'game-object';
        el.innerHTML = `<div class="answer-card">${val}</div>`;
        sceneEl.appendChild(el);

        STATE.objects.push({
            id: rowId + '-' + laneIndex,
            el: el,
            val: val,
            lane: laneIndex,
            z: GAME_CONFIG.spawnZ,
            isCorrect: (laneIndex === correctAnswerLane),
            questionText: q.text,
            correctAnswer: q.val
        });
    });
}

// Game Loop
let lastTime = 0;
function loop(timestamp) {
    if (!STATE.isPlaying) return;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    scoreEl.innerText = Math.floor(STATE.score);

    // Sync Question Display
    if (STATE.objects.length > 0) {
        const closestObj = STATE.objects[0];
        if (questionText.innerText !== closestObj.questionText) {
            questionText.innerText = closestObj.questionText;
            STATE.currentAnswer = closestObj.correctAnswer;
        }
    }

    // Ground scrolling effect
    STATE.groundOffset = (STATE.groundOffset + (GAME_CONFIG.speed * STATE.speedMultiplier)) % 300;
    groundEl.style.backgroundPositionY = `${STATE.groundOffset}px`;

    // Spawn Trigger
    if (timestamp - STATE.lastSpawnTime > (GAME_CONFIG.spawnInterval / STATE.speedMultiplier)) {
        spawnRow();
        STATE.lastSpawnTime = timestamp;

        // SPEED INCREASE LOGIC
        // Only start increasing speed after 30 seconds
        if (timestamp - STATE.gameStartTime > 30000) {
            STATE.speedMultiplier = Math.min(STATE.speedMultiplier + 0.03, 3.0);
        }
    }

    // Update Objects
    for (let i = STATE.objects.length - 1; i >= 0; i--) {
        const obj = STATE.objects[i];

        // Move towards camera
        obj.z += (GAME_CONFIG.speed * STATE.speedMultiplier * 2);

        // Collision Logic
        if (obj.z > -100 && obj.z < 100) {
            if (obj.lane === STATE.currentLane) {
                handleCollision(obj);
            }
        }

        // Cleanup
        if (obj.z > 500) {
            obj.el.remove();
            STATE.objects.splice(i, 1);
            continue;
        }

        renderObject(obj);
    }

    requestAnimationFrame(loop);
}

function renderObject(obj) {
    const x = (obj.lane - 1) * GAME_CONFIG.laneWidth;
    const y = 0; // Same as player
    const z = obj.z;
    obj.el.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
    obj.el.style.opacity = (z > -5000) ? 1 : 0;
}

function handleCollision(obj) {
    if (obj.hit) return;
    obj.hit = true;

    if (obj.isCorrect) {
        STATE.score += 10;
        playerEl.querySelector('.character-body').style.backgroundColor = '#4ECDC4';
        setTimeout(() => playerEl.querySelector('.character-body').style.backgroundColor = '', 200);
        obj.el.style.transform += " scale(0)";
    } else {
        gameOver();
    }
}

function startGame() {
    STATE.isPlaying = true;
    STATE.score = 0;
    STATE.speedMultiplier = 1;
    STATE.currentLane = 1;
    STATE.objects.forEach(o => o.el.remove());
    STATE.objects = [];
    STATE.lastSpawnTime = 0;

    // START TIMER
    STATE.gameStartTime = performance.now();

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    updatePlayerPosition();

    lastTime = performance.now();
    requestAnimationFrame(loop);
}

function gameOver() {
    STATE.isPlaying = false;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    finalScoreEl.innerText = Math.floor(STATE.score);
}

// Init
updatePlayerPosition();
