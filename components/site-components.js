/* Every page loads the same HTML components. The built-in HTML remains a fallback. */
(() => {
  'use strict';
  const markCurrentPage = root => {
    root.querySelectorAll('a[href]').forEach(link => {
      link.removeAttribute('aria-current');
      if (new URL(link.href, location.href).pathname === location.pathname) {
        link.setAttribute('aria-current', 'page');
      }
    });
  };
  async function loadComponent(name) {
    const existing = document.querySelector(`[data-site-component="${name}"]`);
    if (!existing) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`/components/${name}.html`, {
        cache: 'no-cache', signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = (await response.text()).replaceAll('{{ year }}', String(new Date().getFullYear()));
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      const replacement = template.content.firstElementChild;
      if (!replacement || template.content.childElementCount !== 1 ||
          !replacement.matches(`${name}[data-site-component="${name}"]`)) {
        throw new Error('Invalid component markup');
      }
      markCurrentPage(replacement);
      existing.replaceWith(replacement);
      replacement.dataset.componentLoaded = 'true';
    } catch (error) {
      // Keep the complete generated header/footer when offline or unavailable.
      console.warn(`Using built-in ${name}:`, error.message);
    } finally {
      clearTimeout(timeout);
    }
  }
  document.querySelectorAll('[data-site-component]').forEach(markCurrentPage);
  Promise.allSettled(['header', 'footer'].map(loadComponent));
})();
