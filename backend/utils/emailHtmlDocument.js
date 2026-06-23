/**
 * Envoltorio HTML y CSS para correos de producto.
 * Mitiga inversiones de modo oscuro en Gmail, Apple Mail y Outlook móvil.
 */
import { EMAIL_COLORS } from '../constants/email.js';

/**
 * CSS embebido: fuerza paleta clara de la app cuando el cliente aplica dark mode.
 * @returns {string}
 */
export function buildEmailDarkModeStyles() {
  const c = EMAIL_COLORS;
  return `
    :root { color-scheme: light only; supported-color-schemes: light; }
    body { margin: 0 !important; padding: 0 !important; background-color: ${c.BACKGROUND} !important; }
    .email-doc { color-scheme: light only; }
    .email-outer {
      background-color: ${c.BACKGROUND} !important;
      color: ${c.TEXT_DARK} !important;
    }
    .email-header h1 { color: ${c.TEXT_DARK} !important; }
    .email-card {
      background-color: ${c.SURFACE} !important;
      color: ${c.TEXT_DARK} !important;
    }
    .email-panel {
      background-color: ${c.CHROME_FILL} !important;
      color: ${c.TEXT_DARK} !important;
    }
    .email-gift-panel {
      background-color: #E8F4FC !important;
      color: ${c.TEXT_DARK} !important;
    }
    .email-code-inner { background-color: ${c.SURFACE} !important; }
    .email-text { color: ${c.TEXT_DARK} !important; }
    .email-muted { color: ${c.TEXT_GRAY} !important; }
    .email-faint { color: ${c.TEXT_MUTED} !important; }
    a.email-btn {
      background-color: ${c.PRIMARY_MEDIUM} !important;
      color: ${c.TEXT_WHITE} !important;
    }
    a.email-link { color: ${c.PRIMARY_MEDIUM} !important; }
    .email-footer, .email-footer p, .email-footer div {
      color: ${c.TEXT_LIGHT} !important;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-outer {
        background-color: ${c.BACKGROUND} !important;
        background-image: none !important;
      }
      .email-header { background-color: transparent !important; }
      .email-header h1 {
        color: ${c.TEXT_DARK} !important;
        -webkit-text-fill-color: ${c.TEXT_DARK} !important;
      }
      .email-card, .email-panel, .email-code-inner {
        background-color: ${c.SURFACE} !important;
      }
      .email-gift-panel {
        background-color: #E8F4FC !important;
        background-image: none !important;
      }
      .email-card p,
      .email-card li,
      .email-card h1,
      .email-card h2,
      .email-card strong,
      .email-card span,
      .email-panel p,
      .email-panel li,
      .email-panel strong,
      .email-gift-panel p,
      .email-gift-panel strong,
      .email-text {
        color: ${c.TEXT_DARK} !important;
        -webkit-text-fill-color: ${c.TEXT_DARK} !important;
      }
      .email-muted,
      .email-card .email-muted {
        color: ${c.TEXT_GRAY} !important;
        -webkit-text-fill-color: ${c.TEXT_GRAY} !important;
      }
      .email-faint {
        color: ${c.TEXT_MUTED} !important;
        -webkit-text-fill-color: ${c.TEXT_MUTED} !important;
      }
      a.email-link {
        color: ${c.PRIMARY_MEDIUM} !important;
        -webkit-text-fill-color: ${c.PRIMARY_MEDIUM} !important;
      }
      a.email-btn {
        background-color: ${c.PRIMARY_MEDIUM} !important;
        color: ${c.TEXT_WHITE} !important;
        -webkit-text-fill-color: ${c.TEXT_WHITE} !important;
      }
      .email-footer, .email-footer p, .email-footer div, .email-footer a {
        color: ${c.TEXT_LIGHT} !important;
        -webkit-text-fill-color: ${c.TEXT_LIGHT} !important;
      }
      .email-footer a.email-btn {
        color: ${c.TEXT_WHITE} !important;
        -webkit-text-fill-color: ${c.TEXT_WHITE} !important;
      }
    }
  `.trim();
}

/**
 * @param {string} bodyHtml — fragmento interno de la plantilla (sin html/head).
 * @param {{ lang?: string }} [options]
 * @returns {string}
 */
export function wrapEmailHtmlDocument(bodyHtml, options = {}) {
  const lang = options.lang === 'en' ? 'en' : 'es';
  const styles = buildEmailDarkModeStyles();
  const bg = EMAIL_COLORS.BACKGROUND;

  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style type="text/css">${styles}</style>
</head>
<body class="email-doc" style="margin:0;padding:0;background-color:${bg};">
  ${bodyHtml}
</body>
</html>`;
}

/**
 * @param {string} html
 * @returns {boolean}
 */
export function isFullEmailHtmlDocument(html) {
  return /<!DOCTYPE\s+html/i.test(String(html ?? ''));
}
