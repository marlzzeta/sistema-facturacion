const DEFAULT_TITLE = 'SisFactura';
const DEFAULT_FAVICON = '/favicon.svg';

/** Aplica el título y el favicon configurados a la pestaña del navegador. */
export function applyBrowserBranding(title?: string | null, favicon?: string | null) {
  document.title = title?.trim() || DEFAULT_TITLE;
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (favicon) {
    link.removeAttribute('type');
    link.href = favicon;
  } else {
    link.type = 'image/svg+xml';
    link.href = DEFAULT_FAVICON;
  }
}
