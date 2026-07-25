// All runtime behaviour for the site. One rAF loop, one observer, no libraries.

/* Tuple, not string[]: a fixed length lets the modulo below resolve to a string
   rather than string | undefined. */
const PALETTE = ['#d6ff3f', '#ff5d3a', '#5cc8ff', '#f5f5f0'] as const;
const LERP_CURSOR = 0.14;
const LERP_AURA = 0.045;
const MAGNET_REACH = 420;

/* Generic so each call site names what it expects, rather than widening to Element
   and forcing casts later. Returns null when absent, which every caller checks. */
const $ = <T extends Element = HTMLElement>(sel: string): T | null =>
  document.querySelector<T>(sel);

/* Real zone abbreviation (IST, CEST, PDT) where the browser has one for the
   visitor. Chrome only returns it under a matching locale, so try a few. */
function zoneLabel(): string {
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {}

  const hints: Record<string, string> = {
    Asia: 'en-IN', Europe: 'en-GB', Australia: 'en-AU',
    America: 'en-US', Africa: 'en-ZA', Pacific: 'en-NZ',
  };
  const region = tz.split('/')[0] ?? '';
  const candidates: string[] = [navigator.language, hints[region], 'en-GB', 'en-US'].filter(
    (l): l is string => typeof l === 'string' && l.length > 0
  );

  for (const loc of candidates) {
    try {
      const parts = new Intl.DateTimeFormat(loc, {
        timeZone: tz || undefined,
        timeZoneName: 'short',
      }).formatToParts(new Date());
      const val = (parts.find((p) => p.type === 'timeZoneName') || {}).value || '';
      if (val && !/^(GMT|UTC)/i.test(val)) return val;
    } catch {}
  }
  if (tz) {
    const city = tz.split('/').pop();
    if (city) return city.replace(/_/g, ' ');
  }
  const off = -new Date().getTimezoneOffset() / 60;
  return 'utc' + (off >= 0 ? '+' : '') + off;
}

function startClock(): void {
  const clock = $('[data-clock]');
  const zone = $('[data-zone]');
  if (zone) zone.textContent = zoneLabel();
  if (!clock) return;
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  };
  tick();
  setInterval(tick, 1000);
}

function startReveals(): void {
  const items = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!items.length) return;

  // Only hide what is still below the fold, so above-the-fold content never flashes.
  items.forEach((el) => {
    if (el.getBoundingClientRect().top > window.innerHeight * 0.92) el.classList.add('is-hidden');
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.remove('is-hidden');
        io.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  items.forEach((el) => io.observe(el));

  /* Safety net. The negative bottom rootMargin pulls the trigger line ~12% up from
     the foot of the viewport, so anything still below that line at maximum scroll
     can never satisfy the observer and stays hidden forever. The contact pills
     landed exactly there once the Work section was removed and the page got
     shorter: top 761 in an 835 viewport against a trigger at 735. Reaching the end
     of the document releases whatever is left, so nothing can be stranded. */
  const flush = () => {
    const atEnd =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (!atEnd) return;
    items.forEach((el) => {
      el.classList.remove('is-hidden');
      io.unobserve(el);
    });
    window.removeEventListener('scroll', flush);
  };
  window.addEventListener('scroll', flush, { passive: true });
  flush();
}

function startAccentCycling(): void {
  let i = 0;
  const cycle = () => {
    i = (i + 1) % PALETTE.length;
    document.documentElement.style.setProperty('--acc', PALETTE[i % PALETTE.length] ?? PALETTE[0]);
    const egg = $('[data-egg]');
    if (egg) egg.textContent = 'nice. keep going';
  };
  const trigger = $<HTMLButtonElement>('[data-accent-toggle]');
  if (trigger) trigger.addEventListener('click', cycle);
  window.addEventListener('keydown', (e) => {
    // Bare "v" only. Without this, Cmd/Ctrl+V recolours the site on every paste.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'v' || e.key === 'V') cycle();
  });
}

/* mailto is unreliable — plenty of visitors have no mail client wired up, so the
   big address copies instead. The href stays a real mailto, so right-click,
   middle-click and the no-JS path all still behave. */
function startCopyEmail(): void {
  const link = $<HTMLAnchorElement>('[data-copy-email]');
  const note = $('[data-copy-note]');
  if (!link) return;
  const original = note ? (note.textContent ?? '') : '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const confirm = () => {
    if (!note) return;
    note.textContent = 'copied. go write something nice';
    note.classList.add('copied');
    clearTimeout(timer);
    timer = setTimeout(() => {
      note.textContent = original;
      note.classList.remove('copied');
    }, 2200);
  };

  // execCommand fallback for insecure origins, where navigator.clipboard is absent.
  const legacy = (addr: string): void => {
    const ta = document.createElement('textarea');
    ta.value = addr;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {}
    ta.remove();
    confirm();
  };

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const addr = link.getAttribute('data-copy-email');
    if (!addr) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(confirm, () => legacy(addr));
    } else {
      legacy(addr);
    }
  });
}

/* Sector timing. Three sectors, because a lap has three: each is a third of the
   scrollable range, so the strip is a real position readout rather than four
   arbitrary section widths. Leaving a sector sets it, and the quickest sector of
   the visit goes purple. That is the one piece of F1 grammar a fan needs no
   explanation for, and it degrades to an ordinary progress bar for everyone else.
   Timing starts on first scroll, not on load, so leaving the tab parked on the
   hero does not bank a fake 40-second sector one. */
const SECTORS = 3;

/** What startSectorTiming hands back to the motion loop. */
interface SectorTiming {
  readonly update: () => void;
  readonly layout: () => void;
  readonly begin: () => void;
}

/** One sector row: its element, its fill, and its best time this visit. */
interface Cell {
  readonly el: HTMLElement;
  readonly fill: HTMLElement;
  /** Best time for this sector, ms. 0 until first set. */
  pb: number;
  lastWasPb: boolean;
  set: boolean;
}

function startSectorTiming(): SectorTiming | null {
  const track = $<HTMLElement>('[data-sectors]');
  if (!track) return null;

  const car = $<HTMLElement>('[data-car]');
  const wheels = car ? Array.from(car.querySelectorAll<SVGElement>('[data-wheel]')) : [];
  let carSpan = 0;
  let rollPerPx = 0;

  const cells: Cell[] = Array.from(track.querySelectorAll<HTMLElement>('.sector'))
    .map((el): Cell | null => {
      const fill = el.querySelector<HTMLElement>('.sector-fill');
      return fill ? { el, fill, pb: 0, lastWasPb: false, set: false } : null;
    })
    .filter((c): c is Cell => c !== null);
  if (!cells.length) return null;

  let maxScroll = 0;
  let current = -1;
  let enteredAt = 0;
  let started = false;

  const layout = () => {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    // Cached: the car's travel is the viewport less its own width, so the nose
    // lands exactly on the right edge at the end of the lap.
    if (car) {
      carSpan = Math.max(0, window.innerWidth - car.offsetWidth);
      /* Degrees of wheel rotation per pixel the car travels, so the tyres roll
         rather than spin: the wheel is r18 in a 280-wide viewBox, so its rendered
         radius scales with the rendered car, and one circumference of travel is
         exactly one revolution. Tie this to scroll distance instead and the wheels
         spin faster than the car moves, which reads as wheelspin. */
      const r = 18 * (car.offsetWidth / 280);
      rollPerPx = r > 0 ? 360 / (2 * Math.PI * r) : 0;
    }
  };

  /* Ranked against each other rather than against a fixed threshold, so the strip
     re-sorts on every completed sector: purple quickest, yellow slowest, green in
     the middle. This is why setting a time in sector two can recolour sector one, and
     it is the point rather than a glitch. With one sector set it is simply green;
     with two, the quicker is purple and the other yellow. */
  const recolour = () => {
    const done = cells
      .filter((c) => c.set)
      .map((cell) => ({ cell, t: cell.pb }))
      .sort((a, b) => a.t - b.t);

    for (const c of cells) c.el.classList.remove('t-fast', 't-mid', 't-slow');
    const first = done[0];
    const last = done[done.length - 1];
    if (!first || !last) return;

    /* Carrying the cell rather than its index means every access here is provably
       defined, which indexing a parallel array is not. */
    first.cell.el.classList.add('t-fast');
    if (done.length > 1) last.cell.el.classList.add('t-slow');
    for (const d of done.slice(1, -1)) d.cell.el.classList.add('t-mid');
  };

  const update = () => {
    // A page shorter than the viewport has no sectors to time; show it complete.
    const p = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 1;
    const scaled = p * SECTORS;

    cells.forEach((c, i) => {
      c.fill.style.width = Math.max(0, Math.min(1, scaled - i)) * 100 + '%';
    });

    if (car) {
      const x = p * carSpan;
      car.style.transform = 'translate3d(' + x + 'px,0,0)';
      const deg = x * rollPerPx;
      for (const w of wheels) {
        const cx = w.getAttribute('data-wheel') === 'rear' ? 55 : 235;
        w.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' ' + cx + ' 32)');
      }
    }

    const idx = Math.min(SECTORS - 1, Math.floor(scaled));
    if (idx !== current) {
      if (current > -1 && started) {
        const c = cells[current];
        if (!c) return;
        const t = performance.now() - enteredAt;
        // Only credit a sector actually read, not one flown past while dragging
        // the scrollbar, which would set an unbeatable 80ms best every time.
        if (t > 400) {
          // First run through a sector is a personal best by definition.
          c.lastWasPb = c.pb === 0 || t < c.pb;
          if (c.lastWasPb) c.pb = t;
          c.set = true;
          recolour();
        }
      }
      current = idx;
      enteredAt = performance.now();
    }
  };

  const begin = () => {
    if (started) return;
    started = true;
    enteredAt = performance.now();
  };

  layout();
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); update(); });
  return { update, layout, begin };
}

/* Loitering. Do nothing on the hero for twenty seconds and the stewards notice. It
   re-arms on any input, and declines to fire once you have scrolled away, since
   penalising someone for actually reading is the wrong joke. */
function startPenalty(): void {
  const box = $('[data-penalty]');
  if (!box) return;
  let idle: ReturnType<typeof setTimeout> | undefined;
  let clear: ReturnType<typeof setTimeout> | undefined;

  const arm = () => {
    clearTimeout(idle);
    clearTimeout(clear);
    box.classList.remove('on');
    idle = setTimeout(() => {
      if (window.scrollY > window.innerHeight * 0.6) return arm();
      box.textContent = 'stewards: 5 second time penalty. loitering.';
      box.classList.add('on');
      clear = setTimeout(() => box.classList.remove('on'), 4600);
    }, 20000);
  };

  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'wheel'].forEach((e) =>
    window.addEventListener(e, arm, { passive: true })
  );
  arm();
}

/* Section nav for narrow screens. The links used to be display: none below 720px,
   so phones had no way to reach a section at all. Closes on selection and on Escape,
   and keeps aria-expanded in step so it is a real disclosure to assistive tech. */
function startNav(): void {
  const bar = document.querySelector('nav');
  const btn = $<HTMLButtonElement>('[data-nav-toggle]');
  if (!bar || !btn) return;

  const set = (open: boolean): void => {
    bar.toggleAttribute('data-open', open);
    btn.setAttribute('aria-expanded', String(open));
  };

  btn.addEventListener('click', () => set(!bar.hasAttribute('data-open')));
  bar.querySelectorAll('#nav-links a').forEach((a) =>
    a.addEventListener('click', () => set(false))
  );
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
  });
}

function startMotion(): void {
  const ring = $<HTMLElement>('[data-cursor-ring]');
  const dot = $<HTMLElement>('[data-cursor-dot]');
  const aura = $<HTMLElement>('[data-aura]');
  const sectors = startSectorTiming();

  /* The cursor ring, dot and aura are pointer-device flourishes. The timing strip
     is not: it is the page's progress indicator, and gating the whole loop behind
     (hover: hover) is why phones previously had no progress bar at all. */
  const pointerFx = window.matchMedia('(hover: hover)').matches;
  const letters = Array.from(document.querySelectorAll<HTMLElement>('[data-kin]'));

  const mouse = { x: -999, y: -999 };
  const ringPos = { x: -999, y: -999 };
  const auraPos = { x: -999, y: -999 };

  /* Geometry is measured once and cached rather than read per frame. Two reasons.
     getBoundingClientRect() and scrollHeight both force a synchronous layout, so
     reading them for every letter on every frame meant ~10 layout flushes at
     60fps forever. And the rect of a transformed element reports the *moved* box,
     so the magnet was feeding its own displacement back into its input: it
     settled near an 11% pull where the constant asks for 10%, with a distorted
     falloff curve. Caching resting centres in document space fixes both. */
  /** Resting centre of each letter, in document space. */
  interface Base { readonly x: number; readonly y: number; }
  let bases: Base[] = [];
  let lettersBottom = 0;
  let pulled = false;
  const lastTf = new Array(letters.length).fill('');

  const measure = () => {
    // Clear transforms first so we capture resting positions, not pulled ones.
    letters.forEach((el) => {
      el.style.transform = '';
    });
    const sx = window.scrollX;
    const sy = window.scrollY;
    bases = letters.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 + sx, y: r.top + r.height / 2 + sy };
    });
    lettersBottom = bases.reduce((m, b) => Math.max(m, b.y), 0) + MAGNET_REACH;
    if (sectors) sectors.layout();
    lastTf.fill('');
    pulled = false;
  };

  const move = (el: HTMLElement | null, x: number, y: number): void => {
    if (el) el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  };

  /* The loop parks itself once everything has caught up, and any input wakes it.
     Someone who has stopped moving the pointer to actually read the page should
     cost nothing, rather than 60 wasted frames a second until the tab closes. */
  let running = false;
  let nudged = false;

  const wake = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  };

  const frame = () => {
    const scrolledOrResized = nudged;
    nudged = false;

    if (pointerFx) {
    ringPos.x += (mouse.x - ringPos.x) * LERP_CURSOR;
    ringPos.y += (mouse.y - ringPos.y) * LERP_CURSOR;
    auraPos.x += (mouse.x - auraPos.x) * LERP_AURA;
    auraPos.y += (mouse.y - auraPos.y) * LERP_AURA;

    const visible = mouse.x > -900 ? '1' : '0';
    move(ring, ringPos.x, ringPos.y);
    move(dot, mouse.x, mouse.y);
    move(aura, auraPos.x, auraPos.y);
    if (ring) ring.style.opacity = visible;
    if (dot) dot.style.opacity = visible;
    }

    if (sectors) sectors.update();

    const sx = window.scrollX;
    const sy = window.scrollY;

    if (sy < lettersBottom) {
      for (let i = 0; i < letters.length; i++) {
        const el = letters[i];
        const b = bases[i];
        /* Both arrays are filled together in measure(), so this only guards against a
           letter added to the DOM after the last measure. */
        if (!el || !b) continue;
        const dx = mouse.x - (b.x - sx);
        const dy = mouse.y - (b.y - sy);
        const dist = Math.hypot(dx, dy);
        const k = dist < MAGNET_REACH ? Math.pow(1 - dist / MAGNET_REACH, 2) : 0;
        const tx = -dx * 0.1 * k;
        const ty = -dy * 0.16 * k;
        const tf = 'translate3d(' + tx + 'px,' + ty + 'px,0) rotate(' + tx * 0.03 + 'deg)';
        // Skip the write when nothing moved, so idle letters cost no style work.
        if (tf !== lastTf[i]) {
          el.style.transform = tf;
          lastTf[i] = tf;
        }
      }
      pulled = true;
    } else if (pulled) {
      // Released once on the way out rather than re-cleared every frame.
      letters.forEach((el) => {
        el.style.transform = '';
      });
      lastTf.fill('');
      pulled = false;
    }

    const settled =
      !pointerFx ||
      Math.abs(mouse.x - ringPos.x) < 0.25 &&
      Math.abs(mouse.y - ringPos.y) < 0.25 &&
      Math.abs(mouse.x - auraPos.x) < 0.25 &&
      Math.abs(mouse.y - auraPos.y) < 0.25;

    if (settled && !scrolledOrResized) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  };

  if (pointerFx) {
    window.addEventListener(
      'mousemove',
      (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        wake();
      },
      { passive: true }
    );
  }
  window.addEventListener(
    'scroll',
    () => {
      if (sectors) sectors.begin();
      nudged = true;
      wake();
    },
    { passive: true }
  );
  window.addEventListener('resize', () => {
    measure();
    nudged = true;
    wake();
  });

  measure();
  /* Webfonts land after first paint under font-display: swap, and the hero name
     is set in Syne, so the letters reflow when it swaps in. Without this the
     cached centres describe the fallback's metrics and the magnet pulls toward
     the wrong spot for the life of the page. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  wake();
}

export function init(): void {
  // The CSS reduced-motion block only flattens durations; the pointer loop is JS,
  // and it is the tracking cursor, the drifting aura, and the letters that lunge
  // at the mouse. Those are exactly what the setting is asking us to stop.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  startClock();
  startAccentCycling();
  // Not motion, so it runs regardless of the reduced-motion preference.
  startCopyEmail();
  // Navigation, not motion: it runs regardless of the reduced-motion preference.
  startNav();
  // Not motion, so it runs regardless of the reduced-motion preference.
  startPenalty();
  // Skipped when reduced, so nothing is ever left hidden waiting on a reveal.
  if (!reduced) startReveals();
  // Always run: the loop owns the timing strip, and decides internally whether
  // the cursor flourishes apply. Reduced motion still opts out of the lot.
  if (!reduced) startMotion();
}
