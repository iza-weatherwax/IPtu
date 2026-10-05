# Assistente de Despacho – Isenção de IPTU

Ferramenta de apoio para análise de pedidos de isenção de IPTU de pessoa
física (art. 113 da LC 203/2022, regulamentado pelo Decreto nº 1.410/2026).
Não decide, não bloqueia e não substitui a análise do fiscal.

## Triagem inicial

O primeiro item do formulário é a triagem: o pedido só é analisado se o
proprietário for aposentado ou pensionista, ou se o imóvel for moradia de
pessoa com necessidades especiais permanentes (Decreto art. 4º, IV). Se
nenhuma dessas hipóteses se aplica, o assistente indica indeferimento
automático, esconde o restante do formulário e gera um despacho simplificado —
basta preencher a identificação do processo.

## Modelo próprio de despacho

Por padrão o despacho é gerado no formato automático do Assistente. No card
**Modelo do despacho** é possível escolher **Meu modelo** e cadastrar um texto
próprio para cada resultado (deferimento, indeferimento, encaminhamento por
pendência e indeferimento na triagem) — digitando ou carregando um arquivo
`.docx` ou `.txt`. O modelo usa campos como `{{requerente}}`, `{{inscricao}}`,
`{{motivos}}`, `{{pendencias}}` e `{{n}}` (numeração), e pode reaproveitar
blocos do texto automático, como `{{bloco:fatos}}`. Resultado sem modelo
cadastrado continua saindo no formato automático. Os modelos ficam só no
navegador; o botão **Baixar modelos** gera uma cópia em `.json`.

## Texto do despacho

O despacho segue o modelo do departamento (Despacho Decisório): cabeçalho com
nº do despacho, processo, interessado, CNPJ/CPF e assunto; abertura "Uma vez
recebido o processo…"; parágrafo de contexto normativo (parecer da PGM e
Decreto nº 1.410/2026, editável ou desligável no card **Modelo do despacho**);
e o corpo conforme o resultado. Nas pendências, cada documento faltante é
pedido de forma específica, por pessoa e por tipo de rendimento (por exemplo,
"informar o valor mensal bruto da pensão recebida por Fulano"), em itens a),
b), c). A numeração dos parágrafos e os títulos de seção são opcionais.
O texto tem dois níveis de detalhe: **Completo** (padrão), com quadro dos
requisitos em linguagem simples e "Em resumo", e **Enxuto**.

## Numeração do despacho

Cada despacho recebe um número automático por ano (ex.: `DESPACHO DECISÓRIO Nº 12/2026`),
com formato configurável (ex.: `461-{nn}/{ano}`). O mesmo processo mantém o número enquanto o
resultado não muda; um novo resultado (por exemplo, arquivamento depois de
uma notificação) recebe novo número. A sequência é guardada no navegador e
acompanha os despachos já registrados na pasta de processos; no card
**Numeração do despacho** é possível ajustar o próximo número ou fixar à mão o
número de um despacho. O número também vai para o relatório `.csv`.

## Como funciona

O programa é um único arquivo estático (`index.html`), com HTML, CSS e
JavaScript embutidos. Não há backend, banco de dados ou serviço externo: tudo
roda inteiramente no navegador de quem usa.

## Onde rodar

- **Pela internet (GitHub Pages):** este repositório publica o `index.html`
  automaticamente a cada push na branch `main`, via o workflow em
  `.github/workflows/deploy-pages.yml`. Basta habilitar uma vez, em
  **Settings → Pages → Source → GitHub Actions**, e a ferramenta fica
  disponível em `https://iza-weatherwax.github.io/IPtu/` para ser acessada de
  qualquer computador, sem instalar nada.
- **Localmente:** baixe ou clone o repositório e abra `index.html` direto no
  navegador (ou sirva a pasta com qualquer servidor estático). Funciona sem
  internet.

Em ambos os casos o comportamento é idêntico — o que muda é só de onde a
página é carregada.

## Os despachos e relatórios ficam só no seu computador

Isso vale sempre, mesmo acessando pelo link do GitHub Pages:

- O GitHub (e o GitHub Pages) apenas entrega o arquivo `index.html` para o
  navegador. Ele **não recebe, não processa e não armazena** nenhum dado
  digitado, nenhum despacho gerado e nenhum relatório — a página não faz
  nenhuma requisição de rede para salvar nada.
- Cada processo aberto fica guardado, enquanto você trabalha, no
  `localStorage` do próprio navegador (um registro local, por navegador).
- Ao clicar em **"Escolher pasta"**, a ferramenta usa a File System Access
  API do navegador (Chrome/Edge) para ler e gravar os arquivos de cada
  processo e o relatório `.csv` diretamente numa pasta escolhida por você no
  seu próprio computador — nunca no repositório nem em nenhum servidor.
- Os botões **"Baixar (.docx)"**, **"Salvar em PDF / imprimir"** e
  **"Exportar relatório (.csv)"** geram o arquivo no próprio navegador e o
  entregam para a pasta de downloads do seu computador, sem passar por
  nenhum servidor.
- Em navegadores sem suporte à File System Access API (ex.: Firefox, Safari),
  a ferramenta cai automaticamente para o modo de baixar arquivo por arquivo.

Ou seja: não importa se você abre a ferramenta pelo link do GitHub Pages ou
por um arquivo local — os despachos e relatórios nunca saem do seu
computador nem são enviados para o GitHub.

## Evitar commit acidental de arquivos exportados

Se você rodar a ferramenta a partir de uma cópia local desta pasta e apontar
a "pasta de processos" para dentro do repositório clonado, o `.gitignore`
já ignora os nomes de arquivo que a ferramenta costuma gerar
(`Relatorio_Isencoes_IPTU.csv`, `Despacho_IPTU_*.docx`, `processos/`).
Ainda assim, o recomendado é sempre escolher uma pasta fora do repositório
para guardar os processos.

## Conferência, papel timbrado e testes

- O painel lateral tem quatro blocos: **Situação** (conclusão, geração e
  salvamento), **Conferência** (impeditivos, o que será pedido ao contribuinte,
  o que o fiscal ainda precisa verificar e avisos — só aparecem as seções com
  itens), **Processos** e **Configurações do despacho** (recolhido: numeração,
  texto e modelos próprios).
- Comprovantes do aposentado/pensionista/pessoa com necessidades especiais têm
  três estados: *não conferido* (não gera pendência), *ausente* (gera pedido) ou
  o documento apresentado. Sem rendimentos lançados, só se pede a declaração de
  renda quando o fiscal marca "Nenhum comprovante de renda foi apresentado".
- O despacho só recebe número e é registrado quando o nº do processo e o
  requerente estão preenchidos; antes disso é um rascunho. O botão **Liberar o
  nº deste processo** desfaz a numeração.
- O papel timbrado (Word e impressão) segue o do departamento; no Word o quadro
  da direita mostra "FL." e a página (o nº do processo vai só no corpo).
- As regras do art. 34 do Decreto valem só para o exercício
  `ANO_TRANSICAO` (2026, no código); o exercício padrão é o ano corrente.
- Testes de ponta a ponta (Playwright): `npm install`, `npx playwright install
  chromium` e `npm test`. Rodam também no GitHub Actions a cada push; o site
  publicado no GitHub Pages contém apenas o `index.html`.

## Base normativa

LC 203/2022 (arts. 10, 86, 95, 96, 113, 443, 446) e Decreto 1.410/2026.
