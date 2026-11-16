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
    renderClock();
    if (!remaining && !revealed) reveal();
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
  start();
})();
