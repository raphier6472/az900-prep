(() => {
  document.querySelector('[data-view="quiz"], .tab-btn[data-view="quiz"], [data-view-btn="quiz"]')?.click();
  const ids = JSON.parse(localStorage.getItem('az900-bank-simulacro-v1'));
  const blocks = Array.from(document.querySelectorAll('#sim-list .quiz-q'));
  // answer: correct for everything except objective 2.3 (storage) and 3.1 (cost) -> pick a wrong option; leave 2 unanswered
  const bank = {}; 
  let skipped = 0, wrongObj = 0, right = 0;
  blocks.forEach((b, i) => {
    const id = ids[i];
    const opts = b.querySelectorAll('.q-opt');
    // find item via window scope? quizBank is const in script scope; infer by text from data
    const txt = b.querySelector('.q-text').textContent;
    const isStorage = /storage|redundan|LRS|GRS|Blob|Azure Files|Data Box|archive|SAS|disk/i.test(txt);
    const isCost = /cost|pricing|budget|Reserved|support plan|Basic support/i.test(txt);
    if (skipped < 2 && i >= blocks.length - 2) { skipped++; return; }
    if (isStorage || isCost) { wrongObj++; /* click an option that is NOT highlighted correct: try all until incorrect */
      opts[0].click();
      if (opts[0].classList.contains('correct')) { /* nothing else to do; it locks */ }
    } else {
      // brute-force: click options until the block shows a correct pick -- can't: locks after first. Use retry loop.
      for (let k = 0; k < 4; k++) {
        const o = b.querySelectorAll('.q-opt')[k];
        o.click();
        if (o.classList.contains('correct') && !o.classList.contains('incorrect') && b.querySelector('.q-opt.incorrect') === null) { right++; break; }
        b.querySelector('.q-retry').click();
        b = document.querySelectorAll('#sim-list .quiz-q')[i];
      }
    }
  });
  return JSON.stringify({ n: blocks.length, right, wrongObj, skipped, score: document.getElementById('sim-score').textContent, resultsHidden: document.getElementById('sim-results').hidden });
})()
