/* ================================================
   main.js — shared across all pages
   - Reveal on scroll (IntersectionObserver)
   - Navbar scroll shadow
   ================================================ */

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// Navbar scroll shadow
const nav = document.querySelector('.site-navbar');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Botón flotante temporal: probar negro vs. azul oscuro
(function themeTester() {
  const KEY = 'os-theme-test';
  const saved = sessionStorage.getItem(KEY);
  if (saved === 'blue') document.documentElement.setAttribute('data-theme', 'blue');

  const btn = document.createElement('button');
  btn.className = 'theme-tester';
  btn.type = 'button';
  const label = document.createElement('span');
  const dot = document.createElement('span');
  dot.className = 'tt-dot';
  btn.appendChild(dot);
  btn.appendChild(label);

  const setLabel = () => {
    const isBlue = document.documentElement.getAttribute('data-theme') === 'blue';
    label.textContent = isBlue ? 'Viendo: azul oscuro' : 'Probar azul oscuro';
  };
  setLabel();

  btn.addEventListener('click', () => {
    const isBlue = document.documentElement.getAttribute('data-theme') === 'blue';
    if (isBlue) {
      document.documentElement.removeAttribute('data-theme');
      sessionStorage.removeItem(KEY);
    } else {
      document.documentElement.setAttribute('data-theme', 'blue');
      sessionStorage.setItem(KEY, 'blue');
    }
    setLabel();
  });

  document.body.appendChild(btn);
})();
