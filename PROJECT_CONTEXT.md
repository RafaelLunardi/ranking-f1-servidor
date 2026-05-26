# Contexto do Projeto: Ruins de Roda

Este arquivo resume o contexto tecnico e de produto do site **Ruins de Roda**, para que outra IA ou dev consiga continuar o trabalho sem depender do historico da conversa.

## Visao geral

O projeto e um site estatico publicado no GitHub Pages para uma comunidade de corridas/F1/F2 chamada **Ruins de Roda**.

URL publicada:

- https://rafaellunardi.github.io/ranking-f1-servidor/

Repositorio:

- https://github.com/RafaelLunardi/ranking-f1-servidor

O site tem paginas separadas:

- `index.html`: home.
- `rankings.html`: rankings de pilotos e construtores.
- `corridas.html`: proximas corridas.
- `noticias.html`: noticias.
- `lives.html`: dados das lives.
- `regras.html`: regulamento.

As regras valem para F1 e F2, por isso a pagina `regras.html` nao tem seletor F1/F2.

## Stack

Site estatico puro:

- HTML
- CSS
- JavaScript vanilla
- GitHub Pages
- GitHub Actions para atualizar snapshot do Google Sheets

Nao ha build step, bundler, framework ou backend.

## Arquivos principais

- `index.html`: home com hero objetivo, atalhos e card do Discord.
- `rankings.html`: pagina de rankings com:
  - seletor F1/F2 no topo;
  - abas Serie A ate Serie G;
  - alternancia Pilotos/Construtores.
- `data.js`: dados locais e configuracao do Google Sheets.
- `sheet-data.js`: snapshot gerado automaticamente a partir do Google Sheets.
- `app.js`: toda a logica de renderizacao, parsing CSV, split por series, F1/F2, rankings, cards e regras.
- `styles.css`: todo o visual.
- `scripts/update-sheet-data.cjs`: script Node usado pelo GitHub Actions para gerar `sheet-data.js`.
- `.github/workflows/update-sheets.yml`: workflow agendado para atualizar dados da planilha.

## Home

A home foi simplificada a pedido do usuario:

- Nao deve ter seletor F1/F2.
- Deve ter texto curto e objetivo.
- Deve ter propaganda/card do Discord.

Link do Discord:

- https://discord.gg/ZpNQgjEGGz

Texto atual do hero:

- H1: `Ruins de Roda`
- Copy: `Rankings, corridas, lives e regras da comunidade.`

## F1/F2

O seletor F1/F2 aparece nas paginas:

- `rankings.html`
- `corridas.html`
- `noticias.html`
- `lives.html`

Nao aparece em:

- `index.html`
- `regras.html`

Comportamento atual:

- F2 tem dados reais vindos do Google Sheets.
- F1 ainda nao tem dados cadastrados; aparece estado vazio/aguardando dados.
- A escolha F1/F2 e salva no `localStorage` nas paginas que tem seletor.
- Na home, como nao ha seletor, o app forca contexto F2 para os cards/resumo.

## Rankings

Na pagina `rankings.html`:

- As abas de series ficam a esquerda: Serie A ate Serie G.
- O seletor `Pilotos / Construtores` fica na mesma barra, alinhado a direita.
- Em `Pilotos`, a tabela mostra:
  - Pos
  - Piloto
  - Pais
  - Pontos
  - NC
  - DNF
- Em `Construtores`, os dados sao agregados por `team`/`constructor`.

### Movimento no ranking

O campo de movimento vem da planilha como texto, por exemplo:

- `◀️ = 0`
- `🔼 + 1`
- `🔽 - 1`

No site, os emojis sao convertidos para setas limpas para evitar bug visual:

- `▲` verde para subida.
- `▶` azul para igual/lateral.
- `▼` vermelho para descida.

Classes CSS:

- `.movement-badge.up`
- `.movement-badge.same`
- `.movement-badge.down`

Tambem ha `.movement-cell`.

### Bandeira e pais

O pais aparece como bandeira + codigo:

- `🇧🇷 BRA`
- `🇦🇷 ARG`
- `🇫🇷 FRA`

Classes CSS:

- `.country-cell`
- `.country-flag`

## Google Sheets

Planilha usada:

- https://docs.google.com/spreadsheets/d/1KWkrcpZXpvO2Cj8rc1_v9B9xr2QMRtbN_bSitTcaAl8/edit?pli=1&gid=0#gid=0

CSV publico usado pelo site:

- https://docs.google.com/spreadsheets/d/1KWkrcpZXpvO2Cj8rc1_v9B9xr2QMRtbN_bSitTcaAl8/gviz/tq?tqx=out:csv&gid=0

Hoje a aba `gid=0` e usada para **F2 / pilotos**.

O CSV tem colunas parecidas com:

- `Posição`
- `Piloto`
- `Bandeira`
- `Pontos`
- `Var`
- `` `NC | DNF:``
- `Var`

O parser em `app.js` e em `scripts/update-sheet-data.cjs` mapeia os campos assim:

- `row[0]`: posicao geral original da planilha.
- `row[1]`: piloto.
- `row[2]`: bandeira no formato Discord, ex. `:flag_br:`.
- `row[5]`: pontos.
- `row[6]`: movimento visual, ex. `**🔼 + 1**`.
- `row[7]`: DNF.
- `row[8]`: variacao numerica usada como `nc`.

## Divisao em series

A planilha e um ranking geral. O site divide automaticamente por blocos de 20 pilotos, seguindo a ordem da planilha:

- Serie A: pilotos 1 a 20.
- Serie B: pilotos 21 a 40.
- Serie C: pilotos 41 a 60.
- Serie D: pilotos 61 a 80.
- Serie E: pilotos 81 a 100.
- Serie F: pilotos 101 a 120.
- Serie G: pilotos 121 a 140, ou o restante se houver menos.

Essa regra esta em:

- `splitRowsIntoSeries(rows)` em `app.js`.
- `splitRowsIntoSeries(rows)` em `scripts/update-sheet-data.cjs`.

Importante: a posicao exibida dentro de cada serie reinicia em `01`, `02`, ..., `20`.

## Atualizacao programada

Foi criado um workflow do GitHub Actions:

- `.github/workflows/update-sheets.yml`

Ele roda todo dia:

- `0 3 * * *` em UTC.
- Isso equivale a **00h em Sao Paulo**.

O workflow:

1. Faz checkout do repositorio.
2. Usa Node 20.
3. Roda `node scripts/update-sheet-data.cjs`.
4. Gera/atualiza `sheet-data.js`.
5. Commita `sheet-data.js` se houver mudanca.

Tambem pode ser executado manualmente no GitHub em:

- Actions -> `Atualizar dados do Google Sheets` -> `Run workflow`

## Atualizacao ao vivo

Alem do snapshot programado, `app.js` ainda tenta buscar o CSV do Google Sheets quando a pagina abre.

Fluxo atual:

1. `data.js` carrega dados locais e configuracao.
2. `sheet-data.js` carrega o ultimo snapshot salvo pelo workflow.
3. `app.js` aplica o snapshot em `applySheetSnapshot()`.
4. `app.js` tenta buscar o CSV ao vivo em `refreshFromSheets()`.
5. Se o Sheets falhar, o site continua usando o snapshot/local.

Isso foi feito para ter:

- dados programados todo dia 00h;
- tentativa de atualizar ao abrir;
- fallback para nao quebrar a pagina.

## Regras

A pagina `regras.html` renderiza regras a partir de `data.rules`.

Blocos atuais:

- Administrativas
- Bandeira Verde
- Bandeira Amarela
- Suspensao | Suspencion
- Bandeira Azul

O render aceita dois formatos:

- Antigo: `{ title, body }`
- Novo: `{ title, items: [{ code, body }] }`

As regras foram fornecidas pelo usuario e devem ser preservadas.

## GitHub Pages

O site esta publicado via GitHub Pages na branch `main`, servindo a raiz do repositorio.

Nao precisa buildar.

Para publicar mudancas:

```powershell
git add .
git commit -m "Mensagem"
git pull --rebase origin main
git push
```

Depois aguarde o GitHub Pages propagar. Normalmente leva segundos a poucos minutos.

## Cache busting

O projeto usa query strings nos assets para forcar o Pages/navegador a pegar arquivos novos:

```html
styles.css?v=14
data.js?v=14
sheet-data.js?v=14
app.js?v=14
```

Sempre que mudar `app.js`, `styles.css`, `data.js` ou `sheet-data.js`, atualizar a versao nos HTMLs.

Exemplo em PowerShell:

```powershell
$files = Get-ChildItem -Filter *.html | Select-Object -ExpandProperty Name
foreach ($file in $files) {
  $content = Get-Content -Raw $file
  $content = $content -replace 'styles\.css\?v=\d+', 'styles.css?v=15'
  $content = $content -replace 'data\.js\?v=\d+', 'data.js?v=15'
  $content = $content -replace 'sheet-data\.js\?v=\d+', 'sheet-data.js?v=15'
  $content = $content -replace 'app\.js\?v=\d+', 'app.js?v=15'
  Set-Content -NoNewline -Encoding utf8 $file $content
}
```

## Teste local

Como nao ha framework, pode servir com um servidor estatico simples.

Um jeito usado durante o desenvolvimento foi criar temporariamente `preview-server.cjs` e rodar:

```powershell
node preview-server.cjs
```

Depois abrir:

```text
http://127.0.0.1:4173/rankings.html
```

Nao commit o `preview-server.cjs`; ele foi usado apenas como scratch temporario.

## Observacoes importantes

- O repositorio ja tem historico remoto; antes de push, usar `git pull --rebase origin main`.
- O usuario prefere iterar visualmente pelo GitHub Pages.
- O projeto contem alguns textos e caracteres com possivel mojibake em `data.js` por conta de encoding antigo, mas a renderizacao atual dos dados do Sheets usa `sheet-data.js`/CSV e esta funcionando.
- Nao remover o fallback local sem necessidade.
- Nao colocar seletor F1/F2 na home nem nas regras, a menos que o usuario peca explicitamente.
- Se surgirem novas abas de planilha para F1, construtores, corridas, noticias ou lives, o caminho esperado e adicionar URLs em `data.sheetSources` e expandir o parser/snapshot.

## Estado validado por ultimo

Validacoes feitas no Pages:

- Serie A vem do Google Sheets e tem 20 pilotos.
- Serie B comeca no 21o piloto da planilha e tem 20 pilotos.
- Bandeira aparece antes do pais.
- Movimento:
  - `▶` azul para sem mudanca.
  - `▲` verde para subida.
  - `▼` vermelho para descida.
- Workflow de snapshot esta configurado para rodar diariamente as 00h de Sao Paulo.
