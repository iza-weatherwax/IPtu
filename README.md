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
blocos do texto automático, como `{{bloco:fatos}}`, `{{bloco:resumo}}` e
`{{bloco:anexo}}`. Resultado sem modelo
cadastrado continua saindo no formato automático. Os modelos ficam só no
navegador; o botão **Baixar modelos** gera uma cópia em `.json`.

## Texto do despacho

Há três tipos de despacho: **deferimento**, **indeferimento** e **pendência**
(pede ao contribuinte os documentos e as informações que faltam). Variações do
mesmo formato: indeferimento na triagem, arquivamento quando a pendência não é
atendida e encaminhamento a outro órgão.

Todos seguem o modelo do departamento (Despacho Decisório), na mesma ordem:

1. **Cabeçalho:** nº do despacho, processo, interessado, CPF e assunto com o
   exercício e o resultado (ex.: `ISENÇÃO DE IPTU – EXERCÍCIO DE 2026 – DEFERIMENTO`).
2. **Do pedido:** "Uma vez recebido o processo…".
3. **Do contexto normativo:** parecer da PGM e Decreto nº 1.410/2026, em todos
   os despachos (texto editável ou desligável em **Configurações do despacho**).
4. **Da análise:** no deferimento e no indeferimento, um quadro com os seis
   requisitos (requisito, situação e como foi verificado) e, quando há mais de
   um rendimento, o quadro da renda da família com o total e o limite. No
   indeferimento, os requisitos não analisados ficam fora do quadro.
5. **Da decisão** (ou **Da notificação** / **Do encaminhamento**): a decisão,
   as providências (certificado ou ressalva de recurso) e o quadro "Em resumo",
   em linguagem simples.
6. Data, linha de assinatura, nome do fiscal, "Auditor Fiscal" e matrícula.

Na pendência, cada item sai como "**Assunto:** o que apresentar (artigo do
Decreto)", em itens a), b), c), pedido de forma específica, por pessoa e por
tipo de rendimento. O prazo de 10 dias úteis e o aviso de arquivamento aparecem
uma vez, antes da lista. Quando a renda é pedida, as orientações sobre os
comprovantes vão num **anexo** depois da assinatura, em página própria.

As citações seguem um padrão só: "(Decreto, art. X)" no fim da frase. A
numeração dos parágrafos é opcional, e os títulos das seções podem ser
ocultados. No Word, o espaçamento é feito pelo próprio parágrafo (sem linhas
em branco), os itens têm recuo e as tabelas usam a mesma fonte do texto.

## Numeração do despacho

Cada despacho recebe um número automático por ano (ex.: `DESPACHO DECISÓRIO Nº 12/2026`),
com formato configurável (ex.: `461-{nn}/{ano}`). O mesmo processo mantém o número enquanto o
resultado não muda; um novo resultado (por exemplo, arquivamento depois de
uma notificação) recebe novo número. A sequência é guardada no navegador e
acompanha os despachos já registrados na pasta de processos; no card
**Numeração do despacho** é possível ajustar o próximo número ou fixar à mão o
número de um despacho. O número também vai para o relatório `.csv`, que traz
também o endereço do imóvel digitado no item 2 (coluna logo depois do CCI). O nº do despacho sai como
texto (ex.: `Nº 12/2026`), para que o Excel não o transforme em data, mesmo
depois de o arquivo ser salvo no Excel. Se a pasta de processos tem um
relatório em formato antigo (sem a coluna do endereço, ou com o nº do despacho
como fórmula ou já convertido em data), ele é refeito automaticamente quando a
pasta é aberta, a partir dos processos (.json) da pasta; a versão anterior fica
guardada como `Relatorio_Isencoes_IPTU_anterior_<data>_<hora>.csv`.

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
(`Relatorio_Isencoes_IPTU*.csv`, `Despacho_IPTU_*.docx`, `processos/`).
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
- Atividade de MEI: o CCMEI também tem três estados. *Ausente* gera pendência
  (não é impedimento) e os documentos complementares marcados (CNPJ, DASN-SIMEI
  etc.) também são pedidos. A consulta ao cadastro tem a opção "consta outro
  imóvel – a esclarecer" (pendência: pede os documentos que esclareçam a
  situação do imóvel) e "consta outro imóvel – impede" (indeferimento).
- O despacho de pendência pede tudo o que o fiscal marcou como ausente ou a
  pedir, qualquer que seja a situação do requisito. Um requisito marcado à mão
  como "Pendente" entra no despacho com o texto de "Observação para o
  despacho"; se a conclusão "Pendência" for escolhida à mão apesar de haver
  requisito não atendido, o painel avisa que o despacho não cita o impeditivo.
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
