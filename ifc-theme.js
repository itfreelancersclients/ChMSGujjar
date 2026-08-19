/* ==========================================================================
   IFC Premium Theme — shared interaction layer for every page.
   Handles: mobile nav toggle, cursor glow, scroll reveal, FAQ accordion.
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---- Cursor glow (desktop only, injected automatically) ---- */
  if (window.matchMedia('(pointer:fine)').matches && !prefersReduced) {
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

  /* ---- Scroll reveal on common content blocks ---- */
  const revealSelectors = '.service-card, .services-title, .services-subtitle, .testimonial-card, .faq-item, .hero-content, .front-poster, .services-grid, .blog-card, .blog-services h1, .service-block, .video-hero h1, .video-hero p, .about-card, .privacy-card, .contact-card, .payment-card';
  const revealEls = document.querySelectorAll(revealSelectors);
  revealEls.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
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
});
