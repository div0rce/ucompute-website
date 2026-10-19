// Prelaunch network illustration: nodes start scattered and settle into the UCompute mark.
// The markup already holds the final picture, so no-JS and reduced-motion visitors see it unchanged.
(() => {
  const vis = document.getElementById('pl-visual');
  if (!vis || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const nodes = [...vis.querySelectorAll('.node, .node-core')];
  let seed = 7; // deterministic scatter, so every visit looks the same
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  vis.classList.add('is-scattered');
  for (const n of nodes) n.style.transform = `translate(${(rand() - 0.5) * 260}px, ${(rand() - 0.5) * 260}px)`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const n of nodes) n.style.transform = '';
    setTimeout(() => vis.classList.remove('is-scattered'), 900);
  }));
})();
