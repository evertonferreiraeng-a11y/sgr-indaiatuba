import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

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
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  t.innerHTML = `<span>${icons[type] ?? '●'}</span><span>${msg}</span>`;
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
        <h1>SGR Indaiatuba</h1>
        <span>UVRR Indaiatuba</span>
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
        <div class="nav-section">Comercial / Financeiro</div>
        <a href="comercial.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          Comercial
        </a>
        <a href="financeiro.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>
          Financeiro
        </a>
        <div class="nav-section">Pessoas</div>
        <a href="rh.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          RH
        </a>
      </nav>
      <div class="sidebar-footer">
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
}

/* ── Period helpers ── */
export function mesAtual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

export function anoAtual() {
  return new Date().getFullYear();
}
