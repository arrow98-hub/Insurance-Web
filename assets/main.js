/* NEXUS Diamond Team — interacciones */
(function () {
  const d = document, root = d.documentElement;
  root.classList.remove('no-js'); root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll suave (Lenis) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  d.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = d.querySelector(id); if (!el) return;
    e.preventDefault(); closeMenu();
    lenis ? lenis.scrollTo(el, { offset: -90 }) : el.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- Nav, progreso, tarjetas apiladas ---------- */
  const nav = d.querySelector('.nav'), bar = d.querySelector('.progress');
  const cards = [...d.querySelectorAll('.svc')];
  let lastY = 0;
  function onScroll() {
    const y = scrollY, h = d.body.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    if (nav) {
      nav.classList.toggle('solid', y > 40);
      nav.classList.toggle('hide', y > lastY && y > 400 && !nav.classList.contains('open'));
    }
    lastY = y;
    if (!reduce && innerWidth > 860) cards.forEach((c, i) => {
      const next = cards[i + 1]; if (!next) return;
      const r = next.getBoundingClientRect(), top = parseFloat(getComputedStyle(c).top);
      const p = Math.min(Math.max(1 - (r.top - top) / c.offsetHeight, 0), 1);
      c.style.transform = `scale(${1 - p * 0.06})`;
      c.style.filter = `brightness(${1 - p * 0.18})`;
    });
    else cards.forEach(c => { c.style.transform = ''; c.style.filter = ''; });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Menú móvil ---------- */
  const burger = d.querySelector('.burger');
  function closeMenu() { if (nav) { nav.classList.remove('open'); root.classList.remove('menu-open'); burger && burger.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); } }
  burger && burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    lenis && (open ? lenis.stop() : lenis.start());
  });
  d.querySelectorAll('.mobile-menu a').forEach(a => a.addEventListener('click', closeMenu));

  /* ---------- Texto palabra por palabra ---------- */
  d.querySelectorAll('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span'); w.className = 'w';
            const s = d.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('rotator')) walk(n);
        else if (n.nodeType === 1) { const w = d.createElement('span'); w.className = 'w'; const s = d.createElement('span'); s.style.setProperty('--i', i++); n.replaceWith(w); s.appendChild(n); w.appendChild(s); }
      });
    };
    walk(el); el.classList.add('split');
  });

  /* ---------- Revelado al hacer scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  d.querySelectorAll('.rv,.rv-l,.rv-scale,.split').forEach(el => io.observe(el));

  /* ---------- Palabras rotativas ---------- */
  d.querySelectorAll('.rotator').forEach(r => {
    const items = [...r.children]; let k = 0;
    items[0].classList.add('on');
    if (reduce || items.length < 2) return;
    setInterval(() => {
      const cur = items[k]; k = (k + 1) % items.length; const nx = items[k];
      cur.classList.remove('on'); cur.classList.add('out');
      nx.classList.remove('out'); nx.classList.add('on');
      setTimeout(() => cur.classList.remove('out'), 900);
    }, 2400);
  });

  /* ---------- Contadores ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => { const p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; p < 1 && requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  d.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  /* ---------- Marquesina (duplica la lista para bucle infinito) ---------- */
  d.querySelectorAll('.marquee').forEach(m => { const ul = m.querySelector('ul'); if (ul) { const c = ul.cloneNode(true); c.setAttribute('aria-hidden', 'true'); m.appendChild(c); } });

  /* ---------- Parallax suave ---------- */
  const px = [...d.querySelectorAll('[data-parallax]')];
  if (!reduce && px.length) {
    const run = () => { px.forEach(el => { const r = el.getBoundingClientRect(); const v = (r.top + r.height / 2 - innerHeight / 2) * (+el.dataset.parallax); el.style.translate = `0 ${v}px`; }); requestAnimationFrame(run); };
    requestAnimationFrame(run);
  }

  /* ---------- FAQ: abrir solo uno a la vez dentro del mismo grupo ---------- */
  d.querySelectorAll('.acc').forEach(g => g.querySelectorAll('details').forEach(dt => dt.addEventListener('toggle', () => {
    if (dt.open) g.querySelectorAll('details[open]').forEach(o => o !== dt && (o.open = false));
  })));

  /* ---------- Formularios ---------- */
  const WA = 'https://wa.me/17867158880?text=';
  d.querySelectorAll('form[data-lead]').forEach(form => {
    const card = form.closest('.form-card'), alertBox = form.querySelector('.form-alert'), btn = form.querySelector('[type=submit]');
    const validate = () => {
      let ok = true;
      form.querySelectorAll('[required]').forEach(inp => {
        const f = inp.closest('.field'); let v = inp.type === 'checkbox' ? inp.checked : inp.value.trim() !== '';
        if (v && inp.type === 'email') v = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim());
        if (v && inp.type === 'tel') v = inp.value.replace(/\D/g, '').length >= 10;
        f && f.classList.toggle('err', !v); if (!v) ok = false;
      });
      const grp = form.querySelector('[data-require-one]');
      if (grp) { const one = grp.querySelector('input:checked'); grp.closest('.field').classList.toggle('err', !one); if (!one) ok = false; }
      return ok;
    };
    form.addEventListener('input', e => { const f = e.target.closest('.field'); f && f.classList.contains('err') && validate(); });
    form.addEventListener('submit', async e => {
      e.preventDefault(); alertBox && alertBox.classList.remove('show');
      if (!validate()) { const first = form.querySelector('.err input, .err select, .err textarea'); first && first.focus(); return; }
      btn.disabled = true; const label = btn.querySelector('.t'); const old = label.textContent; label.textContent = 'Enviando…';
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'error');
        card.classList.add('sent');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        const fd = new FormData(form); const name = fd.get('nombre') || '';
        const txt = encodeURIComponent(`Hola Bernardo, soy ${name}. Quiero información (${form.dataset.lead}).`);
        if (alertBox) { alertBox.innerHTML = `No pudimos enviar el formulario en este momento. Escríbenos directamente por <a href="${WA}${txt}" target="_blank" rel="noopener"><b>WhatsApp</b></a> o a <a href="mailto:info@nexusdiamondteam.com"><b>info@nexusdiamondteam.com</b></a>.`; alertBox.classList.add('show'); }
      } finally { btn.disabled = false; label.textContent = old; }
    });
  });

  /* ---------- Banner de cookies ---------- */
  const ck = d.querySelector('.cookie');
  if (ck) {
    let seen = false; try { seen = localStorage.getItem('ndt-cookies') === '1'; } catch (e) {}
    if (!seen) setTimeout(() => ck.classList.add('show'), 1800);
    ck.querySelector('button').addEventListener('click', () => { ck.classList.remove('show'); try { localStorage.setItem('ndt-cookies', '1'); } catch (e) {} });
  }

  d.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
