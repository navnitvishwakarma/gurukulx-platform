
document.addEventListener('DOMContentLoaded', function() {

    setTimeout(initClassSelection, 100);
});

function initClassSelection() {
    const classCards = document.querySelectorAll('.class-card');
    const continueBtn = document.getElementById('continueBtn');
    let selectedClass = null;
    

    const user = getUser();
    if (user.class) {

        const card = document.querySelector(`.class-card[data-class="${user.class}"]`);
        if (card) {
            card.classList.add('selected');
            selectedClass = user.class;
            continueBtn.disabled = false;
        }
    }
    

    classCards.forEach(card => {
        card.addEventListener('click', function() {

            classCards.forEach(c => c.classList.remove('selected'));
            

            this.classList.add('selected');
            

            selectedClass = this.getAttribute('data-class');
            

            continueBtn.disabled = false;
        });
    });
    

    continueBtn.addEventListener('click', function() {
        if (selectedClass) {

            const userData = getUser();
            userData.class = selectedClass;
            localStorage.setItem(LS.user, JSON.stringify(userData));
            

            updateClassesData(selectedClass);
            

            if (selectedClass === "6") {
                window.location.href = 'class6-chapters.html?class=6';
            } else {
                window.location.href = 'coming-soon.html?class=' + encodeURIComponent(selectedClass);
            }
        }
    });
}


function updateClassesData(selectedClass) {
    const classes = getJSON(LS.classes, []);
    const classExists = classes.some(c => c.name === selectedClass);
    
    if (!classExists) {

        classes.push({
            name: selectedClass,
            fullName: `Grade ${selectedClass}`
        });
        localStorage.setItem(LS.classes, JSON.stringify(classes));
    }
}