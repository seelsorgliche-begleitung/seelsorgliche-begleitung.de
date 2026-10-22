/* Seitenaufrufe zählen — ohne Cookies, ohne Speicher im Browser, ohne IP und ohne Kennung.
   Eigener Zähler der HandwerksManufaktur (Worker seiten-zaehler); beschrieben in der Datenschutzerklärung.
   Zählt nur auf der echten Domain, nicht in der Vorschau und nicht lokal. */
(function () {
  if (!/(^|\.)seelsorgliche-begleitung\.de$/.test(location.hostname)) return;
  var r = 'direkt';
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('utm_source')) r = 'utm:' + q.get('utm_source');
    else if (document.referrer) { var h = new URL(document.referrer).hostname.replace(/^www\./, ''); if (h && h !== location.hostname) r = h; }
  } catch (e) {}
  var d = JSON.stringify({ t: 'v', s: location.hostname, p: location.pathname, g: innerWidth < 768 ? 'm' : 'd',
    id: Math.random().toString(36).slice(2, 12), r: r });
  var Z = 'https://seiten-zaehler.handwerksmanufaktur.workers.dev/z';
  try { if (!(navigator.sendBeacon && navigator.sendBeacon(Z, new Blob([d], { type: 'text/plain' })))) fetch(Z, { method: 'POST', body: d, keepalive: true, mode: 'no-cors' }); } catch (e) {}
})();
