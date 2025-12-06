// Profile Page Functionality

// Profile data and state
let profileData = {
  activities: [],
  rank: 0,
  classRank: 0
};

// Initialize profile page
async function initProfilePage() {
  // Load additional profile data
  await loadProfileData();

  // Set up event listeners
  setupEventListeners();

  // Update profile stats
  updateProfileStats();

  // Render badges with enhanced UI
  renderBadges();

  // Render subject performance
  renderSubjectPerformance();
}

// Load additional profile data
async function loadProfileData() {
  // Load activities from localStorage or initialize
  profileData.activities = getJSON('gx_activities', []);

  // Calculate ranks
  await calculateRanks();
}

// Calculate user ranks
async function calculateRanks() {
  let leaderboard = [];
  if (typeof fetchLeaderboard === 'function') {
    leaderboard = await fetchLeaderboard();
  } else {
    console.warn("fetchLeaderboard not found");
    // Fallback to empty or local
    leaderboard = getJSON(LS.leaderboard, []);
  }

  const user = getUser();
  const userClass = user.class;

  // Calculate global rank
  const globalRank = leaderboard.findIndex(player => player.name === (user.name || "You")) + 1;
  profileData.rank = globalRank > 0 ? globalRank : 0;

  // Calculate class rank
  if (userClass) {
    const classPlayers = leaderboard.filter(player => {
      const pClass = player.profile?.class || player.class;
      return String(pClass) === String(userClass);
    });
    const classRank = classPlayers.findIndex(player => player.name === (user.name || "You")) + 1;
    profileData.classRank = classRank > 0 ? classRank : 0;
  }
}

// Set up event listeners
function setupEventListeners() {
  // Edit profile button
  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openEditProfileModal);
  }

  // Edit profile form
  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', handleProfileUpdate);
  }

  // Modal close buttons
  const modalClose = document.querySelector('.modal-close');
  const modalCancel = document.querySelector('.modal-cancel');

  if (modalClose) {
    modalClose.addEventListener('click', closeEditProfileModal);
  }

  if (modalCancel) {
    modalCancel.addEventListener('click', closeEditProfileModal);
  }

  // Avatar upload
  const avatarUpload = document.getElementById('avatarUpload');
  if (avatarUpload) {
    avatarUpload.addEventListener('change', handleAvatarUpload);
  }

  // Close modal when clicking outside
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeEditProfileModal();
      }
    });
  }
}

// Open edit profile modal
function openEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  const user = getUser();

  // Fill form with current data
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editClass').value = user.class || '';

  // Show modal
  modal.classList.add('show');
}

// Close edit profile modal
function closeEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  modal.classList.remove('show');
}

// Handle profile update
function handleProfileUpdate(e) {
  e.preventDefault();

  const name = document.getElementById('editName').value.trim();
  const userClass = document.getElementById('editClass').value;

  if (!name) {
    alert('Please enter your name');
    return;
  }

  // Update user data
  const userData = getUser();
  userData.name = name;
  userData.class = userClass;
  localStorage.setItem(LS.user, JSON.stringify(userData));

  // Sync changes to server
  if (typeof saveCurrentUserProfile === 'function') {
    saveCurrentUserProfile().catch(err => console.error("Failed to sync profile update:", err));
  }

  // Update UI
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileClass').textContent = userClass ? `Grade ${userClass}` : 'Grade Not Selected';

  // Recalculate ranks if class changed
  if (userClass !== userData.class) {
    calculateRanks();
    updateProfileStats();
  }

  // Close modal
  closeEditProfileModal();

  // Show success message
  alert('Profile updated successfully!');
}

// Handle avatar upload
function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const avatar = document.querySelector('.avatar.xl');
    avatar.src = e.target.result;

    // Save to localStorage
    localStorage.setItem('gx_avatar', e.target.result);
  };
  reader.readAsDataURL(file);
}

// Update profile statistics
function updateProfileStats() {
  const user = getUser();

  // Update class display
  document.getElementById('profileClass').textContent = user.class ? `Grade ${user.class}` : 'Grade Not Selected';

  // Update rank displays
  document.getElementById('leaderboardRank').textContent = profileData.rank > 0 ? `#${profileData.rank}` : '—';
  document.getElementById('classRank').textContent = profileData.classRank > 0 ? `#${profileData.classRank}` : '—';

  // Update completion rate (placeholder - would need actual activity data)
  const completionRate = Math.min(100, Math.floor(Math.random() * 100));
  document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// Render badges with enhanced UI
function renderBadges() {
  const badges = computeBadges();
  const root = document.getElementById('badgeGrid');
  const totalBadges = document.getElementById('totalBadges');

  // Update badge count
  totalBadges.textContent = `${badges.length}/8`;

  // All possible badges
  const allBadges = [
    { id: 'starter', name: 'Starter', desc: 'Score 100 points', icon: 'ri-user-star-line' },
    { id: 'quiz-ace', name: 'Quiz Ace', desc: 'Score 300 points', icon: 'ri-quiz-line' },
    { id: 'eco-hero', name: 'Eco Hero', desc: 'Score 600 points', icon: 'ri-leaf-line' },
    { id: 'streak-3', name: '3-Day Streak', desc: 'Maintain a 3-day streak', icon: 'ri-fire-line' },
    { id: 'week-warrior', name: 'Week Warrior', desc: 'Maintain a 7-day streak', icon: 'ri-calendar-event-line' },
    { id: 'math-master', name: 'Math Master', desc: 'Complete all math games', icon: 'ri-calculator-line' },
    { id: 'science-whiz', name: 'Science Whiz', desc: 'Complete all science games', icon: 'ri-flask-line' },
    { id: 'eco-champion', name: 'Eco Champion', desc: 'Complete all environment games', icon: 'ri-plant-line' }
  ];

  root.innerHTML = allBadges.map(badge => {
    const isUnlocked = badges.includes(badge.name);
    return `
      <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}">
        <i class="${badge.icon}"></i>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
      </div>
    `;
  }).join('');
}

// Render subject performance
function renderSubjectPerformance() {
  const root = document.getElementById('subjectPerformance');
  if (!root) return;

  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Environment', 'GK'];
  const user = getUser();

  // Simulate scores based on user stats (consistent with other simulations)
  // In a real app, this would come from the backend
  const baseScore = Math.min(100, Math.round((Number(localStorage.getItem('gx_score') || 0) / 1000) * 100)) || 65;

  root.innerHTML = subjects.map(subject => {
    // Deterministic simulation based on name and subject
    let hash = 0;
    const str = (user.name || 'User') + subject;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = Math.abs(hash);

    const variance = (hash % 30) - 15; // -15 to +15
    let score = Math.max(10, Math.min(100, baseScore + variance));

    // Color coding
    let colorClass = 'primary';
    if (score >= 80) colorClass = 'success';
    else if (score >= 60) colorClass = 'primary';
    else if (score >= 40) colorClass = 'warning';
    else colorClass = 'danger';

    return `
      <div class="subject-item" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: 500;">${subject}</span>
          <span style="font-weight: 600;">${score}%</span>
        </div>
        <div class="progress-bar" style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
          <div class="progress ${colorClass}" style="width: ${score}%; height: 100%; background-color: var(--${colorClass}-color, #4f46e5);"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Get appropriate icon for activity type
function getActivityIcon(type) {
  const icons = {
    quiz: 'quiz-line',
    game: 'gamepad-line',
    badge: 'medal-line',
    login: 'login-circle-line',
    streak: 'fire-line'
  };
  return icons[type] || 'question-line';
}

// Format date for display
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Load saved avatar if exists
function loadSavedAvatar() {
  const savedAvatar = localStorage.getItem('gx_avatar');
  if (savedAvatar) {
    const avatar = document.querySelector('.avatar.xl');
    if (avatar) {
      avatar.src = savedAvatar;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  // Wait for main.js to initialize
  setTimeout(function () {
    initProfilePage();
    loadSavedAvatar();
  }, 100);
});