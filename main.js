/* ==========================================================================
   PrintShop Pro — Premium SaaS Landing Page
   JavaScript: Animations · Particles · Counters · Interactivity
   ========================================================================== */

(function () {
  'use strict';

  /* =========================== DOM READY ============================ */
  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); return; }
    document.addEventListener('DOMContentLoaded', fn);
  }

  /* =========================== THROTTLE ============================ */
  function throttle(fn, delay) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= delay) { last = now; fn.apply(this, args); }
    };
  }

  /* =========================== PARTICLES ============================ */
  function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    let w, h;

    const PARTICLE_COUNT = 80;
    const CONNECT_DIST = 130;

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.radius = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
        if (this.y < -10) this.y = h + 10;
        if (this.y > h + 10) this.y = -10;
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(124, 58, 237, ' + this.opacity + ')';
        ctx.fill();
      }
    }

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }

    function drawConnections() {
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            var alpha = (1 - dist / CONNECT_DIST) * 0.06;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(124, 58, 237, ' + alpha + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
      }
      drawConnections();
      animId = requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', throttle(function () {
      resize();
      createParticles();
    }, 200));
  }

  /* =========================== NAVBAR ============================ */
  function initNavbar() {
    var navbar = document.getElementById('navbar');
    var mobileBtn = document.getElementById('mobileMenuBtn');
    var navLinks = document.getElementById('navLinks');

    if (!navbar) return;

    var onScroll = throttle(function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, 50);
    window.addEventListener('scroll', onScroll);
    onScroll();

    if (mobileBtn && navLinks) {
      mobileBtn.addEventListener('click', function () {
        var isOpen = navLinks.classList.toggle('open');
        mobileBtn.classList.toggle('active');
        mobileBtn.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      var allNavAnchors = navLinks.querySelectorAll('a');
      for (var i = 0; i < allNavAnchors.length; i++) {
        allNavAnchors[i].addEventListener('click', function () {
          navLinks.classList.remove('open');
          mobileBtn.classList.remove('active');
          mobileBtn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      }
    }
  }

  /* =========================== SMOOTH SCROLL ============================ */
  function initSmoothScroll() {
    var anchors = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          var nav = document.getElementById('navbar');
          var navHeight = nav ? nav.offsetHeight : 72;
          var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    }
  }

  /* =========================== INTERSECTION OBSERVER — FADE IN ============================ */
  function initScrollReveal() {
    var observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    };

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('visible');
        }
      }
    }, observerOptions);

    var fadeEls = document.querySelectorAll('.fade-in');
    for (var i = 0; i < fadeEls.length; i++) observer.observe(fadeEls[i]);

    var steps = document.querySelectorAll('.timeline-step');
    for (var i = 0; i < steps.length; i++) observer.observe(steps[i]);
  }

  /* =========================== ANIMATED COUNTERS ============================ */
  function initCounters() {
    var counterElements = document.querySelectorAll('.stat-number[data-target]');
    if (!counterElements.length) return;

    var counterObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          animateCounter(entries[i].target);
          counterObserver.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.5 });

    for (var i = 0; i < counterElements.length; i++) {
      counterObserver.observe(counterElements[i]);
    }

    function animateCounter(el) {
      var target = parseFloat(el.getAttribute('data-target'));
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var isDecimal = target % 1 !== 0;
      var decimals = isDecimal ? 1 : 0;
      var duration = 2000;
      var startTime = performance.now();
      var startVal = 0;

      function update(currentTime) {
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = startVal + (target - startVal) * eased;
        current = isDecimal ? current.toFixed(decimals) : Math.floor(current);
        el.textContent = prefix + current + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = prefix + target + suffix;
        }
      }

      requestAnimationFrame(update);
    }
  }

  /* =========================== FAQ ACCORDION ============================ */
  function initFAQ() {
    var faqButtons = document.querySelectorAll('.faq-btn');
    if (!faqButtons.length) return;

    for (var i = 0; i < faqButtons.length; i++) {
      faqButtons[i].addEventListener('click', function () {
        var item = this.parentElement;
        var isActive = item.classList.contains('active');

        var activeItems = document.querySelectorAll('.faq-item.active');
        for (var j = 0; j < activeItems.length; j++) {
          if (activeItems[j] !== item) {
            activeItems[j].classList.remove('active');
            activeItems[j].querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
          }
        }

        if (isActive) {
          item.classList.remove('active');
          this.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    }
  }

  /* =========================== BUTTON RIPPLE ============================ */
  function initRipple() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;

      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      btn.style.setProperty('--ripple-x', x + 'px');
      btn.style.setProperty('--ripple-y', y + 'px');
    });
  }

  /* =========================== PARALLAX ORBS ON MOUSE ============================ */
  function initParallaxOrbs() {
    var orbs = document.querySelectorAll('.bg-gradient-orb');
    if (!orbs.length) return;

    document.addEventListener('mousemove', throttle(function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 20;
      var y = (e.clientY / window.innerHeight - 0.5) * 20;
      for (var i = 0; i < orbs.length; i++) {
        var factor = (i + 1) * 0.5;
        orbs[i].style.transform = 'translate(' + (x * factor) + 'px, ' + (y * factor) + 'px) scale(1)';
      }
    }, 50));
  }

  /* =========================== DASHBOARD MOCKUP TILT ON HOVER ============================ */
  function initDashboardTilt() {
    var dashboard = document.querySelector('.dashboard-mockup');
    if (!dashboard) return;

    dashboard.addEventListener('mousemove', function (e) {
      var rect = dashboard.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      dashboard.style.transform = 'rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 4) + 'deg)';
    });

    dashboard.addEventListener('mouseleave', function () {
      dashboard.style.transform = 'rotateX(2deg) rotateY(0deg)';
    });
  }

  /* =========================== ACTIVE NAV LINK ============================ */
  function initActiveNavOnScroll() {
    var sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    var navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    var onScroll = throttle(function () {
      var current = '';
      var nav = document.getElementById('navbar');
      var navHeight = nav ? nav.offsetHeight : 72;

      for (var i = 0; i < sections.length; i++) {
        var top = sections[i].offsetTop - navHeight - 100;
        if (window.scrollY >= top) {
          current = sections[i].getAttribute('id');
        }
      }

      for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].classList.remove('active-link');
        if (navLinks[i].getAttribute('href') === '#' + current) {
          navLinks[i].classList.add('active-link');
        }
      }
    }, 100);

    window.addEventListener('scroll', onScroll);
  }

  /* =========================== INIT ============================ */
  ready(function () {
    initParticles();
    initNavbar();
    initSmoothScroll();
    initScrollReveal();
    initCounters();
    initFAQ();
    initRipple();
    initParallaxOrbs();
    initDashboardTilt();
    initActiveNavOnScroll();
  });

})();
