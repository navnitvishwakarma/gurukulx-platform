// Game Selection Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait for header/footer to be injected
    setTimeout(initGameSelection, 100);
});

function initGameSelection() {
    // Update chapter progress from localStorage if available
    updateProgressFromStorage();
}

function updateProgressFromStorage() {
    // In a real app, this would fetch from user data
    const progress = localStorage.getItem('chapter1_progress') || 35;
    document.getElementById('chapterProgress').textContent = `${progress}%`;
    document.querySelector('.chapter-progress .progress').style.width = `${progress}%`;
}

function startGame(gameType) {
    switch(gameType) {
        case 'quiz':
            window.location.href = 'chapter1-quiz.html';
            break;
        case 'balloon':
            window.location.href = 'balloon-game.html';
            break;
        case 'comparison':
            window.location.href = 'number-comparison.html';
            break;
        case 'eqballoon':
            window.location.href = 'balloon-equations.html';
            break;
        case 'roman':
            showToast('Coming Soon', 'This game will be available soon!', 'info');
            break;
        default:
            showToast('Error', 'Game not available', 'error');
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