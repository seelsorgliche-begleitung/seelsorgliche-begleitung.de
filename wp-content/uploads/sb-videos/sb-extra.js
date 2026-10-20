/* Seelsorgliche Begleitung — Videos in Karten und Zitat-Band (20.10.2026).
   Videos laden erst, wenn sie gebraucht werden (preload none, Quelle erst beim Einblenden). */
(function () {
  var V = '/wp-content/uploads/sb-videos/';
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches;

  var LEBENSPHASEN = {
    'Entscheidung und Umbruch': 'entscheidung',
    'Abschied oder Verlust': 'abschied',
    'Persönliche Krisen': 'krisen',
    'Übergänge im Leben': 'uebergaenge',
    'Krankheit und Schicksalsschläge': 'krankheit',
    'Innere Klärung': 'klaerung'
  };
  var ANGEBOTE = {
    'Was war, verstehen': 'verstehen',
    'Naturcoaching': 'naturcoaching',
    'Trauerbegleitung': 'trauer',
    'Und wie geht es jetzt weiter?': 'weiter'
  };

  function video(name, klasse) {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.preload = 'none'; v.className = klasse; v.dataset.name = name;
    return v;
  }
  function laden(v) {
    if (!v.getAttribute('src')) { v.poster = V + v.dataset.name + '.jpg'; v.src = V + v.dataset.name + '.mp4'; }
  }
  function spielen(v) { laden(v); if (!ruhig) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }

  function karte(el, name) {
    if (el.classList.contains('sb-kv')) return;
    el.classList.add('sb-kv');
    var v = video(name, 'sb-kv-video');
    var s = document.createElement('span'); s.className = 'sb-kv-schleier';
    el.insertBefore(s, el.firstChild); el.insertBefore(v, el.firstChild);
    var an = function () { el.classList.add('sb-an'); spielen(v); };
    var aus = function () { el.classList.remove('sb-an'); v.pause(); };
    if (touch && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? an() : aus(); },
        { rootMargin: '-35% 0px -35% 0px' }).observe(el);
    } else {
      el.addEventListener('mouseenter', an); el.addEventListener('mouseleave', aus);
      el.addEventListener('focusin', an); el.addEventListener('focusout', aus);
    }
  }

  function start() {
    document.querySelectorAll('.elementor-image-box-title').forEach(function (t) {
      var name = LEBENSPHASEN[t.textContent.trim()];
      var c = t.closest('.elementor-widget-container');
      if (name && c) karte(c, name);
    });
    document.querySelectorAll('.sba-card').forEach(function (c) {
      var t = c.querySelector('.sba-ct-main');
      var name = t && ANGEBOTE[t.textContent.trim()];
      if (name) karte(c, name);
    });

    var z = document.querySelector('.elementor-element-5a3149de');
    if (z && !z.classList.contains('sb-zitat')) {
      z.classList.add('sb-zitat');
      z.querySelectorAll('.elementor-widget-image').forEach(function (w) {
        var i = w.querySelector('img');
        if (!i) return;
        if (/DSC09582|24107-1/.test(i.src)) w.classList.add('sb-zitat-deko');
        else if (/unnamed-file/.test(i.src)) w.classList.add('sb-zitat-zeichen');
      });
      var v = video('zitat', 'sb-zitat-video');
      var s = document.createElement('span'); s.className = 'sb-zitat-schleier';
      z.insertBefore(s, z.firstChild); z.insertBefore(v, z.firstChild);
      v.poster = V + 'zitat.jpg';
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { e[0].isIntersecting ? spielen(v) : v.pause(); },
          { rootMargin: '200px 0px' }).observe(z);
      } else { spielen(v); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
