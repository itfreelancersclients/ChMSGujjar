/* ==========================================================================
   IFC Premium Theme — shared interaction layer for every page.
   Handles: page fade-in, scroll progress, mobile nav toggle, cursor glow +
   precise cursor dot/ring, magnetic buttons, staggered scroll reveal,
   FAQ accordion.
   ========================================================================== */

/* Page fade-in — avoids flash of unstyled content before scripts/styles settle */
document.documentElement.classList.add('ifc-loading');
window.addEventListener('load', function () {
  document.documentElement.classList.remove('ifc-loading');
  document.documentElement.classList.add('ifc-loaded');
});

document.addEventListener("DOMContentLoaded", function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll progress bar ---- */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);
  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = pct + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      navToggle.textContent = isOpen ? '✕' : '☰';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        navToggle.textContent = '☰';
      });
    });
  }

  const isFinePointer = window.matchMedia('(pointer:fine)').matches;

  /* ---- Cursor glow (desktop only, injected automatically) ---- */
  if (isFinePointer && !prefersReduced) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    document.addEventListener('mousemove', e => {
      glow.style.opacity = '1';
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
    document.addEventListener('mouseleave', () => glow.style.opacity = '0');
  }

  /* ---- Precise cursor dot + trailing ring (layered on top of ambient glow) ---- */
  if (isFinePointer && !prefersReduced) {
    document.body.classList.add('ifc-custom-cursor');
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    document.addEventListener('mousemove', e => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    });
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });

    const hoverTargets = 'a, button, .service-card, .blog-card, .contact-card, .payment-card, .faq-item';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverTargets)) ring.classList.add('hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverTargets)) ring.classList.remove('hover');
    });
  }

  /* ---- Magnetic buttons — subtle pull toward cursor on primary CTAs ---- */
  if (isFinePointer && !prefersReduced) {
    const magneticEls = document.querySelectorAll('.btn-cta, .start-btn, .pay-cta, .video-notify a');
    magneticEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---- Scroll reveal on common content blocks (staggered by position) ---- */
  const revealSelectors = '.service-card, .services-title, .services-subtitle, .testimonial-card, .faq-item, .hero-content, .front-poster, .services-grid, .blog-card, .blog-services h1, .service-block, .video-hero h1, .video-hero p, .about-card, .privacy-card, .contact-card, .payment-card, .portfolio-item, .stat-strip .stat';
  const revealEls = document.querySelectorAll(revealSelectors);
  revealEls.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const siblings = Array.from(en.target.parentElement ? en.target.parentElement.children : []);
          const idx = siblings.indexOf(en.target);
          const delay = Math.min(idx, 6) * 70;
          en.target.style.transitionDelay = delay + 'ms';
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---- Stat counter animation ---- */
  const statEls = document.querySelectorAll('.stat-num[data-count-to]');
  if (statEls.length && 'IntersectionObserver' in window) {
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = parseFloat(el.getAttribute('data-count-to'));
        const suffix = el.getAttribute('data-suffix') || '';
        if (prefersReduced || isNaN(target)) {
          el.textContent = target + suffix;
        } else {
          const duration = 1200;
          const start = performance.now();
          const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
        countIo.unobserve(el);
      });
    }, { threshold: 0.4 });
    statEls.forEach(el => countIo.observe(el));
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
  // open the first FAQ item by default
  const firstFaq = document.querySelector('.faq-item');
  if (firstFaq) firstFaq.classList.add('open');

  /* ---- Network constellation hero visual (only runs if canvas exists, i.e. homepage) ---- */
  const constellationCanvas = document.getElementById('constellation');
  if (constellationCanvas) {
    const ctx = constellationCanvas.getContext('2d');
    let W, H, DPR, nodes = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const box = constellationCanvas.parentElement.getBoundingClientRect();
      W = box.width; H = box.height;
      constellationCanvas.width = W * DPR;
      constellationCanvas.height = H * DPR;
      constellationCanvas.style.width = W + 'px';
      constellationCanvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildNodes();
    }
    window.addEventListener('resize', resize);

    function buildNodes() {
      const positions = [
        [0.10, 0.20], [0.14, 0.68], [0.24, 0.10], [0.28, 0.90],
        [0.90, 0.20], [0.86, 0.68], [0.76, 0.10], [0.72, 0.90]
      ];
      nodes = positions.map((p, i) => ({
        x: p[0] * W, y: p[1] * H,
        r: 3.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        gold: i % 2 === 0
      }));
    }
    resize();

    const cx = () => W / 2, cy = () => H / 2;

    function drawConstellation(t) {
      ctx.clearRect(0, 0, W, H);
      nodes.forEach((n, i) => {
        ctx.strokeStyle = n.gold ? 'rgba(201,162,39,0.16)' : 'rgba(154,163,191,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.quadraticCurveTo(cx(), cy(), cx(), cy());
        ctx.stroke();

        const prog = ((t * 0.00028 + i * 0.11) % 1);
        const px = n.x + (cx() - n.x) * prog;
        const py = n.y + (cy() - n.y) * prog;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 7);
        grad.addColorStop(0, 'rgba(232,217,160,0.9)');
        grad.addColorStop(1, 'rgba(232,217,160,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      nodes.forEach(n => {
        const pulse = 1 + Math.sin(t * 0.002 + n.phase) * 0.25;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = n.gold ? 'rgba(201,162,39,0.95)' : 'rgba(154,163,191,0.9)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse + 6, 0, Math.PI * 2);
        ctx.strokeStyle = n.gold ? 'rgba(201,162,39,0.25)' : 'rgba(154,163,191,0.2)';
        ctx.stroke();
      });

      requestAnimationFrame(drawConstellation);
    }

    if (!prefersReduced) {
      requestAnimationFrame(drawConstellation);
    } else {
      drawConstellation(0);
    }
  }
});
