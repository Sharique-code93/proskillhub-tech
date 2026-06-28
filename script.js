/* site script: accessible nav, reveal animations, hero effects, upcoming events sliding */

/* Utility helpers */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* NAVIGATION MODULE */
(function initNav() {
  const navToggle = $('.nav-toggle');
  const nav = $('.site-nav');
  const navList = nav?.querySelector('ul');
  if (!navToggle || !nav || !navList) return;

  const navId = navList.id || `site-nav-list`;
  navList.id = navId;
  navToggle.setAttribute('aria-controls', navId);
  navToggle.setAttribute('aria-expanded', navToggle.getAttribute('aria-expanded') || 'false');

  const focusableSelector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const getFocusable = () => $$(focusableSelector, nav);

  function openNav() {
    nav.classList.add('open');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('nav-open');
    const first = getFocusable()[0];
    if (first) first.focus();
    document.addEventListener('focus', trapFocus, true);
  }

  function closeNav(returnFocus = true) {
    nav.classList.remove('open');
    navToggle.classList.remove('open');
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
    if (expanded) closeNav();
    else openNav();
  });

  navToggle.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      navToggle.click();
    } else if (ev.key === 'Escape') {
      closeNav();
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && nav.classList.contains('open')) {
      closeNav();
    }
  });

  nav.addEventListener('click', (ev) => {
    const anchor = ev.target.closest('a');
    if (!anchor) return;
    if (nav.classList.contains('open')) {
      closeNav();
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 900 && nav.classList.contains('open')) {
        closeNav(false);
      }
    }, 150);
  }, { passive: true });
})();

/* INTERSECTION OBSERVER FOR FADE UP WITH STAGGER */
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
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.querySelectorAll('.fade-up'));
          const idx = siblings.indexOf(el);
          if (idx >= 0) el.classList.add(`stagger-${Math.min(6, idx + 1)}`);
        }
        el.classList.add('show');
        obs.unobserve(el);
      });
    }, { threshold: 0.12 });

    fadeElements.forEach(el => observer.observe(el));
  } else {
    fadeElements.forEach(el => el.classList.add('show'));
  }
})();

/* HERO EFFECTS MODULE */
(function heroEffects() {
  const heroRight = $('.hero-right');
  const heroImg = heroRight ? heroRight.querySelector('img') : null;
  const cta = $('.btn.primary');

  if (heroRight) {
    const heroObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          heroRight.classList.add('parallax', 'show');
        } else {
          heroRight.classList.remove('parallax', 'show');
        }
      });
    }, { threshold: 0.2 }) : null;

    if (heroObserver) heroObserver.observe(heroRight);
    else heroRight.classList.add('show');
  }

  if (heroImg && !isReducedMotion) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const rect = heroImg.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const distance = rect.top + rect.height / 2 - viewportCenter;
        const maxShift = 12;
        const shift = Math.max(-maxShift, Math.min(maxShift, -distance * 0.02));
        heroImg.style.transform = `translateY(${shift}px) scale(${1 + Math.abs(shift) * 0.0008})`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (cta && !isReducedMotion) {
    const pulseDelay = 1200;
    const pulseTimeout = setTimeout(() => cta.classList.add('pulse'), pulseDelay);
    const removePulse = () => {
      cta.classList.remove('pulse');
      clearTimeout(pulseTimeout);
    };
    cta.addEventListener('mouseenter', removePulse, { once: true });
    cta.addEventListener('focus', removePulse, { once: true });
  }
})();

/* UPCOMING EVENTS: sliding reveal with stagger and alternating directions (DE-DUPED) */
(function initUpcomingEvents() {
  const eventCards = $$('.events-grid .event-card');
  if (!eventCards.length) return;

  if (isReducedMotion) {
    eventCards.forEach(el => el.classList.add('slide-in'));
    return;
  }

  // Assign alternating directions for visual variety
  eventCards.forEach((el, i) => {
    const dir = (i % 2 === 0) ? 'dir-left' : 'dir-right';
    el.classList.add(dir);
  });

  // IntersectionObserver to slide in cards with stagger
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const all = Array.from(document.querySelectorAll('.events-grid .event-card'));
        const idx = all.indexOf(el);
        const staggerIndex = Math.min(8, idx + 1);
        el.classList.add(`stagger-${staggerIndex}`);
        requestAnimationFrame(() => {
          el.classList.add('slide-in');
        });
        obs.unobserve(el);
      });
    }, { threshold: 0.12 });

    eventCards.forEach(el => observer.observe(el));
  } else {
    eventCards.forEach((el, i) => {
      el.classList.add(`stagger-${Math.min(8, i + 1)}`, 'slide-in');
    });
  }

  // keyboard: allow Enter to "activate" card (for accessibility)
  eventCards.forEach(card => {
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        card.classList.add('focus-activated');
        setTimeout(() => card.classList.remove('focus-activated'), 600);
      }
    });
  });
})();

/* RESPECT REDUCED MOTION (fallback) */
if (isReducedMotion) {
  $$('.fade-up').forEach(el => {
    el.style.transition = 'none';
    el.classList.add('show');
  });
}

/* PREVENT HORIZONTAL OVERFLOW */
(function removeHorizontalOverflow() {
  document.documentElement.style.overflowX = 'hidden';
  document.body.style.overflowX = 'hidden';
})();

/* =========================
   Background particle network
   ========================= */
(function initBackgroundVisual() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0;
  let height = 0;
  let particles = [];
  const PARTICLE_COUNT = Math.max(18, Math.floor((window.innerWidth * window.innerHeight) / 90000)); // responsive count
  const MAX_DIST = 140; // connection distance
  const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth = window.innerWidth;
    height = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.15, 0.15),
        r: rand(1.6, 3.6),
        hue: rand(200, 220), // bluish hues
        alpha: rand(0.18, 0.42)
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // subtle background tint (very light)
    // ctx.fillStyle = 'rgba(250,250,255,0.02)';
    // ctx.fillRect(0,0,width,height);

    // draw particles
    for (let p of particles) {
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw connections
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
          ctx.strokeStyle = `rgba(30,58,138,${0.06 * t})`; // subtle navy lines
          ctx.lineWidth = 1 * t;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  // update positions
  function update(dt) {
    for (let p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // gentle wrap-around
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;
    }
  }

  // animation loop
  let last = performance.now();
  let rafId = null;
  function loop(now) {
    const dt = Math.min(60, now - last) / 16.666; // normalize to ~60fps units
    last = now;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // initialize
  function start() {
    resize();
    createParticles();
    last = performance.now();
    if (!isReducedMotion) rafId = requestAnimationFrame(loop);
    else {
      // reduced motion: draw a single static frame
      draw();
    }
  }

  // responsive resize with debounce
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      createParticles();
    }, 120);
  }, { passive: true });

  // pause when tab not visible to save CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      if (!rafId && !isReducedMotion) {
        last = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    }
  });

  // start
  start();

  // expose a small API for debugging (optional)
  window.__bgVisual = {
    restart: () => { if (rafId) cancelAnimationFrame(rafId); start(); },
    stop: () => { if (rafId) cancelAnimationFrame(rafId); rafId = null; }
  };
})();


/* =========================
   FORM SUBMIT REDIRECT FIX
   ========================= */
(function initFormSubmit() {
  const form = document.getElementById("myForm");
  if (!form) return; // safety check

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const data = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        window.location.href = "https://sharique-code93.github.io/proskillhub-tech/thankyou.html";
      } else {
        alert("❌ Something went wrong. Please try again.");
      }
    } catch (error) {
      alert("⚠️ Network error. Please try again.");
    }
  });
})();

