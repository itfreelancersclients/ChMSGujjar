/* ==========================================================================
   IFC Premium Theme — shared interaction layer for every page.
   Handles: mobile nav, FAQ accordion, scroll reveal, custom cursor,
   magnetic buttons, GSAP-powered scroll/entrance animations.
   Loaded on every page via <script src="ifc-theme.js" defer></script>
   ========================================================================== */

(function () {
  "use strict";

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pointerFine = window.matchMedia('(pointer:fine)').matches;
  var gsapReady = false;

  /* ---------------------------------------------------------------------
     0. Page fade-in (avoids flash of unstyled content on load)
     --------------------------------------------------------------------- */
  document.documentElement.classList.add('ifc-loading');
  window.addEventListener('load', function () {
    document.documentElement.classList.remove('ifc-loading');
    document.documentElement.classList.add('ifc-loaded');
  });

  /* ---------------------------------------------------------------------
     1. Core UI: mobile nav, FAQ accordion, base scroll-reveal
        (these always run, regardless of whether GSAP loads)
     --------------------------------------------------------------------- */
  function initCoreUI() {
    // Mobile nav toggle
    var navToggle = document.getElementById('navToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    if (navToggle && mobileMenu) {
      navToggle.addEventListener('click', function () {
        var isOpen = mobileMenu.classList.toggle('open');
        navToggle.textContent = isOpen ? '✕' : '☰';
      });
      mobileMenu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          mobileMenu.classList.remove('open');
          navToggle.textContent = '☰';
        });
      });
    }

    // FAQ accordion
    document.querySelectorAll('.faq-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (el) {
          el.classList.remove('open');
        });
        if (!wasOpen) item.classList.add('open');
      });
    });
    var firstFaq = document.querySelector('.faq-item');
    if (firstFaq) firstFaq.classList.add('open');

    // Tag reveal-eligible elements
    var revealSelectors = '.service-card, .services-title, .services-subtitle, .testimonial-card, .faq-item, .hero-content, .front-poster, .services-grid, .blog-card, .blog-services h1, .service-block, .video-hero h1, .video-hero p, .about-card, .privacy-card, .contact-card, .payment-card, .blog-post, .toc-list li, .quote-card';
    var revealEls = document.querySelectorAll(revealSelectors);
    revealEls.forEach(function (el) { el.classList.add('reveal'); });

    // Fallback reveal via IntersectionObserver (used if GSAP never loads,
    // or immediately for anything GSAP's ScrollTrigger doesn't pick up)
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !gsapReady) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    // Ambient cursor glow (kept even with GSAP — layered with precise cursor)
    if (pointerFine && !prefersReduced) {
      var glow = document.createElement('div');
      glow.className = 'cursor-glow';
      document.body.appendChild(glow);
      document.addEventListener('mousemove', function (e) {
        glow.style.opacity = '1';
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      });
      document.addEventListener('mouseleave', function () { glow.style.opacity = '0'; });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoreUI);
  } else {
    initCoreUI();
  }

  /* ---------------------------------------------------------------------
     2. Dynamically load GSAP + ScrollTrigger from CDN.
        If this fails (offline, blocked), the site still fully works —
        the vanilla reveal/cursor-glow above already covers it.
     --------------------------------------------------------------------- */
  if (!prefersReduced) {
    var s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    s1.onload = function () {
      var s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
      s2.onload = function () {
        gsapReady = true;
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initGSAPEnhancements);
        } else {
          initGSAPEnhancements();
        }
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }

  /* ---------------------------------------------------------------------
     3. GSAP-powered premium enhancements (progressive upgrade)
     --------------------------------------------------------------------- */
  function initGSAPEnhancements() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    initCustomCursor();
    initMagneticButtons();
    initHeadingReveal();
    initScrollRevealGSAP();
    initParallaxGlow();

    // Recalculate all trigger positions once images/fonts are fully loaded,
    // since layout can shift after initial calculation and throw off
    // ScrollTrigger's start/end math (this was causing some cards to get
    // stuck invisible).
    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }

    // Safety net: no matter what, force-reveal anything still hidden after
    // 4 seconds. Guarantees content is never permanently invisible even if
    // a ScrollTrigger edge case is missed.
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.5 });
        el.classList.add('in');
      });
    }, 4000);
  }

  /* -- Custom cursor: precise dot + trailing ring, morphs on hover -- */
  function initCustomCursor() {
    if (!pointerFine) return;

    document.body.classList.add('ifc-custom-cursor');

    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var ringX = gsap.quickTo(ring, 'left', { duration: 0.35, ease: 'power3.out' });
    var ringY = gsap.quickTo(ring, 'top', { duration: 0.35, ease: 'power3.out' });

    document.addEventListener('mousemove', function (e) {
      gsap.set(dot, { left: e.clientX, top: e.clientY });
      ringX(e.clientX);
      ringY(e.clientY);
      dot.style.opacity = 1;
      ring.style.opacity = 1;
    });
    document.addEventListener('mouseleave', function () {
      dot.style.opacity = 0;
      ring.style.opacity = 0;
    });

    var hoverTargets = 'a, button, .service-card, .blog-card, .contact-card, .payment-card, input, textarea, .faq-item';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverTargets)) ring.classList.add('hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverTargets)) ring.classList.remove('hover');
    });
  }

  /* -- Magnetic buttons: CTAs gently follow the cursor near them -- */
  function initMagneticButtons() {
    if (!pointerFine) return;
    var targets = document.querySelectorAll('.btn-primary, .btn-cta, .start-btn, .nav-cta, .pay-cta, .btn-poster');
    targets.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.25, y: y * 0.35, duration: 0.4, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* -- Headline reveal: mask-wipe entrance for hero/poster h1s -- */
  function initHeadingReveal() {
    var selectors = '.hero-content h1, .freelance-poster h1, .video-poster h1, .seo-poster h1, ' +
      '.va-poster h1, .am-poster h1, .about-hero h1, .privacy-hero h1, .contact-hero h1, ' +
      '.video-hero h1, .portfolio-hero h1, .payment-hero h1, .blog-post h1';
    document.querySelectorAll(selectors).forEach(function (h1) {
      if (h1.dataset.ifcSplit) return;
      h1.dataset.ifcSplit = '1';
      var inner = document.createElement('span');
      inner.style.display = 'inline-block';
      inner.style.willChange = 'transform, opacity';
      inner.innerHTML = h1.innerHTML;
      h1.innerHTML = '';
      h1.style.overflow = 'hidden';
      h1.appendChild(inner);
      gsap.fromTo(inner,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.1, ease: 'power4.out', delay: 0.15 }
      );
    });
  }

  /* -- Scroll-triggered stagger reveal (replaces vanilla IO once active) -- */
  function initScrollRevealGSAP() {
    var containers = document.querySelectorAll('.bento, .services-grid, .blog-grid, .proof-grid, .contact-cards, .chip-grid, .toc-list, .process');
    var handled = new Set();

    containers.forEach(function (container) {
      var children = Array.prototype.filter.call(
        container.querySelectorAll('.reveal'),
        function (c) { return !c.classList.contains('in'); }
      );
      if (!children.length) return;
      children.forEach(function (c) { handled.add(c); });
      gsap.set(children, { opacity: 0, y: 26 });
      ScrollTrigger.create({
        trigger: container,
        start: 'top 85%',
        onEnter: function () {
          gsap.to(children, {
            opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
            stagger: 0.08,
            onComplete: function () { children.forEach(function (c) { c.classList.add('in'); }); }
          });
        },
        once: true
      });
    });

    document.querySelectorAll('.reveal').forEach(function (el) {
      if (handled.has(el) || el.classList.contains('in')) return;
      gsap.set(el, { opacity: 0, y: 26 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: function () {
          gsap.to(el, {
            opacity: 1, y: 0, duration: 0.75, ease: 'power3.out',
            onComplete: function () { el.classList.add('in'); }
          });
        },
        once: true
      });
    });
  }

  /* -- Subtle parallax drift on ambient hero glow behind hero sections -- */
  function initParallaxGlow() {
    var targets = document.querySelectorAll('.hero-banner, .freelance-poster, .video-poster, .seo-poster, .va-poster, .am-poster');
    targets.forEach(function (t) {
      ScrollTrigger.create({
        trigger: t,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: function (self) {
          t.style.setProperty('--parallax-y', (self.progress * 50) + 'px');
        }
      });
    });
  }

})();
