# Assistente de Parecer – Isenção de IPTU

Ferramenta de apoio para análise de pedidos de isenção de IPTU de pessoa
física (art. 113 da LC 203/2022, regulamentado pelo Decreto nº 1.410/2026).
Não decide, não bloqueia e não substitui a análise do fiscal.

## Triagem inicial

O primeiro item do formulário é a triagem: o pedido só é analisado se o
proprietário for aposentado ou pensionista, ou se o imóvel for moradia de
pessoa com necessidades especiais permanentes (Decreto art. 4º, IV). Se
nenhuma dessas hipóteses se aplica, o assistente indica indeferimento
automático, esconde o restante do formulário e gera um parecer simplificado —
basta preencher a identificação do processo.

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

## Os pareceres e relatórios ficam só no seu computador

Isso vale sempre, mesmo acessando pelo link do GitHub Pages:

- O GitHub (e o GitHub Pages) apenas entrega o arquivo `index.html` para o
  navegador. Ele **não recebe, não processa e não armazena** nenhum dado
  digitado, nenhum parecer gerado e nenhum relatório — a página não faz
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
por um arquivo local — os pareceres e relatórios nunca saem do seu
computador nem são enviados para o GitHub.

## Evitar commit acidental de arquivos exportados

Se você rodar a ferramenta a partir de uma cópia local desta pasta e apontar
a "pasta de processos" para dentro do repositório clonado, o `.gitignore`
já ignora os nomes de arquivo que a ferramenta costuma gerar
(`Relatorio_Isencoes_IPTU.csv`, `Parecer_IPTU_*.docx`, `processos/`).
Ainda assim, o recomendado é sempre escolher uma pasta fora do repositório
para guardar os processos.

## Base normativa

LC 203/2022 (arts. 10, 86, 95, 96, 113, 443, 446) e Decreto 1.410/2026.
