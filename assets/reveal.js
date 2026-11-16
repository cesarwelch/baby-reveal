(() => {
  const config = window.REVEAL_CONFIG || {};
  const elements = {
    body: document.body,
    panel: document.querySelector('.reveal-panel'),
    days: document.querySelector('#days'), hours: document.querySelector('#hours'),
    minutes: document.querySelector('#minutes'), seconds: document.querySelector('#seconds'),
    secondHand: document.querySelector('.hand-second'), minuteHand: document.querySelector('.hand-minute'), hourHand: document.querySelector('.hand-hour'),
    restart: document.querySelector('#restart'), canvas: document.querySelector('#celebration-canvas')
  };
  const voteConfig = window.VOTE_CONFIG;
  const voteElements = voteConfig ? {
    section: document.querySelector('#vote-section'), buttons: document.querySelectorAll('[data-vote]'),
    status: document.querySelector('#vote-status'), results: document.querySelector('#vote-results'),
    boyCount: document.querySelector('#boy-count'), girlCount: document.querySelector('#girl-count'),
    boyIcons: document.querySelector('#boy-icons'), girlIcons: document.querySelector('#girl-icons')
  } : null;
  if (!elements.panel) return;
  const pad = value => String(Math.max(0, value)).padStart(2, '0');
  let targetTime;
  let timer;
  let revealed = false;

  function getTargetTime() {
    if (config.mode === 'demo') return Date.now() + (config.demoDurationMs || 10000);
    // La página real usará un instante ISO convertido previamente desde America/Tegucigalpa.
    return new Date(config.targetTime).getTime();
  }

  function renderClock() {
    const now = new Date();
    const second = now.getSeconds() + now.getMilliseconds() / 1000;
    const minute = now.getMinutes() + second / 60;
    const hour = (now.getHours() % 12) + minute / 60;
    elements.secondHand.style.transform = `rotate(${second * 6}deg)`;
    elements.minuteHand.style.transform = `rotate(${minute * 6}deg)`;
    elements.hourHand.style.transform = `rotate(${hour * 30}deg)`;
  }

  function tick() {
    const remaining = Math.max(0, targetTime - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    elements.days.textContent = pad(days); elements.hours.textContent = pad(hours);
    elements.minutes.textContent = pad(minutes); elements.seconds.textContent = pad(seconds);
    elements.body.classList.toggle('final-seconds', totalSeconds <= 10 && totalSeconds > 0);
    if (voteElements?.section && !remaining) {
      voteElements.section.classList.add('voting-closed');
      voteElements.status.textContent = 'Los votos están cerrados. La sorpresa está por llegar.';
      voteElements.buttons.forEach(button => { button.disabled = true; });
    }
    renderClock();
    if (!remaining && !revealed) reveal();
  }

  function renderVotes(data) {
    if (!voteElements || !data) return;
    voteElements.boyCount.textContent = data.boy || 0;
    voteElements.girlCount.textContent = data.girl || 0;
    renderVoteIcons(voteElements.boyIcons, data.boy || 0, 'tie');
    renderVoteIcons(voteElements.girlIcons, data.girl || 0, 'dress');
    voteElements.results.hidden = false;
    const storedVote = localStorage.getItem('baby-reveal-vote');
    if (storedVote) {
      voteElements.status.textContent = `Tu voto por ${storedVote === 'boy' ? 'Logan José' : 'Mariana Marvelí'} quedó guardado. ¡Gracias!`;
      voteElements.buttons.forEach(button => { button.disabled = true; button.classList.toggle('is-selected', button.dataset.vote === storedVote); });
    } else {
      voteElements.status.textContent = 'Los resultados se actualizan en vivo.';
    }
  }

  function renderVoteIcons(container, count, type) {
    if (!container) return;
    const tones = type === 'tie' ? ['#72b6f2', '#4f91df', '#8bcaf8', '#377ac7', '#a1d8fb'] : ['#efa1be', '#dd719c', '#f5b6cc', '#c95587', '#f8c7d8'];
    const visibleCount = Math.min(count, 24);
    container.replaceChildren();
    for (let index = 0; index < visibleCount; index++) {
      const icon = document.createElement('span');
      icon.className = `vote-icon ${type}`;
      icon.style.setProperty('--vote-color', tones[Math.floor(Math.random() * tones.length)]);
      icon.setAttribute('title', type === 'tie' ? 'Voto Baby Boy' : 'Voto Baby Girl');
      container.append(icon);
    }
    if (count > visibleCount) {
      const more = document.createElement('span');
      more.className = 'more-votes';
      more.textContent = `+${count - visibleCount}`;
      container.append(more);
    }
  }

  function requestVotes(vote) {
    if (!voteConfig || !voteElements) return;
    const callback = `revealVotes${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement('script');
    window[callback] = data => {
      renderVotes(data);
      delete window[callback];
      script.remove();
    };
    const params = new URLSearchParams({ callback });
    if (vote) params.set('vote', vote);
    script.src = `${voteConfig.endpoint}?${params}`;
    script.onerror = () => {
      voteElements.status.textContent = 'No pudimos cargar los votos. Intenta de nuevo.';
      delete window[callback];
      script.remove();
    };
    document.body.append(script);
  }

  function setupVoting() {
    if (!voteElements) return;
    voteElements.buttons.forEach(button => button.addEventListener('click', () => {
      if (localStorage.getItem('baby-reveal-vote')) return;
      const vote = button.dataset.vote;
      localStorage.setItem('baby-reveal-vote', vote);
      voteElements.status.textContent = 'Guardando tu voto…';
      voteElements.buttons.forEach(item => { item.disabled = true; });
      requestVotes(vote);
    }));
    requestVotes();
  }

  function reveal() {
    revealed = true;
    clearInterval(timer);
    elements.body.classList.add('revealed', config.result === 'boy' ? 'is-boy' : 'is-girl');
    elements.panel.setAttribute('aria-hidden', 'false');
    launchCelebration();
  }

  function start() {
    revealed = false;
    elements.body.classList.remove('revealed', 'is-boy', 'is-girl', 'final-seconds');
    targetTime = getTargetTime();
    clearInterval(timer); tick(); timer = setInterval(tick, 100);
  }

  function launchCelebration() {
    const canvas = elements.canvas, ctx = canvas.getContext('2d');
    const colors = config.result === 'boy' ? ['#75b9ff','#234a9f','#fff','#f7d36c'] : ['#f7a9c5','#d95991','#fff','#f7d36c'];
    canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const pieces = Array.from({ length: 170 }, () => ({ x: Math.random() * innerWidth, y: -30 - Math.random() * innerHeight, r: 3 + Math.random() * 5, c: colors[Math.floor(Math.random() * colors.length)], v: 2 + Math.random() * 5, w: (Math.random() - .5) * 2 }));
    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      pieces.forEach(p => { p.y += p.v; p.x += p.w; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(frame * .03); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      frame++; if (frame < 210) requestAnimationFrame(draw); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    draw();
  }

  elements.restart?.addEventListener('click', start);
  window.addEventListener('resize', () => { if (revealed) launchCelebration(); });
  setupVoting();
  start();
})();
