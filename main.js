// Static capture mode for screenshots / PDF export
if (location.search.indexOf('capture') !== -1) {
  document.documentElement.classList.add('capture');
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.pdf-frame iframe').forEach(function (f) { f.removeAttribute('src'); });
  });
}

// Mobile menu: one state for visuals, keyboard access and accessibility.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (!toggle || !nav) return;
  var mobile = window.matchMedia('(max-width: 1024px)');
  var setOpen = function (open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    nav.inert = mobile.matches && !open;
  };
  toggle.addEventListener('click', function () { setOpen(!document.body.classList.contains('nav-open')); });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.site-header')) setOpen(false);
  });
  mobile.addEventListener('change', function () { setOpen(false); });
  setOpen(false);
})();

// Mark current page in nav
(function () {
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(function (a) {
    var target = a.getAttribute('href').split('/').pop();
    if (target === here) a.setAttribute('aria-current', 'page');
  });
})();

// Header shadow after scroll
(function () {
  var h = document.querySelector('.site-header');
  if (!h) return;
  var onScroll = function () { h.classList.toggle('scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Reveal on scroll (.reveal and .stagger)
(function () {
  var els = document.querySelectorAll('.reveal, .stagger');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function (e) { io.observe(e); });
})();

// Animated counters: <span data-count="10">0</span>
(function () {
  var nums = document.querySelectorAll('[data-count]');
  if (!nums.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var run = function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduce || document.documentElement.classList.contains('capture')) { el.textContent = target; return; }
    var start = null, dur = 1400;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!('IntersectionObserver' in window) || document.documentElement.classList.contains('capture')) { nums.forEach(run); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.5 });
  nums.forEach(function (n) { io.observe(n); });
})();

// Gentle parallax for photo bands and page heads
(function () {
  var layers = document.querySelectorAll('.band .bg');
  if (!layers.length || document.documentElement.classList.contains('capture') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ticking = false;
  var update = function () {
    ticking = false;
    var vh = window.innerHeight;
    layers.forEach(function (l) {
      var r = l.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 .. 1
      l.style.transform = 'translateY(' + (progress * -60).toFixed(1) + 'px)';
    });
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

// Footer year
(function () {
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

/* ═══════════════════════════════════════════════════════════════
   Interaction layer v2
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var capture = document.documentElement.classList.contains('capture');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  // ── Reading progress + back-to-top ──────────────────────────
  if (!capture) {
    var bar = document.createElement('div'); bar.className = 'progress'; document.body.appendChild(bar);
    var top = document.createElement('button'); top.className = 'to-top'; top.setAttribute('aria-label', 'Back to top'); top.textContent = '↑'; document.body.appendChild(top);
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0) + ')';
      top.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // ── Word-by-word heading reveal ─────────────────────────────
  document.querySelectorAll('.section-head h2, #about h2').forEach(function (h) {
    var i = 0, frag = document.createDocumentFragment();
    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
          w.appendChild(inner); frag.appendChild(w);
        });
      } else { frag.appendChild(node.cloneNode(true)); }
    });
    h.innerHTML = ''; h.appendChild(frag); h.classList.add('words');
  });

  // ── Image wipe-in ───────────────────────────────────────────
  document.querySelectorAll('.jcard, .pol .ph, .aside-photo, .pdf-frame').forEach(function (el) { el.classList.add('wipe'); });
  var wipes = document.querySelectorAll('.wipe');
  if ('IntersectionObserver' in window && !capture) {
    var wio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); wio.unobserve(en.target); } });
    }, { threshold: 0.15 });
    wipes.forEach(function (w) { wio.observe(w); });
  } else { wipes.forEach(function (w) { w.classList.add('in'); }); }

  if (!finePointer || reduce || capture) return; // everything below is pointer-driven

  // ── Cursor spotlight on cards ───────────────────────────────
  document.querySelectorAll('.card, .jcard, .pillar, .rc, .panel, .pub, .aside-card, .stat').forEach(function (el) {
    el.classList.add('spot');
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  // ── Magnetic buttons ────────────────────────────────────────
  document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.setProperty('--bx', (dx * 4).toFixed(1) + 'px'); b.style.setProperty('--by', (dy * 3).toFixed(1) + 'px');
    });
    b.addEventListener('pointerleave', function () { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
  });

  // ── 3D tilt ─────────────────────────────────────────────────
  var tiltTargets = [];
  var heroFrame = document.querySelector('.hero-figure .frame'); if (heroFrame) tiltTargets.push([heroFrame, 2]);
  document.querySelectorAll('.pol').forEach(function (p) { tiltTargets.push([p, 3]); });
  document.querySelectorAll('.pillar').forEach(function (p) { tiltTargets.push([p, 2]); });
  tiltTargets.forEach(function (t) {
    var el = t[0], amt = t[1]; el.classList.add('tilt');
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--ry', (x * amt * 2).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-y * amt * 2).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });

  // ── Hero mouse parallax ─────────────────────────────────────
  var hero = document.querySelector('.hero');
  if (hero) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    var tick = function () {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      hero.style.setProperty('--px', cx.toFixed(3)); hero.style.setProperty('--py', cy.toFixed(3));
      if (Math.abs(tx - cx) > .001 || Math.abs(ty - cy) > .001) raf = requestAnimationFrame(tick); else raf = null;
    };
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }

  // ── Sliding nav pill ────────────────────────────────────────
  var nav = document.querySelector('.nav');
  if (nav && window.innerWidth > 1024) {
    var pill = document.createElement('span'); pill.className = 'pill'; nav.appendChild(pill); nav.classList.add('has-pill');
    var moveTo = function (a) {
      if (!a) { pill.style.opacity = 0; return; }
      var r = a.getBoundingClientRect(), n = nav.getBoundingClientRect();
      pill.style.left = (r.left - n.left + 14) + 'px'; pill.style.width = (r.width - 28) + 'px'; pill.style.opacity = 1;
    };
    var current = nav.querySelector('a[aria-current="page"]');
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('pointerenter', function () { moveTo(a); }); });
    nav.addEventListener('pointerleave', function () { moveTo(current); });
    setTimeout(function () { moveTo(current); }, 350);
    window.addEventListener('resize', function () { moveTo(current); });
  }
})();

// Photo lightbox: pointer and keyboard access, with focus restoration.
(function () {
  if (document.documentElement.classList.contains('capture')) return;
  var items = document.querySelectorAll('.pol:not(.note), .aside-photo');
  if (!items.length) return;
  var lb = document.createElement('div');
  lb.className = 'lightbox'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo preview');
  lb.innerHTML = '<button class="close" aria-label="Close photo">×</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(lb);
  var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), closeButton = lb.querySelector('button');
  var previousFocus, previousOverflow, inerted = [];
  var open = function (source, caption) {
    previousFocus = document.activeElement; previousOverflow = document.body.style.overflow;
    img.src = source.getAttribute('src'); img.alt = source.alt || ''; cap.textContent = caption || '';
    lb.hidden = false; lb.classList.add('open'); document.body.style.overflow = 'hidden';
    Array.prototype.forEach.call(document.body.children, function (child) {
      if (child !== lb && child.tagName !== 'SCRIPT' && !child.inert) { child.inert = true; inerted.push(child); }
    });
    closeButton.focus();
  };
  var close = function () {
    if (lb.hidden) return;
    lb.classList.remove('open'); lb.hidden = true; document.body.style.overflow = previousOverflow;
    inerted.forEach(function (el) { el.inert = false; }); inerted = [];
    if (previousFocus) previousFocus.focus({ preventScroll: true });
  };
  items.forEach(function (it) {
    var source = it.querySelector('img'), caption = it.querySelector('figcaption');
    if (!source) return;
    it.tabIndex = 0; it.setAttribute('role', 'button'); it.setAttribute('aria-haspopup', 'dialog');
    it.setAttribute('aria-label', 'Enlarge photo: ' + (caption ? caption.textContent : source.alt));
    it.addEventListener('click', function () { it.focus({ preventScroll: true }); open(source, caption ? caption.textContent : ''); });
    it.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(source, caption ? caption.textContent : ''); }
    });
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === closeButton || e.target === img) close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { e.preventDefault(); closeButton.focus(); }
  });
})();

// ── Page-leave fade (fallback for browsers without View Transitions) ──
(function () {
  if ('startViewTransition' in document || document.documentElement.classList.contains('capture')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|http)/.test(href) || /\.pdf$/i.test(href)) return;
    e.preventDefault(); document.body.classList.add('leaving');
    setTimeout(function () { location.href = href; }, 300);
  });
  window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });
})();
