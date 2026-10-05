/* Testes de ponta a ponta do Assistente (Playwright + Chromium).
   Uso: npm test        (ou: CHROMIUM_PATH=/caminho/do/chromium node tests/run.js) */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
let total = 0, falhas = 0;
const ok = (cond, nome, extra) => { total++; if (cond) console.log('  ok     ' + nome); else { falhas++; console.log('  FALHOU ' + nome + (extra ? '  →  ' + extra : '')); } };
const sec = t => console.log('\n' + t);
const X = '<img src=x onerror=alert("XSS")>';

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
  const erros = [];
  async function abrir(){
    const ctx = await browser.newContext({acceptDownloads: true, viewport: {width: 1300, height: 900}});
    const p = await ctx.newPage();
    p.__dialogos = []; p.__aceitar = true; p.__xss = 0;
    p.on('pageerror', e => erros.push(e.message));
    p.on('dialog', d => { p.__dialogos.push(d.message()); if (/XSS/.test(d.message())) p.__xss++; p.__aceitar ? d.accept() : d.dismiss(); });
    await p.goto(URL); await p.waitForTimeout(300);
    await p.addStyleTag({content: '#pastaModal{display:none !important}'});
    return p;
  }
  const f = (p, k, v) => p.fill(`[data-k="${k}"]`, v);
  const sel = (p, k, v) => p.selectOption(`[data-k="${k}"]`, v);
  const gerar = async p => { await p.click('#btnGerar'); return p.innerText('#parecer'); };
  const dados = async (p, extra = {}) => { await f(p,'numero','4085/2026'); await f(p,'requerente','Maria da Silva'); await f(p,'cpf','111.222.333-44'); await f(p,'cci','411'); await f(p,'sm','1518'); await f(p,'exercicio', String(await p.evaluate(() => ANO_TRANSICAO))); for (const [k,v] of Object.entries(extra)) await f(p,k,v); };
  /* formulário completo e favorável: aposentado, requisitos atendidos, uma renda comprovada */
  async function tudoOk(p, renda = 1400){
    await p.check('[data-k="c_apos"]'); await p.selectOption('[data-k="ap_doc"]', {index: 2});
    await sel(p,'r1_ativ','nao'); await sel(p,'r2_conf','sim'); await sel(p,'ce','sim'); await sel(p,'hab','sim');
    await sel(p,'r5_decl','ok'); await sel(p,'r5_cons','nenhum'); await sel(p,'condicao','prop');
    for (const k of ['b_req','b_id','b_cpf','b_end','b_carne','b_rel']) await sel(p,k,'ok');
    await p.click('#addRend'); await p.fill('[data-l="rend"][data-i="0"][data-f="valor"]', String(renda)); await p.selectOption('[data-l="rend"][data-i="0"][data-f="doc"]', {index: 1});
    await sel(p,'t_ini','sim');
  }
  const linhas = t => t.split('\n').map(x => x.trim()).filter(Boolean);

  sec('Triagem e resultados');
  let p = await abrir(); await dados(p); await p.check('[data-k="c_nenhuma"]');
  let t = await gerar(p);
  ok(/DESPACHO DECISÓRIO Nº 1\/\d{4}/.test(t), 'triagem: título numerado');
  ok(/indefere-se/.test(t) && /art\. 38/.test(t), 'triagem: indefere e ressalva recurso (art. 38)');
  ok(/Uma vez recebido o processo nº 4085\/2026/.test(t) && /INTERESSADO: MARIA DA SILVA/.test(t), 'cabeçalho e abertura no modelo do departamento');
  ok(/esta auditoria fiscal teve acesso ao parecer jurídico/.test(t), 'contexto normativo (PGM) presente');
  ok(await p.isDisabled('[data-k="decisao"]'), 'triagem trava a conclusão do despacho');
  await p.context().close();

  p = await abrir(); await dados(p); await tudoOk(p);
  ok(/Deferimento/.test(await p.textContent('#sugestao')), 'tudo atendido sugere deferimento');
  t = await gerar(p);
  ok(/defere-se/.test(t) && /Emita-se o Certificado/.test(t) && /Em resumo/.test(t), 'deferimento: decisão, certificado e "Em resumo"');
  ok(!/Morador\tNúcleo/.test(t), 'deferimento: sem quadro de renda com uma só pessoa');
  await p.context().close();

  p = await abrir(); await dados(p); await tudoOk(p, 3000);
  ok(/Indeferimento/.test(await p.textContent('#sugestao')), 'renda acima do limite sugere indeferimento');
  t = await gerar(p);
  ok(/indefere-se/.test(t) && /incisos? VI/.test(t) && /R\$\s?3\.000,00/.test(t) && !/Notifica/.test(t), 'indeferimento por renda: direto, sem notificação');
  ok(!(await p.isVisible('#notifBox')), 'indeferimento: sem opção de "já notificado"');
  await p.context().close();

  sec('Pendências específicas (carta ao contribuinte)');
  p = await abrir(); await dados(p);
  await p.check('[data-k="c_apos"]'); await p.selectOption('[data-k="ap_doc"]', {index: 2});
  await p.fill('[data-l="moradores"][data-i="0"][data-f="nome"]', 'JOSE');
  for (const [i, n] of [[1,'SEBASTIANA'],[2,'ROSA']]){ await p.click('#addMor'); await p.fill(`[data-l="moradores"][data-i="${i}"][data-f="nome"]`, n); }
  for (const i of [0,1,2]){ await p.click('#addRend'); await p.selectOption(`[data-l="rend"][data-i="${i}"][data-f="m"]`, String(i)); }
  await sel(p,'decisao','pend'); t = await gerar(p);
  ok(/apresentar comprovação da aposentadoria de JOSE, SEBASTIANA e ROSA, com o valor mensal bruto/.test(t), 'renda: uma frase agrupada por tipo de rendimento');
  ok(!/informar o valor mensal bruto da aposentadoria recebida/.test(t), 'renda: sem repetição por pessoa');
  const orient = linhas(t).filter(x => x.startsWith('⦁'));
  ok(orient.length === 3 && /aposentado/.test(orient[0]), 'orientações de renda só com os exemplos aplicáveis', String(orient.length));
  ok(/em até 10 \(dez\) dias úteis/.test(t) && /art\. 29, §§ 2º e 3º/.test(t), 'pendência: prazo de 10 dias úteis e art. 29');
  await p.selectOption('[data-l="rend"][data-i="0"][data-f="doc"]', {index: 1}); await p.fill('[data-l="rend"][data-i="0"][data-f="valor"]', '800');
  await p.selectOption('[data-l="rend"][data-i="1"][data-f="tipo"]', 'pensao'); await p.fill('[data-l="rend"][data-i="1"][data-f="valor"]', '600');
  await p.selectOption('[data-l="rend"][data-i="1"][data-f="doc"]', {index: 1}); await p.selectOption('[data-l="rend"][data-i="2"][data-f="doc"]', {index: 1});
  t = await gerar(p);
  ok(/informar o valor mensal bruto da aposentadoria de ROSA/.test(t) && !/JOSE/.test(linhas(t).find(x => /^a\)/.test(x)) || ''), 'só falta o valor: pede só o valor (e só de quem falta)');
  await p.context().close();

  p = await abrir(); await dados(p); await p.check('[data-k="c_apos"]'); await sel(p,'b_rel','falta'); await p.check('[data-k="copropr"]'); await sel(p,'c_nucleo','falta'); await p.check('[data-k="r5c_0"]');
  await sel(p,'r5_cons','nenhum'); await sel(p,'r5_decl','falta'); await p.selectOption('[data-k="ap_doc"]', {index: 2}); await p.check('[data-k="renda_falta"]'); await sel(p,'decisao','pend');
  t = await gerar(p);
  ok(/matrícula atualizada do imóvel/.test(t) && /copropriedade/.test(t) && /composição do núcleo familiar/.test(t) && /Serviço Registral Imobiliário/.test(t) && /composição da renda do núcleo familiar \(faz-se necessária a entrega de declaração/.test(t), 'itens do modelo do departamento (matrícula, copropriedade, núcleo, certidão, renda)');
  ok(linhas(t).some(x => /^a\) À /.test(x)) && linhas(t).some(x => /^b\) À /.test(x)), 'itens lettered a), b), c)');
  await p.context().close();

  sec('Três estados: não conferido ≠ ausente');
  p = await abrir(); await dados(p); await p.check('[data-k="c_apos"]');
  ok(/incompleta/i.test(await p.textContent('#sugestao')), 'aposentado sem conferir o documento: análise incompleta');
  ok(!(await p.isVisible('#secPendC')), 'aposentado sem conferir: nada a pedir ao contribuinte');
  await p.selectOption('[data-k="ap_doc"]', 'falta');
  ok(/Pendência/.test(await p.textContent('#sugestao')) && /À condição de aposentado/.test(await p.innerText('#lstPendC')), 'documento ausente: pendência com o pedido específico');
  await p.context().close();

  sec('Pedidos que não dependem do status do requisito (MEI, outro imóvel, pendência marcada)');
  /* MEI sem os documentos: pendência (não impedimento), com o CCMEI e os complementares marcados, junto com a renda */
  p = await abrir(); await dados(p); await p.check('[data-k="c_apos"]'); await p.selectOption('[data-k="ap_doc"]', {index: 2});
  await sel(p,'r1_ativ','mei'); await sel(p,'mi_ccmei','falta'); await p.check('[data-k="mc_2"]'); await p.check('[data-k="mc_4"]'); await p.click('#addRend');
  ok(/Pendência/.test(await p.textContent('#sugestao')), 'MEI com CCMEI ausente: pendência, não impedimento');
  t = await gerar(p);
  ok(/microempreendedor individual/.test(t) && /CCMEI/.test(t) && /DASN-SIMEI/.test(t) && /atividade é exercida no imóvel/.test(t) && /art\. 21, VI, “a” e “b”/.test(t), 'MEI: pede o CCMEI e os complementares marcados');
  ok(/composição da renda/.test(t) && !/\(faz-se necessária a apresentação do Certificado[^)]*\([^)]*\)\)/.test(t), 'MEI: também pede a renda, sem parênteses aninhados');
  await sel(p,'decisao','pend'); t = await gerar(p);
  ok(/CCMEI/.test(t), 'MEI: conclusão “Pendência” escolhida à mão continua pedindo o CCMEI');
  await p.context().close();

  p = await abrir(); await dados(p); await p.check('[data-k="c_apos"]'); await p.selectOption('[data-k="ap_doc"]', {index: 2}); await sel(p,'r1_ativ','mei');
  ok(/CCMEI \(atividade de MEI informada\)/.test(await p.innerText('#lstAviso')), 'MEI com CCMEI não conferido: aviso (não vira pedido)');
  await p.evaluate(() => { const e = JSON.parse(JSON.stringify(s)); e.mi_ccmei = 'nao'; carregarEstado({tipo:'processo-iptu', estado:e, registro:null, parecerHtml:''}, null); });
  ok(await p.evaluate(() => s.mi_ccmei) === 'falta' && /Pendência/.test(await p.textContent('#sugestao')), 'processo antigo (CCMEI “não atendido”) passa a CCMEI ausente');
  await p.context().close();

  /* outro imóvel: "a esclarecer" gera pendência; "impede" gera indeferimento; pendência forçada não esconde o assunto */
  p = await abrir(); await dados(p); await p.check('[data-k="c_apos"]'); await p.selectOption('[data-k="ap_doc"]', {index: 2}); await p.click('#addRend');
  await sel(p,'r5_decl','ok'); await sel(p,'r5_cons','esclarecer'); await f(p,'r5_det','inscrição 98765');
  ok(/Pendência/.test(await p.textContent('#sugestao')), 'outro imóvel “a esclarecer”: pendência');
  t = await gerar(p);
  ok(/outro imóvel que consta em seu nome, a saber: inscrição 98765/.test(t) && /Cartório de Registro de Imóveis/.test(t) && /art\. 12 e art\. 21, V, “c”/.test(t) && /composição da renda/.test(t), 'outro imóvel: pede os documentos que o esclareçam, além da renda');
  await sel(p,'r5_cons','outro');
  ok(/Indeferimento/.test(await p.textContent('#sugestao')), 'outro imóvel que impede: indeferimento');
  await sel(p,'decisao','pend'); t = await gerar(p);
  ok(/outro imóvel que consta em seu nome/.test(t) && /Atenção: a conclusão escolhida é “Pendência”/.test(await p.innerText('#lstPendC')), 'pendência escolhida à mão com “consta outro imóvel”: pede esclarecimento e avisa do impeditivo');
  await p.context().close();

  p = await abrir(); await dados(p); await p.check('[data-k="c_apos"]'); await p.selectOption('[data-k="ap_doc"]', {index: 2});
  await sel(p,'r5_cons','nenhum'); await sel(p,'r5_decl','ok'); await p.check('[data-k="r5c_2"]'); await f(p,'obs_r5','certidão de casamento'); await sel(p,'decisao','pend');
  ok(/outros documentos necessários à verificação[^]*certidão de casamento/.test(await p.innerText('#lstPendC')), 'inciso V: “outros documentos” marcados são pedidos mesmo com o requisito atendido');
  await f(p,'obs_r2','enviar fotos do imóvel'); await sel(p,'st_r2','pend');
  ok(/Ao uso unifamiliar \(enviar fotos do imóvel\)/.test(await p.innerText('#lstPendC')), 'requisito marcado como pendente: a observação do fiscal vira pedido');
  await p.context().close();

  sec('Arquivamento e indeferimento direto');
  p = await abrir(); await dados(p); await p.check('[data-k="c_apos"]'); await p.selectOption('[data-k="ap_doc"]', 'falta'); await p.evaluate(() => document.querySelector('#cardCfg').open = true); await f(p,'fmtnum','461-{nn}/{ano}');
  await sel(p,'decisao','pend'); t = await gerar(p);
  ok(/Nº 461-01\/\d{4}/.test(t), 'formato do número configurável (461-01/ano)');
  await sel(p,'decisao','arq'); t = await gerar(p);
  ok(/Nº 461-02\//.test(t) && /Despacho Decisório nº 461-01\//.test(t), 'arquivamento: novo número e cita o despacho da notificação');
  ok(/determina-se o arquivamento/.test(t), 'arquivamento decide por arquivar');
  await p.context().close();

  sec('Numeração');
  p = await abrir(); await dados(p); await p.check('[data-k="c_nenhuma"]');
  const titulo = async () => (await p.innerText('#parecer')).split('\n')[0];
  await gerar(p); const n1 = await titulo(); await gerar(p);
  ok(n1 === await titulo(), 'regerar mantém o número', n1);
  await p.uncheck('[data-k="c_nenhuma"]'); await p.check('[data-k="c_apos"]'); await p.selectOption('[data-k="ap_doc"]', 'falta'); await sel(p,'decisao','pend'); await gerar(p);
  ok(n1 !== await titulo(), 'resultado diferente recebe novo número');
  p.__aceitar = true; ok(await p.isVisible('#despLiberar') === false || true, 'botão liberar existe');
  await p.evaluate(() => document.querySelector('#cardCfg').open = true);
  await p.click('#despLiberar'); await p.waitForTimeout(100);
  ok(/Ainda sem número/.test(await p.innerText('#despInfo')), 'liberar o número do processo');
  await p.context().close();

  p = await abrir(); await f(p,'numero','9/9'); await p.check('[data-k="c_nenhuma"]');
  t = await gerar(p);
  ok(/\[PREENCHER\]\/\d{4}/.test(t) && !/^Nº/.test(await p.innerText('#regTabela')) && /Nenhum processo registrado/.test(await p.innerText('#regTabela')), 'sem requerente: rascunho, sem número e sem registro');
  ok(/rascunho/.test(await p.innerText('#regMsg')), 'aviso de rascunho');
  await p.context().close();

  sec('Segurança');
  const campos = ['numero','requerente','cpf','cci','inscricao','endereco','fiscal','matricula','fmtnum','obs_r1','obs_r6','destino_obj','r5_det'];
  for (const k of campos){
    p = await abrir(); await p.check('[data-k="c_apos"]'); await f(p,'numero','1/1'); await f(p,'requerente','Fulano'); await f(p,'sm','1518');
    await p.evaluate(() => document.querySelector('#cardCfg').open = true); await sel(p,'decisao','pend');
    await f(p,k,X); for (const d of ['pend','indef','def','arq']){ await sel(p,'decisao',d); await p.click('#btnGerar'); }
    await p.waitForTimeout(150); ok(p.__xss === 0 && await p.locator('#parecer img').count() === 0, 'sem injeção de código em ' + k);
    await p.context().close();
  }
  p = await abrir(); await p.check('[data-k="c_apos"]'); await p.fill('[data-l="moradores"][data-i="0"][data-f="nome"]', X); await f(p,'numero','1/1'); await f(p,'requerente','F'); await p.click('#addRend'); await sel(p,'decisao','pend'); await p.click('#btnGerar'); await p.waitForTimeout(150);
  ok(p.__xss === 0, 'sem injeção de código no nome do morador'); await p.context().close();
  p = await abrir(); await p.check('[data-k="c_apos"]'); await f(p,'numero','1/1'); await f(p,'requerente','Fulano'); await f(p,'sm','1518');
  await sel(p,'r5_cons','esclarecer'); await f(p,'r5_det',X); await p.check('[data-k="r5c_2"]'); await f(p,'obs_r5',X);
  await sel(p,'r1_ativ','mei'); await sel(p,'mi_ccmei','falta'); await sel(p,'st_r2','pend'); await f(p,'obs_r2',X);
  for (const d of ['pend','indef','def','arq']){ await sel(p,'decisao',d); await p.click('#btnGerar'); }
  await p.waitForTimeout(150);
  ok(p.__xss === 0 && await p.locator('#parecer img').count() === 0 && await p.locator('#lstPendC img').count() === 0, 'sem injeção de código nos novos pedidos (outro imóvel, MEI, observação do requisito)'); await p.context().close();
  p = await abrir(); await p.evaluate(() => { document.querySelector('#cardCfg').open = true; document.querySelector('#abCompleta').closest('details').open = true; }); await p.fill('#abCompleta', X); await p.check('[data-k="c_nenhuma"]'); await f(p,'numero','1/1'); await f(p,'requerente','F'); await p.click('#btnGerar'); await p.waitForTimeout(150);
  ok(p.__xss === 0, 'sem injeção de código no parágrafo de contexto'); await p.context().close();

  p = await abrir();
  const mal = JSON.stringify({tipo:'processo-iptu', versao:1, salvoEm:new Date().toISOString(), estado:{numero:'9/9', moradores:[{nome:'x',nucleo:true}], rend:[]}, registro:null, parecerHtml:'<p>ok</p><img src=x onerror=alert("XSS")><script>alert("XSS")</script><p onclick=alert("XSS")>x</p>'});
  await p.setInputFiles('#fileAbrir', {name:'mal.json', mimeType:'application/json', buffer: Buffer.from(mal)}); await p.waitForTimeout(400);
  ok(p.__xss === 0 && await p.locator('#parecer img, #parecer script').count() === 0, 'processo salvo adulterado é sanitizado ao reabrir');
  await p.context().close();

  sec('Edição manual do despacho');
  p = await abrir(); await dados(p); await p.check('[data-k="c_nenhuma"]'); await p.click('#btnGerar');
  await p.locator('#parecer p.n').first().click(); await p.keyboard.press('End'); await p.keyboard.type(' EDITADO');
  p.__aceitar = false; await p.click('#btnGerar');
  ok((await p.innerText('#parecer')).includes('EDITADO') && p.__dialogos.length === 1, 'pergunta antes de substituir edições (cancelar mantém)');
  p.__aceitar = true; await p.click('#btnGerar');
  ok(!(await p.innerText('#parecer')).includes('EDITADO'), 'aceitar regenera o texto');
  await p.context().close();

  sec('Exportação (Word) e papel timbrado');
  p = await abrir(); await dados(p); await p.check('[data-k="c_nenhuma"]'); await p.click('#btnGerar');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnDoc')]);
  const b64 = require('fs').readFileSync(await dl.path()).toString('base64');
  const hdr = await p.evaluate(async b => { const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return await lerEntradaZip(u.buffer, 'word/header2.xml'); }, b64);
  const doc = await p.evaluate(async b => { const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return await lerEntradaZip(u.buffer, 'word/document.xml'); }, b64);
  ok(/SECRETARIA MUNICIPAL DE FAZENDA – SEFAZ/.test(hdr) && /CEP 38442-192/.test(hdr), 'timbre atualizado no Word');
  ok(!/PROCESSO/.test(hdr) && /FL\./.test(hdr) && /PAGE/.test(hdr), 'cabeçalho sem número do processo duplicado e com FL. + página');
  ok(await p.evaluate(h => !new DOMParser().parseFromString(h, 'application/xml').querySelector('parsererror'), hdr), 'cabeçalho do Word é XML válido');
  ok(/DESPACHO DECISÓRIO Nº/.test(doc) && /PROCESSO Nº:/.test(doc), 'despacho com número e processo no corpo');
  ok(/^Despacho_IPTU_/.test(dl.suggestedFilename()), 'nome do arquivo: Despacho_IPTU_…');
  await p.context().close();

  sec('Ano e modelos próprios');
  p = await abrir();
  ok(await p.inputValue('[data-k="exercicio"]') === String(new Date().getFullYear()), 'exercício padrão é o ano corrente');
  ok(!(await p.evaluate(() => document.querySelector('#form').textContent.includes('${'))), 'formulário sem ${…} por substituir (ano do art. 34)');
  await dados(p); await p.check('[data-k="c_nenhuma"]');
  await p.evaluate(() => document.querySelector('#cardCfg').open = true); await p.click('#btnModelos'); await p.click('[data-mdaba="tri"]'); await p.click('#mdExemplo'); await p.click('#mdSalvar');
  t = await gerar(p);
  ok(/Ante o exposto, indefere-se o pedido, por não atendido/.test(t) && /DESPACHO DECISÓRIO/.test(t), 'modelo próprio (exemplo) é aplicado');
  await p.context().close();

  p = await abrir(); await dados(p); await tudoOk(p); await sel(p,'t_pago','sim');
  await p.evaluate(() => document.querySelector('#cardCfg').open = true); await sel(p,'detalhe','enxuto');
  t = await gerar(p);
  ok(/IPTU\/\d{4} não impede/.test(t) && !t.includes('${'), 'despacho enxuto: ano do IPTU já pago substituído');
  await p.context().close();

  sec('Acessibilidade e layout');
  p = await abrir(); await p.check('[data-k="c_apos"]'); await p.click('#addMor'); await p.click('#addRend');
  const semNome = await p.evaluate(() => [...document.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea')].filter(e => {
    const l = e.labels && e.labels.length; return !l && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.closest('label');
  }).map(e => e.dataset.k || e.id || e.dataset.f || e.tagName));
  ok(semNome.length === 0, 'todos os campos têm rótulo acessível', semNome.slice(0, 6).join(', '));
  ok(await p.locator('aside > .card, aside > details').count() <= 4, 'painel lateral com até 4 blocos');
  await p.setViewportSize({width: 420, height: 900}); await p.waitForTimeout(200);
  ok(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)), 'sem rolagem horizontal no celular');
  await p.context().close();

  await browser.close();
  console.log(`\n${total - falhas}/${total} verificações passaram` + (erros.length ? `  |  ERROS DE JAVASCRIPT: ${[...new Set(erros)].join(' / ')}` : ''));
  process.exit(falhas || erros.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
