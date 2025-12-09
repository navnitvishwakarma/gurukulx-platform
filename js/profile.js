


let profileData = {
  activities: [],
  rank: 0,
  classRank: 0
};


async function initProfilePage() {

  await loadProfileData();


  setupEventListeners();


  updateProfileStats();


  renderBadges();


  renderSubjectPerformance();
}


async function loadProfileData() {

  profileData.activities = getJSON('gx_activities', []);


  await calculateRanks();
}


async function calculateRanks() {
  let leaderboard = [];
  if (typeof fetchLeaderboard === 'function') {
    leaderboard = await fetchLeaderboard();
  } else {
    console.warn("fetchLeaderboard not found");

    leaderboard = getJSON(LS.leaderboard, []);
  }

  const user = getUser();
  const userClass = user.class;


  const globalRank = leaderboard.findIndex(player => player.name === (user.name || "You")) + 1;
  profileData.rank = globalRank > 0 ? globalRank : 0;


  if (userClass) {
    const classPlayers = leaderboard.filter(player => {
      const pClass = player.profile?.class || player.class;
      return String(pClass) === String(userClass);
    });
    const classRank = classPlayers.findIndex(player => player.name === (user.name || "You")) + 1;
    profileData.classRank = classRank > 0 ? classRank : 0;
  }
}


function setupEventListeners() {

  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openEditProfileModal);
  }


  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', handleProfileUpdate);
  }


  const modalClose = document.querySelector('.modal-close');
  const modalCancel = document.querySelector('.modal-cancel');

  if (modalClose) {
    modalClose.addEventListener('click', closeEditProfileModal);
  }

  if (modalCancel) {
    modalCancel.addEventListener('click', closeEditProfileModal);
  }


  const avatarUpload = document.getElementById('avatarUpload');
  if (avatarUpload) {
    avatarUpload.addEventListener('change', handleAvatarUpload);
  }


  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeEditProfileModal();
      }
    });
  }
}


function openEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  const user = getUser();


  document.getElementById('editName').value = user.name || '';
  document.getElementById('editClass').value = user.class || '';


  modal.classList.add('show');
}


function closeEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  modal.classList.remove('show');
}


function handleProfileUpdate(e) {
  e.preventDefault();

  const name = document.getElementById('editName').value.trim();
  const userClass = document.getElementById('editClass').value;

  if (!name) {
    alert('Please enter your name');
    return;
  }


  const userData = getUser();
  userData.name = name;
  userData.class = userClass;
  localStorage.setItem(LS.user, JSON.stringify(userData));


  if (typeof saveCurrentUserProfile === 'function') {
    saveCurrentUserProfile().catch(err => console.error("Failed to sync profile update:", err));
  }


  document.getElementById('profileName').textContent = name;
  document.getElementById('profileClass').textContent = userClass ? `Grade ${userClass}` : 'Grade Not Selected';


  if (userClass !== userData.class) {
    calculateRanks();
    updateProfileStats();
  }


  closeEditProfileModal();


  alert('Profile updated successfully!');
}


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


    localStorage.setItem('gx_avatar', e.target.result);
  };
  reader.readAsDataURL(file);
}


function updateProfileStats() {
  const user = getUser();


  document.getElementById('profileClass').textContent = user.class ? `Grade ${user.class}` : 'Grade Not Selected';


  document.getElementById('leaderboardRank').textContent = profileData.rank > 0 ? `#${profileData.rank}` : '—';
  document.getElementById('classRank').textContent = profileData.classRank > 0 ? `#${profileData.classRank}` : '—';


  const completionRate = Math.min(100, Math.floor(Math.random() * 100));
  document.getElementById('completionRate').textContent = `${completionRate}%`;
}


function renderBadges() {
  const badges = computeBadges();
  const root = document.getElementById('badgeGrid');
  const totalBadges = document.getElementById('totalBadges');


  totalBadges.textContent = `${badges.length}/8`;


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


function renderSubjectPerformance() {
  const root = document.getElementById('subjectPerformance');
  if (!root) return;

  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Environment', 'GK'];
  const user = getUser();



  const baseScore = Math.min(100, Math.round((Number(localStorage.getItem('gx_score') || 0) / 1000) * 100)) || 65;

  root.innerHTML = subjects.map(subject => {

    let hash = 0;
    const str = (user.name || 'User') + subject;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = Math.abs(hash);

    const variance = (hash % 30) - 15; // -15 to +15
    let score = Math.max(10, Math.min(100, baseScore + variance));


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


function loadSavedAvatar() {
  const savedAvatar = localStorage.getItem('gx_avatar');
  if (savedAvatar) {
    const avatar = document.querySelector('.avatar.xl');
    if (avatar) {
      avatar.src = savedAvatar;
    }
  }
}


document.addEventListener('DOMContentLoaded', function () {

  setTimeout(function () {
    initProfilePage();
    loadSavedAvatar();
  }, 100);
});