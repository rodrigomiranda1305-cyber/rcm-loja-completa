/* =========================================================
   RCM | Versão B: página do quiz (index.html)
   Abertura > contato > 5 perguntas > projeto.html
   Envia o estado completo para a planilha a cada etapa concluída.
   ========================================================= */
(function () {
  'use strict';

  const RCM = window.RCM;
  const CFG = RCM.CFG;
  const ls = RCM.ls;
  const LS_ESTADO = 'rcm_quiz_b';
  const LS_PROJETO = 'rcm_projeto';

  const PASSOS = ['contato', 'tipo', 'prazo', 'investimento', 'perfil', 'duvida'];
  const NOME_ETAPA = {
    contato: 'Contato', tipo: 'P1 Tipo de loja', prazo: 'P2 Prazo',
    investimento: 'P3 Investimento', perfil: 'P4 Perfil', duvida: 'P5 Dúvida',
  };
  const TOTAL = PASSOS.length;
  const DDDS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99];

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const intro = $('[data-intro]');
  const card = $('[data-card]');
  if (!intro || !card) return;
  const passoEl = (nome) => $(`[data-step="${nome}"]`, card);
  const barraEl = $('[data-bar]', card);
  const etapaEl = $('[data-etapa]', card);
  const pe = $('[data-foot]', card);
  const txtDuvida = $('#q-duvida', card);

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
      lead_id: '', passo: 'contato', concluido: false, contatoEnviado: false, bot: false,
      maxFeito: -1, ultimoEnvio: '',
      contato: { nome: '', whatsapp: '', email: '' },
      r: { tipo: '', tipo_cod: '', tipo_outro: '', prazo: '', prazo_cod: '', investimento: '', investimento_cod: '', perfil: '', perfil_cod: '', duvida: '' },
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
  const ehDesktop = () => window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  const tipoTexto = () => (st.r.tipo === 'Outro' && st.r.tipo_outro ? `Outro: ${st.r.tipo_outro}` : st.r.tipo);
  const respondidas = () => ['tipo', 'prazo', 'investimento', 'perfil'].filter((k) => st.r[k]).length + (st.concluido ? 1 : 0);

  /* ---------- Envio para a planilha ---------- */
  function montarDados() {
    let duvida = st.r.duvida;
    if (!st.concluido && !duvida && txtDuvida.value.trim()) duvida = `[rascunho, não enviado] ${txtDuvida.value.trim()}`;
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
      origem: 'pagina-quiz',
      dispositivo: RCM.dispositivo(),
      versao: CFG.VERSAO_FUNIL || 'B',
      site: '',
    };
  }

  function enviar() {
    if (st.bot || !st.contatoEnviado) return;
    const corpo = JSON.stringify(montarDados());
    st.ultimoEnvio = corpo;
    salvar();
    RCM.enviar(corpo, st.lead_id);
  }

  function enviarAoSair() {
    if (st.bot || !st.contatoEnviado) return;
    const corpo = JSON.stringify(montarDados());
    if (corpo === st.ultimoEnvio) { RCM.enviarBeacon('', st.lead_id); return; } // só o que estiver pendente
    if (RCM.enviarBeacon(corpo, st.lead_id)) { st.ultimoEnvio = corpo; salvar(); }
  }
  window.addEventListener('pagehide', enviarAoSair);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') enviarAoSair(); });

  function concluirPasso(nome) {
    const idx = PASSOS.indexOf(nome);
    if (idx > st.maxFeito) st.maxFeito = idx;
    salvar();
    enviar();
    RCM.track('QuizEtapa', { etapa: idx + 1, nome_etapa: NOME_ETAPA[nome] });
  }

  /* ---------- Navegação ---------- */
  let empilhados = 0; // passos colocados no histórico do navegador nesta visita

  function mostrarIntro() {
    card.hidden = true;
    intro.hidden = false;
    $('[data-cta-inicio]', intro).hidden = st.concluido;
    $('[data-feito]', intro).hidden = !st.concluido;
  }

  function mostrarPasso(nome, opts) {
    opts = opts || {};
    st.passo = nome;
    salvar();
    intro.hidden = true;
    card.hidden = false;
    $$('.q-step', card).forEach((el) => { el.hidden = el.dataset.step !== nome; });
    const el = passoEl(nome);
    el.classList.toggle('is-back', !!opts.voltando);
    el.style.animation = 'none';
    void el.offsetWidth; // reinicia a animação de entrada
    el.style.animation = '';

    const idx = PASSOS.indexOf(nome);
    etapaEl.textContent = `Etapa ${idx + 1} de ${TOTAL}`;
    barraEl.style.width = `${Math.round(((idx + 1) / TOTAL) * 100)}%`;
    pe.classList.toggle('is-hidden', nome === 'contato');
    preencherPasso(nome);

    if (opts.historico === 'push') { history.pushState({ rcmPasso: nome }, ''); empilhados += 1; }
    else if (opts.historico === 'replace') history.replaceState({ rcmPasso: nome }, '');

    window.scrollTo(0, 0);
    // no desktop o cursor já vai para o nome; no celular foca o título para não abrir o teclado sozinho
    if (nome === 'contato' && ehDesktop()) setTimeout(() => $('#q-nome', card).focus(), 300);
    else { const t = $('.q-title', el); if (t) t.focus({ preventScroll: true }); }
  }

  function preencherPasso(nome) {
    const el = passoEl(nome);
    if (nome === 'contato') {
      $('#q-nome', card).value = st.contato.nome;
      $('#q-whats', card).value = mascaraFone(st.contato.whatsapp);
      $('#q-email', card).value = st.contato.email;
    }
    if (['tipo', 'prazo', 'investimento', 'perfil'].includes(nome)) {
      $$('.q-opt', el).forEach((b) => b.classList.toggle('is-selected', b.dataset.value === st.r[nome]));
      if (nome === 'tipo') {
        $('[data-outro-box]', el).hidden = st.r.tipo !== 'Outro';
        $('#q-outro', card).value = st.r.tipo_outro;
      }
    }
    if (nome === 'duvida') {
      if (st.r.duvida && !txtDuvida.value) txtDuvida.value = st.r.duvida;
      sincronizarChips();
    }
  }

  const proximoDe = (nome) => PASSOS[PASSOS.indexOf(nome) + 1];
  const anteriorDe = (nome) => PASSOS[PASSOS.indexOf(nome) - 1] || null;
  const avancar = (nome) => mostrarPasso(proximoDe(nome), { historico: 'push' });

  window.addEventListener('popstate', (ev) => {
    empilhados = Math.max(0, empilhados - 1);
    const alvo = ev.state && ev.state.rcmPasso;
    if (alvo && PASSOS.includes(alvo) && !st.concluido) mostrarPasso(alvo, { voltando: true });
    else mostrarIntro();
  });

  $('[data-back]', card).addEventListener('click', () => {
    const ant = anteriorDe(st.passo);
    if (!ant) return;
    if (empilhados > 0) history.back();
    else mostrarPasso(ant, { voltando: true, historico: 'replace' });
  });

  /* ---------- Abertura ---------- */
  $('[data-comecar]', intro).addEventListener('click', () => {
    if (!st.lead_id) st.lead_id = uuid();
    salvar();
    RCM.track('QuizInicio');
    mostrarPasso(st.contatoEnviado ? st.passo : 'contato', { historico: 'push' });
  });
  $('[data-recomecar]', intro).addEventListener('click', () => {
    st = novoEstado();
    st.lead_id = uuid();
    txtDuvida.value = '';
    passoEl('contato').reset();
    salvar();
    RCM.track('QuizInicio');
    mostrarPasso('contato', { historico: 'push' });
  });

  /* ---------- Etapa: contato ---------- */
  const fNome = $('#q-nome', card);
  const fWhats = $('#q-whats', card);
  const fEmail = $('#q-email', card);
  if (CFG.EMAIL_OBRIGATORIO) {
    $('[data-email-opt]', card).hidden = true;
    fEmail.required = true;
  }
  fWhats.addEventListener('input', () => { fWhats.value = mascaraFone(fWhats.value); erro('whatsapp', ''); });
  fNome.addEventListener('input', () => erro('nome', ''));
  fEmail.addEventListener('input', () => erro('email', ''));

  function erro(campo, msg) {
    const p = $(`[data-err="${campo}"]`, card);
    if (p) p.textContent = msg;
    const input = { nome: fNome, whatsapp: fWhats, email: fEmail, outro: $('#q-outro', card), duvida: txtDuvida }[campo];
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
    if (!ok) { const inv = $('.is-invalid', card); if (inv) inv.focus(); return; }

    if ($('#q-site', card).value) st.bot = true; // honeypot preenchido: segue sem gravar

    const primeiraVez = !st.contatoEnviado;
    if (!st.lead_id) st.lead_id = uuid();
    st.contato = { nome, whatsapp: soDigitos(whats), email };
    st.contatoEnviado = true;
    concluirPasso('contato');
    if (primeiraVez && !st.bot) RCM.track('Lead', { content_name: 'Monte sua Loja Completa' }, { eventID: st.lead_id });
    avancar('contato');
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
          $('[data-outro-box]', el).hidden = false;
          setTimeout(() => $('#q-outro', card).focus(), 60);
          return;
        }
        if (nome === 'tipo') { $('[data-outro-box]', el).hidden = true; st.r.tipo_outro = ''; }
        st.r[nome] = btn.dataset.value;
        if (btn.dataset.cod) st.r[`${nome}_cod`] = btn.dataset.cod;
        avancando = true;
        setTimeout(() => {
          avancando = false;
          concluirPasso(nome);
          avancar(nome);
        }, 300);
      });
    });
  });

  function confirmarOutro() {
    const v = $('#q-outro', card).value.trim();
    if (v.length < 2) { erro('outro', 'Conte em poucas palavras qual tipo de loja.'); $('#q-outro', card).focus(); return; }
    erro('outro', '');
    st.r.tipo = 'Outro';
    st.r.tipo_cod = 'outro';
    st.r.tipo_outro = v.slice(0, 120);
    concluirPasso('tipo');
    avancar('tipo');
  }
  $('[data-outro-ok]', card).addEventListener('click', confirmarOutro);
  $('#q-outro', card).addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); confirmarOutro(); } });

  /* ---------- P5: dúvida ---------- */
  const chips = $$('.chip', card);
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

    const nome = primeiroNome(st.contato.nome);
    ls.set(LS_PROJETO, {
      nome, lead_id: st.lead_id, tipo_cod: st.r.tipo_cod, tipo_outro: st.r.tipo_outro,
      perfil_cod: st.r.perfil_cod, prazo_cod: st.r.prazo_cod, investimento_cod: st.r.investimento_cod,
      animar: true, quando: Date.now(),
    });
    if (!st.bot) RCM.track('CompleteRegistration', { content_name: 'Monte sua Loja Completa', status: 'completo' }, { eventID: `${st.lead_id}-c` });

    const btn = $('button[type="submit"]', passoEl('duvida'));
    btn.classList.add('is-loading');
    btn.innerHTML = '<span class="btn-spin" aria-hidden="true"></span>Enviando...';
    const url = `projeto.html?n=${encodeURIComponent(nome)}&loja=${encodeURIComponent(st.r.tipo_cod)}&perfil=${encodeURIComponent(st.r.perfil_cod)}`;
    // pequena pausa para o Pixel e o envio saírem antes de trocar de página
    setTimeout(() => location.assign(url), 650);
  });

  /* ---------- Teclado (desktop): números 1 a 6 escolhem, Enter confirma ---------- */
  document.addEventListener('keydown', (ev) => {
    if (card.hidden || /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
    if (/^[1-6]$/.test(ev.key)) {
      const b = $$('.q-opt', passoEl(st.passo))[Number(ev.key) - 1];
      if (b) { ev.preventDefault(); b.click(); }
    }
    if (ev.key === 'Enter' && !/BUTTON|A/.test(ev.target.tagName)) {
      const sel = $('.q-opt.is-selected', passoEl(st.passo));
      if (sel && !sel.hasAttribute('data-outro')) { ev.preventDefault(); sel.click(); }
    }
  });

  /* ---------- Início ---------- */
  if (st.contatoEnviado && !st.concluido && PASSOS.includes(st.passo)) {
    mostrarPasso(st.passo, { historico: 'replace' }); // continua de onde parou
  } else {
    history.replaceState({ rcmPasso: 'intro' }, '');
    mostrarIntro();
  }
})();
