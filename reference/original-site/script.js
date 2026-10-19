(() => {
  'use strict';

  const menuButton = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.getElementById('navLinks');
  if (menuButton && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      document.body.classList.remove('menu-open');
    };
    menuButton.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      document.body.classList.toggle('menu-open', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 800) closeMenu(); });
  }

  const modes = {
    local: {
      label: '01 DEVICE CONNECTED',
      title: 'Your AI, on your terms.',
      description: 'Local models run on hardware you control.',
      phase: 'AVAILABLE IN DEVELOPMENT BUILD'
    },
    group: {
      label: '05 DEVICES · PRIVATE GROUP',
      title: 'Your people. More possibilities.',
      description: 'Pool resources with explicitly trusted computers.',
      phase: 'TRUSTED MESH IN DEVELOPMENT'
    },
    swarm: {
      label: 'GLOBAL COMPUTE · CONCEPT',
      title: 'A network bigger than any one machine.',
      description: 'Opt-in public compute, with security gates before launch.',
      phase: 'FUTURE / RESEARCH'
    }
  };
  const stage = document.getElementById('networkStage');
  const tabs = [...document.querySelectorAll('.network-tab')];
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selected = tab.dataset.mode;
      const mode = modes[selected];
      if (!mode || !stage) return;
      stage.dataset.mode = selected;
      tabs.forEach(other => {
        const active = other === tab;
        other.classList.toggle('active', active);
        other.setAttribute('aria-selected', String(active));
        other.tabIndex = active ? 0 : -1;
      });
      document.getElementById('networkModeLabel').textContent = mode.label;
      document.getElementById('networkTitle').textContent = mode.title;
      document.getElementById('networkDescription').textContent = mode.description;
      document.getElementById('networkPhase').textContent = mode.phase;
    });
  });
  document.querySelector('.network-tabs')?.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    const current = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
    const next = (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
    event.preventDefault();
  });

  const code = `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="http://localhost:<port>/v1",\n    api_key="local-key",\n)\n\nresponse = client.chat.completions.create(\n    model="your-loaded-model",\n    messages=[{"role": "user", "content": "Hello, UCompute!"}],\n)\n# Configure your real local port, credentials and loaded model.`;
  const copyButton = document.getElementById('copyCode');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const label = copyButton.querySelector('.copy-text');
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(code);
        } else {
          const field = document.createElement('textarea');
          field.value = code;
          field.style.position = 'fixed';
          field.style.opacity = '0';
          document.body.append(field);
          field.select();
          if (!document.execCommand('copy')) throw new Error('Copy unavailable');
          field.remove();
        }
        label.textContent = 'Copied!';
        copyButton.setAttribute('aria-label', 'Code copied');
      } catch (_) {
        label.textContent = 'Select text';
      }
      window.setTimeout(() => {
        label.textContent = 'Copy code';
        copyButton.setAttribute('aria-label', 'Copy Python sample code');
      }, 1900);
    });
  }

  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
