import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { icon } from './icons.js';

const SUPABASE_URL  = 'https://skcfiorztsqzraulqmuj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrY2Zpb3J6dHNxenJhdWxxbXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDg2OTgsImV4cCI6MjA5NzcyNDY5OH0.UEzcpwVnnXOb4qV1oZRVkT5VHVIXVGnkKZH2f_gatWw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ── Formatters ── */
export const moeda = v =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export const peso = v =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' kg';

export const ton = v =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((v ?? 0) / 1000) + ' ton';

export const dataBR = s => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

/* ── Toast ── */
export function toast(msg, type = 'success') {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const ic = { success: 'check', error: 'x-circle', info: 'info' };
  t.innerHTML = `<span>${icon(ic[type] ?? 'info', { size: 16 })}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 3200);
  setTimeout(() => t.remove(), 3600);
}

/* ── Auth helpers ── */
export async function getPerfilUsuario() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

export async function renderUserInfo() {
  const perfil = await getPerfilUsuario();
  const el = document.getElementById('user-info');
  if (!el || !perfil) return;
  el.innerHTML = `
    <strong>${perfil.nome}</strong>
    <span>${perfil.role === 'admin' ? 'Administrador' : 'Visitante'}</span>
  `;
}

export async function logout() {
  await supabase.auth.signOut();
  location.href = 'index.html';
}

/* ── Modal helpers ── */
export function abrirModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

export function fecharModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('open');
    const form = m.querySelector('form');
    if (form) form.reset();
    const hiddenId = m.querySelector('[name="id"]');
    if (hiddenId) hiddenId.value = '';
  }
}

/* ── Active nav ── */
export function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page) a.classList.add('active');
  });
}

/* ── Mobile menu ── */
export function initMobileMenu() {
  const btn     = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!btn || !sidebar || !overlay) return;

  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

/* ── Guard: redirect to login if not authenticated ── */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { location.href = 'index.html'; return null; }
  return session;
}

/* ── Guard: redirect to dashboard if already authenticated ── */
export async function redirectIfAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) location.href = 'dashboard.html';
}

/* ── Sidebar HTML ── */
export function sidebarHTML() {
  return `
    <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">♻</div>
        <div>
          <h1>SGR Indaiatuba</h1>
          <span>UVRR Indaiatuba</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <a href="dashboard.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </a>
        <div class="nav-section">Operacional</div>
        <a href="entradas.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          Entradas
        </a>
        <a href="producao.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>
          Produção
        </a>
        <a href="estoque.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-8 0v2"/></svg>
          Estoque
        </a>
        <a href="equipamentos.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Equipamentos
        </a>
        <div class="nav-section">Comercial</div>
        <a href="comercial.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          Comercial
        </a>
        <a href="notas-fiscais.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
          Notas Fiscais
        </a>
        <div class="nav-section">Qualidade</div>
        <a href="cargas.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          Estudo de Cargas
        </a>
        <div class="nav-section">Pessoas</div>
        <a href="rh.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          RH
        </a>
        <div class="nav-section">Gestão</div>
        <a href="tarefas.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          Tarefas
        </a>
        <div class="nav-section">Relatórios</div>
        <a href="relatorio-diario.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>
          Relatório Diário
        </a>
        <a href="rnc.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Não Conformidade
        </a>
      </nav>
      <div class="sidebar-footer">
        <button class="btn-rotina" id="btn-rotina" onclick="window._abrirRotina && window._abrirRotina()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Iniciar Rotina Diária
        </button>
        <div class="user-info" id="user-info">
          <strong>Carregando…</strong>
        </div>
        <button class="btn-logout" id="btn-logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </div>
    </aside>
  `;
}

/* ── Init common page stuff ── */
export async function initPage() {
  await requireAuth();
  document.body.insertAdjacentHTML('afterbegin', sidebarHTML());
  setActiveNav();
  renderUserInfo();
  initMobileMenu();
  document.getElementById('btn-logout')?.addEventListener('click', logout);
  initSidebarToggle();
  initRotina();
}

// ── Rotina Diária ─────────────────────────────────────────────────────────────
const _ROTINA_TODAY = new Date().toISOString().split('T')[0];
const _ROTINA_KEY   = 'sgr_rotina_' + _ROTINA_TODAY;

const MODULOS_ROTINA = [
  { id:'entradas',      label:'Entradas',          href:'entradas.html',          icon:'inbox',         desc:'Registrar entradas de materiais' },
  { id:'producao',      label:'Produção',           href:'producao.html',          icon:'bar-chart',     desc:'Atualizar dados de produção' },
  { id:'estoque',       label:'Estoque',            href:'estoque.html',           icon:'package',       desc:'Verificar e atualizar estoque' },
  { id:'equipamentos',  label:'Equipamentos',       href:'equipamentos.html',      icon:'wrench',        desc:'Status dos equipamentos' },
  { id:'comercial',     label:'Comercial',          href:'comercial.html',         icon:'cart',          desc:'Dados comerciais e metas' },
  { id:'rh',            label:'RH',                 href:'rh.html',                icon:'users',         desc:'Recursos humanos' },
  { id:'tarefas',       label:'Tarefas',            href:'tarefas.html',           icon:'check-circle',  desc:'Gerenciar tarefas do dia' },
  { id:'relatorio',     label:'Relatório Comitê',   href:'dashboard.html',         icon:'bar-chart',     desc:'Relatório para diretoria' },
  { id:'rel-diario',    label:'Relatório Diário',   href:'relatorio-diario.html',  icon:'list',          desc:'Relatório diário de operações' },
];

function _rotinaGetState()  { try { return JSON.parse(localStorage.getItem(_ROTINA_KEY)); } catch { return null; } }
function _rotinaSetState(s) { localStorage.setItem(_ROTINA_KEY, JSON.stringify(s)); }
function _rotinaCurrentPage() { return location.pathname.split('/').pop() || 'index.html'; }

function initRotina() {
  window._abrirRotina = () => {
    localStorage.removeItem(_ROTINA_KEY);
    document.getElementById('rotina-overlay')?.remove();
    document.getElementById('rotina-bar')?.remove();
    _bloquearNav(false);
    document.body.style.overflow = '';
    _showSelecao();
  };

  const state = _rotinaGetState();
  if (!state) { _showSelecao(); return; }
  if (state.pulada || state.completa) return;

  const modAtual = MODULOS_ROTINA.find(m => m.id === state.modulos[state.atual]);
  if (!modAtual) return;
  if (_rotinaCurrentPage() !== modAtual.href) { location.href = modAtual.href; return; }
  _showProgressBar(state);
  _bloquearNav(true);
}

function _showSelecao() {
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
          ${MODULOS_ROTINA.map(m => `
            <label class="rotina-mod-item" id="lbl-${m.id}">
              <input type="checkbox" class="rotina-cb" value="${m.id}" onchange="rotinaToggle(this,'${m.id}')" />
              <span class="rotina-mod-icon">${icon(m.icon, { size: 20 })}</span>
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

  window.rotinaToggle = (cb, id) => {
    document.getElementById('lbl-' + id).classList.toggle('selected', cb.checked);
    const n = document.querySelectorAll('#rotina-modulos .rotina-cb:checked').length;
    document.getElementById('btn-iniciar-rotina').disabled = n === 0;
  };

  window.rotinaIniciar = () => {
    const modulos = [...document.querySelectorAll('#rotina-modulos .rotina-cb:checked')].map(cb => cb.value);
    if (!modulos.length) return;
    _rotinaSetState({ data: _ROTINA_TODAY, modulos, atual: 0, completa: false });
    const primeiro = MODULOS_ROTINA.find(m => m.id === modulos[0]);
    location.href = primeiro.href;
  };

  window.rotinaPular = () => {
    _rotinaSetState({ data: _ROTINA_TODAY, pulada: true });
    overlay.remove();
    document.body.style.overflow = '';
  };
}

function _showProgressBar(state) {
  const isLast = state.atual === state.modulos.length - 1;
  const done   = state.atual;
  const total  = state.modulos.length;

  const steps = state.modulos.map((mId, i) => {
    const m    = MODULOS_ROTINA.find(x => x.id === mId);
    const icon = i < done ? '✓' : i === done ? '●' : '○';
    const cls  = i < done ? 'step-done' : i === done ? 'step-current' : 'step-pending';
    return `<span class="rotina-step ${cls}">${icon}&nbsp;${m?.label || mId}</span>`;
  }).join('<span class="rotina-step-sep">›</span>');

  const bar = document.createElement('div');
  bar.id = 'rotina-bar';
  bar.innerHTML = `
    <div class="rotina-bar-brand"><span>♻</span><span class="rotina-bar-label">Rotina Diária</span></div>
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
      _rotinaSetState({ ...state, completa: true });
      _showConclusao();
    } else {
      _rotinaSetState({ ...state, atual: novoAtual });
      const prox = MODULOS_ROTINA.find(m => m.id === state.modulos[novoAtual]);
      location.href = prox.href;
    }
  };
}

function _showConclusao() {
  _bloquearNav(false);
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

function _bloquearNav(bloquear) {
  document.body.classList.toggle('rotina-ativa', bloquear);
}

function initSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const btn = document.createElement('button');
  btn.className = 'sidebar-toggle';
  btn.title = 'Recolher/expandir menu';
  btn.innerHTML = '☰';
  document.body.appendChild(btn);

  function setCollapsed(val) {
    sidebar.classList.toggle('collapsed', val);
    document.body.classList.toggle('sidebar-collapsed', val);
    btn.classList.toggle('open', !val);
    localStorage.setItem('sidebar-collapsed', val ? '1' : '0');
  }

  setCollapsed(localStorage.getItem('sidebar-collapsed') === '1');

  btn.addEventListener('click', () => {
    setCollapsed(!sidebar.classList.contains('collapsed'));
  });
}

/* ── Period helpers ── */
export function mesAtual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

export function anoAtual() {
  return new Date().getFullYear();
}
