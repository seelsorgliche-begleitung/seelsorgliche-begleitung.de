/* Seelsorgliche Begleitung — Verhalten. Alles additiv: ohne JS bleibt die Seite lesbar.
   Kein Cookie, kein Browserspeicher: ob das Intro läuft, entscheidet der Referrer (von außen = Intro, von innen = Ankunft). */
const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none)').matches;
const raf = window.requestAnimationFrame || (f => setTimeout(f, 16));
const ease = 'cubic-bezier(.2,.7,.3,1)';

/* ---------- Videos: Quelle erst im Sichtfeld, Poster zuerst */
const vio = new IntersectionObserver(es => {
  es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { laden(v); if (!ruhig && !v.closest('.lp-karte') && !v.closest('.angebot')) v.play().catch(() => {}); }
    else if (!v.paused) v.pause();
  });
}, { rootMargin: '320px 0px' });
function laden(v) { if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster; if (v.dataset.src && !v.getAttribute('src')) { v.src = v.dataset.src; v.load(); } }
/* Hero-Video erst nach dem Laden der Seite — das Poster (LCP) hat Vorrang vor dem Stream */
const heroVideoLaden = () => document.querySelectorAll('video[data-sofort]').forEach(v => { laden(v); if (!ruhig) v.play().catch(() => {}); });
if (document.readyState === 'complete') heroVideoLaden(); else addEventListener('load', heroVideoLaden);
document.querySelectorAll('video[data-src]').forEach(v => { if (!v.hasAttribute('data-sofort')) vio.observe(v); });
if (ruhig) document.querySelectorAll('video').forEach(v => v.pause());

/* ---------- Intro: einmal, wenn man von außen kommt */
const intro = document.querySelector('.intro');
if (intro) {
  if (document.documentElement.classList.contains('ankunft') || ruhig) intro.remove();
  else {
    document.body.style.overflow = 'hidden';
    setTimeout(() => { intro.classList.add('weg'); document.body.style.overflow = ''; }, 1700);
    setTimeout(() => intro.remove(), 2300);
  }
}

/* ---------- Seitenwechsel: weiche Blende */
const blende = document.querySelector('.blende');
if (blende && !ruhig) {
  addEventListener('pageshow', e => { if (e.persisted) blende.classList.remove('los'); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const h = a.getAttribute('href');
    if (!h || h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:') || /^https?:/.test(h)) return;
    const ziel = new URL(a.href, location.href);
    if (ziel.pathname === location.pathname) return;
    e.preventDefault();
    blende.classList.add('los');
    setTimeout(() => { location.href = a.href; }, 360);
  });
}

/* ---------- Kopf */
const kopf = document.querySelector('header');
let letzterY = scrollY, ticking = false;
function beiScroll() {
  ticking = false;
  const y = scrollY;
  if (kopf) {
    kopf.classList.toggle('fest', y > 40);
    if (!document.body.classList.contains('menu-offen')) kopf.classList.toggle('oben-weg', y > 200 && y > letzterY + 4);
  }
  letzterY = y;
  scrub();
}
addEventListener('scroll', () => { if (!ticking) { raf(beiScroll); ticking = true; } }, { passive: true });

/* ---------- Der Weg: Haarlinie links, Füllung = Scrollfortschritt, zwei Punkte gehen mit, ein Haltepunkt je Abschnitt */
const weg = document.querySelector('.wegbahn');
const wegSvg = weg && weg.querySelector('.wegbahn-svg');
const bahn = weg && weg.querySelector('.bahn'), fluss = weg && weg.querySelector('.fluss');
const geher = weg ? [weg.querySelector('.g1'), weg.querySelector('.g2')] : [];
let wegL = 0, punkte = [];
function wegPfad() {
  const h = innerHeight, x0 = 24, a = 7, n = 24, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x0 + a * Math.sin(t * Math.PI * 2.4), t * h]); }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i], cx = ((p0[0] + p1[0]) / 2).toFixed(1);
    d += ` C${cx} ${p0[1].toFixed(1)} ${cx} ${p1[1].toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
  }
  return d;
}
function wegBauen() {
  if (!weg) return;
  const d = wegPfad();
  bahn.setAttribute('d', d); fluss.setAttribute('d', d);
  wegL = fluss.getTotalLength();
  fluss.style.strokeDasharray = wegL; fluss.style.strokeDashoffset = wegL;
  weg.querySelectorAll('.punkt').forEach(p => p.remove());
  punkte = [...document.querySelectorAll('[data-punkt]')].map(sec => {
    const el = document.createElement('a');
    el.className = 'punkt'; el.href = '#' + (sec.id || '');
    el.innerHTML = '<i>' + sec.dataset.punkt + '</i>';
    el.addEventListener('click', ev => { ev.preventDefault(); sec.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' }); });
    weg.appendChild(el);
    return { sec, el };
  });
  wegMessen();
}
function wegMessen() {
  if (!weg) return;
  const doc = document.documentElement.scrollHeight - innerHeight;
  punkte.forEach(p => {
    const top = p.sec.getBoundingClientRect().top + scrollY;
    p.top = top;
    const f = doc > 0 ? Math.min(.98, Math.max(.02, (top - innerHeight * 0.45) / doc)) : 0;
    const pt = fluss.getPointAtLength(f * wegL);
    p.el.style.transform = `translate(${pt.x - 22}px,${pt.y - 22}px)`;
  });
}
function wegLauf() {
  if (!weg) return;
  const doc = document.documentElement.scrollHeight - innerHeight;
  const p = doc > 0 ? Math.min(1, Math.max(0, scrollY / doc)) : 0;
  fluss.style.strokeDashoffset = wegL * (1 - p);
  const a = fluss.getPointAtLength(p * wegL), b = fluss.getPointAtLength(Math.max(0, p * wegL - 26));
  geher[0].style.transform = `translate(${a.x}px,${a.y}px) translate(-50%,-50%)`;
  geher[1].style.transform = `translate(${b.x}px,${b.y}px) translate(-50%,-50%)`;
  const linie = scrollY + innerHeight * 0.45;
  punkte.forEach(q => {
    const an = linie >= q.top;
    if (an && !q.el.classList.contains('an')) { q.el.classList.add('an', 'frisch'); clearTimeout(q.t); q.t = setTimeout(() => q.el.classList.remove('frisch'), 1800); }
    if (!an) q.el.classList.remove('an', 'frisch');
  });
  document.body.classList.toggle('dunkel-oben', scrollY < innerHeight * 0.6);
}

/* ---------- Scroll-Scrubs: Zeichen im Hero, Hero-Parallaxe, Statement, Zeitleiste */
const heroZeichen = document.querySelector('.hero-zeichen');
const heroInhalt = document.querySelector('.hero .hero-inhalt');
const statement = document.querySelector('.statement');
const statementH2 = statement && statement.querySelector('h2');
let statementWorte = [];
const zeitleisten = [...document.querySelectorAll('[data-fuellung]')];
function scrub() {
  const y = scrollY, h = innerHeight;
  if (heroZeichen) heroZeichen.style.setProperty('--p', (0.35 + 0.65 * Math.min(1, y / (h * 0.7))).toFixed(3));
  if (heroInhalt && y < h * 1.2 && !ruhig) { heroInhalt.style.transform = `translateY(${(y * 0.14).toFixed(1)}px)`; heroInhalt.style.opacity = Math.max(0, 1 - y / (h * 0.85)).toFixed(3); }
  if (statementH2 && statementWorte.length) {
    // Gemessen am Textelement, nie an der Sektion: Start bei 78 % der Fensterhöhe, voll bei 32 % — beide Richtungen (Skill scroll-text)
    const r = statementH2.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (h * 0.78 - r.top) / (h * 0.46)));
    statement.style.setProperty('--p', p.toFixed(3));
    statementWorte.forEach((w, i) => w.classList.toggle('an', (i + 1) / statementWorte.length <= p + 0.02));
  }
  zeitleisten.forEach(z => {
    const r = z.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (h * 0.82 - r.top) / Math.max(1, r.height * 0.9)));
    z.style.setProperty('--p', p.toFixed(3));
    const eintraege = [...z.querySelectorAll('.zl')];
    eintraege.forEach((e, i) => e.classList.toggle('an', (i + 0.5) / eintraege.length <= p));
  });
  wegLauf();
}

/* ---------- Wörter aufteilen (nur Textknoten, damit <span>/<br> überleben) */
function worteTeilen(knoten) {
  [...knoten.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      if (!n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/([ \t\r\n]+)/).forEach(t => {   // nur echte Leerzeichen — ein geschütztes Leerzeichen hält zwei Wörter zusammen
        if (!t) return;
        if (/^[ \t\r\n]+$/.test(t)) frag.appendChild(document.createTextNode(t));
        else { const i = document.createElement('i'); i.textContent = t; frag.appendChild(i); }
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'I' && n.tagName !== 'SVG') worteTeilen(n);
  });
}
document.querySelectorAll('.worte, .statement h2').forEach(el => {
  if (el.querySelector('i')) return;
  worteTeilen(el);
  el.querySelectorAll('i').forEach((w, i) => { w.style.setProperty('--i', i); if (el.matches('.statement h2')) w.classList.add('w'); });
});
if (statementH2) statementWorte = [...statementH2.querySelectorAll('i')];

/* ---------- Reveal (lädt vor: threshold 0, 200 px Vorlauf — beim zügigen Scrollen bleibt nichts weiß) */
const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px 200px 0px', threshold: 0 });
document.querySelectorAll('.rev, .oeffnet, .worte').forEach(el => io.observe(el));
const nachholen = () => {
  const h = innerHeight;
  document.querySelectorAll('.rev:not(.da), .oeffnet:not(.da), .worte:not(.da)').forEach(el => {
    const r = el.getBoundingClientRect(); if (r.top < h + 200 && r.bottom > -200) el.classList.add('da');
  });
};
setTimeout(nachholen, 1500); setTimeout(nachholen, 3500);

/* ---------- Karten mit Naturvideo: beim Drübergehen (Maus) oder im Bild (Handy) */
document.querySelectorAll('.lp-karte, .angebot').forEach(k => {
  const v = k.querySelector('video');
  const an = () => { k.classList.add('sb-an'); if (v) { laden(v); if (!ruhig) v.play().catch(() => {}); } };
  const aus = () => { k.classList.remove('sb-an'); if (v) v.pause(); };
  if (touch) {
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { e[0].isIntersecting ? an() : aus(); }, { rootMargin: '-35% 0px -35% 0px' }).observe(k);
  } else {
    k.addEventListener('mouseenter', an); k.addEventListener('mouseleave', aus);
    k.addEventListener('focusin', an); k.addEventListener('focusout', aus);
  }
});

/* ---------- Mobil-Menü */
const menuKnopf = document.querySelector('.menu-knopf'), menuFlaeche = document.querySelector('.menu-flaeche');
if (menuKnopf && menuFlaeche) {
  menuFlaeche.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
  menuKnopf.addEventListener('click', () => {
    const offen = document.body.classList.toggle('menu-offen');
    menuKnopf.setAttribute('aria-expanded', offen); menuKnopf.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü öffnen');
    if (offen) { menuFlaeche.hidden = false; raf(() => document.body.classList.add('menu-offen')); }
    else setTimeout(() => { menuFlaeche.hidden = true; }, 400);
    document.body.style.overflow = offen ? 'hidden' : ''; kopf?.classList.remove('oben-weg'); kopf?.classList.toggle('fest', offen || scrollY > 40);
  });
  menuFlaeche.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-offen'); document.body.style.overflow = ''; menuKnopf.setAttribute('aria-expanded', 'false'); setTimeout(() => { menuFlaeche.hidden = true; }, 400); }));
}

/* ---------- FAQ */
document.querySelectorAll('.faq-frage').forEach(knopf => {
  knopf.addEventListener('click', () => {
    const item = knopf.closest('.faq-item'), offen = item.classList.toggle('offen');
    knopf.setAttribute('aria-expanded', offen);
  });
});

/* ---------- Cursor: zwei goldene Punkte, der zweite folgt mit mehr Abstand */
const cursor = document.querySelector('.cursor');
if (cursor && matchMedia('(hover:hover)').matches && !ruhig) {
  const [c1, c2] = cursor.querySelectorAll('i');
  let zx = -100, zy = -100, ax = -100, ay = -100, bx = -100, by = -100;
  addEventListener('mousemove', e => { zx = e.clientX; zy = e.clientY; cursor.classList.add('an'); }, { passive: true });
  document.addEventListener('mouseleave', () => cursor.classList.remove('an'));
  document.addEventListener('mouseover', e => {
    cursor.classList.toggle('foto', !!e.target.closest('.foto, .lp-karte, .angebot-video, .karte-platz'));
    cursor.classList.toggle('link', !e.target.closest('.foto, .lp-karte') && !!e.target.closest('a, button, label, input, textarea, .faq-frage, .wenn li, .gespraech li'));
  });
  (function folge() { ax += (zx - ax) * 0.22; ay += (zy - ay) * 0.22; bx += (ax - bx) * 0.16; by += (ay - by) * 0.16; c1.style.transform = `translate(${ax}px,${ay}px) translate(-50%,-50%)`; c2.style.transform = `translate(${bx}px,${by}px) translate(-50%,-50%)`; raf(folge); })();
}

/* ---------- Magnetische Knöpfe (nur Maus, klein) */
if (matchMedia('(hover:hover)').matches && !ruhig) {
  document.querySelectorAll('.hero .btn, .cta .btn, .formular .btn, .karte-hinweis .btn').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + 'px'); b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + 'px'); });
    b.addEventListener('mouseleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });
}

/* ---------- Karte erst nach Klick (Zwei-Klick-Lösung, wie bisher) */
document.querySelectorAll('.karte-platz[data-maps]').forEach(platz => {
  const knopf = platz.querySelector('button');
  knopf && knopf.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = platz.dataset.maps; f.title = 'Google Maps: Amedea Praxis, Schmiedgasse 8, 86943 Thaining'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
    platz.querySelector('.karte-hinweis').remove(); platz.appendChild(f);
  });
});

/* ---------- Formular: POST an den Formular-Dienst, Rücksprung ?gesendet=1 / ?fehler=1 */
document.querySelectorAll('form.formular[action]').forEach(form => {
  const meldung = form.querySelector('.form-meldung');
  const zeigen = (art, inhalt) => { const span = document.createElement('span'); span.append(...inhalt); meldung.replaceChildren(span); meldung.dataset.art = art; meldung.hidden = false; };
  const text = t => document.createTextNode(t);
  const link = (href, t) => { const a = document.createElement('a'); a.href = href; a.textContent = t; return a; };
  form.addEventListener('submit', e => {
    const fehlend = [...form.querySelectorAll('[required]')].filter(f => f.type === 'checkbox' ? !f.checked : (!f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim()))));
    form.querySelectorAll('.fehlt').forEach(f => f.classList.remove('fehlt'));
    if (fehlend.length) {
      e.preventDefault();
      fehlend.forEach(f => f.classList.add('fehlt'));
      const namen = fehlend.map(f => f.type === 'checkbox' ? 'Ihre Einwilligung' : (f.labels && f.labels[0] ? f.labels[0].textContent.replace(' *', '') : 'ein Feld'));
      zeigen('fehler', [text(fehlend.length === 1 ? 'Da fehlt noch etwas: ' + namen[0] + '.' : 'Bitte füllen Sie noch aus: ' + namen.join(', ') + '.')]);
      fehlend[0].focus();
      return;
    }
    const knopf = form.querySelector('button[type=submit]');
    if (knopf) { knopf.disabled = true; knopf.style.opacity = '.6'; }
  });
  const q = new URLSearchParams(location.search);
  if (q.has('gesendet') || q.has('fehler')) {
    if (q.has('gesendet')) {
      zeigen('ok', [text('Danke für Ihre Nachricht. Ich melde mich bei Ihnen.')]);
      form.reset();
      form.querySelectorAll('.feld, .zwei, .einv, button[type=submit]').forEach(el => { el.hidden = true; });
    } else {
      zeigen('fehler', [text('Das hat leider nicht geklappt. Bitte rufen Sie mich an unter '), link(form.dataset.telLink, form.dataset.tel), text(' oder schreiben Sie an '), link('mailto:' + form.dataset.mail, form.dataset.mail), text('.')]);
    }
    history.replaceState(null, '', location.pathname + '#schreiben');
    form.scrollIntoView({ behavior: 'auto', block: 'center' });
  }
  form.addEventListener('input', e => e.target.classList?.remove('fehlt'));
  form.querySelectorAll('input[name="ts"]').forEach(f => { f.value = String(Date.now()); });
});

/* ---------- Start */
const geladen = () => { document.body.classList.add('geladen'); wegBauen(); scrub(); };
if (document.readyState === 'complete') geladen(); else addEventListener('load', geladen);
addEventListener('resize', () => { wegBauen(); scrub(); });
setTimeout(wegMessen, 1500); setTimeout(wegMessen, 4000);
