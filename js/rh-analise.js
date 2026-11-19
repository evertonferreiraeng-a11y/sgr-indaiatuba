// Análise automática da equipe (tela do RH → "Análise da equipe").
// Lê colaboradores, ocorrências e avaliações e monta um diagnóstico com indicadores,
// pessoas que pedem atenção, destaques, padrões e recomendações práticas.
// Só leitura: não grava nada.
import { TIPOS_FALTA } from './oc-form.js?v=7';

const META_PRESENCA = 95;           // % de presença esperada
const pad = n => String(n).padStart(2, '0');
const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const DIA = ['dom','seg','ter','qua','qui','sex','sáb'];
const dBR = iso => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—';
const addDias = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const difDias = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
const ehFalta = o => !!o.conta_como_falta || TIPOS_FALTA.includes(o.tipo);
const CRIT = { relacionamento:'Relacionamento', responsabilidade:'Responsabilidade', cooperacao:'Cooperação', conhecimento_trabalho:'Conhecimento do trabalho', interesse:'Interesse', atitude_profissional:'Atitude profissional', produtividade:'Produtividade' };
const media = vs => vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
const mediaAval = a => media(Object.keys(CRIT).map(k => parseFloat(a[k])).filter(v => v > 0));
const pct = (a, b) => b ? Math.round(a / b * 100) : null;
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

// Presença por pessoa-dia: falta se houver falta; presente se houver registro que não seja férias/advertência
function presenca(lista) {
  const d = {};
  lista.forEach(o => { const k = o.colaborador_id + o.data;
    if (ehFalta(o)) d[k] = 'f'; else if (!['ferias', 'advertencia', 'abono'].includes(o.tipo) && !d[k]) d[k] = 'p'; });
  const v = Object.values(d), p = v.filter(x => x === 'p').length;
  return { p, b: v.length, pct: pct(p, v.length) };
}

export function analisarEquipe({ colabs, ocs, avals, hoje }) {
  const ativos = colabs.filter(c => !c.demissao);
  const ids = new Set(ativos.map(c => c.id));
  const ocA = ocs.filter(o => ids.has(o.colaborador_id) && o.data <= hoje);
  const ini90 = addDias(hoje, -90);
  const oc90 = ocA.filter(o => o.data > ini90);

  // ── Tendência: últimos 6 meses ──
  const meses = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(+hoje.slice(0, 4), +hoje.slice(5, 7) - 1 - i, 1); meses.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); }
  const porMes = meses.map(k => { const l = ocA.filter(o => o.data.startsWith(k)); const pr = presenca(l);
    return { k, pct: pr.pct, faltas: l.filter(ehFalta).length, injust: l.filter(o => o.tipo === 'falta').length, atrasos: l.filter(o => o.tipo === 'atraso').length }; });
  const pres90 = presenca(oc90);
  const comDados = porMes.filter(m => m.pct != null);
  const tend = comDados.length >= 3 ? (media(comDados.slice(-2).map(m => m.pct)) - media(comDados.slice(0, -2).map(m => m.pct))) : null;

  // ── Por pessoa (últimos 90 dias) ──
  const pessoas = ativos.map(c => {
    const l = oc90.filter(o => o.colaborador_id === c.id);
    const lTudo = ocA.filter(o => o.colaborador_id === c.id);
    const av = avals.filter(a => a.colaborador_id === c.id).sort((a, b) => (b.data_avaliacao || '').localeCompare(a.data_avaliacao || ''));
    const notas = av.map(mediaAval).filter(v => v != null);
    const nota = media(notas);
    const ultNota = av.length ? mediaAval(av[0]) : null;
    const antNota = av.length > 1 ? mediaAval(av[1]) : null;
    const faltas = l.filter(ehFalta);
    const segSex = faltas.filter(o => [1, 5].includes(new Date(o.data + 'T00:00:00').getDay())).length;
    const pr = presenca(l);
    const advAno = lTudo.filter(o => o.tipo === 'advertencia' && o.data.startsWith(hoje.slice(0, 4))).length;
    const exp = [[1, c.fim_experiencia_1, c.passou_exp_1], [2, c.fim_experiencia_2, c.passou_exp_2]].find(([, fim, ok]) => fim && ok == null && difDias(hoje, fim) >= -15 && difDias(hoje, fim) <= 45);
    return { c, nota, ultNota, antNota, nAval: av.length, ultAval: av[0]?.data_avaliacao || null,
      faltas: faltas.length, injust: faltas.filter(o => o.tipo === 'falta').length, segSex,
      atrasos: l.filter(o => o.tipo === 'atraso').length, hAtraso: l.filter(o => o.tipo === 'atraso').reduce((s, o) => s + (parseFloat(o.horas) || 0), 0),
      adv: advAno, pres: pr.pct, diasLanc: pr.b, exp };
  });

  // Classificação: pontos de risco
  pessoas.forEach(p => {
    const r = [];
    if (p.faltas >= 6) r.push([3, `${p.faltas} faltas em 90 dias`]); else if (p.faltas >= 4) r.push([2, `${p.faltas} faltas em 90 dias`]); else if (p.faltas >= 2) r.push([1, `${p.faltas} faltas em 90 dias`]);
    if (p.injust >= 2) r.push([2, `${p.injust} sem justificativa`]);
    if (p.faltas >= 2 && p.segSex / p.faltas >= .6) r.push([1, `${p.segSex} de ${p.faltas} faltas em segunda/sexta`]);
    if (p.atrasos >= 3) r.push([1, `${p.atrasos} atrasos em 90 dias`]);
    if (p.adv >= 2) r.push([3, `${p.adv} advertências no ano`]); else if (p.adv === 1) r.push([1, '1 advertência no ano']);
    if (p.nota != null && p.nota < 5) r.push([3, `nota ${p.nota.toFixed(1)}`]); else if (p.nota != null && p.nota < 6.5) r.push([1, `nota ${p.nota.toFixed(1)}`]);
    if (p.ultNota != null && p.antNota != null && p.ultNota < p.antNota - 1) r.push([1, `nota caiu de ${p.antNota.toFixed(1)} para ${p.ultNota.toFixed(1)}`]);
    p.riscos = r; p.pontos = r.reduce((s, x) => s + x[0], 0);
    p.nivel = p.pontos >= 4 ? 'critico' : p.pontos >= 2 ? 'atencao' : 'ok';
    p.destaque = p.faltas === 0 && p.adv === 0 && p.atrasos <= 1 && (p.nota == null || p.nota >= 7.5) && p.diasLanc >= 20;
  });
  const criticos = pessoas.filter(p => p.nivel === 'critico').sort((a, b) => b.pontos - a.pontos);
  const atencao = pessoas.filter(p => p.nivel === 'atencao').sort((a, b) => b.pontos - a.pontos);
  const destaques = pessoas.filter(p => p.destaque).sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));

  // ── Padrões ──
  const faltas90 = oc90.filter(ehFalta);
  const porDia = [1, 2, 3, 4, 5].map(w => faltas90.filter(o => new Date(o.data + 'T00:00:00').getDay() === w).length);
  const totDia = porDia.reduce((a, b) => a + b, 0);
  const pctSegSex = pct(porDia[0] + porDia[4], totDia);
  // Concentração: quanto das faltas vem das 20% pessoas que mais faltam
  const ordF = pessoas.map(p => p.faltas).sort((a, b) => b - a);
  const top = Math.max(1, Math.round(pessoas.length * .2));
  const pctTop = pct(ordF.slice(0, top).reduce((a, b) => a + b, 0), faltas90.length);
  const injust90 = faltas90.filter(o => o.tipo === 'falta').length;
  const atrasos90 = oc90.filter(o => o.tipo === 'atraso');
  const hAtr90 = atrasos90.reduce((s, o) => s + (parseFloat(o.horas) || 0), 0);

  // ── Avaliações ──
  const avAtivos = avals.filter(a => ids.has(a.colaborador_id));
  const critMed = Object.entries(CRIT).map(([k, rot]) => ({ k, rot, v: media(avAtivos.map(a => parseFloat(a[k])).filter(v => v > 0)) })).filter(x => x.v != null).sort((a, b) => a.v - b.v);
  const semAval = pessoas.filter(p => !p.nAval);
  const avalVelha = pessoas.filter(p => p.ultAval && difDias(p.ultAval, hoje) > 180);
  const notasP = pessoas.filter(p => p.nota != null);
  const notaEquipe = media(notasP.map(p => p.nota));

  // ── Experiência ──
  const exps = pessoas.filter(p => p.exp).map(p => {
    const [n, fim] = p.exp, dias = difDias(hoje, fim);
    let rec, cls;
    if ((p.nota != null && p.nota < 5) || p.faltas >= 4 || p.adv >= 2) { rec = 'Não efetivar — histórico de faltas/nota não sustenta'; cls = 'r'; }
    else if (p.nota == null) { rec = 'Avaliar antes do vencimento — ainda sem avaliação'; cls = 'a'; }
    else if (p.nota < 7 || p.faltas >= 2 || p.injust >= 1) { rec = 'Efetivar com ressalva — combinar metas e acompanhar'; cls = 'a'; }
    else { rec = 'Efetivar — bom desempenho e assiduidade'; cls = 'v'; }
    return { p, n, fim, dias, rec, cls };
  }).sort((a, b) => a.dias - b.dias);

  // ── Turnover ──
  const ano = hoje.slice(0, 4);
  const saidas = colabs.filter(c => c.demissao && c.demissao.startsWith(ano));
  const tv = pct(saidas.length, ativos.length + saidas.length);
  const saidasCedo = saidas.filter(c => c.data_admissao && difDias(c.data_admissao, c.demissao) <= 90);

  // ── Recomendações ──
  const rec = [];
  if (pres90.pct != null && pres90.pct < META_PRESENCA) rec.push(['alta', `Presença da equipe em ${pres90.pct}% nos últimos 90 dias, abaixo da meta de ${META_PRESENCA}%.`, `Divulgar a meta de presença para a equipe e acompanhar o indicador toda semana. Conversar individualmente com quem está puxando o número para baixo (${criticos.slice(0, 3).map(p => p.c.nome.split(' ')[0]).join(', ') || 'ver lista abaixo'}).`]);
  if (tend != null && tend <= -3) rec.push(['alta', `A presença está caindo: os 2 últimos meses estão ${Math.abs(tend).toFixed(0)} p.p. abaixo dos anteriores.`, 'Investigar a causa (clima, doença sazonal, sobrecarga, transporte) antes que vire hábito. Uma conversa coletiva rápida costuma revelar o motivo.']);
  if (pctTop != null && faltas90.length >= 5 && pctTop >= 50) rec.push(['media', `As faltas estão concentradas: ${plural(top, 'pessoa responde', 'pessoas respondem')} por ${pctTop}% das faltas em 90 dias.`, 'O problema não é da equipe toda — tratar caso a caso com conversa registrada, plano de melhoria com prazo e, se não houver evolução, medida disciplinar.']);
  if (pctSegSex != null && totDia >= 5 && pctSegSex >= 50) rec.push(['media', `${pctSegSex}% das faltas caem em segunda ou sexta-feira.`, 'Padrão típico de "emendar" o fim de semana. Deixar claro que faltas sem justificativa em segunda/sexta serão acompanhadas, e aplicar o desconto do DSR quando cabível.']);
  if (injust90 >= 3) rec.push(['media', `${plural(injust90, 'falta sem justificativa', 'faltas sem justificativa')} em 90 dias.`, 'Aplicar a política de forma consistente: conversa na 1ª, advertência verbal/escrita nas seguintes, sempre registrada no sistema.']);
  if (atrasos90.length >= 5) rec.push(['media', `${plural(atrasos90.length, 'atraso', 'atrasos')} em 90 dias (${hAtr90.toFixed(1).replace('.', ',')}h perdidas).`, 'Verificar se há causa comum (horário do ônibus, distância). Se for individual, alinhar tolerância e registrar.']);
  if (exps.some(e => e.dias <= 15)) rec.push(['alta', `${plural(exps.filter(e => e.dias <= 15).length, 'experiência vence', 'experiências vencem')} nos próximos 15 dias.`, 'Decidir agora, com base na nota e nas faltas (ver quadro de Experiência). Decidir depois do prazo efetiva automaticamente.']);
  if (semAval.length) rec.push(['media', `${plural(semAval.length, 'pessoa sem', 'pessoas sem')} nenhuma avaliação de desempenho.`, `Avaliar: ${semAval.slice(0, 5).map(p => p.c.nome.split(' ')[0]).join(', ')}${semAval.length > 5 ? '…' : ''}. Sem avaliação não há base para efetivar, promover ou desligar.`]);
  if (avalVelha.length) rec.push(['baixa', `${plural(avalVelha.length, 'avaliação está', 'avaliações estão')} com mais de 6 meses.`, 'Fazer um ciclo de avaliação semestral para toda a equipe.']);
  if (critMed.length && critMed[0].v < 7) rec.push(['media', `Ponto mais fraco da equipe nas avaliações: ${critMed[0].rot} (${critMed[0].v.toFixed(1)}).`, `Trabalhar esse tema com a equipe (treinamento curto, DDS, orientação do encarregado). Próximo ponto fraco: ${critMed[1] ? `${critMed[1].rot} (${critMed[1].v.toFixed(1)})` : '—'}.`]);
  if (saidasCedo.length >= 2) rec.push(['media', `${plural(saidasCedo.length, 'pessoa saiu', 'pessoas saíram')} com menos de 90 dias de casa em ${ano}.`, 'Rever o recrutamento e a integração: expectativas da vaga, acompanhamento na 1ª semana e um "padrinho" para o novato.']);
  if (tv != null && tv >= 20) rec.push(['media', `Turnover de ${tv}% em ${ano}.`, 'Cada saída custa recrutamento e treinamento. Fazer entrevista de desligamento para entender os motivos.']);
  if (destaques.length) rec.push(['baixa', `${plural(destaques.length, 'pessoa', 'pessoas')} sem faltas nos últimos 90 dias e com bom desempenho.`, 'Reconhecer publicamente (elogio, quadro de destaque, prioridade em escalas/benefícios). Reconhecimento reforça o comportamento que você quer ver.']);
  const ORD = { alta: 0, media: 1, baixa: 2 };
  rec.sort((a, b) => ORD[a[0]] - ORD[b[0]]);

  // ── HTML ──
  const cor = v => v == null ? '#94a3b8' : v >= META_PRESENCA ? '#16a34a' : v >= 85 ? '#d97706' : '#dc2626';
  const corN = v => v == null ? '#94a3b8' : v >= 7 ? '#16a34a' : v >= 5 ? '#d97706' : '#dc2626';
  const maxF = Math.max(1, ...porMes.map(m => m.faltas));
  const linhaP = p => `<tr><td><b>${p.c.nome}</b></td><td>${p.riscos.map(r => `<span class="an-tag ${r[0] >= 3 ? 'r' : r[0] >= 2 ? 'a' : ''}">${r[1]}</span>`).join('')}</td>
      <td class="num">${p.pres == null ? '—' : p.pres + '%'}</td><td class="num" style="color:${corN(p.nota)}">${p.nota == null ? '—' : p.nota.toFixed(1)}</td></tr>`;
  const resumo = [
    pres90.pct == null ? 'Ainda não há lançamentos suficientes para medir a presença.' :
      `A equipe tem <b>${ativos.length} colaboradores ativos</b> e presença de <b style="color:${cor(pres90.pct)}">${pres90.pct}%</b> nos últimos 90 dias (meta ${META_PRESENCA}%)${tend != null ? `, ${tend >= 3 ? 'em <b style="color:#16a34a">melhora</b>' : tend <= -3 ? 'em <b style="color:#dc2626">queda</b>' : 'estável'} nos últimos meses` : ''}.`,
    `${criticos.length ? `<b style="color:#dc2626">${plural(criticos.length, 'pessoa está', 'pessoas estão')} em situação crítica</b>` : 'Ninguém em situação crítica'}${atencao.length ? `, ${plural(atencao.length, 'pede', 'pedem')} atenção` : ''} e <b style="color:#16a34a">${plural(destaques.length, 'é destaque', 'são destaques')}</b>.`,
    notaEquipe != null ? `Nota média da equipe: <b style="color:${corN(notaEquipe)}">${notaEquipe.toFixed(1)}</b>${critMed.length ? `; ponto mais forte <b>${critMed[critMed.length - 1].rot}</b>, mais fraco <b>${critMed[0].rot}</b>` : ''}.` : 'Nenhuma avaliação de desempenho registrada ainda.',
  ];

  return `
  <div class="an">
    <p class="an-meta">Gerado em ${dBR(hoje)} com base nos lançamentos do sistema · janela principal: últimos 90 dias (${dBR(addDias(ini90, 1))} a ${dBR(hoje)}) · só colaboradores ativos</p>

    <h4>Resumo</h4>
    <ul class="an-resumo">${resumo.map(r => `<li>${r}</li>`).join('')}</ul>

    <h4>Indicadores</h4>
    <div class="an-kpis">
      <div><span>Presença 90 dias</span><b style="color:${cor(pres90.pct)}">${pres90.pct == null ? '—' : pres90.pct + '%'}</b><small>meta ${META_PRESENCA}%</small></div>
      <div><span>Faltas 90 dias</span><b style="color:${faltas90.length ? '#dc2626' : '#16a34a'}">${faltas90.length}</b><small>${injust90} sem justificativa</small></div>
      <div><span>Atrasos 90 dias</span><b style="color:${atrasos90.length ? '#a16207' : '#16a34a'}">${atrasos90.length}</b><small>${hAtr90.toFixed(1).replace('.', ',')}h no total</small></div>
      <div><span>Nota média</span><b style="color:${corN(notaEquipe)}">${notaEquipe == null ? '—' : notaEquipe.toFixed(1)}</b><small>${notasP.length} de ${pessoas.length} avaliados</small></div>
      <div><span>Turnover ${ano}</span><b style="color:${tv ? '#dc2626' : '#16a34a'}">${tv ?? 0}%</b><small>${plural(saidas.length, 'saída', 'saídas')}</small></div>
    </div>

    <h4>Tendência — últimos 6 meses</h4>
    <div class="an-tend">${porMes.map(m => `<div><b style="color:${cor(m.pct)}">${m.pct == null ? '—' : m.pct + '%'}</b>
        <div class="bar"><i style="height:${m.faltas / maxF * 100}%"></i></div><small>${m.faltas} falta${m.faltas === 1 ? '' : 's'}</small><span>${MES[+m.k.slice(5) - 1]}</span></div>`).join('')}</div>
    <p class="an-nota">Número de cima: presença do mês. Barra: quantidade de faltas.</p>

    <h4>Recomendações</h4>
    ${rec.length ? `<ol class="an-rec">${rec.map(([pri, fato, acao]) => `<li class="${pri}"><span class="pri">${pri === 'alta' ? 'Prioridade alta' : pri === 'media' ? 'Prioridade média' : 'Manter / reforçar'}</span><b>${fato}</b><p>${acao}</p></li>`).join('')}</ol>` : '<p class="an-ok">Nenhum ponto de melhoria relevante encontrado. Equipe dentro das metas.</p>'}

    <h4>Pessoas em situação crítica <small>(${criticos.length})</small></h4>
    ${criticos.length ? `<table class="an-tab"><thead><tr><th>Colaborador</th><th>Motivos (90 dias)</th><th class="num">Presença</th><th class="num">Nota</th></tr></thead><tbody>${criticos.map(linhaP).join('')}</tbody></table>
      <p class="an-nota">Sugestão: conversa individual registrada, plano com meta e prazo (30 dias) e reavaliação. Sem evolução: medida disciplinar ou desligamento.</p>` : '<p class="an-ok">Ninguém nesta situação.</p>'}

    <h4>Pedem atenção <small>(${atencao.length})</small></h4>
    ${atencao.length ? `<table class="an-tab"><thead><tr><th>Colaborador</th><th>Motivos (90 dias)</th><th class="num">Presença</th><th class="num">Nota</th></tr></thead><tbody>${atencao.map(linhaP).join('')}</tbody></table>
      <p class="an-nota">Sugestão: conversa de alinhamento (feedback), sem caráter punitivo, e acompanhar no próximo mês.</p>` : '<p class="an-ok">Ninguém nesta situação.</p>'}

    <h4>Destaques <small>(${destaques.length})</small></h4>
    ${destaques.length ? `<div class="an-dest">${destaques.map(p => `<span>${p.c.nome}${p.nota != null ? ` <b style="color:${corN(p.nota)}">${p.nota.toFixed(1)}</b>` : ''}</span>`).join('')}</div>
      <p class="an-nota">Sem faltas nem advertências nos últimos 90 dias, no máximo 1 atraso e nota 7,5 ou mais (quando avaliado).</p>` : '<p class="an-nota">Nenhum colaborador atende a todos os critérios de destaque no momento.</p>'}

    <h4>Experiência — decisões próximas <small>(${exps.length})</small></h4>
    ${exps.length ? `<table class="an-tab"><thead><tr><th>Colaborador</th><th>Vencimento</th><th class="num">Faltas 90d</th><th class="num">Nota</th><th>Sugestão</th></tr></thead><tbody>
      ${exps.map(e => `<tr><td><b>${e.p.c.nome}</b><br><small>${e.n}ª experiência</small></td><td>${dBR(e.fim)}<br><small>${e.dias < 0 ? `venceu há ${-e.dias} dias` : e.dias === 0 ? 'vence hoje' : `em ${e.dias} dias`}</small></td>
        <td class="num">${e.p.faltas}</td><td class="num" style="color:${corN(e.p.nota)}">${e.p.nota == null ? '—' : e.p.nota.toFixed(1)}</td><td><span class="an-tag ${e.cls}">${e.rec}</span></td></tr>`).join('')}
    </tbody></table>` : '<p class="an-nota">Nenhuma experiência vencendo nos próximos 45 dias.</p>'}

    <h4>Padrões encontrados</h4>
    <ul class="an-resumo">
      <li>Faltas por dia da semana (90 dias): ${[1, 2, 3, 4, 5].map((w, i) => `${DIA[w]} <b>${porDia[i]}</b>`).join(' · ')}${pctSegSex != null && totDia ? ` — <b>${pctSegSex}%</b> em segunda/sexta` : ''}.</li>
      ${faltas90.length ? `<li>Concentração: as ${plural(top, 'pessoa', 'pessoas')} que mais faltam somam <b>${pctTop}%</b> das faltas.</li>` : ''}
      ${critMed.length ? `<li>Avaliações por critério (média da equipe): ${[...critMed].reverse().map(x => `${x.rot} <b style="color:${corN(x.v)}">${x.v.toFixed(1)}</b>`).join(' · ')}.</li>` : ''}
      ${semAval.length ? `<li>Sem avaliação: ${semAval.map(p => p.c.nome).join(', ')}.</li>` : ''}
      ${saidas.length ? `<li>Saídas em ${ano}: ${saidas.length}${saidasCedo.length ? `, sendo ${saidasCedo.length} com menos de 90 dias de casa` : ''}.</li>` : ''}
    </ul>
    <p class="an-nota">Análise automática por regras: serve de apoio à decisão. Confira os casos no calendário de cada colaborador antes de agir.</p>
  </div>`;
}

export const CSS_ANALISE = `
  .an h4 { font-size:12px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#006636; margin:22px 0 10px; padding-bottom:6px; border-bottom:1px solid #e2e8f0; }
  .an h4 small { color:#94a3b8; font-weight:700; }
  .an h4:first-of-type { margin-top:10px; }
  .an-meta { font-size:12px; color:#64748b; margin:0; }
  .an-resumo { margin:0; padding-left:18px; font-size:14px; color:#334155; line-height:1.6; }
  .an-kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:8px; }
  .an-kpis > div { background:#f8fafc; border:1px solid #eef2f7; border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; }
  .an-kpis span { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:#64748b; }
  .an-kpis b { font-size:24px; font-weight:800; line-height:1.2; }
  .an-kpis small { font-size:12px; color:#64748b; }
  .an-tend { display:grid; grid-template-columns:repeat(6, 1fr); gap:10px; align-items:end; }
  .an-tend > div { display:flex; flex-direction:column; align-items:center; gap:3px; font-size:12px; }
  .an-tend .bar { width:100%; max-width:56px; height:70px; background:#f1f5f9; border-radius:6px; display:flex; align-items:flex-end; overflow:hidden; }
  .an-tend .bar i { display:block; width:100%; background:#f87171; }
  .an-tend small { color:#64748b; } .an-tend span { font-weight:700; color:#334155; }
  .an-nota { font-size:12px; color:#64748b; margin:6px 0 0; }
  .an-ok { font-size:13px; color:#16a34a; font-weight:600; margin:0; }
  .an-rec { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px; counter-reset:r; }
  .an-rec li { border:1px solid #e2e8f0; border-left:4px solid #94a3b8; border-radius:10px; padding:10px 14px; background:#fff; }
  .an-rec li.alta { border-left-color:#dc2626; background:#fef2f2; } .an-rec li.media { border-left-color:#d97706; background:#fffbeb; } .an-rec li.baixa { border-left-color:#16a34a; background:#f0fdf4; }
  .an-rec .pri { display:block; font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#64748b; margin-bottom:2px; }
  .an-rec b { font-size:14px; color:#0f172a; }
  .an-rec p { margin:4px 0 0; font-size:13px; color:#475569; line-height:1.5; }
  .an-tab { width:100%; border-collapse:collapse; font-size:13px; }
  .an-tab th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:#64748b; padding:6px 8px; border-bottom:2px solid #e2e8f0; }
  .an-tab td { padding:8px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
  .an-tab .num { text-align:center; white-space:nowrap; }
  .an-tab small { color:#94a3b8; }
  .an-tag { display:inline-block; font-size:11.5px; font-weight:600; background:#f1f5f9; color:#475569; border-radius:6px; padding:2px 7px; margin:0 4px 4px 0; }
  .an-tag.r { background:#fee2e2; color:#991b1b; } .an-tag.a { background:#fef3c7; color:#92400e; } .an-tag.v { background:#dcfce7; color:#166534; }
  .an-dest { display:flex; flex-wrap:wrap; gap:6px; }
  .an-dest span { font-size:13px; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; border-radius:999px; padding:4px 12px; }
  @media print {
    body.imprimindo-an .app-layout, body.imprimindo-an .modal-header .modal-close, body.imprimindo-an .modal-footer, body.imprimindo-an #ajuda-btn { display:none !important; }
    body.imprimindo-an #modal-analise { position:static !important; background:none !important; display:block !important; }
    body.imprimindo-an #modal-analise .modal { max-width:none !important; width:100% !important; max-height:none !important; box-shadow:none !important; }
    body.imprimindo-an #modal-analise .modal-body { max-height:none !important; overflow:visible !important; }
    .an-rec li, .an-tab tr { break-inside:avoid; }
  }`;
