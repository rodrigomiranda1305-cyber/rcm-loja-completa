# Configuração: planilha de leads, Pixel e publicação

Este guia é para quem não programa. Siga na ordem. Leva uns 15 minutos.

O projeto tem duas versões do funil (A e B) que gravam na mesma planilha. Veja o [VERSOES.md](VERSOES.md).

> **Já tinha implantado o Apps Script antes da versão B?** O `Code.gs` mudou: ganhou a coluna **Versão do funil** e a nova regra de **Temperatura**. Cole o código novo e reimplante **mantendo a mesma URL**, como explicado na seção 6. A coluna nova é criada sozinha no fim da planilha no próximo lead, sem mexer nos dados que já estão lá.

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
4. No editor, escolha a função **testeManual** e clique em **Executar**. Na aba Leads deve aparecer **uma única linha** de teste, com Status "em andamento", Parou na etapa "P3 Investimento", Versão do funil "B" e Temperatura "🔥 Quente". Isso prova que a mesma linha é atualizada sem duplicar. Pode apagar essa linha depois.

## 3. Publicar como App da Web

1. No editor do Apps Script, clique em **Implantar > Nova implantação**.
2. Clique na engrenagem ao lado de "Selecione o tipo" e escolha **App da Web**.
3. Preencha:
   - **Descrição:** Funil RCM
   - **Executar como:** **Eu** (seu e-mail)
   - **Quem pode acessar:** **Qualquer pessoa**
4. Clique em **Implantar** e copie a **URL do app da Web** (termina em `/exec`).

## 4. Ligar o site na planilha (nas duas versões)

Cole a mesma URL nos **dois** arquivos de configuração:

- `assets/js/config.js` (versão B, na raiz)
- `versao-a/assets/js/config.js` (versão A)

```js
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
```

Salve e publique o site de novo (seção 7). Não altere a linha `VERSAO_FUNIL`: é ela que grava A ou B na planilha.

Enquanto `APPS_SCRIPT_URL` estiver vazio, o site funciona em **modo teste**: o questionário roda normalmente e os dados aparecem só no console do navegador (F12 > Console).

## 5. Testar o funil de verdade

**Versão B (raiz):**

1. Abra o site, toque em **Começar agora**, preencha nome e WhatsApp e responda até a P2 (prazo).
2. Feche a aba do navegador.
3. Na planilha deve aparecer a linha com Status **em andamento**, Parou na etapa **P2 Prazo** e Versão do funil **B**.
4. Abra o site de novo no mesmo navegador: o questionário continua de onde parou. Termine.
5. A **mesma linha** deve ficar com Status **completo**, Parou na etapa **P5 Dúvida** e a temperatura certa. Você cai em `projeto.html` com seu nome, seu tipo de loja e seu perfil destacados.

**Versão A (`/versao-a/`):** repita o teste. A linha deve ter Versão do funil **A**.

Dica: para simular outra pessoa no mesmo navegador, use uma janela anônima, ou toque em "Enviar respostas de outra pessoa".

## 6. Quando mudar o código do Apps Script (reimplantar mantendo a mesma URL)

Sempre que o `Code.gs` mudar (como agora, com a versão B, ou se você colocar o e-mail de aviso):

1. No editor do Apps Script, apague o código antigo, cole o novo `apps-script/Code.gs` e salve.
2. **Implantar > Gerenciar implantações**.
3. Clique no lápis (**Editar**) da implantação que já existe.
4. Em **Versão**, escolha **Nova versão** e clique em **Implantar**.

A URL continua a mesma, então não precisa mexer em nenhum `config.js`. Atenção: **não** use "Nova implantação", porque ela cria uma URL diferente e o site continuaria mandando os leads para o código antigo.

Para conferir se deu certo, rode de novo a função **testeManual** (seção 2): a linha de teste deve sair com Versão do funil "B".

## 7. Publicar o site no GitHub Pages

O site já está publicado em `https://rodrigomiranda1305-cyber.github.io/rcm-loja-completa/`. Para atualizar, faça commit e `git push` na branch `main`. Em 1 ou 2 minutos o site atualiza.

Domínio próprio (opcional): em **Settings > Pages > Custom domain**, informe o domínio e crie no seu provedor de DNS um registro CNAME apontando para `rodrigomiranda1305-cyber.github.io`. A versão A continua em `seudominio.com/versao-a/`.

## 8. Meta Pixel e Utmify

Preencha `META_PIXEL_ID: '123456789012345'` nos **dois** `config.js`. Eventos disparados:

| Evento | Versão A | Versão B |
|---|---|---|
| `PageView` | ao abrir a página | ao abrir `index.html` e `projeto.html` |
| `QuizInicio` (personalizado) | | ao tocar em "Começar agora" |
| `Lead` | ao enviar o contato | ao enviar o contato |
| `QuizEtapa` (personalizado) | a cada etapa, com número e nome | a cada etapa, com número e nome |
| `CompleteRegistration` | ao terminar | ao terminar, antes de ir para `projeto.html` |
| `AssistiuVideo` (personalizado) | | ao atingir 50% e 100% do vídeo do topo (YouTube, Vimeo ou MP4) |
| `Contact` | WhatsApp da tela final | qualquer botão de WhatsApp de `projeto.html` |

Na versão B, todos os eventos levam o parâmetro `versao: 'B'`.

Privacidade: em `projeto.html` o primeiro nome chega na URL (`?n=Nome`) só como reserva, e o site tira ele da barra de endereço **antes** do Pixel carregar. Assim a Meta não recebe dado pessoal na URL.

**Utmify:** com `UTMIFY_SCRIPT: true` o script de UTMs da Utmify é carregado automaticamente. Se a Utmify te passar um script diferente, cole no `<head>` das páginas, no local marcado com o comentário **UTMIFY**, e mude `UTMIFY_SCRIPT` para `false`. As UTMs e o `fbclid` da URL do anúncio vão para a planilha em todas as etapas.

## 9. Vídeos

- **Vídeo de apresentação** (topo de `projeto.html` na versão B, tela final na versão A): em `config.js`, `VIDEO_FINAL: { tipo: 'youtube', id: 'ID_DO_VIDEO', formato: '9:16' }`. O ID é o trecho depois de `watch?v=` (ou depois de `/shorts/`).
  - `formato: '9:16'` (vertical) é o recomendado: no celular o vídeo ocupa a primeira dobra. Grave em pé.
  - Se o vídeo for horizontal, use `formato: '16:9'`.
- **Depoimentos:** preencha os 6 itens de `DEPOIMENTOS` com nome, cidade, tipo de loja e o ID do YouTube (Shorts funcionam). Para vídeo próprio, coloque o arquivo em `assets/video/`, use `tipo: 'mp4'` e `id: 'assets/video/nome-do-arquivo.mp4'`. Itens com `id` vazio aparecem como "Depoimento em breve".

## Colunas da planilha

`Data entrada | Última atualização | Status | Parou na etapa | Temperatura | Nome | WhatsApp | Link WhatsApp | E-mail | Tipo de loja | Prazo | Investimento em equipamentos | Perfil | Principal dúvida | UTM Source | UTM Medium | UTM Campaign | UTM Content | UTM Term | fbclid | Dispositivo | Lead ID | URL de entrada | Origem do clique | Versão do funil`

- **Status:** `iniciou` (só deixou o contato), `em andamento`, `completo`.
- **Parou na etapa:** última etapa respondida. Use para ligar para quem abandonou.
- **Temperatura:**
  - 🔥 **Quente:** prazo "o mais rápido" ou "3 meses" **e** investimento "De R$ 50 a 100 mil" ou "Acima de R$ 100 mil" (versão B). Na versão A, que tem 6 faixas, vale a regra original: a partir de R$ 75 mil.
  - 🟡 **Morno:** prazo até 6 meses com qualquer investimento, ou prazo curto com "Até R$ 50 mil".
  - 🔵 **Frio/Futuro:** 1 ano ou mais.
  - Vazio enquanto o prazo não foi respondido.
- **Principal dúvida:** se a pessoa começou a escrever e saiu sem enviar, o texto aparece com a marcação "[rascunho, não enviado]".
- **Origem do clique:** na versão A, qual botão abriu o questionário (hero, card do tipo de loja, barra fixa etc.). Na versão B é sempre `pagina-quiz`.
- **Versão do funil:** `A` ou `B`.
