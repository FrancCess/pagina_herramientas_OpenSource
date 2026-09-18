/* ================================================
   carousel.js — page-level image/icon carousel
   Usage: initCarousel('trackId', 'dotsId', 4500)
   ================================================ */

function initCarousel(trackId, dotsId, interval) {
  const track  = document.getElementById(trackId);
  const dotsEl = document.getElementById(dotsId);
  if (!track || !dotsEl) return;

  const slides  = Array.from(track.querySelectorAll('.pc-slide'));
  const carousel = track.closest('.page-carousel');
  let current = 0, timer = null;

  // Build dot buttons
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'pc-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Ir a slide ' + (i + 1));
    d.addEventListener('click', () => { stop(); goTo(i); start(); });
    dotsEl.appendChild(d);
  });

  function goTo(idx) {
    slides[current].classList.remove('active');
    dotsEl.children[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dotsEl.children[current].classList.add('active');
    track.style.transform = 'translateX(-' + current * 100 + '%)';
  }

  function start() { timer = setInterval(() => goTo(current + 1), interval || 4500); }
  function stop()  { clearInterval(timer); }

  carousel.querySelector('.pc-prev').addEventListener('click', () => { stop(); goTo(current - 1); start(); });
  carousel.querySelector('.pc-next').addEventListener('click', () => { stop(); goTo(current + 1); start(); });
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  start();
}
