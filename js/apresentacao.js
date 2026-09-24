// Geração da apresentação do Comitê (modelo "Comitê UVR Indaiatuba").
// Cálculo puro a partir das linhas do banco + montagem do .pptx com PptxGenJS.

// Mesmos valores do Plano de Expansão (plano-expansao.html → META)
export const PLANO_INICIO = '2026-08-14';
export const META_COLABORADORES = 13;
export const STATUS_TAREFA = { pendente: 'A iniciar', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' };

const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const nomeMes = ym => MESES[+ym.slice(5) - 1];

// materiais vendidos por UNIDADE (não por peso) não entram no volume — só no faturamento
const UNIDADES_PESO = new Set(['', 'KG', 'TON']);
const pesoVenda = r => UNIDADES_PESO.has((r.unidade || '').trim().toUpperCase()) ? parseFloat(r.peso_kg || 0) : 0;

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
// rows = { vendas, metas, producao, equipamentos, materiais, marcos, config, snapshots }
// ══════════════════════════════════════════════════════════════════════════
export function periodoBusca(M) {
  const ano = M.slice(0, 4), iniAnt = `${mesDelta(M, -1)}-01`;
  return { ini: iniAnt < `${ano}-01-01` ? iniAnt : `${ano}-01-01`, iniMes: `${M}-01` };
}

export function calcularDados(rows, M, corteIn, hoje) {
  const ini = `${M}-01`, fimMes = fimDoMes(M);
  const corte = corteIn > fimMes ? fimMes : corteIn;
  const ano = M.slice(0, 4);
  const Mant = mesDelta(M, -1), iniAnt = `${Mant}-01`, fimAnt = fimDoMes(Mant);
  const emAndamento = corte < fimMes;
  const { vendas, metas, producao, equipamentos, materiais, marcos = [], config = [], snapshots = [] } = rows;

  const metaMes = {}; metas.forEach(m => { metaMes[m.periodo] = parseFloat(m.valor_meta || 0); });

  function agg(a, b) {
    const r = { fat: 0, vol: 0, prensa: { vol: 0, fat: 0 }, granel: { vol: 0, fat: 0 } };
    vendas.forEach(v => {
      if (v.data < a || v.data > b) return;
      const fat = parseFloat(v.valor_total || 0), vol = pesoVenda(v);
      r.fat += fat; r.vol += vol;
      const k = v.acondicionamento === 'prensa' ? 'prensa' : v.acondicionamento === 'granel' ? 'granel' : null;
      if (k) { r[k].vol += vol; r[k].fat += fat; }
    });
    r.preco = r.vol > 0 ? r.fat / (r.vol / 1000) : null;
    r.pctPrensado = r.vol > 0 ? r.prensa.vol / r.vol * 100 : null;
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
  const nenhumAtingiu = fechados.every(mk => !(metaMes[mk] > 0) || fatMes[mesesAno.indexOf(mk)].fat < metaMes[mk]);

  const semanas = semanasDoMes(M).filter(s => s.ini <= corte);
  const semFat = semanas.map((s, i) => {
    const r = agg(s.ini, s.fim > corte ? corte : s.fim);
    const metaSem = du > 0 ? meta / du * s.dias : 0;
    return { i: i + 1, s, parcial: s.fim > corte, p: metaSem > 0 ? r.fat / metaSem * 100 : null };
  });

  // Prensas
  const prensas = equipamentos.filter(e => (e.nome || '').toLowerCase().includes('prensa') && e.capacidade_kg_mes);
  const idsPrensas = new Set(prensas.map(e => e.id));
  const capMes = prensas.reduce((s, e) => s + parseFloat(e.capacidade_kg_mes || 0), 0);
  const prodPorDia = {};
  producao.forEach(r => {
    if (r.data < ini || r.data > corte || !idsPrensas.has(r.equipamento_id)) return;
    prodPorDia[r.data] = (prodPorDia[r.data] || 0) + parseFloat(r.peso_produzido_kg || 0);
  });
  // Mesma regra da tela de Produção: sábado/domingo com lançamento também conta como dia útil
  const extras = Object.keys(prodPorDia).filter(dt => !ehUtil(dt));
  const duPrensa = du + extras.length, dpPrensa = dp + extras.filter(dt => dt <= corte).length;
  const metaDia = duPrensa > 0 ? capMes / duPrensa : 0;
  const prod = Object.values(prodPorDia).reduce((s, v) => s + v, 0);
  const esperado = metaDia * dpPrensa;
  const semProd = semanas.map((s, i) => {
    const fimSemana = addDias(s.ini, 6 - ((parseD(s.ini).getDay() + 6) % 7)); // domingo da semana
    let p = 0, dias = s.dias;
    for (let dt = s.ini; dt <= fimSemana && dt <= fimMes; dt = addDias(dt, 1)) {
      if (dt <= corte) p += prodPorDia[dt] || 0;
      if (!ehUtil(dt) && prodPorDia[dt]) dias++;
    }
    const m = metaDia * dias;
    return { i: i + 1, s, parcial: s.fim > corte, p: m > 0 ? p / m * 100 : null };
  });
  const prensadoMes = fatMes.map(r => r.prensa.vol);
  const mPlano = PLANO_INICIO.slice(0, 7);
  const media = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
  const prensAntes = media(mesesAno.map((mk, i) => mk < mPlano ? prensadoMes[i] : null).filter(v => v != null));
  const prensDepois = media(mesesAno.map((mk, i) => mk >= mPlano ? prensadoMes[i] : null).filter(v => v != null));

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
  const comParada = eqs.filter(e => hist[e.id]?.p > 0).map(e => ({ e, pct: hist[e.id].p / hist[e.id].t * 100 }));

  // Equipe: último registro do Plano de Expansão até a data de corte
  const marco = marcos.filter(m => m.data <= corte).sort((a, b) => a.data.localeCompare(b.data)).pop() || null;
  const colab = marco?.colaboradores_ativos ?? null;
  const vagas = marco?.vagas_abertas ?? (colab != null ? Math.max(0, META_COLABORADORES - colab) : null);
  const proximos = (config[0]?.proximos_passos || '').split(/\s*·\s*|\n/).map(s => s.trim()).filter(Boolean);

  return {
    M, ini, fimMes, corte, emAndamento, Mant, fimAntMesmo, cur, antMesmo, antCheio, meta, du, dp, dr,
    estoqueKg, valorEstoque, projecao, mesesAno, fatMes, fatAno, metaAno, metaMes, melhor, nenhumAtingiu, semFat,
    prensas, capMes, metaDia, duPrensa, dpPrensa, prod, esperado, semProd, prensadoMes, prensAntes, prensDepois,
    eqs, nOp, nRes, nPar, disp, comParada, colab, vagas, proximos,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// Frases sugeridas (editáveis na tela). "*x*" = vermelho, "**x**" = verde
// ══════════════════════════════════════════════════════════════════════════
const destaque = (texto, p) => p == null ? texto : p >= 100 ? `**${texto}**` : p < 70 ? `*${texto}*` : texto;

export function frasesPadrao(d) {
  const mes = nomeMes(d.M);
  const atFat = d.meta > 0 ? d.cur.fat / d.meta * 100 : null;
  const atProd = d.capMes > 0 ? d.prod / d.capMes * 100 : null;
  const vVol = varPct(d.cur.vol, d.antMesmo.vol), vPreco = varPct(d.cur.preco, d.antMesmo.preco);
  const quando = d.emAndamento ? `${cap(mes)} até ${ddmm(d.corte)}` : cap(mes);

  const resumo = `${quando}: faturamento em ${atFat == null ? 'meta não cadastrada' : destaque(`${nf(atFat, 0)}% da meta`, atFat)} e prensas em ${destaque(`${nf(atProd, 0)}% da capacidade`, atProd)} — volume vendido ${vVol == null ? 'sem comparação' : vVol >= 0 ? 'cresce' : 'cai'}, preço médio ${vPreco == null ? 'sem comparação' : vPreco >= 0 ? 'sobe' : 'cai'}.`;

  let fat;
  if (d.emAndamento) {
    const pProj = d.meta > 0 ? d.projecao / d.meta * 100 : null;
    const comEst = d.projecao + d.valorEstoque, pEst = d.meta > 0 ? comEst / d.meta * 100 : null;
    fat = `No ritmo atual, ${mes} fecha em **~R$ ${nf(d.projecao / 1000, 0)} mil${pProj != null ? ` (${nf(pProj, 0)}% da meta)` : ''}**` +
      (d.estoqueKg > 0 ? `. Vendendo o estoque de ${tn(d.estoqueKg)}, chega a **~R$ ${nf(comEst / 1000, 0)} mil${pEst != null ? ` (${nf(pEst, 0)}%)` : ''}**.` : '.');
  } else {
    fat = `${cap(mes)} fechou em ${destaque(`${mil(d.cur.fat)}${atFat != null ? ` (${nf(atFat, 0)}% da meta)` : ''}`, atFat)}.`;
  }

  const c = d.cur, a = d.antCheio;
  const ratio = c.prensa.preco && c.granel.preco ? c.prensa.preco / c.granel.preco : null;
  const quedaPreco = c.prensa.preco != null && a.prensa.preco != null && c.prensa.preco < a.prensa.preco * 0.98;
  const quedaComp = c.pctPrensado != null && a.pctPrensado != null && c.pctPrensado < a.pctPrensado - 0.5;
  const txtPreco = `(${a.prensa.preco ? reais0(a.prensa.preco) : '—'} → ${c.prensa.preco ? reais0(c.prensa.preco) : '—'}/t)`;
  const txtComp = `(${pct(a.pctPrensado)} → ${pct(c.pctPrensado)})`;
  let comp = ratio ? `A tonelada prensada vale **${nf(ratio, 1)}×** a granel` : 'Prensado × a granel';
  if (quedaPreco && quedaComp) comp += `, mas o prensado *caiu no preço* ${txtPreco} e *na composição de vendas* ${txtComp}.`;
  else if (quedaPreco) comp += `, mas o prensado *caiu no preço* ${txtPreco}; participação nas vendas ${txtComp}.`;
  else if (quedaComp) comp += `, mas o prensado *caiu na composição de vendas* ${txtComp}; preço ${txtPreco}.`;
  else comp += ` — prensado: preço ${txtPreco} e participação nas vendas ${txtComp}.`;

  let prensa = `As prensas produziram ${destaque(`${nf(d.prod / 1000, 1)} t de ${nf(d.capMes / 1000, 0)} t`, atProd)} em ${mes}.`;
  if (d.prensAntes != null && d.prensDepois != null) {
    prensa += d.prensDepois < d.prensAntes
      ? ' Desde o início do plano, o prensado vendido está *abaixo da média anterior*.'
      : ' Desde o início do plano, o prensado vendido está **acima da média anterior**.';
  }

  const nEq = d.eqs.length, nDisp = d.nOp + d.nRes;
  let equip = nDisp === nEq ? `Os ${nEq} equipamentos estão disponíveis` : `*${nDisp} de ${nEq} equipamentos* disponíveis`;
  if (d.colab != null) equip += d.colab < META_COLABORADORES
    ? `; o ponto de atenção é a equipe, com *${d.colab} de ${META_COLABORADORES} colaboradores*.`
    : `; equipe completa, com **${d.colab} de ${META_COLABORADORES} colaboradores**.`;
  else equip += '.';

  return { resumo, fat, comp, prensa, equip, plano: 'Ações para recuperar faturamento e prensagem.' };
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
  const nota = (s, t) => txt(s, 50, 842, 1290, 26, t, 13, COR.muted);
  function conteudo(titulo, frase) {
    const s = pptx.addSlide();
    fundo(s, img.conteudo);
    txt(s, 50, 31, 1250, 62, titulo, 50, COR.verde, { bold: true, valign: 'middle' });
    txt(s, 50, 122, 1290, 70, runs(frase), 25, COR.txt2);
    return s;
  }
  const corAting = p => p == null ? COR.muted : p >= 100 ? COR.ok : p >= 70 ? COR.amarelo : COR.verm;
  function barras(s, x, y, w, itens, passo = 38, fs = 15) {
    itens.forEach(([rot, v, lab], k) => {
      const yy = y + k * passo, bw = w - 150 - 90;
      txt(s, x, yy, 150, 26, rot, fs, COR.txt2);
      box(s, x + 150, yy + 5, bw, 18, COR.trilho, null, 0);
      if (v > 0) box(s, x + 150, yy + 5, Math.max(8, bw * Math.min(v, 100) / 100), 18, corAting(v), null, 0);
      txt(s, x + w - 80, yy, 80, 26, lab, fs, COR.txt, { bold: true, align: 'right' });
    });
  }
  function card(s, x, y, w, h, c) {
    box(s, x, y, w, h, 'FFFFFF', COR.borda);
    txt(s, x + 24, y + 24, w - 48, 24, c.label.toUpperCase(), 14, COR.muted, { bold: true });
    if (c.pill) pill(s, x + 24, y + 58, c.pill, c.pillFg, c.pillBg);
    txt(s, x + 24, y + 98, w - 48, 64, c.valor, 40, COR.txt, { bold: true });
    txt(s, x + 24, y + 170, w - 48, 56, c.sub, 15, COR.txt2);
    linha(s, x + 24, y + h - 76, x + w - 24, COR.borda, 'dash');
    txt(s, x + 24, y + h - 62, w - 48, 50, [
      { text: c.cmp1 || '', options: { bold: true, color: c.cmpCor || COR.muted, breakLine: true } },
      { text: c.cmp2 || '', options: { color: COR.muted } },
    ], 14, COR.muted);
  }
  const pillSit = (p, esperado = 100) => p == null ? [COR.muted, COR.cinzaBg]
    : p >= esperado ? [COR.ok, COR.okBg] : p >= esperado * 0.7 ? [COR.amb, COR.ambBg] : [COR.verm, COR.vermBg];

  const atFat = d.meta > 0 ? d.cur.fat / d.meta * 100 : null;
  const atProd = d.capMes > 0 ? d.prod / d.capMes * 100 : null;
  const pEsperadoProd = d.duPrensa > 0 ? d.dpPrensa / d.duPrensa * 100 : 100;
  const refCmp = d.emAndamento ? 'no mesmo ponto' : 'mês fechado';
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
    txt(s, 89, 573, 700, 230, itens.map((t, k) => ({ text: t, options: { breakLine: k < itens.length - 1 } })), 24.5, COR.verde, { paraSpaceAfter: 4 });
  }

  // ── 3. Resumo executivo ──
  {
    const s = conteudo('RESUMO EXECUTIVO', fr.resumo);
    const c = d.cur, a = d.antMesmo;
    const cmp = (v, fmtAnt) => v == null ? { cmp1: `sem base em ${ant}`, cmp2: '' } :
      { cmp1: `${seta(v)} ${sinal(v)}${nf(v, 1)}% vs ${ant}`, cmp2: `${refCmp}: ${fmtAnt}`, cmpCor: v >= 0 ? COR.ok : COR.verm };
    const tend = (v, sobe, cai) => v == null ? {} : v >= 0 ? { pill: sobe, pillFg: COR.ok, pillBg: COR.okBg } : { pill: cai, pillFg: COR.verm, pillBg: COR.vermBg };
    const cards = [];
    const [fF, fB] = pillSit(atFat);
    cards.push({ label: 'Faturamento', valor: mil(c.fat), sub: d.meta ? `${pct(atFat)} da meta de ${mil(d.meta)}` : 'sem meta cadastrada',
      pill: d.meta ? `${nf(atFat, 0)}% da meta` : null, pillFg: fF, pillBg: fB, ...cmp(varPct(c.fat, a.fat), mil(a.fat)) });
    if (d.emAndamento) {
      const pot = c.fat + d.valorEstoque, pPot = d.meta > 0 ? pot / d.meta * 100 : null; const [f, b] = pillSit(pPot);
      cards.push({ label: 'Potencial com estoque', valor: mil(pot), sub: `faturado + ${tn(d.estoqueKg)} em estoque (${mil(d.valorEstoque)})`,
        pill: d.meta ? `${nf(pPot, 0)}% da meta` : null, pillFg: f, pillBg: b, cmp1: d.meta ? `${pct(pPot)} da meta` : '', cmp2: 'se o estoque for vendido', cmpCor: f });
    } else {
      const pAno = d.metaAno > 0 ? d.fatAno / d.metaAno * 100 : null; const [f, b] = pillSit(pAno);
      cards.push({ label: 'Acumulado no ano', valor: mil(d.fatAno), sub: d.metaAno ? `${pct(pAno)} da meta de jan–${abrevMes.toLowerCase()}` : 'sem meta cadastrada',
        pill: d.metaAno ? `${nf(pAno, 0)}% da meta` : null, pillFg: f, pillBg: b, cmp1: d.metaAno ? `meta do período: ${mil(d.metaAno)}` : '', cmpCor: COR.muted });
    }
    const vVol = varPct(c.vol, a.vol), vPreco = varPct(c.preco, a.preco);
    cards.push({ label: 'Volume vendido', valor: tn(c.vol), sub: 'materiais vendidos por peso', ...tend(vVol, 'crescendo', 'em queda'), ...cmp(vVol, tn(a.vol)) });
    cards.push({ label: 'Preço médio', valor: c.preco ? `${reais0(c.preco)}/t` : '—', sub: 'faturamento ÷ toneladas vendidas', ...tend(vPreco, 'subindo', 'em queda'),
      ...cmp(vPreco, a.preco ? `${reais0(a.preco)}/t` : '—') });
    const pAntC = d.antCheio.pctPrensado;
    const compCaiu = c.pctPrensado != null && pAntC != null && c.pctPrensado < pAntC;
    cards.push({ label: 'Prensado vendido', valor: tn(c.prensa.vol), sub: `${pct(c.pctPrensado)} do volume vendido (${ant.slice(0, 3)}: ${pct(pAntC)})`,
      pill: c.pctPrensado == null || pAntC == null ? null : compCaiu ? 'composição caiu' : 'composição subiu',
      pillFg: compCaiu ? COR.amb : COR.ok, pillBg: compCaiu ? COR.ambBg : COR.okBg, ...cmp(varPct(c.prensa.vol, a.prensa.vol), tn(a.prensa.vol)) });
    const [pF, pB] = pillSit(atProd, pEsperadoProd);
    const falta = Math.max(0, d.capMes - d.prod);
    cards.push({ label: 'Produção das prensas', valor: tn(d.prod), sub: `${pct(atProd)} da meta de ${tn(d.capMes, 0)} (${d.prensas.length} prensas)`,
      pill: atProd != null ? `${nf(atProd, 0)}% da meta` : null, pillFg: pF, pillBg: pB,
      cmp1: falta > 0 ? `faltam ${tn(falta)}` : 'meta atingida', cmp2: d.emAndamento ? `em ${d.dr} dias úteis` : 'mês fechado', cmpCor: falta > 0 ? COR.verm : COR.ok });
    const alvo = d.eqs.find(e => e.st === 'parado') || d.eqs.find(e => e.st === 'restricao');
    cards.push({ label: 'Disponibilidade', valor: pct(d.disp, 0), sub: `${d.nOp + d.nRes} de ${d.eqs.length} equipamentos · ${d.nRes} operando com restrição`,
      pill: d.nPar ? `${d.nPar} parado${d.nPar > 1 ? 's' : ''}` : 'disponível', pillFg: d.nPar ? COR.verm : COR.ok, pillBg: d.nPar ? COR.vermBg : COR.okBg,
      cmp1: alvo ? `${(alvo.nome || '').split(' ')[0]} ${alvo.frota || ''}`.trim() : 'todos operando', cmp2: alvo ? (alvo.st === 'parado' ? 'parado' : 'com restrição') : '',
      cmpCor: alvo ? (alvo.st === 'parado' ? COR.verm : COR.amb) : COR.ok });
    const incompleta = d.colab != null && d.colab < META_COLABORADORES;
    cards.push({ label: 'Equipe', valor: d.colab != null ? `${d.colab} / ${META_COLABORADORES}` : '—',
      sub: d.colab != null ? `${nf(d.colab / META_COLABORADORES * 100, 0)}% do quadro previsto` : 'sem registro no Plano de Expansão',
      pill: d.colab == null ? null : incompleta ? 'incompleta' : 'completa', pillFg: incompleta ? COR.amb : COR.ok, pillBg: incompleta ? COR.ambBg : COR.okBg,
      cmp1: d.vagas ? `${d.vagas} vaga${d.vagas > 1 ? 's' : ''} em reposição` : 'sem vagas abertas', cmp2: textos.proximos[0] || '', cmpCor: d.vagas ? COR.amb : COR.ok });
    const W = 302, H = 300, g = 24, x0 = 50, y1 = 198, y2 = y1 + H + 18;
    cards.forEach((c2, k) => card(s, x0 + (k % 4) * (W + g), k < 4 ? y1 : y2, W, H, c2));
    nota(s, d.emAndamento
      ? `Comparações com ${ant} até ${ddmm(d.fimAntMesmo)} (mesmo ponto do mês). Dados até ${ddmmaaaa(d.corte)}.`
      : `Comparações com ${ant} (mês fechado).`);
  }

  // ── 4. Faturamento ──
  {
    const s = conteudo('FATURAMENTO', fr.fat);
    const vals = d.fatMes.map(r => +(r.fat / 1000).toFixed(2));
    const cores = d.mesesAno.map(mk => mk === d.M && d.emAndamento ? COR.verdeParcial : COR.verde);
    const metaLinha = d.mesesAno.map(mk => +(((d.metaMes[mk] ?? d.meta) || 0) / 1000).toFixed(2));
    s.addChart([
      { type: pptx.ChartType.bar, data: [{ name: 'Faturamento (R$ mil)', labels: labelsAno, values: vals }], options: optsBarras(cores, '"R$ "0.0"k"') },
      { type: pptx.ChartType.line, data: [{ name: d.meta ? `Meta (${mil(d.meta)})` : 'Meta', labels: labelsAno, values: metaLinha }], options: optsLinha },
    ], { ...optsGrafico(`Faturamento mensal ${d.M.slice(0, 4)} × meta (R$ mil)`), valAxisLabelFormatCode: '"R$ "0"k"' });

    const px = 940, pw = 390;
    const blocos = d.emAndamento ? [
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
      txt(s, px + 22, y + 86, pw - 44, 22, b[2], 14, COR.txt2);
    });
    txt(s, px, 607, pw, 22, 'ATINGIMENTO DA META SEMANAL', 13, COR.muted, { bold: true });
    barras(s, px, 639, pw, d.semFat.map(w => [`Sem ${w.i} (${+w.s.ini.slice(8)}–${+w.s.fim.slice(8)})${w.parcial ? '*' : ''}`, w.p, w.p == null ? '—' : `${nf(w.p, 0)}%`]),
      d.semFat.length > 4 ? 36 : 38);
    const pAno = d.metaAno > 0 ? d.fatAno / d.metaAno * 100 : null;
    let rod = d.emAndamento ? `* ${cap(mes)} e semana atual parciais (até ${ddmm(d.corte)}). ` : '';
    rod += `Acumulado jan–${abrevMes.toLowerCase()}: ${mil(d.fatAno)}${pAno != null ? ` = ${pct(pAno)} da meta do período` : ''}`;
    if (d.melhor) rod += d.nenhumAtingiu
      ? `; nenhum mês de ${d.M.slice(0, 4)} atingiu a meta (melhor: ${nomeMes(d.melhor.mk)}, ${pct(d.melhor.p)}).`
      : `; melhor mês: ${nomeMes(d.melhor.mk)} (${pct(d.melhor.p)}).`;
    else rod += '.';
    nota(s, rod);
    if (d.emAndamento) s.addNotes(`Projeção = faturamento até ${ddmm(d.corte)} ÷ ${d.dp} dias úteis × ${d.du} dias úteis do mês.`);
  }

  // ── 5. Composição de vendas ──
  {
    const s = conteudo('COMPOSIÇÃO DE VENDAS', fr.comp);
    const c = d.cur, a = d.antCheio, bw = 615, gx = 50 + bw + 45;
    const bloco = (x, fill, line, rot, corRot, r, rAnt, corValor) => {
      box(s, x, 210, bw, 250, fill, line);
      txt(s, x + 30, 236, bw - 60, 22, rot, 14, corRot, { bold: true });
      txt(s, x + 30, 268, bw - 60, 70, r.preco ? `${reais0(r.preco)}/t` : '—', 50, corValor, { bold: true });
      txt(s, x + 30, 350, bw - 60, 80, `${mes} (${ant}: ${rAnt.preco ? reais0(rAnt.preco) + '/t' : '—'})\n${tn(r.vol)} · ${mil(r.fat)}`, 16, COR.txt2);
    };
    bloco(50, COR.verdeCl, null, 'PRENSADO · PREÇO MÉDIO', COR.verde, c.prensa, a.prensa, COR.verde);
    bloco(gx, COR.cinzaBg, COR.borda, 'A GRANEL · PREÇO MÉDIO', COR.muted, c.granel, a.granel, COR.txt);

    txt(s, 50, 500, 1280, 24, 'PARTICIPAÇÃO NO VOLUME VENDIDO', 14, COR.muted, { bold: true });
    [[cap(ant), 534, a], [cap(mes) + (d.emAndamento ? '*' : ''), 604, c]].forEach(([rot, y, r]) => {
      txt(s, 50, y + 10, 135, 28, rot, 17, COR.txt2, { bold: true });
      const p = r.vol > 0 ? r.prensa.vol / r.vol : 0, larg = 1140, wp = Math.min(larg - 1, Math.max(larg * p, 1));
      s.addText(`${pct(p * 100)} prensado`, { x: I(190), y: I(y), w: I(wp), h: I(48), fill: { color: COR.verde }, fontFace: FONT, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
      s.addText(`${pct((1 - p) * 100)} a granel · total ${tn(r.vol)}`, { x: I(190 + wp), y: I(y), w: I(larg - wp), h: I(48), fill: { color: COR.verdeBarra }, fontFace: FONT, fontSize: 14, color: COR.txt2, align: 'center', valign: 'middle', margin: 0 });
    });
    const dif = (c.preco ?? 0) - (a.preco ?? 0);
    txt(s, 50, 680, 1280, 50, `Preço médio geral: ${a.preco ? reais0(a.preco) + '/t' : '—'} em ${ant} → ${c.preco ? reais0(c.preco) + '/t' : '—'} em ${mes} (${dif >= 0 ? '+' : '-'}R$ ${nf(Math.abs(dif), 0)}/t).`, 17, COR.txt2);
    if (d.emAndamento) txt(s, 50, 740, 1290, 30, `* Obs.: ${mes} parcial — dados até ${ddmmaaaa(d.corte)}, mês ainda não fechado.`, 17, COR.muted, { italic: true });
  }

  // ── 6. Prensagem ──
  {
    const s = conteudo('PRENSAGEM', fr.prensa);
    const mPlano = PLANO_INICIO.slice(0, 7);
    const capT = +(d.capMes / 1000).toFixed(2);
    s.addChart([
      { type: pptx.ChartType.bar, data: [{ name: 'Prensado vendido (t)', labels: labelsAno, values: d.prensadoMes.map(v => +(v / 1000).toFixed(2)) }],
        options: optsBarras(d.mesesAno.map(mk => mk >= mPlano ? COR.lima : COR.verde), '0.0" t"') },
      { type: pptx.ChartType.line, data: [{ name: `Capacidade ${d.prensas.length} prensas (${nf(d.capMes / 1000, 0)} t)`, labels: labelsAno, values: labelsAno.map(() => capT) }], options: optsLinha },
    ], { ...optsGrafico('Volume prensado vendido por mês (t)'), valAxisLabelFormatCode: '0' });

    const px = 940, pw = 390;
    box(s, px, 205, pw, 190, 'FFFFFF', COR.borda);
    txt(s, px + 22, 221, pw - 44, 20, `PRODUÇÃO DAS PRENSAS · ${mes.toUpperCase()}`, 13, COR.muted, { bold: true });
    txt(s, px + 22, 247, pw - 44, 46, `${nf(d.prod / 1000, 2)} t de ${nf(d.capMes / 1000, 0)} t`, 30, COR.txt, { bold: true });
    box(s, px + 22, 305, pw - 44, 16, COR.trilho, null, 0);
    if (atProd > 0) box(s, px + 22, 305, Math.max(6, (pw - 44) * Math.min(atProd, 100) / 100), 16, corAting(atProd / pEsperadoProd * 100), null, 0);
    const atraso = d.esperado - d.prod, ritmo = d.dpPrensa > 0 ? d.prod / d.dpPrensa : 0;
    txt(s, px + 22, 330, pw - 44, 50, `${pct(atProd)} da meta${atraso > 0 ? ` · atraso de ${nf(atraso / 1000, 1)} t` : ''}\nritmo: ${nf(ritmo / 1000, 1)} t/dia útil (meta ${nf(d.metaDia / 1000, 1)} t/dia)`, 14, COR.txt2);

    const falta = Math.max(0, d.capMes - d.prod);
    let b2;
    if (falta <= 0) b2 = ['META DO MÊS', 'Atingida', `${pct(atProd)} da capacidade`, COR.ok, COR.okBg];
    else if (d.emAndamento && d.dr > 0) {
      const nec = falta / d.dr;
      b2 = ['PARA FECHAR A META DO MÊS', `${nf(nec / 1000, 1)} t/dia`, `nos ${d.dr} dias úteis restantes${nec > d.metaDia * 2 ? ' — inviável' : ''}`, COR.verm, COR.vermBg];
    } else b2 = ['RESULTADO DO MÊS', `faltaram ${nf(falta / 1000, 1)} t`, `${pct(atProd)} da meta`, COR.verm, COR.vermBg];
    box(s, px, 409, pw, 118, b2[4], null);
    txt(s, px + 22, 425, pw - 44, 20, b2[0], 13, b2[3], { bold: true });
    txt(s, px + 22, 449, pw - 44, 44, b2[1], 30, b2[3], { bold: true });
    txt(s, px + 22, 493, pw - 44, 22, b2[2], 14, COR.txt2);

    box(s, px, 541, pw, 118, 'FFFFFF', COR.borda);
    txt(s, px + 22, 557, pw - 44, 20, 'MÉDIA MENSAL DE PRENSADO VENDIDO', 13, COR.muted, { bold: true });
    const temMedias = d.prensAntes != null && d.prensDepois != null;
    txt(s, px + 22, 581, pw - 44, 44, temMedias ? `${nf(d.prensAntes / 1000, 1)} t → ${nf(d.prensDepois / 1000, 1)} t` : '—', 30, COR.txt, { bold: true });
    txt(s, px + 22, 625, pw - 44, 22, temMedias && d.prensAntes > 0 ? `antes do plano → desde ${ddmm(PLANO_INICIO)} (${nf(d.prensDepois / d.prensAntes * 100, 0)}%)` : 'antes × depois do plano', 14, COR.txt2);

    txt(s, px, 672, pw, 22, 'ATINGIMENTO SEMANAL DAS PRENSAS', 13, COR.muted, { bold: true });
    barras(s, px, 700, pw, d.semProd.map(w => [`Sem ${w.i}${w.parcial ? '*' : ''}`, w.p, w.p == null ? '—' : `${nf(w.p, 0)}%`]), 28, 14);
    nota(s, `${d.emAndamento ? `* ${cap(mes)} parcial (até ${ddmm(d.corte)}). ` : ''}Barras em verde-claro: meses do plano de expansão (início em ${ddmm(PLANO_INICIO)}).`);
    s.addNotes('O gráfico é o volume prensado VENDIDO (Comercial); o painel à direita é a PRODUÇÃO das prensas (Produção).');
  }

  // ── 7. Equipamentos e equipe ──
  {
    const s = conteudo('EQUIPAMENTOS E EQUIPE', fr.equip);
    box(s, 50, 205, 620, 620, 'FFFFFF', COR.borda);
    txt(s, 76, 225, 400, 22, 'EQUIPAMENTOS', 14, COR.muted, { bold: true });
    txt(s, 76, 253, 180, 56, pct(d.disp, 0), 44, d.nPar ? COR.verm : COR.ok, { bold: true });
    txt(s, 260, 263, 390, 50, `${d.nOp + d.nRes} de ${d.eqs.length} disponíveis\n${d.nOp} operando · ${d.nRes} com restrição · ${d.nPar} parado${d.nPar === 1 ? '' : 's'}`, 15, COR.txt2);
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
    const incompleta = d.colab != null && d.colab < META_COLABORADORES;
    txt(s, 726, 253, 300, 56, d.colab != null ? `${d.colab} / ${META_COLABORADORES}` : '—', 44, incompleta ? COR.amb : COR.ok, { bold: true });
    txt(s, 726, 318, 580, 22, d.colab != null ? `colaboradores · ${nf(d.colab / META_COLABORADORES * 100, 0)}% do quadro previsto` : 'sem registro no Plano de Expansão', 15, COR.txt2);
    box(s, 726, 350, 578, 16, COR.trilho, null, 0);
    if (d.colab) box(s, 726, 350, 578 * Math.min(1, d.colab / META_COLABORADORES), 16, incompleta ? COR.amb : COR.ok, null, 0);
    if (textos.aconteceu.length) {
      txt(s, 726, 394, 580, 22, 'O QUE ACONTECEU', 13, COR.muted, { bold: true });
      txt(s, 726, 424, 578, 170, textos.aconteceu.map((t, k, arr) => ({ text: t, options: { bullet: { type: 'number' }, breakLine: k < arr.length - 1 } })), 16, COR.txt2, { paraSpaceAfter: 6 });
    }
    if (textos.proximos.length) {
      box(s, 726, 600, 578, 150, COR.verdeCl, null);
      txt(s, 748, 616, 540, 22, 'PRÓXIMOS PASSOS', 13, COR.verde, { bold: true });
      txt(s, 748, 644, 540, 100, textos.proximos.join('\n'), 16, COR.txt2);
    }
  }

  // ── 8. Plano de ação (tarefas selecionadas) ──
  {
    const s = conteudo('PLANO DE AÇÃO', fr.plano);
    const cab = ['#', 'Ação', 'Responsável', 'Prazo', 'Status'].map((t, k) =>
      ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: COR.verde }, fontSize: 14, align: k === 0 ? 'center' : 'left' } }));
    const linhas = acoes.length ? acoes.map((t, k) => {
      const atrasada = t.data_vencimento && t.data_vencimento < hoje && t.status !== 'concluida';
      const st = atrasada ? 'Atrasada' : (STATUS_TAREFA[t.status] || t.status || '—');
      const corSt = st === 'Atrasada' ? COR.verm : st === 'Em andamento' ? COR.amb : st === 'Concluída' ? COR.ok : COR.muted;
      const fill = { color: k % 2 ? COR.cinzaBg : 'FFFFFF' };
      return [
        { text: String(k + 1), options: { bold: true, align: 'center', fill, color: COR.txt } },
        { text: t.titulo || '', options: { fill, color: COR.txt } },
        { text: t.responsavel || 'a definir', options: { italic: true, color: COR.cinza, fill } },
        { text: t.data_vencimento ? ddmmaaaa(t.data_vencimento) : 'a definir', options: { italic: true, color: COR.cinza, fill } },
        { text: st, options: { bold: true, color: corSt, fill } },
      ];
    }) : [[{ text: 'Nenhuma ação selecionada — cadastre as ações no módulo Tarefas.', options: { colspan: 5, italic: true, color: COR.muted } }]];
    const rowH = Math.min(70, 560 / Math.max(1, linhas.length));
    s.addTable([cab, ...linhas], {
      x: I(50), y: I(210), w: I(1280), colW: [60, 700, 190, 150, 180].map(I), rowH: [I(48), ...linhas.map(() => I(rowH))],
      fontFace: FONT, fontSize: 16, valign: 'middle', margin: [0, 0.19, 0, 0.19], border: { type: 'none' },
    });
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
