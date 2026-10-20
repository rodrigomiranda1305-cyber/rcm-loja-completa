/* =========================================================
   RCM | Versão B: código comum às páginas index.html (quiz) e projeto.html
   Pixel, Utmify, UTMs e envio para a planilha (com fila offline).
   ========================================================= */
(function () {
  'use strict';

  // CONFIG vem de config.js (const global, não fica em window)
  const CFG = typeof CONFIG !== 'undefined' ? CONFIG : {};
  const LS_FILA = 'rcm_fila_b';

  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* idem */ } },
  };

  /* ---------- Parâmetros de personalização (projeto.html?n=&loja=&perfil=) ---------- */
  // O primeiro nome sai da barra de endereço antes do Pixel ler a URL: a Meta não aceita dado pessoal na URL.
  const q = new URLSearchParams(location.search);
  const paramsUrl = { n: (q.get('n') || '').slice(0, 40), loja: q.get('loja') || '', perfil: q.get('perfil') || '' };
  if (q.has('n')) {
    q.delete('n');
    const resto = q.toString();
    history.replaceState(history.state, '', location.pathname + (resto ? `?${resto}` : '') + location.hash);
  }

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
    const p = Object.assign({ versao: CFG.VERSAO_FUNIL || 'B' }, params || {});
    if (window.fbq) window.fbq(custom ? 'trackCustom' : 'track', evento, p, opcoes || {});
    if (!CFG.META_PIXEL_ID) console.info('[RCM pixel desligado]', evento, p);
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
    const salvo = ls.get('rcm_utms') || {};
    const novos = {};
    CHAVES_UTM.forEach((k) => { if (q.get(k)) novos[k] = q.get(k).slice(0, 300); });
    let dados = salvo;
    if (Object.keys(novos).length) dados = Object.assign({}, novos, { url_entrada: location.href.slice(0, 500) });
    if (!dados.url_entrada) dados.url_entrada = location.href.slice(0, 500);
    ls.set('rcm_utms', dados);
    return dados;
  })();

  /* ---------- Envio para a planilha ---------- */
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
      }).catch(() => { /* fica na fila para a próxima tentativa */ });
    });
  }

  // Cada envio leva o estado completo do lead; na fila fica só o mais recente de cada lead.
  function enviar(corpo, leadId) {
    if (!CFG.APPS_SCRIPT_URL) {
      console.info('[RCM modo teste] APPS_SCRIPT_URL vazio. Dados que seriam enviados:', JSON.parse(corpo));
      return;
    }
    const fila = lerFila();
    fila[leadId] = corpo;
    gravarFila(fila);
    enviarFila();
  }

  // Pessoa saindo da página: sendBeacon sobrevive ao fechamento da aba
  function enviarBeacon(corpo, leadId) {
    if (!CFG.APPS_SCRIPT_URL) return false;
    const fila = lerFila();
    if (corpo) fila[leadId] = corpo;
    let ok = true;
    Object.keys(fila).forEach((id) => {
      const blob = new Blob([fila[id]], { type: 'text/plain;charset=utf-8' });
      if (!(navigator.sendBeacon && navigator.sendBeacon(CFG.APPS_SCRIPT_URL, blob))) ok = false;
    });
    gravarFila(ok ? {} : fila);
    return ok;
  }

  enviarFila(); // reenvia o que ficou pendente de outra visita
  window.addEventListener('online', enviarFila);

  const dispositivo = () => (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 'mobile' : 'desktop');

  window.RCM = { CFG, ls, track, utms, paramsUrl, enviar, enviarFila, enviarBeacon, dispositivo };
})();
