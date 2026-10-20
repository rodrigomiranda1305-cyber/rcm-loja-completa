/**
 * RCM Distribuidora | Funil "Monte sua Loja Completa"
 * Recebe os dados do quiz e grava na aba "Leads".
 * Cada lead é UMA linha, identificada pelo Lead ID, que vai sendo completada a cada etapa.
 * Passo a passo de instalação: veja SETUP.md
 */

// ===================== CONFIGURAÇÕES =====================
// E-mail(s) que recebem aviso de lead. Vazio = sem aviso. Vários: 'a@x.com,b@y.com'
var EMAIL_AVISO = '';
// Quando avisar: 'novo' (assim que a pessoa deixa o contato), 'completo' (quando termina o quiz) ou 'ambos'
var AVISO_QUANDO = 'novo';
var NOME_ABA = 'Leads';
// =========================================================

var COLUNAS = [
  'Data entrada', 'Última atualização', 'Status', 'Parou na etapa', 'Temperatura',
  'Nome', 'WhatsApp', 'Link WhatsApp', 'E-mail', 'Tipo de loja', 'Prazo',
  'Investimento em equipamentos', 'Perfil', 'Principal dúvida',
  'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term', 'fbclid',
  'Dispositivo', 'Lead ID', 'URL de entrada', 'Origem do clique'
];
// campo do JSON enviado pelo site -> coluna
var CAMPOS = {
  nome: 'Nome', whatsapp: 'WhatsApp', email: 'E-mail', tipo: 'Tipo de loja', prazo: 'Prazo',
  investimento: 'Investimento em equipamentos', perfil: 'Perfil', duvida: 'Principal dúvida',
  utm_source: 'UTM Source', utm_medium: 'UTM Medium', utm_campaign: 'UTM Campaign',
  utm_content: 'UTM Content', utm_term: 'UTM Term', fbclid: 'fbclid',
  dispositivo: 'Dispositivo', url_entrada: 'URL de entrada', origem: 'Origem do clique'
};
var STATUS_ORDEM = ['iniciou', 'em andamento', 'completo'];
var ETAPAS = ['Contato', 'P1 Tipo de loja', 'P2 Prazo', 'P3 Investimento', 'P4 Perfil', 'P5 Dúvida'];

function col(nome) { return COLUNAS.indexOf(nome) + 1; }

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return resposta({ ok: true, msg: 'Planilha de leads RCM ativa.' });
}

function doPost(e) {
  var dados;
  try {
    dados = JSON.parse(e.postData.contents);
  } catch (err) {
    return resposta({ ok: false, erro: 'json invalido' });
  }
  if (dados.site) return resposta({ ok: true }); // honeypot: robô, ignora
  if (!dados.lead_id || !/^[\w-]{8,64}$/.test(dados.lead_id)) return resposta({ ok: false, erro: 'lead_id invalido' });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return resposta({ ok: false, erro: 'ocupado' });
  }
  try {
    var r = gravarLead(dados);
    return resposta({ ok: true, novo: r.novo });
  } catch (err) {
    console.error(err);
    return resposta({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function gravarLead(dados) {
  var aba = obterAba();
  var agora = new Date();
  var ultima = aba.getLastRow();
  var linha = 0;
  if (ultima > 1) {
    var achado = aba.getRange(2, col('Lead ID'), ultima - 1, 1)
      .createTextFinder(dados.lead_id).matchEntireCell(true).findNext();
    if (achado) linha = achado.getRow();
  }
  var novo = !linha;
  var valores = novo ? COLUNAS.map(function () { return ''; })
    : aba.getRange(linha, 1, 1, COLUNAS.length).getValues()[0];
  var statusAntes = novo ? '' : valores[col('Status') - 1];

  // só sobrescreve com valores preenchidos (envios fora de ordem não apagam nada)
  Object.keys(CAMPOS).forEach(function (campo) {
    var v = dados[campo];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      valores[col(CAMPOS[campo]) - 1] = limpar(v);
    }
  });

  // status e etapa nunca regridem
  var stAtual = STATUS_ORDEM.indexOf(String(valores[col('Status') - 1]));
  var stNovo = STATUS_ORDEM.indexOf(String(dados.status || ''));
  if (stNovo > stAtual) valores[col('Status') - 1] = STATUS_ORDEM[stNovo];
  var etAtual = ETAPAS.indexOf(String(valores[col('Parou na etapa') - 1]));
  var etNova = ETAPAS.indexOf(String(dados.etapa_atual || ''));
  if (etNova > etAtual) valores[col('Parou na etapa') - 1] = ETAPAS[etNova];

  valores[col('Temperatura') - 1] = temperatura(valores[col('Prazo') - 1], valores[col('Investimento em equipamentos') - 1], dados);
  if (novo) valores[col('Data entrada') - 1] = agora;
  valores[col('Última atualização') - 1] = agora;
  valores[col('Lead ID') - 1] = dados.lead_id;

  var digitos = String(valores[col('WhatsApp') - 1]).replace(/\D/g, '');
  var link = digitos.length >= 10 ? 'https://wa.me/55' + digitos : '';
  valores[col('Link WhatsApp') - 1] = link;

  if (novo) linha = Math.max(aba.getLastRow(), 1) + 1;
  aba.getRange(linha, 1, 1, COLUNAS.length).setValues([valores]);
  if (link) {
    aba.getRange(linha, col('Link WhatsApp')).setRichTextValue(
      SpreadsheetApp.newRichTextValue().setText('Abrir conversa').setLinkUrl(link).build());
  }

  var statusDepois = valores[col('Status') - 1];
  if (EMAIL_AVISO) {
    var avisarNovo = novo && (AVISO_QUANDO === 'novo' || AVISO_QUANDO === 'ambos');
    var avisarCompleto = statusDepois === 'completo' && statusAntes !== 'completo' &&
      (AVISO_QUANDO === 'completo' || AVISO_QUANDO === 'ambos');
    if (avisarNovo || avisarCompleto) avisar(valores, avisarCompleto ? 'completou o quiz' : 'novo lead');
  }
  return { novo: novo };
}

/** Temperatura do lead, para priorizar o atendimento. */
function temperatura(prazo, investimento, dados) {
  var p = dados.prazo_cod || codPrazo(prazo);
  var i = dados.investimento_cod || codInvestimento(investimento);
  if (!p) return '';
  if (p === '12m') return '🔵 Frio/Futuro';
  if ((p === 'imediato' || p === '3m') && ['75a100', '100a150', '150mais'].indexOf(i) > -1) return '🔥 Quente';
  return '🟡 Morno';
}
function codPrazo(t) {
  t = String(t || '').toLowerCase();
  if (!t) return '';
  if (t.indexOf('mais rápido') > -1) return 'imediato';
  if (t.indexOf('3 meses') > -1) return '3m';
  if (t.indexOf('6 meses') > -1) return '6m';
  if (t.indexOf('1 ano') > -1) return '12m';
  return '';
}
function codInvestimento(t) {
  t = String(t || '').toLowerCase();
  if (!t) return '';
  if (t.indexOf('até r$ 50') > -1) return 'ate50';
  if (t.indexOf('de r$ 50') > -1) return '50a75';
  if (t.indexOf('de r$ 75') > -1) return '75a100';
  if (t.indexOf('de r$ 100') > -1) return '100a150';
  if (t.indexOf('acima') > -1) return '150mais';
  if (t.indexOf('não sei') > -1) return 'naosei';
  return '';
}

/** Evita que um texto digitado vire fórmula na planilha. */
function limpar(v) {
  var s = String(v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function avisar(valores, motivo) {
  try {
    var v = function (nome) { return valores[col(nome) - 1] || '-'; };
    var linhas = ['Nome', 'WhatsApp', 'E-mail', 'Tipo de loja', 'Prazo', 'Investimento em equipamentos', 'Perfil', 'Principal dúvida', 'Temperatura', 'Parou na etapa', 'UTM Campaign']
      .map(function (n) { return '<tr><td style="padding:4px 12px 4px 0;color:#555">' + n + '</td><td style="padding:4px 0"><b>' + String(v(n)).replace(/</g, '&lt;') + '</b></td></tr>'; })
      .join('');
    var link = v('Link WhatsApp');
    MailApp.sendEmail({
      to: EMAIL_AVISO,
      subject: 'RCM | ' + motivo + ': ' + v('Nome') + ' (' + v('Tipo de loja') + ')',
      htmlBody: '<h2 style="font-family:Arial">Lead do site: ' + motivo + '</h2><table style="font-family:Arial;font-size:14px">' + linhas + '</table>' +
        (link !== '-' ? '<p><a href="' + link + '" style="font-family:Arial">Abrir conversa no WhatsApp</a></p>' : '')
    });
  } catch (err) {
    console.error('Falha ao enviar e-mail de aviso: ' + err);
  }
}

/** Cria a aba e o cabeçalho, se ainda não existirem. */
function obterAba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(NOME_ABA);
  if (!aba) aba = ss.insertSheet(NOME_ABA);
  if (aba.getRange(1, 1).getValue() !== COLUNAS[0]) formatarAba(aba);
  return aba;
}

function formatarAba(aba) {
  aba.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS])
    .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#161F5B')
    .setVerticalAlignment('middle').setWrap(true);
  aba.setRowHeight(1, 42);
  aba.setFrozenRows(1);
  aba.setFrozenColumns(0);
  var larguras = { 'Data entrada': 140, 'Última atualização': 140, 'Status': 110, 'Parou na etapa': 130, 'Temperatura': 120,
    'Nome': 170, 'WhatsApp': 130, 'Link WhatsApp': 120, 'E-mail': 190, 'Tipo de loja': 150, 'Prazo': 220,
    'Investimento em equipamentos': 190, 'Perfil': 260, 'Principal dúvida': 340, 'Lead ID': 260, 'URL de entrada': 260 };
  Object.keys(larguras).forEach(function (n) { aba.setColumnWidth(col(n), larguras[n]); });
  aba.getRange('A:B').setNumberFormat('dd/MM/yyyy HH:mm');
  aba.getRange(2, col('WhatsApp'), aba.getMaxRows() - 1, 1).setNumberFormat('@');
  aba.getRange(2, col('Principal dúvida'), aba.getMaxRows() - 1, 1).setWrap(true);

  var rStatus = aba.getRange(2, col('Status'), aba.getMaxRows() - 1, 1);
  var rTemp = aba.getRange(2, col('Temperatura'), aba.getMaxRows() - 1, 1);
  var regra = SpreadsheetApp.newConditionalFormatRule;
  aba.setConditionalFormatRules([
    regra().whenTextEqualTo('completo').setBackground('#D7F2DF').setFontColor('#145C2E').setRanges([rStatus]).build(),
    regra().whenTextEqualTo('em andamento').setBackground('#FFF2C6').setFontColor('#6B4E00').setRanges([rStatus]).build(),
    regra().whenTextEqualTo('iniciou').setBackground('#FDE2D0').setFontColor('#8A3A06').setRanges([rStatus]).build(),
    regra().whenTextContains('Quente').setBackground('#FAD2D2').setFontColor('#8E1010').setRanges([rTemp]).build(),
    regra().whenTextContains('Morno').setBackground('#FFF2C6').setFontColor('#6B4E00').setRanges([rTemp]).build(),
    regra().whenTextContains('Frio').setBackground('#D8E5FF').setFontColor('#17306E').setRanges([rTemp]).build()
  ]);
}

/** Rode esta função uma vez pelo editor para criar a aba e autorizar o script. */
function configurarPlanilha() {
  obterAba();
}

/** Teste pelo editor: simula um lead completo e depois atualiza a mesma linha. */
function testeManual() {
  var id = 'teste-' + new Date().getTime();
  doPost({ postData: { contents: JSON.stringify({ lead_id: id, status: 'iniciou', etapa_atual: 'Contato', nome: 'Teste RCM', whatsapp: '(62) 99999-9999', dispositivo: 'desktop' }) } });
  doPost({ postData: { contents: JSON.stringify({ lead_id: id, status: 'em andamento', etapa_atual: 'P3 Investimento', tipo: 'Centro automotivo', prazo: 'Nos próximos 3 meses', prazo_cod: '3m', investimento: 'De R$ 100 mil a R$ 150 mil', investimento_cod: '100a150' }) } });
  Logger.log('Confira a aba Leads: deve haver UMA linha com Lead ID ' + id + ' e Temperatura Quente.');
}
