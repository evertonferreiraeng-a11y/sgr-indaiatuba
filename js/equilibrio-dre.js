// Ponto de equilíbrio a partir do resultado real da unidade (tela DRE / tabela vw_dre_mensal).
// Usado pelo Dashboard e pela Apresentação no lugar do estudo financeiro digitado à mão.
//
// Regra (EBITDA zero):
//   margem de contribuição = (receita bruta − gastos variáveis) ÷ receita bruta
//   custos fixos/mês       = gastos fixos ÷ nº de meses
//   ponto de equilíbrio    = custos fixos/mês ÷ margem de contribuição
// Gastos = deduções + custos + despesas operacionais (depreciação, financeiro e IR ficam fora: régua do EBITDA).
// Fixo ou variável vem da coluna "natureza" de cada conta em dre_contas.

// Quantos meses fechados do DRE entram na conta (os mais recentes até o mês de referência)
export const JANELA_MESES = 3;

const MES_AB = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const rotMes = ym => `${MES_AB[+ym.slice(5, 7) - 1]}/${ym.slice(0, 4)}`;
const menosMeses = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 - n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

// M = mês de referência 'AAAA-MM'. Retorna null quando o DRE não tem dados suficientes.
export async function equilibrioDoDRE(supabase, M, janela = JANELA_MESES) {
  const { data: unidades, error: eu } = await supabase.from('dre_unidades').select('id, nome').eq('ativo', true);
  if (eu || !unidades?.length) return null;
  const u = unidades.find(x => /indaiatuba/i.test(x.nome)) || unidades[0];

  const { data, error } = await supabase.from('vw_dre_mensal')
    .select('competencia, grupo, natureza, valor')
    .eq('unidade_id', u.id).eq('tipo', 'realizado')
    .gte('competencia', `${menosMeses(M, 12)}-01`).lte('competencia', `${M}-01`);
  if (error || !data?.length) return null;

  // Meses fechados com receita, do mais recente para trás
  const recMes = {};
  data.forEach(r => { if (r.grupo === 'receita_bruta') recMes[r.competencia.slice(0, 7)] = (recMes[r.competencia.slice(0, 7)] || 0) + +r.valor; });
  const meses = Object.keys(recMes).filter(k => recMes[k] > 0).sort().slice(-janela);
  if (!meses.length) return null;
  const dentro = new Set(meses);

  let rb = 0, ded = 0, varT = 0, fixT = 0, ebitda = 0;
  data.forEach(r => {
    const ym = r.competencia.slice(0, 7); if (!dentro.has(ym)) return;
    const v = +r.valor;
    if (r.grupo === 'receita_bruta') { rb += v; ebitda += v; return; }
    if (!['deducoes', 'custos', 'despesas'].includes(r.grupo)) return;
    if (r.grupo === 'deducoes') ded += v;
    if (r.natureza === 'variavel') varT += v; else fixT += v;
    ebitda -= v;
  });
  const n = meses.length;
  const mc = rb > 0 ? (rb - varT) / rb : null;
  const fixos = fixT / n;
  if (!(mc > 0) || !(fixos > 0)) return null;
  return {
    pe: fixos / mc,                  // receita bruta/mês com EBITDA zero
    fixos,                           // gastos fixos por mês
    mc,                              // margem de contribuição sobre a receita bruta
    liq: rb > 0 ? (rb - ded) / rb : null, // receita líquida ÷ bruta (para a margem EBITDA)
    rbMes: rb / n, ebitdaMes: ebitda / n,
    meses, n, de: meses[0], ate: meses[n - 1], unidade: u.nome,
    periodo: n === 1 ? rotMes(meses[0]) : `${rotMes(meses[0]).split('/')[0]}–${rotMes(meses[n - 1])}`,
  };
}
