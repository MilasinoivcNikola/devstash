/* ============================================
   DevStash Homepage - Scripts
   ============================================ */

(function () {
  'use strict';

  // ── Current Year ──
  document.getElementById('currentYear').textContent = new Date().getFullYear();

  // ── Navbar scroll effect ──
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  // ── Mobile menu ──
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // ── Scroll fade-in ──
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  fadeEls.forEach((el) => fadeObserver.observe(el));

  // ── Pricing toggle ──
  const toggle = document.getElementById('pricingToggle');
  const proPrice = document.getElementById('proPrice');
  const proPeriod = document.getElementById('proPeriod');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const yearlyLabel = document.getElementById('yearlyLabel');
  let isYearly = false;

  toggle.addEventListener('click', () => {
    isYearly = !isYearly;
    toggle.classList.toggle('active', isYearly);
    monthlyLabel.classList.toggle('active', !isYearly);
    yearlyLabel.classList.toggle('active', isYearly);
    proPrice.textContent = isYearly ? '$6' : '$8';
    proPeriod.textContent = isYearly ? '/month, billed yearly' : '/month';
  });

  // Initialize toggle state
  monthlyLabel.classList.add('active');

  // ── Chaos Icon Animation ──
  const container = document.getElementById('chaosContainer');
  const iconsContainer = document.getElementById('chaosIcons');
  const icons = iconsContainer.querySelectorAll('.chaos-icon');

  // Mouse tracking for repulsion
  let mouseX = -1000;
  let mouseY = -1000;
  const REPEL_RADIUS = 80;
  const REPEL_FORCE = 3;

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  container.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
  });

  // Icon state
  const PADDING = 30;
  const ICON_SIZE = 48;
  const iconStates = [];

  function initIcons() {
    const w = iconsContainer.offsetWidth;
    const h = iconsContainer.offsetHeight;

    icons.forEach((icon, i) => {
      const x = PADDING + Math.random() * (w - ICON_SIZE - PADDING * 2);
      const y = PADDING + Math.random() * (h - ICON_SIZE - PADDING * 2);
      const speed = 0.3 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;

      iconStates[i] = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 30 - 15,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        scale: 0.9 + Math.random() * 0.2,
        scaleDir: 1,
        el: icon,
      };

      icon.style.left = x + 'px';
      icon.style.top = y + 'px';
    });
  }

  function animateIcons() {
    const w = iconsContainer.offsetWidth;
    const h = iconsContainer.offsetHeight;

    iconStates.forEach((state) => {
      // Mouse repulsion
      const dx = state.x + ICON_SIZE / 2 - mouseX;
      const dy = state.y + ICON_SIZE / 2 - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
        state.vx += (dx / dist) * force;
        state.vy += (dy / dist) * force;
      }

      // Dampen velocity
      state.vx *= 0.98;
      state.vy *= 0.98;

      // Ensure minimum speed
      const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
      if (speed < 0.2) {
        const angle = Math.atan2(state.vy, state.vx);
        state.vx = Math.cos(angle) * 0.3;
        state.vy = Math.sin(angle) * 0.3;
      }

      // Cap max speed
      if (speed > 3) {
        state.vx = (state.vx / speed) * 3;
        state.vy = (state.vy / speed) * 3;
      }

      // Move
      state.x += state.vx;
      state.y += state.vy;

      // Bounce off walls
      if (state.x < PADDING) {
        state.x = PADDING;
        state.vx = Math.abs(state.vx);
      }
      if (state.x > w - ICON_SIZE - PADDING) {
        state.x = w - ICON_SIZE - PADDING;
        state.vx = -Math.abs(state.vx);
      }
      if (state.y < PADDING + 20) {
        state.y = PADDING + 20;
        state.vy = Math.abs(state.vy);
      }
      if (state.y > h - ICON_SIZE - PADDING) {
        state.y = h - ICON_SIZE - PADDING;
        state.vy = -Math.abs(state.vy);
      }

      // Rotation
      state.rotation += state.rotationSpeed;

      // Scale pulsing
      state.scale += 0.001 * state.scaleDir;
      if (state.scale > 1.1) state.scaleDir = -1;
      if (state.scale < 0.85) state.scaleDir = 1;

      // Apply transform
      state.el.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg) scale(${state.scale})`;
      state.el.style.left = '0';
      state.el.style.top = '0';
    });

    requestAnimationFrame(animateIcons);
  }

  // Start animation
  initIcons();
  animateIcons();

  // Reinitialize on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initIcons, 200);
  });
})();
