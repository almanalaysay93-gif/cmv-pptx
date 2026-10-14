(() => {
  // Reduced motion: hold the particle layer still.
  const particles = document.querySelector('.particles');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelectorAll('.particles, .virus-bg').forEach((v) => v.pause());
  // Split each title into words, so CSS can reveal them one by one.
  document.querySelectorAll('.title').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.style.setProperty('--i', i);
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  const deck = document.getElementById('deck');
  const stage = document.getElementById('stage');
  const dots = document.getElementById('dots');
  const counter = document.getElementById('counter');
  const hint = document.getElementById('hint');
  const slides = Array.from(stage.querySelectorAll('.slide'));
  const N = slides.length;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // Phones and reduced motion read as a normal page; no pinning or key steps.
  // Phones, portrait tablets and reduced motion read as a normal page; no pinning or key steps.
  const flatQuery = window.matchMedia('(max-width: 1023px), (orientation: portrait), (prefers-reduced-motion: reduce)');
  // The layout mode is set once at load. Rotating a tablet or resizing across the breakpoint reloads the page.
  flatQuery.addEventListener('change', () => location.reload());
  if (flatQuery.matches) return;

  // The particle video loads only for the pinned deck, to save data on phones.
  if (particles && particles.dataset.src) particles.src = particles.dataset.src;

  // Galleries with four or more photos spin around as a ring.
  document.querySelectorAll('.gallery').forEach((gallery) => {
    const cells = Array.from(gallery.children).filter((el) => el.classList.contains('cell'));
    if (cells.length < 4) return; // only galleries of four or more photos rotate
    const n = cells.length;
    // Photos never overlap: the chord between neighbours must fit the photo width.
    const radius = 25;                                              // vw, the ring fills the bottom of the slide
    // Few photos: each one can be much larger, so the cap grows as the count drops.
    const width = Math.min(n <= 3 ? 34 : 22, (2 * 25 * Math.sin(Math.PI / n)) * 0.98);
    gallery.classList.add('ring');
    gallery.closest('.slide').classList.add('ring-slide');
    gallery.style.setProperty('--r', `${radius.toFixed(2)}vw`);
    gallery.style.setProperty('--cw', `${width.toFixed(2)}vw`);
    const stage = document.createElement('div');
    stage.className = 'ring-stage';
    cells.forEach((cell, i) => {
      const item = document.createElement('div');
      item.className = 'ring-item';
      item.style.setProperty('--a', `${((360 / n) * i).toFixed(2)}deg`);
      cell.parentNode.insertBefore(item, cell);
      item.appendChild(cell);
      stage.appendChild(item);
    });
    gallery.appendChild(stage);
  });

  // One viewport of scroll per slide, so the stage stays pinned between slides.
  deck.style.height = `${N * 100}vh`;

  const rangeOf = () => deck.offsetHeight - window.innerHeight;
  const topOf = (i) => deck.offsetTop + (rangeOf() * i) / (N - 1);
  const slideAt = () => clamp(Math.round(((window.scrollY - deck.offsetTop) / rangeOf()) * (N - 1)), 0, N - 1);

  // Navigation dots.
  const buttons = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Go to slide ${i + 1} of ${N}`);
    b.addEventListener('click', () => goTo(i));
    dots.appendChild(b);
    return b;
  });

  // Per-slide hooks, read once.
  const parts = slides.map((slide) => ({
    slide,
    copy: slide.querySelector('.copy'),
    lines: Array.from(slide.querySelectorAll('[data-line]')),
    layers: Array.from(slide.querySelectorAll('.cell[data-depth]')),
    rows: Array.from(slide.querySelectorAll('.glass-table tbody tr')),
    bars: Array.from(slide.querySelectorAll('[data-bar]')),
  }));

  // Numbers that roll up to their value when their slide arrives.
  const rollers = Array.from(document.querySelectorAll('.num-cell, .bars b, .cards-3 b, .big .num'))
    .map((el) => {
      const m = el.textContent.trim().match(/^(\d+(?:\.(\d+))?)(%?)$/);
      if (!m) return null;
      return { el, to: parseFloat(m[1]), dec: (m[2] || '').length, suffix: m[3], slide: el.closest('.slide') };
    })
    .filter(Boolean);

  function rollSlide(slide) {
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    rollers.filter((r) => r.slide === slide).forEach((r) => {
      cancelAnimationFrame(r.frame);
      const start = performance.now();
      const step = (now) => {
        const t = clamp((now - start) / 1400);
        r.el.textContent = (r.to * ease(t)).toFixed(r.dec) + r.suffix;
        if (t < 1) r.frame = requestAnimationFrame(step);
      };
      step(start);
    });
  }

  // Pointer parallax: -1..1 across the viewport.
  let px = 0;
  let py = 0;
  window.addEventListener('pointermove', (e) => {
    px = (e.clientX / window.innerWidth) * 2 - 1;
    py = (e.clientY / window.innerHeight) * 2 - 1;
    request();
  }, { passive: true });

  // A virus particle: round body, a crown of spikes, a knob on each spike tip.
  const VIRUS_SVG = (() => {
    const c = 150;
    const spikes = 26;
    let s = '';
    for (let i = 0; i < spikes; i++) {
      const a = (i * 2 * Math.PI) / spikes;
      const x1 = c + Math.cos(a) * 92;
      const y1 = c + Math.sin(a) * 92;
      const x2 = c + Math.cos(a) * 138;
      const y2 = c + Math.sin(a) * 138;
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      s += `<circle cx="${(c + Math.cos(a) * 146).toFixed(1)}" cy="${(c + Math.sin(a) * 146).toFixed(1)}" r="10"/>`;
    }
    return `<svg class="virus" viewBox="0 0 300 300" aria-hidden="true">
      <g class="virus-spikes">${s}</g>
      <circle class="virus-body" cx="${c}" cy="${c}" r="92"/>
      <circle class="virus-core" cx="${c}" cy="${c}" r="44"/>
    </svg>`;
  })();

  // Motion graphics per slide: a drifting glow, a turning ring and a scan line.
  parts.forEach((p, i) => {
    const fx = document.createElement('div');
    fx.className = 'fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<span class="fx-orb"></span><span class="fx-ring"></span><span class="fx-scan"></span><span class="fx-dots"></span>';
    fx.querySelector('.fx-ring').innerHTML = VIRUS_SVG;
    p.slide.prepend(fx);
    p.fx = fx;
    p.fxOrb = fx.querySelector('.fx-orb');
    p.fxRing = fx.querySelector('.fx-ring');
    p.fxScan = fx.querySelector('.fx-scan');
  });

  let ticking = false;
  let lastActive = -1;
  let target = 0;   // slide the deck is on or moving to
  let tween = null; // active key-step animation

  function render() {
    ticking = false;
    const pos = clamp((window.scrollY - deck.offsetTop) / rangeOf()) * (N - 1);

    parts.forEach((p, i) => {
      const o = i - pos;
      const d = Math.abs(o);
      const slide = p.slide;

      slide.style.setProperty('--o', o.toFixed(4));
      slide.style.visibility = d > 0.98 ? 'hidden' : 'visible';

      if (p.copy) p.copy.style.opacity = clamp(1 - d * 1.3).toFixed(3);

      // Words build one line at a time.
      p.lines.forEach((el, k) => {
        // The stagger between lines only applies while the slide is moving, so settled text is fully sharp.
        const r = clamp(1 - d * 1.8 - k * 0.05 * clamp(d * 4));
        const dir = k % 2 === 0 ? -1 : 1;                   // alternate sides
        const x = (1 - r) * 70 * dir;
        const s = 0.94 + 0.06 * r;
        // Text stays flat and sharp once settled; only the move and fade run on it.
        el.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0) scale(${s.toFixed(4)})`;
        el.style.opacity = r.toFixed(3);
        el.style.filter = r > 0.995 ? 'none' : `blur(${((1 - r) * 8).toFixed(2)}px)`;
      });

      // Photo cells drift a little in their own depth layers.
      p.layers.forEach((el) => {
        const depth = parseFloat(el.dataset.depth) || 0;
        const x = -o * depth * 60;
        const y = -o * depth * 14;
        const z = -d * depth * 160;
                el.style.transform = `translate3d(${(x + px * depth * 26).toFixed(1)}px, ${(y + py * depth * 18).toFixed(1)}px, ${z.toFixed(1)}px)`;
        el.style.opacity = clamp(1 - d * 1.3).toFixed(3);
        const open = clamp(1 - d * 1.2);                    // 1 = fully open
        const side = (i % 2 === 0) ? 'left' : 'right';      // alternate the iris side
        const inset = (1 - open) * 22;
        el.style.clipPath = `inset(${inset.toFixed(2)}% ${side === 'left' ? 0 : inset.toFixed(2)}% ${inset.toFixed(2)}% ${side === 'left' ? inset.toFixed(2) : 0}% round ${(open < 1 ? 28 : 16)}px)`;
      });

      // Motion graphics: each layer moves at its own depth.
      if (p.fx) {
        p.fxOrb.style.transform = `translate3d(${(o * -160 + px * 50).toFixed(1)}px, ${(py * 30).toFixed(1)}px, ${(-d * 200).toFixed(1)}px)`;
        p.fxRing.style.transform = `translate3d(${(o * 120 + px * 60).toFixed(1)}px, ${(py * 40).toFixed(1)}px, ${(-d * 300).toFixed(1)}px) rotateX(${(64 + py * 12).toFixed(2)}deg)`;
      }

      // Table rows drop in one after another.
      p.rows.forEach((tr, k) => {
        const r = clamp(1 - d * 1.6 - k * 0.07);
        tr.style.transform = `translate3d(0, ${((1 - r) * -34).toFixed(1)}px, 0)`;
        tr.style.opacity = r.toFixed(3);
      });

      // Bars fill while their slide is on stage.
      const reveal = clamp(1 - d * 1.5);
      p.bars.forEach((li) => {
        const fill = parseFloat(li.dataset.bar) / 100;
        li.style.setProperty('--fill', (fill * reveal).toFixed(4));
        const label = li.querySelector('b');
        if (label) label.style.opacity = clamp(reveal * 1.2).toFixed(3);
      });

    });

    const active = Math.round(pos);
    if (active !== lastActive) {
      lastActive = active;
      buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === active)));
      slides.forEach((s, i) => { s.dataset.active = String(i === active); });
      counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
      rollSlide(slides[active]);
    }
    if (hint) hint.classList.toggle('is-gone', pos > 0.5);
  }

  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  // Ease the page to one slide. Each key press moves exactly one slide.
  function goTo(index) {
    target = clamp(index, 0, N - 1);
    const from = window.scrollY;
    const to = topOf(target);
    if (Math.abs(to - from) < 1) return;
    const duration = Math.min(900, 380 + Math.abs(to - from) * 0.12);
    const start = performance.now();
    const id = {};
    tween = id;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = () => {
      if (tween !== id) return; // a newer press took over
      const t = clamp((performance.now() - start) / duration);
      window.scrollTo(0, from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else tween = null;
    };
    step();
  }

  window.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.querySelector('dialog[open]')) return; // viewer owns the keys
    const el = e.target;
    if (el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable)) return;

    let step = 0;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        step = 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        step = -1;
        break;
      case 'Home': e.preventDefault(); goTo(0); return;
      case 'End': e.preventDefault(); goTo(N - 1); return;
      default: return;
    }
    e.preventDefault();
    // A running step continues from its target, so quick presses each count.
    const base = tween ? target : slideAt();
    goTo(base + step);
  });

  window.addEventListener('scroll', () => {
    if (!tween) target = slideAt();
    request();
  }, { passive: true });
  window.addEventListener('resize', request);
  // Safety net: if the text in a panel is taller than the panel, scale that panel's text down until it fits.
  function fitPanels() {
    document.querySelectorAll('.slide .head, .slide .text').forEach((panel) => {
      let fit = 1;
      panel.style.setProperty('--fit', '1');
      while (panel.scrollHeight > panel.clientHeight + 1 && fit > 0.6) {
        fit -= 0.04;
        panel.style.setProperty('--fit', fit.toFixed(2));
      }
    });
  }
  fitPanels();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPanels);
  window.addEventListener('load', fitPanels);
  window.addEventListener('resize', fitPanels);

  // Deep link for review: index.html#slide=N opens slide N.
  const deep = location.hash.match(/slide=(\d+)/);
  if (deep) window.scrollTo(0, topOf(clamp(parseInt(deep[1], 10) - 1, 0, N - 1)));
  render();
})();
