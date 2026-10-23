// Home page motion: the device fabric (WebGL), the scroll story, the instruments and the vision parallax.
// Everything here is decoration on top of complete HTML: with no JS, no WebGL or reduced motion the page
// reads the same, and each piece rests in its final state.
(() => {
  'use strict';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Device fabric: a dot field where paired devices glow and a request travels between two of them.
  const canvas = document.querySelector('.fabric-canvas');
  const gl = canvas && canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  if (gl) {
    const vert = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    // Nodes live in a 0..1 square on the right of the hero; node 0 is the laptop, node 1 the Mac.
    const frag = `precision mediump float;
uniform vec2 res;uniform float t;uniform vec2 ptr;uniform float drift;
const vec3 FOREST=vec3(.090,.157,.118);const vec3 DOT=vec3(.20,.30,.24);const vec3 LIME=vec3(.725,.988,.424);
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float k=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*k);}
vec2 node(int i){
  if(i==0)return vec2(.80,.30);if(i==1)return vec2(.56,.62);if(i==2)return vec2(.93,.74);
  if(i==3)return vec2(.66,.90);if(i==4)return vec2(.44,.22);return vec2(.98,.08);}
void main(){
  vec2 px=gl_FragCoord.xy;float s=min(res.x,res.y);
  vec2 uv=(px-vec2(res.x-s*1.08,res.y*.02))/s+ptr*.015;uv.y+=drift;
  float cell=s/46.;vec2 c=floor(px/cell)*cell+cell*.5;vec2 cuv=(c-vec2(res.x-s*1.08,res.y*.02))/s+ptr*.015;cuv.y+=drift;
  float field=n(cuv*5.+vec2(t*.05,-t*.03));
  float glow=0.;
  for(int i=0;i<6;i++){float d=length(cuv-node(i));glow+=exp(-d*d*(i<2?55.:120.))*(i<2?1.:.45);}
  float link=0.;float pulse=0.;
  float d01=seg(cuv,node(0),node(1));link+=exp(-d01*d01*9000.);
  float k=fract(t*.18);vec2 pk=mix(node(0),node(1),smoothstep(0.,.85,k));pulse+=exp(-pow(length(cuv-pk),2.)*1800.)*step(k,.9);
  for(int i=2;i<6;i++){float d=seg(cuv,node(1),node(i));link+=exp(-d*d*20000.)*.28;}
  float dotr=length(px-c)/cell;float dotm=smoothstep(.16,.06,dotr);
  float lit=clamp(.16+field*.22+glow*.9+link*.8+pulse*2.,0.,1.);
  vec3 col=mix(DOT,LIME,clamp(glow*.9+pulse*1.6+link*.5,0.,1.));
  float halo=exp(-pow(length(uv-node(0)),2.)*14.)*.10+exp(-pow(length(uv-node(1)),2.)*14.)*.14;
  vec3 bg=FOREST+LIME*halo*.35;
  gl_FragColor=vec4(mix(bg,col,dotm*lit),1.);
}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, vert), fs = sh(gl.FRAGMENT_SHADER, frag);
    const prog = vs && fs && gl.createProgram();
    if (prog) {
      gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    }
    if (prog && gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = name => gl.getUniformLocation(prog, name);
      const uRes = u('res'), uT = u('t'), uPtr = u('ptr'), uDrift = u('drift');
      const ptr = [0, 0], target = [0, 0];
      const NODES = [[.80, .30], [.56, .62]];
      const tags = [...document.querySelectorAll('.fabric-tag')];
      // Same mapping as the shader, in CSS pixels from the top left.
      const place = drift => {
        const w = canvas.clientWidth, h = canvas.clientHeight, s = Math.min(w, h);
        tags.forEach((tag, i) => {
          const [nx, ny] = NODES[i];
          const x = w - s * 1.08 + (nx - ptr[0] * .015) * s;
          const y = h - (h * .02 + (ny - ptr[1] * .015 - drift) * s);
          tag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        });
      };
      let visible = true, raf = 0, start = performance.now();
      const size = () => {
        // ponytail: fixed 1.25 DPR cap keeps the fill-rate low on 4K screens; raise it if dots look soft.
        const dpr = Math.min(devicePixelRatio || 1, 1.25);
        const w = Math.round(canvas.clientWidth * dpr), hgt = Math.round(canvas.clientHeight * dpr);
        if (canvas.width !== w || canvas.height !== hgt) { canvas.width = w; canvas.height = hgt; gl.viewport(0, 0, w, hgt); }
      };
      const frame = now => {
        size();
        ptr[0] += (target[0] - ptr[0]) * .06; ptr[1] += (target[1] - ptr[1]) * .06;
        const scrolled = Math.min(1, Math.max(0, scrollY / (canvas.clientHeight || 1)));
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uT, still ? 3.2 : (now - start) / 1000);
        gl.uniform2f(uPtr, ptr[0], ptr[1]);
        gl.uniform1f(uDrift, still ? 0 : scrolled * .12);
        place(still ? 0 : scrolled * .12);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        raf = !still && visible && !document.hidden ? requestAnimationFrame(frame) : 0;
      };
      const resume = () => { if (!raf && !still && visible && !document.hidden) raf = requestAnimationFrame(frame); };
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; resume(); }).observe(canvas);
      document.addEventListener('visibilitychange', resume);
      addEventListener('resize', () => { if (still) frame(0); });
      if (!still) addEventListener('pointermove', e => { target[0] = e.clientX / innerWidth - .5; target[1] = .5 - e.clientY / innerHeight; }, { passive: true });
      canvas.closest('.fabric').classList.add('fabric-live');
      frame(performance.now());
    }
  }

  // ---- Header: dark while the fabric is on screen, paper once it has scrolled away.
  const header = document.querySelector('.header-over-hero');
  const hero = document.querySelector('.fabric');
  if (header && hero) new IntersectionObserver(([e]) => header.classList.toggle('header-over-hero', e.isIntersecting), { rootMargin: '-76px 0px 0px 0px' }).observe(hero);

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
    show('1');
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) show(e.target.dataset.step);
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  }

  // ---- Vision: rings open as the section scrolls through the screen (--p runs 0 to 1).
  const orbit = document.querySelector('.orbit');
  if (orbit && !still) {
    let queued = false;
    const update = () => {
      queued = false;
      const r = orbit.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * .5)));
      orbit.style.setProperty('--p', p.toFixed(3));
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
})();
