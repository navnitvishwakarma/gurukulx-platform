// Balloon Game Functionality
document.addEventListener('DOMContentLoaded', function () {
    // Wait for header/footer to be injected
    setTimeout(initBalloonGame, 100);
});

function initBalloonGame() {
    // Game variables
    let gameState = {
        level: 1,
        score: 0,
        balloons: [],
        currentMin: 0,
        lives: 3,
        gameActive: false
    };

    // DOM elements
    const balloonsContainer = document.getElementById('balloonsContainer');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const backButton = document.getElementById('backButton');
    const helpButton = document.getElementById('helpButton');
    const closeHelpModal = document.getElementById('closeHelpModal');
    const helpModal = document.getElementById('helpModal');

    // Event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    backButton.addEventListener('click', goBack);
    helpButton.addEventListener('click', showHelp);
    closeHelpModal.addEventListener('click', hideHelp);

    // Close modal when clicking outside
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

        // Generate unique random numbers
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
            // Correct balloon popped
            balloonElement.classList.add('pop-animation');
            gameState.score += 10 * gameState.level;
            gameState.currentMin = number;

            // Mark as popped
            const balloon = gameState.balloons.find(b => b.value === number);
            balloon.popped = true;

            // Show feedback
            showFeedback('Correct! +' + (10 * gameState.level), 'feedback-correct');

            // Check if all balloons are popped
            setTimeout(() => {
                const balloonsLeft = gameState.balloons.filter(b => !b.popped).length;
                document.getElementById('balloonsLeft').textContent = balloonsLeft;

                if (balloonsLeft === 0) {
                    levelComplete();
                }
            }, 500);
        } else {
            // Wrong balloon popped
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

        // Calculate XP earned (30 base + 5 per level)
        const xpEarned = 30 + (gameState.level * 5);

        // Update user progress and XP
        updateUserProgress(xpEarned);

        // Sync leaderboards/students with latest totals if helper exists
        try {
            if (typeof syncScoreboards === 'function') syncScoreboards();
            if (typeof saveCurrentUserProfile === 'function') saveCurrentUserProfile();
        } catch { }

        // Show final score
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

        // Clear feedback after 2 seconds
        setTimeout(() => {
            feedbackElement.textContent = '';
            feedbackElement.className = 'game-feedback';
        }, 2000);
    }

    function updateUserProgress(xpEarned) {
        // Update chapter progress in localStorage
        const currentProgress = parseInt(localStorage.getItem('chapter1_progress') || 35);
        const newProgress = Math.min(100, currentProgress + 15); // Add 15% for completing the game

        localStorage.setItem('chapter1_progress', newProgress);

        // Update user XP (in a real app, this would be saved to the server)
        const currentXP = parseInt(localStorage.getItem(LS.xp) || 0);
        const newXP = currentXP + xpEarned;
        localStorage.setItem(LS.xp, newXP);

        // Update user score
        const currentScore = parseInt(localStorage.getItem(LS.score) || 0);
        const newScore = currentScore + gameState.score;
        localStorage.setItem(LS.score, newScore);

        // Show XP earned message
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

// Toast notification function
function showToast(title, message, type = "info") {
    // Create toast container if it doesn't exist
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

    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto remove after 5 seconds
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