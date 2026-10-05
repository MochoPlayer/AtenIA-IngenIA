// Atenia: logo intro → Pong contra la IA.
// El cuerpo del robot se convierte en tu pala, la base teal en la pala de la IA y un ojo en la pelota.
(() => {
  const NAVY = '#13294B', TEAL = '#12A39A', GREEN = '#FF7A1A', BG = '#F7F9FB', GREY = '#5C6B7A';
  const INTRO_MS = 4300;      // la animación del logo termina hacia los 4.4 s
  const WIN_SCORE = 5;

  const $ = (id) => document.getElementById(id);
  const intro = $('intro'), playBtn = $('play'), canvas = $('game'), ctx = canvas.getContext('2d');
  const endBox = $('end'), endTitle = $('endTitle'), hint = $('hint');
  const hud = $('hud'), startBox = $('start'), nameIn = $('name');
  let playerName = '';
  try { playerName = localStorage.getItem('ateniaName') || ''; } catch (e) {}
  nameIn.value = playerName;
  ['mePips', 'aiPips'].forEach((id) => { $(id).innerHTML = '<i></i>'.repeat(WIN_SCORE); });

  setTimeout(() => playBtn.classList.add('show'), INTRO_MS);

  // ---------- geometría del campo ----------
  let W, H, field, P, AI, ball, dpr;
  function layout() {
    dpr = window.devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fw = Math.min(W - 32, 1000);
    const fh = Math.min(H - 140, fw * (H > W ? 1.25 : 0.62)); // en vertical (móvil) el campo es más alto
    const old = field;
    field = { x: (W - fw) / 2, y: (H - fh) / 2 + 20, w: fw, h: fh };
    const pw = Math.max(12, fw * 0.016), ph = fh * 0.2;
    const sizes = { w: pw, h: ph };
    if (P && old) { // conservar posiciones relativas al redimensionar
      const ry = (v) => field.y + (v - old.y) / old.h * field.h;
      P.y = ry(P.y); AI.y = ry(AI.y);
      ball.x = field.x + (ball.x - old.x) / old.w * field.w; ball.y = ry(ball.y);
    }
    placeHud();
    P = Object.assign(P || { y: field.y + fh / 2 - ph / 2 }, sizes, { x: field.x + 22 });
    AI = Object.assign(AI || { y: field.y + fh / 2 - ph / 2 }, sizes, { x: field.x + fw - 22 - pw });
    ball = ball || { x: field.x + fw / 2, y: field.y + fh / 2, vx: 0, vy: 0, spin: 0 };
    ball.r = Math.max(16, fw * 0.028);
  }

  // ---------- marcador ----------
  function placeHud() {
    hud.style.left = field.x + 'px'; hud.style.width = field.w + 'px';
    hud.style.bottom = (H - field.y + 12) + 'px';
  }
  function renderHud(scored) {
    const name = playerName || 'Tú';
    $('meName').textContent = name; $('meInitial').textContent = name[0].toUpperCase();
    $('meScore').textContent = score.p; $('aiScore').textContent = score.ai;
    [['mePips', score.p, 'p'], ['aiPips', score.ai, 'ai']].forEach(([id, n, who]) => {
      [...$(id).children].forEach((el, i) => {
        el.classList.toggle('on', i < n);
        if (scored === who && i === n - 1) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 300); }
      });
    });
  }

  // ---------- dibujo ----------
  function rr(x, y, w, h, r, fill) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); ctx.fillStyle = fill; ctx.fill();
  }
  function drawPlayer(x, y, w, h, crossAlpha = 1) {
    rr(x, y, w, h, w * 0.28, NAVY);
    if (crossAlpha <= 0) return;
    ctx.globalAlpha = crossAlpha;
    const cx = x + w / 2, cy = y + Math.min(h * 0.3, w * 1.6), a = w * 0.62, t = w * 0.2;
    rr(cx - t / 2, cy - a / 2, t, a, t * 0.3, BG);
    rr(cx - a / 2, cy - t / 2, a, t, t * 0.3, BG);
    ctx.globalAlpha = 1;
  }
  // el ojo del logo, que en la transición salta hasta el centro del campo
  function drawEye(x, y, r, glow = 1) {
    ctx.save(); ctx.shadowColor = GREEN; ctx.shadowBlur = 18 * glow;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = GREEN; ctx.fill(); ctx.restore();
  }
  // la pelota es el icono del robot tal y como está en el logo (coordenadas de la placa de 140×140 del SVG original)
  const ROBOT = {
    head: { x: 48.5, y: 18, w: 43, h: 22.6, r: 11.3, c: NAVY },
    eyeL: { x: 57.5, y: 25.3, w: 8, h: 8, r: 4, c: GREEN },
    eyeR: { x: 74.5, y: 25.3, w: 8, h: 8, r: 4, c: GREEN },
    body: { x: 57.6, y: 46.3, w: 24.9, h: 61, r: 5.7, c: NAVY },
    cv: { x: 67.2, y: 55.3, w: 5.7, h: 15.8, r: 1.4, c: '#FFFFFF' },
    ch: { x: 62.1, y: 60.4, w: 15.8, h: 5.7, r: 1.4, c: '#FFFFFF' },
    base: { x: 38.3, y: 113, w: 63.3, h: 9, r: 4.5, c: TEAL },
  };
  const PIECES = ['base', 'body', 'cv', 'ch', 'head', 'eyeL', 'eyeR'];   // orden de pintado
  function drawBall(x, y, r, spin = 0, glow = 0, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.rotate(spin); ctx.scale(r * 2 / 140, r * 2 / 140); ctx.translate(-70, -70);
    ctx.save();
    if (glow > 0) { ctx.shadowColor = GREEN; ctx.shadowBlur = 22 * glow; }
    ctx.beginPath(); ctx.roundRect(0, 0, 140, 140, 32); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = '#D5DCE3'; ctx.stroke();
    ctx.restore();
    for (const k of PIECES) { const p = ROBOT[k]; rr(p.x, p.y, p.w, p.h, p.r, p.c); }
    ctx.restore();
  }
  function drawField(alpha) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#D5DCE3'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(field.x, field.y, field.w, field.h, 18); ctx.stroke();
    ctx.setLineDash([10, 12]);
    ctx.beginPath(); ctx.moveTo(field.x + field.w / 2, field.y + 14); ctx.lineTo(field.x + field.w / 2, field.y + field.h - 14); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // ---------- transformación logo → Pong ----------
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const score = { p: 0, ai: 0 };

  playBtn.addEventListener('click', () => {
    playBtn.classList.remove('show'); playBtn.disabled = true;
    layout();
    const from = { body: box($('body')), base: box($('base')), eye: box($('eyeR')) };
    canvas.classList.add('on');
    // las piezas que viajan pasan al canvas; el resto del logo sale volando
    ['body', 'cross', 'base', 'eyeR'].forEach((id) => $(id).style.visibility = 'hidden');
    const fly = { LA: [-420, -120, -40], Lt: [-260, -260, 30], Le: [-120, 260, -25], Ln: [40, -300, 35], La: [380, 140, 40], tagline: [0, 220, 0], head: [0, -260, -30], eyeL: [-200, -200, 0] };
    for (const [id, [dx, dy, rot]] of Object.entries(fly)) {
      const el = $(id); if (!el) continue;
      el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.6)`, opacity: 0 }],
        { duration: 650, easing: 'cubic-bezier(.55,0,.75,.4)', fill: 'forwards' });
    }
    const to = {
      body: { x: P.x, y: P.y, w: P.w, h: P.h },
      base: { x: AI.x, y: AI.y, w: AI.w, h: AI.h },
      eye: { x: ball.x - ball.r, y: ball.y - ball.r, w: ball.r * 2, h: ball.r * 2 },
    };
    const t0 = performance.now(), DUR = 1100, DELAY = 250;
    function morph(now) {
      const raw = Math.min(1, Math.max(0, (now - t0 - DELAY) / DUR)), t = ease(raw);
      const at = (k) => ({ x: lerp(from[k].x, to[k].x, t), y: lerp(from[k].y, to[k].y, t), w: lerp(from[k].w, to[k].w, t), h: lerp(from[k].h, to[k].h, t) });
      ctx.clearRect(0, 0, W, H);
      drawField(Math.max(0, (raw - .5) * 2));
      const b = at('body'), s = at('base'), e = at('eye');
      drawPlayer(b.x, b.y, b.w, b.h, 1);
      rr(s.x, s.y, s.w, s.h, Math.min(s.w, s.h) / 2, TEAL);
      // el ojo da un saltito antes de convertirse en pelota
      // ...y al aterrizar se convierte en el logo
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2 - Math.sin(t * Math.PI) * 60, logoA = Math.max(0, (raw - .7) / .3);
      if (logoA < 1) drawEye(ex, ey, e.w / 2 * (1 - logoA * .3), t);
      if (logoA > 0) drawBall(ex, ey, e.w / 2, (1 - logoA) * Math.PI, logoA, logoA);
      if (raw < 1) return requestAnimationFrame(morph);
      intro.classList.add('gone');
      draw();
      startBox.classList.add('show');
      setTimeout(() => nameIn.focus(), 300);
    }
    requestAnimationFrame(morph);
  });

  // ---------- juego ----------
  let running = false, last = 0, serveAt = 0, aiErr = 0, flash = 0, keys = {}, pointerY = null;
  function serve(dir) {
    ball.x = field.x + field.w / 2; ball.y = field.y + field.h / 2;
    const ang = (Math.random() * 0.6 - 0.3);
    const sp = field.w * 0.55;
    ball.vx = Math.cos(ang) * sp * dir; ball.vy = Math.sin(ang) * sp; ball.spin = 0;
    serveAt = performance.now() + 800;
  }
  startBox.addEventListener('submit', (e) => {
    e.preventDefault();
    playerName = nameIn.value.trim().slice(0, 14);
    try { localStorage.setItem('ateniaName', playerName); } catch (err) {}
    startBox.classList.remove('show'); nameIn.blur();
    startGame();
  });
  function startGame() {
    score.p = score.ai = 0;
    renderHud(); hud.classList.add('show');
    endBox.classList.remove('show');
    hint.classList.add('show'); setTimeout(() => hint.classList.remove('show'), 4500);
    serve(Math.random() < .5 ? -1 : 1);
    running = true; last = performance.now();
    requestAnimationFrame(loop);
  }
  function hitPaddle(p, dir) {
    const rel = ((ball.y - (p.y + p.h / 2)) / (p.h / 2));
    const ang = Math.max(-1, Math.min(1, rel)) * 0.95;          // hasta ~55°
    const sp = Math.min(Math.hypot(ball.vx, ball.vy) * 1.06, field.w * 1.4);
    ball.vx = Math.cos(ang) * sp * dir; ball.vy = Math.sin(ang) * sp;
    ball.x = dir > 0 ? p.x + p.w + ball.r : p.x - ball.r;
    aiErr = (Math.random() - .5) * p.h * 0.9;                     // la IA no es perfecta
    flash = 1.4;
  }
  function point(who) {
    score[who]++;
    renderHud(who);
    if (score.p >= WIN_SCORE || score.ai >= WIN_SCORE) {
      running = false;
      endTitle.textContent = score.p > score.ai ? `¡Has ganado${playerName ? ', ' + playerName : ''}!` : 'Gana la IA';
      $('endScore').textContent = `${score.p} – ${score.ai}`;
      endBox.classList.add('show');
      draw();
      return;
    }
    serve(who === 'p' ? 1 : -1);
  }
  const clampP = (p) => { p.y = Math.max(field.y + 6, Math.min(field.y + field.h - p.h - 6, p.y)); };

  function step(dt, now) {
    // jugador: puntero/tacto o teclado
    if (pointerY !== null) P.y += (pointerY - P.h / 2 - P.y) * Math.min(1, dt * 18);
    const kv = (keys.ArrowUp || keys.w || keys.W ? -1 : 0) + (keys.ArrowDown || keys.s || keys.S ? 1 : 0);
    if (kv) { P.y += kv * field.h * 1.4 * dt; pointerY = null; }
    clampP(P);
    // IA: sigue la pelota con velocidad limitada y algo de error
    const target = ball.vx > 0 ? ball.y + aiErr : field.y + field.h / 2;
    const maxV = field.h * 1.05 * dt;
    AI.y += Math.max(-maxV, Math.min(maxV, target - (AI.y + AI.h / 2)));
    clampP(AI);
    if (now < serveAt) return;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    ball.spin += Math.sign(ball.vx) * dt * 4;
    if (ball.y - ball.r < field.y) { ball.y = field.y + ball.r; ball.vy = Math.abs(ball.vy); }
    if (ball.y + ball.r > field.y + field.h) { ball.y = field.y + field.h - ball.r; ball.vy = -Math.abs(ball.vy); }
    if (ball.vx < 0 && ball.x - ball.r <= P.x + P.w && ball.x > P.x && ball.y > P.y - ball.r && ball.y < P.y + P.h + ball.r) hitPaddle(P, 1);
    if (ball.vx > 0 && ball.x + ball.r >= AI.x && ball.x < AI.x + AI.w && ball.y > AI.y - ball.r && ball.y < AI.y + AI.h + ball.r) hitPaddle(AI, -1);
    if (ball.x < field.x - ball.r * 2) point('ai');
    else if (ball.x > field.x + field.w + ball.r * 2) point('p');
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawField(1);
    drawPlayer(P.x, P.y, P.w, P.h);
    rr(AI.x, AI.y, AI.w, AI.h, AI.w / 2, TEAL);
    const visible = running && performance.now() >= serveAt - 400;
    if (visible) drawBall(ball.x, ball.y, ball.r, ball.spin, flash);
    flash = Math.max(0, flash - 0.08);
  }
  function loop() {
    if (!running) return;
    const now = performance.now();
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    step(dt, now);
    if (running) draw();
    requestAnimationFrame(loop);
  }

  // ---------- controles ----------
  const setPointer = (e) => { pointerY = (e.touches ? e.touches[0].clientY : e.clientY); };
  addEventListener('mousemove', setPointer);
  addEventListener('touchstart', setPointer, { passive: true });
  addEventListener('touchmove', (e) => { setPointer(e); if (running) e.preventDefault(); }, { passive: false });
  addEventListener('keydown', (e) => { if (e.target === nameIn) return; keys[e.key] = true; if (e.key.startsWith('Arrow') && running) e.preventDefault(); });
  addEventListener('keyup', (e) => { keys[e.key] = false; });
  addEventListener('resize', () => { if (field) { layout(); if (!running) draw(); } });
  $('again').addEventListener('click', startGame);
  $('home').addEventListener('click', () => location.reload());

  // gancho para pruebas automáticas
  window.__atenia = { state: () => ({ running, score: { ...score }, ball: { ...ball }, P: { ...P }, AI: { ...AI }, field }) };
})();
