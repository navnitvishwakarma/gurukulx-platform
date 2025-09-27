// Chapter Selection Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait for header/footer to be injected
    setTimeout(initChapterSelection, 100);
});

function initChapterSelection() {
    // Get the selected class from URL parameters or user data
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('class') || (getUser()?.class || '6');
    
    // Load chapters for the selected class
    loadChapters(classId);
    
    // Set up subject filter
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.addEventListener('change', function() {
        filterChaptersBySubject(this.value);
    });
    
    // Update progress
    updateOverallProgress();
}

// Sample chapter data for Class 6
const CLASS_6_CHAPTERS = [
    {
        id: 1,
        number: "Chapter 1",
        title: "Knowing Our Numbers",
        subject: "math",
        description: "Introduction to large numbers, comparing numbers, estimation, and Roman numerals.",
        activities: 5,
        games: 3,
        progress: 35,
        status: "in-progress"
    },
    {
        id: 2,
        number: "Chapter 2",
        title: "Whole Numbers",
        subject: "math",
        description: "Understanding whole numbers, number line, properties of whole numbers.",
        activities: 4,
        games: 2,
        progress: 0,
        status: "not-started"
    },
    {
        id: 3,
        number: "Chapter 3",
        title: "Playing with Numbers",
        subject: "math",
        description: "Factors, multiples, prime and composite numbers, divisibility rules.",
        activities: 6,
        games: 4,
        progress: 0,
        status: "not-started"
    },
    {
        id: 4,
        number: "Chapter 1",
        title: "Food: Where Does It Come From?",
        subject: "science",
        description: "Sources of food, plant parts and animal products as food, what do animals eat.",
        activities: 4,
        games: 3,
        progress: 20,
        status: "in-progress"
    },
    {
        id: 5,
        number: "Chapter 2",
        title: "Components of Food",
        subject: "science",
        description: "Nutrients in food, balanced diet, deficiency diseases, tests for nutrients.",
        activities: 5,
        games: 2,
        progress: 0,
        status: "not-started"
    },
    {
        id: 6,
        number: "Chapter 1",
        title: "Who Did Patrick's Homework?",
        subject: "english",
        description: "A story about a boy who gets help with his homework from an unexpected source.",
        activities: 3,
        games: 2,
        progress: 75,
        status: "in-progress"
    },
    {
        id: 7,
        number: "Chapter 1",
        title: "What, Where, How and When?",
        subject: "social",
        description: "Introduction to history, sources of history, timelines, and dating events.",
        activities: 4,
        games: 3,
        progress: 0,
        status: "not-started"
    },
    {
        id: 8,
        number: "Chapter 1",
        title: "Understanding Diversity",
        subject: "social",
        description: "Diversity in India, unity in diversity, how diversity enriches our lives.",
        activities: 3,
        games: 2,
        progress: 0,
        status: "not-started"
    },
    {
        id: 9,
        number: "Chapter 1",
        title: "The Environment and Us",
        subject: "environment",
        description: "Understanding our environment, natural resources, and human impact.",
        activities: 5,
        games: 4,
        progress: 0,
        status: "not-started"
    }
];

function loadChapters(classId) {
    const chaptersGrid = document.getElementById('chaptersGrid');
    
    // Clear existing content
    chaptersGrid.innerHTML = '';
    
    // Filter chapters by class (in a real app, this would come from an API)
    const chapters = CLASS_6_CHAPTERS; // For now, we'll use the sample data
    
    if (chapters.length === 0) {
        chaptersGrid.innerHTML = `
            <div class="empty-state">
                <i class="ri-book-open-line"></i>
                <p>No chapters available for this class yet.</p>
            </div>
        `;
        return;
    }
    
    // Render chapters
    chapters.forEach(chapter => {
        const chapterCard = createChapterCard(chapter);
        chaptersGrid.appendChild(chapterCard);
    });
}

function createChapterCard(chapter) {
    const card = document.createElement('div');
    card.className = 'chapter-card';
    card.dataset.subject = chapter.subject;
    
    // Get subject display name
    const subjectNames = {
        'math': 'Mathematics',
        'science': 'Science',
        'english': 'English',
        'social': 'Social Studies',
        'environment': 'Environmental Studies'
    };
    
    // Get icon based on subject
    const subjectIcons = {
        'math': 'ri-calculator-line',
        'science': 'ri-flask-line',
        'english': 'ri-book-2-line',
        'social': 'ri-earth-line',
        'environment': 'ri-plant-line'
    };
    
    card.innerHTML = `
        <div class="chapter-header">
            <div class="chapter-number">${chapter.number}</div>
            <h3 class="chapter-title">${chapter.title}</h3>
            <span class="chapter-subject">${subjectNames[chapter.subject]}</span>
        </div>
        
        <div class="chapter-content">
            <p class="chapter-description">${chapter.description}</p>
            
            <div class="chapter-stats">
                <span class="chapter-stat">
                    <i class="ri-gamepad-line"></i>
                    ${chapter.activities} Activities
                </span>
                <span class="chapter-stat">
                    <i class="ri-trophy-line"></i>
                    ${chapter.games} Games
                </span>
            </div>
            
            <div class="chapter-progress">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${chapter.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${chapter.progress}%"></div>
                </div>
            </div>
            
            <div class="chapter-actions">
                <button class="btn-chapter btn-primary" onclick="startChapter(${chapter.id})">
                    <i class="ri-play-circle-line"></i>
                    ${chapter.progress > 0 ? 'Continue' : 'Start'}
                </button>
                <button class="btn-chapter btn-outline" onclick="viewChapterDetails(${chapter.id})">
                    <i class="ri-information-line"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function filterChaptersBySubject(subject) {
    const chaptersGrid = document.getElementById('chaptersGrid');
    const chapterCards = chaptersGrid.querySelectorAll('.chapter-card');
    
    chapterCards.forEach(card => {
        if (subject === 'all' || card.dataset.subject === subject) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function updateOverallProgress() {
    const chapters = CLASS_6_CHAPTERS;
    const totalChapters = chapters.length;
    
    if (totalChapters === 0) {
        document.getElementById('progressPercent').textContent = '0%';
        document.getElementById('overallProgress').style.width = '0%';
        return;
    }
    
    const totalProgress = chapters.reduce((sum, chapter) => sum + chapter.progress, 0);
    const averageProgress = Math.round(totalProgress / totalChapters);
    
    document.getElementById('progressPercent').textContent = `${averageProgress}%`;
    document.getElementById('overallProgress').style.width = `${averageProgress}%`;
}

function startChapter(chapterId) {
    // Find the chapter
    const chapter = CLASS_6_CHAPTERS.find(c => c.id === chapterId);
    
    if (!chapter) return;
    
    // Navigate to the chapter's games page (for Chapter 1 -> Knowing Our Numbers)
    if (chapter.title === 'Knowing Our Numbers') {
        window.location.href = 'chapter1-games.html';
        return;
    }
    showToast('Chapter Started', `Starting "${chapter.title}"`, 'success');
}

function viewChapterDetails(chapterId) {
    // Find the chapter
    const chapter = CLASS_6_CHAPTERS.find(c => c.id === chapterId);
    
    if (!chapter) return;
    
    // In a real app, this would show a modal with chapter details
    showToast('Chapter Details', `Showing details for "${chapter.title}"`, 'info');
}

function updateChapterProgress(chapterId, progress) {
    // Update the chapter progress in the UI
    const chaptersGrid = document.getElementById('chaptersGrid');
    const chapterCard = chaptersGrid.querySelector(`.chapter-card:nth-child(${chapterId})`);
    
    if (chapterCard) {
        const progressBar = chapterCard.querySelector('.progress');
        const progressText = chapterCard.querySelector('.progress-label span:last-child');
        const startButton = chapterCard.querySelector('.btn-primary');
        
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        if (progress > 0) {
            startButton.innerHTML = '<i class="ri-play-circle-line"></i> Continue';
        }
        
        if (progress === 100) {
            startButton.innerHTML = '<i class="ri-checkbox-circle-line"></i> Completed';
            startButton.style.opacity = '0.7';
            startButton.onclick = null;
        }
    }
}

// Toast notification function (reusing from teacher dashboard)
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