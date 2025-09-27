// Balloon Equations Game
let BE = { level: 1, score: 0, t: 0, time: 180, running: false, current: null, spawner: 0, waveId: 0 }

document.addEventListener('DOMContentLoaded', ()=>{
  bindBE()
  beStart()
})

function bindBE(){
  document.getElementById('beRestart').addEventListener('click', ()=> beStart())
}

function beStart(){
  clearInterval(BE.t)
  clearInterval(BE.spawner)
  // Reset
  BE = { level: 1, score: 0, t: 0, time: 180, running: true, current: null, spawner: 0, waveId: 0 }
  document.getElementById('beOver').classList.add('hidden')
  beUpdateHUD()
  beNext()
  BE.t = setInterval(()=>{
    BE.time -= 1
    beUpdateHUD()
    if (BE.time<=0){
      beEnd()
    }
  }, 1000)
}

function beUpdateHUD(){
  document.getElementById('beScore').textContent = BE.score
  document.getElementById('beLevel').textContent = BE.level
  document.getElementById('beTime').textContent = BE.time
}

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }

function genEquation(level){
  const L = level
  if (L<=2){
    const a=randInt(1,20), b=randInt(1,20), op = Math.random()<0.5? '+':'-'
    const val = op==='+'? a+b : a-b
    return { text: `${a} ${op} ${b}`, value: val }
  }
  if (L<=4){
    const a=randInt(2,12), b=randInt(2,12), op = Math.random()<0.7? '×':'+'
    const val = op==='×'? a*b : a+b
    return { text: `${a} ${op} ${b}`, value: val }
  }
  const a=randInt(2,20), b=randInt(2,20), c=randInt(1,10)
  const pattern = randInt(1,3)
  let text,val
  if (pattern===1){ text = `(${a} + ${b}) × ${c}`; val = (a+b)*c }
  else if (pattern===2){ text = `${a} × ${b} - ${c}`; val = a*b - c }
  else { text = `${a} + ${b} × ${c}`; val = a + b*c }
  return { text, value: val }
}

function beNext(){
  if (!BE.running) return
  const board = document.getElementById('beBoard')
  board.querySelectorAll('.balloon').forEach(b=> b.remove())
  const eq = genEquation(BE.level)
  BE.current = eq
  document.getElementById('beEq').textContent = eq.text
  // continuous waves until correct balloon is clicked
  BE.waveId = Date.now()
  clearInterval(BE.spawner)
  const spawnWave = () => {
    if (!BE.running) return
    const answers = new Set([eq.value])
    while (answers.size<3){
      const delta = randInt(-12,12) || randInt(1,12)
      const candidate = eq.value + delta
      answers.add(candidate)
    }
    const arr = Array.from(answers)
    const w = board.clientWidth
    const slots = [w*0.2, w*0.5, w*0.8]
    arr.sort(()=> Math.random()-0.5)
    arr.forEach((val, i)=> beSpawnBalloon(slots[i], val, val===eq.value, BE.waveId))
  }
  spawnWave()
  // wave frequency increases with level
  const intervalMs = Math.max(1400 - (BE.level*80), 600)
  BE.spawner = setInterval(spawnWave, intervalMs)
}

function beSpawnBalloon(x, value, isCorrect, waveId){
  const board = document.getElementById('beBoard')
  const b = document.createElement('div')
  b.className = 'balloon' + (isCorrect? ' correct':'')
  b.textContent = value
  b.style.left = `${x}px`
  b.style.bottom = `-60px`
  b.addEventListener('click', ()=> bePick(isCorrect, waveId))
  board.appendChild(b)
  // animate upward
  // slow to faster with level
  const duration = Math.max(3600 - (BE.level*150), 1000)
  const start = performance.now()
  const h = board.clientHeight
  function step(now){
    const t = Math.min(1, (now-start)/duration)
    const y = -60 + t*(h+80)
    b.style.bottom = `${y}px`
    if (t<1 && BE.running){ requestAnimationFrame(step) } else { b.remove() }
  }
  requestAnimationFrame(step)
}

function bePick(isCorrect, waveId){
  if (!BE.running) return
  if (waveId && waveId !== BE.waveId) return
  if (isCorrect){
    const award = 5 + BE.level*2
    BE.score += award
    BE.level += 1
    // stop current waves and clear balloons to move to next equation
    clearInterval(BE.spawner)
    const board = document.getElementById('beBoard')
    board.querySelectorAll('.balloon').forEach(b=> b.remove())
  } else {
    // small penalty: -2 seconds
    BE.time = Math.max(0, BE.time-2)
  }
  beUpdateHUD()
  if (isCorrect) beNext()
}

function beEnd(){
  BE.running = false
  clearInterval(BE.t)
  clearInterval(BE.spawner)
  document.getElementById('beFinal').textContent = BE.score
  document.getElementById('beOver').classList.remove('hidden')
  // persist
  try {
    const prevScore = Number(localStorage.getItem('gx_score')||0)
    localStorage.setItem('gx_score', String(prevScore + BE.score))
    const prevXp = Number(localStorage.getItem('gx_xp')||0)
    const xp = prevXp + BE.score
    localStorage.setItem('gx_xp', String(xp))
    const level = 1 + Math.floor(xp/500)
    localStorage.setItem('gx_level', String(level))
    const progress = Math.min(100, Number(localStorage.getItem('gx_progress')||0) + 6)
    localStorage.setItem('gx_progress', String(progress))
    if (typeof upsertYouInLeaderboard==='function') upsertYouInLeaderboard()
    if (typeof upsertYouInStudents==='function') upsertYouInStudents()
    if (typeof saveCurrentUserProfile==='function') saveCurrentUserProfile()
  } catch {}
}


