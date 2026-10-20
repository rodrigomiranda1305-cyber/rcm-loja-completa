/* =========================================================
   RCM | Landing: rastreamento, animações, sliders, galeria
   ========================================================= */
(function () {
  'use strict';

  // CONFIG vem de config.js (const global, não fica em window)
  const CFG = typeof CONFIG !== 'undefined' ? CONFIG : {};
  const SWIPER_VERSAO = '11.1.14';
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* idem */ } },
  };

  /* ---------- Meta Pixel ---------- */
  if (CFG.META_PIXEL_ID) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CFG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function track(evento, params, opcoes) {
    const custom = !['PageView', 'Lead', 'CompleteRegistration', 'Contact', 'ViewContent'].includes(evento);
    if (window.fbq) window.fbq(custom ? 'trackCustom' : 'track', evento, params || {}, opcoes || {});
    if (!CFG.META_PIXEL_ID) console.info('[RCM pixel desligado]', evento, params || {});
  }

  /* ---------- Utmify (script de UTMs) ---------- */
  if (CFG.UTMIFY_SCRIPT) {
    const carregarUtmify = () => {
      const s = document.createElement('script');
      s.src = 'https://cdn.utmify.com.br/scripts/utms/latest.js';
      s.async = true;
      s.setAttribute('data-utmify-prevent-xcod-sck', '');
      s.setAttribute('data-utmify-prevent-subids', '');
      document.head.appendChild(s);
    };
    if ('requestIdleCallback' in window) requestIdleCallback(carregarUtmify, { timeout: 3000 });
    else window.addEventListener('load', () => setTimeout(carregarUtmify, 1200));
  }

  /* ---------- UTMs: guarda o último clique com UTM/fbclid ---------- */
  const CHAVES_UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  const utms = (function () {
    const q = new URLSearchParams(location.search);
    const salvo = ls.get('rcm_utms') || {};
    const novos = {};
    CHAVES_UTM.forEach((k) => { if (q.get(k)) novos[k] = q.get(k).slice(0, 300); });
    let dados = salvo;
    if (Object.keys(novos).length) dados = Object.assign({}, novos, { url_entrada: location.href.slice(0, 500) });
    if (!dados.url_entrada) dados.url_entrada = location.href.slice(0, 500);
    ls.set('rcm_utms', dados);
    return dados;
  })();

  /* ---------- Header e barra fixa ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const barra = document.querySelector('[data-mobile-bar]');
  const hero = document.querySelector('.hero');
  if (barra && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const mostrar = !e.isIntersecting;
      barra.classList.toggle('is-visible', mostrar);
      barra.setAttribute('aria-hidden', String(!mostrar));
      barra.querySelector('button').tabIndex = mostrar ? 0 : -1;
    }, { rootMargin: '0px 0px -35% 0px' }).observe(hero);
  }

  /* ---------- Revelar no scroll ---------- */
  const revelar = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduzMovimento) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revelar.forEach((el) => io.observe(el));
  } else {
    revelar.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Contadores ---------- */
  const fmt = new Intl.NumberFormat('pt-BR');
  function contar(el) {
    const alvo = Number(el.dataset.count);
    const de = Number(el.dataset.from || 0);
    const milhar = el.dataset.format === 'milhar';
    const mostrar = (v) => { el.textContent = milhar ? fmt.format(v) : String(v); };
    if (reduzMovimento) { mostrar(alvo); return; }
    const dur = 1800;
    const t0 = performance.now();
    const passo = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      mostrar(Math.round(de + (alvo - de) * e));
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }
  const contadores = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduzMovimento) {
    contadores.forEach((el) => {
      const de = Number(el.dataset.from || 0);
      el.textContent = el.dataset.format === 'milhar' ? fmt.format(de) : String(de);
    });
    const ioC = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) { contar(e.target); ioC.unobserve(e.target); } });
    }, { threshold: 0.6 });
    contadores.forEach((el) => ioC.observe(el));
  }

  /* ---------- Linha do tempo ---------- */
  const tl = document.querySelector('[data-timeline]');
  if (tl) {
    const fill = tl.querySelector('.tl-fill');
    const passos = tl.querySelectorAll('.tl-step');
    let agendado = false;
    const atualizar = () => {
      agendado = false;
      const r = tl.getBoundingClientRect();
      const marco = window.innerHeight * 0.62;
      const p = Math.max(0, Math.min(1, (marco - r.top) / r.height));
      fill.style.setProperty('--p', p.toFixed(3));
      passos.forEach((s) => s.classList.toggle('is-active', s.getBoundingClientRect().top < marco));
    };
    const agendar = () => { if (!agendado) { agendado = true; requestAnimationFrame(atualizar); } };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { window.addEventListener('scroll', agendar, { passive: true }); agendar(); }
        else window.removeEventListener('scroll', agendar);
      }).observe(tl);
    } else { window.addEventListener('scroll', agendar, { passive: true }); }
  }

  /* ---------- Swiper (carregado só quando necessário) ---------- */
  let swiperPromessa = null;
  function carregarSwiper() {
    if (window.Swiper) return Promise.resolve(window.Swiper);
    if (swiperPromessa) return swiperPromessa;
    swiperPromessa = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = `https://cdn.jsdelivr.net/npm/swiper@${SWIPER_VERSAO}/swiper-bundle.min.css`;
      // entra antes do style.css para que os estilos do site tenham prioridade
      document.head.insertBefore(css, document.querySelector('link[rel="stylesheet"]'));
      const js = document.createElement('script');
      js.src = `https://cdn.jsdelivr.net/npm/swiper@${SWIPER_VERSAO}/swiper-bundle.min.js`;
      js.onload = () => resolve(window.Swiper);
      js.onerror = reject;
      document.head.appendChild(js);
    });
    return swiperPromessa;
  }

  function iniciarSlider(el) {
    if (!el || el.dataset.sliderOk) return;
    el.dataset.sliderOk = '1';
    const raiz = el.closest('section, .final-depo') || document;
    const prev = raiz.querySelector('[data-prev]');
    const next = raiz.querySelector('[data-next]');
    const wrapper = el.querySelector('.swiper-wrapper');
    // antes do Swiper carregar, as setas rolam o carrossel nativo
    const rolar = (dir) => {
      if (el.swiper) return dir > 0 ? el.swiper.slideNext() : el.swiper.slidePrev();
      wrapper.scrollBy({ left: dir * wrapper.clientWidth * 0.8, behavior: 'smooth' });
    };
    if (prev) prev.addEventListener('click', () => rolar(-1));
    if (next) next.addEventListener('click', () => rolar(1));
    carregarSwiper().then((Swiper) => {
      const sw = new Swiper(el, {
        slidesPerView: 'auto',
        spaceBetween: 16,
        grabCursor: true,
        watchOverflow: true,
        a11y: { prevSlideMessage: 'Anterior', nextSlideMessage: 'Próximo', slideLabelMessage: '{{index}} de {{slidesLength}}' },
      });
      const estado = () => {
        if (prev) prev.disabled = sw.isBeginning;
        if (next) next.disabled = sw.isEnd;
      };
      sw.on('slideChange', estado);
      sw.on('reachEnd', estado);
      sw.on('fromEdge', estado);
      estado();
    }).catch(() => { /* sem Swiper: o carrossel nativo continua funcionando */ });
  }

  function observarSlider(el) {
    if (!('IntersectionObserver' in window)) return iniciarSlider(el);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { iniciarSlider(el); io.disconnect(); }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
  }

  /* ---------- Depoimentos ---------- */
  const LOGO = 'assets/img/logo-rcm-distribuidora.svg';
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const playSvg = '<span class="play-btn"><svg aria-hidden="true"><use href="#i-play"/></svg></span>';

  function capaDe(d) {
    if (d.capa) return d.capa;
    if (d.tipo === 'youtube' && d.id) return `https://i.ytimg.com/vi/${encodeURIComponent(d.id)}/hqdefault.jpg`;
    return '';
  }

  function tocarDepoimento(btn, d) {
    const box = document.createElement('div');
    box.className = 'depo-card is-playing';
    if (d.tipo === 'mp4') {
      box.innerHTML = `<video src="${esc(d.id)}" controls autoplay playsinline></video>`;
    } else {
      const src = d.tipo === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.id)}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
        : d.id;
      box.innerHTML = `<iframe src="${esc(src)}" title="Depoimento de ${esc(d.nome)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }
    btn.replaceWith(box);
  }

  function renderDepoimentos(container) {
    const wrapper = container.querySelector('.swiper-wrapper');
    const lista = (CFG.DEPOIMENTOS && CFG.DEPOIMENTOS.length) ? CFG.DEPOIMENTOS : Array(6).fill({});
    wrapper.innerHTML = '';
    lista.forEach((d) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide depo-slide';
      if (!d.id) {
        slide.innerHTML = `<div class="depo-card depo-ph" role="img" aria-label="Depoimento em breve">
            <img class="depo-ph-logo" src="${LOGO}" alt="" width="64" height="27">${playSvg}
            <div class="depo-info"><span class="depo-ph-tag">Em breve</span>
            <p class="depo-nome">Depoimento em breve</p><p class="depo-meta">Lojistas RCM de todo o Brasil</p></div></div>`;
      } else {
        const meta = [d.loja, d.cidade].filter(Boolean).join(' | ');
        const capa = capaDe(d);
        slide.innerHTML = `<button type="button" class="depo-card" aria-label="Assistir depoimento de ${esc(d.nome || 'cliente')}">
            ${capa ? `<img src="${esc(capa)}" alt="" loading="lazy">` : ''}${playSvg}
            <span class="depo-info"><span class="depo-nome" style="display:block">${esc(d.nome)}</span><span class="depo-meta" style="display:block">${esc(meta)}</span></span></button>`;
        slide.querySelector('button').addEventListener('click', (ev) => tocarDepoimento(ev.currentTarget, d));
      }
      wrapper.appendChild(slide);
    });
  }

  document.querySelectorAll('.depo [data-depoimentos]').forEach((el) => { renderDepoimentos(el); observarSlider(el); });
  document.querySelectorAll('[data-produtos]').forEach(observarSlider);

  /* ---------- Galeria + lightbox ---------- */
  const galeria = document.querySelector('[data-galeria]');
  const lb = document.querySelector('[data-lightbox]');
  if (galeria && lb && typeof lb.showModal === 'function') {
    const itens = Array.from(galeria.querySelectorAll('a'));
    const img = lb.querySelector('[data-lb-img]');
    const cont = lb.querySelector('[data-lb-count]');
    let atual = 0;
    const mostrar = (i) => {
      atual = (i + itens.length) % itens.length;
      const a = itens[atual];
      img.src = a.getAttribute('href');
      img.alt = a.querySelector('img').alt;
      cont.textContent = `${atual + 1} / ${itens.length}`;
    };
    itens.forEach((a, i) => a.addEventListener('click', (ev) => {
      ev.preventDefault();
      mostrar(i);
      lb.showModal();
      document.body.classList.add('is-locked');
    }));
    lb.addEventListener('close', () => document.body.classList.remove('is-locked'));
    lb.querySelector('[data-lb-close]').addEventListener('click', () => lb.close());
    lb.querySelector('[data-lb-prev]').addEventListener('click', () => mostrar(atual - 1));
    lb.querySelector('[data-lb-next]').addEventListener('click', () => mostrar(atual + 1));
    lb.addEventListener('click', (ev) => { if (ev.target === lb) lb.close(); });
    lb.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft') mostrar(atual - 1);
      if (ev.key === 'ArrowRight') mostrar(atual + 1);
    });
    let x0 = null;
    lb.addEventListener('touchstart', (ev) => { x0 = ev.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (ev) => {
      if (x0 === null) return;
      const dx = ev.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------- Vídeo do tour (carrega só no toque) ---------- */
  document.querySelectorAll('[data-tour]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.createElement('div');
      box.className = 'tour-player is-playing';
      box.innerHTML = `<video src="${btn.dataset.src}" controls autoplay playsinline></video>`;
      btn.replaceWith(box);
      track('VerTourVideo');
    });
  });

  /* ---------- Ano no rodapé ---------- */
  document.querySelectorAll('[data-ano]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- API usada pelo quiz.js ---------- */
  window.RCM = { track, utms, ls, renderDepoimentos, iniciarSlider };
})();
