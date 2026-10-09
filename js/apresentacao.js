// Geração da apresentação do Comitê (modelo "Comitê UVR Indaiatuba").
// Cálculo puro a partir das linhas do banco + montagem do .pptx com PptxGenJS.

// Início do plano de expansão (comparação de prensado antes × depois)
export const PLANO_INICIO = '2026-08-14';
// Quadro previsto quando não há cargos cadastrados no Balanço de Vagas do RH
export const META_COLABORADORES = 13;
export const STATUS_TAREFA = { pendente: 'A iniciar', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' };

const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const nomeMes = ym => MESES[+ym.slice(5) - 1];

// materiais vendidos por UNIDADE (não por peso) não entram no volume — só no faturamento
const UNIDADES_PESO = new Set(['', 'KG', 'TON']);
const pesoVenda = r => UNIDADES_PESO.has((r.unidade || '').trim().toUpperCase()) ? parseFloat(r.peso_kg || 0) : 0;
// Sucata ferrosa não pode ser prensada: fica fora da conta de % prensado × a granel
const semAcento = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const ehSucataFerrosa = r => semAcento(r.materiais?.nome).includes('SUCATA FERROSA');

// ── Datas (fuso local) ──
const pad = n => String(n).padStart(2, '0');
export const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => new Date(s + 'T00:00:00');
export const addDias = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return isoLocal(d); };
export const ddmm = s => { const [, m, d] = s.split('-'); return `${d}/${m}`; };
export const ddmmaaaa = s => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
export const fimDoMes = ym => { const [y, m] = ym.split('-').map(Number); return `${ym}-${pad(new Date(y, m, 0).getDate())}`; };
export const mesDelta = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const ehUtil = s => { const w = parseD(s).getDay(); return w !== 0 && w !== 6; };
function diasUteis(a, b) { let n = 0; for (let d = a; d <= b; d = addDias(d, 1)) if (ehUtil(d)) n++; return n; }

// Semanas úteis do mês (mesma regra do Comercial): nova semana a cada segunda; sáb/dom fora
function semanasDoMes(ym) {
  const fim = fimDoMes(ym); const faixas = []; let atual = null;
  for (let d = `${ym}-01`; d <= fim; d = addDias(d, 1)) {
    const w = parseD(d).getDay();
    if (w === 1 && atual) { faixas.push(atual); atual = null; }
    if (w === 0 || w === 6) continue;
    if (!atual) atual = { ini: d, fim: d, dias: 0 };
    atual.fim = d; atual.dias++;
  }
  if (atual) faixas.push(atual);
  return faixas;
}

// ── Formatação pt-BR ──
export const nf = (v, c = 1) => (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
export const mil = v => `R$ ${nf(v / 1000, 1)} mil`;
export const reais0 = v => `R$ ${nf(v, 0)}`;
export const tn = (kg, c = 2) => `${nf(kg / 1000, c)} t`;
export const pct = (v, c = 1) => v == null || !isFinite(v) ? '—' : `${nf(v, c)}%`;
const varPct = (a, b) => a != null && b > 0 ? (a - b) / b * 100 : null;
const seta = v => v >= 0 ? '▲' : '▼';
const sinal = v => v > 0 ? '+' : '';

// ══════════════════════════════════════════════════════════════════════════
// Cálculo
// rows = { vendas, metas, producao, equipamentos, materiais, colaboradores, cargos, snapshots }
// ══════════════════════════════════════════════════════════════════════════
export function periodoBusca(M) {
  const ano = M.slice(0, 4), iniAnt = `${mesDelta(M, -1)}-01`;
  return { ini: iniAnt < `${ano}-01-01` ? iniAnt : `${ano}-01-01`, iniAnt, iniMes: `${M}-01` };
}

// Nome do material legível em frase: "PLÁSTICO PEAD" → "plástico PEAD"
const SIGLAS = /\b(pead|pebd|pet|pp|ps|pvc|abs|eps|bopp|tnt)\b/g;
export const nomeMat = s => s && s === s.toUpperCase() ? s.toLowerCase().replace(SIGLAS, m => m.toUpperCase()) : (s || '');

// Variação do preço médio de um grupo (ex.: prensado) entre dois períodos, separando:
// - efeito preço: o mesmo material vendido mais caro/barato (só materiais vendidos nos dois períodos)
// - efeito mix: mudou a proporção dos materiais (ex.: só papelão, sem o plástico que vale mais)
function analiseMix(cG, aG, materiais) {
  const lista = G => Object.entries(G.mat || {}).filter(([, x]) => x.vol > 0)
    .map(([nome, x]) => ({ nome, vol: x.vol, fat: x.fat, preco: x.fat / (x.vol / 1000) })).sort((p, q) => q.vol - p.vol);
  const cur = lista(cG), ant = lista(aG);
  if (!cur.length || !ant.length || cG.preco == null || aG.preco == null) return null;
  const antPor = Object.fromEntries(ant.map(x => [x.nome, x]));
  const comuns = cur.filter(x => antPor[x.nome]);
  const fatComuns = comuns.reduce((s, x) => s + x.fat, 0);
  const fatComunsPrecoAnt = comuns.reduce((s, x) => s + x.vol / 1000 * antPor[x.nome].preco, 0);
  const efeitoPreco = fatComunsPrecoAnt > 0 ? (fatComuns / fatComunsPrecoAnt - 1) * 100 : null;
  const varMedia = (cG.preco / aG.preco - 1) * 100;
  // Materiais que no mês anterior valiam mais que a média atual e ainda não saíram neste mês
  const curNomes = new Set(cur.map(x => x.nome));
  const faltam = ant.filter(x => !curNomes.has(x.nome) && x.preco > cG.preco * 1.05).sort((p, q) => q.fat - p.fat);
  const est = {}; materiais.forEach(m => { if (m.nome) est[m.nome] = (est[m.nome] || 0) + parseFloat(m.estoque_kg || 0); });
  const faltamEstoque = faltam.filter(x => est[x.nome] > 0).map(x => ({ ...x, estoqueKg: est[x.nome] }));
  // Queda "por mix": o mesmo material segurou o preço (caiu menos da metade da queda da média) ou não há base comum
  const porMix = varMedia < -2 && (efeitoPreco == null ? faltam.length > 0 : efeitoPreco > varMedia / 2);
  return { cur, ant, antPor, efeitoPreco, varMedia, faltam, faltamEstoque, porMix };
}

export function calcularDados(rows, M, corteIn, hoje) {
  const ini = `${M}-01`, fimMes = fimDoMes(M);
  const corte = corteIn > fimMes ? fimMes : corteIn;
  const ano = M.slice(0, 4);
  const Mant = mesDelta(M, -1), iniAnt = `${Mant}-01`, fimAnt = fimDoMes(Mant);
  const emAndamento = corte < fimMes;
  const { vendas, metas, producao, equipamentos, materiais, colaboradores = [], cargos = [] } = rows;
  // snapshotsTodos inclui registros anteriores ao mês (para herdar o status do dia sem registro)
  const snapshotsTodos = rows.snapshots || [];
  const snapshots = snapshotsTodos.filter(s => s.semana >= ini);

  const metaMes = {}; metas.forEach(m => { metaMes[m.periodo] = parseFloat(m.valor_meta || 0); });

  function agg(a, b) {
    const r = { fat: 0, vol: 0, prensa: { vol: 0, fat: 0 }, granel: { vol: 0, fat: 0 }, sucata: 0, sucataPrensa: 0,
      // Três grupos que somam o volume vendido: prensado e a granel (só materiais prensáveis) + sucata ferrosa (não prensa)
      g: { prensado: { vol: 0, fat: 0, mat: {} }, granel: { vol: 0, fat: 0, mat: {} }, sucata: { vol: 0, fat: 0, mat: {} }, outros: { vol: 0, fat: 0, mat: {} } } };
    vendas.forEach(v => {
      if (v.data < a || v.data > b) return;
      const fat = parseFloat(v.valor_total || 0), vol = pesoVenda(v);
      r.fat += fat; r.vol += vol;
      const k = v.acondicionamento === 'prensa' ? 'prensa' : v.acondicionamento === 'granel' ? 'granel' : null;
      if (k) { r[k].vol += vol; r[k].fat += fat; }
      if (ehSucataFerrosa(v)) { r.sucata += vol; if (k === 'prensa') r.sucataPrensa += vol; }
      const gk = ehSucataFerrosa(v) ? 'sucata' : k === 'prensa' ? 'prensado' : k === 'granel' ? 'granel' : 'outros';
      r.g[gk].vol += vol; r.g[gk].fat += fat;
      const nm = v.materiais?.nome || 'Outros', gm = (r.g[gk].mat[nm] = r.g[gk].mat[nm] || { vol: 0, fat: 0 });
      gm.vol += vol; gm.fat += fat;
    });
    Object.values(r.g).forEach(x => { x.preco = x.vol > 0 ? x.fat / (x.vol / 1000) : null; });
    r.preco = r.vol > 0 ? r.fat / (r.vol / 1000) : null;
    // Composição (% prensado × a granel) sem a sucata ferrosa
    r.volComp = r.vol - r.sucata;
    const prensaveis = r.g.prensado.vol + r.g.granel.vol;
    r.pctPrensado = prensaveis > 0 ? r.g.prensado.vol / prensaveis * 100 : null;
    ['prensa', 'granel'].forEach(k => { r[k].preco = r[k].vol > 0 ? r[k].fat / (r[k].vol / 1000) : null; });
    return r;
  }
  const cur = agg(ini, corte);
  // Comparação "no mesmo ponto": mês anterior até o mesmo dia (mês cheio se o de referência já fechou)
  const diaCorte = +corte.slice(8, 10);
  const fimAntMesmo = emAndamento ? `${Mant}-${pad(Math.min(diaCorte, +fimAnt.slice(8, 10)))}` : fimAnt;
  const antMesmo = agg(iniAnt, fimAntMesmo);
  const antCheio = agg(iniAnt, fimAnt);

  const meta = metaMes[M] || 0;
  const du = diasUteis(ini, fimMes), dp = diasUteis(ini, corte), dr = du - dp;
  const estoqueKg = materiais.reduce((s, m) => s + parseFloat(m.estoque_kg || 0), 0);
  const valorEstoque = materiais.reduce((s, m) => s + parseFloat(m.estoque_kg || 0) * parseFloat(m.valor_unitario || 0), 0);
  const projecao = emAndamento && dp > 0 ? cur.fat / dp * du : cur.fat;

  // Ano até o mês de referência
  const mesesAno = []; for (let i = 1; i <= +M.slice(5); i++) mesesAno.push(`${ano}-${pad(i)}`);
  const fatMes = mesesAno.map(mk => agg(`${mk}-01`, mk === M ? corte : fimDoMes(mk)));
  const fatAno = fatMes.reduce((s, r) => s + r.fat, 0);
  const metaAno = mesesAno.reduce((s, mk) => s + (metaMes[mk] || 0), 0);
  const fechados = mesesAno.filter(mk => mk !== M || !emAndamento);
  let melhor = null;
  fechados.forEach(mk => {
    const mt = metaMes[mk]; if (!(mt > 0)) return;
    const p = fatMes[mesesAno.indexOf(mk)].fat / mt * 100;
    if (!melhor || p > melhor.p) melhor = { mk, p };
  });
  // Acumulado só dos meses fechados (o mês em andamento entraria com faturamento parcial × meta cheia)
  const fatFech = fechados.reduce((s, mk) => s + fatMes[mesesAno.indexOf(mk)].fat, 0);
  const metaFech = fechados.reduce((s, mk) => s + (metaMes[mk] || 0), 0);
  // Início de mês: com menos da metade dos dias úteis, a projeção linear não é confiável (vendas saem em cargas)
  const inicioMes = emAndamento && dp < du / 2;
  const nenhumAtingiu = fechados.every(mk => !(metaMes[mk] > 0) || fatMes[mesesAno.indexOf(mk)].fat < metaMes[mk]);

  const semanas = semanasDoMes(M).filter(s => s.ini <= corte);
  const semFat = semanas.map((s, i) => {
    const fimS = s.fim > corte ? corte : s.fim;
    const r = agg(s.ini, fimS);
    // Semana parcial: meta só dos dias úteis até o corte (senão compara 4 dias com a meta de 5)
    const metaSem = du > 0 ? meta / du * diasUteis(s.ini, fimS) : 0;
    return { i: i + 1, s, parcial: s.fim > corte, fat: r.fat, meta: metaSem, p: metaSem > 0 ? r.fat / metaSem * 100 : null };
  });

  // Prensas
  const prensas = equipamentos.filter(e => (e.nome || '').toLowerCase().includes('prensa') && e.capacidade_kg_mes);
  const idsPrensas = new Set(prensas.map(e => e.id));
  const capNominal = prensas.reduce((s, e) => s + parseFloat(e.capacidade_kg_mes || 0), 0);
  // Disponibilidade diária (mesma regra da tela de Produção): Parado (manutenção) zera a
  // capacidade da prensa no dia; Restrição aplica o % cadastrado. Dia sem registro herda o
  // último status salvo (passado) ou usa o status atual do equipamento (hoje/futuro).
  const snapPorEq = {};
  snapshotsTodos.forEach(s => { if (idsPrensas.has(s.equipamento_id)) (snapPorEq[s.equipamento_id] = snapPorEq[s.equipamento_id] || []).push(s); });
  Object.values(snapPorEq).forEach(l => l.sort((a, b) => a.semana.localeCompare(b.semana)));
  const statusNoDia = (e, dt) => {
    const lista = snapPorEq[e.id] || [];
    const exato = lista.find(s => s.semana === dt);
    if (exato) return exato.status;
    if (dt >= hoje) return e.status || 'operando';
    let ult = null; for (const s of lista) { if (s.semana < dt) ult = s; else break; }
    return ult?.status || 'operando';
  };
  const fatorNoDia = (e, dt) => {
    const st = statusNoDia(e, dt);
    return st === 'parado' ? 0 : st === 'restricao' ? (parseFloat(e.capacidade_pct) || 50) / 100 : 1;
  };
  // Produção das prensas no mês anterior: até o mesmo dia (mês em andamento) e no mês cheio
  const prodEntre = (a, b) => producao.reduce((s, r) => s + (r.data >= a && r.data <= b && idsPrensas.has(r.equipamento_id) ? parseFloat(r.peso_produzido_kg || 0) : 0), 0);
  const prodAntMesmo = prodEntre(iniAnt, fimAntMesmo), prodAntCheio = prodEntre(iniAnt, fimAnt);
  const prodPorDia = {};
  producao.forEach(r => {
    if (r.data < ini || r.data > corte || !idsPrensas.has(r.equipamento_id)) return;
    prodPorDia[r.data] = (prodPorDia[r.data] || 0) + parseFloat(r.peso_produzido_kg || 0);
  });
  // Mesma regra da tela de Produção: sábado/domingo com lançamento também conta como dia útil
  const extras = Object.keys(prodPorDia).filter(dt => !ehUtil(dt));
  const duPrensa = du + extras.length, dpPrensa = dp + extras.filter(dt => dt <= corte).length;
  const metaPorDia = {};
  for (let dt = ini; dt <= fimMes; dt = addDias(dt, 1)) {
    if (!ehUtil(dt) && !extras.includes(dt)) continue;
    metaPorDia[dt] = duPrensa > 0 ? prensas.reduce((s, e) => s + parseFloat(e.capacidade_kg_mes || 0) / duPrensa * fatorNoDia(e, dt), 0) : 0;
  }
  const capMes = Object.values(metaPorDia).reduce((s, v) => s + v, 0);
  const perdaCap = Math.max(0, capNominal - capMes);
  // Prensas que tiveram capacidade reduzida no mês (para citar na apresentação)
  const prensasReduzidas = prensas.map(e => {
    let perda = 0, diasParado = 0, diasRestr = 0;
    Object.keys(metaPorDia).forEach(dt => {
      const f = fatorNoDia(e, dt);
      perda += parseFloat(e.capacidade_kg_mes || 0) / duPrensa * (1 - f);
      if (f === 0) diasParado++; else if (f < 1) diasRestr++;
    });
    return { e, perda, diasParado, diasRestr };
  }).filter(x => x.perda > 0.5);
  const metaDia = duPrensa > 0 ? capMes / duPrensa : 0;
  const metaDiaNominal = duPrensa > 0 ? capNominal / duPrensa : 0;
  const prod = Object.values(prodPorDia).reduce((s, v) => s + v, 0);
  const esperado = Object.entries(metaPorDia).reduce((s, [dt, v]) => s + (dt <= corte ? v : 0), 0);
  const metaRestante = Object.entries(metaPorDia).reduce((s, [dt, v]) => s + (dt > corte && ehUtil(dt) ? v : 0), 0);
  const metaDiaRestante = dr > 0 ? metaRestante / dr : metaDia;
  const semProd = semanas.map((s, i) => {
    const fimSemana = addDias(s.ini, 6 - ((parseD(s.ini).getDay() + 6) % 7)); // domingo da semana
    let p = 0, m = 0;
    for (let dt = s.ini; dt <= fimSemana && dt <= fimMes; dt = addDias(dt, 1)) {
      if (dt > corte) break; // semana parcial: meta só até o corte
      p += prodPorDia[dt] || 0;
      m += metaPorDia[dt] || 0;
    }
    return { i: i + 1, s, parcial: s.fim > corte, prod: p, meta: m, p: m > 0 ? p / m * 100 : null };
  });
  const prensadoMes = fatMes.map(r => r.prensa.vol);
  const mPlano = PLANO_INICIO.slice(0, 7);
  const media = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
  const prensAntes = media(mesesAno.map((mk, i) => mk < mPlano ? prensadoMes[i] : null).filter(v => v != null));
  // Média do plano só com meses fechados (o mês em andamento puxaria a média para baixo)
  const prensDepois = media(mesesAno.map((mk, i) => mk >= mPlano && (mk !== M || !emAndamento) ? prensadoMes[i] : null).filter(v => v != null));
  // Mês em andamento: média antes do plano proporcional aos dias úteis já passados (comparação justa com o parcial)
  const fracMes = emAndamento && du > 0 ? dp / du : 1;
  const prensAntesProp = prensAntes != null ? prensAntes * fracMes : null;

  // Preço do prensado: separa o efeito do mix (quais materiais saíram) do preço do mesmo material
  const mixPrensado = analiseMix(cur.g.prensado, antCheio.g.prensado, materiais);

  // Estoque por grupo (prensado / a granel / sucata ferrosa): vale o acondicionamento informado na tela Estoque;
  // em branco, como o material mais foi vendido no histórico carregado; sem histórico, conta como prensado.
  const acondHist = {};
  vendas.forEach(v => {
    const nm = v.materiais?.nome; if (!nm || !v.acondicionamento) return;
    const h = (acondHist[nm] = acondHist[nm] || { prensa: 0, granel: 0 });
    h[v.acondicionamento] += pesoVenda(v);
  });
  const estoqueGrupo = { prensado: { kg: 0, val: 0 }, granel: { kg: 0, val: 0 }, sucata: { kg: 0, val: 0 } };
  materiais.forEach(m => {
    const kg = parseFloat(m.estoque_kg || 0); if (!(kg > 0)) return;
    const h = acondHist[m.nome];
    const g = semAcento(m.nome).includes('SUCATA FERROSA') ? 'sucata'
      : m.acondicionamento === 'granel' ? 'granel' : m.acondicionamento === 'prensa' ? 'prensado'
        : h && h.granel > h.prensa ? 'granel' : 'prensado';
    estoqueGrupo[g].kg += kg; estoqueGrupo[g].val += kg * parseFloat(m.valor_unitario || 0);
  });

  // Equipamentos: situação atual (mês em andamento) ou último registro diário do mês
  const statusPorEq = {};
  if (!emAndamento && fimMes < hoje && snapshots.length) {
    const ultimo = snapshots.reduce((m, s) => s.semana > m ? s.semana : m, '');
    snapshots.filter(s => s.semana === ultimo).forEach(s => { statusPorEq[s.equipamento_id] = s.status; });
  }
  const eqs = equipamentos.map(e => ({ ...e, st: statusPorEq[e.id] || e.status || 'operando' }))
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '') || (a.frota || '').localeCompare(b.frota || ''));
  const nOp = eqs.filter(e => e.st === 'operando').length, nRes = eqs.filter(e => e.st === 'restricao').length, nPar = eqs.filter(e => e.st === 'parado').length;
  const disp = eqs.length ? (nOp + nRes) / eqs.length * 100 : null;
  const hist = {};
  snapshots.forEach(s => {
    if (s.semana < ini || s.semana > corte) return;
    const h = (hist[s.equipamento_id] = hist[s.equipamento_id] || { t: 0, p: 0 });
    h.t++; if (s.status === 'parado') h.p++;
  });
  const comParada = eqs.filter(e => hist[e.id]?.p > 0).map(e => ({ e, pct: hist[e.id].p / hist[e.id].t * 100, dias: hist[e.id].p }))
    .sort((x, y) => y.pct - x.pct);
  // Disponibilidade média do mês: dias-equipamento não parados ÷ dias-equipamento registrados
  const hs = Object.values(hist), regT = hs.reduce((s, h) => s + h.t, 0), regP = hs.reduce((s, h) => s + h.p, 0);
  const dispMes = regT > 0 ? (regT - regP) / regT * 100 : null;
  // "disp" é a situação atual (mês em andamento) ou a do último registro do mês (mês fechado)
  const rotDisp = emAndamento || fimMes >= hoje ? 'hoje' : 'no fim do mês';

  // Equipe (RH). Mês em andamento: mesmo número do card "Colaboradores" do RH (todos sem demissão,
  // inclusive contratados que ainda vão começar). Mês fechado: quem estava admitido e não desligado no corte.
  const colab = !colaboradores.length ? null
    : emAndamento || fimMes >= hoje
      ? colaboradores.filter(c => !c.demissao).length
      : colaboradores.filter(c => (!c.data_admissao || c.data_admissao <= corte) && (!c.demissao || c.demissao > corte)).length;
  // Quadro previsto e vagas abertas: Balanço de Vagas do RH (por cargo: total de vagas e o que falta preencher)
  const quadro = cargos.reduce((s, c) => s + (c.total_vagas ?? 0), 0) || META_COLABORADORES;
  const vagas = cargos.length
    ? cargos.reduce((s, c) => s + Math.max(0, (c.total_vagas ?? 0) - (c.preenchido ?? 0)), 0)
    : (colab != null ? Math.max(0, quadro - colab) : null);

  return {
    M, ini, fimMes, corte, emAndamento, Mant, fimAntMesmo, cur, antMesmo, antCheio, meta, du, dp, dr,
    estoqueKg, valorEstoque, projecao, inicioMes, fatFech, metaFech, fracMes, prensAntesProp, mixPrensado, estoqueGrupo, mesesAno, fatMes, fatAno, metaAno, metaMes, melhor, nenhumAtingiu, semFat,
    prodAntMesmo, prodAntCheio, prensas, capMes, capNominal, perdaCap, prensasReduzidas, metaDia, metaDiaNominal, metaDiaRestante, duPrensa, dpPrensa, prod, esperado, semProd, prensadoMes, prensAntes, prensDepois,
    eqs, nOp, nRes, nPar, disp, dispMes, rotDisp, comParada, colab, quadro, vagas,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// Frases sugeridas (editáveis na tela). "*x*" = vermelho, "**x**" = verde
// ══════════════════════════════════════════════════════════════════════════
// Capacidade em t: com decimal quando houve redução por manutenção (ex.: 70,9 t), senão inteira (72 t)
const tCap = (d, kg) => nf(kg / 1000, d.perdaCap > 0.5 ? 1 : 0);
// "1,1 t por manutenção (Prensa 111-U005: 1 dia parada)"
export function textoPerdaCap(d) {
  if (!(d.perdaCap > 0.5)) return '';
  const det = d.prensasReduzidas.map(({ e, diasParado, diasRestr }) => {
    const p = [];
    if (diasParado) p.push(`${diasParado} dia${diasParado > 1 ? 's' : ''} em manutenção`);
    if (diasRestr) p.push(`${diasRestr} dia${diasRestr > 1 ? 's' : ''} com restrição`);
    return `${e.frota || e.nome}: ${p.join(', ')}`;
  }).join('; ');
  return `${nf(d.perdaCap / 1000, 1)} t a menos por manutenção/restrição${det ? ` (${det})` : ''}`;
}

// Explicação da variação do preço do prensado pelo mix de materiais (frase e slide)
const juntarE = arr => arr.length > 1 ? `${arr.slice(0, -1).join(', ')} e ${arr[arr.length - 1]}` : (arr[0] || '');
export function frasesMix(d) {
  const mx = d.mixPrensado; if (!mx) return {};
  const ate = d.emAndamento ? `até ${ddmm(d.corte)}` : `em ${nomeMes(d.M)}`;
  const top = mx.cur[0], share = top.vol / mx.cur.reduce((s, x) => s + x.vol, 0) * 100;
  const barato = top.preco < d.antCheio.g.prensado.preco * 0.98 ? ', de menor preço' : '';
  const motivo = mx.cur.length === 1
    ? `${ate} só saiu **${nomeMat(top.nome)}**${barato}`
    : `${ate} o **${nomeMat(top.nome)}** foi ${pct(share, 0)} do prensado vendido${barato}`;
  const e = mx.efeitoPreco;
  const mesmo = e == null ? '' : Math.abs(e) < 3 ? `no mesmo material, preço **estável**`
    : e > 0 ? `no mesmo material, **+${nf(e, 0)}%**` : `no mesmo material, só ${nf(e, 0)}%`;
  // Estoque prensado TOTAL (o mesmo número do card): se vendido, para quanto vai a média do prensado
  const eP = d.estoqueGrupo?.prensado, cP = d.cur.g.prensado;
  const sim = eP?.kg > 0 ? (cP.fat + eP.val) / ((cP.vol + eP.kg) / 1000) : null;
  const lista = mx.faltam.slice(0, 2).map(x => nomeMat(x.nome).replace(/\s*\([^)]*\)/g, '')); // sem o "(Limpa)": a frase cabe em 2 linhas
  const volta = sim != null && sim > cP.preco * 1.02
    ? `vendendo o estoque prensado (${tn(eP.kg, 1)}), a média **sobe para ${reais0(sim)}/t**`
    : lista.length ? `quando sair ${juntarE(lista)}, a média **volta a subir**` : '';
  return { motivo, mesmo, volta };
}

const destaque = (texto, p) => p == null ? texto : p >= 100 ? `**${texto}**` : p < 70 ? `*${texto}*` : texto;

// tarefas (opcional): usadas para dizer se o equipamento com problema já está no plano de ação
export function frasesPadrao(d, tarefas = []) {
  const mes = nomeMes(d.M);
  const atFat = d.meta > 0 ? d.cur.fat / d.meta * 100 : null;
  const atProd = d.capMes > 0 ? d.prod / d.capMes * 100 : null;
  const vVol = varPct(d.cur.vol, d.antMesmo.vol), vPreco = varPct(d.cur.preco, d.antMesmo.preco);
  const quando = d.emAndamento ? `${cap(mes)} até ${ddmm(d.corte)}` : cap(mes);

  // Mês em andamento: compara com o esperado até o corte (proporcional aos dias úteis), não com o mês cheio
  // Início do mês: a cor segue a comparação com o mês anterior no mesmo ponto (mesma regra do card do Resumo)
  const atFatProp = d.inicioMes ? (d.antMesmo.fat > 0 ? d.cur.fat / d.antMesmo.fat * 100 : null)
    : atFat != null && d.emAndamento && d.du > 0 && d.dp > 0 ? atFat / (d.dp / d.du) : atFat;
  const atProdProp = d.emAndamento ? (d.esperado > 0 ? d.prod / d.esperado * 100 : null) : atProd;
  // Resumo: mesma comparação dos selos dos cards (mês anterior no mesmo período; mês fechado: mês inteiro; ±5% = estável)
  const refR = d.emAndamento ? d.antMesmo : d.antCheio;
  const refProdR = d.emAndamento ? d.prodAntMesmo : d.prodAntCheio;
  const vFatR = refR.fat > 0 ? varPct(d.cur.fat, refR.fat) : null;
  const vProdR = refProdR > 0 ? varPct(d.prod, refProdR) : null;
  const tend = v => v == null ? null : v > 5 ? 'acima' : v < -5 ? 'abaixo' : 'estavel';
  const tF = tend(vFatR), tP = tend(vProdR);
  const refTxt = d.emAndamento ? `${nomeMes(d.Mant)} no mesmo período` : nomeMes(d.Mant);
  const marca = (t, txt) => t === 'acima' ? `**${txt}**` : t === 'abaixo' ? `*${txt}*` : txt;
  let corpo;
  if (tF && tF === tP) corpo = `faturamento e prensagem ${marca(tF, tF === 'acima' ? `acima de ${refTxt}` : tF === 'abaixo' ? `abaixo de ${refTxt}` : `estáveis em relação a ${refTxt}`)}`;
  else if (tF && tP) corpo = `faturamento ${marca(tF, tF === 'estavel' ? 'estável' : tF)} e prensagem ${marca(tP, tP === 'estavel' ? 'estável' : tP)} em relação a ${refTxt}`;
  else if (tF) corpo = `faturamento ${marca(tF, tF === 'acima' ? `acima de ${refTxt}` : tF === 'abaixo' ? `abaixo de ${refTxt}` : `estável em relação a ${refTxt}`)}`;
  else corpo = `faturamento em ${atFat == null ? 'meta não cadastrada' : `${nf(atFat, 0)}% da meta`}`;
  const vTicket = varPct(d.cur.preco, refR.preco);
  const resumo = `${quando}: ${corpo}; ticket médio ${vTicket == null ? 'sem comparação' : vTicket > 2 ? 'sobe' : vTicket < -2 ? 'cai' : 'estável'}.`;

  let fat;
  if (d.inicioMes) {
    // Início do mês: poucos dias e vendas em cargas — projetar o fechamento daria um número enganoso
    const am = d.antMesmo.fat, ac = d.antCheio.fat;
    fat = `${cap(mes)} ainda no início: ${mil(d.cur.fat)} faturados até ${ddmm(d.corte)} (${d.dp} de ${d.du} dias úteis), cedo para projetar o fechamento.` +
      (ac > 0 ? ` Em ${nomeMes(d.Mant)}, no mesmo ponto, eram ${mil(am)} — e o mês fechou em **${mil(ac)}**.` : '');
  } else if (d.emAndamento) {
    const pProj = d.meta > 0 ? d.projecao / d.meta * 100 : null;
    const comEst = d.projecao + d.valorEstoque, pEst = d.meta > 0 ? comEst / d.meta * 100 : null;
    fat = `No ritmo atual, ${mes} fecha em **~R$ ${nf(d.projecao / 1000, 0)} mil${pProj != null ? ` (${nf(pProj, 0)}% da meta)` : ''}**` +
      (d.estoqueKg > 0 ? `. Vendendo o estoque de ${tn(d.estoqueKg)}, chega a **~R$ ${nf(comEst / 1000, 0)} mil${pEst != null ? ` (${nf(pEst, 0)}%)` : ''}**.` : '.');
  } else {
    fat = `${cap(mes)} fechou em ${destaque(`${mil(d.cur.fat)}${atFat != null ? ` (${nf(atFat, 0)}% da meta)` : ''}`, atFat)}.`;
  }

  const c = d.cur, a = d.antCheio;
  // Prensado × a granel comparados só entre materiais prensáveis (sem sucata ferrosa)
  const cP = c.g.prensado, cG = c.g.granel, aP = a.g.prensado;
  const ratio = cP.preco && cG.preco ? cP.preco / cG.preco : null;
  const quedaPreco = cP.preco != null && aP.preco != null && cP.preco < aP.preco * 0.98;
  const quedaComp = c.pctPrensado != null && a.pctPrensado != null && c.pctPrensado < a.pctPrensado - 0.5;
  // Frase em linguagem corrida: 1) quanto o prensado vale a mais; 2) participação nas vendas; 3) preço vs mês anterior
  const ant = nomeMes(d.Mant);
  // Curta (cabe em 2 linhas): o detalhe dos preços fica nos cards do slide
  let comp = ratio ? `O prensado vale **${nf(ratio, 1)}×** o mesmo material a granel` : 'Prensado × a granel';
  if (c.pctPrensado != null && a.pctPrensado != null) {
    const subiuComp = c.pctPrensado > a.pctPrensado + 0.5;
    comp += quedaComp
      ? `, mas sua parte nas vendas *caiu de ${pct(a.pctPrensado)} para ${pct(c.pctPrensado)}*`
      : subiuComp
        ? ` e sua parte nas vendas **subiu de ${pct(a.pctPrensado)} para ${pct(c.pctPrensado)}**`
        : ` e sua parte nas vendas ficou estável (${pct(c.pctPrensado)})`;
    if (cP.preco != null && aP.preco != null) {
      const subiuPreco = cP.preco > aP.preco * 1.02;
      comp += quedaPreco ? `; o preço do prensado *caiu* frente a ${ant}.`
        : subiuPreco ? `; o preço do prensado **subiu** frente a ${ant}.`
          : `; preço do prensado estável frente a ${ant}.`;
    } else comp += '.';
  } else comp += '.';
  // Preço do prensado caiu só porque mudou o mix de materiais: explica em vez de alarmar
  if (quedaPreco && d.mixPrensado?.porMix) {
    const fm = frasesMix(d);
    comp = `Prensado em ${reais0(cP.preco)}/t: ${fm.motivo}${fm.mesmo ? ` (${fm.mesmo})` : ''}.${fm.volta ? ` ${cap(fm.volta)}.` : ''}`;
  }

  // 1) produção × capacidade, já citando a prensa que mais parou; 2) prensado vendido do mês × média antes do plano
  // Mês em andamento: produção até o corte × o previsto até o corte (não × a capacidade do mês inteiro)
  let prensa = d.emAndamento
    ? `Até ${ddmm(d.corte)} as prensas produziram ${destaque(`${nf(d.prod / 1000, 1)} t de ${nf(d.esperado / 1000, 1)} t previstas`, atProdProp)} para o período (${pct(atProdProp, 0)})`
    : `As prensas produziram ${destaque(`${nf(d.prod / 1000, 1)} t de ${tCap(d, d.capMes)} t`, atProd)} possíveis em ${mes}`;
  const pior = [...d.prensasReduzidas].sort((x, y) => y.perda - x.perda)[0];
  if (pior && pior.diasParado > 0) {
    prensa += ` — a *${pior.e.nome}${pior.e.frota ? ' ' + pior.e.frota : ''} ficou ${pior.diasParado} dia${pior.diasParado > 1 ? 's' : ''} em manutenção*` +
      (d.prensasReduzidas.length > 1 ? ` (−${nf(d.perdaCap / 1000, 1)} t de capacidade no total).` : ` (−${nf(pior.perda / 1000, 1)} t de capacidade).`);
  } else prensa += d.perdaCap > 0.5 ? ` (−${nf(d.perdaCap / 1000, 1)} t de capacidade por restrição).` : '.';
  const estPrensado = d.emAndamento ? d.estoqueGrupo?.prensado.kg || 0 : 0;
  if (d.emAndamento) {
    // Frase curta: produção × previsto (início do mês sem vermelho) e prensado vendido × antes do plano + estoque a vender
    prensa = `Até ${ddmm(d.corte)}: ${destaque(`${nf(d.prod / 1000, 1)} t produzidas de ${nf(d.esperado / 1000, 1)} t previstas`, d.inicioMes && atProdProp != null ? Math.max(atProdProp, 70) : atProdProp)} (${pct(atProdProp, 0)}).`;
    if (d.prensAntes > 0) {
      const vMes = varPct(c.prensa.vol, d.prensAntesProp);
      prensa += ` Prensado vendido ${Math.abs(vMes) < 5 ? 'em linha com o' : vMes > 0 ? `**${nf(vMes, 0)}% acima** do` : `*${nf(Math.abs(vMes), 0)}% abaixo* do`} ritmo de antes do plano`;
      prensa += estPrensado > 0 ? `, com mais **${nf(estPrensado / 1000, 1)} t prensadas em estoque** para vender.` : '.';
    } else if (estPrensado > 0) prensa += ` Há **${nf(estPrensado / 1000, 1)} t prensadas em estoque** para vender.`;
    if (pior && pior.diasParado > 0) prensa += ` *${pior.e.nome}${pior.e.frota ? ' ' + pior.e.frota : ''}: ${pior.diasParado} dia${pior.diasParado > 1 ? 's' : ''} em manutenção*.`;
  } else if (d.prensAntes > 0) {
    // Mês fechado: compara com a média mensal antes do plano
    const vMes = varPct(c.prensa.vol, d.prensAntesProp);
    const varTxt = Math.abs(vMes) < 5 ? 'em linha com' : vMes > 0 ? `**${nf(vMes, 0)}% acima**` : `*${nf(Math.abs(vMes), 0)}% abaixo*`;
    prensa += d.emAndamento
      ? ` Prensado vendido: ${nf(c.prensa.vol / 1000, 1)} t até ${ddmm(d.corte)}, ${varTxt}${Math.abs(vMes) < 5 ? ' a' : ' da'} média antes do plano no mesmo período (${nf(d.prensAntesProp / 1000, 1)} t em ${d.dp} dias úteis).`
      : ` Prensado vendido: ${nf(c.prensa.vol / 1000, 1)} t, ${varTxt}${Math.abs(vMes) < 5 ? ' a' : ' da'} média antes do plano (${nf(d.prensAntes / 1000, 1)} t/mês).`;
  }

  const nEq = d.eqs.length, nDisp = d.nOp + d.nRes;
  const temParadas = d.dispMes != null && d.dispMes < 99.5 && d.comParada.length;
  let equip = nDisp === nEq
    ? (d.rotDisp === 'hoje' ? `Hoje os ${nEq} equipamentos estão disponíveis` : `No fim do mês, os ${nEq} equipamentos estavam disponíveis`)
    : `*${nDisp} de ${nEq} equipamentos* disponíveis ${d.rotDisp}`;
  // Equipamentos parados ou com restrição agora: cita pelo nome e, se houver tarefa sobre ele, que está no plano de ação
  const problema = d.eqs.filter(e => e.st === 'parado' || e.st === 'restricao');
  if (problema.length) {
    const nomeE = e => `${e.nome}${e.frota ? ' ' + e.frota : ''}`;
    const noPlano = e => tarefas.some(t => t.status !== 'cancelada' && t.status !== 'concluida' &&
      semAcento(t.titulo).includes(semAcento(e.frota || e.nome)));
    const partes = problema.slice(0, 2).map(e => `*${nomeE(e)}* ${e.st === 'parado' ? 'está parada' : 'está com restrição'}${noPlano(e) ? ' (no plano de ação)' : ''}`);
    equip += `${nDisp === nEq ? ', mas' : ':'} ${juntarE(partes)}${problema.length > 2 ? ` e mais ${problema.length - 2}` : ''}`;
  }
  if (temParadas) {
    // Cita os equipamentos que pararam no mês (até 3, do que mais parou ao que menos parou)
    const nomeEq = x => `${x.e.nome}${x.e.frota ? ' ' + x.e.frota : ''}`;
    const lista = d.comParada.slice(0, 3).map((x, k) => `*${nomeEq(x)}* ${k === 0 ? 'parada' : ''}${k === 0 ? ` em ${nf(x.pct, 0)}% dos dias` : `em ${nf(x.pct, 0)}%`}`);
    const resto = d.comParada.length - lista.length;
    const juntar = arr => arr.length > 1 ? `${arr.slice(0, -1).join(', ')} e ${arr[arr.length - 1]}` : arr[0];
    equip += `, mas a média do mês foi ${destaque(pct(d.dispMes, 0), d.dispMes >= 95 ? 100 : 60)} — ${juntar(lista)}${resto > 0 ? ` (e mais ${resto})` : ''}`;
  }
  if (d.colab != null) equip += d.colab < d.quadro
    ? `. Equipe com *${d.colab} de ${d.quadro} colaboradores*.`
    : `. Equipe completa, com **${d.colab} de ${d.quadro} colaboradores**.`;
  else equip += '.';

  return { resumo, fat, comp, prensa, equip, plano: 'Ações em andamento na unidade.' };
}

// ══════════════════════════════════════════════════════════════════════════
// Montagem do PPTX — slide de 1583 × 890,5 pt (mesmo tamanho do modelo)
// img = { capa, pauta, conteudo, obrigado, foto } em "image/jpeg;base64,..."
// ══════════════════════════════════════════════════════════════════════════
const W_PT = 1583, H_PT = 890.5;
const I = v => v / 72; // pt → polegadas
const FONT = 'Montserrat';
const COR = {
  verde: '006636', verdeCl: 'E8F5EE', verdeBarra: 'CFE3D6', verdeParcial: '8FBFA3', lima: '7AC143',
  txt: '0F172A', txt2: '334155', muted: '64748B', cinza: '94A3B8', borda: 'E2E8F0', cinzaBg: 'F8FAFC', trilho: 'EEF2F6',
  verm: 'C8292A', vermBg: 'FDECEC', amb: 'B45309', ambBg: 'FEF3C7', ok: '16803C', okBg: 'DCFCE7', amarelo: 'EAB308',
};

function runs(str, cor = COR.txt2) {
  return String(str).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map(p => {
    if (p.startsWith('**')) return { text: p.slice(2, -2), options: { bold: true, color: COR.verde } };
    if (p.startsWith('*')) return { text: p.slice(1, -1), options: { bold: true, color: COR.verm } };
    return { text: p, options: { color: cor } };
  });
}

export function montarApresentacao(PptxGenJS, d, { img, frases: fr, textos, acoes, dataReuniao, hoje }) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'COMITE_UVR', width: I(W_PT), height: I(H_PT) });
  pptx.layout = 'COMITE_UVR';
  pptx.title = `Comitê UVR Indaiatuba — ${cap(nomeMes(d.M))} ${d.M.slice(0, 4)}`;

  const mes = nomeMes(d.M), ant = nomeMes(d.Mant);
  const txt = (s, x, y, w, h, texto, size, color, o = {}) =>
    s.addText(texto, { x: I(x), y: I(y), w: I(w), h: I(h), fontFace: FONT, fontSize: size, color, margin: 0, valign: 'top', isTextBox: true, ...o });
  const box = (s, x, y, w, h, fill, line = null, raio = 12) =>
    s.addShape(raio ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
      x: I(x), y: I(y), w: I(w), h: I(h), fill: { color: fill },
      line: line ? { color: line, width: 1.25 } : { type: 'none' }, ...(raio ? { rectRadius: I(raio) } : {}),
    });
  const pill = (s, x, y, texto, fg, bg, size = 13) => {
    const w = Math.max(60, texto.length * size * 0.62 + 28), h = size + 14;
    s.addText(texto, { x: I(x), y: I(y), w: I(w), h: I(h), shape: pptx.ShapeType.roundRect, rectRadius: I(h / 2), fill: { color: bg }, line: { type: 'none' },
      fontFace: FONT, fontSize: size, bold: true, color: fg, align: 'center', valign: 'middle', margin: 0 });
  };
  const linha = (s, x1, y, x2, cor, dash = null) =>
    s.addShape(pptx.ShapeType.line, { x: I(x1), y: I(y), w: I(x2 - x1), h: 0, line: { color: cor, width: 1, ...(dash ? { dashType: dash } : {}) } });
  const fundo = (s, data) => s.addImage({ data, x: 0, y: 0, w: I(W_PT), h: I(H_PT) });
  // Roteiro da apresentação (o mesmo da pauta): aparece no rodapé de cada slide, com a etapa atual em destaque
  const ROTEIRO = ['Resumo', 'Faturamento e vendas', 'Prensagem', 'Equipamentos e equipe', 'Plano de ação'];
  function barraRoteiro(s, etapa) {
    const partes = [];
    ROTEIRO.forEach((t, k) => {
      if (k) partes.push({ text: '   ›   ', options: { color: COR.cinza } });
      partes.push({ text: `${k + 1}  ${t}`, options: k === etapa ? { bold: true, color: COR.verde } : { color: k < etapa ? COR.muted : COR.cinza } });
    });
    linha(s, 50, 836, 1330, COR.borda);
    txt(s, 50, 846, 1280, 24, partes, 13, COR.cinza);
  }
  // Mês em andamento: um selo no topo substitui os asteriscos e observações espalhados pelo slide
  function seloParcial(s) {
    if (!d.emAndamento) return;
    const t = `PARCIAL · ATÉ ${ddmm(d.corte)}`, size = 13, w = Math.max(60, t.length * size * 0.62 + 28);
    pill(s, 1330 - w, 46, t, COR.amb, COR.ambBg, size);
  }
  function conteudo(titulo, frase, etapa = null, parcial = false) {
    const s = pptx.addSlide();
    fundo(s, img.conteudo);
    txt(s, 50, 31, 1050, 62, titulo, 50, COR.verde, { bold: true, valign: 'middle' });
    // Frase do topo: diminui a fonte quando o texto é longo, para não invadir o conteúdo (y ≥ 205)
    const n = (frase || '').replace(/\*/g, '').length;
    txt(s, 50, 118, 1290, 80, runs(frase), n > 240 ? 19 : n > 220 ? 21 : n > 200 ? 23 : 25, COR.txt2);
    if (etapa != null) barraRoteiro(s, etapa);
    if (parcial) seloParcial(s);
    return s;
  }
  // Anotações do apresentador: tempo sugerido, mensagem principal, pontos de apoio e a ponte para o próximo slide
  const semMarca = t => String(t || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  const fala = (s, { min, etapa, frase, apoio = [], proximo }) => s.addNotes([
    `⏱ ~${min} min · ${etapa}`,
    '',
    `MENSAGEM: ${semMarca(frase)}`,
    ...(apoio.filter(Boolean).length ? ['', 'PONTOS DE APOIO:', ...apoio.filter(Boolean).map(p => `• ${semMarca(p)}`)] : []),
    ...(proximo ? ['', `PRÓXIMO: ${proximo}`] : []),
  ].join('\n'));
  const corAting = p => p == null ? COR.muted : p >= 100 ? COR.ok : p >= 70 ? COR.amarelo : COR.verm;
  function barras(s, x, y, w, itens, passo = 38, fs = 15) {
    itens.forEach(([rot, v, lab, det], k) => {
      // det (opcional): texto pequeno sob a barra, ex.: "R$ 7,7 mil de R$ 16,1 mil" — a barra fica mais fina
      const yy = y + k * passo, bw = w - 150 - 90, yb = det ? yy + 3 : yy + 5, hb = det ? 14 : 18;
      txt(s, x, yy, 150, 26, rot, fs, COR.txt2);
      box(s, x + 150, yb, bw, hb, COR.trilho, null, 0);
      if (v > 0) box(s, x + 150, yb, Math.max(8, bw * Math.min(v, 100) / 100), hb, corAting(v), null, 0);
      txt(s, x + w - 80, yy, 80, 26, lab, fs, COR.txt, { bold: true, align: 'right' });
      if (det) txt(s, x + 150, yy + 19, bw + 90, 18, det, 12, COR.txt2);
    });
  }
  const atFat = d.meta > 0 ? d.cur.fat / d.meta * 100 : null;
  const atProd = d.capMes > 0 ? d.prod / d.capMes * 100 : null;
  const pEsperadoProd = d.duPrensa > 0 ? d.dpPrensa / d.duPrensa * 100 : 100;
  const abrevMes = MES_ABREV[+d.M.slice(5) - 1];
  const labelsAno = d.mesesAno.map((mk, i) => MES_ABREV[i] + (mk === d.M && d.emAndamento ? '*' : ''));
  const optsGrafico = titulo => ({
    x: I(40), y: I(205), w: I(860), h: I(600), showTitle: true, title: titulo, titleFontSize: 16, titleColor: COR.txt2, titleFontFace: FONT,
    showLegend: true, legendPos: 'b', legendFontSize: 13, legendFontFace: FONT,
    catAxisLabelFontSize: 13, catAxisLabelColor: COR.txt2, catAxisLabelFontFace: FONT,
    valAxisLabelFontSize: 12, valAxisLabelColor: COR.muted, valAxisMinVal: 0,
    valGridLine: { color: COR.trilho, size: 1 }, catGridLine: { style: 'none' }, valAxisLineShow: false,
  });
  const optsBarras = (cores, fmt) => ({ barDir: 'col', chartColors: cores, barGapWidthPct: 60, showValue: true, dataLabelPosition: 'outEnd',
    dataLabelFormatCode: fmt, dataLabelFontSize: 15, dataLabelFontBold: true, dataLabelColor: COR.txt, dataLabelFontFace: FONT });
  const optsLinha = { chartColors: [COR.verm], lineDash: 'dash', lineSize: 2, lineDataSymbol: 'none', showValue: false };

  // ── 1. Capa ──
  fundo(pptx.addSlide(), img.capa);

  // ── 2. Pauta ──
  {
    const s = pptx.addSlide(); fundo(s, img.pauta);
    txt(s, 89, 409, 700, 86, ddmmaaaa(dataReuniao), 70, COR.verde);
    const itens = ['Resumo executivo;', 'Faturamento e composição de vendas;', 'Prensagem;', 'Equipamentos e equipe;', 'Plano de ação.'];
    s.addNotes(`⏱ ~1 min · Pauta\n\nApresentar o roteiro: primeiro como estamos (resumo), depois o porquê (faturamento e vendas, prensagem, equipamentos e equipe) e, por fim, o plano de ação.`);
    txt(s, 89, 573, 700, 230, itens.map((t, k) => ({ text: t, options: { breakLine: k < itens.length - 1 } })), 24.5, COR.verde, { paraSpaceAfter: 4 });
  }

  // ── 3. Resumo executivo ──
  {
    // Quatro indicadores com semáforo (um por etapa do roteiro); o detalhe fica nos slides seguintes
    const s = conteudo('RESUMO EXECUTIVO', fr.resumo, 0, true);
    const c = d.cur;
    // Faturamento e prensagem: tendência vs o mesmo período do mês anterior (±5% = estável).
    // Equipamentos e equipe: situação (OK / Atenção / Crítico).
    const SEM = {
      cresc: ['CRESCENDO', COR.ok, COR.okBg], est: ['ESTÁVEL', COR.muted, COR.trilho], abaixo: ['ABAIXO', COR.verm, COR.vermBg],
      ok: ['OK', COR.ok, COR.okBg], amb: ['ATENÇÃO', COR.amb, COR.ambBg], verm: ['CRÍTICO', COR.verm, COR.vermBg], nd: ['SEM BASE', COR.muted, COR.cinzaBg],
    };
    const tendencia = v => v == null ? 'nd' : v > 5 ? 'cresc' : v < -5 ? 'abaixo' : 'est';
    const ind = [];

    // ctx = linhas [rótulo, valor] abaixo do tracejado. Variação "▲ 12%" pronta para a linha.
    const vTxt = v => v == null ? '' : ` (${seta(v)} ${nf(Math.abs(v), 0)}%)`;
    // Mês em andamento: mês anterior até o mesmo dia; mês fechado: mês anterior inteiro
    const rotRef = d.emAndamento ? `${cap(ant)} no mesmo período` : cap(ant);

    // Faturamento — ticket médio (faturamento ÷ toneladas vendidas) na linha de baixo do valor
    const ref = d.emAndamento ? d.antMesmo : d.antCheio;
    const vFat = ref.fat > 0 ? varPct(c.fat, ref.fat) : null;
    const ticket = c.preco ? ` · ticket médio ${reais0(c.preco)}/t` : '';
    ind.push({ label: 'Faturamento', st: tendencia(vFat),
      valor: mil(c.fat),
      sub: (d.emAndamento ? `${d.meta ? `${pct(atFat, 0)} da meta · ` : ''}${d.dp} de ${d.du} dias úteis` : d.meta ? `${pct(atFat, 0)} da meta de ${mil(d.meta)}` : 'sem meta cadastrada') + ticket,
      ctx: [
        [rotRef, `${mil(ref.fat)}${vTxt(vFat)}${d.emAndamento ? ` · fechou em ${mil(d.antCheio.fat)}` : ''}`],
        !d.inicioMes && d.emAndamento ? ['Projeção no ritmo atual', `${mil(d.projecao)}${d.meta ? ` (${pct(d.projecao / d.meta * 100, 0)} da meta)` : ''}`] : null,
      ].filter(Boolean) });

    // Prensagem — produção das prensas vs o mesmo período do mês anterior
    const atProdRef = d.emAndamento ? (d.esperado > 0 ? d.prod / d.esperado * 100 : null) : atProd;
    const vPl = d.prensAntes > 0 ? varPct(c.prensa.vol, d.prensAntesProp) : null;
    const ritmoP = d.dpPrensa > 0 ? d.prod / d.dpPrensa : 0;
    const refProd = d.emAndamento ? d.prodAntMesmo : d.prodAntCheio;
    const vProd = refProd > 0 ? varPct(d.prod, refProd) : null;
    ind.push({ label: 'Prensagem', st: tendencia(vProd), valor: `${nf(d.prod / 1000, 1)} t produzidas`,
      sub: d.emAndamento ? `${pct(atProdRef, 0)} do previsto até ${ddmm(d.corte)} (${nf(d.esperado / 1000, 1)} t)` : `${pct(atProd, 0)} da capacidade de ${tCap(d, d.capMes)} t`,
      ctx: [
        [rotRef, refProd > 0 ? `${tn(refProd, 1)}${vTxt(vProd)}${d.emAndamento ? ` · fechou em ${tn(d.prodAntCheio, 1)}` : ''}` : 'sem produção registrada'],
        ['Ritmo', `${nf(ritmoP / 1000, 1)} t/dia útil · meta ${nf(d.metaDia / 1000, 1)} t/dia`],
        // Prensado VENDIDO no período × o que se vendia de prensado, em média, antes do plano de expansão (proporcional aos dias)
        d.prensAntes > 0 ? ['Prensado vendido',
          `${tn(c.prensa.vol, 1)} · antes do plano: ${tn(d.emAndamento ? d.prensAntesProp : d.prensAntes, 1)}${d.emAndamento ? ' no período' : '/mês'}${vTxt(vPl)}`]
          : ['Prensado vendido', tn(c.prensa.vol, 1)],
      ] });

    // Equipamentos: situação atual + quem mais parou no mês
    const p0 = d.comParada[0];
    const alvo = d.eqs.find(e => e.st === 'parado') || d.eqs.find(e => e.st === 'restricao');
    const nomeEq = e => `${e.nome || ''}${e.frota ? ' ' + e.frota : ''}`;
    ind.push({ label: 'Equipamentos', st: !d.eqs.length ? 'nd' : d.nPar ? 'verm' : d.nRes || (d.dispMes != null && d.dispMes < 99.5) ? 'amb' : 'ok',
      valor: `${d.nOp + d.nRes} de ${d.eqs.length} disponíveis`,
      sub: `${d.rotDisp}${d.dispMes != null ? ` · média do mês ${pct(d.dispMes, 0)}` : ''}`,
      ctx: [[p0 ? 'Mais parado no mês' : alvo ? 'Atenção' : 'Situação', p0 ? `${nomeEq(p0.e)}: ${nf(p0.pct, 0)}% dos dias` : alvo ? `${nomeEq(alvo)} ${alvo.st === 'parado' ? 'parada' : 'com restrição'}` : 'todos operando no mês']] });

    // Equipe: quadro do RH
    const incompleta = d.colab != null && d.colab < d.quadro;
    ind.push({ label: 'Equipe', st: d.colab == null ? 'nd' : incompleta ? 'amb' : 'ok', valor: d.colab != null ? `${d.colab} de ${d.quadro} colaboradores` : '—',
      sub: d.colab != null ? `${nf(d.colab / d.quadro * 100, 0)}% do quadro previsto` : 'sem colaboradores no RH',
      ctx: [['Vagas', d.vagas ? `${d.vagas} em reposição` : 'sem vagas abertas'], textos.proximos[0] ? ['Próximo passo', textos.proximos[0]] : null].filter(Boolean) });

    const W = 630, H = 298, gx = 20, gy = 20, x0 = 50, y0 = 208;
    ind.forEach((k, i) => {
      const x = x0 + (i % 2) * (W + gx), y = y0 + Math.floor(i / 2) * (H + gy);
      const [rot, fg, bg] = SEM[k.st];
      box(s, x, y, W, H, 'FFFFFF', COR.borda);
      box(s, x, y, 10, H, fg, null, 0); // faixa lateral na cor do semáforo
      txt(s, x + 34, y + 26, 300, 24, k.label.toUpperCase(), 15, COR.muted, { bold: true });
      const wp = Math.max(60, rot.length * 14 * 0.62 + 28);
      pill(s, x + W - 26 - wp, y + 22, rot, fg, bg, 14);
      txt(s, x + 34, y + 60, W - 60, 56, k.valor, 36, COR.txt, { bold: true });
      txt(s, x + 34, y + 120, W - 60, 26, k.sub, 17, COR.txt2);
      linha(s, x + 34, y + 162, x + W - 26, COR.borda, 'dash');
      // Linhas de contexto: rótulo em cinza + valor em negrito
      txt(s, x + 34, y + 174, W - 60, 110, k.ctx.flatMap(([r, v], j) => [
        { text: `${r}: `, options: { color: COR.muted } },
        { text: v, options: { bold: true, color: COR.txt2, breakLine: j < k.ctx.length - 1 } },
      ]), 14, COR.txt2, { paraSpaceAfter: 5 });
    });
    fala(s, { min: 4, etapa: 'Resumo (1 de 5)', frase: fr.resumo,
      apoio: [
        ...ind.map(k => `${k.label} — ${SEM[k.st][0]}: ${k.valor}; ${k.sub}. ${k.ctx.map(([r, v]) => `${r}: ${v}`).join('; ')}.`),
        `Selos de faturamento e prensagem: comparação com ${d.emAndamento ? `${ant} até ${ddmm(d.fimAntMesmo)} (mesmo período)` : `${ant} inteiro`} — Crescendo acima de +5%, Estável entre −5% e +5%, Abaixo de −5%.`,
        d.prensAntes > 0 ? `"Prensado vendido × antes do plano": toneladas de prensado vendidas no período comparadas com a média mensal de prensado vendido antes do plano de expansão (${tn(d.prensAntes, 1)}/mês)${d.emAndamento ? `, proporcional aos ${d.dp} dias úteis já passados` : ''}. Mostra se o plano aumentou a venda de prensado.` : '',
        d.emAndamento ? `Mês em andamento: dados até ${ddmmaaaa(d.corte)}; comparações com ${ant} até ${ddmm(d.fimAntMesmo)} (mesmo ponto do mês).` : '',
      ],
      proximo: 'Agora o porquê de cada número, começando pelo faturamento.' });
  }

  // ── 4. Faturamento ──
  {
    const s = conteudo('FATURAMENTO', fr.fat, 1, true);
    const vals = d.fatMes.map(r => +(r.fat / 1000).toFixed(2));
    const cores = d.mesesAno.map(mk => mk === d.M && d.emAndamento ? COR.verdeParcial : COR.verde);
    const metaLinha = d.mesesAno.map(mk => +(((d.metaMes[mk] ?? d.meta) || 0) / 1000).toFixed(2));
    s.addChart([
      { type: pptx.ChartType.bar, data: [{ name: 'Faturamento (R$ mil)', labels: labelsAno, values: vals }], options: optsBarras(cores, '"R$ "0.0"k"') },
      { type: pptx.ChartType.line, data: [{ name: d.meta ? `Meta (${mil(d.meta)})` : 'Meta', labels: labelsAno, values: metaLinha }], options: optsLinha },
    ], { ...optsGrafico(`Faturamento mensal ${d.M.slice(0, 4)} × meta (R$ mil)`), valAxisLabelFormatCode: '"R$ "0"k"' });

    const px = 940, pw = 390;
    // Início do mês: sem projeção (poucos dias, vendas em cargas). Mostra o mês anterior no mesmo ponto e quanto falta.
    const faltaMeta = Math.max(0, d.meta - d.cur.fat);
    const blocos = d.inicioMes ? [
      [`REALIZADO ATÉ ${ddmm(d.corte)}`, mil(d.cur.fat), `${d.meta ? pct(atFat) + ' da meta · ' : ''}${d.dp} de ${d.du} dias úteis`, COR.txt, 'FFFFFF'],
      [`${ant.toUpperCase()} NO MESMO PONTO`, mil(d.antMesmo.fat), `até ${ddmm(d.fimAntMesmo)} · fechou o mês em ${mil(d.antCheio.fat)}`, COR.txt, 'FFFFFF'],
      // O que falta no mês para a meta; abaixo, quanto falta se o estoque for vendido
      d.meta ? ['FALTA PARA A META', mil(faltaMeta), d.valorEstoque > 0 ? [
        { text: 'vendendo o estoque, ', options: { color: COR.muted } },
        { text: `faltam ${mil(Math.max(0, faltaMeta - d.valorEstoque))}`, options: { bold: true, color: COR.amb } },
      ] : `meta do mês: ${mil(d.meta)}`, COR.amb, COR.ambBg]
        : ['ESTOQUE PRONTO PARA VENDA', mil(d.valorEstoque), tn(d.estoqueKg), COR.verde, COR.verdeCl],
    ] : d.emAndamento ? [
      [`REALIZADO ATÉ ${ddmm(d.corte)}`, mil(d.cur.fat), d.meta ? `${pct(atFat)} da meta` : 'sem meta', COR.txt, 'FFFFFF'],
      ['PROJEÇÃO NO RITMO ATUAL', mil(d.projecao), `${d.meta ? pct(d.projecao / d.meta * 100) + ' · ' : ''}${d.du} dias úteis`, COR.txt, 'FFFFFF'],
      ['PROJEÇÃO + VENDA DO ESTOQUE', mil(d.projecao + d.valorEstoque), `${d.meta ? pct((d.projecao + d.valorEstoque) / d.meta * 100) + ' · ' : ''}estoque de ${mil(d.valorEstoque)}`, COR.verde, COR.verdeCl],
    ] : [
      ['REALIZADO NO MÊS', mil(d.cur.fat), d.meta ? `${pct(atFat)} da meta` : 'sem meta', COR.txt, 'FFFFFF'],
      [`ACUMULADO JAN–${abrevMes.toUpperCase()}`, mil(d.fatAno), d.metaAno ? `${pct(d.fatAno / d.metaAno * 100)} da meta do período` : '', COR.txt, 'FFFFFF'],
      ['MELHOR MÊS DO ANO', d.melhor ? cap(nomeMes(d.melhor.mk)) : '—', d.melhor ? `${pct(d.melhor.p)} da meta` : '', COR.verde, COR.verdeCl],
    ];
    blocos.forEach((b, k) => {
      const y = 205 + k * 132;
      box(s, px, y, pw, 118, b[4], COR.borda);
      txt(s, px + 22, y + 16, pw - 44, 20, b[0], 13, COR.muted, { bold: true });
      txt(s, px + 22, y + 40, pw - 44, 44, b[1], 32, b[3], { bold: true });
      // b[5] = duas linhas embaixo do valor (fonte menor para caber no card)
      if (b[5]) txt(s, px + 22, y + 80, pw - 44, 36, b[2], 13, COR.txt2);
      else txt(s, px + 22, y + 86, pw - 44, 22, b[2], 14, COR.txt2);
    });
    txt(s, px, 607, pw, 22, 'ATINGIMENTO DA META SEMANAL', 13, COR.muted, { bold: true });
    // Sob cada barra: realizado × meta da semana (semana parcial: meta só até o corte) e quanto faltou/sobrou
    const k1 = v => nf(v / 1000, 1);
    const detSem = w => !(w.meta > 0) ? '' : `R$ ${k1(w.fat)} de ${k1(w.meta)} mil` +
      (w.fat < w.meta ? ` · faltam ${k1(w.meta - w.fat)} mil` : ` · ${k1(w.fat - w.meta)} mil acima`);
    barras(s, px, 639, pw, d.semFat.map(w => [`Sem ${w.i} (${+w.s.ini.slice(8)}–${+w.s.fim.slice(8)})${w.parcial ? '*' : ''}`, w.p, w.p == null ? '—' : `${nf(w.p, 0)}%`, detSem(w)]),
      d.semFat.length > 4 ? 39 : 42);
    // Mês em andamento: acumulado só dos meses fechados (faturamento parcial × meta cheia distorce o %)
    const fatAc = d.emAndamento ? d.fatFech : d.fatAno, metaAc = d.emAndamento ? d.metaFech : d.metaAno;
    const pAno = metaAc > 0 ? fatAc / metaAc * 100 : null;
    const ultFech = MES_ABREV[+d.M.slice(5) - (d.emAndamento ? 2 : 1)];
    // Contexto do ano: vai para as anotações (no slide, só o que sustenta a mensagem)
    let ctxAno = ultFech ? `Acumulado jan–${ultFech.toLowerCase()}${d.emAndamento ? ' (meses fechados)' : ''}: ${mil(fatAc)}${pAno != null ? ` = ${pct(pAno)} da meta do período` : ''}` : '';
    if (d.melhor) ctxAno += d.nenhumAtingiu
      ? `; nenhum mês de ${d.M.slice(0, 4)} atingiu a meta (melhor: ${nomeMes(d.melhor.mk)}, ${pct(d.melhor.p)}).`
      : `; melhor mês: ${nomeMes(d.melhor.mk)} (${pct(d.melhor.p)}).`;
    const semAtual = d.semFat[d.semFat.length - 1];
    fala(s, { min: 5, etapa: 'Faturamento e vendas (2 de 5)', frase: fr.fat,
      apoio: [
        `Realizado: ${mil(d.cur.fat)}${d.meta ? ` (${pct(atFat)} da meta de ${mil(d.meta)})` : ''}${d.emAndamento ? ` em ${d.dp} de ${d.du} dias úteis` : ''}.`,
        d.emAndamento ? `${cap(ant)} no mesmo ponto (até ${ddmm(d.fimAntMesmo)}): ${mil(d.antMesmo.fat)}; fechou o mês em ${mil(d.antCheio.fat)}.` : '',
        d.emAndamento && d.meta ? `Falta para a meta: ${mil(Math.max(0, d.meta - d.cur.fat))}; vendendo o estoque (${mil(d.valorEstoque)}, ${tn(d.estoqueKg)}), faltariam ${mil(Math.max(0, d.meta - d.cur.fat - d.valorEstoque))}.` : '',
        semAtual && semAtual.meta > 0 ? `Semana ${semAtual.i}${semAtual.parcial ? ' (em andamento)' : ''}: ${mil(semAtual.fat)} de ${mil(semAtual.meta)} (${pct(semAtual.p, 0)}).` : '',
        d.inicioMes ? `Por que não há projeção: só ${d.dp} de ${d.du} dias úteis e as vendas saem em cargas; a média dos primeiros dias não representa o mês.`
          : d.emAndamento ? `Projeção = faturamento até ${ddmm(d.corte)} ÷ ${d.dp} dias úteis × ${d.du} dias úteis do mês.` : '',
        ctxAno,
      ],
      proximo: `Agora o que vendemos e a que preço — a composição de vendas.` });
  }

  // ── 5. Composição de vendas ──
  {
    const s = conteudo('COMPOSIÇÃO DE VENDAS', fr.comp, 1, true);
    const c = d.cur, a = d.antCheio;
    // Três grupos que somam o volume vendido. Prensado × a granel = só materiais prensáveis;
    // a sucata ferrosa (não prensa) aparece à parte, com volume, preço e valor próprios.
    // Card enxuto: preço do mês (grande), selo com a variação e uma linha com o preço do mês anterior.
    // Volume e faturamento de cada grupo ficam nas barras abaixo e nas anotações.
    // Embaixo: estoque do grupo (t e R$/t) e o ticket médio simulado = (vendido + estoque) ÷ (t vendidas + t em estoque).
    const cw = 410, cgap = 25, ch = 250;
    const cartao = (k, rot, fill, line, corRot, corValor) => {
      const x = 50 + k.i * (cw + cgap), r = c.g[k.g], rA = a.g[k.g];
      box(s, x, 205, cw, ch, fill, line);
      txt(s, x + 24, 225, cw - 170, 20, rot, 13, corRot, { bold: true });
      // 1) Mês atual: preço grande + estoque e simulação logo abaixo (a % da simulação é contra o preço atual)
      if (r.preco) txt(s, x + 24, 250, cw - 48, 56, `${reais0(r.preco)}/t`, 40, corValor, { bold: true });
      else txt(s, x + 24, 260, cw - 48, 40, `sem vendas em ${mes}`, 22, COR.muted, { bold: true });
      const e = d.estoqueGrupo[k.g];
      txt(s, x + 24, 312, cw - 48, 24, [
        { text: 'Estoque: ', options: { color: COR.muted } },
        { text: e.kg > 0 ? `${tn(e.kg, 1)} a ${reais0(e.val / (e.kg / 1000))}/t` : 'sem estoque', options: { bold: true, color: COR.txt2 } },
      ], 15, COR.txt2);
      if (e.kg > 0) {
        const sim = (r.fat + e.val) / ((r.vol + e.kg) / 1000), vs = varPct(sim, r.preco);
        txt(s, x + 24, 338, cw - 48, 26, [
          { text: 'Vendido + estoque: ', options: { color: COR.muted } },
          { text: `${reais0(sim)}/t`, options: { bold: true, color: COR.verde } },
          { text: vs == null || Math.abs(vs) < 1 ? '' : `  ${seta(vs)} ${nf(Math.abs(vs), 0)}% vs atual`, options: { bold: true, color: vs > 0 ? COR.ok : COR.verm, fontSize: 12 } },
        ], 15, COR.txt2);
      }

      // 2) Mês de comparação: separado por uma linha, com a variação do preço ao lado
      linha(s, x + 24, 386, x + cw - 24, COR.borda);
      txt(s, x + 24, 404, cw - 170, 24, [
        { text: `${cap(ant)}: `, options: { color: COR.muted } },
        { text: rA.preco ? `${reais0(rA.preco)}/t` : 'sem vendas', options: { bold: true, color: COR.txt2 } },
      ], 15, COR.txt2);
      const v = varPct(r.preco, rA.preco);
      // Queda do prensado causada só pelo mix de materiais: não pinta de vermelho e diz o motivo
      const porMix = k.g === 'prensado' && v != null && v < -2 && d.mixPrensado?.porMix;
      if (v != null) {
        const [fg, bg] = Math.abs(v) < 2 ? [COR.muted, COR.trilho] : porMix ? [COR.amb, COR.ambBg] : v > 0 ? [COR.ok, COR.okBg] : [COR.verm, COR.vermBg];
        const t = Math.abs(v) < 2 ? 'estável' : `${seta(v)} ${nf(Math.abs(v), 0)}%${porMix ? ' · mix' : ''}`;
        const wp = Math.max(60, t.length * 13 * 0.62 + 28);
        pill(s, x + cw - 24 - wp, 401, t, fg, bg, 13);
      }
    };
    cartao({ i: 0, g: 'prensado' }, 'PRENSADO', COR.verdeCl, null, COR.verde, COR.verde);
    cartao({ i: 1, g: 'granel' }, 'A GRANEL', COR.cinzaBg, COR.borda, COR.muted, COR.txt);
    cartao({ i: 2, g: 'sucata' }, 'SUCATA FERROSA', 'FFFFFF', COR.borda, COR.muted, COR.txt2);

    // Barra = só materiais prensáveis (prensado | a granel), com volume e %; a sucata ferrosa fica à direita
    txt(s, 50, 486, 1280, 22, 'COMPOSIÇÃO DO VOLUME VENDIDO', 14, COR.muted, { bold: true });
    const segs = [['prensado', 'prensado', COR.verde, 'FFFFFF'], ['granel', 'a granel', COR.verdeBarra, COR.txt2]];
    const larg = 960, x0 = 200;
    [[cap(ant), 518, a], [cap(mes), 584, c]].forEach(([rot, y, r]) => {
      const totalVend = Object.values(r.g).reduce((t, x) => t + x.vol, 0);
      const prensaveis = segs.reduce((t, [k]) => t + r.g[k].vol, 0);
      txt(s, 50, y + 2, 145, 24, rot, 16, COR.txt2, { bold: true });
      txt(s, 50, y + 26, 145, 20, `total ${tn(totalVend, 1)}`, 12, COR.muted);
      let x = x0;
      segs.forEach(([k, nome, fill, cor]) => {
        const vol = r.g[k].vol; if (!(vol > 0) || !(prensaveis > 0)) return;
        const w = larg * vol / prensaveis, p = vol / prensaveis * 100;
        const rotSeg = w > 230 ? `${nf(vol / 1000, 1)} t ${nome} · ${pct(p)}` : w > 120 ? `${nf(vol / 1000, 1)} t · ${pct(p, 0)}` : w > 50 ? pct(p, 0) : '';
        s.addText(rotSeg, { x: I(x), y: I(y), w: I(Math.max(w, 1)), h: I(48), fill: { color: fill }, fontFace: FONT, fontSize: 13, bold: k === 'prensado', color: cor, align: 'center', valign: 'middle', margin: 0 });
        x += w;
      });
      // Sucata ferrosa: volume e % do total vendido
      const suc = r.g.sucata.vol;
      txt(s, x0 + larg + 20, y - 2, 160, 30, `${nf(suc / 1000, 1)} t sucata`, 18, COR.txt2, { bold: true });
      txt(s, x0 + larg + 20, y + 26, 160, 22, totalVend > 0 ? `${pct(suc / totalVend * 100)} do total vendido` : '—', 12, COR.muted);
    });
    const dif = (c.preco ?? 0) - (a.preco ?? 0);
    const precoGeral = c.preco && a.preco
      ? `Preço médio geral (todos os materiais): ${reais0(c.preco)}/t em ${mes} — R$ ${nf(Math.abs(dif), 0)}/t ${dif >= 0 ? 'a mais' : 'a menos'} que em ${ant} (${reais0(a.preco)}/t).`
      : `Preço médio geral (todos os materiais): ${c.preco ? reais0(c.preco) + '/t' : '—'} em ${mes}.`;
    // Uma linha, como antes, só com o preço e a variação em destaque (verde quando sobe, vermelho quando cai)
    const vG = varPct(c.preco, a.preco), corG = vG == null || Math.abs(vG) <= 1 ? COR.txt2 : vG > 0 ? COR.verde : COR.verm;
    txt(s, 50, 664, 1280, 30, c.preco && a.preco ? [
      { text: 'Preço médio geral (todos os materiais): ', options: { color: COR.txt2 } },
      { text: `${reais0(c.preco)}/t`, options: { bold: true, color: corG } },
      { text: ` em ${mes} — `, options: { color: COR.txt2 } },
      { text: `R$ ${nf(Math.abs(dif), 0)}/t ${dif >= 0 ? 'a mais' : 'a menos'}`, options: { bold: true, color: corG } },
      { text: ` que em ${ant} (${reais0(a.preco)}/t).`, options: { color: COR.txt2 } },
    ] : precoGeral, 17, COR.txt2);
    const mx = d.mixPrensado;
    const grupo = (nome, k) => `${nome}: ${tn(c.g[k].vol)} · ${mil(c.g[k].fat)} em ${mes} (${ant}: ${tn(a.g[k].vol)} · ${mil(a.g[k].fat)}).`;
    fala(s, { min: 4, etapa: 'Faturamento e vendas (2 de 5)', frase: fr.comp,
      apoio: [
        grupo('Prensado', 'prensado'), grupo('A granel', 'granel'), grupo('Sucata ferrosa (não prensa)', 'sucata'),
        '"Vendido + estoque" simula o ticket médio do grupo se o estoque atual for vendido pelo valor cadastrado: (faturado + valor do estoque) ÷ (t vendidas + t em estoque). O estoque entra no grupo informado em Estoque (Acondicionamento); em branco, no grupo em que o material mais foi vendido.',
        `Prensado: ${c.g.prensado.preco ? `${reais0(c.g.prensado.preco)}/t` : '—'} em ${mes} (${ant}: ${a.g.prensado.preco ? `${reais0(a.g.prensado.preco)}/t` : '—'}).`,
        mx?.porMix && mx.efeitoPreco != null ? `No mesmo material, o preço variou ${sinal(mx.efeitoPreco)}${nf(mx.efeitoPreco, 0)}% — a queda da média é de mix (quais materiais saíram), não de preço.` : '',
        mx?.faltamEstoque.length ? `Em estoque, de maior valor: ${mx.faltamEstoque.map(x => `${nomeMat(x.nome)} (${tn(x.estoqueKg, 1)})`).join(', ')}.` : '',
        c.pctPrensado != null ? `Participação do prensado nos materiais prensáveis: ${pct(c.pctPrensado)} (${ant}: ${pct(a.pctPrensado)}).` : '',
        precoGeral,
        'Barras: só materiais prensáveis (% prensado = prensado ÷ prensado + a granel); a sucata ferrosa fica à direita porque não pode ser prensada.',
      ],
      proximo: 'Do lado da produção: como estão as prensas.' });
  }

  // ── 6. Prensagem ──
  {
    const s = conteudo('PRENSAGEM', fr.prensa, 2, true);
    const mPlano = PLANO_INICIO.slice(0, 7);
    // Estoque prensado (a vender): só faz sentido sobre o mês em andamento (é a foto de hoje)
    const estP = d.emAndamento ? d.estoqueGrupo.prensado.kg : 0;
    const valsT = d.prensadoMes.map(v => +(v / 1000).toFixed(2));
    const iCur = d.mesesAno.indexOf(d.M);
    // Eixo com máximo fixo e área do gráfico fixa: assim dá para desenhar a caixa do estoque exatamente sobre a barra
    const capNomT = +(d.capNominal / 1000).toFixed(2);
    const maxT = Math.max(capNomT, ...valsT, (valsT[iCur] || 0) + estP / 1000);
    const passoEixo = maxT > 120 ? 20 : 10, valMax = Math.ceil((maxT * 1.12) / passoEixo) * passoEixo;
    const G = { x: 40, y: 205, w: 860, h: 600 }, L = { x: 0.06, y: 0.09, w: 0.92, h: 0.74 };
    s.addChart([
      { type: pptx.ChartType.bar, data: [{ name: 'Prensado vendido (t)', labels: labelsAno, values: valsT }],
        options: optsBarras(d.mesesAno.map(mk => mk >= mPlano ? COR.lima : COR.verde), '0.0" t"') },
      { type: pptx.ChartType.line, data: [{ name: `Capacidade ${d.prensas.length} prensas (${nf(d.capNominal / 1000, 0)} t/mês)`, labels: labelsAno, values: d.mesesAno.map(() => capNomT) }], options: optsLinha },
    ], { ...optsGrafico(`Prensado vendido por mês (t) · verde-claro: plano de expansão`), valAxisLabelFormatCode: '0',
      valAxisMaxVal: valMax, valAxisMajorUnit: passoEixo, layout: L });
    if (estP > 0 && iCur >= 0) {
      // Caixa tracejada em cima da barra do mês: o estoque prensado que ainda pode ser vendido
      const px0 = G.x + L.x * G.w, pW = L.w * G.w, py0 = G.y + L.y * G.h, pH = L.h * G.h;
      const catW = pW / d.mesesAno.length, barW = catW / 1.6, bx = px0 + iCur * catW + (catW - barW) / 2;
      const yDe = t => py0 + pH * (1 - t / valMax);
      const vend = valsT[iCur] || 0, total = vend + estP / 1000;
      s.addShape(pptx.ShapeType.rect, { x: I(bx), y: I(yDe(total)), w: I(barW), h: I(yDe(vend) - yDe(total)),
        fill: { color: COR.lima, transparency: 82 }, line: { color: COR.verde, width: 1.5, dashType: 'dash' } });
      txt(s, bx - 60, yDe(total) - 42, barW + 120, 40, [
        { text: `${nf(total, 1)} t`, options: { bold: true, color: COR.verde, breakLine: true } },
        { text: `+${nf(estP / 1000, 1)} t em estoque`, options: { color: COR.txt2, fontSize: 11 } },
      ], 14, COR.txt, { align: 'center' });
    }

    // Coluna da direita: três cards no mesmo formato (rótulo · número grande · uma ou duas linhas)
    const px = 940, pw = 390;
    const cardP = (y, h, rot, valor, linhas, cor = COR.txt, fill = 'FFFFFF', corRot = COR.muted) => {
      box(s, px, y, pw, h, fill, fill === 'FFFFFF' ? COR.borda : null);
      txt(s, px + 22, y + 16, pw - 44, 20, rot, 13, corRot, { bold: true });
      txt(s, px + 22, y + 40, pw - 44, 46, valor, 32, cor, { bold: true });
      txt(s, px + 22, y + 92, pw - 44, h - 100, linhas, 14, COR.txt2, { paraSpaceAfter: 3 });
    };
    // 1) Produção × previsto até o corte (mês fechado: × capacidade do mês), com barra de progresso
    const atEsp = d.esperado > 0 ? d.prod / d.esperado * 100 : null;
    const ritmo = d.dpPrensa > 0 ? d.prod / d.dpPrensa : 0;
    const pProd = d.emAndamento ? atEsp : atProd;
    cardP(205, 300, d.emAndamento ? `PRODUÇÃO ATÉ ${ddmm(d.corte)}` : `PRODUÇÃO EM ${mes.toUpperCase()}`, tn(d.prod, 1), [
      { text: d.emAndamento ? `de ${tn(d.esperado, 1)} previstas · ${pct(atEsp, 0)}` : `de ${tCap(d, d.capMes)} t de capacidade · ${pct(atProd, 0)}`, options: { breakLine: true } },
      { text: `ritmo ${nf(ritmo / 1000, 1)} t/dia · meta ${nf(d.metaDia / 1000, 1)} t/dia`, options: { color: COR.muted } },
    ]);
    box(s, px + 22, 345, pw - 44, 12, COR.trilho, null, 0);
    if (pProd > 0) box(s, px + 22, 345, Math.max(6, (pw - 44) * Math.min(pProd, 100) / 100), 12, corAting(d.inicioMes ? Math.max(pProd, 70) : pProd), null, 0);
    // Por semana: % da meta das prensas e toneladas produzidas × meta (semana parcial: meta só até o corte)
    txt(s, px + 22, 370, pw - 44, 18, 'POR SEMANA', 11, COR.muted, { bold: true });
    const nSem = Math.max(1, d.semProd.length), passoS = Math.min(22, 108 / nSem);
    d.semProd.forEach((w, k) => {
      const y = 392 + k * passoS, xb = px + 114, wb = 96;
      txt(s, px + 22, y, 92, 18, `Sem ${w.i} (${+w.s.ini.slice(8)}–${+w.s.fim.slice(8)})${w.parcial ? '*' : ''}`, 12, COR.txt2);
      box(s, xb, y + 4, wb, 10, COR.trilho, null, 0);
      if (w.p > 0) box(s, xb, y + 4, Math.max(4, wb * Math.min(w.p, 100) / 100), 10, corAting(w.p), null, 0);
      txt(s, xb + wb + 8, y, 42, 18, w.p == null ? '—' : `${nf(w.p, 0)}%`, 12, COR.txt, { bold: true, align: 'right' });
      txt(s, xb + wb + 56, y, pw - (xb - px) - wb - 56 - 22, 18, w.meta > 0 ? `${nf(w.prod / 1000, 1)} de ${nf(w.meta / 1000, 1)} t` : '', 11, COR.muted, { align: 'right' });
    });

    // 2) Ritmo para fechar a meta do mês (mês fechado: resultado)
    const falta = Math.max(0, d.capMes - d.prod);
    let b2;
    if (falta <= 0) b2 = ['META DO MÊS', 'Atingida', `${pct(atProd)} da capacidade`, COR.ok, COR.okBg];
    else if (d.emAndamento && d.dr > 0) {
      const nec = falta / d.dr;
      // Vermelho só quando o ritmo necessário passa bem da meta diária; perto dela é atenção (âmbar)
      const [cT, cB] = nec > d.metaDiaRestante * 1.3 ? [COR.verm, COR.vermBg] : [COR.amb, COR.ambBg];
      b2 = ['PARA FECHAR O MÊS', `${nf(nec / 1000, 1)} t/dia`, `nos ${d.dr} dias úteis restantes · meta ${tCap(d, d.capMes)} t${nec > d.metaDiaRestante * 2 ? ' — inviável' : ''}`, cT, cB];
    } else b2 = ['RESULTADO DO MÊS', `faltaram ${nf(falta / 1000, 1)} t`, `${pct(atProd)} da meta`, COR.verm, COR.vermBg];
    cardP(519, 118, b2[0], b2[1], b2[2], b2[3], b2[4], b2[3]);

    // 3) Prensado vendido × antes do plano, e o estoque prensado que ainda pode sair
    const vPlano = d.prensAntes > 0 ? varPct(d.cur.prensa.vol, d.prensAntesProp) : null;
    cardP(651, 160, d.emAndamento ? `PRENSADO VENDIDO ATÉ ${ddmm(d.corte)}` : `PRENSADO VENDIDO EM ${mes.toUpperCase()}`, [
      { text: tn(d.cur.prensa.vol, 1), options: {} },
      { text: vPlano == null ? '' : `  ${seta(vPlano)} ${nf(Math.abs(vPlano), 0)}%`, options: { color: vPlano >= 0 ? COR.ok : COR.verm, fontSize: 20 } },
    ], [
      { text: d.prensAntes > 0 ? `vs ${tn(d.emAndamento ? d.prensAntesProp : d.prensAntes, 1)} antes do plano${d.emAndamento ? ' no período' : ''}` : 'sem histórico antes do plano', options: { breakLine: true } },
      ...(estP > 0 ? [
        { text: 'Em estoque: ', options: { color: COR.muted } },
        { text: `${tn(estP, 1)} prensadas`, options: { bold: true, color: COR.verde, breakLine: true } },
        { text: 'Se vender: ', options: { color: COR.muted } },
        { text: `${tn(d.cur.prensa.vol + estP, 1)} no mês`, options: { bold: true, color: COR.verde } },
      ] : []),
    ]);
    fala(s, { min: 5, etapa: 'Prensagem (3 de 5)', frase: fr.prensa,
      apoio: [
        d.emAndamento ? `Produção: ${tn(d.prod, 1)} de ${tn(d.esperado, 1)} previstas até ${ddmm(d.corte)} (${pct(atEsp, 0)}); meta do mês: ${tCap(d, d.capMes)} t.`
          : `Produção: ${tn(d.prod, 1)} de ${tCap(d, d.capMes)} t (${pct(atProd, 0)}).`,
        `Ritmo: ${nf(ritmo / 1000, 1)} t/dia útil; meta: ${nf(d.metaDia / 1000, 1)} t/dia.`,
        `${cap(b2[0].toLowerCase())}: ${b2[1]} ${b2[2]}.`,
        d.prensAntes > 0 ? `Prensado vendido: ${tn(d.cur.prensa.vol, 1)}; média antes do plano ${d.emAndamento ? `no mesmo período: ${tn(d.prensAntesProp, 1)}` : `: ${tn(d.prensAntes, 1)}/mês`}${d.prensDepois != null ? `; média desde ${ddmm(PLANO_INICIO)}: ${tn(d.prensDepois, 1)}/mês` : ''}.` : '',
        estP > 0 ? `Estoque prensado a vender: ${tn(estP, 1)} (caixa tracejada no gráfico); vendendo, o mês vai a ${tn(d.cur.prensa.vol + estP, 1)} de prensado vendido.` : '',
        d.semProd.length ? `Atingimento semanal das prensas: ${d.semProd.map(w => `sem ${w.i}${w.parcial ? ' (parcial)' : ''} ${w.p == null ? '—' : pct(w.p, 0)}`).join(' · ')}.` : '',
        d.perdaCap > 0.5 ? `Meta do mês descontada a manutenção: ${textoPerdaCap(d)}.` : '',
        'Atenção: o gráfico é o prensado VENDIDO (Comercial); os dois primeiros cards à direita são a PRODUÇÃO das prensas (Produção).',
      ],
      proximo: 'O que sustenta a produção: equipamentos e equipe.' });
  }

  // ── 7. Equipamentos e equipe ──
  {
    const s = conteudo('EQUIPAMENTOS E EQUIPE', fr.equip, 3, true);
    box(s, 50, 205, 620, 620, 'FFFFFF', COR.borda);
    txt(s, 76, 225, 400, 22, 'EQUIPAMENTOS', 14, COR.muted, { bold: true });
    // Dois números: situação atual (ou do fim do mês) e média do mês pelos dias registrados
    const corDisp = v => v == null ? COR.muted : v >= 99.5 ? COR.ok : v >= 90 ? COR.amb : COR.verm;
    txt(s, 76, 253, 150, 56, pct(d.disp, 0), 40, d.nPar ? COR.verm : COR.ok, { bold: true });
    txt(s, 222, 259, 140, 46, `${d.rotDisp === 'hoje' ? 'hoje' : 'fim do mês'}\n${d.nOp + d.nRes} de ${d.eqs.length} disponíveis`, 13, COR.txt2);
    if (d.dispMes != null) {
      txt(s, 380, 253, 150, 56, pct(d.dispMes, 0), 40, corDisp(d.dispMes), { bold: true });
      txt(s, 526, 259, 140, 46, 'média do mês\ndias registrados', 13, COR.txt2);
    } else txt(s, 380, 263, 280, 46, `${d.nOp} operando · ${d.nRes} com restrição · ${d.nPar} parado${d.nPar === 1 ? '' : 's'}`, 13, COR.txt2);
    const idsParada = new Set(d.comParada.map(x => x.e.id));
    const passo = Math.min(52, 410 / Math.max(1, d.eqs.length)), peq = passo < 40;
    d.eqs.forEach((e, k) => {
      const y = 330 + k * passo;
      linha(s, 76, y - 6, 644, 'F1F5F9');
      txt(s, 76, y, 270, 26, e.nome || '—', peq ? 13 : 16, COR.txt);
      txt(s, 350, y, 130, 26, e.frota || '—', peq ? 12 : 15, COR.muted);
      const rot = e.st === 'parado' ? 'Parado' : e.st === 'restricao' ? 'Restrição' : 'Operando';
      const [fg, bg] = e.st === 'parado' ? [COR.verm, COR.vermBg] : e.st === 'restricao' ? [COR.amb, COR.ambBg] : [COR.ok, COR.okBg];
      pill(s, 490, y - 2, rot + (idsParada.has(e.id) ? '*' : ''), fg, bg, peq ? 11 : 13);
    });
    if (textos.obsEquip) txt(s, 76, 752, 570, 60, (idsParada.size ? '* ' : '') + textos.obsEquip, 13, COR.muted);

    box(s, 700, 205, 630, 620, 'FFFFFF', COR.borda);
    txt(s, 726, 225, 400, 22, 'EQUIPE', 14, COR.muted, { bold: true });
    const incompleta = d.colab != null && d.colab < d.quadro;
    txt(s, 726, 253, 300, 56, d.colab != null ? `${d.colab} / ${d.quadro}` : '—', 44, incompleta ? COR.amb : COR.ok, { bold: true });
    txt(s, 726, 318, 580, 22, d.colab != null ? `colaboradores · ${nf(d.colab / d.quadro * 100, 0)}% do quadro previsto` : 'sem colaboradores no RH', 15, COR.txt2);
    box(s, 726, 350, 578, 16, COR.trilho, null, 0);
    if (d.colab) box(s, 726, 350, 578 * Math.min(1, d.colab / d.quadro), 16, incompleta ? COR.amb : COR.ok, null, 0);
    if (textos.aconteceu.length) {
      txt(s, 726, 394, 580, 22, 'O QUE ACONTECEU', 13, COR.muted, { bold: true });
      txt(s, 726, 424, 578, 170, textos.aconteceu.map((t, k, arr) => ({ text: t, options: { bullet: { type: 'number' }, breakLine: k < arr.length - 1 } })), 16, COR.txt2, { paraSpaceAfter: 6 });
    }
    if (textos.proximos.length) {
      box(s, 726, 600, 578, 150, COR.verdeCl, null);
      txt(s, 748, 616, 540, 22, 'PRÓXIMOS PASSOS', 13, COR.verde, { bold: true });
      txt(s, 748, 644, 540, 100, textos.proximos.join('\n'), 16, COR.txt2);
    }
    fala(s, { min: 5, etapa: 'Equipamentos e equipe (4 de 5)', frase: fr.equip,
      apoio: [
        `Equipamentos: ${d.nOp + d.nRes} de ${d.eqs.length} disponíveis ${d.rotDisp}${d.dispMes != null ? `; média do mês ${pct(d.dispMes, 0)}` : ''}.`,
        ...d.comParada.slice(0, 3).map(x => `${x.e.nome}${x.e.frota ? ' ' + x.e.frota : ''}: parada em ${nf(x.pct, 0)}% dos dias (${x.dias} dia${x.dias > 1 ? 's' : ''}).`),
        textos.obsEquip,
        d.colab != null ? `Equipe: ${d.colab} de ${d.quadro} colaboradores${d.vagas ? `; ${d.vagas} vaga${d.vagas > 1 ? 's' : ''} em reposição` : ''}.` : '',
        ...textos.aconteceu,
        ...textos.proximos.map(t => `Próximo passo: ${t}`),
      ],
      proximo: 'Para fechar: o que estamos fazendo para melhorar estes números.' });
  }

  // ── 8. Plano de ação (tarefas selecionadas) ──
  {
    const s = conteudo('PLANO DE AÇÃO', fr.plano, 4);
    // Coluna "Andamento" só entra quando alguma ação tem o campo preenchido (Tarefas → Andamento)
    const comAnd = acoes.some(t => (t.andamento || '').trim());
    const titulos = comAnd ? ['#', 'Ação', 'Andamento', 'Responsável', 'Prazo', 'Status'] : ['#', 'Ação', 'Responsável', 'Prazo', 'Status'];
    const cab = titulos.map((t, k) =>
      ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: COR.verde }, fontSize: 14, align: k === 0 ? 'center' : 'left' } }));
    const maxAnd = Math.max(0, ...acoes.map(t => (t.andamento || '').trim().length));
    const fsAnd = maxAnd > 160 ? 11 : maxAnd > 100 ? 12 : 13;
    const linhas = acoes.length ? acoes.map((t, k) => {
      const atrasada = t.data_vencimento && t.data_vencimento < hoje && t.status !== 'concluida';
      const st = atrasada ? 'Atrasada' : (STATUS_TAREFA[t.status] || t.status || '—');
      const corSt = st === 'Atrasada' ? COR.verm : st === 'Em andamento' ? COR.amb : st === 'Concluída' ? COR.ok : COR.muted;
      const fill = { color: k % 2 ? COR.cinzaBg : 'FFFFFF' };
      return [
        { text: String(k + 1), options: { bold: true, align: 'center', fill, color: COR.txt } },
        { text: t.titulo || '', options: { fill, color: COR.txt, ...(comAnd ? { fontSize: 14 } : {}) } },
        ...(comAnd ? [{ text: (t.andamento || '').trim() || '—', options: { fill, color: COR.txt2, fontSize: fsAnd } }] : []),
        { text: t.responsavel || 'a definir', options: { italic: true, color: COR.cinza, fill, ...(comAnd ? { fontSize: 13 } : {}) } },
        { text: t.data_vencimento ? ddmmaaaa(t.data_vencimento) : 'a definir', options: { italic: true, color: COR.cinza, fill, ...(comAnd ? { fontSize: 13 } : {}) } },
        { text: st, options: { bold: true, color: corSt, fill, ...(comAnd ? { fontSize: 13 } : {}) } },
      ];
    }) : [[{ text: 'Nenhuma ação selecionada — cadastre as ações no módulo Tarefas.', options: { colspan: 5, italic: true, color: COR.muted } }]];
    const rowH = Math.min(comAnd ? 80 : 70, 560 / Math.max(1, linhas.length));
    s.addTable([cab, ...linhas], {
      x: I(50), y: I(210), w: I(1280), colW: (comAnd ? [50, 400, 440, 140, 115, 135] : [60, 700, 190, 150, 180]).map(I), rowH: [I(48), ...linhas.map(() => I(rowH))],
      fontFace: FONT, fontSize: 16, valign: 'middle', margin: [0, 0.19, 0, 0.19], border: { type: 'none' },
    });
    const nAtr = acoes.filter(t => t.data_vencimento && t.data_vencimento < hoje && t.status !== 'concluida').length;
    const nAnd = acoes.filter(t => t.status === 'em_andamento').length, nOk = acoes.filter(t => t.status === 'concluida').length;
    fala(s, { min: 7, etapa: 'Plano de ação (5 de 5)', frase: fr.plano,
      apoio: [
        `${acoes.length} ações: ${nOk} concluída${nOk === 1 ? '' : 's'}, ${nAnd} em andamento${nAtr ? `, ${nAtr} atrasada${nAtr > 1 ? 's' : ''}` : ''}.`,
        nAtr ? 'Comece pelas atrasadas: o motivo e a nova data.' : '',
        ...acoes.map((t, k) => `${k + 1}. ${t.titulo}${t.responsavel ? ` — ${t.responsavel}` : ''}${t.andamento ? `: ${t.andamento}` : ''}`),
      ],
      proximo: 'Encerramento: abrir para perguntas da diretoria.' });
  }

  // ── 9. Encerramento ──
  {
    const s = pptx.addSlide(); fundo(s, img.obrigado);
    s.addShape(pptx.ShapeType.rect, { x: I(116), y: I(211), w: I(747.3), h: I(452.8), fill: { color: 'FFFFFF' }, line: { type: 'none' } });
    s.addImage({ data: img.foto, x: I(120), y: I(215), w: I(739.3), h: I(444.8), sizing: { type: 'cover', w: I(739.3), h: I(444.8) } });
    txt(s, 120, 679, 739, 30, 'Equipe UVR Indaiatuba', 18, 'FFFFFF', { bold: true, align: 'right' });
  }

  return pptx;
}
