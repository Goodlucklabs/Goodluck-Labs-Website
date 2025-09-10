/* Goodluck Labs — interactions (no frameworks) */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // -----------------------------
  // Theme toggle (persisted) with icon-only buttons
  // -----------------------------
  const THEME_KEY = 'gll-theme';
  const root = document.documentElement;

  const setToggleIcon = (mode) => {
    // mode is the CURRENT theme after applying (dark|light)
    const iconForMode = mode === 'light' ? 'dark_mode' : 'light_mode';
    $$('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-pressed', String(mode === 'light'));
      const span = btn.querySelector('.material-symbols-rounded');
      if (span) span.textContent = iconForMode;
      btn.title = mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    });
  };

  const applyTheme = (mode) => {
    if (mode === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme'); // dark default
      mode = 'dark';
    }
    localStorage.setItem(THEME_KEY, mode);
    setToggleIcon(mode);
  };

  const stored = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(stored || (prefersLight ? 'light' : 'dark'));

  $$('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = (localStorage.getItem(THEME_KEY) || (prefersLight ? 'light' : 'dark'));
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  });

  // -----------------------------
  // Elevate header on scroll
  // -----------------------------
  const header = $('.site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -----------------------------
  // Mobile menu toggle
  // -----------------------------
  const toggle = $('.nav-toggle');
  const menu = $('#mobile-menu');
  if (toggle && menu) {
    const setExpanded = (expanded) => {
      toggle.setAttribute('aria-expanded', String(expanded));
      if (expanded) {
        menu.removeAttribute('hidden');
      } else {
        menu.setAttribute('hidden', '');
      }
    };
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      setExpanded(!expanded);
    });
    $$('.mobile-menu a, .mobile-menu button').forEach(a => {
      a.addEventListener('click', () => setExpanded(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setExpanded(false);
    });
  }

  // -----------------------------
  // Active nav link based on path
  // -----------------------------
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const map = {
    'what-we-do.html': 'What we do',
    'about.html': 'About',
    'capabilities.html': 'Capabilities',
    'contact.html': 'Contact',
    'index.html': null
  };
  const activeLabel = map[path] ?? null;
  if (activeLabel) {
    $$('.nav-links a, .foot-links a').forEach(a => {
      if (a.textContent.trim().toLowerCase() === activeLabel.toLowerCase()) {
        a.classList.add('active');
      }
    });
  }

  // -----------------------------
  // Reveal-on-scroll
  // -----------------------------
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -10% 0px'
    });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 60, 360)}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // -----------------------------
  // Subtle parallax for background orbs
  // -----------------------------
  const orbs = $$('.orb');
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (orbs.length && !prefersReduced) {
    let raf = 0;
    let targetX = 0, targetY = 0;
    const onMove = (e) => {
      const { innerWidth: w, innerHeight: h } = window;
      targetX = (e.clientX / w - 0.5) * 12; // -6..6
      targetY = (e.clientY / h - 0.5) * 12; // -6..6
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      raf = 0;
      const tx = targetX.toFixed(2);
      const ty = targetY.toFixed(2);
      orbs.forEach((o, i) => {
        const k = (i + 1) * 0.25;
        o.style.transform = `translate3d(${tx * k}px, ${ty * k}px, 0)`;
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
  }

  // -----------------------------
  // Trust marquee duplication and spacing
  // -----------------------------
  const marquees = $$('.marquee');
  marquees.forEach(marquee => {
    const track = marquee.querySelector('.track');
    if (track && track.children.length) {
      const clone = track.cloneNode(true);
      clone.classList.add('track-clone');
      marquee.appendChild(clone);
    }
  });

  // -----------------------------
  // Slider (testimonials)
  // -----------------------------
  const slider = document.querySelector('[data-slider]');
  if (slider) {
    const slidesWrap = slider.querySelector('.slides');
    const slides = $$('.slide', slidesWrap);
    const prev = slider.querySelector('.prev');
    const next = slider.querySelector('.next');
    let idx = 0;

    const go = (i) => {
      idx = (i + slides.length) % slides.length;
      slidesWrap.style.transform = `translateX(-${idx * 100}%)`;
    };

    prev?.addEventListener('click', () => go(idx - 1));
    next?.addEventListener('click', () => go(idx + 1));

    // Auto-play
    let timer = setInterval(() => go(idx + 1), 6000);
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', () => { timer = setInterval(() => go(idx + 1), 6000); });
  }

  // -----------------------------
  // Image fallback handler (fix broken external images)
  // -----------------------------
  $$('img[data-fallback]').forEach(img => {
    img.addEventListener('error', () => {
      const fb = img.getAttribute('data-fallback');
      if (fb && img.src !== fb) {
        img.src = fb;
      }
      // prevent infinite loop
      img.removeAttribute('data-fallback');
    }, { once: true });
  });

  // -----------------------------
  // Contact form (mailto)
  // -----------------------------
  const mailForm = $('form[data-mailto]');
  if (mailForm) {
    mailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(mailForm);
      const name = (formData.get('name') || '').toString().trim();
      const email = (formData.get('email') || '').toString().trim();
      const company = (formData.get('company') || '').toString().trim();
      const topic = (formData.get('topic') || '').toString().trim();
      const message = (formData.get('message') || '').toString().trim();

      const subject = encodeURIComponent(`[Goodluck Labs] ${topic || 'New inquiry'}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nTopic: ${topic}\n\n${message}`
      );
      window.location.href = `mailto:hello@goodlucklabs.tech?subject=${subject}&body=${body}`;
    });
  }

  // -----------------------------
  // Current year in footer
  // -----------------------------
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();