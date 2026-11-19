// Formulário de ocorrência compartilhado (colaborador-ocorrencias.html e rh.html)
// Primeiro escolhe a situação do dia (Presente ou Falta), depois o motivo.
//
// Presente
//   outro       Normal — a pessoa veio
//   declaracao  Declaração de horas — informa as horas e quantas abonar (conta como presença)
//   elogio      Outro — escolhe se conta como presença ou como falta
// Falta
//   falta             Injustificada (conta como falta)
//   atestado          Justificada (conta como falta)
//   falta_declaracao  Declaração de horas — as horas da declaração são abonadas, o resto do dia conta como falta
//   ferias            Férias — só informativo: não conta como falta nem como presença
// (advertencia continua existindo nos registros antigos, mas não é mais oferecida)

export const TIPOS_FALTA   = ['falta', 'atestado', 'falta_declaracao'];   // sempre contam como falta
export const TIPOS_AUSENTE = [...TIPOS_FALTA, 'ferias'];                   // a pessoa não estava na empresa
export const TIPOS_COM_HORAS = ['declaracao', 'falta_declaracao'];

// A ocorrência conta como falta?
export const ehFalta = o => TIPOS_FALTA.includes(o.tipo) || (['elogio', 'declaracao'].includes(o.tipo) && !!o.conta_como_falta);

const MOTIVOS = {
  falta:    [['falta', 'Injustificada'], ['atestado', 'Justificada (atestado)'], ['falta_declaracao', 'Declaração de horas'], ['ferias', 'Férias']],
  presente: [['outro', 'Normal'], ['atraso', 'Atraso'], ['declaracao', 'Declaração de horas'], ['elogio', 'Outro']],
};
const hhmm = t => t ? String(t).slice(0, 5) : '';

// Nome completo de cada tipo (histórico, legenda, resumo)
export const OC_LABEL = {
  falta: 'Falta injustificada', atestado: 'Falta justificada', falta_declaracao: 'Falta c/ declaração', ferias: 'Férias',
  outro: 'Presente', atraso: 'Atraso', declaracao: 'Declaração', advertencia: 'Advertência', elogio: 'Outro',
};

export const fmtHoras = h => {
  const v = parseFloat(h); if (!v) return '';
  const hh = Math.floor(v), mm = Math.round((v - hh) * 60);
  return mm ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`;
};

// Rótulo de uma ocorrência (histórico)
export function rotuloOc(o) {
  if (o.tipo === 'elogio') return o.conta_como_falta ? 'Outro (falta)' : 'Outro (presença)';
  if (o.tipo === 'atraso') return ['Atraso', o.horas ? fmtHoras(o.horas) : '', o.hora_chegada ? `chegou ${hhmm(o.hora_chegada)}` : ''].filter(Boolean).join(' · ');
  const base = OC_LABEL[o.tipo] || o.tipo;
  if (!TIPOS_COM_HORAS.includes(o.tipo) || !o.horas) return base;
  if (o.tipo === 'falta_declaracao') return `${base} · ${fmtHoras(o.horas)} abonadas`;
  const ab = o.horas_abono == null ? '' : parseFloat(o.horas_abono) > 0 ? ` · abonou ${fmtHoras(o.horas_abono)}` : ' · sem abono';
  return `${base} · ${fmtHoras(o.horas)}${ab}`;
}

// Rótulo do calendário em duas partes: situação do dia + motivo
export function rotuloCal(o) {
  const h = o.horas ? ' ' + fmtHoras(o.horas) : '';
  if (o.tipo === 'ferias') return { situacao: 'Férias', motivo: '' };
  const mot = { falta: 'injustificada', atestado: 'justificada', falta_declaracao: `declaração${h}`, outro: '',
    declaracao: `declaração${h}`, advertencia: 'advertência', elogio: 'outro',
    atraso: o.hora_chegada ? `atraso · ${hhmm(o.hora_chegada)}` : `atraso${h}` }[o.tipo] ?? '';
  return { situacao: ehFalta(o) ? 'Falta' : 'Presente', motivo: mot };
}

const CSS = `
  .ocf-hide { display:none !important; }
  .ocf-sit { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .ocf-sit button { display:flex; align-items:center; justify-content:center; gap:8px; padding:11px 10px; border-radius:10px;
    border:1.5px solid #e2e8f0; background:#fff; font:inherit; font-size:14px; font-weight:700; color:#475569; cursor:pointer; }
  .ocf-sit button i { font-style:normal; width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:12px; background:#f1f5f9; }
  .ocf-sit button[data-sit="presente"].on { border-color:#16a34a; background:#f0fdf4; color:#166534; }
  .ocf-sit button[data-sit="presente"].on i { background:#16a34a; color:#fff; }
  .ocf-sit button[data-sit="falta"].on { border-color:#dc2626; background:#fef2f2; color:#991b1b; }
  .ocf-sit button[data-sit="falta"].on i { background:#dc2626; color:#fff; }
  .ocf-mot { display:flex; flex-wrap:wrap; gap:6px; }
  .ocf-mot button { padding:7px 12px; border-radius:999px; border:1.5px solid #e2e8f0; background:#fff; font:inherit; font-size:13px; font-weight:600; color:#475569; cursor:pointer; }
  .ocf-mot button.on { border-color:var(--c,#0f5132); background:var(--bg,#f0fdf4); color:var(--c,#0f5132); }
  .ocf-mot-vazio { font-size:12.5px; color:#94a3b8; padding:6px 0; }
  .ocf-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:10px; }
  .ocf-linha { display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:13.5px; color:#334155; }
  .ocf-linha > b { font-size:13px; color:#334155; min-width:150px; }
  .ocf-linha input[type=number] { width:90px; }
  .ocf-linha small { color:#64748b; font-size:12px; }
  .ocf-opc { display:flex; gap:16px; flex-wrap:wrap; }
  .ocf-opc label { display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:600; color:#334155; cursor:pointer; text-transform:none; letter-spacing:0; margin:0; }
  .ocf-opc input[type=radio] { width:16px; height:16px; accent-color:#0f5132; margin:0; flex:none; }
  .ocf-aviso { font-size:12px; color:#64748b; }
`;
const COR_MOT = {
  falta: ['#b91c1c', '#fef2f2'], atestado: ['#b45309', '#fffbeb'], falta_declaracao: ['#9a3412', '#fff7ed'], ferias: ['#0369a1', '#f0f9ff'],
  outro: ['#15803d', '#f0fdf4'], atraso: ['#a16207', '#fefce8'], declaracao: ['#6d28d9', '#f5f3ff'], advertencia: ['#be123c', '#fff1f2'], elogio: ['#475569', '#f1f5f9'],
};

let el = {};
const mostrar = (node, sim) => node.classList.toggle('ocf-hide', !sim);

// Desenha os campos dentro do container
export function montarFormOc(container) {
  if (!document.getElementById('ocf-css')) {
    const st = document.createElement('style'); st.id = 'ocf-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  container.innerHTML = `
    <div class="form-group full"><label>Situação no dia *</label>
      <div class="ocf-sit">
        <button type="button" data-sit="presente"><i>✓</i>Presente</button>
        <button type="button" data-sit="falta"><i>✕</i>Falta</button>
      </div>
      <input type="hidden" name="tipo" />
    </div>
    <div class="form-group full"><label id="ocf-mot-lbl">Motivo *</label><div class="ocf-mot" id="ocf-mot"></div></div>
    <div class="form-group full ocf-hide" id="ocf-dec"><label>Declaração</label>
      <div class="ocf-box">
        <div class="ocf-linha"><b>Horas da declaração *</b><input type="number" name="horas" min="0.25" max="24" step="0.25" placeholder="ex.: 1,5" /><small>1,5 = 1h30</small></div>
        <div class="ocf-linha" id="ocf-abono-linha"><b>Horas a abonar</b><input type="number" name="horas_abono" min="0" max="24" step="0.25" /><small>pode ser 0</small></div>
        <div class="ocf-aviso" id="ocf-dec-aviso"></div>
      </div>
    </div>
    <div class="form-group full ocf-hide" id="ocf-outro"><label>Como contar este dia *</label>
      <div class="ocf-box">
        <div class="ocf-opc">
          <label><input type="radio" name="outro_conta" value="presenca" checked /> Contar como presença</label>
          <label><input type="radio" name="outro_conta" value="falta" /> Contar como falta</label>
        </div>
      </div>
    </div>
    <div class="form-group full ocf-hide" id="ocf-atraso"><label>Atraso</label>
      <div class="ocf-box">
        <div class="ocf-linha"><b>Chegou às *</b><input type="time" name="hora_chegada" style="width:120px" /><small id="ocf-jornada">entrada às 07:00</small></div>
        <div class="ocf-linha"><b>Horas de atraso</b><input type="number" name="horas_atraso" min="0.01" max="24" step="any" placeholder="automático" /><small id="ocf-atraso-calc">calculado pela hora de chegada</small></div>
        <div class="ocf-aviso">O dia conta como presença; o atraso fica registrado.</div>
      </div>
    </div>
    <div class="form-group full ocf-hide" id="ocf-ferias">
      <div class="ocf-box"><div class="ocf-aviso">Férias é só informativo: o dia não conta como falta nem como presença.</div></div>
    </div>`;
  el = {
    sit: container.querySelectorAll('.ocf-sit button'),
    tipo: container.querySelector('[name="tipo"]'),
    mot: container.querySelector('#ocf-mot'),
    motLbl: container.querySelector('#ocf-mot-lbl'),
    dec: container.querySelector('#ocf-dec'),
    horas: container.querySelector('[name="horas"]'),
    abono: container.querySelector('[name="horas_abono"]'),
    abonoLinha: container.querySelector('#ocf-abono-linha'),
    decAviso: container.querySelector('#ocf-dec-aviso'),
    outro: container.querySelector('#ocf-outro'),
    outroConta: container.querySelectorAll('[name="outro_conta"]'),
    ferias: container.querySelector('#ocf-ferias'),
    atraso: container.querySelector('#ocf-atraso'),
    chegada: container.querySelector('[name="hora_chegada"]'),
    horasAtraso: container.querySelector('[name="horas_atraso"]'),
    jornada: container.querySelector('#ocf-jornada'),
    atrasoCalc: container.querySelector('#ocf-atraso-calc'),
    data: container.closest('form')?.querySelector('[name="data"]'),
  };
  el.sit.forEach(b => b.addEventListener('click', () => { setSituacao(b.dataset.sit); setTipo(b.dataset.sit === 'falta' ? 'falta' : 'outro'); }));
  // Ao digitar as horas, sugere abonar todas (enquanto o abono não for mexido)
  el.horas.addEventListener('input', () => { if (!el.abono.dataset.mexido) el.abono.value = el.horas.value; avisoDec(); });
  el.abono.addEventListener('input', () => { el.abono.dataset.mexido = '1'; });
  // Atraso: calcula sozinho pela hora de chegada e pelo dia da semana
  el.chegada.addEventListener('input', calcAtraso);
  el.data?.addEventListener('change', () => { if (el.tipo.value === 'atraso') calcAtraso(); });
  setSituacao('');
}

// Jornada: entrada 07:00 de segunda a sexta; saída 17:00 (seg–qui) e 16:00 (sex)
const ENTRADA = 7 * 60;
const SAIDA = { 1: 17 * 60, 2: 17 * 60, 3: 17 * 60, 4: 17 * 60, 5: 16 * 60 };

function calcAtraso() {
  const dt = el.data?.value ? new Date(el.data.value + 'T00:00:00') : null;
  const wd = dt ? dt.getDay() : null;
  const saida = SAIDA[wd];
  el.jornada.textContent = saida ? `entrada às 07:00 · saída às ${saida / 60}:00` : 'fim de semana: sem jornada definida';
  const [hh, mm] = (el.chegada.value || '').split(':').map(Number);
  if (isNaN(hh)) { el.atrasoCalc.textContent = 'calculado pela hora de chegada'; return; }
  if (!saida) { el.atrasoCalc.textContent = 'informe as horas na mão'; return; }
  const chegou = hh * 60 + (mm || 0);
  const min = Math.max(0, Math.min(chegou, saida) - ENTRADA);
  el.horasAtraso.value = min ? +(min / 60).toFixed(2) : '';
  el.atrasoCalc.textContent = min ? `= ${fmtHoras(min / 60)} de atraso` : 'chegou no horário';
}

function avisoDec() {
  const h = fmtHoras(String(el.horas.value).replace(',', '.'));
  el.decAviso.textContent = el.tipo.value === 'falta_declaracao'
    ? `${h ? `As ${h} da declaração são abonadas` : 'As horas da declaração são abonadas'}; o restante do dia conta como falta.`
    : 'O dia conta como presença.';
}

let situacao = '';
function setSituacao(s, extra = null) {
  situacao = s;
  el.sit.forEach(b => b.classList.toggle('on', b.dataset.sit === s));
  el.motLbl.textContent = s === 'falta' ? 'Motivo da falta *' : s === 'presente' ? 'Registro do dia *' : 'Motivo *';
  const lista = s ? [...MOTIVOS[s]] : [];
  if (extra && !lista.some(([t]) => t === extra)) lista.push([extra, OC_LABEL[extra] || extra]);   // registro antigo (ex.: advertência)
  el.mot.innerHTML = s ? lista.map(([t, l]) => {
    const [c, bg] = COR_MOT[t] || ['#475569', '#f1f5f9'];
    return `<button type="button" data-t="${t}" style="--c:${c};--bg:${bg}">${l}</button>`;
  }).join('') : '<span class="ocf-mot-vazio">Escolha primeiro se a pessoa veio ou faltou.</span>';
  el.mot.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setTipo(b.dataset.t)));
}
function setTipo(t) {
  el.tipo.value = t;
  el.mot.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  mostrar(el.dec, TIPOS_COM_HORAS.includes(t));
  mostrar(el.abonoLinha, t === 'declaracao');          // na falta com declaração, abona as horas da própria declaração
  mostrar(el.outro, t === 'elogio');
  mostrar(el.ferias, t === 'ferias');
  mostrar(el.atraso, t === 'atraso');
  if (t === 'atraso') calcAtraso();
  avisoDec();
}
const outroConta = () => [...el.outroConta].find(r => r.checked)?.value || 'presenca';

export function resetFormOc() {
  setSituacao('');
  el.tipo.value = ''; el.horas.value = ''; el.abono.value = ''; delete el.abono.dataset.mexido;
  el.outroConta.forEach(r => { r.checked = r.value === 'presenca'; });
  el.chegada.value = ''; el.horasAtraso.value = '';
  [el.dec, el.outro, el.ferias, el.atraso].forEach(n => mostrar(n, false));
}

export function preencherFormOc(o) {
  resetFormOc();
  setSituacao(TIPOS_AUSENTE.includes(o.tipo) ? 'falta' : 'presente', o.tipo);
  setTipo(o.tipo);
  if (o.tipo === 'atraso') { el.horasAtraso.value = o.horas ?? ''; el.chegada.value = hhmm(o.hora_chegada); }
  else el.horas.value = o.horas ?? '';
  el.abono.value = o.horas_abono ?? '';
  if (o.horas_abono != null) el.abono.dataset.mexido = '1';
  el.outroConta.forEach(r => { r.checked = r.value === (o.conta_como_falta ? 'falta' : 'presenca'); });
  avisoDec();
}

// Lê os campos. Devolve { erro } ou { tipo, presente, conta_como_falta, horas, horas_abono, hora_chegada }
export function lerFormOc() {
  if (!situacao) return { erro: 'Escolha se a pessoa estava presente ou faltou.' };
  const tipo = el.tipo.value;
  if (!tipo) return { erro: 'Escolha o motivo.' };
  const num = v => parseFloat(String(v).replace(',', '.'));
  let horas = null, horas_abono = null, hora_chegada = null;
  if (tipo === 'atraso') {
    horas = num(el.horasAtraso.value);
    if (!horas || horas <= 0) { el.chegada.focus(); return { erro: el.chegada.value ? 'Pelo horário informado não houve atraso (entrada às 07:00).' : 'Informe a hora em que a pessoa chegou.' }; }
    hora_chegada = el.chegada.value || null;
  }
  if (TIPOS_COM_HORAS.includes(tipo)) {
    horas = num(el.horas.value);
    if (!horas || horas <= 0) { el.horas.focus(); return { erro: 'Informe quantas horas a declaração cobre.' }; }
    if (tipo === 'falta_declaracao') horas_abono = horas;
    else {
      horas_abono = el.abono.value === '' ? horas : num(el.abono.value);
      if (isNaN(horas_abono) || horas_abono < 0) { el.abono.focus(); return { erro: 'Informe quantas horas abonar (pode ser 0).' }; }
      if (horas_abono > horas) { el.abono.focus(); return { erro: 'As horas abonadas não podem passar das horas da declaração.' }; }
    }
  }
  const conta = TIPOS_FALTA.includes(tipo) || (tipo === 'elogio' && outroConta() === 'falta');
  const presente = !TIPOS_AUSENTE.includes(tipo) && !conta;
  return { tipo, presente, conta_como_falta: conta, horas, horas_abono, hora_chegada };
}

// Grava a ocorrência. Se as colunas de horas ainda não existirem no banco (patch 40 não rodado),
// grava sem elas e coloca as horas no começo da descrição para não perder a informação.
export async function gravarOcorrencia(supabase, id, payload) {
  const exec = p => id ? supabase.from('ocorrencias').update(p).eq('id', id) : supabase.from('ocorrencias').insert(p);
  let { error } = await exec(payload);
  // Coluna hora_chegada ainda não existe (patch 41 não rodado): grava o horário na descrição
  if (error && /hora_chegada/i.test(error.message || '')) {
    const { hora_chegada, ...resto } = payload;
    if (hora_chegada) resto.descricao = `Chegou às ${hhmm(hora_chegada)}${resto.descricao ? ' — ' + resto.descricao : ''}`;
    payload = resto;
    ({ error } = await exec(payload));
  }
  if (error && /horas/i.test(error.message || '')) {
    const { horas, horas_abono, ...resto } = payload;
    if (horas) {
      const tr = payload.tipo === 'falta_declaracao' ? 'abonadas; restante do dia como falta' : horas_abono > 0 ? `abonou ${fmtHoras(horas_abono)}` : 'sem abono';
      resto.descricao = payload.tipo === 'atraso' ? `Atraso de ${fmtHoras(horas)}${resto.descricao ? ' — ' + resto.descricao : ''}`
        : `Declaração de ${fmtHoras(horas)} (${tr})${resto.descricao ? ' — ' + resto.descricao : ''}`;
    }
    ({ error } = await exec(resto));
  }
  return { error };
}
