# Configuração: planilha de leads, Pixel e publicação

Este guia é para quem não programa. Siga na ordem. Leva uns 15 minutos.

---

## 1. Criar a planilha que recebe os leads

1. Abra o [Google Planilhas](https://sheets.google.com) com a conta Google da RCM.
2. Crie uma planilha em branco e dê um nome, por exemplo **Leads Site RCM**.
3. No menu, clique em **Extensões > Apps Script**. Vai abrir uma nova aba com um editor de código.
4. Apague tudo o que estiver escrito no editor.
5. Abra o arquivo `apps-script/Code.gs` deste projeto, copie **todo** o conteúdo e cole no editor.
6. (Opcional) Para receber um e-mail a cada lead novo, edite a linha do topo:
   ```js
   var EMAIL_AVISO = 'vendas@rcmequipamentos.com.br';
   ```
   E escolha quando avisar em `AVISO_QUANDO`: `'novo'` (assim que a pessoa deixa o contato), `'completo'` (quando termina o questionário) ou `'ambos'`.
7. Clique no ícone de disquete (**Salvar projeto**).

## 2. Autorizar e testar

1. No topo do editor, na lista de funções, escolha **configurarPlanilha** e clique em **Executar**.
2. O Google vai pedir autorização: clique em **Revisar permissões**, escolha sua conta, clique em **Avançado > Acessar (não seguro)** e depois em **Permitir**. Isso é normal para scripts próprios.
3. Volte para a planilha: deve aparecer a aba **Leads** com o cabeçalho azul.
4. No editor, escolha a função **testeManual** e clique em **Executar**. Na aba Leads deve aparecer **uma única linha** de teste, com Status "em andamento", Parou na etapa "P3 Investimento" e Temperatura "🔥 Quente". Isso prova que a mesma linha é atualizada sem duplicar. Pode apagar essa linha depois.

## 3. Publicar como App da Web

1. No editor do Apps Script, clique em **Implantar > Nova implantação**.
2. Clique na engrenagem ao lado de "Selecione o tipo" e escolha **App da Web**.
3. Preencha:
   - **Descrição:** Funil RCM
   - **Executar como:** **Eu** (seu e-mail)
   - **Quem pode acessar:** **Qualquer pessoa**
4. Clique em **Implantar** e copie a **URL do app da Web** (termina em `/exec`).

## 4. Ligar o site na planilha

1. Abra `assets/js/config.js`.
2. Cole a URL entre as aspas:
   ```js
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   ```
3. Salve e publique o site de novo (seção 7).

Enquanto `APPS_SCRIPT_URL` estiver vazio, o site funciona em **modo teste**: o questionário roda normalmente e os dados aparecem só no console do navegador (F12 > Console).

## 5. Testar o funil de verdade

1. Abra o site, clique em **Quero montar minha loja**, preencha nome e WhatsApp e responda 2 perguntas.
2. Feche a aba do navegador.
3. Na planilha deve aparecer a linha com Status **em andamento** e Parou na etapa **P2 Prazo**.
4. Abra o site de novo no mesmo navegador e clique no botão: o questionário continua de onde parou. Termine.
5. A **mesma linha** deve ficar com Status **completo** e Parou na etapa **P5 Dúvida**. Nenhuma linha nova.

Dica: para simular outra pessoa no mesmo navegador, use uma janela anônima, ou toque em "Enviar respostas de outra pessoa" no fim do questionário.

## 6. Quando mudar o código do Apps Script

Se você alterar o `Code.gs` (por exemplo, para colocar o e-mail de aviso), é preciso reimplantar **mantendo a mesma URL**:

1. **Implantar > Gerenciar implantações**.
2. Clique no lápis (**Editar**) da implantação existente.
3. Em **Versão**, escolha **Nova versão** e clique em **Implantar**.

A URL continua a mesma, então não precisa mexer no `config.js`. Atenção: "Nova implantação" cria uma URL diferente; use "Gerenciar implantações".

## 7. Publicar o site no GitHub Pages

1. Crie um repositório no GitHub (pode ser público) e envie os arquivos deste projeto (`git push`).
2. No repositório: **Settings > Pages > Build and deployment > Source: Deploy from a branch**, branch **main**, pasta **/ (root)**. Salve.
3. Em 1 ou 2 minutos o site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
4. Domínio próprio (opcional): em **Settings > Pages > Custom domain**, informe o domínio e crie no seu provedor de DNS um registro CNAME apontando para `SEU-USUARIO.github.io`.

## 8. Meta Pixel e Utmify

- **Pixel:** em `assets/js/config.js`, preencha `META_PIXEL_ID: '123456789012345'`. O site dispara:
  - `PageView` ao abrir a página
  - `Lead` quando a pessoa envia o contato (1ª etapa)
  - `QuizEtapa` (evento personalizado) a cada etapa, com o número e o nome da etapa
  - `CompleteRegistration` ao terminar o questionário
  - `Contact` ao tocar no botão de WhatsApp da tela final
- **Utmify:** com `UTMIFY_SCRIPT: true` o script de UTMs da Utmify é carregado automaticamente. Se a Utmify te passar um script diferente, cole no `index.html` no local marcado com o comentário **UTMIFY** e mude `UTMIFY_SCRIPT` para `false`.
- As UTMs e o `fbclid` da URL do anúncio vão para a planilha em todas as etapas.

## 9. Vídeos

- **Vídeo da tela final:** em `config.js`, `VIDEO_FINAL: { tipo: 'youtube', id: 'ID_DO_VIDEO', formato: '16:9' }`. O ID é o trecho depois de `watch?v=` (ou depois de `/shorts/`). Para vídeo vertical, use `formato: '9:16'`.
- **Depoimentos:** preencha os 6 itens de `DEPOIMENTOS` com nome, cidade, tipo de loja e o ID do YouTube (Shorts funcionam). Para vídeo próprio, coloque o arquivo em `assets/video/`, use `tipo: 'mp4'` e `id: 'assets/video/nome-do-arquivo.mp4'`. Itens com `id` vazio aparecem como "Depoimento em breve".

## Colunas da planilha

`Data entrada | Última atualização | Status | Parou na etapa | Temperatura | Nome | WhatsApp | Link WhatsApp | E-mail | Tipo de loja | Prazo | Investimento em equipamentos | Perfil | Principal dúvida | UTM Source | UTM Medium | UTM Campaign | UTM Content | UTM Term | fbclid | Dispositivo | Lead ID | URL de entrada | Origem do clique`

- **Status:** `iniciou` (só deixou o contato), `em andamento`, `completo`.
- **Parou na etapa:** última etapa respondida. Use para ligar para quem abandonou.
- **Temperatura:** 🔥 Quente (prazo imediato ou 3 meses e investimento a partir de R$ 75 mil), 🟡 Morno (prazo até 6 meses nos demais casos), 🔵 Frio/Futuro (1 ano ou mais). Vazio enquanto o prazo não foi respondido.
- **Principal dúvida:** se a pessoa começou a escrever e saiu sem enviar, o texto aparece com a marcação "[rascunho, não enviado]".
- **Origem do clique:** qual botão abriu o questionário (hero, card do tipo de loja, barra fixa etc.).
