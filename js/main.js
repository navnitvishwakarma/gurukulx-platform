
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


const DEFAULT_API_BASE = window.location.protocol === 'file:' || window.location.origin === 'null'
  ? 'http://localhost:8080'
  : window.location.origin
const DEFAULT_AI_ENDPOINT = `${DEFAULT_API_BASE}/api/ai`



const GEMINI_API_KEY = null
const GEMINI_API_URL = null



document.addEventListener("DOMContentLoaded", async () => {
  injectHeader()
  injectFooter()
  initTheme()
  attachGlobalHandlers()


  const user = getUser()
  if (user.name && user.name !== "Guest") {
    await loadOrCreateUserProfile(user.name)
  }

  hydratePage()
  updateHomeCTA()
})

function updateHomeCTA() {
  const cta = document.querySelector(".cta-group")
  if (!cta) return
  const user = getUser()
  if (user.name && user.name !== "Guest") {
    cta.style.display = "none"
  }
}


window.googleTranslateElementInit = function () {
  console.log('Google Translate: Initializing widget...')
  const el = document.getElementById('google_translate_element')
  if (el) {
    try {
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,or',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: true
      }, 'google_translate_element')
      console.log('Google Translate: Widget initialized successfully')
    } catch (err) {
      console.error('Google Translate: Initialization failed', err)
    }
  } else {
    console.warn('Google Translate: Container element not found')
  }
}


function injectGoogleTranslate() {
  console.log('Google Translate: Injection requested')


  if (window.google && window.google.translate) {
    console.log('Google Translate: API already loaded, triggering init')
    window.googleTranslateElementInit()
    return
  }


  if (!document.querySelector('script[src*="translate.google.com"]')) {
    console.log('Google Translate: Loading script...')
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.onerror = (e) => console.error('Google Translate: Script load failed', e)
    document.head.appendChild(script)
  } else {
    console.log('Google Translate: Script already present but API not ready')
  }
}

function injectHeader() {
  const header = document.getElementById("site-header")
  if (!header) return


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
      ? `<a href="/teacher-home.html">Teacher Dashboard</a>
         <a href="/teacher-doubts.html">Doubts</a>`
      : `<a href="/student-tasks.html">Tasks</a>
         <a href="/profile.html">My Profile</a>`}
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


  const navToggle = header.querySelector(".nav-toggle")
  const primaryNav = header.querySelector("#primary-nav")
  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = primaryNav.classList.toggle("open")
      navToggle.setAttribute("aria-expanded", String(isOpen))
    })
  }



  if (isLoggedIn) {
    document.getElementById("logout-link").addEventListener("click", handleLogout)
  }


  injectGoogleTranslate()
}


function handleLogout(e) {
  e.preventDefault()
  console.log("Logging out...")


  localStorage.removeItem(LS.user)
  localStorage.removeItem('GX_TOKEN')


  localStorage.removeItem(LS.score)
  localStorage.removeItem(LS.xp)
  localStorage.removeItem(LS.level)
  localStorage.removeItem(LS.progress)
  localStorage.removeItem(LS.streak)
  localStorage.removeItem(LS.lastVisit)
  localStorage.removeItem(LS.assignments)
  localStorage.removeItem(LS.profiles) // Clear profile cache


  localStorage.setItem(LS.score, "0")
  localStorage.setItem(LS.xp, "0")
  localStorage.setItem(LS.streak, "0")


  window.location.href = `/index.html?t=${Date.now()}`
}



function injectFooter() {
  const footer = document.getElementById("site-footer")
  if (!footer) return

  footer.innerHTML = `
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Brand Column -->
        <div class="footer-col brand-col">
          <div class="footer-brand">
            <img src="/assets/images/logo.png" alt="GuruKulX" />
            <span>GuruKulX</span>
          </div>
          <p class="footer-tagline">Smart Learning, Smart Future. Gamified education for everyone.</p>
        </div>

        <!-- Links Column -->
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul class="footer-links-list">
            <li><a href="/index.html">Home</a></li>
            <li><a href="/leaderboard.html">Leaderboard</a></li>
            ${getUser()?.role === 'teacher'
      ? `<li><a href="/teacher-home.html">Teacher Dashboard</a></li>`
      : `<li><a href="/login-student.html">Student Login</a></li>`
    }
          </ul>
        </div>

        <!-- Resources Column -->
        <div class="footer-col">
          <h4>Resources</h4>
          <ul class="footer-links-list">
            <li><a href="/contact.html#ask-doubt">Ask a Doubt</a></li>
            <li><a href="/contact.html">Help Center</a></li>
            <li><a href="/contact.html">Privacy Policy</a></li>
            <li><a href="/contact.html">Terms of Service</a></li>
          </ul>
        </div>

        <!-- Connect Column -->
        <div class="footer-col">
          <h4>Connect</h4>
          <div class="social-links">
            <a href="#" aria-label="Twitter"><i class="ri-twitter-x-line"></i></a>
            <a href="https://www.instagram.com/edu_questt" target="_blank" aria-label="Instagram"><i class="ri-instagram-line"></i></a>
            <a href="#" aria-label="YouTube"><i class="ri-youtube-line"></i></a>
            <a href="#" aria-label="LinkedIn"><i class="ri-linkedin-line"></i></a>
          </div>
          <div class="theme-toggle-footer">
            <button id="toggleTheme" class="btn btn-sm btn-outline"><i class="ri-moon-line"></i> Toggle Theme</button>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2025 GuruKulX. All rights reserved.</p>
      </div>
    </div>
  `
  document.getElementById("toggleTheme")?.addEventListener("click", toggleTheme)
}


function initTheme() {
  const saved = localStorage.getItem(LS.theme) || "light"
  document.documentElement.setAttribute("data-theme", saved)
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"
  document.documentElement.setAttribute("data-theme", current)
  localStorage.setItem(LS.theme, current)
}


function attachGlobalHandlers() {


  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = (document.getElementById("username")?.value || "User").trim()
      const role = document.getElementById("role")?.value || "student"
      const password = document.getElementById("password")?.value || ""


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


          await loadOrCreateUserProfile(data.user?.username || name)
          bootstrapDefaults()

          injectHeader()
          if ((data.user?.role || role) === "teacher") location.href = "/teacher-home.html"
          else location.href = "/profile.html"
          return
        } else {
          const err = await res.json().catch(() => ({ error: 'Login failed' }))
          alert(err.error || 'Invalid username or password')
        }
      } catch {
        alert('Could not reach server. Please try again.')
      }
    })
  }


  document.getElementById("feedbackForm")?.addEventListener("submit", (e) => {
    e.preventDefault()
    const name = document.getElementById("fb-name")?.value || ""
    const email = document.getElementById("fb-email")?.value || ""
    const message = document.getElementById("fb-msg")?.value || ""
    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
    const url = `${apiBase.replace(/\/$/, '')}/api/feedback`
      ; (async () => {
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

          const list = getJSON('gx_feedback_local', [])
          list.push({ id: Date.now(), name, email, message })
          localStorage.setItem('gx_feedback_local', JSON.stringify(list))
        }
      })()
  })


  document.getElementById("doubtForm")?.addEventListener("submit", async (e) => {
    e.preventDefault()
    const subject = document.getElementById("doubt-subject")?.value || "General"
    const query = document.getElementById("doubt-msg")?.value || ""

    const user = getUser()
    const profile = {
      name: user.name || 'Learner',
      class: user.class || '—',
      level: Number(localStorage.getItem(LS.level) || 1),
      xp: Number(localStorage.getItem(LS.xp) || 0),
      score: Number(localStorage.getItem(LS.score) || 0)
    }

    const box = document.getElementById('aiAnswer')
    const content = document.getElementById('aiAnswerContent')

    if (box && content) {

      content.innerHTML = '<div style="text-align:center; padding:10px;"><i class="ri-loader-4-line" style="animation:spin 1s linear infinite; display:inline-block;"></i> Thinking...</div>'
      box.style.display = 'block'


      const geminiAnswer = await callGemini(subject, query, profile)

      if (geminiAnswer) {

        const formattedAnswer = `
          <div>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Question:</strong> ${query}</p>
            <div style="margin-top:10px; line-height:1.6;">${geminiAnswer.replace(/\n/g, '<br>')}</div>
            <p class="muted" style="margin-top:10px; font-size:0.85em;">Powered by Google Gemini AI</p>
          </div>
        `
        content.innerHTML = formattedAnswer
      } else {

        content.innerHTML = generateLocalAISuggestion(subject, query, profile)
      }
    }

    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
    const url = `${apiBase.replace(/\/$/, '')}/api/doubts`
      ; (async () => {
        try {
          if (url) {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('GX_TOKEN')}`
              },
              body: JSON.stringify({ subject, question: query })
            })
            if (!res.ok) throw new Error('Failed to send doubt')
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
        level: Number(localStorage.getItem(LS.level) || 1),
        xp: Number(localStorage.getItem(LS.xp) || 0),
        score: Number(localStorage.getItem(LS.score) || 0)
      }

      let answerHTML = ''


      try {
        console.log('Attempting AI call...', { subject, question, profile })
        const geminiResponse = await callGemini(subject, question, profile)

        if (geminiResponse) {
          answerHTML = `
            <p><strong>Subject:</strong> ${escapeHTML(subject)}</p>
            <p><strong>Question:</strong> ${escapeHTML(question)}</p>
            <div>${escapeHTML(geminiResponse).replace(/\n/g, '<br/>')}</div>
            <p class="muted">Powered by Google Gemini AI</p>
          `
        }
      } catch (error) {
        console.error('AI call failed:', error)

      }


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
              answerHTML = `<p><strong>Subject:</strong> ${escapeHTML(subject)}</p><p><strong>Question:</strong> ${escapeHTML(question)}</p><div>${escapeHTML(text).replace(/\n/g, '<br/>')}</div>`
            } else {
              throw new Error('Bad response')
            }
          } catch {

            if (!answerHTML) answerHTML = generateLocalAISuggestion(subject, question, profile)
          }
        } else if (!answerHTML) {

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


  function tryComputeMathAnswer(raw) {
    if (!raw) return null
    try {
      let expr = String(raw)
        .replace(/×/g, '*')
        .replace(/x/gi, (m, off) => {

          return /\d\s*x\s*\d/i.test(expr) ? '*' : 'x'
        })
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/\s+/g, ' ')
        .trim()

      const match = expr.match(/[0-9().+\-*\s*]+$/.test(candidate)) return null


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
      const CX_ID = "YOUR_CX_ID";          // e.g. 13c1d59b8467b4e5a

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


  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }




  document.getElementById("assignForm")?.addEventListener("submit", async (e) => {
    e.preventDefault()
    const cls = document.getElementById("assign-class").value
    const subj = document.getElementById("assign-subject").value
    const game = document.getElementById("assign-game").value
    const due = document.getElementById("assign-due").value
    const notes = document.getElementById("assign-notes").value

    try {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('GX_TOKEN')}`
        },
        body: JSON.stringify({ class_name: cls, subject: subj, game, due_date: due, notes })
      })

      if (res.ok) {
        alert("Assignment created successfully!")
        renderAssignments() // Refresh list
      } else {
        throw new Error('Failed to create assignment')
      }
    } catch (err) {
      console.error(err)

      const list = getJSON(LS.assignments, [])
      list.push({ id: Date.now(), class: cls, subject: subj, game, due, notes, status: "Assigned" })
      localStorage.setItem(LS.assignments, JSON.stringify(list))
      renderAssignments()
      alert("Assignment created (saved locally).")
    }
    e.target.reset()
  })


  document.getElementById("downloadCSV")?.addEventListener("click", () => {



    if (document.body.dataset.page !== "teacher-reports") {
      const rows = buildReportRows()
      const csv = toCSV(rows)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "gurukulx-report.csv"
      a.click()
      URL.revokeObjectURL(url)
    }
  })


  if (document.body.dataset.game === "math-quiz") {
    document.getElementById("startQuiz")?.addEventListener("click", startMathQuiz)
  }
}



const regForm = document.getElementById('registerForm');
if (regForm) {

  const roleSelect = document.getElementById('reg-role');
  const subjectRow = document.getElementById('subject-row');
  const classRow = document.getElementById('class-row');

  if (roleSelect && subjectRow && classRow) {
    const updateFields = () => {
      const isTeacher = roleSelect.value === 'teacher';


      subjectRow.style.display = isTeacher ? 'block' : 'none';


      classRow.style.display = isTeacher ? 'none' : 'block';

      const subjectInput = document.getElementById('reg-subject');
      const classInput = document.getElementById('reg-class');

      if (subjectInput) subjectInput.required = isTeacher;
      if (classInput) classInput.required = !isTeacher;
    };

    roleSelect.addEventListener('change', updateFields);

    updateFields();
  }

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const username = document.getElementById('reg-username')?.value || ''
    const password = document.getElementById('reg-password')?.value || ''
    const name = document.getElementById('reg-name')?.value || ''
    const userClass = document.getElementById('reg-class')?.value || ''
    const role = document.getElementById('reg-role')?.value || 'student'
    const subject = document.getElementById('reg-subject')?.value || ''

    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role, name, userClass, subject })
      })
      if (!res.ok) throw new Error('Registration failed')
      alert('Account created. Please log in.')
      window.location.href = '/login-student.html'
    } catch (err) {
      alert('Could not register. Try a different username.')
    }
  })
}


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




function generateLocalAISuggestion(subject, query, profile) {
  const sanitize = (s) => (s || '').toString().replace(/[<>]/g, '')
  const s = sanitize(subject)
  const q = sanitize(query)
  const cls = profile.class ? `Grade ${profile.class}` : 'your grade'
  const difficultyHint = profile.level >= 5 ? 'You seem experienced; try outlining steps first.' : 'Let’s break it into easy steps.'
  let strategy = ''
  switch (s) {
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

  return `
  <div>
    <p><strong>Subject:</strong> ${s} • <strong>${cls}</strong></p>
    <p><strong>Question:</strong> ${q || '—'}</p>
    <p><strong>How to think about it:</strong> ${strategy}</p>
    ${s === 'Math' ? `<p><strong>Tip:</strong> If there’s an equation, isolate the unknown by doing the same operation on both sides. Check with a quick substitution.</p>` : ''}
    ${s === 'Science' ? `<p><strong>Tip:</strong> Write the formula with units (e.g., F = ma). Verify units to catch mistakes.</p>` : ''}
    <p class="muted">This is an instant hint based on your profile (Level ${profile.level}, Score ${profile.score}). Your teacher also received your doubt.</p>
  </div>
  `
}



function bootstrapDefaults() {
  if (localStorage.getItem(LS.progress) == null) setNumber(LS.progress, 0, 0, 100)
  if (localStorage.getItem(LS.xp) == null) setNumber(LS.xp, 0)
  if (localStorage.getItem(LS.level) == null) setNumber(LS.level, 1)
  if (localStorage.getItem(LS.score) == null) setNumber(LS.score, 0)
  if (localStorage.getItem(LS.streak) == null) setNumber(LS.streak, 0)
  if (localStorage.getItem(LS.leaderboard) == null) {

    const seed = [
      { name: "Aditi", score: 820, badge: "Eco Hero" },
      { name: "Ravi", score: 760, badge: "Quiz Ace" },
      { name: "Zara", score: 740, badge: "Math Star" },
      { name: "Ishan", score: 690, badge: "Lab Champ" },
    ]
    localStorage.setItem(LS.leaderboard, JSON.stringify(seed))
  }
  if (localStorage.getItem(LS.classes) == null) {

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


async function loadOrCreateUserProfile(name) {
  const user = getUser()
  if (user.name !== "Guest" && localStorage.getItem('GX_TOKEN')) {
    try {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('GX_TOKEN')}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        const profile = data.profile || {}


        const localScore = Number(localStorage.getItem(LS.score) || 0);
        const serverScore = profile.score ?? 0;

        if (localScore > serverScore) {
          console.log("Local score is higher, syncing to server...");


          await saveCurrentUserProfile();
          return;
        }


        setNumber(LS.score, profile.score ?? 0)
        setNumber(LS.xp, profile.xp ?? 0)
        setNumber(LS.level, profile.level ?? 1)
        setNumber(LS.progress, profile.progress ?? 0, 0, 100)
        setNumber(LS.streak, profile.streak ?? 0)
        if (profile.lastVisit) localStorage.setItem(LS.lastVisit, profile.lastVisit)


        const all = getJSON(LS.profiles, {})
        all[name] = {
          score: profile.score ?? 0,
          xp: profile.xp ?? 0,
          level: profile.level ?? 1,
          progress: profile.progress ?? 0,
          streak: profile.streak ?? 0,
          class: user.class
        }
        localStorage.setItem(LS.profiles, JSON.stringify(all))
        return
      }
    } catch (e) {
      console.error("Failed to fetch profile from server, using local fallback", e)
    }
  }


  const all = getJSON(LS.profiles, {})
  const key = name || 'User'
  const existing = all[key]
  if (existing) {

    setNumber(LS.score, existing.score ?? 0)
    setNumber(LS.xp, existing.xp ?? 0)
    setNumber(LS.level, existing.level ?? 1)
    setNumber(LS.progress, existing.progress ?? 0, 0, 100)
    setNumber(LS.streak, existing.streak ?? 0)

    const u = getUser()
    if (existing.class) {
      u.class = existing.class
      localStorage.setItem(LS.user, JSON.stringify(u))
    }
  } else {

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

async function saveCurrentUserProfile() {
  const u = getUser()
  const key = u.name || 'User'


  const all = getJSON(LS.profiles, {})
  const currentProfile = {
    score: Number(localStorage.getItem(LS.score) || 0),
    xp: Number(localStorage.getItem(LS.xp) || 0),
    level: Number(localStorage.getItem(LS.level) || 1),
    progress: Number(localStorage.getItem(LS.progress) || 0),
    streak: Number(localStorage.getItem(LS.streak) || 0),
    lastVisit: localStorage.getItem(LS.lastVisit),
    class: u.class
  }
  all[key] = currentProfile
  localStorage.setItem(LS.profiles, JSON.stringify(all))


  if (u.name !== "Guest" && localStorage.getItem('GX_TOKEN')) {
    try {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
      await fetch(`${apiBase.replace(/\/$/, '')}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('GX_TOKEN')}`
        },
        body: JSON.stringify(currentProfile)
      })
    } catch (e) {
      console.error("Failed to sync profile to server", e)
    }
  }
}


function hydratePage() {
  bootstrapDefaults()

  const user = getUser()

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

    initLangPicker("lang-student")
  }


  if (document.body.dataset.page === "teacher-home") {
    document.getElementById("teacherName")?.append(` (${user.name || "Teacher"})`)
    initClassAndStudents()
    renderTeacherLists()
    renderTeacherScoreboard()
    initLangPicker("lang-teacher")
  }


  if (document.body.dataset.page === "teacher-assignments") {
    initAssignControls()
    renderAssignments()
  }


  if (document.body.dataset.page === "teacher-reports") {
    renderReports()
  }


  if (document.body.dataset.page === "leaderboard") {
    renderLeaderboardFull()
  }


  if (document.body.dataset.page === "profile") {
    renderProfile()
  }


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


function initLangPicker(id) {
  const sel = document.getElementById(id)
  if (!sel) return
  const saved = localStorage.getItem(LS.lang) || "English"

  Array.from(sel.options).forEach((o) => {
    if (o.value === saved || o.text === saved) sel.value = o.value
  })
  sel.addEventListener("change", () => {
    localStorage.setItem(LS.lang, sel.value)
    alert(`Language set to ${sel.value}`)
  })
}



function maintainStreak() {
  const user = getUser();

  if (!user || !user.name || user.name === "Guest") return;

  const today = new Date().toDateString()
  const last = localStorage.getItem(LS.lastVisit)
  if (last !== today) {
    const prev = Number(localStorage.getItem(LS.streak) || 0)
    const newStreak = prev + 1
    setNumber(LS.streak, newStreak)
    localStorage.setItem(LS.lastVisit, today)

    saveCurrentUserProfile()
  }
}


async function fetchLeaderboard() {
  try {
    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);

    return getJSON(LS.leaderboard, []);
  }
}
window.fetchLeaderboard = fetchLeaderboard;


async function saveGameResults(score, xp = null, progress = null) {
  try {

    const currentScore = parseInt(localStorage.getItem(LS.score) || 0);
    const newScore = currentScore + score;
    localStorage.setItem(LS.score, newScore);

    if (xp !== null) {
      const currentXP = parseInt(localStorage.getItem(LS.xp) || 0);
      const newXP = currentXP + xp;
      localStorage.setItem(LS.xp, newXP);
      const level = 1 + Math.floor(newXP / 500);
      localStorage.setItem(LS.level, level);
    }

    if (progress !== null) {
      const currentProgress = parseInt(localStorage.getItem(LS.progress) || 0);
      const newProgress = Math.min(100, currentProgress + progress);
      localStorage.setItem(LS.progress, newProgress);
    }


    const user = getUser();
    if (user.name !== "Guest" && localStorage.getItem('GX_TOKEN')) {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;


      await fetch(`${apiBase.replace(/\/$/, '')}/api/game/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('GX_TOKEN')}`
        },
        body: JSON.stringify({
          gameType: document.body.dataset.game || 'unknown',
          score,
          xpEarned: xp || 0,
          progressEarned: progress || 0
        })
      });


      await loadOrCreateUserProfile(user.name);
    } else {

      saveCurrentUserProfile();
    }

    return { score: newScore, xp: xp !== null ? parseInt(localStorage.getItem(LS.xp) || 0) : null };
  } catch (error) {
    console.error('Error saving game results:', error);

    saveCurrentUserProfile();
    return null;
  }
}

async function renderLeaderboardPreview() {
  const root = document.getElementById("leaderboardPreview")
  if (!root) return

  const rows = await fetchLeaderboard()
  const data = rows.slice(0, 5)

  root.innerHTML = `
    <div class="row header"><div class="rank">#</div><div>Name</div><div>Score</div></div>
    ${data
      .map(
        (d, i) => `
      <div class="row"><div class="rank">${i + 1}</div><div>${escapeHTML(d.name)} ${d.profile?.badges?.length ? `<span class="badge"><i class="ri-medal-line"></i>${d.profile.badges[0]}</span>` : ""}</div><div>${d.profile?.score || d.score || 0}</div></div>
    `,
      )
      .join("")}
  `
}

async function updateRankPreview() {
  const rows = await fetchLeaderboard()
  const you = getUser().name || "You"
  const rank = rows.findIndex((r) => r.name === you) + 1
  setText("rankPreview", rank || "—")
}

async function renderLeaderboardFull() {
  const root = document.getElementById("leaderboardTable")
  if (!root) return

  const rows = await fetchLeaderboard()

  root.innerHTML = `
    <div class="row header"><div class="rank">#</div><div>Name</div><div>Class</div><div>Score</div></div>
      ${rows
      .map(
        (d, i) => `
      <div class="row">
        <div class="rank">${i + 1}</div>
        <div>${escapeHTML(d.name)} ${d.profile?.badges?.length ? `<span class="badge"><i class="ri-medal-line"></i>${d.profile.badges[0]}</span>` : ""}</div>
        <div>${d.class ? `Grade ${d.class}` : '—'}</div>
        <div>${d.profile?.score || d.score || 0}</div>
      </div>
    `,
      )
      .join("")
    }
  `
}


function initClassAndStudents() {

}

function renderTeacherLists() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);
  const cl = document.getElementById("classList")
  const sl = document.getElementById("studentList")
  document.getElementById("classCount")?.append(` (${classes.length})`)
  document.getElementById("studentCount")?.append(` (${students.length})`)


  if (cl) cl.innerHTML = classes.map((c) =>
    `< li > ${escapeHTML(c.fullName || `Grade ${c.name}`)}</li > `
  ).join("")

  if (sl) sl.innerHTML = students.map((s) =>
    `< li > ${escapeHTML(s.name)} — ${s.score} (${s.class ? `Grade ${s.class}` : 'No class'})</li > `
  ).join("")
}
function renderTeacherScoreboard() {
  const root = document.getElementById("teacherScoreboard")
  if (!root) return
  const students = getJSON(LS.students, [])
  const top = [...students].sort((a, b) => b.score - a.score).slice(0, 5)
  root.innerHTML = `
    < div class="row header" ><div class="rank">#</div><div>Student</div><div>Score</div></div >
      ${top.map((d, i) => `<div class="row"><div class="rank">${i + 1}</div><div>${escapeHTML(d.name)}</div><div>${d.score}</div></div>`).join("")}
  `
}



function initAssignControls() {
  const classes = getJSON(LS.classes, []);
  const sc = document.getElementById("assign-class")

  if (sc) sc.innerHTML = classes.map((c) =>
    `< option value = "${c.name}" > ${escapeHTML(c.fullName || `Grade ${c.name}`)}</option > `
  ).join("")

  const SUBJECT_GAMES = {
    "Math": ["Rapid Fire", "Balloon Pop Game", "Runner Key"],
    "Science": ["Rapid Fire", "Virtual Lab", "Runner Key"],
    "Environment": ["Runner Key"],
    "Social Science": ["Map Game", "Rapid Fire", "Runner Key"],
    "English": ["Rapid Fire", "Spelling Bee", "Runner Key"],
    "Computer Science": ["Debug Challenge", "Rapid Fire", "Runner Key"],
    "GK": ["Guess the Picture", "Rapid Fire", "Runner Key"]
  };

  const sg = document.getElementById("assign-game")
  const subjectSel = document.getElementById("assign-subject")
  const updateGames = () => {
    const selectedSubject = subjectSel ? subjectSel.value : "Math";
    const subjectGames = SUBJECT_GAMES[selectedSubject] || [];

    const games = ["Quiz", "Assignment", ...subjectGames]


    const quizzes = getJSON('gx_quizzes', []);
    const availableQuizzes = quizzes
      .filter(q => !q.class || q.class === 'all' || (sc && q.class === sc.value))
      .map(q => `Quiz: ${q.title}`);

    const allOptions = [...games, ...availableQuizzes];

    if (sg)
      sg.innerHTML = allOptions
        .map((g) => `<option value="${g}">${g}</option>`)
        .join("")
  }
  subjectSel?.addEventListener("change", updateGames)
  updateGames()


  const form = document.getElementById("assignForm")
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const cls = document.getElementById("assign-class").value
      const subj = document.getElementById("assign-subject").value
      const game = document.getElementById("assign-game").value
      const due = document.getElementById("assign-due").value
      const notes = document.getElementById("assign-notes").value


      if (game === "Quiz") {
        window.location.href = `/teacher-create-quiz.html?class=${encodeURIComponent(cls)}&subject=${encodeURIComponent(subj)}&due=${encodeURIComponent(due)}`
        return
      }

      try {
        const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
        const res = await fetch(`${apiBase.replace(/\/$/, '')} /api/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('GX_TOKEN')} `
          },
          body: JSON.stringify({
            class_name: cls,
            subject: subj,
            game: game,
            due_date: due,
            notes: notes
          })
        })

        if (res.ok) {
          alert("Assignment created successfully!")
          renderAssignments()

          const dashboardAssignments = getJSON(LS.assignments, [])
          const newAssign = await res.json() // Assuming API returns created object

        } else {
          alert("Failed to create assignment")
        }
      } catch (err) {
        console.error(err)
        alert("Error creating assignment")
      }
    })
  }
}

async function renderAssignments() {
  const root = document.getElementById("assignmentsList")
  if (!root) return

  let items = []
  try {
    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
    const res = await fetch(`${apiBase.replace(/\/$/, '')} /api/assignments`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('GX_TOKEN')} `
      }
    })
    if (res.ok) {
      items = await res.json()

      localStorage.setItem(LS.assignments, JSON.stringify(items))
    } else {
      items = getJSON(LS.assignments, [])
    }
  } catch {
    items = getJSON(LS.assignments, [])
  }

  const classes = getJSON(LS.classes, []);


  const classMap = {};
  classes.forEach(c => {
    classMap[c.name] = c.fullName || `Grade ${c.name} `;
  });

  if (!items.length) {
    root.innerHTML = '<div class="row"><div class="rank">—</div><div>No assignments yet</div><div>—</div></div>'
    return
  }
  root.innerHTML = `
    < div class="row header" ><div class="rank">#</div><div>Assignment</div><div>Due</div></div >
      ${items
      .map(
        (a, i) => `
      <div class="row">
        <div class="rank">${i + 1}</div>
        <div>${escapeHTML(classMap[a.class_name] || a.class_name || a.class)} • ${escapeHTML(a.subject)} • ${escapeHTML(a.game)}</div>
        <div>${escapeHTML(a.due_date ? new Date(a.due_date).toLocaleDateString() : (a.due || "—"))}</div>
      </div>
    `,
      )
      .join("")
    }
  `
}


async function renderReports() {
  let students = getJSON(LS.students, [])


  if (!students.length) {
    try {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE
      const res = await fetch(`${apiBase.replace(/\/$/, '')} /api/leaderboard`)
      if (res.ok) {
        const users = await res.json()
        students = users.map(u => ({
          name: u.name,
          class: u.profile?.class || u.class || "N/A",
          score: u.profile?.score || 0,
          progress: u.profile?.progress || 0,
          badges: u.profile?.badges || []
        }))
        localStorage.setItem(LS.students, JSON.stringify(students))
      }
    } catch (e) {
      console.error("Failed to fetch report data", e)
    }
  }

  const avg = Math.round(students.reduce((s, x) => s + x.score, 0) / Math.max(1, students.length))
  const prog = Math.min(100, Math.round((avg / 1000) * 100))
  setText("reportStudents", students.length)
  setText("reportAvgScore", avg)
  setText("reportBadges", Math.round(students.length * 1.5))
  setText("avgProgress", `${prog}% `)
  setWidth("avgProgressBar", `${prog}% `)
  const top = [...students].sort((a, b) => b.score - a.score).slice(0, 5)
  const root = document.getElementById("reportsTop")
  if (root) {
    root.innerHTML = `
    < div class="row header" ><div class="rank">#</div><div>Student</div><div>Score</div></div >
      ${top.map((d, i) => `<div class="row"><div class="rank">${i + 1}</div><div>${escapeHTML(d.name)}</div><div>${d.score}</div></div>`).join("")}
  `
  }


  const dlBtn = document.getElementById("downloadCSV")
  if (dlBtn) {

    const classFilter = document.getElementById("reportClassFilter")
    if (classFilter) {
      const classes = getJSON(LS.classes, [])

      classFilter.innerHTML = '<option value="all">All Classes</option>' +
        classes.map(c => `< option value = "${c.name}" > ${escapeHTML(c.fullName || `Grade ${c.name}`)}</option > `).join("")
    }

    dlBtn.onclick = () => {
      const classVal = document.getElementById("reportClassFilter")?.value || "all"
      const subjectVal = document.getElementById("reportSubjectFilter")?.value || "all"

      const rows = buildReportRows(classVal, subjectVal)
      const csv = toCSV(rows)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report - ${subjectVal === 'all' ? 'overall' : subjectVal.toLowerCase()} -${classVal === 'all' ? 'all-classes' : 'grade-' + classVal} -${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
    }
  }
}
function buildReportRows(classFilter = "all", subjectFilter = "all") {
  const students = getJSON(LS.students, [])


  let filtered = students
  if (classFilter !== "all") {
    filtered = students.filter(s => s.class === classFilter)
  }


  const header = ["Name", "Class", subjectFilter === "all" ? "Overall Score" : `${subjectFilter} Score`]
  const rows = [header]

  filtered.forEach((s) => {
    let score = s.score


    if (subjectFilter !== "all") {

      const seed = (s.name.length + subjectFilter.length) * s.score


      const baseAvg = Math.min(100, Math.round(s.score / 10))


      let hash = 0;
      for (let i = 0; i < s.name.length; i++) hash = (hash << 5) - hash + s.name.charCodeAt(i);
      for (let i = 0; i < subjectFilter.length; i++) hash = (hash << 5) - hash + subjectFilter.charCodeAt(i);
      hash = Math.abs(hash);

      const variance = (hash % 30) - 15; // -15 to +15
      let subjectScore = Math.max(0, Math.min(100, baseAvg + variance));



      score = subjectScore
    }

    rows.push([s.name, s.class, score])
  })

  return rows
}
function toCSV(rows) {
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
}


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


function escapeHTML(s) {
  return (
    s?.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]) || ""
  )
}


function showToast(title, message, type = "info") {

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


  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);


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


window.testGemini = async function () {
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





async function callGemini(subject, question, profile) {
  console.log('callGemini called with:', { subject, question, profile })

  if (!GEMINI_API_KEY) {
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
          maxOutputTokens: 1000,
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


function initFloatingWidget() {

  const widgetHTML = `
    <div class="fab-container">
      <div class="fab-options" id="fabOptions">
        <button class="fab-option" id="fabAskAI">
          <i class="ri-robot-line"></i> Ask AI
        </button>
        <button class="fab-option" id="fabNotifications">
          <i class="ri-notification-3-line"></i> Notifications
        </button>
        <button class="fab-option" id="fabChatTeacher">
          <i class="ri-user-voice-line"></i> Chat with Teacher
        </button>
      </div>
      <button class="fab-button" id="fabMainBtn">
        <i class="ri-question-answer-line"></i>
        <span class="fab-badge" id="fabBadge" style="display: none;">0</span>
      </button>
    </div>

    <div class="chat-window" id="chatWindow">
      <div class="chat-header">
        <span id="chatTitle">Ask AI</span>
        <button class="chat-close" id="chatClose"><i class="ri-close-line"></i></button>
      </div>
      <div class="chat-body" id="chatBody">
        <div class="chat-message ai">Hello! How can I help you today?</div>
      </div>
      <div class="chat-input-area" id="chatInputArea">
        <button class="chat-mic" id="chatMic"><i class="ri-mic-line"></i></button>
        <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
        <button class="chat-send" id="chatSend"><i class="ri-send-plane-fill"></i></button>
      </div>
    </div>

    <div class="notification-window" id="notificationWindow">
      <div class="notification-header">
        <span>Notifications</span>
        <div style="display: flex; gap: 10px; align-items: center;">
            <button class="btn-link" id="notificationClearAll" style="font-size: 0.8rem; padding: 0; color: var(--text-muted); background: none; border: none; cursor: pointer;">Clear All</button>
            <button class="notification-close" id="notificationClose"><i class="ri-close-line"></i></button>
        </div>
      </div>
      <div class="notification-body" id="notificationBody">
        <!-- Mock Notifications -->
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', widgetHTML);


  const fabBtn = document.getElementById('fabMainBtn');
  const fabOptions = document.getElementById('fabOptions');
  const chatWindow = document.getElementById('chatWindow');
  const chatClose = document.getElementById('chatClose');
  const notificationWindow = document.getElementById('notificationWindow');
  const notificationClose = document.getElementById('notificationClose');
  const notificationBody = document.getElementById('notificationBody');
  const btnNotifications = document.getElementById('fabNotifications');
  const chatTitle = document.getElementById('chatTitle');
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatMic = document.getElementById('chatMic');
  const btnAskAI = document.getElementById('fabAskAI');
  const btnChatTeacher = document.getElementById('fabChatTeacher');

  let chatMode = 'ai'; // 'ai' or 'teacher'
  let selectedTeacher = null;


  fabBtn.addEventListener('click', () => {
    fabBtn.classList.toggle('active');
    fabOptions.classList.toggle('show');
    if (fabBtn.classList.contains('active')) {
      fabBtn.innerHTML = '<i class="ri-close-line"></i>';
    } else {
      fabBtn.innerHTML = '<i class="ri-question-answer-line"></i>';
    }
  });


  btnAskAI.addEventListener('click', () => {
    chatMode = 'ai';
    chatTitle.textContent = 'Ask AI';
    chatBody.innerHTML = '<div class="chat-message ai">Hello! I am your AI assistant. Ask me anything!</div>';
    openChat();
  });


  btnChatTeacher.addEventListener('click', () => {
    chatMode = 'teacher';
    chatTitle.textContent = 'Select a Teacher';
    renderTeacherList();
    openChat();
  });


  btnNotifications.addEventListener('click', () => {
    renderNotifications();
    notificationWindow.classList.add('show');
    fabOptions.classList.remove('show');
    fabBtn.classList.remove('active');
    fabBtn.innerHTML = '<i class="ri-question-answer-line"></i>';
    chatWindow.classList.remove('show');
  });



  notificationClose.addEventListener('click', () => {
    notificationWindow.classList.remove('show');
  });


  const notificationClearAll = document.getElementById('notificationClearAll');
  if (notificationClearAll) {
    notificationClearAll.addEventListener('click', async () => {
      if (!confirm("Clear all notifications?")) return;
      try {
        const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;
        const token = localStorage.getItem('GX_TOKEN');
        if (!token) return;

        const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/notifications`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          renderNotifications();
        }
      } catch (e) {
        console.error("Failed to clear notifications", e);
      }
    });
  }


  chatClose.addEventListener('click', () => {
    chatWindow.classList.remove('show');
  });


  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      chatMic.classList.add('listening');
      chatMic.innerHTML = '<i class="ri-mic-fill"></i>';
      chatInput.placeholder = 'Listening...';
    };

    recognition.onend = () => {
      chatMic.classList.remove('listening');
      chatMic.innerHTML = '<i class="ri-mic-line"></i>';
      chatInput.placeholder = 'Type a message...';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      chatInput.focus();
    };

    chatMic.addEventListener('click', () => {
      recognition.start();
    });
  } else {
    if (chatMic) chatMic.style.display = 'none';
  }

  function openChat() {
    chatWindow.classList.add('show');
    notificationWindow.classList.remove('show');
    fabOptions.classList.remove('show');
    fabBtn.classList.remove('active');
    fabBtn.innerHTML = '<i class="ri-question-answer-line"></i>';

    if (chatMode === 'ai' || selectedTeacher) {
      setTimeout(() => chatInput.focus(), 300);
    }
  }


  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;


    addMessage(text, 'user');
    chatInput.value = '';

    if (chatMode === 'ai') {

      const typingId = addMessage('Thinking...', 'ai');


      const user = getUser();
      callGemini('General', text, {
        name: user.name,
        class: user.class,
        level: localStorage.getItem(LS.level) || 1,
        xp: localStorage.getItem(LS.xp) || 0,
        score: localStorage.getItem(LS.score) || 0
      }).then(response => {

        document.getElementById(typingId)?.remove();
        addMessage(response, 'ai');
      }).catch(err => {
        document.getElementById(typingId)?.remove();
        addMessage("Sorry, I'm having trouble connecting right now.", 'ai');
      });
    } else if (chatMode === 'teacher' && selectedTeacher) {

      try {
        const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;
        const token = localStorage.getItem('GX_TOKEN');

        if (!token) {
          addMessage("Please log in to send messages.", 'bot');
          return;
        }

        const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            recipientId: selectedTeacher._id,
            content: text
          })
        });

        if (!res.ok) throw new Error('Failed to send message');


      } catch (e) {
        console.error("Send message error", e);
        addMessage("Failed to send message. Please try again.", 'bot');
      }
    }
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  function addMessage(text, type) {
    const id = 'msg-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = `chat-message ${type}`;

    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
  }

  let chatPollInterval = null;

  async function renderTeacherList() {
    const list = chatBody.querySelector('.teacher-list');
    if (!list) {
      chatBody.innerHTML = '<div class="teacher-list"><div style="text-align:center; padding:20px;"><i class="ri-loader-4-line" style="animation:spin 1s linear infinite; display:inline-block;"></i> Loading teachers...</div></div>';
    }

    let teachers = [];
    try {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/teachers`);
      if (res.ok) {
        teachers = await res.json();
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (e) {
      console.warn("Could not fetch teachers, using mock data", e);
      teachers = [
        { name: 'Mr. Sharma', subject: 'Mathematics' },
        { name: 'Ms. Gupta', subject: 'Science' },
        { name: 'Mrs. Verma', subject: 'English' },
        { name: 'Mr. Singh', subject: 'Computer Science' }
      ];
    }


    const userClass = getUser().class || 'Gen';
    const classGroup = {
      name: `Class ${userClass} Group`,
      subject: `Discussion`,
      isGroup: true,
      _id: `group:class-${userClass}`
    };

    const allOptions = [classGroup, ...teachers];

    chatBody.innerHTML = '<div class="teacher-list"></div>';
    const newList = chatBody.querySelector('.teacher-list');

    allOptions.forEach(t => {
      const item = document.createElement('div');
      item.className = 'teacher-item';

      const initials = t.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const icon = t.isGroup ? 'ri-group-line' : 'ri-user-line';

      const hue = Math.floor(Math.random() * 360);
      const avatarStyle = `background: hsl(${hue}, 70%, 80%); color: hsl(${hue}, 80%, 30%); display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; font-weight: bold; font-size: 0.9rem;`;

      item.innerHTML = `
        <div class="teacher-avatar" style="${avatarStyle}">
             ${t.isGroup ? '<i class="ri-team-line"></i>' : initials}
        </div>
        <div class="teacher-info" style="flex:1;">
          <div class="teacher-name" style="font-weight:600;">${escapeHTML(t.name)}</div>
          <div class="teacher-subject" style="font-size:0.8rem; color:var(--text-muted);">${escapeHTML(t.subject || 'General')}</div>
        </div>
        <i class="ri-chat-1-line" style="color: var(--color-primary); opacity: 0.5;"></i>
      `;

      item.onclick = () => startTeacherChat(t);
      newList.appendChild(item);
    });
  }

  async function startTeacherChat(teacher) {
    selectedTeacher = teacher;
    chatTitle.innerHTML = `<div>${teacher.name}</div><div style="font-size:0.7rem; font-weight:400; opacity:0.8;">${teacher.isGroup ? 'Group Chat' : 'Online'}</div>`;
    chatBody.innerHTML = '<div class="chat-loading" style="text-align:center; padding:20px; color:#aaa;"><i class="ri-loader-2-line spin"></i> Loading messages...</div>';


    if (chatPollInterval) clearInterval(chatPollInterval);

    await fetchAndRenderMessages(teacher);


    chatPollInterval = setInterval(() => {
      if (!chatWindow.classList.contains('show') || chatMode !== 'teacher' || !selectedTeacher) {
        clearInterval(chatPollInterval);
        return;
      }
      fetchAndRenderMessages(teacher, true);
    }, 3000);
  }

  async function fetchAndRenderMessages(teacher, isPoll = false) {
    try {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;
      const token = localStorage.getItem('GX_TOKEN');
      if (!token) return;

      const endpoint = teacher.isGroup
        ? `${apiBase.replace(/\/$/, '')}/api/messages/group/${teacher._id}`
        : `${apiBase.replace(/\/$/, '')}/api/messages/${teacher._id}`;

      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const messages = await res.json();




        const currentCount = chatBody.querySelectorAll('.chat-message').length;
        if (isPoll && messages.length === currentCount) return; // Naive: no new messages

        if (messages.length === 0 && !isPoll) {
          const welcomeMsg = teacher.isGroup
            ? "Welcome to the class group chat!"
            : `Hi! I'm ${teacher.name}. How can I help you?`;
          chatBody.innerHTML = `<div class="teacher-intro" style="text-align:center; padding:20px; color:#aaa; font-size:0.9rem;">${welcomeMsg}</div>`;
        } else if (messages.length > 0) {

          const myId = getUser().userId; // We need to be careful with getUser returning undefined if not logged in


          chatBody.innerHTML = '';

          messages.forEach(m => {
            const isMe = m.sender === myId || m.sender._id === myId;
            const div = document.createElement('div');
            div.className = `chat-message ${isMe ? 'user' : 'teacher'}`;
            div.innerHTML = `
                        <div class="msg-content">${escapeHTML(m.content)}</div>
                        <div class="msg-time" style="font-size:0.65rem; opacity:0.7; text-align:right; margin-top:2px;">
                            ${new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    `;
            chatBody.appendChild(div);
          });
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      }
    } catch (e) {
      if (!isPoll) console.error("Chat fetch error", e);
    }
  }

  async function renderNotifications() {
    const notificationBody = document.querySelector('.notification-body'); // Ensure this element exists
    if (!notificationBody) return;

    notificationBody.innerHTML = '<div style="text-align:center; padding:20px;">Loading...</div>';

    try {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;
      const token = localStorage.getItem('GX_TOKEN');

      if (!token) {
        notificationBody.innerHTML = '<div style="text-align:center; padding:20px;">Please login to view notifications</div>';
        return;
      }

      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const notifications = await res.json();
        if (notifications.length === 0) {
          notificationBody.innerHTML = '<div style="text-align:center; padding:20px; color: var(--text-muted);">No new notifications</div>';
          return;
        }

        notificationBody.innerHTML = '';
        notifications.forEach(n => {
          const item = document.createElement('div');
          item.className = 'notification-item';

          let icon = 'ri-information-line';
          if (n.type === 'warning') icon = 'ri-alert-line';
          if (n.type === 'success') icon = 'ri-check-line';
          if (n.type === 'error') icon = 'ri-error-warning-line';

          const timeAgo = new Date(n.createdAt).toLocaleDateString(); // Simple date for now

          item.innerHTML = `
            <div class="notification-icon"><i class="${icon}"></i></div>
            <div class="notification-content">
              <div class="notification-title">${escapeHTML(n.type.toUpperCase())}</div>
              <div class="notification-message">${escapeHTML(n.message)}</div>
              <div class="notification-time">${timeAgo}</div>
            </div>
          `;
          if (n.link) {
            item.style.cursor = 'pointer';
            item.onclick = () => window.location.href = n.link;
          }
          notificationBody.appendChild(item);
        });
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
      notificationBody.innerHTML = '<div style="text-align:center; padding:20px; color: red;">Failed to load notifications</div>';
    }
  }


  let badgeErrorCount = 0;
  const MAX_BADGE_ERRORS = 3;
  let badgeInterval = null;

  async function updateNotificationBadge() {
    const badge = document.getElementById('fabBadge');
    if (!badge) return;

    try {
      const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;
      const token = localStorage.getItem('GX_TOKEN');
      if (!token) {
        badge.style.display = 'none';
        return;
      }

      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        badgeErrorCount = 0; // Reset error count on success
        const notifications = await res.json();
        const unreadCount = notifications.filter(n => !n.is_read).length;

        if (unreadCount > 0) {
          badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) {
      badgeErrorCount++;

      if (badgeErrorCount <= MAX_BADGE_ERRORS) {
        console.warn("Failed to update notification badge (server might be unreachable)", e);
      }
      if (badgeErrorCount > MAX_BADGE_ERRORS && badgeInterval) {
        console.warn("Stopping notification badge updates due to persistent errors.");
        clearInterval(badgeInterval);
      }
    }
  }


  updateNotificationBadge();
  badgeInterval = setInterval(updateNotificationBadge, 60000); // Check every minute
}


document.addEventListener('DOMContentLoaded', () => {

  setTimeout(initFloatingWidget, 100);


  const assignForm = document.getElementById('assignForm');
  if (assignForm) {
    assignForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = assignForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      try {
        const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;
        const token = localStorage.getItem('GX_TOKEN');

        const data = {
          class_name: document.getElementById('assign-class').value,
          subject: document.getElementById('assign-subject').value,
          game: document.getElementById('assign-game').value,
          due_date: document.getElementById('assign-due').value,
          notes: document.getElementById('assign-notes').value
        };

        const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          alert('Assignment created successfully!');
          assignForm.reset();
        } else {
          const err = await res.json();
          alert('Failed to create assignment: ' + (err.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Assignment error:', error);
        alert('Error creating assignment');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });


    const classSelect = document.getElementById('assign-class');
    if (classSelect && classSelect.options.length === 0) {
      ['6', '7', '8', '9', '10', '11', '12'].forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `Class ${c}`;
        classSelect.appendChild(opt);
      });
    }

    const gameSelect = document.getElementById('assign-game');
    if (gameSelect && gameSelect.options.length === 0) {
      ['Math Quiz', 'Science Quiz', 'History Trivia'].forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        gameSelect.appendChild(opt);
      });
    }
  }
});

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


  const xpEarned = quizState.score; // Use score as XP
  const progressEarned = 10; // 10% progress for completing quiz
  saveGameResults(quizState.score, xpEarned, progressEarned);


  showToast('Quiz Completed', `You earned ${xpEarned} XP and ${progressEarned}% progress!`, 'success');
}



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


function createClassPerformanceChart() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);


  const classAverages = {};
  const classStudentCounts = {};


  classes.forEach(cls => {
    classAverages[cls.name] = 0;
    classStudentCounts[cls.name] = 0;
  });


  students.forEach(student => {
    if (student.class && classAverages.hasOwnProperty(student.class)) {
      classAverages[student.class] += (student.score || 0);
      classStudentCounts[student.class] += 1;
    }
  });


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


  const el = document.getElementById('classPerformanceChart');
  if (!el || !window.Chart) return;
  const ctx = el.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: classDisplayNames,
      datasets: [{
        label: 'Average Score',
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
          title: {
            display: true,
            text: 'Average Score'
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


  updateClassPerformanceStats(classDisplayNames, averageScores);
}


function createClassPerformanceChart() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);


  const classAverages = {};
  const classStudentCounts = {};


  classes.forEach(cls => {
    classAverages[cls.name] = 0;
    classStudentCounts[cls.name] = 0;
  });


  students.forEach(student => {
    if (student.class && classAverages.hasOwnProperty(student.class)) {

      const scorePercent = Math.min(100, Math.round(((student.score || 0) / 1000) * 100));
      classAverages[student.class] += scorePercent;
      classStudentCounts[student.class] += 1;
    }
  });


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


  const el = document.getElementById('classPerformanceChart');
  if (!el || !window.Chart) return;


  const existingChart = Chart.getChart(el);
  if (existingChart) existingChart.destroy();

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


  updateClassPerformanceStats(classDisplayNames, averageScores);
}


function createClassCompletionChart() {
  const classes = getJSON(LS.classes, []);
  const students = getJSON(LS.students, []);


  const completionRates = {};
  const classDisplayNames = {};


  classes.forEach(cls => {
    classDisplayNames[cls.name] = cls.fullName || `Grade ${cls.name}`;
  });

  classes.forEach(cls => {

    const classStudents = students.filter(s => s.class === cls.name);
    const totalStudents = classStudents.length;

    if (totalStudents > 0) {

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


  const displayLabels = classNames.map(name => classDisplayNames[name] || name);


  const el = document.getElementById('classCompletionChart');
  if (!el || !window.Chart) return;


  const existingChart = Chart.getChart(el);
  if (existingChart) existingChart.destroy();

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


function updateClassPerformanceStats(classNames, averageScores) {
  const statsContainer = document.getElementById('classPerformanceStats');
  if (!statsContainer) return;


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


function createStudentProgressChart() {
  const students = getJSON(LS.students, []);


  const sortedStudents = [...students].sort((a, b) => (b.score || 0) - (a.score || 0));


  const topStudents = sortedStudents.slice(0, 10);

  const studentNames = topStudents.map(s => s.name);
  const studentScores = topStudents.map(s => s.score || 0);


  const el = document.getElementById('studentProgressChart');
  if (!el || !window.Chart) return;


  const existingChart = Chart.getChart(el);
  if (existingChart) existingChart.destroy();

  const ctx = el.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: studentNames,
      datasets: [{
        label: 'Score',
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
          title: {
            display: true,
            text: 'Score'
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


function createProgressDistributionChart() {
  const students = getJSON(LS.students, []);


  const progressValues = students.map(student => student.progress || 0);


  const performanceLevels = {
    'Excellent (90-100%)': 0,
    'Good (75-89%)': 0,
    'Average (50-74%)': 0,
    'Needs Improvement (0-49%)': 0
  };

  progressValues.forEach(percent => {
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


  const el = document.getElementById('progressDistributionChart');
  if (!el || !window.Chart) return;


  const existingChart = Chart.getChart(el);
  if (existingChart) existingChart.destroy();

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
          text: 'Student Progress Distribution'
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}


function hydratePage() {
  bootstrapDefaults()

  const user = getUser()

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

    initLangPicker("lang-student")
  }


  if (document.body.dataset.page === "teacher-home") {
    document.getElementById("teacherName")?.append(` (${user.name || "Teacher"})`)
    initClassAndStudents()
    renderTeacherLists()
    renderTeacherScoreboard()
    initLangPicker("lang-teacher")


    const needsCharts = document.getElementById('classPerformanceChart') || document.getElementById('classCompletionChart') || document.getElementById('studentProgressChart') || document.getElementById('progressDistributionChart')
    if (needsCharts) {
      loadChartJs().then(() => {
        createClassPerformanceChart();
        createClassCompletionChart();
        createStudentProgressChart();
        createProgressDistributionChart();
      }).catch(() => {

      })
    }
  }


  if (document.body.dataset.page === "teacher-assignments") {
    initAssignControls()
    renderAssignments()
  }


  if (document.body.dataset.page === "teacher-reports") {
    renderReports()
  }


  if (document.body.dataset.page === "leaderboard") {
    renderLeaderboardFull()
  }


  if (document.body.dataset.page === "profile") {
    renderProfile()
  }


  if (document.body.dataset.game === "math-quiz") {
    document.getElementById("qTotal").textContent = String(MATH_QUIZ.length)
  }
}

async function callGemini(subject, question, profile) {
  try {
    const apiBase = window.GX_API_BASE || localStorage.getItem('GX_API_BASE') || DEFAULT_API_BASE;

    const res = await fetch(\\/api/ai\, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \Bearer \\
      },
      body: JSON.stringify({ subject, question, profile })
    });

    if (res.ok) {
      const data = await res.json();
      return data.answer;
    } else {
      console.error('AI Backend Error:', res.status);
      return null;
    }
  } catch (error) {
    console.error('Error calling AI backend:', error);
    return null;
  }
}

