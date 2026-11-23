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

// ---------- Reservations ----------
const form = document.getElementById('reserve-form');
const dateIn = document.getElementById('r-date');
const timeSel = document.getElementById('r-time');
const msg = document.getElementById('form-msg');
const CAFE_EMAIL = 'Gloriascafe.nv@gmail.com';
const LAST_SEATING = { 0: 13.5, 1: 12.5, 2: null, 3: 12.5, 4: 12.5, 5: 12.5, 6: 13.5 }; // 30 min before close

const renoNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const label12 = t => { const h = Math.floor(t), m = t % 1 ? '30' : '00'; return `${h > 12 ? h - 12 : h}:${m} ${h >= 12 ? 'PM' : 'AM'}`; };

const today = renoNow();
dateIn.min = ymd(today);
const max = new Date(today); max.setDate(max.getDate() + 60);
dateIn.max = ymd(max);

function fillTimes() {
  timeSel.innerHTML = '';
  msg.textContent = ''; msg.className = 'form-msg';
  if (!dateIn.value) { timeSel.innerHTML = '<option value="">Pick a date first</option>'; return; }
  const [y, mo, d] = dateIn.value.split('-').map(Number);
  const day = new Date(y, mo - 1, d).getDay();
  const last = LAST_SEATING[day];
  if (last === null) {
    timeSel.innerHTML = '<option value="">Closed Tuesdays</option>';
    msg.textContent = "We're closed on Tuesdays. Please pick another day."; msg.className = 'form-msg err';
    return;
  }
  const now = renoNow();
  const isToday = dateIn.value === ymd(now);
  const nowHr = now.getHours() + now.getMinutes() / 60;
  let any = false;
  timeSel.insertAdjacentHTML('beforeend', '<option value="">Select</option>');
  for (let t = 8; t <= last; t += 0.5) {
    if (isToday && t < nowHr + 0.5) continue; // need at least 30 min notice
    timeSel.insertAdjacentHTML('beforeend', `<option>${label12(t)}</option>`);
    any = true;
  }
  if (!any) {
    timeSel.innerHTML = '<option value="">No times left today</option>';
    msg.textContent = 'No more times today. Please pick another day or just walk in!'; msg.className = 'form-msg err';
  }
}
dateIn.addEventListener('change', fillTimes);

function mailtoFallback(data) {
  const body = [
    'New reservation request from the website:', '',
    `Name: ${data.name}`, `Phone: ${data.phone}`, `Email: ${data.email || '-'}`,
    `Date: ${data.dateLabel}`, `Time: ${data.time}`, `Guests: ${data.guests}`,
    `Seating: ${data.seating}`, `Notes: ${data.notes || '-'}`
  ].join('\n');
  window.location.href = `mailto:${CAFE_EMAIL}?subject=${encodeURIComponent(`Reservation request: ${data.name}, ${data.dateLabel} ${data.time} (${data.guests})`)}&body=${encodeURIComponent(body)}`;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  if (data.company) return; // bot
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  const bad = [];
  ['name', 'phone', 'date', 'time', 'guests'].forEach(k => { if (!String(data[k] || '').trim()) bad.push(k); });
  if (data.phone && data.phone.replace(/\D/g, '').length < 10) bad.push('phone');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) bad.push('email');
  if (bad.length) {
    bad.forEach(k => form.elements[k] && form.elements[k].classList.add('invalid'));
    msg.textContent = 'Please check the highlighted fields.'; msg.className = 'form-msg err';
    return;
  }
  const [y, mo, d] = data.date.split('-').map(Number);
  data.dateLabel = new Date(y, mo - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const btn = form.querySelector('.submit');
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    const res = await fetch('/api/reserve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) {
      form.reset(); fillTimes();
      msg.textContent = `Thanks ${data.name.split(' ')[0]}! Your request was sent. We'll call or text to confirm.`;
      msg.className = 'form-msg ok';
    } else if (res.status === 503 || res.status === 404) {
      // Email service not connected yet → open the guest's email app instead
      mailtoFallback(data);
      msg.textContent = 'Your email app is opening with your request. Just hit send!'; msg.className = 'form-msg ok';
    } else {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Something went wrong.');
    }
  } catch (err) {
    msg.innerHTML = `${err.message || "Couldn't send."} Please call us at <a href="tel:+17754093277">(775) 409-3277</a>.`;
    msg.className = 'form-msg err';
  } finally {
    btn.disabled = false; btn.textContent = 'Request Reservation';
  }
});
