
let cmp = { q: 0, total: 10, score: 0, streak: 0, t: null, time: 30, a: null }

document.addEventListener('DOMContentLoaded', () => {
  bindCmpHandlers()
  startCmpGame()
})

function bindCmpHandlers() {
  document.querySelectorAll('.op-btn').forEach(btn => {
    btn.addEventListener('click', () => submitCmp(btn.dataset.op))
  })
  document.getElementById('cmpSkip').addEventListener('click', () => {
    nextCmp()
  })
  document.getElementById('cmpRestart').addEventListener('click', () => {
    startCmpGame()
  })
}

function startCmpGame() {
  clearInterval(cmp.t)
  cmp = { q: 0, total: 10, score: 0, streak: 0, t: null, time: 30, a: null }
  setCmpText('cmpScore', 0)
  setCmpText('cmpStreak', 0)
  setCmpText('cmpQuestion', `1/${cmp.total}`)
  setCmpText('cmpTimer', cmp.time)
  setCmpText('cmpStatus', '')
  nextCmp()
  startCmpTimer()
}

function startCmpTimer() {
  clearInterval(cmp.t)
  cmp.time = 30
  setCmpText('cmpTimer', cmp.time)
  cmp.t = setInterval(() => {
    cmp.time -= 1
    setCmpText('cmpTimer', cmp.time)
    if (cmp.time <= 0) {
      clearInterval(cmp.t)
      submitCmp('timeout')
    }
  }, 1000)
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePair() {

  const mode = randInt(1, 4)
  if (mode === 1) return [randInt(10, 999), randInt(10, 999)]
  if (mode === 2) return [randInt(1000, 99999), randInt(1000, 99999)]
  if (mode === 3) {
    const a = Math.round((Math.random() * 2000) * 10) / 10
    const b = Math.round((Math.random() * 2000) * 10) / 10
    return [a, b]
  }
  return [randInt(1, 1000000), randInt(1, 1000000)]
}

function formatNum(n) {
  return ('' + n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function nextCmp() {
  if (cmp.q >= cmp.total) return endCmp()
  const [l, r] = generatePair()
  document.getElementById('leftNum').textContent = formatNum(l)
  document.getElementById('rightNum').textContent = formatNum(r)
  document.getElementById('operator').textContent = '?'
  cmp.a = l === r ? '=' : (l > r ? '>' : '<')
  setCmpText('cmpQuestion', `${cmp.q + 1}/${cmp.total}`)
  setCmpText('cmpStatus', '')
}

function submitCmp(choice) {
  if (cmp.q >= cmp.total) return
  const correct = (choice === cmp.a)
  if (choice === 'timeout') {
    feedback('Time up!')
    cmp.streak = 0
  } else if (correct) {
    const award = 20
    cmp.score += award
    cmp.streak += 1
    feedback(`Correct! +${award} points`)
  } else {
    feedback(`Incorrect. Correct is "${cmp.a}"`)
    cmp.streak = 0
  }
  setCmpText('cmpScore', cmp.score)
  setCmpText('cmpStreak', cmp.streak)
  document.getElementById('operator').textContent = cmp.a
  cmp.q += 1
  clearInterval(cmp.t)
  if (cmp.q >= cmp.total) endCmp()
  else {
    nextCmp()
    startCmpTimer()
  }
}

function feedback(msg) {
  setCmpText('cmpStatus', msg)
}

function endCmp() {
  clearInterval(cmp.t)
  feedback(`Game over! Final Score: ${cmp.score}`)

  try {

    const prevScore = Number(localStorage.getItem('gx_score') || 0)
    const newScore = prevScore + cmp.score
    localStorage.setItem('gx_score', String(newScore))
    const prevXp = Number(localStorage.getItem('gx_xp') || 0)
    const xp = prevXp + cmp.score
    localStorage.setItem('gx_xp', String(xp))
    const level = 1 + Math.floor(xp / 500)
    localStorage.setItem('gx_level', String(level))
    const progress = Math.min(100, Number(localStorage.getItem('gx_progress') || 0) + 8)
    localStorage.setItem('gx_progress', String(progress))

    if (typeof upsertYouInLeaderboard === 'function') upsertYouInLeaderboard()
    if (typeof upsertYouInStudents === 'function') upsertYouInStudents()
    if (typeof saveCurrentUserProfile === 'function') saveCurrentUserProfile()
  } catch {}
}

function setCmpText(id, val) {
  const el = document.getElementById(id)
  if (el) el.textContent = String(val)
}


