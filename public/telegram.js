// Telegram enhances the same interface; normal browser access stays available.
export async function initTelegram() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (!params.has('tgWebAppVersion') && !window.Telegram?.WebApp) return null;
  try {
    if (!window.Telegram?.WebApp) await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    const app = window.Telegram.WebApp;
    document.body.classList.add('telegram-app');
    const resize = () => {
      document.documentElement.style.setProperty('--app-height', `${app.viewportStableHeight || innerHeight}px`);
      for (const edge of ['top', 'bottom', 'left', 'right']) {
        const inset = Math.max(app.safeAreaInset?.[edge] || 0, app.contentSafeAreaInset?.[edge] || 0);
        document.documentElement.style.setProperty(`--telegram-${edge}`, `${inset}px`);
      }
    };
    app.setHeaderColor?.('#05060b');
    app.setBackgroundColor?.('#05060b');
    app.onEvent('viewportChanged', resize);
    app.onEvent('safeAreaChanged', resize);
    app.onEvent('contentSafeAreaChanged', resize);
    resize();
    app.ready();
    app.expand();
    return app;
  } catch {
    // SDK failure must not prevent browser voice calls.
    return null;
  }
}
