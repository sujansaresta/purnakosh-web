// Offline support (sw.js). Separate file so the page's Content-Security-Policy needs no inline scripts.
// The site may live in a sub-path (GitHub Pages), so sw.js is found next to this script.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  const base = document.currentScript.src.replace(/register-sw\.js.*$/, '');
  const hadWorker = !!navigator.serviceWorker.controller;
  // A window left open never reloads by itself, so ask for a newer worker when it comes back to the screen and hourly.
  navigator.serviceWorker.register(base + 'sw.js', { scope: base }).then((reg) => {
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, 3600e3);
  });
  // A new worker taking over means this page still runs the old build: the app shows "Reload" (UpdateBanner.tsx).
  // Not on the very first visit, when the first worker takes over a page that is already the latest.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadWorker) return;
    window.purnakoshUpdate = true;
    window.dispatchEvent(new Event('purnakosh-update'));
  });
}
