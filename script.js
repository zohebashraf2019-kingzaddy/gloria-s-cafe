// Mobile nav
const burger = document.getElementById('burger');
const links = document.getElementById('links');
burger.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  burger.classList.toggle('x', open);
  burger.setAttribute('aria-expanded', open);
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open'); burger.classList.remove('x');
}));

// Menu tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Open / closed status (Reno = America/Los_Angeles)
const HOURS = { 0: [8, 14], 1: [8, 13], 2: null, 3: [8, 13], 4: [8, 13], 5: [8, 13], 6: [8, 14] };
const fmt = h => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
function updateStatus() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = now.getDay();
  const hr = now.getHours() + now.getMinutes() / 60;
  const el = document.getElementById('status');
  const txt = document.getElementById('status-text');
  const today = HOURS[day];
  document.querySelectorAll('#hours tr').forEach(r => r.classList.toggle('today', +r.dataset.day === day));
  if (today && hr >= today[0] && hr < today[1]) {
    el.className = 'status open';
    txt.textContent = `Open now · until ${fmt(today[1])}`;
  } else {
    el.className = 'status closed';
    let d = day, label = 'today';
    if (today && hr < today[0]) {
      txt.textContent = `Closed · opens today at ${fmt(today[0])}`;
      return;
    }
    for (let i = 1; i <= 7; i++) {
      d = (day + i) % 7;
      if (HOURS[d]) { label = i === 1 ? 'tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]; break; }
    }
    txt.textContent = `Closed · opens ${label} at ${fmt(HOURS[d][0])}`;
  }
}
updateStatus();
setInterval(updateStatus, 60000);

// Scroll reveal
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  io.observe(el);
});

// Reels: play when visible
const vio = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { v.play().catch(() => {}); } else { v.pause(); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.reel video').forEach(v => vio.observe(v));

// Lightbox
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
document.querySelectorAll('.g').forEach(g => g.addEventListener('click', () => {
  lbImg.src = g.dataset.src; lbImg.alt = g.querySelector('img').alt;
  lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
}));
const closeLb = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); };
lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

document.getElementById('year').textContent = new Date().getFullYear();
