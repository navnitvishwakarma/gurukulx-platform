// Quiz Functionality for Knowing Our Numbers
document.addEventListener('DOMContentLoaded', function () {
    // Wait for header/footer to be injected
    setTimeout(initQuiz, 100);
});

function initQuiz() {
    // Quiz questions for Class 6 Chapter 1: Knowing Our Numbers
    const quizQuestions = [
        {
            question: "Which of the following is the correct expanded form of 45,678?",
            options: [
                "40,000 + 5,000 + 600 + 70 + 8",
                "40,000 + 5,000 + 60 + 70 + 8",
                "40,000 + 5,000 + 600 + 7 + 8",
                "4,000 + 500 + 60 + 70 + 8"
            ],
            correctIndex: 0,
            explanation: "45,678 = 40,000 (4 ten thousands) + 5,000 (5 thousands) + 600 (6 hundreds) + 70 (7 tens) + 8 (8 ones)"
        },
        {
            question: "What is the place value of 7 in the number 87,654?",
            options: [
                "Thousands",
                "Hundreds",
                "Tens",
                "Ones"
            ],
            correctIndex: 0,
            explanation: "In 87,654, the digit 7 is in the thousands place (7,000)."
        },
        {
            question: "Which symbol correctly completes the statement: 45,672 __ 45,762?",
            options: [
                ">",
                "<",
                "=",
                "≥"
            ],
            correctIndex: 1,
            explanation: "45,672 is less than 45,762 because at the hundreds place, 6 < 7."
        },
        {
            question: "What is the Roman numeral for 49?",
            options: [
                "IL",
                "XLIX",
                "XXXXIX",
                "VLIV"
            ],
            correctIndex: 1,
            explanation: "49 = XLIX (50-10 = 40, and 10-1 = 9). IL is not a standard representation."
        },
        {
            question: "Estimate 4,567 + 3,421 to the nearest hundred.",
            options: [
                "7,900",
                "8,000",
                "8,100",
                "7,990"
            ],
            correctIndex: 1,
            explanation: "4,567 ≈ 4,600 and 3,421 ≈ 3,400. 4,600 + 3,400 = 8,000."
        },
        {
            question: "Which of these numbers is the greatest?",
            options: [
                "45,678",
                "45,768",
                "45,687",
                "45,876"
            ],
            correctIndex: 3,
            explanation: "45,876 is the greatest because it has the highest hundreds digit (8) compared to others."
        },
        {
            question: "What is the correct number name for 12,045?",
            options: [
                "Twelve thousand forty-five",
                "Twelve thousand four hundred five",
                "One thousand two hundred forty-five",
                "Twelve hundred forty-five"
            ],
            correctIndex: 0,
            explanation: "12,045 is read as 'Twelve thousand forty-five'."
        },
        {
            question: "Which of these is the smallest 6-digit number?",
            options: [
                "100,000",
                "99,999",
                "1,00,000",
                "0,99,999"
            ],
            correctIndex: 0,
            explanation: "100,000 is the smallest 6-digit number. 99,999 is a 5-digit number."
        },
        {
            question: "How would you write 'Seventy-eight thousand four hundred twenty' in numerals?",
            options: [
                "78,420",
                "7,84,20",
                "78,402",
                "78,240"
            ],
            correctIndex: 0,
            explanation: "Seventy-eight thousand = 78,000, four hundred = 400, twenty = 20. So 78,000 + 400 + 20 = 78,420."
        },
        {
            question: "What is the difference between the place values of two 5s in the number 45,457?",
            options: [
                "4,995",
                "5,000",
                "495",
                "500"
            ],
            correctIndex: 0,
            explanation: "First 5 is in thousands place (5,000), second 5 is in tens place (50). Difference = 5,000 - 50 = 4,950."
        }
    ];

    // Quiz state
    let quizState = {
        currentQuestion: 0,
        score: 0,
        userAnswers: new Array(quizQuestions.length).fill(null),
        quizStarted: false,
        reviewMode: false
    };

    // DOM elements
    const quizIntro = document.getElementById('quizIntro');
    const quizPlay = document.getElementById('quizPlay');
    const quizEnd = document.getElementById('quizEnd');
    const startQuizBtn = document.getElementById('startQuizBtn');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const reviewQuizBtn = document.getElementById('reviewQuizBtn');
    const retryQuizBtn = document.getElementById('retryQuizBtn');

    // Event listeners
    startQuizBtn.addEventListener('click', startQuiz);
    prevQuestionBtn.addEventListener('click', showPreviousQuestion);
    nextQuestionBtn.addEventListener('click', showNextQuestion);
    reviewQuizBtn.addEventListener('click', reviewQuiz);
    retryQuizBtn.addEventListener('click', retryQuiz);

    function startQuiz() {
        quizState.quizStarted = true;
        quizIntro.classList.add('hidden');
        quizPlay.classList.remove('hidden');

        updateProgressBar();
        displayQuestion(0);
    }

    function displayQuestion(questionIndex) {
        quizState.currentQuestion = questionIndex;
        const question = quizQuestions[questionIndex];

        // Update question counter
        document.getElementById('currentQuestion').textContent = questionIndex + 1;
        document.getElementById('totalQuestions').textContent = quizQuestions.length;

        // Display question text
        document.getElementById('questionText').textContent = question.question;

        // Display options
        const optionsContainer = document.getElementById('questionOptions');
        optionsContainer.innerHTML = '';

        const optionPrefixes = ['A', 'B', 'C', 'D'];

        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';

            // If in review mode, show correct/incorrect status
            if (quizState.reviewMode) {
                if (index === question.correctIndex) {
                    optionElement.classList.add('correct');
                } else if (index === quizState.userAnswers[questionIndex]) {
                    optionElement.classList.add('incorrect');
                }
            } else if (quizState.userAnswers[questionIndex] === index) {
                optionElement.classList.add('selected');
            }

            optionElement.innerHTML = `
                <span class="option-prefix">${optionPrefixes[index]}</span>
                <span class="option-text">${option}</span>
            `;

            // Only add click event if not in review mode
            if (!quizState.reviewMode) {
                optionElement.addEventListener('click', () => selectOption(index));
            }

            optionsContainer.appendChild(optionElement);
        });

        // Update navigation buttons
        prevQuestionBtn.disabled = questionIndex === 0;

        if (questionIndex === quizQuestions.length - 1) {
            nextQuestionBtn.textContent = 'Finish Quiz';
            nextQuestionBtn.removeEventListener('click', showNextQuestion);
            nextQuestionBtn.addEventListener('click', finishQuiz);
        } else {
            nextQuestionBtn.textContent = 'Next <i class="ri-arrow-right-line"></i>';
            nextQuestionBtn.removeEventListener('click', finishQuiz);
            nextQuestionBtn.addEventListener('click', showNextQuestion);
        }

        updateProgressBar();
    }

    function selectOption(optionIndex) {
        quizState.userAnswers[quizState.currentQuestion] = optionIndex;

        // Update UI to show selected option
        const options = document.querySelectorAll('.option');
        options.forEach(option => option.classList.remove('selected'));
        options[optionIndex].classList.add('selected');

        // Check if answer is correct and update score
        const currentQuestion = quizQuestions[quizState.currentQuestion];
        if (optionIndex === currentQuestion.correctIndex) {
            // Only add to score if not already scored for this question
            if (quizState.userAnswers[quizState.currentQuestion] !== currentQuestion.correctIndex) {
                quizState.score += 10;
                document.getElementById('currentScore').textContent = quizState.score;
            }
        } else {
            // If changing from correct to incorrect answer, subtract points
            if (quizState.userAnswers[quizState.currentQuestion] === currentQuestion.correctIndex) {
                quizState.score -= 10;
                document.getElementById('currentScore').textContent = quizState.score;
            }
        }
    }

    function showPreviousQuestion() {
        if (quizState.currentQuestion > 0) {
            displayQuestion(quizState.currentQuestion - 1);
        }
    }

    function showNextQuestion() {
        if (quizState.currentQuestion < quizQuestions.length - 1) {
            displayQuestion(quizState.currentQuestion + 1);
        }
    }

    function finishQuiz() {
        quizPlay.classList.add('hidden');
        quizEnd.classList.remove('hidden');

        // Calculate final score and results
        const correctAnswers = calculateCorrectAnswers();
        const xpEarned = calculateXPEarned(correctAnswers);

        // Update results display
        document.getElementById('finalScore').textContent = quizState.score;
        document.getElementById('correctAnswers').textContent = `${correctAnswers}/${quizQuestions.length}`;
        document.getElementById('xpEarned').textContent = xpEarned;

        // Display feedback based on performance
        const feedbackElement = document.getElementById('resultsFeedback');
        let feedbackText = '';

        if (correctAnswers === quizQuestions.length) {
            feedbackText = '<p>Perfect score! You have mastered Knowing Our Numbers! 🌟</p>';
        } else if (correctAnswers >= quizQuestions.length * 0.7) {
            feedbackText = '<p>Great job! You have a good understanding of this chapter. 👍</p>';
        } else if (correctAnswers >= quizQuestions.length * 0.5) {
            feedbackText = '<p>Good effort! Review the chapter and try again to improve your score. 💪</p>';
        } else {
            feedbackText = '<p>Keep practicing! Review the chapter materials and try the quiz again. 📚</p>';
        }

        feedbackElement.innerHTML = feedbackText;

        // Save progress and XP
        saveQuizResults(xpEarned);
    }

    function calculateCorrectAnswers() {
        let correctCount = 0;
        quizQuestions.forEach((question, index) => {
            if (quizState.userAnswers[index] === question.correctIndex) {
                correctCount++;
            }
        });
        return correctCount;
    }

    function calculateXPEarned(correctAnswers) {
        // Base XP is 30, plus 2 XP for each correct answer
        return 30 + (correctAnswers * 2);
    }

    function saveQuizResults(xpEarned) {
        // Update chapter progress in localStorage
        const currentProgress = parseInt(localStorage.getItem('chapter1_progress') || 35);
        const newProgress = Math.min(100, currentProgress + 20); // Add 20% for completing the quiz

        localStorage.setItem('chapter1_progress', newProgress);

        // Use standardized score saving function
        const progressEarned = 20; // 20% progress for completing the quiz
        if (typeof saveGameResults === 'function') {
            saveGameResults(quizState.score, xpEarned, progressEarned);
        } else {
            // Fallback to manual updates if function not available
            const currentXP = parseInt(localStorage.getItem(LS.xp) || 0);
            const newXP = currentXP + xpEarned;
            localStorage.setItem(LS.xp, newXP);

            const currentScore = parseInt(localStorage.getItem(LS.score) || 0);
            const newScore = currentScore + quizState.score;
            localStorage.setItem(LS.score, newScore);

            try { if (typeof syncScoreboards === 'function') syncScoreboards(); } catch { }
        }

        // Show XP earned message
        showToast('Quiz Completed', `You earned ${xpEarned} XP and ${progressEarned}% progress!`, 'success');
    }

    function reviewQuiz() {
        quizState.reviewMode = true;
        quizEnd.classList.add('hidden');
        quizPlay.classList.remove('hidden');

        // Add review class to body for special styling
        document.body.classList.add('review-mode');

        // Display first question
        displayQuestion(0);

        // Change next button text
        nextQuestionBtn.textContent = 'Next <i class="ri-arrow-right-line"></i> ';
        nextQuestionBtn.addEventListener('click', showNextQuestion);

        // Add a back to results button
        if (!document.getElementById('backToResultsBtn')) {
            const backToResultsBtn = document.createElement('button');
            backToResultsBtn.id = 'backToResultsBtn';
            backToResultsBtn.className = 'btn btn-outline';
            backToResultsBtn.innerHTML = '<i class="ri-arrow-left-line"></i> Back to Results';
            backToResultsBtn.addEventListener('click', backToResults);

            quizControls.appendChild(backToResultsBtn);
        }
    }

    function backToResults() {
        quizState.reviewMode = false;
        quizPlay.classList.add('hidden');
        quizEnd.classList.remove('hidden');
        document.body.classList.remove('review-mode');

        // Remove back to results button
        const backToResultsBtn = document.getElementById('backToResultsBtn');
        if (backToResultsBtn) {
            backToResultsBtn.remove();
        }
    }

    function retryQuiz() {
        // Reset quiz state
        quizState = {
            currentQuestion: 0,
            score: 0,
            userAnswers: new Array(quizQuestions.length).fill(null),
            quizStarted: false,
            reviewMode: false
        };

        // Reset UI
        quizEnd.classList.add('hidden');
        quizIntro.classList.remove('hidden');
        document.body.classList.remove('review-mode');

        // Update score display
        document.getElementById('currentScore').textContent = '0';

        // Remove back to results button if it exists
        const backToResultsBtn = document.getElementById('backToResultsBtn');
        if (backToResultsBtn) {
            backToResultsBtn.remove();
        }
    }

    function updateProgressBar() {
        const progress = ((quizState.currentQuestion + 1) / quizQuestions.length) * 100;
        document.getElementById('quizProgress').textContent = `${Math.round(progress)}%`;
        document.getElementById('quizProgressBar').style.width = `${progress}%`;
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