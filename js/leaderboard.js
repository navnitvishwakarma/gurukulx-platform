// Leaderboard Page Functionality

// Helper: attach class from students list to leaderboard entries
function withClasses(rows) {
    const students = getJSON(LS.students, []);
    return rows.map(r => {
        const match = students.find(s => s.name === r.name);
        return { ...r, class: match?.class || r.class };
    });
}

// Override the renderLeaderboardFull function for enhanced leaderboard
function renderLeaderboardFull() {
    upsertYouInLeaderboard();
    const root = document.getElementById("leaderboardTable");
    if (!root) return;
    
    let rows = withClasses(getLeaderboard());
    
    if (!rows || rows.length === 0) {
        root.innerHTML = `
            <div class="empty-state">
                <i class="ri-trophy-line"></i>
                <p>No leaderboard data available yet.</p>
                <p>Complete some activities to appear on the leaderboard!</p>
            </div>
        `;
        return;
    }
    
    // Default filter to 'all' on load
    const classFilter = document.getElementById('classFilter');
    if (classFilter) classFilter.value = 'all';
    
    root.innerHTML = `
        <div class="row header">
            <div class="rank">#</div>
            <div>Name</div>
            <div>Class</div>
            <div>Score</div>
            <div>Badges</div>
        </div>
        ${rows
            .map(
                (d, i) => `
            <div class="row ${d.name === (getUser().name || "You") ? 'highlight' : ''}" data-class="${d.class || ''}">
                <div class="rank">${i + 1}</div>
                <div>${escapeHTML(d.name)}</div>
                <div>${d.class ? 'Grade ' + d.class : '-'}</div>
                <div>${d.score}</div>
                <div>${d.badge ? `<span class="badge"><i class="ri-medal-line"></i>${d.badge}</span>` : ""}</div>
            </div>
        `,
            )
            .join("")}
    `;
    
    // Apply initial filter and stats
    const initial = (document.getElementById('classFilter')?.value) || 'all';
    filterLeaderboardByClass(initial);
}

// Filter leaderboard by class
function filterLeaderboardByClass(className) {
    // Show/hide rows
    const rowEls = document.querySelectorAll('#leaderboardTable .row');
    rowEls.forEach(row => {
        if (row.classList.contains('header')) return;
        const inClass = (className === 'all') || (row.getAttribute('data-class') === className);
        row.style.display = inClass ? 'grid' : 'none';
    });
    
    // Recompute stats based on filter
    const allRows = withClasses(getLeaderboard());
    const filtered = className === 'all' ? allRows : allRows.filter(r => String(r.class || '') === String(className));
    updateLeaderboardStats(filtered);
}

// Update leaderboard statistics
function updateLeaderboardStats(rowsOverride) {
    const rows = rowsOverride ? withClasses(rowsOverride) : withClasses(getLeaderboard());
    const user = getUser();
    
    // Update total players (in current filter)
    document.getElementById('totalPlayers').textContent = rows.length;
    
    // Update top score (in current filter)
    const topScore = rows.length > 0 ? Math.max(...rows.map(r => r.score)) : 0;
    document.getElementById('topScore').textContent = topScore;
    
    // Update user's rank (in current filter)
    const sorted = [...rows].sort((a,b) => b.score - a.score);
    const userRank = sorted.findIndex(r => r.name === (user.name || 'You')) + 1;
    document.getElementById('yourRank').textContent = userRank > 0 ? userRank : '-';
}

// No-op: stats are updated via updateLeaderboardStats(filtered)

// Initialize leaderboard page
function initLeaderboardPage() {
    // Add refresh button functionality
    const refreshBtn = document.getElementById('refreshLeaderboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            renderLeaderboardFull();
            // Show refresh animation
            this.classList.add('refreshing');
            setTimeout(() => {
                this.classList.remove('refreshing');
            }, 1000);
        });
    }
    
    // Add filter functionality
    const classFilter = document.getElementById('classFilter');
    if (classFilter) {
        classFilter.addEventListener('change', function() {
            filterLeaderboardByClass(this.value);
        });
    }
    
    // Initial stats update
    updateLeaderboardStats();
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for main.js to initialize
    setTimeout(function() {
        initLeaderboardPage();
    }, 100);
});

// Add CSS for refresh animation
const refreshStyle = document.createElement('style');
refreshStyle.textContent = `
    .btn.refreshing i {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(refreshStyle);