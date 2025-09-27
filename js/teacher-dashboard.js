// Teacher Dashboard Specific JavaScript

// Data keys for teacher-specific data
const TEACHER_LS = {
  announcements: "gx_teacher_announcements",
  notifications: "gx_teacher_notifications",
  activities: "gx_teacher_activities",
  deadlines: "gx_teacher_deadlines",
  analyticsView: "gx_teacher_analytics_view",
  classFilter: "gx_teacher_class_filter",
  performanceFilter: "gx_teacher_performance_filter"
};

// Initialize teacher dashboard
document.addEventListener("DOMContentLoaded", () => {
  // Wait for main.js to initialize
  setTimeout(() => {
    initTeacherDashboard();
  }, 100);
});

function initTeacherDashboard() {
  // Initialize teacher-specific functionality
  initTeacherData();
  initEventListeners();
  renderTeacherDashboard();
  initCharts();
  
  // Set current date
  setDashboardDate();
}

function initTeacherData() {
  // Initialize teacher-specific data if not exists
  if (!localStorage.getItem(TEACHER_LS.announcements)) {
    localStorage.setItem(TEACHER_LS.announcements, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(TEACHER_LS.notifications)) {
    // Sample notifications
    const notifications = [
      {
        id: 1,
        title: "New Assignment Submitted",
        message: "Aditi submitted the Science homework",
        time: new Date().toISOString(),
        type: "submission",
        read: false
      },
      {
        id: 2,
        title: "Class Performance Update",
        message: "Grade 10 average score improved by 12%",
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: "performance",
        read: true
      }
    ];
    localStorage.setItem(TEACHER_LS.notifications, JSON.stringify(notifications));
  }
  
  if (!localStorage.getItem(TEACHER_LS.activities)) {
    // Sample activities
    const activities = [
      {
        id: 1,
        title: "Assignment Created",
        details: "Math Quiz for Grade 8",
        time: new Date().toISOString(),
        type: "assignment"
      },
      {
        id: 2,
        title: "Announcement Sent",
        details: "Parent-Teacher meeting notice",
        time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        type: "announcement"
      }
    ];
    localStorage.setItem(TEACHER_LS.activities, JSON.stringify(activities));
  }
  
  if (!localStorage.getItem(TEACHER_LS.deadlines)) {
    localStorage.setItem(TEACHER_LS.deadlines, JSON.stringify([]));
  }
  
  // Set default view preferences if not set
  if (!localStorage.getItem(TEACHER_LS.analyticsView)) {
    localStorage.setItem(TEACHER_LS.analyticsView, "weekly");
  }
  
  if (!localStorage.getItem(TEACHER_LS.classFilter)) {
    localStorage.setItem(TEACHER_LS.classFilter, "all");
  }
  
  if (!localStorage.getItem(TEACHER_LS.performanceFilter)) {
    localStorage.setItem(TEACHER_LS.performanceFilter, "score");
  }
}

function initEventListeners() {
  // Refresh dashboard
  document.getElementById("refreshDashboard").addEventListener("click", refreshDashboard);
  
  // Class filter
  document.getElementById("classFilter").addEventListener("change", (e) => {
    localStorage.setItem(TEACHER_LS.classFilter, e.target.value);
    renderClassList();
    renderStudentList();
    updateCharts();
  });
  
  // Performance filter
  document.getElementById("performanceFilter").addEventListener("change", (e) => {
    localStorage.setItem(TEACHER_LS.performanceFilter, e.target.value);
    renderStudentList();
  });
  
  // Rows filter
  document.getElementById("rowsFilter").addEventListener("change", renderStudentList);
  
  // Student search
  document.getElementById("studentSearch").addEventListener("input", debounce(renderStudentList, 300));
  
  // Refresh students
  document.getElementById("refreshStudents").addEventListener("click", renderStudentList);
  
  // View all students
  document.getElementById("viewAllStudents").addEventListener("click", () => {
    // In a real app, this would navigate to a student management page
    showToast("Info", "Student management page would open here", "info");
  });
  
  // Expand leaderboard
  document.getElementById("expandLeaderboard").addEventListener("click", () => {
    // In a real app, this would expand the leaderboard or open a modal
    showToast("Info", "Expanded leaderboard view would open here", "info");
  });
  
  // Customize actions
  document.getElementById("customizeActions").addEventListener("click", () => {
    showToast("Info", "Quick actions customization would open here", "info");
  });
  
  // View all deadlines
  document.getElementById("viewAllDeadlines").addEventListener("click", () => {
    // In a real app, this would navigate to a deadlines page
    showToast("Info", "All deadlines page would open here", "info");
  });
  
  // View options for analytics
  document.querySelectorAll(".view-option").forEach(option => {
    option.addEventListener("click", (e) => {
      const view = e.target.dataset.view;
      localStorage.setItem(TEACHER_LS.analyticsView, view);
      
      // Update active state
      document.querySelectorAll(".view-option").forEach(opt => {
        opt.classList.remove("active");
      });
      e.target.classList.add("active");
      
      updateCharts();
    });
  });
  
  // Chart type buttons
  document.querySelectorAll(".chart-action-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const chartId = e.target.dataset.chart;
      const chartType = e.target.dataset.type;
      
      // Update active state
      document.querySelectorAll(`[data-chart="${chartId}"]`).forEach(b => {
        b.classList.remove("active");
      });
      e.target.classList.add("active");
      
      // Change chart type
      changeChartType(chartId, chartType);
    });
  });
  
  // Export analytics
  document.getElementById("exportAnalytics").addEventListener("click", exportAnalytics);
  
  // Export class data
  document.getElementById("exportClassData").addEventListener("click", exportClassData);
  
  // Activity filter
  document.getElementById("activityFilter").addEventListener("change", renderRecentActivity);
  
  // View all activity
  document.getElementById("viewAllActivity").addEventListener("click", () => {
    // In a real app, this would navigate to an activity log page
    showToast("Info", "Activity log page would open here", "info");
  });
  
  // Mark all notifications as read
  document.getElementById("markAllRead").addEventListener("click", markAllNotificationsAsRead);
  
  // Notification settings
  document.getElementById("notificationSettings").addEventListener("click", () => {
    showToast("Info", "Notification settings would open here", "info");
  });
  
  // Announcement modal
  document.getElementById("sendAnnouncement").addEventListener("click", openAnnouncementModal);
  document.getElementById("cancelAnnouncement").addEventListener("click", closeAnnouncementModal);
  document.querySelector(".modal-close").addEventListener("click", closeAnnouncementModal);
  document.getElementById("announcementForm").addEventListener("submit", handleAnnouncementSubmit);
  
  // Tab buttons
  document.querySelectorAll(".tab-btn").forEach(tab => {
    tab.addEventListener("click", (e) => {
      const tabName = e.target.dataset.tab;
      
      // Update active tab
      document.querySelectorAll(".tab-btn").forEach(t => {
        t.classList.remove("active");
      });
      e.target.classList.add("active");
      
      // Show corresponding content
      document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
      });
      document.getElementById(`${tabName}Tab`).classList.add("active");
    });
  });
  
  // Close modal when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeAnnouncementModal();
    }
  });
}

function renderTeacherDashboard() {
  // Update teacher name
  const user = getUser();
  document.getElementById("teacherName").textContent = user.name || "Teacher";
  
  // Update stats
  updateDashboardStats();
  
  // Render lists
  renderClassList();
  renderStudentList();
  renderSubjectList();
  renderTeacherScoreboard();
  renderRecentActivity();
  renderNotifications();
  renderUpcomingDeadlines();
  
  // Update class average progress
  updateClassAverageProgress();
}

function updateDashboardStats() {
  const students = getJSON(LS.students, []);
  const assignments = getJSON(LS.assignments, []);
  const classes = getJSON(LS.classes, []);
  
  // Update counts
  document.getElementById("studentCount").textContent = students.length;
  document.getElementById("classCount").textContent = classes.length;
  document.getElementById("assignmentCount").textContent = assignments.length;
  
  // Calculate active sessions (simulated)
  const activeSessions = Math.min(students.length, Math.floor(Math.random() * 10) + 5);
  document.getElementById("activeSessions").textContent = activeSessions;
  
  // Calculate top student score
  const topStudent = [...students].sort((a, b) => b.score - a.score)[0];
  const topScore = topStudent ? topStudent.score : 0;
  document.getElementById("topStudentScore").textContent = topScore;
  
  // Calculate average score
  const avgScore = students.length ? Math.round(students.reduce((sum, student) => sum + student.score, 0) / students.length) : 0;
  document.getElementById("avgScore").textContent = avgScore;
  
  // Calculate total badges (simulated)
  const totalBadges = students.length * 2; // Simulated
  document.getElementById("totalBadges").textContent = totalBadges;
  
  // Calculate completion rate (simulated)
  const completionRate = Math.min(100, Math.round(avgScore / 10)); // Simulated
  document.getElementById("completionRate").textContent = `${completionRate}%`;
  
  // Update changes (simulated)
  document.getElementById("topScoreChange").querySelector("span").textContent = "5%";
  document.getElementById("avgScoreChange").querySelector("span").textContent = "2%";
  document.getElementById("badgesChange").querySelector("span").textContent = "3";
  document.getElementById("completionChange").querySelector("span").textContent = "3%";
}

function renderClassList() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);
  const classFilter = localStorage.getItem(TEACHER_LS.classFilter) || "all";
  
  // Filter classes if needed
  let filteredClasses = classes;
  if (classFilter !== "all") {
    filteredClasses = classes.filter(c => c.name === classFilter);
  }
  
  // Count students per class
  const classCounts = {};
  students.forEach(student => {
    if (student.class) {
      classCounts[student.class] = (classCounts[student.class] || 0) + 1;
    }
  });
  
  // Calculate average score per class
  const classScores = {};
  const classScoreCounts = {};
  students.forEach(student => {
    if (student.class && student.score) {
      classScores[student.class] = (classScores[student.class] || 0) + student.score;
      classScoreCounts[student.class] = (classScoreCounts[student.class] || 0) + 1;
    }
  });
  
  const classList = document.getElementById("classList");
  classList.innerHTML = filteredClasses.map(cls => {
    const studentCount = classCounts[cls.name] || 0;
    const avgScore = classScoreCounts[cls.name] 
      ? Math.round(classScores[cls.name] / classScoreCounts[cls.name]) 
      : 0;
    
    return `
      <li>
        <div>
          <strong>${cls.fullName || `Grade ${cls.name}`}</strong>
          <span class="muted">${studentCount} students</span>
        </div>
        <div>
          <span class="badge">Avg: ${avgScore}</span>
        </div>
      </li>
    `;
  }).join("") || `<li class="empty-state">No classes found</li>`;
}

function renderStudentList() {
  const students = getJSON(LS.students, []);
  const currentName = (getUser()?.name) || "You";
  const classFilter = localStorage.getItem(TEACHER_LS.classFilter) || "all";
  const performanceFilter = localStorage.getItem(TEACHER_LS.performanceFilter) || "score";
  const rowsFilter = parseInt(document.getElementById("rowsFilter").value) || 10;
  const searchTerm = document.getElementById("studentSearch").value.toLowerCase();
  
  // Filter students
  // Exclude the currently logged-in user and placeholder 'You'
  let filteredStudents = students.filter(s => s.name !== currentName && s.name !== 'You');
  
  // Filter by class
  if (classFilter !== "all") {
    filteredStudents = filteredStudents.filter(student => student.class === classFilter);
  }
  
  // Filter by search term
  if (searchTerm) {
    filteredStudents = filteredStudents.filter(student => 
      student.name.toLowerCase().includes(searchTerm)
    );
  }
  
  // Sort students
  switch (performanceFilter) {
    case "score":
      filteredStudents.sort((a, b) => b.score - a.score);
      break;
    case "progress":
      // Simulated progress based on score
      filteredStudents.sort((a, b) => (b.progress || b.score / 10) - (a.progress || a.score / 10));
      break;
    case "name":
      filteredStudents.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "class":
      filteredStudents.sort((a, b) => a.class - b.class);
      break;
  }
  
  // Limit rows
  filteredStudents = filteredStudents.slice(0, rowsFilter);
  
  const studentList = document.getElementById("studentList");
  studentList.innerHTML = filteredStudents.map(student => {
    const progress = student.progress || Math.min(100, Math.round(student.score / 10)); // Simulated progress
    
    return `
      <li>
        <div>
          <strong>${escapeHTML(student.name)}</strong>
          <span class="muted">Grade ${student.class || "N/A"}</span>
        </div>
        <div>
          <span class="badge">Score: ${student.score}</span>
          <span class="badge">Progress: ${progress}%</span>
        </div>
      </li>
    `;
  }).join("") || `<li class="empty-state">No students found</li>`;
}

function renderSubjectList() {
  // Sample subjects data - in a real app, this would come from your data
  const subjects = [
    { name: "Mathematics", completion: 75, avgScore: 82 },
    { name: "Science", completion: 68, avgScore: 78 },
    { name: "English", completion: 85, avgScore: 88 },
    { name: "Social Studies", completion: 62, avgScore: 72 },
    { name: "Computer Science", completion: 90, avgScore: 92 }
  ];
  
  const subjectList = document.getElementById("subjectList");
  subjectList.innerHTML = subjects.map(subject => `
    <li>
      <div>
        <strong>${subject.name}</strong>
        <div class="progress-wrap">
          <div class="progress-label">
            <span>Completion</span>
            <span>${subject.completion}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${subject.completion}%"></div>
          </div>
        </div>
      </div>
      <div>
        <span class="badge">Avg: ${subject.avgScore}</span>
      </div>
    </li>
  `).join("");
}

function renderTeacherScoreboard() {
  const students = getJSON(LS.students, []);
  const currentName = (getUser()?.name) || "You";
  const filtered = students.filter(s => s.name !== currentName && s.name !== 'You');
  const topStudents = [...filtered].sort((a, b) => b.score - a.score).slice(0, 5);
  
  const scoreboard = document.getElementById("teacherScoreboard");
  scoreboard.innerHTML = `
    <div class="row header">
      <div class="rank">#</div>
      <div>Student</div>
      <div>Score</div>
    </div>
    ${topStudents.map((student, index) => `
      <div class="row">
        <div class="rank">${index + 1}</div>
        <div>${escapeHTML(student.name)}</div>
        <div>${student.score}</div>
      </div>
    `).join("")}
  `;
  
  // Update top count badge
  document.getElementById("topCount").textContent = topStudents.length;
}

function renderRecentActivity() {
  const activities = getJSON(TEACHER_LS.activities, []);
  const activityFilter = document.getElementById("activityFilter").value;
  
  // Filter activities
  let filteredActivities = activities;
  if (activityFilter !== "all") {
    filteredActivities = activities.filter(activity => activity.type === activityFilter);
  }
  
  // Sort by time (newest first)
  filteredActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  const activityFeed = document.getElementById("recentActivity");
  
  if (filteredActivities.length === 0) {
    activityFeed.innerHTML = `
      <div class="empty-activity">
        <i class="ri-history-line"></i>
        <p>No recent activity yet</p>
      </div>
    `;
    return;
  }
  
  activityFeed.innerHTML = filteredActivities.map(activity => {
    const timeAgo = getTimeAgo(new Date(activity.time));
    const icon = getActivityIcon(activity.type);
    
    return `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="${icon}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-details">${activity.details}</div>
        </div>
        <div class="activity-time">${timeAgo}</div>
      </div>
    `;
  }).join("");
}

function renderNotifications() {
  const notifications = getJSON(TEACHER_LS.notifications, []);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const notificationsList = document.getElementById("notificationsList");
  
  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="empty-state">
        <i class="ri-notification-off-line"></i>
        <p>No new notifications</p>
      </div>
    `;
    return;
  }
  
  notificationsList.innerHTML = notifications.map(notification => {
    const timeAgo = getTimeAgo(new Date(notification.time));
    const icon = getNotificationIcon(notification.type);
    const unreadClass = notification.read ? "" : "unread";
    
    return `
      <div class="notification-item ${unreadClass}">
        <div class="notification-icon">
          <i class="${icon}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
        </div>
        <div class="notification-time">${timeAgo}</div>
        ${!notification.read ? '<div class="notification-badge"></div>' : ''}
      </div>
    `;
  }).join("");
}

function renderUpcomingDeadlines() {
  const assignments = getJSON(LS.assignments, []);
  const now = new Date();
  const upcomingDeadlines = assignments
    .filter(assignment => {
      if (!assignment.due) return false;
      const dueDate = new Date(assignment.due);
      return dueDate > now;
    })
    .sort((a, b) => new Date(a.due) - new Date(b.due))
    .slice(0, 5);
  
  const deadlinesList = document.getElementById("upcomingDeadlines");
  
  if (upcomingDeadlines.length === 0) {
    deadlinesList.innerHTML = `
      <div class="empty-state">
        <i class="ri-calendar-check-line"></i>
        <p>No upcoming deadlines</p>
      </div>
    `;
    return;
  }
  
  deadlinesList.innerHTML = upcomingDeadlines.map(assignment => {
    const dueDate = new Date(assignment.due);
    const timeLeft = getTimeUntil(dueDate);
    
    return `
      <div class="deadline-item">
        <div class="deadline-info">
          <div class="deadline-title">${assignment.subject} - ${assignment.game}</div>
          <div class="deadline-date">Due: ${dueDate.toLocaleDateString()} • ${timeLeft}</div>
        </div>
        <div class="deadline-actions">
          <button class="btn btn-small btn-icon" title="View assignment">
            <i class="ri-eye-line"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function updateClassAverageProgress() {
  const students = getJSON(LS.students, []);
  const classFilter = localStorage.getItem(TEACHER_LS.classFilter) || "all";
  
  // Filter students by class if needed
  let filteredStudents = students;
  if (classFilter !== "all") {
    filteredStudents = students.filter(student => student.class === classFilter);
  }
  
  // Calculate average progress (simulated based on score)
  const avgProgress = filteredStudents.length 
    ? Math.min(100, Math.round(filteredStudents.reduce((sum, student) => sum + (student.progress || student.score / 10), 0) / filteredStudents.length))
    : 0;
  
  document.getElementById("classAverageScore").textContent = `${avgProgress}%`;
  document.getElementById("classAverageProgress").style.width = `${avgProgress}%`;
}

function initCharts() {
  createClassPerformanceChart();
  createSubjectPerformanceChart();
  createProgressOverTimeChart();
  createCompletionChart();
}

function createClassPerformanceChart() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);
  
  // Calculate average scores per class
  const classAverages = {};
  const classStudentCounts = {};
  
  // Initialize class data
  classes.forEach(cls => {
    classAverages[cls.name] = 0;
    classStudentCounts[cls.name] = 0;
  });
  
  // Sum scores and count students per class
  students.forEach(student => {
    if (student.class && classAverages.hasOwnProperty(student.class)) {
      // Convert score to percentage (assuming max score is 1000)
      const scorePercent = Math.min(100, Math.round(((student.score || 0) / 1000) * 100));
      classAverages[student.class] += scorePercent;
      classStudentCounts[student.class] += 1;
    }
  });
  
  // Calculate averages
  const classNames = [];
  const classDisplayNames = [];
  const averageScores = [];
  
  classes.forEach(cls => {
    const count = classStudentCounts[cls.name];
    if (count > 0) {
      classNames.push(cls.name);
      classDisplayNames.push(cls.fullName || `Grade ${cls.name}`);
      averageScores.push(Math.round(classAverages[cls.name] / count));
    }
  });
  
  // Create chart
  const ctx = document.getElementById('classPerformanceChart').getContext('2d');
  window.classPerformanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: classDisplayNames,
      datasets: [{
        label: 'Average Score (%)',
        data: averageScores,
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Average Score (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Classes'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Class Performance Comparison'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Score: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
  
  // Update class performance stats
  updateClassPerformanceStats(classDisplayNames, averageScores);
}

function createSubjectPerformanceChart() {
  // Get real student data
  const students = getJSON(LS.students, []);
  const assignments = getJSON(LS.assignments, []);
  
  // Calculate subject performance based on actual data
  const subjectStats = {};
  const subjectCounts = {};
  
  // Initialize subject data
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Environment', 'GK'];
  subjects.forEach(subject => {
    subjectStats[subject] = 0;
    subjectCounts[subject] = 0;
  });
  
  // Calculate performance based on student scores and assignments
  students.forEach(student => {
    const studentScore = student.score || 0;
    const scorePercent = Math.min(100, Math.round((studentScore / 1000) * 100));
    
    // Distribute score across subjects based on available assignments
    const studentAssignments = assignments.filter(assignment => 
      assignment.class === student.class || assignment.class === 'all'
    );
    
    if (studentAssignments.length > 0) {
      const scorePerSubject = scorePercent / studentAssignments.length;
      studentAssignments.forEach(assignment => {
        const subject = assignment.subject;
        if (subjectStats.hasOwnProperty(subject)) {
          subjectStats[subject] += scorePerSubject;
          subjectCounts[subject]++;
        }
      });
    } else {
      // If no assignments, distribute evenly across all subjects
      const scorePerSubject = scorePercent / subjects.length;
      subjects.forEach(subject => {
        subjectStats[subject] += scorePerSubject;
        subjectCounts[subject]++;
      });
    }
  });
  
  // Calculate averages
  const performance = [];
  const labels = [];
  subjects.forEach(subject => {
    if (subjectCounts[subject] > 0) {
      const avgScore = Math.round(subjectStats[subject] / subjectCounts[subject]);
      performance.push(avgScore);
      labels.push(subject);
    }
  });
  
  // If no real data, use fallback
  if (performance.length === 0) {
    performance.push(75, 70, 80, 65, 85, 60, 55);
    labels.push(...subjects);
  }
  
  const ctx = document.getElementById('subjectPerformanceChart').getContext('2d');
  window.subjectPerformanceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average Score (%)',
        data: performance,
        backgroundColor: [
          'rgba(22, 163, 74, 0.6)',
          'rgba(14, 165, 233, 0.6)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(6, 182, 212, 0.6)',
          'rgba(168, 85, 247, 0.6)'
        ],
        borderColor: [
          'rgba(22, 163, 74, 1)',
          'rgba(14, 165, 233, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Subject-wise Performance'
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
  
  // Update subject performance summary
  const avgPerformance = Math.round(performance.reduce((a, b) => a + b, 0) / performance.length);
  const bestSubject = labels[performance.indexOf(Math.max(...performance))];
  document.getElementById('subjectPerformanceSummary').innerHTML = `
    <p>Average performance across all subjects: <strong>${avgPerformance}%</strong></p>
    <p>Highest performing subject: <strong>${bestSubject}</strong></p>
  `;
}

function createProgressOverTimeChart() {
  // Get real student data
  const students = getJSON(LS.students, []);
  
  // Calculate progress over time based on student scores
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  let progress = [];
  
  if (students.length > 0) {
    // Calculate average progress for each week based on student scores
    const maxScore = Math.max(...students.map(s => s.score || 0));
    const baseProgress = maxScore > 0 ? Math.min(100, Math.round((maxScore / 1000) * 100)) : 50;
    
    // Simulate progress over time with some variation
    progress = weeks.map((week, index) => {
      const weekProgress = Math.min(100, baseProgress + (index * 5) + Math.random() * 10 - 5);
      return Math.round(weekProgress);
    });
  } else {
    // Fallback data if no students
    progress = [45, 52, 60, 68, 75, 82];
  }
  
  const ctx = document.getElementById('progressOverTimeChart').getContext('2d');
  window.progressOverTimeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [{
        label: 'Class Progress (%)',
        data: progress,
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Progress (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Weeks'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Progress Over Time'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Progress: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
  
  // Update progress over time summary
  const progressIncrease = progress[progress.length - 1] - progress[0];
  document.getElementById('progressOverTimeSummary').innerHTML = `
    <p>Overall progress increase: <strong>${progressIncrease}%</strong> over ${weeks.length} weeks</p>
    <p>Average weekly improvement: <strong>${Math.round(progressIncrease / weeks.length)}%</strong> per week</p>
  `;
}

function createCompletionChart() {
  // Get real student data
  const students = getJSON(LS.students, []);
  const assignments = getJSON(LS.assignments, []);
  
  let data = [65, 25, 10]; // Default fallback
  const statuses = ['Completed', 'In Progress', 'Not Started'];
  const colors = ['#16a34a', '#0ea5e9', '#94a3b8'];
  
  if (students.length > 0 && assignments.length > 0) {
    // Calculate completion rates based on student progress
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    
    students.forEach(student => {
      const studentProgress = student.progress || Math.min(100, Math.round((student.score || 0) / 10));
      
      if (studentProgress >= 80) {
        completed++;
      } else if (studentProgress >= 30) {
        inProgress++;
      } else {
        notStarted++;
      }
    });
    
    const total = students.length;
    data = [
      Math.round((completed / total) * 100),
      Math.round((inProgress / total) * 100),
      Math.round((notStarted / total) * 100)
    ];
  }
  
  const ctx = document.getElementById('completionChart').getContext('2d');
  window.completionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statuses,
      datasets: [{
        label: 'Activities',
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.6', '1')),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Activity Completion Rate'
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
  
  // Update completion chart summary
  document.getElementById('completionChartSummary').innerHTML = `
    <p><strong>${data[0]}%</strong> of activities have been completed</p>
    <p><strong>${data[1]}%</strong> of activities are in progress</p>
  `;
}

function updateCharts() {
  // In a real application, this would update charts based on the selected view
  const view = localStorage.getItem(TEACHER_LS.analyticsView) || "weekly";
  showToast("View Changed", `Charts updated to show ${view} data`, "info");
}

function changeChartType(chartId, chartType) {
  // In a real application, this would change the chart type
  showToast("Chart Updated", `${chartId} changed to ${chartType} view`, "info");
}

function updateClassPerformanceStats(classNames, averageScores) {
  const statsContainer = document.getElementById('classPerformanceSummary');
  if (!statsContainer) return;
  
  // Find best and worst performing classes
  let bestClass = { name: '', score: 0 };
  let worstClass = { name: '', score: 100 };
  
  classNames.forEach((className, index) => {
    const score = averageScores[index];
    if (score > bestClass.score) {
      bestClass = { name: className, score: score };
    }
    if (score < worstClass.score) {
      worstClass = { name: className, score: score };
    }
  });
  
  // Calculate overall average
  const overallAverage = averageScores.length > 0 
    ? Math.round(averageScores.reduce((sum, score) => sum + score, 0) / averageScores.length) 
    : 0;
  
  statsContainer.innerHTML = `
    <p>Overall class average: <strong>${overallAverage}%</strong></p>
    <p>Highest performing class: <strong>${bestClass.name}</strong> (${bestClass.score}%)</p>
    <p>Class needing most improvement: <strong>${worstClass.name}</strong> (${worstClass.score}%)</p>
  `;
}

function exportAnalytics() {
  // In a real application, this would export analytics data
  showToast("Export Started", "Preparing analytics data for export...", "info");
  
  // Simulate export process
  setTimeout(() => {
    showToast("Export Complete", "Analytics data has been exported successfully", "success");
  }, 2000);
}

function exportClassData() {
  // In a real application, this would export class data
  showToast("Export Started", "Preparing class data for export...", "info");
  
  // Simulate export process
  setTimeout(() => {
    showToast("Export Complete", "Class data has been exported successfully", "success");
  }, 2000);
}

function openAnnouncementModal() {
  document.getElementById('announcementModal').classList.add('active');
}

function closeAnnouncementModal() {
  document.getElementById('announcementModal').classList.remove('active');
  document.getElementById('announcementForm').reset();
}

function handleAnnouncementSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('announcementTitle').value;
  const message = document.getElementById('announcementMessage').value;
  const recipients = Array.from(document.getElementById('announcementRecipients').selectedOptions)
    .map(option => option.value);
  
  // Save announcement (in a real app, this would be sent to a server)
  const announcements = getJSON(TEACHER_LS.announcements, []);
  announcements.push({
    id: Date.now(),
    title,
    message,
    recipients,
    date: new Date().toISOString()
  });
  localStorage.setItem(TEACHER_LS.announcements, JSON.stringify(announcements));
  
  // Add to activity feed
  const activities = getJSON(TEACHER_LS.activities, []);
  activities.unshift({
    id: Date.now(),
    title: "Announcement Sent",
    details: title,
    time: new Date().toISOString(),
    type: "announcement"
  });
  localStorage.setItem(TEACHER_LS.activities, JSON.stringify(activities));
  
  // Show success message
  showToast("Announcement Sent", "Your announcement has been sent successfully", "success");
  
  // Close modal and reset form
  closeAnnouncementModal();
  renderRecentActivity();
}

function markAllNotificationsAsRead() {
  const notifications = getJSON(TEACHER_LS.notifications, []);
  notifications.forEach(notification => {
    notification.read = true;
  });
  localStorage.setItem(TEACHER_LS.notifications, JSON.stringify(notifications));
  
  renderNotifications();
  showToast("Notifications Updated", "All notifications marked as read", "success");
}

function refreshDashboard() {
  showLoadingOverlay();
  
  // Simulate data refresh
  setTimeout(() => {
    renderTeacherDashboard();
    hideLoadingOverlay();
    showToast("Dashboard Updated", "All data has been refreshed", "success");
  }, 1500);
}

function setDashboardDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('dashboardDate').textContent = now.toLocaleDateString('en-US', options);
}

function showLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(title, message, type = "info") {
  const toastContainer = document.getElementById('toastContainer');
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

// Utility functions
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

function getTimeUntil(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}

function getActivityIcon(type) {
  const icons = {
    assignment: "ri-task-line",
    announcement: "ri-megaphone-line",
    submission: "ri-file-upload-line",
    achievement: "ri-medal-line"
  };
  
  return icons[type] || "ri-notification-line";
}

function getNotificationIcon(type) {
  const icons = {
    submission: "ri-file-upload-line",
    performance: "ri-line-chart-line",
    announcement: "ri-megaphone-line",
    system: "ri-settings-3-line"
  };
  
  return icons[type] || "ri-notification-line";
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}