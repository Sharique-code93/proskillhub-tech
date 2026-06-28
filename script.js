/* site script: accessible nav, reveal animations, hero effects, upcoming events sliding */

/* =========================
Utility helpers
========================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

const isReducedMotion =
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* =========================
NAVIGATION MODULE
========================= */
(function initNav() {
  const navToggle = $('.nav-toggle');
  const nav = $('.site-nav');
  const navList = nav?.querySelector('ul');
  if (!navToggle || !nav || !navList) return;

  const navId = navList.id || `site-nav-list`;
  navList.id = navId;

  navToggle.setAttribute('aria-controls', navId);
  navToggle.setAttribute('aria-expanded', 'false');

  const focusableSelector =
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const getFocusable = () => $$(focusableSelector, nav);

  function openNav() {
    nav.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('nav-open');

    const first = getFocusable()[0];
    if (first) first.focus();

    document.addEventListener('focus', trapFocus, true);
  }

  function closeNav(returnFocus = true) {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('nav-open');

    document.removeEventListener('focus', trapFocus, true);

    if (returnFocus) navToggle.focus();
  }

  function trapFocus(e) {
    if (!nav.classList.contains('open')) return;
    if (!nav.contains(e.target) && e.target !== navToggle) {
      e.stopPropagation();
      const first = getFocusable()[0];
      if (first) first.focus();
    }
  }

  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeNav() : openNav();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeNav();
  });
})();


/* =========================
FADE UP ANIMATION
========================= */
(function initFadeUp() {
  const fadeElements = $$('.fade-up');
  if (!fadeElements.length) return;

  if (isReducedMotion) {
    fadeElements.forEach(el => el.classList.add('show'));
    return;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        el.classList.add('show');

        obs.unobserve(el);
      });
    }, { threshold: 0.12 });

    fadeElements.forEach(el => observer.observe(el));
  }
})();


/* =========================
HERO EFFECTS
========================= */
(function heroEffects() {
  const heroImg = $('.hero-right img');
  const cta = $('.btn.primary');

  if (heroImg && !isReducedMotion) {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = heroImg.getBoundingClientRect();
        const center = window.innerHeight / 2;
        const dist = rect.top + rect.height / 2 - center;

        const shift = Math.max(-12, Math.min(12, -dist * 0.02));

        heroImg.style.transform =
          `translateY(${shift}px) scale(${1 + Math.abs(shift) * 0.0008})`;

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (cta && !isReducedMotion) {
    setTimeout(() => cta.classList.add('pulse'), 1200);
  }
})();


/* =========================
UPCOMING EVENTS
========================= */
(function initUpcomingEvents() {
  const eventCards = $$('.events-grid .event-card');
  if (!eventCards.length) return;

  eventCards.forEach((el, i) => {
    el.classList.add(i % 2 === 0 ? 'dir-left' : 'dir-right');
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const all = Array.from(document.querySelectorAll('.event-card'));
        const idx = all.indexOf(el);

        el.classList.add(`stagger-${Math.min(8, idx + 1)}`);
        el.classList.add('slide-in');

        obs.unobserve(el);
      });
    }, { threshold: 0.12 });

    eventCards.forEach(el => observer.observe(el));
  }
})();


/* =========================
PREVENT HORIZONTAL SCROLL
========================= */
document.documentElement.style.overflowX = 'hidden';
document.body.style.overflowX = 'hidden';


/* =========================
BACKGROUND PARTICLE NETWORK (ONLY ONE - CLEAN VERSION)
========================= */
(function initBackgroundVisual() {

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });

  let width = 0;
  let height = 0;
  let particles = [];

  const PARTICLE_COUNT =
    Math.max(18, Math.floor((window.innerWidth * window.innerHeight) / 90000));

  const MAX_DIST = 140;

  const isReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = canvas.clientWidth = window.innerWidth;
    height = canvas.clientHeight = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createParticles() {
    particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.08, 0.08),
        r: rand(1.6, 3.2),
        hue: rand(200, 220),
        alpha: rand(0.18, 0.42)
      });
    }
  }

  function update() {
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let p of particles) {
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {

        const a = particles[i];
        const b = particles[j];

        const dx = a.x - b.x;
        const dy = a.y - b.y;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAX_DIST) {
          const t = 1 - dist / MAX_DIST;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(30,58,138,${0.06 * t})`;
          ctx.lineWidth = 1 * t;

          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  let last = performance.now();
  let raf;

  function loop(now) {
    const dt = Math.min(60, now - last) / 16.66;
    last = now;

    update(dt);
    draw();

    raf = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    createParticles();

    if (!isReducedMotion) {
      raf = requestAnimationFrame(loop);
    } else {
      draw();
    }
  }

  window.addEventListener('resize', () => {
    clearTimeout(window.__bgResize);
    window.__bgResize = setTimeout(() => {
      resize();
      createParticles();
    }, 120);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!isReducedMotion) loop(performance.now());
  });

  start();

})();
