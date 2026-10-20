/* ================================================
   marquee.js — infinite-scroll marquee duplicator
   Duplicates the track content so the CSS animation
   loops seamlessly without a visible jump.
   ================================================ */

const track = document.getElementById('marqueeTrack');
if (track) {
  track.innerHTML += track.innerHTML;
}
