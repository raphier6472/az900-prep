(() => {
  const blocks = Array.from(document.querySelectorAll('#sim-list .quiz-q'));
  let clicked = 0;
  blocks.forEach((b) => {
    const opts = b.querySelectorAll('.q-opt');
    if (opts.length) { opts[0].click(); clicked++; }
  });
  const scoreText = document.getElementById('sim-score').textContent;
  let correctCount = 0, incorrectCount = 0, explainShown = 0, retryShown = 0;
  blocks.forEach((b) => {
    if (b.querySelector('.q-opt.correct')) correctCount++;
    if (b.querySelector('.q-opt.incorrect')) incorrectCount++;
    const ex = b.querySelector('.q-explain');
    if (ex && !ex.hidden) explainShown++;
    const rt = b.querySelector('.q-retry');
    if (rt && !rt.hidden) retryShown++;
  });
  return JSON.stringify({ totalBlocks: blocks.length, clicked, scoreText, correctCount, incorrectCount, explainShown, retryShown });
})()
