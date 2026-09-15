/** Fetch the matching static translation without navigating the document. */
let pending: AbortController | undefined;
let displayedUrl = location.href;
const all = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

function syncLinks() {
  all<HTMLAnchorElement>('.language-switch a').forEach(link => {
    const target = new URL(link.href);
    target.search = location.search;
    target.hash = location.hash;
    link.href = target.href;
  });
}

async function switchLanguage(target: URL, traverse = false) {
  pending?.abort();
  const controller = new AbortController();
  pending = controller;
  document.querySelector('.language-switch')?.setAttribute('aria-busy', 'true');
  const status = document.querySelector<HTMLElement>('[data-language-status]')!;
  status.textContent = '';
  try {
    const response = await fetch(target, { signal: controller.signal });
    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
    const incoming = new DOMParser().parseFromString(await response.text(), 'text/html');
    const regions = ['.site-header', '#main', '.site-footer', '.skip-link'];
    if (!['en', 'zh-CN'].includes(incoming.documentElement.lang) || regions.some(selector => !incoming.querySelector(selector))) {
      throw new Error('Invalid translation document');
    }
    // MDX code blocks can contribute page-specific styles. Load them before swapping.
    await Promise.all(all<HTMLLinkElement>('link[rel="stylesheet"]', incoming).map(link => {
      if (all<HTMLLinkElement>('link[rel="stylesheet"]').some(existing => existing.href === link.href)) return;
      return new Promise<void>((resolve, reject) => {
        const copy = document.createElement('link');
        copy.rel = 'stylesheet'; copy.href = link.href;
        copy.onload = () => resolve();
        copy.onerror = () => { copy.remove(); reject(new Error('Translation styles failed to load')); };
        document.head.append(copy);
      });
    }));
    if (controller.signal.aborted) return;

    // Capture at swap time, so scrolling/interaction during the request is respected.
    const position = { left: scrollX, top: scrollY, behavior: 'instant' as ScrollBehavior };
    const tabs = all('.homework-tabs').map(group => all('[role="tab"]', group).findIndex(tab => tab.getAttribute('aria-selected') === 'true'));
    const controls = all<HTMLInputElement | HTMLSelectElement>('#main input, #main select').map(control => control.value);
    const details = all<HTMLDetailsElement>('details').map(element => element.open);
    const flexSize = document.querySelector('flex-demo button[aria-pressed="true"]')?.getAttribute('data-size');
    const previousAnchoring = document.documentElement.style.overflowAnchor;
    document.documentElement.style.overflowAnchor = 'none';
    document.dispatchEvent(new Event('astro:before-swap'));
    const theme = document.querySelector('.theme-switch')!;
    const translatedTheme = incoming.querySelector('.theme-switch')!;
    theme.setAttribute('title', translatedTheme.getAttribute('title')!);
    theme.querySelector('input')!.setAttribute('aria-label', translatedTheme.querySelector('input')!.getAttribute('aria-label')!);
    // Keep the existing theme control and its listeners alive.
    translatedTheme.replaceWith(theme);
    document.documentElement.lang = incoming.documentElement.lang;
    document.title = incoming.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', incoming.querySelector('meta[name="description"]')?.getAttribute('content') ?? '');
    for (const selector of regions) {
      const current = document.querySelector(selector)!;
      const next = incoming.querySelector(selector)!;
      current.replaceChildren(...next.childNodes);
    }
    document.dispatchEvent(new Event('astro:after-swap'));
    all('.homework-tabs').forEach((group, index) => all<HTMLElement>('[role="tab"]', group)[tabs[index]]?.click());
    all<HTMLInputElement | HTMLSelectElement>('#main input, #main select').forEach((control, index) => {
      if (controls[index] === undefined) return;
      control.value = controls[index];
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    });
    all<HTMLDetailsElement>('details').forEach((element, index) => { element.open = details[index] ?? element.open; });
    if (flexSize) document.querySelector<HTMLButtonElement>(`flex-demo button[data-size="${flexSize}"]`)?.click();
    if (!traverse) history.pushState({ ...history.state, languageSwitch: true }, '', target);
    displayedUrl = target.href;
    syncLinks();
    document.querySelector<HTMLElement>(`.language-switch a[lang="${incoming.documentElement.lang}"]`)?.focus({ preventScroll: true });
    // Suppress both hash navigation and the site's smooth scrolling during the swap.
    document.documentElement.style.setProperty('--site-header-height', `${document.querySelector('.site-header')!.getBoundingClientRect().height}px`);
    window.scrollTo(position);
    requestAnimationFrame(() => { document.documentElement.style.overflowAnchor = previousAnchoring; });
    window.dispatchEvent(new Event('scroll'));
  } catch (error) {
    if (controller.signal.aborted) return;
    if (traverse) history.replaceState(history.state, '', displayedUrl);
    status.textContent = document.documentElement.lang === 'en'
      ? 'Unable to load this language. Please try again.' : '语言加载失败，请重试。';
    console.error(error);
  } finally {
    if (pending === controller) {
      pending = undefined;
      document.querySelector('.language-switch')?.removeAttribute('aria-busy');
    }
  }
}

document.addEventListener('click', event => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('.language-switch a');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const target = new URL(link.href);
  target.search = location.search;
  target.hash = location.hash;
  if (target.pathname === new URL(displayedUrl).pathname) { pending?.abort(); return; }
  void switchLanguage(target);
});
window.addEventListener('hashchange', syncLinks);
window.addEventListener('popstate', () => {
  if (location.pathname !== new URL(displayedUrl).pathname) void switchLanguage(new URL(location.href), true);
  else { pending?.abort(); syncLinks(); }
});
syncLinks();
