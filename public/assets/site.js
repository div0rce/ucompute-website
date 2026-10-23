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
  // Instruments (ledger grids, scales): draw once when they first come into view.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ledger = document.querySelector('.ledger-grid');
  if (ledger) {
    const { total, verified, implemented, progress } = ledger.dataset;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < +total; i++) {
      const cell = document.createElement('span');
      cell.style.setProperty('--i', i);
      cell.className = i < +verified ? 'is-v' : i < +verified + +implemented ? 'is-i' : i < +verified + +implemented + +progress ? 'is-p' : '';
      frag.appendChild(cell);
    }
    ledger.appendChild(frag);
  }
  const instruments = document.querySelectorAll('.instrument, .ledger');
  if (still) instruments.forEach(el => el.classList.add('is-drawn'));
  else {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-drawn'); io.unobserve(e.target); }
    }, { threshold: .35 });
    instruments.forEach(el => io.observe(el));
  }

  // Vision rings open as they scroll through the screen (--p runs 0 to 1).
  const moving = [...document.querySelectorAll('.orbit, [data-parallax]')];
  if (moving.length && !still) {
    let queued = false;
    const update = () => {
      queued = false;
      for (const el of moving) {
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * .5)));
        el.style.setProperty('--p', p.toFixed(3));
      }
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Pause motion (WCAG 2.2.2): one switch for every looping animation on the site, remembered per viewer.
  const toggles = [...document.querySelectorAll('.motion-toggle')];
  if (toggles.length && !still) {
    const root = document.documentElement;
    const apply = paused => {
      root.classList.toggle('motion-paused', paused);
      for (const t of toggles) { t.setAttribute('aria-pressed', String(paused)); t.textContent = paused ? 'Play motion' : 'Pause motion'; t.hidden = false; }
      for (const svg of document.querySelectorAll('svg')) paused ? svg.pauseAnimations?.() : svg.unpauseAnimations?.();
      dispatchEvent(new CustomEvent('motionchange', { detail: { paused } }));
    };
    let saved = false;
    try { saved = localStorage.getItem('ucompute-motion') === 'paused'; } catch {}
    apply(saved);
    for (const t of toggles) t.addEventListener('click', () => {
      const paused = !root.classList.contains('motion-paused');
      try { localStorage.setItem('ucompute-motion', paused ? 'paused' : 'on'); } catch {}
      apply(paused);
    });
  }
})();
