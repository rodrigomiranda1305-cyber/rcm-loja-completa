/* =========================================================
   RCM | Versão B: página pós-quiz (projeto.html)
   Personalização, status, vídeo, WhatsApp, animações, sliders e galeria.
   ========================================================= */
(function () {
  'use strict';

  const RCM = window.RCM;
  const CFG = RCM.CFG;
  const ls = RCM.ls;
  const SWIPER_VERSAO = '11.1.14';
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Dados de quem respondeu ---------- */
  const TIPOS = {
    'centro-automotivo': { na: 'no seu centro automotivo', um: 'um centro automotivo' },
    borracharia: { na: 'na sua borracharia', um: 'uma borracharia' },
    'oficina-mecanica': { na: 'na sua oficina mecânica', um: 'uma oficina mecânica' },
    'troca-de-oleo': { na: 'na sua loja de troca de óleo', um: 'uma loja de troca de óleo' },
    outro: { na: '', um: 'uma loja automotiva' },
  };
  const PERFIS = {
    mecanico: 'Você já sabe trabalhar. Agora vai trabalhar para você.',
    'outra-area': 'Nunca teve loja? É exatamente aí que a gente mais ajuda.',
    'empresario-outro-ramo': 'Você entende de negócio. A gente entende de oficina.',
    'empresario-setor': 'Expandir com quem já padronizou milhares de lojas é mais rápido.',
  };

  const salvo = ls.get('rcm_projeto') || {};
  const url = RCM.paramsUrl || {};
  const limparNome = (n) => {
    const p = String(n || '').replace(/[^A-Za-zÀ-ÿ'-]/g, '').slice(0, 30);
    return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '';
  };
  const nome = limparNome(salvo.nome || url.n);
  const tipoCod = TIPOS[salvo.tipo_cod] ? salvo.tipo_cod : (TIPOS[url.loja] ? url.loja : '');
  const perfilCod = PERFIS[salvo.perfil_cod] ? salvo.perfil_cod : (PERFIS[url.perfil] ? url.perfil : '');
  const temDados = !!(nome || tipoCod || perfilCod);
  // a animação de "enviando" só roda logo depois do quiz, uma vez
  const animar = salvo.animar && Date.now() - (salvo.quando || 0) < 10 * 60 * 1000;
  if (salvo.animar) { salvo.animar = false; ls.set('rcm_projeto', salvo); }

  function tipoUm() {
    if (tipoCod === 'outro' && salvo.tipo_outro) return `uma loja (${salvo.tipo_outro})`;
    return tipoCod ? TIPOS[tipoCod].um : 'uma loja automotiva';
  }

  /* ---------- Status no topo ---------- */
  const statusBox = $('[data-status]');
  const statusMsg = $('[data-status-msg]');
  const statusIc = $('[data-status-ic]');
  const statusBar = $('[data-status-bar]');
  const ICONE_OK = '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>';

  function statusFinal() {
    statusBox.classList.add('is-done');
    statusIc.innerHTML = ICONE_OK;
    statusMsg.innerHTML = '';
    const forte = document.createElement('strong');
    forte.textContent = `Tudo certo${nome ? `, ${nome}` : ''}!`;
    statusMsg.append(forte, ' Seu projeto já está com o nosso time.');
  }

  if (!temDados) {
    // aberto direto, sem ter respondido: página normal, sem falar de "suas respostas"
    statusBox.classList.add('is-done');
    statusIc.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-building"/></svg>';
    statusMsg.innerHTML = '<strong>Monte sua loja com a RCM</strong> Desde 1992 montando lojas automotivas em todo o Brasil.';
    $('[data-aviso] span').innerHTML = '<strong>Assista ao vídeo</strong> e veja como a RCM monta sua loja do galpão vazio até a inauguração.';
    $('[data-next-steps]').hidden = true;
    $('[data-titulo-cta]').innerHTML = 'Sua loja começa com uma conversa. <em>Vamos montar a sua?</em>';
  } else if (animar) {
    // as mensagens rodam mesmo com movimento reduzido (é informação; o CSS já para o giro do spinner)
    const MSGS = ['Enviando suas respostas ao nosso time...', 'Respostas recebidas ✓', 'Um especialista está analisando o seu perfil...'];
    statusBox.classList.remove('is-done');
    statusIc.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
    MSGS.forEach((m, i) => setTimeout(() => {
      statusMsg.textContent = m;
      statusMsg.style.animation = 'none'; void statusMsg.offsetWidth; statusMsg.style.animation = '';
      statusBar.style.width = `${Math.round(((i + 1) / MSGS.length) * 100)}%`;
    }, i * 2500));
    setTimeout(statusFinal, MSGS.length * 2500);
  } else {
    statusFinal();
  }

  /* ---------- Personalização das seções ---------- */
  if (temDados) {
    const titulo = $('[data-titulo-tipos]');
    const abre = nome ? `${nome}, olha` : 'Olha';
    if (tipoCod && TIPOS[tipoCod].na) titulo.textContent = `${abre} o que vai ${TIPOS[tipoCod].na}.`;
    else if (nome) titulo.textContent = `${abre} o que vai em cada tipo de loja.`;
  }
  const tag = (txt) => `<span class="tag-seu"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>${txt}</span>`;
  const cardTipo = tipoCod && $(`[data-tipo-cod="${tipoCod}"]`);
  if (cardTipo) {
    cardTipo.classList.add('is-seu');
    cardTipo.insertAdjacentHTML('afterbegin', tag('Seu projeto'));
    cardTipo.parentNode.prepend(cardTipo);
  }
  const cardPerfil = perfilCod && $(`[data-perfil="${perfilCod}"]`);
  if (cardPerfil) {
    cardPerfil.classList.add('is-seu');
    cardPerfil.insertAdjacentHTML('afterbegin', tag('Seu perfil'));
    const frase = document.createElement('p');
    frase.className = 'perfil-frase';
    frase.textContent = PERFIS[perfilCod];
    cardPerfil.appendChild(frase);
    cardPerfil.parentNode.prepend(cardPerfil);
  }

  /* ---------- WhatsApp ---------- */
  const numero = String(CFG.WHATSAPP || '').replace(/\D/g, '');
  const MSG = {
    principal: temDados
      ? `Olá${nome ? `, sou ${nome}` : ''}, acabei de responder o questionário. Quero abrir ${tipoUm()}.`
      : 'Olá! Vim pelo site da RCM e quero montar minha loja automotiva.',
    showroom: `Olá${nome ? `, sou ${nome}` : ''}! Quero agendar uma visita ao showroom da RCM em Aparecida de Goiânia.${temDados ? ' Acabei de responder o questionário.' : ''}`,
  };
  $$('[data-whats]').forEach((a) => {
    const tipo = a.dataset.whats;
    a.href = `https://wa.me/${numero}?text=${encodeURIComponent(MSG[tipo] || MSG.principal)}`;
    a.addEventListener('click', () => RCM.track('Contact', { content_name: tipo === 'showroom' ? 'Agendar visita ao showroom' : 'WhatsApp especialista' }));
  });

  /* ---------- Vídeo do topo + eventos AssistiuVideo (50% e 100%) ---------- */
  const marcados = {};
  function progresso(pct) {
    [50, 100].forEach((m) => {
      if (!marcados[m] && pct >= (m === 100 ? 97 : m)) {
        marcados[m] = true;
        RCM.track('AssistiuVideo', { percentual: m });
      }
    });
  }

  function montarVideo() {
    const box = $('[data-video-final]');
    const v = CFG.VIDEO_FINAL || {};
    const vertical = v.formato !== '16:9';
    box.classList.toggle('is-vertical', vertical);
    box.closest('.topo-inner').classList.toggle('is-vertical', vertical);
    if (!v.id) {
      box.innerHTML = `<div class="video-ph"><img src="assets/img/logo-rcm-distribuidora.svg" alt="" width="110" height="47">
        <span class="play-btn"><svg aria-hidden="true"><use href="#i-play"/></svg></span><p>Vídeo de apresentação</p></div>`;
      return;
    }
    const botaoSom = '<button type="button" class="btn-som" data-som><svg class="ic" aria-hidden="true"><use href="#i-sound"/></svg>Ativar som</button>';
    if (v.tipo === 'mp4') {
      box.innerHTML = `<video src="${esc(v.id)}" autoplay muted playsinline controls></video>${botaoSom}`;
      const vid = $('video', box);
      vid.addEventListener('timeupdate', () => { if (vid.duration) progresso((vid.currentTime / vid.duration) * 100); });
      vid.addEventListener('ended', () => progresso(100));
      $('[data-som]', box).addEventListener('click', (ev) => { vid.muted = false; vid.volume = 1; vid.play(); ev.currentTarget.remove(); });
      return;
    }
    const vimeo = v.tipo === 'vimeo';
    const src = vimeo
      ? `https://player.vimeo.com/video/${encodeURIComponent(v.id)}?autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0`
      : `https://www.youtube.com/embed/${encodeURIComponent(v.id)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    // capa enquanto o player carrega (o iframe entra depois do carregamento da página, para não pesar)
    if (!vimeo) box.innerHTML = `<img src="https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;
    const inserir = () => {
      box.innerHTML = `<iframe src="${src}" title="Vídeo de apresentação da RCM" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>${botaoSom}`;
      const frame = $('iframe', box);
      const enviarAoPlayer = (msg) => frame.contentWindow && frame.contentWindow.postMessage(JSON.stringify(msg), '*');
      frame.addEventListener('load', () => {
        if (vimeo) ['timeupdate', 'ended', 'playProgress', 'finish'].forEach((e) => enviarAoPlayer({ method: 'addEventListener', value: e }));
        else enviarAoPlayer({ event: 'listening', id: 'rcm-video', channel: 'widget' });
      });
      let duracao = 0;
      window.addEventListener('message', (ev) => {
        if (ev.source !== frame.contentWindow) return;
        let d = ev.data;
        try { if (typeof d === 'string') d = JSON.parse(d); } catch (e) { return; }
        if (!d) return;
        if (vimeo) {
          if ((d.event === 'timeupdate' || d.event === 'playProgress') && d.data) progresso((d.data.percent || 0) * 100);
          if (d.event === 'ended' || d.event === 'finish') progresso(100);
          return;
        }
        const info = d.info || {};
        if (d.event === 'infoDelivery') {
          if (info.duration) duracao = info.duration;
          if (duracao && typeof info.currentTime === 'number') progresso((info.currentTime / duracao) * 100);
          if (info.playerState === 0) progresso(100);
        }
        if (d.event === 'onStateChange' && d.info === 0) progresso(100);
      });
      $('[data-som]', box).addEventListener('click', (ev) => {
        if (vimeo) {
          enviarAoPlayer({ method: 'setMuted', value: false });
          enviarAoPlayer({ method: 'setVolume', value: 1 });
        } else {
          enviarAoPlayer({ event: 'command', func: 'unMute', args: [] });
          enviarAoPlayer({ event: 'command', func: 'setVolume', args: [100] });
          enviarAoPlayer({ event: 'command', func: 'playVideo', args: [] });
        }
        ev.currentTarget.remove();
      });
    };
    if (document.readyState === 'complete') setTimeout(inserir, 300);
    else window.addEventListener('load', () => setTimeout(inserir, 300));
  }
  montarVideo();

  /* ---------- Header e barra fixa (WhatsApp) ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const barra = $('[data-mobile-bar]');
  const topo = $('.topo');
  if (barra && topo && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const mostrar = !e.isIntersecting;
      barra.classList.toggle('is-visible', mostrar);
      barra.setAttribute('aria-hidden', String(!mostrar));
      barra.querySelector('a').tabIndex = mostrar ? 0 : -1;
    }, { rootMargin: '0px 0px -40% 0px' }).observe(topo);
  }

  /* ---------- Revelar no scroll ---------- */
  const revelar = $$('.reveal');
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
    const t0 = performance.now();
    const passo = (t) => {
      const p = Math.min((t - t0) / 1800, 1);
      mostrar(Math.round(de + (alvo - de) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }
  const contadores = $$('[data-count]');
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
  const tl = $('[data-timeline]');
  if (tl) {
    const fill = $('.tl-fill', tl);
    const passos = $$('.tl-step', tl);
    let agendado = false;
    const atualizar = () => {
      agendado = false;
      const r = tl.getBoundingClientRect();
      const marco = window.innerHeight * 0.62;
      fill.style.setProperty('--p', Math.max(0, Math.min(1, (marco - r.top) / r.height)).toFixed(3));
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
      // entra antes dos CSS do site para que os estilos do site tenham prioridade
      document.head.insertBefore(css, $('link[rel="stylesheet"]'));
      const js = document.createElement('script');
      js.src = `https://cdn.jsdelivr.net/npm/swiper@${SWIPER_VERSAO}/swiper-bundle.min.js`;
      js.onload = () => resolve(window.Swiper);
      js.onerror = reject;
      document.head.appendChild(js);
    });
    return swiperPromessa;
  }

  function iniciarSlider(el) {
    const raiz = el.closest('section') || document;
    const prev = $('[data-prev]', raiz);
    const next = $('[data-next]', raiz);
    const wrapper = $('.swiper-wrapper', el);
    // antes do Swiper carregar, as setas rolam o carrossel nativo
    const rolar = (dir) => {
      if (el.swiper) return dir > 0 ? el.swiper.slideNext() : el.swiper.slidePrev();
      wrapper.scrollBy({ left: dir * wrapper.clientWidth * 0.8, behavior: 'smooth' });
    };
    if (prev) prev.addEventListener('click', () => rolar(-1));
    if (next) next.addEventListener('click', () => rolar(1));
    carregarSwiper().then((Swiper) => {
      const sw = new Swiper(el, {
        slidesPerView: 'auto', spaceBetween: 16, grabCursor: true, watchOverflow: true,
        a11y: { prevSlideMessage: 'Anterior', nextSlideMessage: 'Próximo', slideLabelMessage: '{{index}} de {{slidesLength}}' },
      });
      const estado = () => { if (prev) prev.disabled = sw.isBeginning; if (next) next.disabled = sw.isEnd; };
      ['slideChange', 'reachEnd', 'fromEdge'].forEach((e) => sw.on(e, estado));
      estado();
    }).catch(() => { /* sem Swiper: o carrossel nativo continua funcionando */ });
  }
  function observarSlider(el) {
    if (!('IntersectionObserver' in window)) return iniciarSlider(el);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { iniciarSlider(el); io.disconnect(); } }, { rootMargin: '400px 0px' });
    io.observe(el);
  }

  /* ---------- Depoimentos ---------- */
  const playSvg = '<span class="play-btn"><svg aria-hidden="true"><use href="#i-play"/></svg></span>';
  function tocarDepoimento(btn, d) {
    const box = document.createElement('div');
    box.className = 'depo-card is-playing';
    if (d.tipo === 'mp4') box.innerHTML = `<video src="${esc(d.id)}" controls autoplay playsinline></video>`;
    else {
      const src = d.tipo === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.id)}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
        : d.id;
      box.innerHTML = `<iframe src="${esc(src)}" title="Depoimento de ${esc(d.nome)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }
    btn.replaceWith(box);
  }
  function renderDepoimentos(container) {
    const wrapper = $('.swiper-wrapper', container);
    const lista = (CFG.DEPOIMENTOS && CFG.DEPOIMENTOS.length) ? CFG.DEPOIMENTOS : Array(6).fill({});
    wrapper.innerHTML = '';
    lista.forEach((d) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide depo-slide';
      if (!d.id) {
        slide.innerHTML = `<div class="depo-card depo-ph" role="img" aria-label="Depoimento em breve">
            <img class="depo-ph-logo" src="assets/img/logo-rcm-distribuidora.svg" alt="" width="64" height="27">${playSvg}
            <div class="depo-info"><span class="depo-ph-tag">Em breve</span>
            <p class="depo-nome">Depoimento em breve</p><p class="depo-meta">Lojistas RCM de todo o Brasil</p></div></div>`;
      } else {
        const meta = [d.loja, d.cidade].filter(Boolean).join(' | ');
        const capa = d.capa || (d.tipo === 'youtube' ? `https://i.ytimg.com/vi/${encodeURIComponent(d.id)}/hqdefault.jpg` : '');
        slide.innerHTML = `<button type="button" class="depo-card" aria-label="Assistir depoimento de ${esc(d.nome || 'cliente')}">
            ${capa ? `<img src="${esc(capa)}" alt="" loading="lazy">` : ''}${playSvg}
            <span class="depo-info"><span class="depo-nome" style="display:block">${esc(d.nome)}</span><span class="depo-meta" style="display:block">${esc(meta)}</span></span></button>`;
        $('button', slide).addEventListener('click', (ev) => tocarDepoimento(ev.currentTarget, d));
      }
      wrapper.appendChild(slide);
    });
  }
  $$('[data-depoimentos]').forEach((el) => { renderDepoimentos(el); observarSlider(el); });
  $$('[data-produtos]').forEach(observarSlider);

  /* ---------- Galeria + lightbox ---------- */
  const galeria = $('[data-galeria]');
  const lb = $('[data-lightbox]');
  if (galeria && lb && typeof lb.showModal === 'function') {
    const itens = $$('a', galeria);
    const img = $('[data-lb-img]', lb);
    const cont = $('[data-lb-count]', lb);
    let atual = 0;
    const mostrar = (i) => {
      atual = (i + itens.length) % itens.length;
      img.src = itens[atual].getAttribute('href');
      img.alt = $('img', itens[atual]).alt;
      cont.textContent = `${atual + 1} / ${itens.length}`;
    };
    itens.forEach((a, i) => a.addEventListener('click', (ev) => {
      ev.preventDefault();
      mostrar(i);
      lb.showModal();
      document.body.classList.add('is-locked');
    }));
    lb.addEventListener('close', () => document.body.classList.remove('is-locked'));
    $('[data-lb-close]', lb).addEventListener('click', () => lb.close());
    $('[data-lb-prev]', lb).addEventListener('click', () => mostrar(atual - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => mostrar(atual + 1));
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
  $$('[data-tour]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.createElement('div');
      box.className = 'tour-player is-playing';
      box.innerHTML = `<video src="${btn.dataset.src}" controls autoplay playsinline></video>`;
      btn.replaceWith(box);
      RCM.track('VerTourVideo');
    });
  });

  $$('[data-ano]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
