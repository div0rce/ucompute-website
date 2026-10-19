// Site behaviour: mobile menu, code tabs, copy buttons. Everything works without it except copying.
(() => {
  'use strict';

  // Mobile menu
  const toggle = document.querySelector('.menu-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    const setOpen = open => {
      if (open) document.documentElement.style.setProperty('--menu-top', `${document.querySelector('.site-header').getBoundingClientRect().bottom}px`);
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    links.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && links.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
  }

  // Tabs (WAI-ARIA tabs pattern, automatic activation)
  for (const list of document.querySelectorAll('[role=tablist]')) {
    const tabs = [...list.querySelectorAll('[role=tab]')];
    const select = tab => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      }
    };
    list.addEventListener('click', e => { const t = e.target.closest('[role=tab]'); if (t) select(t); });
    list.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      const t = tabs[(next + tabs.length) % tabs.length];
      t.focus();
      select(t);
    });
  }

  // Keyboard users must be able to scroll code and tables that overflow (WCAG 2.1.1)
  const markScrollable = () => {
    for (const el of document.querySelectorAll('pre, .table-wrap, .diagram')) {
      if (el.scrollWidth > el.clientWidth) el.tabIndex = 0;
      else el.removeAttribute('tabindex');
    }
  };
  markScrollable();
  document.fonts.ready.then(markScrollable); // web fonts change widths after first layout
  let pending = false;
  addEventListener('resize', () => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; markScrollable(); }); } });

  // Copy buttons: copy the visible <pre> inside the same .code-panel or .code-wrap
  for (const btn of document.querySelectorAll('.copy-btn')) {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      const scope = btn.closest('.code-panel, .code-wrap');
      const pre = [...scope.querySelectorAll('pre')].find(p => !p.closest('[hidden]'));
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ''));
        btn.textContent = 'Copied';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(pre);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        btn.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => { btn.textContent = label; }, 1800);
    });
  }
})();
