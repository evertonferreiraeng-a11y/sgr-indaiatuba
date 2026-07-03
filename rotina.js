// ── Rotina Diária ─────────────────────────────────────────────────────────────
// Guia o usuário pelos módulos selecionados antes de liberar o sistema.

const TODAY = new Date().toISOString().split('T')[0];
const KEY   = 'sgr_rotina_' + TODAY;

export const MODULOS = [
  { id:'entradas',      label:'Entradas',          href:'entradas.html',          icon:'📥', desc:'Registrar entradas de materiais' },
  { id:'producao',      label:'Produção',           href:'producao.html',          icon:'⚙️', desc:'Atualizar dados de produção' },
  { id:'estoque',       label:'Estoque',            href:'estoque.html',           icon:'📦', desc:'Verificar e atualizar estoque' },
  { id:'equipamentos',  label:'Equipamentos',       href:'equipamentos.html',      icon:'🔧', desc:'Status dos equipamentos' },
  { id:'comercial',     label:'Comercial',          href:'comercial.html',         icon:'🛒', desc:'Dados comerciais e metas' },
  { id:'financeiro',    label:'Financeiro',         href:'financeiro.html',        icon:'💰', desc:'Informações financeiras' },
  { id:'rh',            label:'RH',                 href:'rh.html',                icon:'👥', desc:'Recursos humanos' },
  { id:'tarefas',       label:'Tarefas',            href:'tarefas.html',           icon:'✅', desc:'Gerenciar tarefas do dia' },
  { id:'relatorio',     label:'Relatório Comitê',   href:'relatorio.html',         icon:'📊', desc:'Relatório para diretoria' },
  { id:'rel-diario',    label:'Relatório Diário',   href:'relatorio-diario.html',  icon:'📋', desc:'Relatório diário de operações' },
];

function getState()    { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
function setState(s)   { localStorage.setItem(KEY, JSON.stringify(s)); }
function currentPage() { return location.pathname.split('/').pop() || 'index.html'; }

// ── Entry point ───────────────────────────────────────────────────────────────
export function initRotina() {
  // Expõe função global para o botão da sidebar
  window._abrirRotina = () => {
    // Limpa estado do dia e reabre seleção
    localStorage.removeItem(KEY);
    document.getElementById('rotina-overlay')?.remove();
    document.getElementById('rotina-bar')?.remove();
    bloquearNav(false);
    document.body.style.overflow = '';
    showSelecao();
  };

  const state = getState();

  if (!state) {
    showSelecao();
    return;
  }
  if (state.pulada || state.completa) return;

  // Em andamento — redireciona se página errada
  const modAtual = MODULOS.find(m => m.id === state.modulos[state.atual]);
  if (!modAtual) return;
  if (currentPage() !== modAtual.href) {
    location.href = modAtual.href;
    return;
  }
  showProgressBar(state);
  bloquearNav(true);
}

// ── Tela de seleção ───────────────────────────────────────────────────────────
function showSelecao() {
  const h = new Date().getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';

  const overlay = document.createElement('div');
  overlay.id = 'rotina-overlay';
  overlay.innerHTML = `
    <div class="rotina-card">
      <div class="rotina-card-hd">
        <div class="rotina-wave">♻</div>
        <div class="rotina-saudacao">${saudacao}! 👋</div>
        <div class="rotina-sub">Selecione os módulos que deseja atualizar hoje antes de acessar o sistema.</div>
      </div>
      <div class="rotina-card-body">
        <div class="rotina-section-label">Módulos disponíveis</div>
        <div class="rotina-grid" id="rotina-modulos">
          ${MODULOS.map(m => `
            <label class="rotina-mod-item" id="lbl-${m.id}">
              <input type="checkbox" class="rotina-cb" value="${m.id}" onchange="rotinaToggle(this,'${m.id}')" />
              <span class="rotina-mod-icon">${m.icon}</span>
              <div class="rotina-mod-info">
                <div class="rotina-mod-label">${m.label}</div>
                <div class="rotina-mod-desc">${m.desc}</div>
              </div>
            </label>`).join('')}
        </div>
        <div class="rotina-footer">
          <button class="rotina-btn-pular" onclick="rotinaPular()">Pular por hoje →</button>
          <button class="rotina-btn-iniciar" id="btn-iniciar-rotina" disabled onclick="rotinaIniciar()">
            Iniciar Rotina →
          </button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Funções globais usadas pelos handlers inline
  window.rotinaToggle = (cb, id) => {
    const lbl = document.getElementById('lbl-' + id);
    lbl.classList.toggle('selected', cb.checked);
    const n = document.querySelectorAll('#rotina-modulos .rotina-cb:checked').length;
    document.getElementById('btn-iniciar-rotina').disabled = n === 0;
  };

  window.rotinaIniciar = () => {
    const modulos = [...document.querySelectorAll('#rotina-modulos .rotina-cb:checked')].map(cb => cb.value);
    if (!modulos.length) return;
    setState({ data: TODAY, modulos, atual: 0, completa: false });
    const primeiro = MODULOS.find(m => m.id === modulos[0]);
    location.href = primeiro.href;
  };

  window.rotinaPular = () => {
    setState({ data: TODAY, pulada: true });
    overlay.remove();
    document.body.style.overflow = '';
  };
}

// ── Barra de progresso (durante a rotina) ─────────────────────────────────────
function showProgressBar(state) {
  const isLast = state.atual === state.modulos.length - 1;
  const done   = state.atual;
  const total  = state.modulos.length;

  const steps = state.modulos.map((mId, i) => {
    const m    = MODULOS.find(x => x.id === mId);
    const icon = i < done ? '✓' : i === done ? '●' : '○';
    const cls  = i < done ? 'step-done' : i === done ? 'step-current' : 'step-pending';
    return `<span class="rotina-step ${cls}">${icon}&nbsp;${m?.label || mId}</span>`;
  }).join('<span class="rotina-step-sep">›</span>');

  const bar = document.createElement('div');
  bar.id = 'rotina-bar';
  bar.innerHTML = `
    <div class="rotina-bar-brand">
      <span>♻</span>
      <span class="rotina-bar-label">Rotina Diária</span>
    </div>
    <div class="rotina-bar-sep"></div>
    <div class="rotina-steps">${steps}</div>
    <div class="rotina-bar-actions">
      <span class="rotina-bar-count">${done}/${total} concluídos</span>
      <button class="rotina-btn-avancar" onclick="rotinaAvancar()">
        ${isLast ? '✓ Finalizar Rotina' : '✓ Concluído, próximo →'}
      </button>
    </div>`;

  document.body.prepend(bar);
  document.body.classList.add('rotina-ativa');

  window.rotinaAvancar = () => {
    const novoAtual = state.atual + 1;
    if (novoAtual >= state.modulos.length) {
      setState({ ...state, completa: true });
      showConclusao();
    } else {
      setState({ ...state, atual: novoAtual });
      const prox = MODULOS.find(m => m.id === state.modulos[novoAtual]);
      location.href = prox.href;
    }
  };
}

// ── Tela de conclusão ─────────────────────────────────────────────────────────
function showConclusao() {
  bloquearNav(false);
  document.getElementById('rotina-bar')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'rotina-overlay';
  overlay.innerHTML = `
    <div class="rotina-card rotina-card-conclusao">
      <div class="rotina-card-hd rotina-hd-success">
        <div style="font-size:56px;margin-bottom:12px">🎉</div>
        <div class="rotina-saudacao">Rotina Concluída!</div>
        <div class="rotina-sub">Todos os módulos foram atualizados com sucesso.</div>
      </div>
      <div class="rotina-card-body" style="text-align:center;padding:32px 36px">
        <div style="font-size:14px;color:#64748b;line-height:1.7;margin-bottom:28px">
          Ótimo trabalho! O sistema está atualizado e pronto para uso.<br>
          Você pode acessar qualquer módulo normalmente agora.
        </div>
        <button class="rotina-btn-iniciar" style="width:100%;justify-content:center;font-size:15px;padding:14px"
          onclick="rotinaFinalizar()">
          ✓ Finalizar e acessar o sistema
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  window.rotinaFinalizar = () => {
    overlay.remove();
    document.body.style.overflow = '';
    document.body.classList.remove('rotina-ativa');
    const main = document.querySelector('.main-content');
    if (main) main.style.paddingTop = '';
  };
}

// ── Bloqueia links da sidebar durante rotina ───────────────────────────────────
function bloquearNav(bloquear) {
  document.body.classList.toggle('rotina-ativa', bloquear);
}
