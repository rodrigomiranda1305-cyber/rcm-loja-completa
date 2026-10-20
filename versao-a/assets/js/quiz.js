/* =========================================================
   RCM | Quiz "Monte sua Loja Completa"
   Envia o estado completo para a planilha a cada etapa concluída.
   ========================================================= */
(function () {
  'use strict';

  // CONFIG vem de config.js (const global, não fica em window)
  const CFG = typeof CONFIG !== 'undefined' ? CONFIG : {};
  const RCM = window.RCM || { track() {}, utms: {}, ls: null, renderDepoimentos() {}, iniciarSlider() {} };
  const LS_ESTADO = 'rcm_quiz_v1';
  const LS_FILA = 'rcm_fila_v1';

  const ls = RCM.ls || {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* idem */ } },
  };

  const PASSOS = ['contato', 'tipo', 'prazo', 'investimento', 'perfil', 'duvida', 'final'];
  const NOME_ETAPA = {
    contato: 'Contato', tipo: 'P1 Tipo de loja', prazo: 'P2 Prazo',
    investimento: 'P3 Investimento', perfil: 'P4 Perfil', duvida: 'P5 Dúvida',
  };
  const TOTAL = 6;
  const DDDS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99];

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const quiz = $('#quiz');
  if (!quiz) return;
  const passoEl = (nome) => $(`[data-step="${nome}"]`, quiz);
  const barraEl = $('[data-q-bar]', quiz);
  const etapaEl = $('[data-q-etapa]', quiz);
  const pe = $('[data-q-foot]', quiz);
  const confirmEl = $('[data-q-confirm]', quiz);
  const txtDuvida = $('#q-duvida', quiz);

  /* ---------- Estado ---------- */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  function novoEstado() {
    return {
      lead_id: '', passo: 'contato', aberto: false, concluido: false, contatoEnviado: false, bot: false,
      origem: '', preTipo: '', maxFeito: -1, ultimoEnvio: '',
      contato: { nome: '', whatsapp: '', email: '' },
      r: { tipo: '', tipo_outro: '', prazo: '', prazo_cod: '', investimento: '', investimento_cod: '', perfil: '', duvida: '' },
    };
  }
  let st = Object.assign(novoEstado(), ls.get(LS_ESTADO) || {});
  const salvar = () => ls.set(LS_ESTADO, st);

  /* ---------- Utilidades ---------- */
  const soDigitos = (v) => String(v || '').replace(/\D/g, '');
  function mascaraFone(v) {
    const d = soDigitos(v).slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  function foneValido(v) {
    const d = soDigitos(v);
    return d.length === 11 && DDDS.includes(Number(d.slice(0, 2))) && d[2] === '9' && !/^(\d)\1+$/.test(d.slice(2));
  }
  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const primeiroNome = (n) => {
    const p = String(n || '').trim().split(/\s+/)[0] || '';
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  };
  const dispositivo = () => (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 'mobile' : 'desktop');
  const ehDesktop = () => window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  function tipoTexto() {
    return st.r.tipo === 'Outro' && st.r.tipo_outro ? `Outro: ${st.r.tipo_outro}` : st.r.tipo;
  }
  function respondidas() {
    return ['tipo', 'prazo', 'investimento', 'perfil'].filter((k) => st.r[k]).length + (st.concluido ? 1 : 0);
  }

  /* ---------- Envio para a planilha ---------- */
  function montarDados() {
    let duvida = st.r.duvida;
    if (!st.concluido && !duvida && txtDuvida && txtDuvida.value.trim()) duvida = `[rascunho, não enviado] ${txtDuvida.value.trim()}`;
    const u = RCM.utms || {};
    return {
      lead_id: st.lead_id,
      status: st.concluido ? 'completo' : (respondidas() > 0 ? 'em andamento' : 'iniciou'),
      etapa_atual: st.maxFeito >= 0 ? NOME_ETAPA[PASSOS[st.maxFeito]] : '',
      etapa_idx: st.maxFeito,
      nome: st.contato.nome,
      whatsapp: mascaraFone(st.contato.whatsapp),
      email: st.contato.email,
      tipo: tipoTexto(),
      prazo: st.r.prazo, prazo_cod: st.r.prazo_cod,
      investimento: st.r.investimento, investimento_cod: st.r.investimento_cod,
      perfil: st.r.perfil,
      duvida: duvida,
      utm_source: u.utm_source || '', utm_medium: u.utm_medium || '', utm_campaign: u.utm_campaign || '',
      utm_content: u.utm_content || '', utm_term: u.utm_term || '', fbclid: u.fbclid || '',
      url_entrada: u.url_entrada || location.href,
      origem: st.origem,
      dispositivo: dispositivo(),
      versao: CFG.VERSAO_FUNIL || 'A',
      site: '',
    };
  }

  function lerFila() { return ls.get(LS_FILA) || {}; }
  function gravarFila(f) { if (Object.keys(f).length) ls.set(LS_FILA, f); else ls.del(LS_FILA); }

  function enviarFila() {
    if (!CFG.APPS_SCRIPT_URL) return;
    const fila = lerFila();
    Object.keys(fila).forEach((id) => {
      const corpo = fila[id];
      fetch(CFG.APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: corpo,
        keepalive: true,
      }).then(() => {
        const f = lerFila();
        if (f[id] === corpo) { delete f[id]; gravarFila(f); }
      }).catch(() => { /* fica na fila para a próxima etapa */ });
    });
  }

  function enviar() {
    if (st.bot || !st.contatoEnviado) return;
    const dados = montarDados();
    const corpo = JSON.stringify(dados);
    st.ultimoEnvio = corpo;
    salvar();
    if (!CFG.APPS_SCRIPT_URL) {
      console.info('[RCM modo teste] APPS_SCRIPT_URL vazio. Dados que seriam enviados:', dados);
      return;
    }
    const fila = lerFila();
    fila[st.lead_id] = corpo;
    gravarFila(fila);
    enviarFila();
  }

  // Pessoa saindo da página: manda o estado atual com sendBeacon
  function enviarAoSair() {
    if (st.bot || !st.contatoEnviado || !CFG.APPS_SCRIPT_URL) return;
    const corpo = JSON.stringify(montarDados());
    const fila = lerFila();
    if (corpo === st.ultimoEnvio && !Object.keys(fila).length) return;
    fila[st.lead_id] = corpo;
    let ok = true;
    Object.keys(fila).forEach((id) => {
      const blob = new Blob([fila[id]], { type: 'text/plain;charset=utf-8' });
      if (!(navigator.sendBeacon && navigator.sendBeacon(CFG.APPS_SCRIPT_URL, blob))) ok = false;
    });
    if (ok) { gravarFila({}); st.ultimoEnvio = corpo; } else gravarFila(fila);
    salvar();
  }
  window.addEventListener('pagehide', enviarAoSair);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') enviarAoSair(); });
  window.addEventListener('online', enviarFila);

  function concluirPasso(nome) {
    const idx = PASSOS.indexOf(nome);
    if (idx > st.maxFeito) st.maxFeito = idx;
    salvar();
    enviar();
    RCM.track('QuizEtapa', { etapa: idx + 1, nome_etapa: NOME_ETAPA[nome] });
  }

  /* ---------- Navegação ---------- */
  function proximoDe(nome) {
    let i = PASSOS.indexOf(nome) + 1;
    if (PASSOS[i] === 'tipo' && st.r.tipo) i += 1; // P1 já respondida pelo card
    return PASSOS[i];
  }
  function anteriorDe(nome) {
    const i = PASSOS.indexOf(nome);
    return i > 0 ? PASSOS[i - 1] : null;
  }

  function mostrarPasso(nome, voltando) {
    st.passo = nome;
    salvar();
    $$('.q-step', quiz).forEach((el) => { el.hidden = el.dataset.step !== nome; });
    const el = passoEl(nome);
    el.classList.toggle('is-back', !!voltando);
    el.style.animation = 'none';
    void el.offsetWidth; // reinicia a animação de entrada
    el.style.animation = '';

    const idx = PASSOS.indexOf(nome);
    const final = nome === 'final';
    etapaEl.textContent = final ? 'Concluído' : `Etapa ${idx + 1} de ${TOTAL}`;
    barraEl.style.width = final ? '100%' : `${Math.round(((idx + 1) / TOTAL) * 100)}%`;
    pe.classList.toggle('is-hidden', nome === 'contato' || final);

    preencherPasso(nome);
    $('.quiz-scroll', quiz).scrollTop = 0;
    // no desktop o cursor já vai para o nome; no celular foca o título para não abrir o teclado sozinho
    if (nome === 'contato' && ehDesktop()) setTimeout(() => $('#q-nome', quiz).focus(), 350);
    else { const titulo = $('.q-title', el); if (titulo) titulo.focus({ preventScroll: true }); }
  }

  function preencherPasso(nome) {
    const el = passoEl(nome);
    if (nome === 'contato') {
      $('#q-nome', quiz).value = st.contato.nome;
      $('#q-whats', quiz).value = mascaraFone(st.contato.whatsapp);
      $('#q-email', quiz).value = st.contato.email;
    }
    const campo = { tipo: 'tipo', prazo: 'prazo', investimento: 'investimento', perfil: 'perfil' }[nome];
    if (campo) {
      $$('.q-opt', el).forEach((b) => b.classList.toggle('is-selected', b.dataset.value === st.r[campo]));
      if (nome === 'tipo') {
        const box = $('[data-outro-box]', el);
        box.hidden = st.r.tipo !== 'Outro';
        $('#q-outro', quiz).value = st.r.tipo_outro;
      }
    }
    if (nome === 'duvida') {
      if (st.r.duvida && !txtDuvida.value) txtDuvida.value = st.r.duvida;
      sincronizarChips();
    }
  }

  /* ---------- Abrir / fechar ---------- */
  let ignorarPop = false;

  function abrir(opts) {
    opts = opts || {};
    if (!st.lead_id) st.lead_id = uuid();
    if (!st.origem && opts.origem) st.origem = opts.origem;
    if (opts.tipo && !st.concluido) {
      if (!st.contatoEnviado) st.preTipo = opts.tipo;
      else if (!st.r.tipo || st.passo === 'tipo') {
        st.r.tipo = opts.tipo; st.r.tipo_outro = '';
        if (st.passo === 'tipo') { st.aberto = true; concluirPasso('tipo'); st.passo = proximoDe('tipo'); }
      }
    }
    st.aberto = true;
    salvar();

    quiz.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => quiz.classList.add('is-open'));
    if (!history.state || !history.state.rcmQuiz) history.pushState({ rcmQuiz: true }, '');

    if (st.concluido) mostrarFinal(false);
    else mostrarPasso(PASSOS.includes(st.passo) && st.passo !== 'final' ? st.passo : 'contato');
  }

  function fechar(viaHistorico) {
    confirmEl.hidden = true;
    quiz.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    st.aberto = false;
    salvar();
    enviarAoSair();
    setTimeout(() => { quiz.hidden = true; }, 350);
    if (!viaHistorico && history.state && history.state.rcmQuiz) { ignorarPop = true; history.back(); }
  }

  function pedirFechar() {
    if (st.passo === 'final' || st.concluido) return fechar();
    const idx = PASSOS.indexOf(st.passo);
    const faltam = st.passo === 'contato' ? 5 : PASSOS.indexOf('duvida') - idx + 1;
    $('[data-q-confirm-txt]', quiz).textContent = faltam === 1
      ? 'Falta só 1 pergunta. Quer mesmo sair?'
      : `Faltam só ${faltam} perguntas. Quer mesmo sair?`;
    confirmEl.hidden = false;
    $('[data-q-stay]', quiz).focus();
  }

  window.addEventListener('popstate', () => {
    if (ignorarPop) { ignorarPop = false; return; }
    if (quiz.hidden) return;
    if (!confirmEl.hidden) { confirmEl.hidden = true; history.pushState({ rcmQuiz: true }, ''); return; }
    const ant = anteriorDe(st.passo);
    if (ant && st.passo !== 'final') {
      mostrarPasso(ant, true);
      history.pushState({ rcmQuiz: true }, '');
    } else {
      fechar(true);
    }
  });

  document.addEventListener('click', (ev) => {
    const gatilho = ev.target.closest('[data-open-quiz]');
    if (gatilho) { ev.preventDefault(); abrir({ tipo: gatilho.dataset.tipo, origem: gatilho.dataset.origem }); }
  });
  $('[data-q-close]', quiz).addEventListener('click', pedirFechar);
  $('[data-q-stay]', quiz).addEventListener('click', () => { confirmEl.hidden = true; });
  $('[data-q-leave]', quiz).addEventListener('click', () => fechar());
  confirmEl.addEventListener('click', (ev) => { if (ev.target === confirmEl) confirmEl.hidden = true; });
  $('[data-q-back]', quiz).addEventListener('click', () => {
    const ant = anteriorDe(st.passo);
    if (ant) mostrarPasso(ant, true);
  });

  /* ---------- Etapa: contato ---------- */
  const fNome = $('#q-nome', quiz);
  const fWhats = $('#q-whats', quiz);
  const fEmail = $('#q-email', quiz);
  if (CFG.EMAIL_OBRIGATORIO) {
    $('[data-email-opt]', quiz).hidden = true;
    fEmail.required = true;
  }
  fWhats.addEventListener('input', () => {
    fWhats.value = mascaraFone(fWhats.value);
    erro('whatsapp', '');
  });
  fNome.addEventListener('input', () => erro('nome', ''));
  fEmail.addEventListener('input', () => erro('email', ''));

  function erro(campo, msg) {
    const p = $(`[data-err="${campo}"]`, quiz);
    if (p) p.textContent = msg;
    const input = { nome: fNome, whatsapp: fWhats, email: fEmail, outro: $('#q-outro', quiz), duvida: txtDuvida }[campo];
    if (input) {
      input.classList.toggle('is-invalid', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg && p) { p.id = p.id || `err-${campo}`; input.setAttribute('aria-describedby', p.id); }
    }
    return !msg;
  }

  passoEl('contato').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = fNome.value.trim().replace(/\s+/g, ' ');
    const whats = fWhats.value;
    const email = fEmail.value.trim();
    let ok = true;
    if (nome.length < 2 || !/[A-Za-zÀ-ÿ]/.test(nome)) ok = erro('nome', 'Digite seu nome.') && ok;
    if (!foneValido(whats)) ok = erro('whatsapp', 'Digite um WhatsApp válido com DDD, ex.: (62) 99999-9999.') && ok;
    if (email && !emailValido(email)) ok = erro('email', 'Confira o e-mail digitado.') && ok;
    else if (!email && CFG.EMAIL_OBRIGATORIO) ok = erro('email', 'Digite seu e-mail.') && ok;
    if (!ok) { const inv = $('.is-invalid', quiz); if (inv) inv.focus(); return; }

    if ($('#q-site', quiz).value) st.bot = true; // honeypot preenchido: segue sem gravar

    const primeiraVez = !st.contatoEnviado;
    st.contato = { nome, whatsapp: soDigitos(whats), email };
    st.contatoEnviado = true;
    if (st.preTipo && !st.r.tipo) { st.r.tipo = st.preTipo; st.r.tipo_outro = ''; }
    st.preTipo = '';
    if (st.r.tipo && st.maxFeito < 1) st.maxFeito = 1;
    concluirPasso('contato');
    if (primeiraVez && !st.bot) RCM.track('Lead', { content_name: 'Monte sua Loja Completa' }, { eventID: st.lead_id });
    mostrarPasso(proximoDe('contato'));
  });

  /* ---------- Perguntas de múltipla escolha ---------- */
  let avancando = false;
  ['tipo', 'prazo', 'investimento', 'perfil'].forEach((nome) => {
    const el = passoEl(nome);
    $$('.q-opt', el).forEach((btn) => {
      btn.addEventListener('click', () => {
        if (avancando) return;
        $$('.q-opt', el).forEach((b) => b.classList.toggle('is-selected', b === btn));
        if (nome === 'tipo' && btn.hasAttribute('data-outro')) {
          const box = $('[data-outro-box]', el);
          box.hidden = false;
          setTimeout(() => $('#q-outro', quiz).focus(), 60);
          return;
        }
        if (nome === 'tipo') { $('[data-outro-box]', el).hidden = true; st.r.tipo_outro = ''; }
        st.r[nome] = btn.dataset.value;
        if (btn.dataset.cod) st.r[`${nome}_cod`] = btn.dataset.cod;
        avancando = true;
        setTimeout(() => {
          avancando = false;
          concluirPasso(nome);
          mostrarPasso(proximoDe(nome));
        }, 300);
      });
    });
  });

  function confirmarOutro() {
    const v = $('#q-outro', quiz).value.trim();
    if (v.length < 2) { erro('outro', 'Conte em poucas palavras qual tipo de loja.'); $('#q-outro', quiz).focus(); return; }
    erro('outro', '');
    st.r.tipo = 'Outro';
    st.r.tipo_outro = v.slice(0, 120);
    concluirPasso('tipo');
    mostrarPasso(proximoDe('tipo'));
  }
  $('[data-outro-ok]', quiz).addEventListener('click', confirmarOutro);
  $('#q-outro', quiz).addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); confirmarOutro(); } });

  /* ---------- P5: dúvida ---------- */
  const chips = $$('.chip', quiz);
  function sincronizarChips() {
    const t = txtDuvida.value;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(t.includes(c.textContent.trim()))));
  }
  chips.forEach((c) => c.addEventListener('click', () => {
    const frase = c.textContent.trim();
    let t = txtDuvida.value.trim();
    if (c.getAttribute('aria-pressed') === 'true') {
      t = t.split(`${frase}.`).join('').split(frase).join('').replace(/\s{2,}/g, ' ').replace(/^[\s.]+/, '').trim();
    } else {
      t = t ? `${/[.!?]$/.test(t) ? t : `${t}.`} ${frase}.` : `${frase}.`;
    }
    txtDuvida.value = t;
    sincronizarChips();
    erro('duvida', '');
  }));
  txtDuvida.addEventListener('input', () => { sincronizarChips(); erro('duvida', ''); });
  txtDuvida.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey && ehDesktop()) { ev.preventDefault(); passoEl('duvida').requestSubmit(); }
  });

  passoEl('duvida').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const t = txtDuvida.value.trim();
    const temChip = chips.some((c) => c.getAttribute('aria-pressed') === 'true');
    if (!temChip && t.length < 10) { erro('duvida', 'Toque em uma das opções acima ou escreva sua dúvida (pelo menos 10 letras).'); txtDuvida.focus(); return; }
    st.r.duvida = t.slice(0, 1500);
    st.concluido = true;
    concluirPasso('duvida');
    if (!st.bot) RCM.track('CompleteRegistration', { content_name: 'Monte sua Loja Completa', status: 'completo' }, { eventID: `${st.lead_id}-c` });
    mostrarFinal(true);
  });

  /* ---------- Tela final ---------- */
  const MSGS = [
    'Enviando suas respostas ao nosso time...',
    'Respostas recebidas ✓',
    'Um especialista está analisando o seu perfil...',
  ];
  let timers = [];

  function artigoTipo() {
    const mapa = {
      'Centro automotivo': 'um centro automotivo', Borracharia: 'uma borracharia',
      'Oficina mecânica geral': 'uma oficina mecânica', 'Troca de óleo': 'uma loja de troca de óleo',
    };
    if (st.r.tipo === 'Outro') return st.r.tipo_outro ? `uma loja (${st.r.tipo_outro})` : 'uma loja automotiva';
    return mapa[st.r.tipo] || 'uma loja automotiva';
  }

  function statusFinal(box) {
    const nome = primeiroNome(st.contato.nome);
    box.classList.add('is-done');
    $('[data-status-ic]', box).innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>';
    const msg = $('[data-status-msg]', box);
    msg.innerHTML = '';
    const forte = document.createElement('strong');
    forte.textContent = `Tudo certo${nome ? `, ${nome}` : ''}!`;
    msg.append(forte, 'Seu projeto já está com o nosso time. Assista ao vídeo abaixo enquanto preparamos seu direcionamento. Não feche esta página.');
  }

  function animarStatus() {
    const box = $('[data-status]', quiz);
    const msg = $('[data-status-msg]', box);
    const barra = $('[data-status-bar]', box);
    timers.forEach(clearTimeout);
    timers = [];
    box.classList.remove('is-done');
    $('[data-status-ic]', box).innerHTML = '<span class="spinner" aria-hidden="true"></span>';
    barra.style.transition = 'none';
    barra.style.width = '0';
    void barra.offsetWidth;
    barra.style.transition = '';
    MSGS.forEach((m, i) => {
      timers.push(setTimeout(() => {
        msg.textContent = m;
        msg.style.animation = 'none'; void msg.offsetWidth; msg.style.animation = '';
        barra.style.width = `${Math.round(((i + 1) / MSGS.length) * 100)}%`;
      }, i * 2500));
    });
    timers.push(setTimeout(() => statusFinal(box), MSGS.length * 2500));
  }

  function montarVideo() {
    const box = $('[data-video-final]', quiz);
    const v = CFG.VIDEO_FINAL || {};
    box.classList.toggle('is-vertical', v.formato === '9:16');
    if (box.dataset.pronto === (v.id || 'vazio')) return;
    box.dataset.pronto = v.id || 'vazio';
    if (!v.id) {
      box.innerHTML = `<div class="video-ph"><img src="assets/img/logo-rcm-distribuidora.svg" alt="" width="110" height="47">
        <span class="play-btn"><svg aria-hidden="true"><use href="#i-play"/></svg></span><p>Vídeo de apresentação</p></div>`;
      return;
    }
    const botaoSom = '<button type="button" class="btn-som" data-som><svg class="ic" aria-hidden="true"><use href="#i-sound"/></svg>Ativar som</button>';
    if (v.tipo === 'mp4') {
      box.innerHTML = `<video src="${v.id}" autoplay muted playsinline controls></video>${botaoSom}`;
      $('[data-som]', box).addEventListener('click', (ev) => {
        const vid = $('video', box); vid.muted = false; vid.volume = 1; vid.play(); ev.currentTarget.remove();
      });
      return;
    }
    const src = v.tipo === 'vimeo'
      ? `https://player.vimeo.com/video/${encodeURIComponent(v.id)}?autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0`
      : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
    box.innerHTML = `<iframe src="${src}" title="Vídeo de apresentação da RCM" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>${botaoSom}`;
    $('[data-som]', box).addEventListener('click', (ev) => {
      const w = $('iframe', box).contentWindow;
      if (v.tipo === 'vimeo') {
        w.postMessage(JSON.stringify({ method: 'setMuted', value: false }), '*');
        w.postMessage(JSON.stringify({ method: 'setVolume', value: 1 }), '*');
      } else {
        w.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
        w.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
        w.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      }
      ev.currentTarget.remove();
    });
  }

  function mostrarFinal(animar) {
    mostrarPasso('final');
    if (animar) animarStatus(); else statusFinal($('[data-status]', quiz));
    montarVideo();
    const nome = st.contato.nome || '';
    const texto = `Olá! Sou ${nome}. Acabei de responder o diagnóstico no site da RCM e quero montar ${artigoTipo()}.`;
    const wa = $('[data-q-whats]', quiz);
    wa.href = `https://wa.me/${soDigitos(CFG.WHATSAPP)}?text=${encodeURIComponent(texto)}`;
    const depo = $('.final-depo [data-depoimentos]', quiz);
    if (depo && !depo.dataset.render) { depo.dataset.render = '1'; RCM.renderDepoimentos(depo); RCM.iniciarSlider(depo); }
  }
  $('[data-q-whats]', quiz).addEventListener('click', () => RCM.track('Contact', { content_name: 'WhatsApp tela final' }));

  $('[data-q-restart]', quiz).addEventListener('click', () => {
    timers.forEach(clearTimeout);
    const utmOrigem = st.origem;
    st = novoEstado();
    st.lead_id = uuid();
    st.origem = utmOrigem;
    st.aberto = true;
    txtDuvida.value = '';
    passoEl('contato').reset();
    salvar();
    mostrarPasso('contato');
  });

  /* ---------- Teclado e foco ---------- */
  quiz.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      if (!confirmEl.hidden) confirmEl.hidden = true; else pedirFechar();
      return;
    }
    if (ev.key === 'Tab') {
      const raiz = confirmEl.hidden ? quiz : confirmEl;
      const foc = $$('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])', raiz)
        .filter((el) => !el.disabled && el.offsetParent !== null && !el.closest('[hidden]') && !el.closest('.hp'));
      if (!foc.length) return;
      const prim = foc[0];
      const ult = foc[foc.length - 1];
      if (ev.shiftKey && document.activeElement === prim) { ev.preventDefault(); ult.focus(); }
      else if (!ev.shiftKey && document.activeElement === ult) { ev.preventDefault(); prim.focus(); }
      return;
    }
    const alvo = ev.target;
    if (/^[1-6]$/.test(ev.key) && !/INPUT|TEXTAREA/.test(alvo.tagName) && confirmEl.hidden) {
      const opts = $$('.q-opt', passoEl(st.passo));
      const b = opts[Number(ev.key) - 1];
      if (b) { ev.preventDefault(); b.click(); }
    }
    if (ev.key === 'Enter' && !/INPUT|TEXTAREA|BUTTON|A/.test(alvo.tagName) && confirmEl.hidden) {
      const sel = $('.q-opt.is-selected', passoEl(st.passo));
      if (sel && !sel.hasAttribute('data-outro')) { ev.preventDefault(); sel.click(); }
    }
  });

  /* ---------- Início ---------- */
  enviarFila(); // reenvia o que ficou pendente de outra visita
  if (st.aberto && st.lead_id) abrir({});
})();
