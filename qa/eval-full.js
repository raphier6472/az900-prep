(() => {
  const list = document.getElementById('sim-list');
  let right = 0, wrongish = 0, locked = 0;
  for (let i = 0; i < 50; i++) {
    let b = list.querySelectorAll('.quiz-q')[i];
    if (i < 35) {
      for (let k = 0; k < 4; k++) {
        b = list.querySelectorAll('.quiz-q')[i];
        const o = b.querySelectorAll('.q-opt')[k]; o.click();
        if (o.classList.contains('correct') && !b.querySelector('.q-opt.incorrect')) { right++; break; }
        b.querySelector('.q-retry').click();
      }
    } else { b.querySelectorAll('.q-opt')[0].click(); wrongish++; }
    b = list.querySelectorAll('.quiz-q')[i];
    // locked: second click on another option must do nothing
    const before = b.querySelectorAll('.q-opt.correct,.q-opt.incorrect').length;
    b.querySelectorAll('.q-opt')[3].click();
    if (b.querySelectorAll('.q-opt.correct,.q-opt.incorrect').length === before) locked++;
  }
  const r = document.getElementById('sim-results');
  const hist = JSON.parse(localStorage.getItem('az900-sim-history-v1') || '[]');
  return JSON.stringify({ right, wrongish, locked, score: document.getElementById('sim-score').textContent,
    resultsShown: !r.hidden, big: r.querySelector('.res-big')?.textContent, pct: r.querySelector('.res-pct')?.textContent,
    verdict: r.querySelector('.res-verdict')?.textContent, domRows: r.querySelectorAll('.res-row:not(.head)').length,
    studyItems: r.querySelectorAll('.res-study li').length, jumps: r.querySelectorAll('.res-jump').length,
    timer: document.getElementById('sim-timer').textContent, timerBtn: document.getElementById('sim-timer-toggle').textContent,
    hist: hist.length, histEntry: hist[0] });
})()
