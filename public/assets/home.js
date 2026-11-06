// Home page motion: the brain mesh (WebGL), the header switch and the scroll story.
// Everything here is decoration on top of complete HTML: with no JS, no WebGL or reduced motion the page
// reads the same, and each piece rests in its final state.
(() => {
  'use strict';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Brain mesh: a 3D brain made of particles, turning slowly. Its surface carries folds (darker winding grooves),
  // the cerebellum has fine ridges, and a network of nodes sits on top. Now and then a node fires curved signals out to
  // several farther nodes; each lands at a slightly different time, pulses, and answers back to where it started.
  const canvas = document.querySelector('.fabric-canvas');
  const gl = canvas && canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (gl) {
    let seed = 11; // deterministic: the same brain on every visit
    const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const narrow = matchMedia('(max-width: 859px)').matches;
    // Smooth 3D value noise, for the folds.
    const hash = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440670441); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const noise = (x, y, z) => {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), sm = v => v * v * (3 - 2 * v);
      const u = sm(x - xi), v = sm(y - yi), w = sm(z - zi), L = (a, b, f) => a + (b - a) * f;
      const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
      return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
    };
    // x: left to right, y: up, z: front (+) to back (-).
    const LOBES = [
      { c: [-.4, .12, .02], r: [.45, .6, 1], w: .34, cortex: true, hemi: true }, { c: [.4, .12, .02], r: [.45, .6, 1], w: .34, cortex: true, hemi: true },
      { c: [-.55, -.3, .18], r: [.27, .25, .52], w: .09, cortex: true, temporal: true }, { c: [.55, -.3, .18], r: [.27, .25, .52], w: .09, cortex: true, temporal: true },
      { c: [-.26, -.4, -.66], r: [.35, .25, .33], w: .075, folia: true }, { c: [.26, -.4, -.66], r: [.35, .25, .33], w: .075, folia: true },
    ];
    const inside = (p, skip) => LOBES.some(l => l !== skip && ((p[0] - l.c[0]) / l.r[0]) ** 2 + ((p[1] - l.c[1]) / l.r[1]) ** 2 + ((p[2] - l.c[2]) / l.r[2]) ** 2 < .96);
    // Folds are drawn, not shaded: most particles sit on contour lines of a 3D noise field over the surface, which
    // wind like gyri; a sparse fill gives the volume. The groove above the temporal lobe is left empty.
    const SURF = [], SHADE = [], SIZE = [];
    const keep = (p, shade, size) => { SURF.push([p[0], p[1] + .1, p[2]]); SHADE.push(shade); SIZE.push(size); };
    // Built in slices of a few milliseconds, so loading the page never blocks on it.
    function* sample() { for (let tries = 0, want = narrow ? 7000 : 15000; SURF.length < want && tries < want * 26; tries++) {
      if (tries % 3000 === 2999) yield;
      let pick = rnd();
      if (pick > .965) { // brainstem, angled down and back
        if (rnd() < .8) continue;
        const y = -.18 - rnd() * .66, a = rnd() * Math.PI * 2;
        keep([Math.cos(a) * .12, y, -.26 + (y + .18) * .32 + Math.sin(a) * .12], .6, 2);
        continue;
      }
      const l = LOBES.find(o => (pick -= o.w) < 0) || LOBES[0];
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), d = [Math.cos(a) * s, u, Math.sin(a) * s];
      const p = d.map((v, k) => l.c[k] + v * l.r[k]);
      if (l.hemi) {
        if (p[2] > .25) p[1] = l.c[1] + (p[1] - l.c[1]) * (1 - .3 * (p[2] - .25)); // lower, narrower frontal lobe
        if (p[1] < l.c[1] - .16) p[1] = l.c[1] - .16 + (p[1] - (l.c[1] - .16)) * .5; // flat underside
        if (Math.abs(p[0]) < .04 && p[1] > -.05) continue; // the fissure between hemispheres
        if (Math.abs(p[0]) > .3 && p[2] > -.35 && Math.abs(p[1] - (.02 + p[2] * .08)) < .045) continue; // groove above the temporal lobe
      }
      if (inside(p, l)) continue;
      if (l.cortex) {
        const f = noise(p[0] * 6.2 + 7, p[1] * 6.2, p[2] * 6.2) + .4 * noise(p[0] * 12.5 + 3, p[1] * 12.5, p[2] * 12.5);
        const band = Math.abs(f - .7);
        if (band < .03) keep(p, 1, 2);
        else if (rnd() < .025) keep(p.map((v, k) => v - d[k] * .03), .3, 1.8);
      } else if (l.folia) { // the cerebellum's fine horizontal ridges
        if (Math.sin(p[1] * 64) > .8) keep(p, .95, 2);
        else if (rnd() < .04) keep(p, .3, 1.8);
      }
    } }

    // One vertex layout: x, y, z, size, kind, glow, alpha.
    // Kinds: 0 node, 2 signal head, 3 dust (glow = twinkle phase), 4 signal line, 5 link, 6 surface particle, 7 ring pulse.
    const VERT = `attribute vec3 a;attribute float s;attribute float k;attribute float g;attribute float al;
  uniform vec2 yp;uniform vec2 c;uniform vec2 sc;uniform float dpr;uniform float t;
  varying float vD;varying float vK;varying float vG;varying float vA;
  void main(){
    float cy=cos(yp.x),sy=sin(yp.x),cp=cos(yp.y),sp=sin(yp.y);
    vec3 p=vec3(cy*a.x+sy*a.z,a.y,-sy*a.x+cy*a.z);p=vec3(p.x,cp*p.y-sp*p.z,sp*p.y+cp*p.z);
    float z=max(p.z+3.,.6);
    gl_Position=vec4(c+p.xy/z*sc,0.,1.);
    vD=clamp(1.-(p.z+1.2)/2.4,0.,1.);vK=k;vG=g;vA=al;
    if(k>2.5&&k<3.5){vA=al*(.55+.45*sin(t*.7+g));vD=clamp(1.-(p.z+3.)/6.,0.,1.);}
    gl_PointSize=min(s*dpr*3./z,48.*dpr);
  }`;
    const POINT = `precision mediump float;varying float vD;varying float vK;varying float vG;varying float vA;
  void main(){
    float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;
    float core=1.-d;
    if(vK>6.5){float a=smoothstep(.55,.8,d)*(1.-smoothstep(.85,1.,d))*vA;gl_FragColor=vec4(vec3(.78,1.,.5)*a,a);return;}
    if(vK>5.5){float a=core*vA*(.16+.84*vD);gl_FragColor=vec4(vec3(.58,.82,.52)*a,a);return;}
    if(vK>2.5){float a=core*core*vA*(.22+.55*vD);gl_FragColor=vec4(vec3(.62,.84,.58)*a,a);return;}
    if(vK>1.5){float a=(pow(core,3.)*1.4+core*.25)*vA;gl_FragColor=vec4(vec3(.88,1.,.66)*a,a);return;}
    float b=mix(.3,1.,vD)+vG*1.1;
    vec3 col=mix(mix(vec3(.34,.52,.38),vec3(.66,.9,.54),vD),vec3(.86,1.,.6),clamp(vG,0.,1.));
    float a=(pow(core,2.4)+core*vG*.4)*b;
    gl_FragColor=vec4(col*a,a);
  }`;
    const LINE = `precision mediump float;varying float vD;varying float vK;varying float vG;varying float vA;
  void main(){
    if(vK>4.5){float a=mix(.025,.11,vD);gl_FragColor=vec4(vec3(.4,.62,.44)*a,a);return;}
    float a=vA*mix(.6,1.,vD);gl_FragColor=vec4(vec3(.76,1.,.47)*a,a);
  }`;
    // The shaders compile in the GPU process while the brain is sampled. Asking for the result blocks until the
    // compile is done (hundreds of milliseconds on a cold GPU process), so start() asks only once it has finished.
    const program = frag => {
      const p = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, frag]]) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(p, s); }
      gl.linkProgram(p);
      return p;
    };
    const progs = [program(POINT), program(LINE)];
    const parallel = gl.getExtension('KHR_parallel_shader_compile');
    const compiled = () => !parallel || progs.every(p => gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR));
    const start = () => {
      // Network nodes: spread-out surface points on the cortex and cerebellum, linked to their three nearest.
      const P = [];
      for (let i = 0; i < SURF.length && P.length < (narrow ? 100 : 160); i++) {
        if (SHADE[i] < .85 || rnd() < .6) continue;
        const q = SURF[i];
        if (P.every(p => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2 > .03)) P.push(q);
      }
      const N = P.length;
      const E = new Set();
      P.forEach((p, i) => P.map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2]).filter(([j]) => j !== i)
        .sort((x, y) => x[1] - y[1]).slice(0, 3).forEach(([j]) => E.add(i < j ? `${i}-${j}` : `${j}-${i}`)));
      const edges = [...E].map(k => k.split('-').map(Number));
      const D = Array.from({ length: narrow ? 160 : 300 }, () => {
        const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = 1.4 + rnd() * 2.6, s = Math.sqrt(1 - u * u);
        return [Math.cos(a) * s * r * 1.4, u * r * .9, Math.sin(a) * s * r * 1.4, 2.5 + rnd() * 3.5, rnd() * 6.28];
      });

      const [pointProg, lineProg] = progs.map(p => gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null);
      if (pointProg && lineProg) {
        const F = 7;
        const set = (arr, i, p, s, k, g, al) => { const o = i * F; arr[o] = p[0]; arr[o + 1] = p[1]; arr[o + 2] = p[2]; arr[o + 3] = s; arr[o + 4] = k; arr[o + 5] = g; arr[o + 6] = al; };
        // Static: surface particles, links and dust. Dynamic: nodes (their glow) and everything signals draw.
        const staticData = new Float32Array((SURF.length + D.length + edges.length * 2) * F);
        let sv = 0;
        SURF.forEach((p, i) => set(staticData, sv++, p, SIZE[i], 6, 0, SHADE[i]));
        D.forEach(d => set(staticData, sv++, d, d[3], 3, d[4], 1));
        const pointsEnd = sv;
        edges.forEach(([i, j]) => { set(staticData, sv++, P[i], 0, 5, 0, 1); set(staticData, sv++, P[j], 0, 5, 0, 1); });
        const nodeData = new Float32Array(N * F);
        P.forEach((p, i) => set(nodeData, i, p, 5 + (i % 3) * 1.2, 0, 0, 1));
        const SEG = 16, TRAIL = 8, BURSTS = narrow ? 1 : 2, FAN = narrow ? 3 : 5, RINGS = 24;
        const dynData = new Float32Array((BURSTS * FAN * (SEG * 2 + TRAIL * 2 + 1) + RINGS) * F);
        const mk = (data, usage) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); return b; };
        const staticBuf = mk(staticData, gl.STATIC_DRAW), nodeBuf = mk(nodeData, gl.DYNAMIC_DRAW), dynBuf = mk(dynData, gl.DYNAMIC_DRAW);
        const loc = new Map([pointProg, lineProg].map(p => [p, {
          attrs: [['a', 3, 0], ['s', 1, 12], ['k', 1, 16], ['g', 1, 20], ['al', 1, 24]].map(([n, size, off]) => [gl.getAttribLocation(p, n), size, off]).filter(([l]) => l >= 0),
          u: Object.fromEntries(['yp', 'c', 'sc', 'dpr', 't'].map(n => [n, gl.getUniformLocation(p, n)])),
        }]));
        for (const { attrs } of loc.values()) for (const [l] of attrs) gl.enableVertexAttribArray(l);
        const use = (prog, b) => {
          const { attrs, u } = loc.get(prog);
          gl.useProgram(prog); gl.bindBuffer(gl.ARRAY_BUFFER, b);
          for (const [l, size, off] of attrs) gl.vertexAttribPointer(l, size, gl.FLOAT, false, F * 4, off);
          gl.uniform2f(u.yp, view.yaw, view.pitch); gl.uniform2f(u.c, view.cx, view.cy);
          gl.uniform2f(u.sc, view.sx, view.sy); gl.uniform1f(u.dpr, view.dpr); gl.uniform1f(u.t, t);
        };
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        gl.clearColor(0, 0, 0, 0); // transparent: the hero's own background shows through

        // Signals. A burst: one origin fires curved signals to FAN farther nodes; each lands at its own pace (within
        // about 20% of the others), pulses, waits a moment, and answers back. Then the burst rests and starts elsewhere.
        const nodeGlow = new Float32Array(N), rings = [];
        const ease = f => f < .5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f);
        const CEN = [0, .1, -.08];
        const curve = (o, tg) => { // a quadratic arc that bows away from the centre of the brain
          const m = o.map((v, k) => (v + tg[k]) / 2), out = m.map((v, k) => v - CEN[k]), len = Math.hypot(...out) || 1;
          const span = Math.hypot(o[0] - tg[0], o[1] - tg[1], o[2] - tg[2]);
          return [o, m.map((v, k) => v + out[k] / len * (.18 + .28 * span)), tg];
        };
        // Writes the point at f along a leg's arc straight into the dynamic buffer: the frame loop allocates nothing,
        // so the garbage collector never pauses the animation.
        const put = (i, l, f, s, k, al) => {
          const [o, c, g] = l.path, a = (1 - f) * (1 - f), b = 2 * (1 - f) * f, e = f * f, j = i * F;
          dynData[j] = a * o[0] + b * c[0] + e * g[0]; dynData[j + 1] = a * o[1] + b * c[1] + e * g[1]; dynData[j + 2] = a * o[2] + b * c[2] + e * g[2];
          dynData[j + 3] = s; dynData[j + 4] = k; dynData[j + 5] = 0; dynData[j + 6] = al;
        };
        // Where a leg's moving head is (0 at the origin, 1 at the target), or -1 while it waits or after it is back.
        const head = l => l.t < l.out ? ease(l.t / l.out) : l.t >= l.out + l.wait && l.t < l.out + l.wait + l.back ? 1 - ease((l.t - l.out - l.wait) / l.back) : -1;
        const bursts = Array.from({ length: BURSTS }, (_, i) => ({ rest: .6 + i * 2.2, legs: null }));
        const fire = b => {
          const o = Math.floor(rnd() * N), far = [];
          for (let j = 0; j < N; j++) { const d = Math.hypot(P[j][0] - P[o][0], P[j][1] - P[o][1], P[j][2] - P[o][2]); if (d > .55 && d < 1.5) far.push(j); }
          if (far.length < FAN) { b.rest = .3; return; }
          const legs = [];
          while (legs.length < FAN) { const j = far.splice(Math.floor(rnd() * far.length), 1)[0]; const pace = .85 + rnd() * .35; legs.push({ to: j, path: curve(P[o], P[j]), out: 1.5 * pace, wait: .2 + rnd() * .35, back: 1.7 * pace, t: 0 }); }
          Object.assign(b, { from: o, legs, line: 0 });
          nodeGlow[o] = 1; rings.push({ at: P[o], age: 0 });
        };
        const advance = (b, dt) => {
          if (!b.legs) { b.rest -= dt; if (b.rest <= 0) fire(b); return; }
          let live = false;
          for (const l of b.legs) {
            const before = l.t;
            l.t += dt;
            if (before < l.out && l.t >= l.out) { nodeGlow[l.to] = 1; rings.push({ at: P[l.to], age: 0 }); }
            if (before < l.out + l.wait + l.back && l.t >= l.out + l.wait + l.back) { nodeGlow[b.from] = Math.max(nodeGlow[b.from], .8); rings.push({ at: P[b.from], age: .15 }); }
            if (l.t < l.out + l.wait + l.back + .6) live = true;
          }
          b.line = live ? Math.min(1, b.line + dt / .4) : Math.max(0, b.line - dt / .6);
          if (!live && b.line <= 0) Object.assign(b, { legs: null, rest: 1.2 + rnd() * 2.4 });
        };

        const ptr = [0, 0], target = [0, 0];
        let visible = true, raf = 0, last = performance.now(), t = still ? 40 : 0;
        let paused = document.documentElement.classList.contains('motion-paused');
        const view = { yaw: 0, pitch: 0, cx: 0, cy: 0, sx: 1, sy: 1, dpr: 1 };
        let sized = false;
        new ResizeObserver(() => { sized = false; if (!raf) frame(performance.now()); }).observe(canvas);
        const size = () => {
          if (sized) return;
          sized = true;
          // ponytail: particles and thin lines, so it renders at up to 1.25x and the browser scales it; raise for sharper lines.
          const big = canvas.clientWidth * canvas.clientHeight > 1.6e6;
          const dpr = Math.min(devicePixelRatio || 1, big ? 1 : 1.25);
          const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
          if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
          view.dpr = dpr;
          // The whole brain stays in frame: one unit at the centre's depth is \`half\` CSS pixels.
          const wide = canvas.clientWidth > 860, half = wide ? Math.min(canvas.clientWidth * .245, canvas.clientHeight * .44) : canvas.clientWidth * .42;
          view.sx = half * 6 / canvas.clientWidth; view.sy = half * 6 / canvas.clientHeight;
          view.cx = wide ? .45 : .3; view.cy = wide ? -.02 : .36;
        };
        const frame = now => {
          const dt = Math.min(.05, (now - last) / 1000); last = now;
          const moving = !still && !paused;
          if (moving) t += dt;
          size();
          const ke = 1 - Math.exp(-dt / .65); // the same easing at 30, 60 or 120 frames a second
          ptr[0] += (target[0] - ptr[0]) * ke; ptr[1] += (target[1] - ptr[1]) * ke;
          // A fixed pose: the frontal lobe turned 45 degrees to the brain's own right (the viewer's left), seen a little from above (front tipped
          // down). No spinning; only a slow sway of a few degrees and a little pointer parallax.
          view.yaw = -2.36 + Math.sin(t * .11) * .1 + ptr[0] * .16; view.pitch = -.3 + Math.sin(t * .08) * .035 + ptr[1] * .08;
          if (moving) {
            for (const b of bursts) advance(b, dt);
            const kn = Math.exp(-dt / .8);
            for (let i = 0; i < N; i++) nodeGlow[i] *= kn;
            for (const r of rings) r.age += dt;
            while (rings.length && rings[0].age > .9) rings.shift();
          }
          for (let i = 0; i < N; i++) nodeData[i * F + 5] = nodeGlow[i];
          // Signal lines: each leg's faint arc, then a short bright trail behind its moving head (out, then back).
          let v = 0;
          for (const b of bursts) {
            if (!b.legs) continue;
            for (const l of b.legs) {
              for (let i = 0; i < SEG; i++) { put(v++, l, i / SEG, 0, 4, .16 * b.line); put(v++, l, (i + 1) / SEG, 0, 4, .16 * b.line); }
              const f = head(l);
              if (f < 0) continue;
              const tail = l.t < l.out ? Math.max(0, f - .22) : Math.min(1, f + .22);
              for (let i = 0; i < TRAIL; i++) {
                put(v++, l, tail + (f - tail) * i / TRAIL, 0, 4, (i / TRAIL) ** 1.5);
                put(v++, l, tail + (f - tail) * (i + 1) / TRAIL, 0, 4, ((i + 1) / TRAIL) ** 1.5);
              }
            }
          }
          const lines = v;
          for (const b of bursts) if (b.legs) for (const l of b.legs) { const f = head(l); if (f >= 0) put(v++, l, f, 10, 2, 1); }
          for (let i = Math.max(0, rings.length - RINGS); i < rings.length; i++) { const r = rings[i]; set(dynData, v++, r.at, 8 + 30 * (r.age / .9), 7, 0, (1 - r.age / .9) * .9); }
          gl.clear(gl.COLOR_BUFFER_BIT);
          use(pointProg, staticBuf); gl.drawArrays(gl.POINTS, 0, pointsEnd);
          use(lineProg, staticBuf); gl.drawArrays(gl.LINES, pointsEnd, edges.length * 2);
          gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, nodeData);
          use(pointProg, nodeBuf); gl.drawArrays(gl.POINTS, 0, N);
          if (v) {
            gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, dynData); // 14 KB; cheaper than a new view each frame
            if (lines) { use(lineProg, dynBuf); gl.drawArrays(gl.LINES, 0, lines); }
            if (v > lines) { use(pointProg, dynBuf); gl.drawArrays(gl.POINTS, lines, v - lines); }
          }
          raf = moving && visible && !document.hidden ? requestAnimationFrame(frame) : 0;
        };
        const resume = () => { if (!raf && !still && !paused && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
        addEventListener('motionchange', e => { paused = e.detail.paused; resume(); });
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; resume(); }).observe(canvas);
        document.addEventListener('visibilitychange', resume);
        if (!still) addEventListener('pointermove', e => { target[0] = e.clientX / innerWidth - .5; target[1] = .5 - e.clientY / innerHeight; }, { passive: true });
        canvas.closest('.fabric').classList.add('fabric-live');
        // If the GPU drops the context, fall back to the static background rather than a frozen canvas.
        canvas.addEventListener('webglcontextlost', e => {
          e.preventDefault();
          cancelAnimationFrame(raf); raf = 0; paused = true;
          canvas.closest('.fabric').classList.remove('fabric-live');
        });
        frame(performance.now());
      }
    };
    const gen = sample();
    let sampled = false;
    const slice = () => {
      const t0 = performance.now();
      while (!sampled && performance.now() - t0 < 8) sampled = gen.next().done;
      if (sampled && compiled()) start(); else setTimeout(slice, sampled ? 16 : 0);
    };
    slice();
  }

  // ---- Header: clear over the hero at the top, dark once scrolled, paper once the hero has scrolled away.
  const header = document.querySelector('.header-over-hero');
  const hero = document.querySelector('.fabric');
  if (header && hero) {
    new IntersectionObserver(([e]) => header.classList.toggle('header-over-hero', e.isIntersecting), { rootMargin: '-76px 0px 0px 0px' }).observe(hero);
    // Clear only at the very top; as soon as the page moves, the header gets its own background so text never runs under it.
    const top = () => header.classList.toggle('is-scrolled', scrollY > 2);
    addEventListener('scroll', top, { passive: true });
    requestAnimationFrame(() => setTimeout(top)); // after first paint: reading scrollY here would force the page's first layout
  }

  // ---- Scroll story: the step crossing the middle of the screen drives the diagram.
  const story = document.querySelector('.story');
  if (story) {
    const visual = story.querySelector('.story-visual');
    const steps = [...story.querySelectorAll('.story-step')];
    const show = n => {
      visual.dataset.step = n;
      for (const s of steps) s.classList.toggle('is-current', s.dataset.step === n);
    };
    story.classList.add('story-live');
    // The page loads on the last step (the no-JS state); jump to the first without a fade.
    visual.classList.add('no-fade');
    show('1');
    requestAnimationFrame(() => requestAnimationFrame(() => visual.classList.remove('no-fade')));
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) show(e.target.dataset.step);
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  }

})();
