// Atenia: logo intro → Pong contra la IA.
// El cuerpo del robot se convierte en tu pala, la base teal en la pala de la IA y un ojo en la pelota.
(() => {
  const NAVY = '#13294B', TEAL = '#12A39A', GREEN = '#22C55E', BG = '#F7F9FB', GREY = '#5C6B7A';
  const INTRO_MS = 5600;      // la animación del logo termina hacia los 5.7 s
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
  // Icono del robot tal y como está en el logo (coordenadas de la placa de 140×140 del SVG original)
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
  function drawTile(alpha, glow) {
    ctx.save(); ctx.globalAlpha = alpha;
    if (glow > 0) { ctx.shadowColor = GREEN; ctx.shadowBlur = 22 * glow; }
    ctx.beginPath(); ctx.roundRect(0, 0, 140, 140, 32); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = '#D5DCE3'; ctx.stroke();
    ctx.restore();
  }
  function drawBall(x, y, r, spin = 0, glow = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(spin); ctx.scale(r * 2 / 140, r * 2 / 140); ctx.translate(-70, -70);
    drawTile(1, glow);
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
    const svg = $('logo'), unit = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    // origen: cada pieza del robot del logo, en coordenadas de pantalla
    const src = { head: $('head').querySelector('rect'), eyeL: $('eyeL'), eyeR: $('eyeR'), body: $('body'), cv: $('cv'), ch: $('ch'), base: $('base') };
    const from = {};
    for (const k of PIECES) { from[k] = box(src[k]); from[k].r = ROBOT[k].r * from[k].w / ROBOT[k].w; }
    canvas.classList.add('on');
    ['head', 'body', 'cross', 'base', 'shine'].forEach((id) => $(id).style.visibility = 'hidden');
    // destino: las mismas piezas encajadas dentro de la pelota
    const k2 = ball.r * 2 / 140, bx = ball.x - ball.r, by = ball.y - ball.r;
    const to = {};
    for (const k of PIECES) { const p = ROBOT[k]; to[k] = { x: bx + p.x * k2, y: by + p.y * k2, w: p.w * k2, h: p.h * k2, r: p.r * k2 }; }
    // "Aten" se funde en tu pala y la "a" en la de la IA
    const toward = (id, tx, ty, delay) => {
      const el = $(id), r = el.getBoundingClientRect();
      const dx = (tx - (r.left + r.width / 2)) / unit, dy = (ty - (r.top + r.height / 2)) / unit;
      el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.15)`, opacity: 0 }],
        { duration: 800, delay, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' });
    };
    const pc = { x: P.x + P.w / 2, y: P.y + P.h / 2 }, ac = { x: AI.x + AI.w / 2, y: AI.y + AI.h / 2 };
    ['LA', 'Lt', 'Le', 'Ln'].forEach((id, i) => toward(id, pc.x, pc.y, i * 60));
    toward('La', ac.x, ac.y, 120);
    $('tagline').animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(40px)', opacity: 0 }], { duration: 500, fill: 'forwards' });

    const t0 = performance.now(), DUR = 1200, DELAY = 150;
    function morph(now) {
      const raw = Math.min(1, Math.max(0, (now - t0 - DELAY) / DUR));
      ctx.clearRect(0, 0, W, H);
      drawField(Math.max(0, (raw - .5) * 2));
      // palas: crecen desde su centro mientras llegan las letras
      const g = ease(Math.min(1, Math.max(0, (raw - .35) / .65)));
      if (g > 0) {
        ctx.globalAlpha = g;
        drawPlayer(P.x, pc.y - P.h * g / 2, P.w, P.h * g, g);
        rr(AI.x, ac.y - AI.h * g / 2, AI.w, AI.h * g, AI.w / 2, TEAL);
        ctx.globalAlpha = 1;
      }
      // la placa blanca de la pelota aparece al final, detrás de las piezas
      const tileA = Math.max(0, (raw - .65) / .35);
      if (tileA > 0) { ctx.save(); ctx.translate(bx, by); ctx.scale(k2, k2); drawTile(tileA, tileA); ctx.restore(); }
      PIECES.forEach((k, i) => {
        const t = ease(Math.min(1, Math.max(0, (raw - i * 0.03) / (1 - 6 * 0.03))));
        const f = from[k], d = to[k], p = ROBOT[k];
        rr(lerp(f.x, d.x, t), lerp(f.y, d.y, t), lerp(f.w, d.w, t), lerp(f.h, d.h, t), lerp(f.r, d.r, t), p.c);
      });
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
    const visible = running;
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
