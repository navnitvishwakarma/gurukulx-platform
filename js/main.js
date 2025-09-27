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
  profiles: "gx_profiles", // { [name]: {score,xp,level,progress,streak,class} }
}

// Default backend endpoints (override via localStorage or window vars)
const DEFAULT_API_BASE = window.location.origin
const DEFAULT_AI_ENDPOINT = `${DEFAULT_API_BASE}/api/ai`

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyALj_4-lYI__CEE9u14RkQAIYCsvN0H6Do' // Your actual Gemini API key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

// Initialize once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  injectGoogleTranslate()
  injectHeader()
  injectFooter()
  initTheme()
  attachGlobalHandlers()
  hydratePage()
})

// Google Translate Injection
function injectGoogleTranslate() {
  // Check if Google Translate is already loaded
  if (window.google && window.google.translate) {
    return
  }
  
  // Add Google Translate script if not already present
  if (!document.querySelector('script[src*="translate.google.com"]')) {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    document.head.appendChild(script)
  }
  
  // Initialize Google Translate
  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,hi,or',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: true
    }, 'google_translate_element')
  }
}
// Header/Footer
function injectHeader() {
  const header = document.getElementById("site-header")
  if (!header) return
  
  // Check if user is logged in
  const user = getUser()
  const isLoggedIn = user && user.name && user.name !== "Guest"
  
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
        <a href="/leaderboard.html">Leaderboard</a>
        ${user?.role === 'teacher' 
          ? `<a href="/teacher-home.html">Teacher Dashboard</a>`
          : `<a href="/profile.html">My Profile</a>`}
        ${isLoggedIn ? 
          `<a href="#" id="logout-link">Logout</a>` : 
          `<a href="/login-student.html">Login</a>`
        }
        <a href="/contact.html#ask-doubt">Ask Doubt</a>
        
        <!-- Google Translate Widget -->
        <div id="google_translate_element"></div>
      </nav>
    </div>
  `

  // Mobile nav toggle
  const navToggle = header.querySelector(".nav-toggle")
  const primaryNav = header.querySelector("#primary-nav")
  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = primaryNav.classList.toggle("open")
      navToggle.setAttribute("aria-expanded", String(isOpen))
    })
  }

  
  // Add logout handler if user is logged in
  if (isLoggedIn) {
    document.getElementById("logout-link").addEventListener("click", handleLogout)
  }
}

// Logoutfunction
function handleLogout(e) {
  e.preventDefault()
  // Clear user data
  localStorage.removeItem(LS.user)
  // Redirect to home page
  window.location.href = "/index.html"
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
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    const name = (document.getElementById("username")?.value || "User").trim()
    const role = document.getElementById("role")?.value || "student"
    const password = document.getElementById("password")?.value || ""

    // Try backend auth first
    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, password })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('GX_TOKEN', data.token)
        localStorage.setItem(LS.user, JSON.stringify({ name: data.user?.username || name, role: data.user?.role || role, class: data.user?.class }))
        loadOrCreateUserProfile(data.user?.username || name)
        bootstrapDefaults()
        injectHeader()
        if ((data.user?.role || role) === "teacher") location.href = "/teacher-home.html"
        else location.href = "/profile.html"
        return
      } else {
        const err = await res.json().catch(()=>({error:'Login failed'}))
        alert(err.error || 'Invalid username or password')
      }
    } catch {
      alert('Could not reach server. Please try again.')
    }
  })
}

  // Feedback
  document.getElementById("feedbackForm")?.addEventListener("submit", (e) => {
    e.preventDefault()
    const name = document.getElementById("fb-name")?.value || ""
    const email = document.getElementById("fb-email")?.value || ""
    const message = document.getElementById("fb-msg")?.value || ""
    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
    const url = `${apiBase.replace(/\/$/, '')}/api/feedback`
    ;(async () => {
      try {
        if (url) {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
          })
          if (!res.ok) throw new Error('Bad response')
        }
        alert("Thank you for your feedback!")
        e.target.reset()
      } catch {
        alert("Could not send to server right now. Saved locally.")
        // Fallback: store locally
        const list = getJSON('gx_feedback_local', [])
        list.push({ id: Date.now(), name, email, message })
        localStorage.setItem('gx_feedback_local', JSON.stringify(list))
      }
    })()
  })

  // Ask doubt
  document.getElementById("doubtForm")?.addEventListener("submit", (e) => {
    e.preventDefault()
    const subject = document.getElementById("doubt-subject")?.value || "General"
    const query = document.getElementById("doubt-msg")?.value || ""
    // Show optimistic AI response (on-device heuristic) enriched with profile
    const user = getUser()
    const profile = {
      name: user.name || 'Learner',
      class: user.class || '—',
      level: Number(localStorage.getItem(LS.level)||1),
      xp: Number(localStorage.getItem(LS.xp)||0),
      score: Number(localStorage.getItem(LS.score)||0)
    }
    const answer = generateLocalAISuggestion(subject, query, profile)
    const box = document.getElementById('aiAnswer')
    const content = document.getElementById('aiAnswerContent')
    if (box && content){
      content.innerHTML = answer
      box.style.display = 'block'
    }
    // Send to backend if configured
    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
    const url = `${apiBase.replace(/\/$/, '')}/api/doubts`
    ;(async () => {
      try {
        if (url) {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, question: query, userName: profile.name, userClass: profile.class })
          })
        }
        alert("Your doubt has been sent to teachers.")
      } catch {
        alert("Could not send doubt to server. It will be retried later.")
        const list = getJSON('gx_doubts_local', [])
        list.push({ id: Date.now(), subject, question: query, userName: profile.name, userClass: profile.class })
        localStorage.setItem('gx_doubts_local', JSON.stringify(list))
      }
    })()
    e.target.reset()
  })


  // AI Tutor (instant answers)
  document.getElementById("aiTutorForm")?.addEventListener("submit", async (e) => {
    e.preventDefault()
    console.log('AI Tutor form submitted')
    const subject = document.getElementById("ai-subject")?.value || "General"
    const question = document.getElementById("ai-question")?.value || ""
    console.log('Form data:', { subject, question })
    const loading = document.getElementById("aiTutorLoading")
    const box = document.getElementById("aiTutorAnswer")
    const content = document.getElementById("aiTutorContent")
    try {
      if (loading) loading.style.display = 'block'
      if (box) box.style.display = 'none'

      const user = getUser()
      const profile = {
        name: user.name || 'Learner',
        class: user.class || '—',
        level: Number(localStorage.getItem(LS.level)||1),
        xp: Number(localStorage.getItem(LS.xp)||0),
        score: Number(localStorage.getItem(LS.score)||0)
      }

      let answerHTML = ''

      // 1) Try Gemini first if API key is available
      console.log('Checking API key:', GEMINI_API_KEY ? 'Present' : 'Missing')
      console.log('API key starts with:', GEMINI_API_KEY.substring(0, 10))
      if (GEMINI_API_KEY && GEMINI_API_KEY !== 'AIzaSyC2L-IyfxCh3LjU4sSZuUba-cGFgfKMUik') {
        try {
          console.log('Attempting Gemini call...', { subject, question, profile })
          const geminiResponse = await callGemini(subject, question, profile)
          console.log('Gemini response received:', geminiResponse)
          answerHTML = `
            <p><strong>Subject:</strong> ${escapeHTML(subject)}</p>
            <p><strong>Question:</strong> ${escapeHTML(question)}</p>
            <div>${escapeHTML(geminiResponse).replace(/\n/g,'<br/>')}</div>
            <p class="muted">Powered by Google Gemini AI</p>
          `
        } catch (error) {
          console.error('Gemini failed:', error)
          // Fall through to local AI suggestions
        }
      } else {
        console.log('Gemini API key not configured, using fallback')
      }

      // 2) Try local smart answers if Gemini failed or not available
      if (!answerHTML) {
        const mathAnswer = subject === 'Math' ? tryComputeMathAnswer(question) : null
        if (mathAnswer != null) {
          answerHTML = `
            <p><strong>Subject:</strong> ${escapeHTML(subject)}</p>
            <p><strong>Question:</strong> ${escapeHTML(question)}</p>
            <p><strong>Answer:</strong> ${escapeHTML(String(mathAnswer))}</p>
            <p class="muted">Calculated instantly on your device.</p>
          `
        }

        if (!answerHTML && (subject === 'GK' || question.split(' ').length <= 8)) {
          const wiki = await tryFetchWikiSummary(question)
          if (wiki) {
            answerHTML = `
              <p><strong>Subject:</strong> ${escapeHTML(subject)}</p>
              <p><strong>Question:</strong> ${escapeHTML(question)}</p>
              <div>${wiki}</div>
              <p class="muted">Source: Wikipedia summary.</p>
            `
          }
        }

        // Try remote AI endpoint if configured
        const endpoint = window.GX_AI_ENDPOINT || localStorage.getItem('GX_AI_ENDPOINT') || DEFAULT_AI_ENDPOINT
        if (!answerHTML && endpoint) {
          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subject, question, profile })
            })
            if (res.ok) {
              const data = await res.json()
              const text = data.answer || data.output || data.message || ''
              answerHTML = `<p><strong>Subject:</strong> ${escapeHTML(subject)}</p><p><strong>Question:</strong> ${escapeHTML(question)}</p><div>${escapeHTML(text).replace(/\n/g,'<br/>')}</div>`
            } else {
              throw new Error('Bad response')
            }
          } catch {
            // fallback to local heuristic
            if (!answerHTML) answerHTML = generateLocalAISuggestion(subject, question, profile)
          }
        } else if (!answerHTML) {
          // no endpoint configured - use local heuristic
          console.log('Using local AI suggestion fallback')
          answerHTML = generateLocalAISuggestion(subject, question, profile)
        }
      }

      console.log('Final answer HTML:', answerHTML)
      if (content) {
        content.innerHTML = answerHTML
        console.log('Content updated')
      }
      if (box) {
        box.style.display = 'block'
        console.log('Answer box shown')
      }
    } finally {
      if (loading) loading.style.display = 'none'
    }
  })

// Compute simple math expressions locally (supports + - * / ^ ( ) and × ÷)
function tryComputeMathAnswer(raw){
  if (!raw) return null
  try {
    let expr = String(raw)
      .replace(/×/g, '*')
      .replace(/x/gi, (m, off) => {
        // keep 'x' if it seems like a variable word; otherwise treat as multiply
        return /\d\s*x\s*\d/i.test(expr) ? '*' : 'x'
      })
      .replace(/÷/g, '/')
      .replace(/\^/g, '**')
      .replace(/\s+/g, ' ')
      .trim()
    // Extract a likely math expression from the text
    const match = expr.match(/[0-9().+\-*/**\s/]+/g)
    const candidate = match ? match.join('') : expr
    // Validate allowed characters
    if (!/^[0-9().+\-*/\s*]+$/.test(candidate)) return null
    // Evaluate safely using Function
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${candidate})`)()
    if (typeof result === 'number' && isFinite(result)) {
      const rounded = Math.round((result + Number.EPSILON) * 1e6) / 1e6
      return rounded
    }
    return null
  } catch {
    return null
  }
}

async function tryFetchGoogleSnippet(query) {
  try {
    const term = String(query).trim();
    if (!term) return null;

    const API_KEY = "YOUR_GOOGLE_API_KEY"; // <-- put in env/server for production
    const CX_ID   = "YOUR_CX_ID";          // e.g. 13c1d59b8467b4e5a

    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX_ID}&q=${encodeURIComponent(term)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items || !data.items.length) return null;

    const first = data.items[0];
    const title = first.title;
    const snippet = first.snippet;
    const pageUrl = first.link;

    return `<p><strong>${escapeHTML(title)}</strong></p>
            <p>${escapeHTML(snippet)}</p>
            <p><a href="${pageUrl}" target="_blank" rel="noopener">Read more</a></p>`;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// simple HTML escaping helper
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}



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
  if (document.body.dataset.game === "math-quiz") {
    document.getElementById("startQuiz")?.addEventListener("click", startMathQuiz)
  }
}

// Registration form handler
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault()
  const username = document.getElementById('reg-username')?.value || ''
  const password = document.getElementById('reg-password')?.value || ''
  const name = document.getElementById('reg-name')?.value || ''
  const userClass = document.getElementById('reg-class')?.value || ''
  const role = document.getElementById('reg-role')?.value || 'student'
  const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role, name, userClass })
    })
    if (!res.ok) throw new Error('Registration failed')
    alert('Account created. Please log in.')
    window.location.href = '/login-student.html'
  } catch (err) {
    alert('Could not register. Try a different username.')
  }
})

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

// Lightweight in-browser AI suggestion generator (heuristic, no external calls)
function generateLocalAISuggestion(subject, query, profile){
  const sanitize = (s)=> (s||'').toString().replace(/[<>]/g,'')
  const s = sanitize(subject)
  const q = sanitize(query)
  const cls = profile.class ? `Grade ${profile.class}` : 'your grade'
  const difficultyHint = profile.level >= 5 ? 'You seem experienced; try outlining steps first.' : 'Let’s break it into easy steps.'
  let strategy = ''
  switch(s){
    case 'Math':
      strategy = `Identify what is given and what is required. Write the equation. ${difficultyHint}`
      break
    case 'Science':
      strategy = `Recall definitions/laws involved. State assumptions. Use a diagram if helpful.`
      break
    case 'English':
      strategy = `Focus on keywords, sentence structure, and grammar. Provide an example.`
      break
    case 'Computer Science':
      strategy = `Explain logic step-by-step and provide a minimal example or pseudocode.`
      break
    case 'Environment':
      strategy = `Relate to real-world impacts and simple calculations/estimates where relevant.`
      break
    case 'Social Science':
      strategy = `Provide context (time/place), causes/effects, and 2–3 key points.`
      break
    case 'GK':
      strategy = `Give a concise factual answer, then one supporting detail.`
      break
    default:
      strategy = `Outline the steps and provide a simple example.`
  }
  // Simple templated response
  return `
  <div>
    <p><strong>Subject:</strong> ${s} • <strong>${cls}</strong></p>
    <p><strong>Question:</strong> ${q || '—'}</p>
    <p><strong>How to think about it:</strong> ${strategy}</p>
    ${s==='Math' ? `<p><strong>Tip:</strong> If there’s an equation, isolate the unknown by doing the same operation on both sides. Check with a quick substitution.</p>`: ''}
    ${s==='Science' ? `<p><strong>Tip:</strong> Write the formula with units (e.g., F = ma). Verify units to catch mistakes.</p>`: ''}
    <p class="muted">This is an instant hint based on your profile (Level ${profile.level}, Score ${profile.score}). Your teacher also received your doubt.</p>
  </div>
  `
}


// Update the bootstrapDefaults function
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
    // Updated to use simple grade numbers
    const classes = [
      { name: "6", fullName: "Grade 6" },
      { name: "7", fullName: "Grade 7" }, 
      { name: "8", fullName: "Grade 8" },
      { name: "9", fullName: "Grade 9" },
      { name: "10", fullName: "Grade 10" },
      { name: "11", fullName: "Grade 11" },
      { name: "12", fullName: "Grade 12" }
    ]
    localStorage.setItem(LS.classes, JSON.stringify(classes))
  }
  if (localStorage.getItem(LS.students) == null) {
    // Update students to use the new class names
    const students = [
      { name: "Aditi", score: 820, class: "6" },
      { name: "Ravi", score: 760, class: "7" },
      { name: "Zara", score: 740, class: "8" },
      { name: "Ishan", score: 690, class: "9" },
      { name: "You", score: Number(localStorage.getItem(LS.score) || 0), class: "10" },
    ]
    localStorage.setItem(LS.students, JSON.stringify(students))
  }
  maintainStreak()
}

// Per-user profile persistence
function loadOrCreateUserProfile(name) {
  const all = getJSON(LS.profiles, {})
  const key = name || 'User'
  const existing = all[key]
  if (existing) {
    // hydrate current LS with saved profile
    setNumber(LS.score, existing.score ?? 0)
    setNumber(LS.xp, existing.xp ?? 0)
    setNumber(LS.level, existing.level ?? 1)
    setNumber(LS.progress, existing.progress ?? 0, 0, 100)
    setNumber(LS.streak, existing.streak ?? 0)
    // also persist class on user object if present
    const u = getUser()
    if (existing.class) {
      u.class = existing.class
      localStorage.setItem(LS.user, JSON.stringify(u))
    }
  } else {
    // create a fresh profile snapshot from current defaults
    all[key] = {
      score: Number(localStorage.getItem(LS.score) || 0),
      xp: Number(localStorage.getItem(LS.xp) || 0),
      level: Number(localStorage.getItem(LS.level) || 1),
      progress: Number(localStorage.getItem(LS.progress) || 0),
      streak: Number(localStorage.getItem(LS.streak) || 0),
      class: getUser().class
    }
    localStorage.setItem(LS.profiles, JSON.stringify(all))
  }
}

function saveCurrentUserProfile() {
  const u = getUser()
  const key = u.name || 'User'
  const all = getJSON(LS.profiles, {})
  all[key] = {
    score: Number(localStorage.getItem(LS.score) || 0),
    xp: Number(localStorage.getItem(LS.xp) || 0),
    level: Number(localStorage.getItem(LS.level) || 1),
    progress: Number(localStorage.getItem(LS.progress) || 0),
    streak: Number(localStorage.getItem(LS.streak) || 0),
    class: u.class
  }
  localStorage.setItem(LS.profiles, JSON.stringify(all))
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

// Ensure the current user's score reflects in the students list used by teacher views
function upsertYouInStudents() {
  const you = getUser()
  const score = Number(localStorage.getItem(LS.score) || 0)
  const students = getJSON(LS.students, [])
  const name = you.name || "You"
  const idx = students.findIndex((s) => s.name === name)
  const userClass = you.class || (idx >= 0 ? students[idx].class : undefined)
  if (idx >= 0) {
    students[idx].score = score
    if (userClass != null) students[idx].class = userClass
  } else {
    students.push({ name, score, class: userClass })
  }
  localStorage.setItem(LS.students, JSON.stringify(students))
}

// Convenience helper to sync both leaderboards and students after score changes
function syncScoreboards() {
  try {
    upsertYouInLeaderboard()
    upsertYouInStudents()
  } catch {}
}

// Standardized game score saving function
function saveGameResults(score, xp = null, progress = null) {
  try {
    // Update total score
    const currentScore = parseInt(localStorage.getItem(LS.score) || 0);
    const newScore = currentScore + score;
    localStorage.setItem(LS.score, newScore);
    
    // Update XP if provided
    if (xp !== null) {
      const currentXP = parseInt(localStorage.getItem(LS.xp) || 0);
      const newXP = currentXP + xp;
      localStorage.setItem(LS.xp, newXP);
      
      // Update level based on XP
      const level = 1 + Math.floor(newXP / 500);
      localStorage.setItem(LS.level, level);
    }
    
    // Update progress if provided
    if (progress !== null) {
      const currentProgress = parseInt(localStorage.getItem(LS.progress) || 0);
      const newProgress = Math.min(100, currentProgress + progress);
      localStorage.setItem(LS.progress, newProgress);
    }
    
    // Sync with all dashboards and leaderboards
    syncScoreboards();
    saveCurrentUserProfile();
    
    return { score: newScore, xp: xp !== null ? parseInt(localStorage.getItem(LS.xp) || 0) : null };
  } catch (error) {
    console.error('Error saving game results:', error);
    return null;
  }
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
// Update the renderTeacherLists function
function renderTeacherLists() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);
  const cl = document.getElementById("classList")
  const sl = document.getElementById("studentList")
  document.getElementById("classCount")?.append(` (${classes.length})`)
  document.getElementById("studentCount")?.append(` (${students.length})`)
  
  // Use full names for class display
  if (cl) cl.innerHTML = classes.map((c) => 
    `<li>${escapeHTML(c.fullName || `Grade ${c.name}`)}</li>`
  ).join("")
  
  if (sl) sl.innerHTML = students.map((s) => 
    `<li>${escapeHTML(s.name)} — ${s.score} (${s.class ? `Grade ${s.class}` : 'No class'})</li>`
  ).join("")
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
// Update the initAssignControls function
function initAssignControls() {
  const classes = getJSON(LS.classes, []);
  const sc = document.getElementById("assign-class")
  // Use full names for assignment class selection
  if (sc) sc.innerHTML = classes.map((c) => 
    `<option value="${c.name}">${escapeHTML(c.fullName || `Grade ${c.name}`)}</option>`
  ).join("")
  
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
// Update the renderAssignments function
function renderAssignments() {
  const root = document.getElementById("assignmentsList")
  if (!root) return
  const items = getJSON(LS.assignments, [])
  const classes = getJSON(LS.classes, []);
  
  // Create a mapping of class short names to full names
  const classMap = {};
  classes.forEach(c => {
    classMap[c.name] = c.fullName || `Grade ${c.name}`;
  });
  
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
        <div>${escapeHTML(classMap[a.class] || a.class)} • ${escapeHTML(a.subject)} • ${escapeHTML(a.game)}</div>
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

// Toast notification function
function showToast(title, message, type = "info") {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(toastContainer);
  }
  
  const toastId = `toast-${Date.now()}`;
  const icons = {
    success: "ri-checkbox-circle-fill",
    error: "ri-error-warning-fill",
    warning: "ri-alert-fill",
    info: "ri-information-fill"
  };
  
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6"
  };
  
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.style.cssText = `
    background: white;
    border: 1px solid ${colors[type] || colors.info};
    border-left: 4px solid ${colors[type] || colors.info};
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 400px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  toast.innerHTML = `
    <i class="${icons[type] || icons.info}" style="color: ${colors[type] || colors.info}; font-size: 20px;"></i>
    <div style="flex: 1;">
      <div style="font-weight: 600; margin-bottom: 4px;">${escapeHTML(title)}</div>
      <div style="color: #6b7280; font-size: 14px;">${escapeHTML(message)}</div>
    </div>
    <button onclick="document.getElementById('${toastId}').remove()" style="
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    ">×</button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (document.getElementById(toastId)) {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.getElementById(toastId)) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Test Gemini function (call from browser console: testGemini())
window.testGemini = async function() {
  try {
    console.log('Testing Gemini with simple question...')
    const response = await callGemini('Math', 'What is 2+2?', { name: 'Test User', class: '6', level: 1, xp: 0, score: 0 })
    console.log('✅ Gemini test successful:', response)
    return response
  } catch (error) {
    console.error('❌ Gemini test failed:', error)
    return null
  }
}

// Gemini API service function
async function callGemini(subject, question, profile) {
  console.log('callGemini called with:', { subject, question, profile })
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'AIzaSyC5AJftS6KXxW2j3wzssNhh9eHA4-oJrpA') {
    throw new Error('Gemini API key not configured')
  }

  const prompt = `You are an AI tutor for GuruKulX, an educational platform. You help students with their academic questions across various subjects.

Student Profile:
- Name: ${profile.name || 'Student'}
- Class: ${profile.class || 'Not specified'}
- Level: ${profile.level || 1}
- Experience Points: ${profile.xp || 0}
- Score: ${profile.score || 0}

Guidelines:
1. Provide clear, educational explanations appropriate for the student's level
2. Use simple language and examples when possible
3. Encourage learning and provide study tips
4. If the question is unclear, ask for clarification
5. Keep responses concise but comprehensive
6. Always be encouraging and supportive

Subject: ${subject}
Question: ${question}

Please provide a helpful educational response:`

  console.log('Making API request to:', GEMINI_API_URL)
  console.log('API Key (first 10 chars):', GEMINI_API_KEY.substring(0, 10) + '...')

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 10
        }
      })
    })

    console.log('API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API error response:', errorData)
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    console.log('API response data:', data)
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received from Gemini'
  } catch (error) {
    console.error('Gemini API call failed:', error)
    throw error
  }
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

  // Use standardized score saving function
  const xpEarned = quizState.score; // Use score as XP
  const progressEarned = 10; // 10% progress for completing quiz
  saveGameResults(quizState.score, xpEarned, progressEarned);
  
  // Show success message
  showToast('Quiz Completed', `You earned ${xpEarned} XP and ${progressEarned}% progress!`, 'success');
}


// Load Chart.js on demand
function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve()
      return
    }
    const s = document.createElement("script")
    s.src = "https://cdn.jsdelivr.net/npm/chart.js"
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Chart.js failed to load"))
    document.head.appendChild(s)
  })
}

// Add this function to create class performance chart
function createClassPerformanceChart() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);
  
  // Calculate average scores per class (as percentages)
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
  const el = document.getElementById('classPerformanceChart');
  if (!el || !window.Chart) return;
  const ctx = el.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: classDisplayNames, // Use display names instead of simple numbers
      datasets: [{
        label: 'Average Score (%)',
        data: averageScores,
        backgroundColor: 'rgba(22, 163, 74, 0.6)',
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 2
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
        }
      }
    }
  });
  
  // Update class performance stats
  updateClassPerformanceStats(classDisplayNames, averageScores);
}

// Update the createClassPerformanceChart function
function createClassPerformanceChart() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);
  
  // Calculate average scores per class (as percentages)
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
  const el = document.getElementById('classPerformanceChart');
  if (!el || !window.Chart) return;
  const ctx = el.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: classDisplayNames, // Use display names instead of simple numbers
      datasets: [{
        label: 'Average Score (%)',
        data: averageScores,
        backgroundColor: 'rgba(22, 163, 74, 0.6)',
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 2
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
        }
      }
    }
  });
  
  // Update class performance stats
  updateClassPerformanceStats(classDisplayNames, averageScores);
}

// Update the createClassCompletionChart function
function createClassCompletionChart() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);
  
  // Calculate completion rates per class
  const completionRates = {};
  const classDisplayNames = {};
  
  // Create mapping of class names to display names
  classes.forEach(cls => {
    classDisplayNames[cls.name] = cls.fullName || `Grade ${cls.name}`;
  });
  
  classes.forEach(cls => {
    // Count students in this class
    const classStudents = students.filter(s => s.class === cls.name);
    const totalStudents = classStudents.length;
    
    if (totalStudents > 0) {
      // Count students with progress > 70% (as completed)
      const completedStudents = classStudents.filter(s => {
        const progress = s.progress || 0;
        return progress >= 70;
      }).length;
      
      completionRates[cls.name] = Math.round((completedStudents / totalStudents) * 100);
    } else {
      completionRates[cls.name] = 0;
    }
  });
  
  const classNames = Object.keys(completionRates);
  const completionValues = Object.values(completionRates);
  
  // Use display names for labels
  const displayLabels = classNames.map(name => classDisplayNames[name] || name);
  
  // Create chart
  const el = document.getElementById('classCompletionChart');
  if (!el || !window.Chart) return;
  const ctx = el.getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: displayLabels, // Use display names
      datasets: [{
        label: 'Completion Rate (%)',
        data: completionValues,
        backgroundColor: [
          'rgba(22, 163, 74, 0.6)',
          'rgba(14, 165, 233, 0.6)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(131, 56, 236, 0.6)',
          'rgba(6, 182, 212, 0.6)'
        ],
        borderColor: [
          'rgba(22, 163, 74, 1)',
          'rgba(14, 165, 233, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(131, 56, 236, 1)',
          'rgba(6, 182, 212, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Class Completion Rates'
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Add function to update class performance stats
function updateClassPerformanceStats(classNames, averageScores) {
  const statsContainer = document.getElementById('classPerformanceStats');
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
    <div class="performance-stats-grid">
      <div class="stat-card">
        <div class="stat-value">${overallAverage}%</div>
        <div class="stat-label">Overall Average</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${bestClass.score}%</div>
        <div class="stat-label">Best: ${bestClass.name}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${worstClass.score}%</div>
        <div class="stat-label">Needs Improvement: ${worstClass.name}</div>
      </div>
    </div>
  `;
}

// Add this function to create student progress chart (percentage-based)
function createStudentProgressChart() {
  const students = getJSON(LS.students, []);
  
  // Convert scores to percentages (assuming max score is 1000)
  const studentsWithPercentages = students.map(student => {
    const scorePercent = Math.min(100, Math.round(((student.score || 0) / 1000) * 100));
    return { ...student, scorePercent };
  });
  
  // Sort students by percentage (highest first)
  const sortedStudents = [...studentsWithPercentages].sort((a, b) => b.scorePercent - a.scorePercent);
  
  // Get top 10 students
  const topStudents = sortedStudents.slice(0, 10);
  
  const studentNames = topStudents.map(s => s.name);
  const studentScores = topStudents.map(s => s.scorePercent);
  
  // Create chart
  const el = document.getElementById('studentProgressChart');
  if (!el || !window.Chart) return;
  const ctx = el.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: studentNames,
      datasets: [{
        label: 'Score (%)',
        data: studentScores,
        backgroundColor: 'rgba(14, 165, 233, 0.6)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 2
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
            text: 'Score (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Students'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Top Performing Students'
        }
      }
    }
  });
}

// Add function to create progress distribution chart
function createProgressDistributionChart() {
  const students = getJSON(LS.students, []);
  
  // Convert scores to percentages
  const scorePercentages = students.map(student => {
    return Math.min(100, Math.round(((student.score || 0) / 1000) * 100));
  });
  
  // Categorize students by performance level
  const performanceLevels = {
    'Excellent (90-100%)': 0,
    'Good (75-89%)': 0,
    'Average (50-74%)': 0,
    'Needs Improvement (0-49%)': 0
  };
  
  scorePercentages.forEach(percent => {
    if (percent >= 90) {
      performanceLevels['Excellent (90-100%)']++;
    } else if (percent >= 75) {
      performanceLevels['Good (75-89%)']++;
    } else if (percent >= 50) {
      performanceLevels['Average (50-74%)']++;
    } else {
      performanceLevels['Needs Improvement (0-49%)']++;
    }
  });
  
  const labels = Object.keys(performanceLevels);
  const data = Object.values(performanceLevels);
  
  // Create chart
  const el = document.getElementById('progressDistributionChart');
  if (!el || !window.Chart) return;
  const ctx = el.getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Students',
        data: data,
        backgroundColor: [
          'rgba(22, 163, 74, 0.6)',
          'rgba(14, 165, 233, 0.6)',
          'rgba(253, 186, 116, 0.6)',
          'rgba(248, 113, 113, 0.6)'
        ],
        borderColor: [
          'rgba(22, 163, 74, 1)',
          'rgba(14, 165, 233, 1)',
          'rgba(253, 186, 116, 1)',
          'rgba(248, 113, 113, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Student Performance Distribution'
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Update the hydratePage function to include the new charts
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
    
    // Create charts if canvases are present
    const needsCharts = document.getElementById('classPerformanceChart') || document.getElementById('classCompletionChart') || document.getElementById('studentProgressChart') || document.getElementById('progressDistributionChart')
    if (needsCharts) {
      loadChartJs().then(() => {
        createClassPerformanceChart();
        createClassCompletionChart();
        createStudentProgressChart();
        createProgressDistributionChart();
      }).catch(() => {
        // ignore chart load errors
      })
    }
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