/* =========================================================
   RCM Distribuidora | Funil "Monte sua Loja Completa"
   TODAS as configurações editáveis do site ficam aqui.
   Depois de editar, salve e publique de novo (git push).
   ========================================================= */
const CONFIG = {
  // URL do App da Web do Google Apps Script (veja SETUP.md).
  // Vazio = modo teste: o quiz funciona e os dados aparecem só no console do navegador.
  APPS_SCRIPT_URL: '',

  // Número do WhatsApp do botão da tela final (só dígitos: 55 + DDD + número).
  // Padrão: WhatsApp da RCM Distribuidora que está no catálogo, (62) 99607-8204.
  WHATSAPP: '5562996078204',

  // ID do Meta Pixel (só números). Vazio = pixel desligado.
  META_PIXEL_ID: '',

  // true = carrega o script de UTMs da Utmify (cdn.utmify.com.br). false = não carrega.
  UTMIFY_SCRIPT: true,

  // true = e-mail obrigatório no primeiro passo do quiz. false = opcional (menos abandono).
  EMAIL_OBRIGATORIO: false,

  // Vídeo da tela final (mini apresentação).
  // tipo: 'youtube' | 'vimeo' | 'mp4'
  // id: ID do vídeo no YouTube/Vimeo, ou caminho/URL do arquivo .mp4
  // formato: '16:9' (horizontal) ou '9:16' (vertical)
  VIDEO_FINAL: { tipo: 'youtube', id: '', formato: '16:9' },

  // Depoimentos em vídeo (carrossel). Deixe o id vazio para mostrar "Depoimento em breve".
  // tipo: 'youtube' (Shorts ou vídeo normal, use só o ID) | 'mp4' (caminho ou URL) | 'embed' (URL completa de embed)
  // capa: imagem de capa (opcional). Para YouTube, se vazio, usa a capa do próprio YouTube.
  DEPOIMENTOS: [
    { nome: '', cidade: '', loja: '', tipo: 'youtube', id: '', capa: '' },
    { nome: '', cidade: '', loja: '', tipo: 'youtube', id: '', capa: '' },
    { nome: '', cidade: '', loja: '', tipo: 'youtube', id: '', capa: '' },
    { nome: '', cidade: '', loja: '', tipo: 'youtube', id: '', capa: '' },
    { nome: '', cidade: '', loja: '', tipo: 'youtube', id: '', capa: '' },
    { nome: '', cidade: '', loja: '', tipo: 'youtube', id: '', capa: '' },
  ],
};
