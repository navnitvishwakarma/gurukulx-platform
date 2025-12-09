
document.addEventListener('DOMContentLoaded', function () {

    setTimeout(initBalloonGame, 100);
});

function initBalloonGame() {

    let gameState = {
        level: 1,
        score: 0,
        balloons: [],
        currentMin: 0,
        lives: 3,
        gameActive: false
    };


    const balloonsContainer = document.getElementById('balloonsContainer');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const backButton = document.getElementById('backButton');
    const helpButton = document.getElementById('helpButton');
    const closeHelpModal = document.getElementById('closeHelpModal');
    const helpModal = document.getElementById('helpModal');


    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    backButton.addEventListener('click', goBack);
    helpButton.addEventListener('click', showHelp);
    closeHelpModal.addEventListener('click', hideHelp);


    window.addEventListener('click', function (event) {
        if (event.target === helpModal) {
            hideHelp();
        }
    });

    function startGame() {
        gameState.gameActive = true;
        startButton.style.display = 'none';
        restartButton.style.display = 'none';

        generateBalloons();
        updateUI();
    }

    function restartGame() {
        gameState = {
            level: 1,
            score: 0,
            balloons: [],
            currentMin: 0,
            lives: 3,
            gameActive: true
        };

        startGame();
    }

    function generateBalloons() {
        balloonsContainer.innerHTML = '';
        gameState.balloons = [];
        gameState.currentMin = 0;

        const balloonCount = 5 + gameState.level; // Increase balloons with level
        const numbers = generateNumbers(balloonCount);

        numbers.forEach((number, index) => {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.textContent = number;
            balloon.dataset.value = number;

            balloon.addEventListener('click', () => handleBalloonClick(number, balloon));

            balloonsContainer.appendChild(balloon);
            gameState.balloons.push({
                element: balloon,
                value: number,
                popped: false
            });
        });

        document.getElementById('balloonsLeft').textContent = balloonCount;
    }

    function generateNumbers(count) {
        const numbers = [];
        const min = Math.pow(10, gameState.level - 1); // Scale difficulty with level
        const max = min * 10;


        while (numbers.length < count) {
            const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!numbers.includes(randomNum)) {
                numbers.push(randomNum);
            }
        }

        return numbers;
    }

    function handleBalloonClick(number, balloonElement) {
        if (!gameState.gameActive) return;

        const minValue = Math.min(...gameState.balloons
            .filter(b => !b.popped)
            .map(b => b.value));

        if (number === minValue) {

            balloonElement.classList.add('pop-animation');
            gameState.score += 10 * gameState.level;
            gameState.currentMin = number;


            const balloon = gameState.balloons.find(b => b.value === number);
            balloon.popped = true;


            showFeedback('Correct! +' + (10 * gameState.level), 'feedback-correct');


            setTimeout(() => {
                const balloonsLeft = gameState.balloons.filter(b => !b.popped).length;
                document.getElementById('balloonsLeft').textContent = balloonsLeft;

                if (balloonsLeft === 0) {
                    levelComplete();
                }
            }, 500);
        } else {

            gameState.lives--;
            showFeedback('Wrong! Try the smallest number', 'feedback-incorrect');

            if (gameState.lives <= 0) {
                gameOver();
            }
        }

        updateUI();
    }

    function levelComplete() {
        gameState.level++;
        showFeedback('Level Complete! Moving to level ' + gameState.level, 'feedback-levelup');

        if (gameState.level > 5) {
            gameComplete();
        } else {
            setTimeout(() => {
                generateBalloons();
            }, 1500);
        }
    }

    function gameComplete() {
        gameState.gameActive = false;
        showFeedback('Congratulations! You completed all levels!', 'feedback-levelup');


        const xpEarned = 30 + (gameState.level * 5);


        updateUserProgress(xpEarned);


        try {
            if (typeof syncScoreboards === 'function') syncScoreboards();
            if (typeof saveCurrentUserProfile === 'function') saveCurrentUserProfile();
        } catch { }


        setTimeout(() => {
            showFeedback(`Final Score: ${gameState.score} | XP Earned: ${xpEarned}`, 'feedback-levelup');
            restartButton.style.display = 'inline-flex';
        }, 2000);
    }

    function gameOver() {
        gameState.gameActive = false;
        showFeedback('Game Over! Try again', 'feedback-incorrect');
        restartButton.style.display = 'inline-flex';
    }

    function updateUI() {
        document.getElementById('levelValue').textContent = gameState.level;
        document.getElementById('scoreValue').textContent = gameState.score;
    }

    function showFeedback(message, className) {
        const feedbackElement = document.getElementById('gameFeedback');
        feedbackElement.textContent = message;
        feedbackElement.className = 'game-feedback ' + className;


        setTimeout(() => {
            feedbackElement.textContent = '';
            feedbackElement.className = 'game-feedback';
        }, 2000);
    }

    function updateUserProgress(xpEarned) {

        const currentProgress = parseInt(localStorage.getItem('chapter1_progress') || 35);
        const newProgress = Math.min(100, currentProgress + 15); // Add 15% for completing the game

        localStorage.setItem('chapter1_progress', newProgress);


        const currentXP = parseInt(localStorage.getItem(LS.xp) || 0);
        const newXP = currentXP + xpEarned;
        localStorage.setItem(LS.xp, newXP);


        const currentScore = parseInt(localStorage.getItem(LS.score) || 0);
        const newScore = currentScore + gameState.score;
        localStorage.setItem(LS.score, newScore);


        showToast('XP Earned', `You earned ${xpEarned} XP for completing the game!`, 'success');
    }

    function goBack() {
        window.location.href = 'chapter1-games.html';
    }

    function showHelp() {
        helpModal.classList.add('active');
    }

    function hideHelp() {
        helpModal.classList.remove('active');
    }
}


function showToast(title, message, type = "info") {

    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toastId = `toast-${Date.now()}`;
    const icons = {
        success: "ri-checkbox-circle-fill",
        error: "ri-error-warning-fill",
        warning: "ri-alert-fill",
        info: "ri-information-fill"
    };

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="toast-icon ${icons[type]}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="document.getElementById('${toastId}').remove()">
            <i class="ri-close-line"></i>
        </button>
    `;

    toastContainer.appendChild(toast);


    setTimeout(() => {
        toast.classList.add('show');
    }, 10);


    setTimeout(() => {
        if (document.getElementById(toastId)) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.getElementById(toastId)) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}