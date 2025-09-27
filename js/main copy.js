// Data keys
const LS = {
  user: "gx_user", // {name, role}
  theme: "gx_theme",
  lang: "gx_lang",
  score: "gx_score", // number
  xp: "gx_xp",
  level: "gx_level",
  progress: "gx_progress", // 0-100
  streak: "gx_streak", // number
  lastVisit: "gx_last_visit",
  assignments: "gx_assignments", // []
  leaderboard: "gx_leaderboard", // []
  classes: "gx_classes", // []
  students: "gx_students", // []
}

// Initialize once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  injectHeader()
  injectFooter()
  initTheme()
  attachGlobalHandlers()
  hydratePage()
})

// Header/Footer(//<a href="/contact.html">Contact Teachers</a>)
function injectHeader() {
  const header = document.getElementById("site-header")
  if (!header) return
  header.innerHTML = `
    <div class="site-header-inner">
      <a class="brand" href="/index.html">
        <img src="/assets/images/logo.png" alt="GuruKulX logo" />
        <span>GuruKulX</span>
      </a>
      <button class="nav-toggle" aria-label="Toggle menu" aria-controls="primary-nav" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav class="nav" id="primary-nav" aria-label="Main navigation">
        <a href="/index.html">Home</a>
        <a href="/index.html">Select Language</a>
        <a href="/leaderboard.html">Leaderboard</a>
        <a href="/profile.html">My Profile</a>
        <a href="/login-student.html">Login</a>
        <a href="/contact.html#ask-doubt">Ask Doubt</a>
      </nav>
    </div>
  `
  // active link
  const path = location.pathname.replace(/\/$/, "")
  header.querySelectorAll(".nav a").forEach((a) => {
    if (a.getAttribute("href") === path) a.classList.add("active")
  })

  const toggle = header.querySelector(".nav-toggle")
  const nav = header.querySelector("#primary-nav")
  toggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open")
    toggle.setAttribute("aria-expanded", String(isOpen))
  })

  header.querySelectorAll(".nav a").forEach((a) =>
    a.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 768px)").matches) {
        nav.classList.remove("open")
        toggle?.setAttribute("aria-expanded", "false")
      }
    }),
  )

  const mql = window.matchMedia("(min-width: 769px)")
  mql.addEventListener?.("change", (e) => {
    if (e.matches) {
      nav.classList.remove("open")
      toggle?.setAttribute("aria-expanded", "false")
    }
  })
}

function injectFooter() {
  const footer = document.getElementById("site-footer")
  if (!footer) return
  footer.innerHTML = `
    <div class="site-footer-inner">
      <div class="footer-links">
        <a href="/contact.html">Feedback</a>
        <a href="/contact.html">Help / FAQ</a>
        <a href="/contact.html">Contact</a>
        <a href="https://twitter.com" target="_blank" rel="noopener">Twitter</a>
        <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
      </div>
      <div class="theme-toggle">
        <button id="toggleTheme" class="btn"><i class="ri-moon-line"></i> Toggle Theme</button>
      </div>
    </div>
    <div class="container muted" style="padding:.5rem 1rem;">© 2025 GuruKulX – Smart Learning, Smart Future</div>
  `
  document.getElementById("toggleTheme")?.addEventListener("click", toggleTheme)
}

// Theme
function initTheme() {
  const saved = localStorage.getItem(LS.theme) || "light"
  document.documentElement.setAttribute("data-theme", saved)
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"
  document.documentElement.setAttribute("data-theme", current)
  localStorage.setItem(LS.theme, current)
}

// Global handlers
function attachGlobalHandlers() {
  // Auth forms
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const name = (document.getElementById("username")?.value || "User").trim()
      const role = document.getElementById("role")?.value || "student"
      localStorage.setItem(LS.user, JSON.stringify({ name, role }))
      bootstrapDefaults()
      if (role === "teacher") location.href = "/teacher-home.html"
      else location.href = "/student-home.html"
    })
  }

  // Feedback
  document.getElementById("feedbackForm")?.addEventListener("submit", (e) => {
    e.preventDefault()
    alert("Thank you for your feedback!")
    e.target.reset()
  })

  // Ask doubt
  document.getElementById("doubtForm")?.addEventListener("submit", (e) => {
    e.preventDefault()
    alert("Your doubt has been sent to teachers.")
    e.target.reset()
  })

  // Assignments
  document.getElementById("assignForm")?.addEventListener("submit", (e) => {
    e.preventDefault()
    const cls = document.getElementById("assign-class").value
    const subj = document.getElementById("assign-subject").value
    const game = document.getElementById("assign-game").value
    const due = document.getElementById("assign-due").value
    const notes = document.getElementById("assign-notes").value
    const list = getJSON(LS.assignments, [])
    list.push({ id: Date.now(), class: cls, subject: subj, game, due, notes, status: "Assigned" })
    localStorage.setItem(LS.assignments, JSON.stringify(list))
    renderAssignments()
    alert("Assignment created.")
    e.target.reset()
  })

  // Reports download
  document.getElementById("downloadCSV")?.addEventListener("click", () => {
    const rows = buildReportRows()
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gurukulx-report.csv"
    a.click()
    URL.revokeObjectURL(url)
  })

  // Quiz start (if on math quiz)
  document.getElementById("startQuiz")?.addEventListener("click", startMathQuiz)
}

// Helpers
function getUser() {
  return getJSON(LS.user, { name: "Guest", role: "student" })
}
function getJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
function setNumber(key, value, min = 0, max = 1e9) {
  const n = Math.max(min, Math.min(max, Number(value) || 0))
  localStorage.setItem(key, String(n))
  return n
}

// Bootstrap defaults for first-time
function bootstrapDefaults() {
  if (localStorage.getItem(LS.progress) == null) setNumber(LS.progress, 0, 0, 100)
  if (localStorage.getItem(LS.xp) == null) setNumber(LS.xp, 0)
  if (localStorage.getItem(LS.level) == null) setNumber(LS.level, 1)
  if (localStorage.getItem(LS.score) == null) setNumber(LS.score, 0)
  if (localStorage.getItem(LS.streak) == null) setNumber(LS.streak, 0)
  if (localStorage.getItem(LS.leaderboard) == null) {
    // seed leaderboard sample
    const seed = [
      { name: "Aditi", score: 820, badge: "Eco Hero" },
      { name: "Ravi", score: 760, badge: "Quiz Ace" },
      { name: "Zara", score: 740, badge: "Math Star" },
      { name: "Ishan", score: 690, badge: "Lab Champ" },
    ]
    localStorage.setItem(LS.leaderboard, JSON.stringify(seed))
  }
  if (localStorage.getItem(LS.classes) == null) {
    const classes = [{ name: "Grade 7A" }, { name: "Grade 7B" }, { name: "Grade 8A" }]
    localStorage.setItem(LS.classes, JSON.stringify(classes))
  }
  if (localStorage.getItem(LS.students) == null) {
    const students = [
      { name: "Aditi", score: 820 },
      { name: "Ravi", score: 760 },
      { name: "Zara", score: 740 },
      { name: "Ishan", score: 690 },
      { name: "You", score: Number(localStorage.getItem(LS.score) || 0) },
    ]
    localStorage.setItem(LS.students, JSON.stringify(students))
  }
  maintainStreak()
}

// Page-specific hydration
function hydratePage() {
  bootstrapDefaults()

  const user = getUser()
  // student dashboard
  if (document.body.dataset.page === "student-home") {
    const nameEl = document.getElementById("studentName")
    if (nameEl) nameEl.textContent = user.name || "Student"
    setText("studentXP", localStorage.getItem(LS.xp) || "0")
    setText("studentLevel", localStorage.getItem(LS.level) || "1")
    setText("streakCount", localStorage.getItem(LS.streak) || "0")
    setText("scoreTotal", localStorage.getItem(LS.score) || "0")
    const p = Number(localStorage.getItem(LS.progress) || 0)
    setText("progressPercent", `${p}%`)
    setWidth("progressBar", `${p}%`)
    renderLeaderboardPreview()
    updateRankPreview()
    updateBadgeCount()
    // language picker
    initLangPicker("lang-student")
  }

  // teacher dashboard
  if (document.body.dataset.page === "teacher-home") {
    document.getElementById("teacherName")?.append(` (${user.name || "Teacher"})`)
    initClassAndStudents()
    renderTeacherLists()
    renderTeacherScoreboard()
    initLangPicker("lang-teacher")
  }

  // assignments
  if (document.body.dataset.page === "teacher-assignments") {
    initAssignControls()
    renderAssignments()
  }

  // reports
  if (document.body.dataset.page === "teacher-reports") {
    renderReports()
  }

  // leaderboard page
  if (document.body.dataset.page === "leaderboard") {
    renderLeaderboardFull()
  }

  // profile
  if (document.body.dataset.page === "profile") {
    renderProfile()
  }

  // games (placeholder behavior is minimal)
  if (document.body.dataset.game === "math-quiz") {
    document.getElementById("qTotal").textContent = String(MATH_QUIZ.length)
  }
}

function setText(id, val) {
  const el = document.getElementById(id)
  if (el) el.textContent = String(val)
}
function setWidth(id, w) {
  const el = document.getElementById(id)
  if (el) el.style.width = w
}

// Language
function initLangPicker(id) {
  const sel = document.getElementById(id)
  if (!sel) return
  const saved = localStorage.getItem(LS.lang) || "English"
  // try set existing option
  Array.from(sel.options).forEach((o) => {
    if (o.value === saved || o.text === saved) sel.value = o.value
  })
  sel.addEventListener("change", () => {
    localStorage.setItem(LS.lang, sel.value)
    alert(`Language set to ${sel.value}`)
  })
}

// Streak maintenance (daily visit increments)
function maintainStreak() {
  const today = new Date().toDateString()
  const last = localStorage.getItem(LS.lastVisit)
  if (last !== today) {
    const prev = Number(localStorage.getItem(LS.streak) || 0)
    const newStreak = prev + 1
    setNumber(LS.streak, newStreak)
    localStorage.setItem(LS.lastVisit, today)
  }
}

// Leaderboard preview and table
function getLeaderboard() {
  return getJSON(LS.leaderboard, [])
}
function upsertYouInLeaderboard() {
  const you = getUser()
  const score = Number(localStorage.getItem(LS.score) || 0)
  const rows = getLeaderboard()
  const idx = rows.findIndex((r) => r.name === (you.name || "You"))
  if (idx >= 0) rows[idx].score = score
  else rows.push({ name: you.name || "You", score, badge: "Learner" })
  rows.sort((a, b) => b.score - a.score)
  localStorage.setItem(LS.leaderboard, JSON.stringify(rows))
}
function renderLeaderboardPreview() {
  upsertYouInLeaderboard()
  const root = document.getElementById("leaderboardPreview")
  if (!root) return
  const data = getLeaderboard().slice(0, 5)
  root.innerHTML = `
    <div class="row header"><div class="rank">#</div><div>Name</div><div>Score</div></div>
    ${data
      .map(
        (d, i) => `
      <div class="row"><div class="rank">${i + 1}</div><div>${escapeHTML(d.name)} ${d.badge ? `<span class="badge"><i class="ri-medal-line"></i>${d.badge}</span>` : ""}</div><div>${d.score}</div></div>
    `,
      )
      .join("")}
  `
}
function updateRankPreview() {
  const rows = getLeaderboard()
  const you = getUser().name || "You"
  const rank = rows.findIndex((r) => r.name === you) + 1
  setText("rankPreview", rank || "—")
}
function renderLeaderboardFull() {
  upsertYouInLeaderboard()
  const root = document.getElementById("leaderboardTable")
  if (!root) return
  const rows = getLeaderboard()
  root.innerHTML = `
    <div class="row header"><div class="rank">#</div><div>Name</div><div>Score</div></div>
    ${rows
      .map(
        (d, i) => `
      <div class="row"><div class="rank">${i + 1}</div><div>${escapeHTML(d.name)} ${d.badge ? `<span class="badge"><i class="ri-medal-line"></i>${d.badge}</span>` : ""}</div><div>${d.score}</div></div>
    `,
      )
      .join("")}
  `
}

// Teacher data
function initClassAndStudents() {
  // already bootstrapped defaults
}
function renderTeacherLists() {
  const classes = getJSON(LS.classes, [])
  const students = getJSON(LS.students, [])
  const cl = document.getElementById("classList")
  const sl = document.getElementById("studentList")
  document.getElementById("classCount")?.append(` (${classes.length})`)
  document.getElementById("studentCount")?.append(` (${students.length})`)
  if (cl) cl.innerHTML = classes.map((c) => `<li>${escapeHTML(c.name)}</li>`).join("")
  if (sl) sl.innerHTML = students.map((s) => `<li>${escapeHTML(s.name)} — ${s.score}</li>`).join("")
}
function renderTeacherScoreboard() {
  const root = document.getElementById("teacherScoreboard")
  if (!root) return
  const students = getJSON(LS.students, [])
  const top = [...students].sort((a, b) => b.score - a.score).slice(0, 5)
  root.innerHTML = `
    <div class="row header"><div class="rank">#</div><div>Student</div><div>Score</div></div>
    ${top.map((d, i) => `<div class="row"><div class="rank">${i + 1}</div><div>${escapeHTML(d.name)}</div><div>${d.score}</div></div>`).join("")}
  `
}

// Assignments
function initAssignControls() {
  const classes = getJSON(LS.classes, [])
  const sc = document.getElementById("assign-class")
  if (sc) sc.innerHTML = classes.map((c) => `<option>${escapeHTML(c.name)}</option>`).join("")
  const sg = document.getElementById("assign-game")
  const subjectSel = document.getElementById("assign-subject")
  const updateGames = () => {
    const subj = subjectSel.value
    const map = {
      Math: ["math-quiz.html", "math-puzzle.html", "math-sudoku.html", "math-speed.html"],
      Science: ["science-quiz.html", "science-fillblanks.html", "science-match.html", "science-virtuallab.html"],
      Environment: ["env-carbon-quiz.html", "env-plant-tree.html", "env-pollution.html", "env-energy-saver.html"],
      "Social Science": ["ss-history-quiz.html", "ss-map-game.html", "ss-role-play.html"],
      English: ["eng-word-quiz.html", "eng-crossword.html", "eng-story-builder.html", "eng-spelling-bee.html"],
      "Computer Science": ["cs-coding-quiz.html", "cs-debug-challenge.html", "cs-typing-game.html"],
      GK: ["gk-daily-quiz.html", "gk-guess-picture.html", "gk-rapid-fire.html", "gk-trivia-wheel.html"],
    }
    const games = map[subj] || []
    if (sg)
      sg.innerHTML = games
        .map((g) => `<option value="${g}">${g.replace(".html", "").replace(/-/g, " ")}</option>`)
        .join("")
  }
  subjectSel?.addEventListener("change", updateGames)
  updateGames()
}
function renderAssignments() {
  const root = document.getElementById("assignmentsList")
  if (!root) return
  const items = getJSON(LS.assignments, [])
  if (!items.length) {
    root.innerHTML = '<div class="row"><div class="rank">—</div><div>No assignments yet</div><div>—</div></div>'
    return
  }
  root.innerHTML = `
    <div class="row header"><div class="rank">#</div><div>Assignment</div><div>Due</div></div>
    ${items
      .map(
        (a, i) => `
      <div class="row">
        <div class="rank">${i + 1}</div>
        <div>${escapeHTML(a.class)} • ${escapeHTML(a.subject)} • ${escapeHTML(a.game)}</div>
        <div>${escapeHTML(a.due || "—")}</div>
      </div>
    `,
      )
      .join("")}
  `
}

// Reports
function renderReports() {
  const students = getJSON(LS.students, [])
  const avg = Math.round(students.reduce((s, x) => s + x.score, 0) / Math.max(1, students.length))
  const prog = Math.min(100, Math.round((avg / 1000) * 100))
  setText("reportStudents", students.length)
  setText("reportAvgScore", avg)
  setText("reportBadges", Math.round(students.length * 1.5))
  setText("avgProgress", `${prog}%`)
  setWidth("avgProgressBar", `${prog}%`)
  const top = [...students].sort((a, b) => b.score - a.score).slice(0, 5)
  const root = document.getElementById("reportsTop")
  if (root) {
    root.innerHTML = `
      <div class="row header"><div class="rank">#</div><div>Student</div><div>Score</div></div>
      ${top.map((d, i) => `<div class="row"><div class="rank">${i + 1}</div><div>${escapeHTML(d.name)}</div><div>${d.score}</div></div>`).join("")}
    `
  }
}
function buildReportRows() {
  const students = getJSON(LS.students, [])
  const rows = [["Name", "Score"]]
  students.forEach((s) => rows.push([s.name, s.score]))
  return rows
}
function toCSV(rows) {
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
}

// Profile
function renderProfile() {
  bootstrapDefaults()
  const user = getUser()
  document.getElementById("profileName").textContent = user.name || "Learner"
  setText("profileLevel", localStorage.getItem(LS.level) || "1")
  const xp = Number(localStorage.getItem(LS.xp) || 0)
  const progress = Number(localStorage.getItem(LS.progress) || 0)
  setText("profileXP", xp)
  setWidth("profileProgress", `${progress}%`)
  setText("profileScore", localStorage.getItem(LS.score) || "0")
  setText("profileStreak", localStorage.getItem(LS.streak) || "0")
  const badges = computeBadges()
  const root = document.getElementById("badgeGrid")
  root.innerHTML = badges
    .map((b) => `<span class="badge"><i class="ri-medal-line"></i>${escapeHTML(b)}</span>`)
    .join("")
}

// Badges logic
function computeBadges() {
  const score = Number(localStorage.getItem(LS.score) || 0)
  const streak = Number(localStorage.getItem(LS.streak) || 0)
  const list = []
  if (score >= 100) list.push("Starter")
  if (score >= 300) list.push("Quiz Ace")
  if (score >= 600) list.push("Eco Hero")
  if (streak >= 3) list.push("3-Day Streak")
  if (streak >= 7) list.push("Week Warrior")
  return list
}
function updateBadgeCount() {
  const count = computeBadges().length
  setText("badgeCount", count)
}

// Escape HTML
function escapeHTML(s) {
  return (
    s?.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]) || ""
  )
}

// Math quiz game
const MATH_QUIZ = [
  { q: "8 + 7 = ?", options: ["14", "15", "16", "18"], a: 1 },
  { q: "12 - 5 = ?", options: ["6", "7", "8", "9"], a: 1 },
  { q: "9 × 3 = ?", options: ["27", "21", "24", "18"], a: 0 },
  { q: "16 ÷ 4 = ?", options: ["2", "3", "4", "5"], a: 2 },
  { q: "5 × 6 = ?", options: ["25", "30", "35", "36"], a: 1 },
]

let quizState = { i: 0, score: 0, timer: 30, t: null }

function startMathQuiz() {
  document.getElementById("quizIntro").classList.add("hidden")
  document.getElementById("quizPlay").classList.remove("hidden")
  quizState = { i: 0, score: 0, timer: 30, t: null }
  document.getElementById("qScore").textContent = "0"
  document.getElementById("qIndex").textContent = "1"
  document.getElementById("qTotal").textContent = String(MATH_QUIZ.length)
  nextQuestion()
  startTimer()
}

function startTimer() {
  clearInterval(quizState.t)
  quizState.timer = 30
  document.getElementById("qTimer").textContent = String(quizState.timer)
  quizState.t = setInterval(() => {
    quizState.timer -= 1
    document.getElementById("qTimer").textContent = String(quizState.timer)
    if (quizState.timer <= 0) {
      clearInterval(quizState.t)
      submitAnswer(-1) // timeout
    }
  }, 1000)
}

function nextQuestion() {
  const q = MATH_QUIZ[quizState.i]
  if (!q) return endQuiz()
  document.getElementById("qText").textContent = q.q
  const root = document.getElementById("qOptions")
  root.innerHTML = ""
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button")
    btn.className = "q-option"
    btn.textContent = opt
    btn.addEventListener("click", () => submitAnswer(idx))
    root.appendChild(btn)
  })
}

function submitAnswer(choice) {
  const q = MATH_QUIZ[quizState.i]
  if (!q) return
  if (choice === q.a) quizState.score += 50 // points per question
  document.getElementById("qScore").textContent = String(quizState.score)
  quizState.i += 1
  clearInterval(quizState.t)
  if (quizState.i >= MATH_QUIZ.length) endQuiz()
  else {
    nextQuestion()
    startTimer()
  }
}

function endQuiz() {
  clearInterval(quizState.t)
  document.getElementById("quizPlay").classList.add("hidden")
  document.getElementById("quizEnd").classList.remove("hidden")
  document.getElementById("finalScore").textContent = String(quizState.score)

  // Update user stats
  const prevScore = Number(localStorage.getItem(LS.score) || 0)
  const newScore = prevScore + quizState.score
  setNumber(LS.score, newScore)
  const xp = Number(localStorage.getItem(LS.xp) || 0) + quizState.score
  setNumber(LS.xp, xp)
  const level = 1 + Math.floor(xp / 500)
  setNumber(LS.level, level)
  const progress = Math.min(100, Number(localStorage.getItem(LS.progress) || 0) + 10)
  setNumber(LS.progress, progress, 0, 100)

  upsertYouInLeaderboard()
}
