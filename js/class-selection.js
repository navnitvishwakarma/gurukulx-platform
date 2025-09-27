// Class Selection Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait for header/footer to be injected
    setTimeout(initClassSelection, 100);
});

function initClassSelection() {
    const classCards = document.querySelectorAll('.class-card');
    const continueBtn = document.getElementById('continueBtn');
    let selectedClass = null;
    
    // Check if user already has a class selected
    const user = getUser();
    if (user.class) {
        // Pre-select the class if already chosen
        const card = document.querySelector(`.class-card[data-class="${user.class}"]`);
        if (card) {
            card.classList.add('selected');
            selectedClass = user.class;
            continueBtn.disabled = false;
        }
    }
    
    // Add click event to each class card
    classCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            classCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Store the selected class
            selectedClass = this.getAttribute('data-class');
            
            // Enable the continue button
            continueBtn.disabled = false;
        });
    });
    
    // Handle continue button click
    continueBtn.addEventListener('click', function() {
        if (selectedClass) {
            // Store the selected class in user data
            const userData = getUser();
            userData.class = selectedClass;
            localStorage.setItem(LS.user, JSON.stringify(userData));
            
            // Update classes data structure if needed
            updateClassesData(selectedClass);
            
            // Redirect: Class 6 -> chapters, others -> Coming Soon page
            if (selectedClass === "6") {
                window.location.href = 'class6-chapters.html?class=6';
            } else {
                window.location.href = 'coming-soon.html?class=' + encodeURIComponent(selectedClass);
            }
        }
    });
}

// Update classes data with the selected class if not already present
function updateClassesData(selectedClass) {
    const classes = getJSON(LS.classes, []);
    const classExists = classes.some(c => c.name === selectedClass);
    
    if (!classExists) {
        // Add the class to the classes list
        classes.push({
            name: selectedClass,
            fullName: `Grade ${selectedClass}`
        });
        localStorage.setItem(LS.classes, JSON.stringify(classes));
    }
}