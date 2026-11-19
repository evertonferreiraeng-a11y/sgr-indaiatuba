// Formulário de ocorrência compartilhado (colaborador-ocorrencias.html e rh.html)
// Primeiro escolhe a situação do dia (Presente ou Falta), depois o motivo.
// O "tipo" gravado no banco continua o mesmo de sempre:
//   Falta    → falta (injustificada) · atestado (justificada) · falta_declaracao (declaração de horas, faltou o resto) · ferias
//   Presente → outro (normal) · declaracao (com horas) · advertencia · elogio (outro)

export const TIPOS_FALTA = ['falta', 'atestado', 'falta_declaracao', 'ferias'];
export const TIPOS_COM_HORAS = ['declaracao', 'falta_declaracao'];

export const MOTIVOS = {
  falta:    [['falta', 'Injustificada'], ['atestado', 'Justificada (atestado)'], ['falta_declaracao', 'Declaração de horas'], ['ferias', 'Férias']],
  presente: [['outro', 'Normal'], ['declaracao', 'Declaração de horas'], ['advertencia', 'Advertência'], ['elogio', 'Outro']],
};

// Nome completo de cada tipo (histórico, legenda, resumo)
export const OC_LABEL = {
  falta: 'Falta injustificada', atestado: 'Falta justificada', falta_declaracao: 'Falta c/ declaração', ferias: 'Férias',
  outro: 'Presente', declaracao: 'Declaração', advertencia: 'Advertência', elogio: 'Outro',
};

const fmtHoras = h => {
  const v = parseFloat(h); if (!v) return '';
  const hh = Math.floor(v), mm = Math.round((v - hh) * 60);
  return mm ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`;
};
export { fmtHoras };

// Rótulo de uma ocorrência; inclui as horas da declaração quando houver
export function rotuloOc(o) {
  const base = OC_LABEL[o.tipo] || o.tipo;
  return TIPOS_COM_HORAS.includes(o.tipo) && o.horas ? `${base} · ${fmtHoras(o.horas)}` : base;
}

// Rótulo do calendário em duas partes: situação do dia + motivo
export function rotuloCal(o) {
  const falta = TIPOS_FALTA.includes(o.tipo);
  const h = o.horas ? ' ' + fmtHoras(o.horas) : '';
  const mot = { falta: 'injustificada', atestado: 'justificada', falta_declaracao: `declaração${h}`, ferias: 'férias', outro: '',
    declaracao: `declaração${h}`, advertencia: 'advertência', elogio: 'outro' }[o.tipo] ?? '';
  return { situacao: falta ? 'Falta' : 'Presente', motivo: mot };
}

const CSS = `
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
  .ocf-horas { display:flex; align-items:center; gap:8px; }
  .ocf-horas input { width:110px; }
  .ocf-horas span { font-size:12.5px; color:#64748b; }
`;
const COR_MOT = {
  falta: ['#b91c1c', '#fef2f2'], atestado: ['#b45309', '#fffbeb'], falta_declaracao: ['#9a3412', '#fff7ed'], ferias: ['#0369a1', '#f0f9ff'],
  outro: ['#15803d', '#f0fdf4'], declaracao: ['#6d28d9', '#f5f3ff'], advertencia: ['#be123c', '#fff1f2'], elogio: ['#475569', '#f1f5f9'],
};

let el = {};

// Desenha os campos dentro do container (no lugar dos antigos Tipo / Presença no dia / Conta como falta)
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
    <div class="form-group full" id="ocf-horas-wrap" hidden><label>Horas da declaração *</label>
      <div class="ocf-horas"><input type="number" name="horas" min="0.25" max="24" step="0.25" placeholder="ex.: 1,5" /><span>horas (1,5 = 1h30)</span></div>
    </div>
    <div class="form-group full">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:600">
        <input type="checkbox" name="conta_como_falta" id="chk-conta-falta" style="width:16px;height:16px;accent-color:#dc2626" />
        <span>Conta como falta no KPI?</span>
      </label>
      <p style="margin:4px 0 0 26px;font-size:12px;color:#64748b">Marca sozinho quando a situação é Falta. Pode mudar se precisar.</p>
    </div>`;
  el = {
    sit: container.querySelectorAll('.ocf-sit button'),
    tipo: container.querySelector('[name="tipo"]'),
    mot: container.querySelector('#ocf-mot'),
    motLbl: container.querySelector('#ocf-mot-lbl'),
    horasWrap: container.querySelector('#ocf-horas-wrap'),
    horas: container.querySelector('[name="horas"]'),
    chk: container.querySelector('#chk-conta-falta'),
  };
  el.sit.forEach(b => b.addEventListener('click', () => { setSituacao(b.dataset.sit); setTipo(b.dataset.sit === 'falta' ? 'falta' : 'outro'); }));
  setSituacao('');
}

let situacao = '';
function setSituacao(s) {
  situacao = s;
  el.sit.forEach(b => b.classList.toggle('on', b.dataset.sit === s));
  el.motLbl.textContent = s === 'falta' ? 'Motivo da falta *' : s === 'presente' ? 'Registro do dia' : 'Motivo *';
  el.mot.innerHTML = s ? MOTIVOS[s].map(([t, l]) => {
    const [c, bg] = COR_MOT[t];
    return `<button type="button" data-t="${t}" style="--c:${c};--bg:${bg}">${l}</button>`;
  }).join('') : '<span class="ocf-mot-vazio">Escolha primeiro se a pessoa veio ou faltou.</span>';
  el.mot.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setTipo(b.dataset.t)));
}
function setTipo(t, manterChk = false) {
  el.tipo.value = t;
  el.mot.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  el.horasWrap.hidden = !TIPOS_COM_HORAS.includes(t);
  if (!manterChk) el.chk.checked = TIPOS_FALTA.includes(t);
}

export function resetFormOc() {
  setSituacao('');
  el.tipo.value = ''; el.horas.value = ''; el.horasWrap.hidden = true; el.chk.checked = false;
}

export function preencherFormOc(o) {
  setSituacao(TIPOS_FALTA.includes(o.tipo) ? 'falta' : 'presente');
  setTipo(o.tipo, true);
  el.chk.checked = !!o.conta_como_falta;
  el.horas.value = o.horas ?? '';
}

// Lê os campos. Devolve { erro } ou { tipo, presente, conta_como_falta, horas }
export function lerFormOc() {
  if (!situacao) return { erro: 'Escolha se a pessoa estava presente ou faltou.' };
  const tipo = el.tipo.value;
  if (!tipo) return { erro: 'Escolha o motivo.' };
  let horas = null;
  if (TIPOS_COM_HORAS.includes(tipo)) {
    horas = parseFloat(String(el.horas.value).replace(',', '.'));
    if (!horas || horas <= 0) { el.horas.focus(); return { erro: 'Informe quantas horas a declaração cobre.' }; }
  }
  return { tipo, presente: !TIPOS_FALTA.includes(tipo), conta_como_falta: el.chk.checked, horas };
}

// Grava a ocorrência. Se a coluna "horas" ainda não existir no banco (patch 39 não rodado),
// grava sem ela e coloca as horas no começo da descrição para não perder a informação.
export async function gravarOcorrencia(supabase, id, payload) {
  const exec = p => id ? supabase.from('ocorrencias').update(p).eq('id', id) : supabase.from('ocorrencias').insert(p);
  let { error } = await exec(payload);
  if (error && /horas/i.test(error.message || '')) {
    const { horas, ...resto } = payload;
    if (horas) resto.descricao = `Declaração de ${fmtHoras(horas)}${resto.descricao ? ' — ' + resto.descricao : ''}`;
    ({ error } = await exec(resto));
  }
  return { error };
}
