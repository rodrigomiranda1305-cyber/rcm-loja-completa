# Versões do funil

O projeto tem duas versões do funil no ar ao mesmo tempo, para testar nos anúncios qual converte melhor. As duas gravam na **mesma planilha**, e a coluna **Versão do funil** diz de qual versão veio cada lead (A ou B).

| | Versão A: landing primeiro | Versão B: quiz primeiro |
|---|---|---|
| O que a pessoa vê ao chegar | O site completo, com vários botões "Quero montar minha loja" | Direto o questionário, numa página leve e focada |
| Questionário | Abre por cima do site (tela cheia, com botão X) | É a própria página (`index.html`) |
| Investimento (P3) | 6 opções (até 50 mil, 50 a 75, 75 a 100, 100 a 150, acima de 150, não sei) | 3 opções (até 50 mil, 50 a 100, acima de 100) |
| Depois de enviar | Tela final com vídeo, dentro do questionário | Vai para `projeto.html`: o site completo, personalizado com o nome, o tipo de loja e o perfil, com o vídeo no topo |
| Botões depois de enviar | WhatsApp | Só WhatsApp: falar com especialista e agendar visita ao showroom |
| Valor na coluna "Versão do funil" | A | B |

## Endereços

| Versão | GitHub Pages | Com domínio próprio |
|---|---|---|
| **B** (raiz) | https://rodrigomiranda1305-cyber.github.io/rcm-loja-completa/ | `meudominio.com/` |
| B, página pós-questionário | https://rodrigomiranda1305-cyber.github.io/rcm-loja-completa/projeto.html | `meudominio.com/projeto.html` |
| **A** | https://rodrigomiranda1305-cyber.github.io/rcm-loja-completa/versao-a/ | `meudominio.com/versao-a/` |

Para comparar nos anúncios, crie dois conjuntos de anúncios iguais, um apontando para cada URL, e use UTMs diferentes (por exemplo `utm_content=versao-a` e `utm_content=versao-b`). Na planilha, filtre pela coluna **Versão do funil**.

## Onde está cada versão nos arquivos

- **Versão B:** arquivos da raiz: `index.html` (questionário), `projeto.html` (site pós-questionário), `privacidade.html` e a pasta `assets/` (CSS `base.css`, `quiz.css` e `site.css`; JS `config.js`, `comum.js`, `quiz.js` e `projeto.js`).
- **Versão A:** pasta `versao-a/` inteira. É autocontida: tem a própria cópia de imagens, fontes, vídeo, CSS, JS e política de privacidade.
- **Configuração:** cada versão tem o próprio `config.js`:
  - B: `assets/js/config.js`
  - A: `versao-a/assets/js/config.js`

  Ao preencher a URL da planilha, o Pixel, o WhatsApp ou os vídeos, **preencha nos dois arquivos**. Não mexa em `VERSAO_FUNIL`: é ele que grava A ou B na planilha.
- **Git:** a versão A original, de antes da versão B existir, está guardada na tag `v1-landing-primeiro` e na branch `versao-a-landing-primeiro`.

## Como voltar a raiz para a versão A

### Opção 1 (recomendada): copiar a pasta `versao-a/` para a raiz

É a forma mais simples e mantém o valor "A" na coluna Versão do funil.

1. Apague da raiz: `index.html`, `projeto.html`, `privacidade.html` e a pasta `assets/`.
2. Copie todo o conteúdo de `versao-a/` (`index.html`, `privacidade.html`, `favicon.svg`, `apple-touch-icon.png` e `assets/`) para a raiz.
3. Publique (commit e push).

Pelo terminal, na pasta do projeto:

```bash
git rm -r -q index.html projeto.html privacidade.html assets
cp -r versao-a/index.html versao-a/privacidade.html versao-a/assets .
git add -A
git commit -m "Volta a raiz para a versao A"
git push
```

### Opção 2: restaurar a tag `v1-landing-primeiro`

Traz a versão A exatamente como ela era antes da versão B. Atenção: essa versão é anterior à coluna "Versão do funil", então os leads gravados por ela ficam com essa coluna vazia.

```bash
git rm -r -q index.html projeto.html assets
git checkout v1-landing-primeiro -- index.html privacidade.html assets
git commit -m "Volta a raiz para a versao A (tag v1-landing-primeiro)"
git push
```

### Opção 3 (emergência, sem mexer em arquivo nenhum)

No GitHub: **Settings > Pages > Branch**, troque `main` por `versao-a-landing-primeiro` e salve. Em 1 ou 2 minutos a raiz volta a ser a versão A. Para desfazer, volte para `main`. Nesse modo a pasta `/versao-a/` e a versão B saem do ar, e a coluna "Versão do funil" fica vazia.

## Como voltar para a versão B depois

Se usou a opção 1 ou 2: `git revert` no commit de volta (ou faça checkout do commit anterior). Se usou a opção 3: volte o GitHub Pages para a branch `main`.
