// ── Simulação ─────────────────────────────────────────────────────────────────
// Mostra, como um vídeo, o passo a passo de uma tela: um cursor anda até cada
// botão/campo, o lugar fica em destaque e uma legenda explica o que fazer.
// Os campos são preenchidos com exemplos, mas nada é salvo: só são clicados
// botões que abrem janelas/abas, e no fim tudo volta a ser como estava.

// ── Helpers para achar elementos ──────────────────────────────────────────────
const $ = s => document.querySelector(s);

// Campo de formulário pelo texto do rótulo, dentro de um container
function campo(container, rotulo) {
  return () => {
    const box = typeof container === 'string' ? $(container) : container;
    if (!box) return null;
    const lbl = [...box.querySelectorAll('label')].find(l => l.textContent.trim().startsWith(rotulo));
    if (!lbl) return null;
    return lbl.parentElement.querySelector('input:not([type=hidden]), select, textarea')
        || lbl.nextElementSibling;
  };
}

// Elemento pelo texto (ex.: botão "+ Novo Estudo")
function porTexto(seletor, texto) {
  return () => [...document.querySelectorAll(seletor)].find(e => e.textContent.trim().includes(texto) && visivel(e)) || null;
}

function visivel(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
}

function hoje() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

// Fecha as janelas (modais) abertas pela simulação
function fecharModais() {
  document.querySelectorAll('.modal-backdrop.open, .modal-overlay.open').forEach(m => m.classList.remove('open'));
}

// ── Roteiros por tela ─────────────────────────────────────────────────────────
// Cada passo: { alvo, texto, clicar?, digitar?, fantasma?, antes? }
//   alvo:     seletor CSS ou função que devolve o elemento (sem alvo = só legenda)
//   clicar:   clica de verdade (usar só em botões que abrem janela/aba)
//   digitar:  preenche o campo com um exemplo (é desfeito no fim)
//   fantasma: mostra um texto por cima do alvo, sem mexer nele
//   antes:    função executada antes do passo
const ROTEIROS = {
  'entradas.html': [
    { alvo: () => $('#csv-import')?.closest('label'), texto: 'Todo início de mês, peça à balança a <b>planilha de pesagens do mês anterior</b>. Com o arquivo salvo, clique em <b>Importar CSV</b> e escolha a planilha.' },
    { alvo: () => $('#tab-registro .table-card') || $('#tab-registro'), texto: 'Depois, confira aqui na lista se as entradas do mês apareceram e se os totais fazem sentido.' },
    { alvo: '#btn-nova-entrada', clicar: true, texto: 'Se faltar alguma pesagem, lance à mão: clique em <b>Nova Entrada</b>.' },
    { alvo: campo('#modal-entrada', 'Data'), digitar: hoje(), texto: 'Preencha a <b>Data</b> da pesagem.' },
    { alvo: campo('#modal-entrada', 'Fornecedor'), digitar: 'Fornecedor (exemplo)', texto: 'Escolha o <b>Fornecedor</b>.' },
    { alvo: campo('#modal-entrada', 'Material'), digitar: 'Material (exemplo)', texto: 'Escolha o <b>Material</b>.' },
    { alvo: campo('#modal-entrada', 'Pesagem 1'), digitar: '15000', texto: '<b>Pesagem 1</b>: o peso do caminhão <b>cheio</b>.' },
    { alvo: campo('#modal-entrada', 'Pesagem 2'), digitar: '6000', texto: '<b>Pesagem 2 / Tara</b>: o peso do caminhão <b>vazio</b>.' },
    { alvo: campo('#modal-entrada', 'Peso Líquido (kg)'), texto: 'O <b>Peso Líquido</b> é calculado sozinho.' },
    { alvo: '#btn-salvar-entrada', texto: 'Por fim, clique em <b>Salvar</b> e confira se a entrada apareceu na lista.' },
  ],

  'producao.html': [
    { alvo: '.prod-tab[data-tab="prensagem"]', clicar: true, texto: 'No <b>fim do dia</b>, lance a produção. A aba <b>Prensagem</b> é onde ficam os fardos.' },
    { alvo: '#btn-nova', clicar: true, texto: 'Clique em <b>+ Novo Registro</b>.' },
    { alvo: campo('#modal-prod', 'Data'), digitar: hoje(), texto: 'Preencha a <b>Data</b>.' },
    { alvo: campo('#modal-prod', 'Equipamento'), digitar: 'Prensa Vertical', texto: 'Escolha a prensa em <b>Equipamento</b>.' },
    { alvo: campo('#modal-prod', 'Material'), digitar: 'Aparas de Papelão', texto: 'Em <b>Material</b>, escolha <b>Aparas de Papelão</b> ou <b>Aparas de Plástico</b>.' },
    { alvo: campo('#modal-prod', 'Operador'), digitar: 'Operador (exemplo)', texto: 'Escolha o <b>Operador</b>.' },
    { alvo: campo('#modal-prod', 'Peso Produzido'), digitar: '850', texto: 'Digite o <b>Peso Produzido (kg)</b>.' },
    { alvo: campo('#modal-prod', 'Quantidade de Fardos'), digitar: '3', texto: 'E a <b>Quantidade de Fardos</b>.' },
    { alvo: '#btn-salvar-prod', texto: 'Clique em <b>Salvar</b>. Repita para cada prensa ou operador do dia.' },
    { antes: fecharModais, alvo: '.prod-tab[data-tab="triagem"]', clicar: true, texto: 'Se houve triagem, abra a aba <b>Triagem de Cargas</b>.' },
    { alvo: '#tri-btn-nova', clicar: true, texto: 'Clique em <b>+ Nova Triagem</b>.' },
    { alvo: campo('#modal-triagem', 'Cliente'), digitar: 'Cliente (exemplo)', texto: 'Informe o <b>Cliente</b> da carga.' },
    { alvo: campo('#modal-triagem', 'Hora Início'), digitar: '07:00', texto: 'O horário de <b>início</b>…' },
    { alvo: campo('#modal-triagem', 'Hora Fim'), digitar: '16:00', texto: '…e o de <b>fim</b>.' },
    { alvo: campo('#modal-triagem', 'Pausa'), digitar: '60', texto: 'A <b>Pausa</b> em minutos (ex.: 60 de almoço).' },
    { alvo: campo('#modal-triagem', 'Peso Triado'), digitar: '1200', texto: 'E o <b>Peso Triado (kg)</b>.' },
    { alvo: '#btn-salvar-triagem', texto: 'Clique em <b>Salvar</b>.' },
  ],

  'estoque.html': [
    { alvo: '#tb-estoque', texto: 'No <b>fim da tarde</b>, depois que a produção terminou, atualize o estoque nesta lista.' },
    { alvo: () => $('#tb-estoque td.edit-cell') || $('#tb-estoque'), fantasma: '12.500', texto: 'Clique no número de <b>Kg em Estoque</b> do material e digite a quantidade atual.' },
    { alvo: () => $('#tb-estoque td.edit-cell') || $('#tb-estoque'), texto: 'Depois clique fora do campo: o valor é <b>salvo sozinho</b>. Repita para cada material.' },
    { alvo: '#btn-add-mat', texto: '<b>+ Adicionar Material</b> só é usado quando aparece um material que ainda não está na lista.' },
  ],

  'equipamentos.html': [
    { alvo: () => $('#snap-dia-lista')?.parentElement, texto: 'No <b>início do dia</b>, vá ao quadro <b>Disponibilidade do Dia</b>.' },
    { alvo: '#snap-data', texto: 'A data já vem em <b>hoje</b>. O botão <b>Hoje</b> volta para a data atual.' },
    { alvo: () => $('#snap-dia-lista > div') || $('#snap-dia-lista'), texto: 'Em cada equipamento, escolha o status: <b>Operando</b>, <b>Restrição</b> ou <b>Parado</b>.' },
    { alvo: () => document.querySelectorAll('#snap-dia-lista .status-btn')[2] || $('#snap-dia-lista'), texto: 'Se a máquina estiver parada ou com restrição, registre o motivo nas <b>Observações</b> do equipamento.' },
    { alvo: '#btn-snap-salvar', texto: 'No fim, clique em <b>Salvar dia</b>.' },
  ],

  'rh.html': [
    { alvo: '#btn-lancar-faltas', clicar: true, texto: 'No <b>início do dia</b>, clique em <b>Lançar Faltas</b>.' },
    { alvo: '#faltas-data', texto: 'Confira a <b>Data</b>.' },
    { alvo: () => $('#tbody-faltas tr .faltas-sit') || $('.faltas-table'), digitar: 'falta', texto: 'Em quem faltou, mude a <b>Situação</b>.' },
    { alvo: () => $('#tbody-faltas tr .faltas-obs') || $('.faltas-table'), digitar: 'Atestado médico', texto: 'Se quiser, escreva uma <b>Observação</b>.' },
    { alvo: '#btn-salvar-faltas', texto: 'Clique em <b>Salvar</b>. À tarde, abra <b>Lançar Faltas</b> de novo para revisar.' },
    { antes: fecharModais, alvo: '#btn-nova-oc', texto: 'Atrasos, advertências e atestados ficam em <b>+ Ocorrência</b>.' },
  ],

  'tarefas.html': [
    { alvo: '#kanban-board', texto: 'Aqui ficam as tarefas. Comece pelas que <b>vencem hoje</b> ou já estão atrasadas.' },
    { alvo: () => $('.task-card-menu') || $('#kanban-board'), texto: 'Quando terminar uma, clique em <b>⋯</b> no cartão e escolha <b>Concluída</b>.' },
    { alvo: '.btn-nova-tarefa', clicar: true, texto: 'Para criar uma tarefa, clique em <b>Nova Tarefa</b>.' },
    { alvo: '#f-titulo', digitar: 'Trocar óleo da prensa', texto: 'Escreva o <b>Título</b>.' },
    { alvo: '#f-responsavel', digitar: 'João', texto: 'Quem é o <b>Responsável</b>…' },
    { alvo: '#f-vencimento', digitar: hoje(), texto: '…e a <b>Data de Vencimento</b>.' },
    { alvo: '#modal-overlay .btn-save', texto: 'Clique em <b>Salvar Tarefa</b>.' },
  ],

  'comercial.html': [
    { alvo: '.com-tab[data-tab="vendas"]', clicar: true, texto: 'Na aba <b>Vendas</b> ficam os lançamentos.' },
    { alvo: '#btn-nova-venda', clicar: true, texto: 'A cada venda de recicláveis, clique em <b>+ Nova Venda</b>.' },
    { alvo: campo('#modal-venda', 'Cliente'), digitar: 'Cliente (exemplo)', texto: 'Escolha o <b>Cliente</b>.' },
    { alvo: campo('#modal-venda', 'Data'), digitar: hoje(), texto: 'A <b>Data</b> da venda.' },
    { alvo: campo('#modal-venda', 'Tipo de Material'), digitar: 'Aparas de Papelão', texto: 'O <b>Tipo de Material</b>.' },
    { alvo: campo('#modal-venda', 'Quantidade'), digitar: '12000', texto: 'A <b>Quantidade</b>.' },
    { alvo: campo('#modal-venda', 'Preço Material'), digitar: '0.85', texto: 'O <b>Preço</b>.' },
    { alvo: campo('#modal-venda', 'NF'), digitar: '12345', texto: 'E a <b>NF</b>, se já tiver.' },
    { alvo: '#btn-salvar-venda', texto: 'Clique em <b>Salvar</b>.' },
    { antes: fecharModais, texto: 'Depois, faça o pedido de venda no <b>Protheus</b>: abra o último pedido do mesmo comprador, faça uma cópia e altere o volume (e o valor, se mudou).' },
  ],

  'apresentacao.html': [
    { alvo: '#f-mes', texto: 'Toda <b>quinta-feira, no fim do dia</b>: confira o <b>Período</b>.' },
    { alvo: '#btn-carregar', clicar: true, texto: 'Clique em <b>Carregar dados</b> e espere os números aparecerem.' },
    { alvo: '#ap-num', texto: 'Confira se os <b>números</b> batem.' },
    { alvo: '#ap-frases', texto: 'Revise as <b>frases dos slides</b>, a equipe, os equipamentos e o plano de ação. Veja se algo mudou desde a semana passada.' },
    { alvo: '#btn-gerar', texto: 'Clique em <b>Gerar apresentação (.pptx)</b>.' },
  ],

  'dashboard.html': [
    { alvo: '#rel-btn-mes', texto: 'Escolha ver por <b>Mês</b> ou por <b>Ano</b>.' },
    { alvo: '#rel-mes', texto: 'Escolha o período.' },
    { alvo: '#rel-cat-todos', texto: 'Filtre por <b>Todos</b>, <b>Recicláveis</b> ou <b>Não Recicláveis</b>.' },
    { alvo: () => document.querySelector('.exp-lembrete'), texto: 'Se houver experiência vencendo em até 7 dias, aparece este <b>lembrete</b>. Clique em <b>Avaliar no RH</b>.' },
    { texto: 'Os números vêm sozinhos das outras telas. Se algo estiver errado, corrija na tela de origem.' },
  ],

  'indicadores.html': [
    { alvo: porTexto('button', 'Mensal'), texto: 'Escolha <b>Mensal</b> ou <b>Semanal</b>.' },
    { alvo: () => [$('#mes-a'), $('#sem-a')].find(visivel), texto: 'Escolha o <b>primeiro período</b>…' },
    { alvo: () => [$('#mes-b'), $('#sem-b')].find(visivel), texto: '…e o <b>segundo</b>, para comparar os dois.' },
    { alvo: porTexto('button', 'Imprimir'), texto: 'Para guardar ou enviar, use <b>Imprimir / PDF</b>.' },
  ],

  'notas-fiscais.html': [
    { alvo: '#btn-novo', clicar: true, texto: 'Para uma compra nova, clique em <b>+ Novo Registro</b>.' },
    { alvo: campo('#modal-registro', 'Fornecedor'), digitar: 'Fornecedor (exemplo)', texto: 'Escolha o <b>Fornecedor</b>.' },
    { alvo: campo('#modal-registro', 'Nº do Pedido'), digitar: '4500123', texto: 'Digite o <b>Nº do Pedido</b>.' },
    { alvo: campo('#modal-registro', 'Descrição'), digitar: 'Peças para a prensa', texto: 'Descreva os itens.' },
    { alvo: '#nf-checklist', texto:'Em <b>Etapas</b>, marque o que já aconteceu (a ordem não importa).' },
    { alvo: '#btn-salvar-registro', texto: 'Clique em <b>Salvar</b>. Quando a nota chegar, abra o registro e preencha o nº da NF.' },
  ],

  // Estas duas telas navegam por cliente → tipo; a simulação mostra o caminho sem entrar nele
  'cargas.html': [
    { alvo: '#search-clientes', texto: 'Para avaliar uma carga, procure o <b>cliente</b> (fornecedor) aqui…' },
    { alvo: () => $('#destino-table tbody tr') || $('#destino-table'), texto: '…e clique nele na lista.' },
    { texto: 'Dentro do cliente, clique no <b>tipo de carga</b> e depois em <b>+ Novo Estudo</b>.' },
    { texto: 'No estudo, preencha a <b>Data</b>, dê a <b>Avaliação</b> da carga, anexe <b>Fotos</b> se tiver e clique em <b>Salvar</b>.' },
    { alvo: '#btn-novo-cliente', texto: 'Se o cliente ainda não existir, cadastre em <b>+ Novo Cliente</b>.' },
  ],

  'rnc.html': [
    { alvo: '#search-clients', texto: 'Quando surgir uma não conformidade, procure o <b>cliente</b> aqui…' },
    { alvo: () => $('#clients-grid > *') || $('#clients-grid'), texto: '…e clique nele.' },
    { texto: 'Dentro do cliente, clique em <b>+ Nova RNC</b>. Preencha data da ocorrência, tipo de NC, detalhamento e causa.' },
    { texto: 'Descreva o plano de ação com <b>responsável</b> e <b>prazo</b> e salve. Quando o problema for resolvido, abra a RNC e mude o <b>Status</b>.' },
  ],
};

export function temSimulacao(pagina) { return !!ROTEIROS[pagina]; }

// ── Motor ─────────────────────────────────────────────────────────────────────
let sim = null;   // estado da simulação em andamento

export function iniciarSimulacao(pagina, titulo) {
  const roteiro = ROTEIROS[pagina];
  if (!roteiro || sim) return;

  const passos = [
    { texto: `Simulação: <b>${titulo}</b>. Acompanhe o cursor. Os campos são preenchidos com exemplos, mas <b>nada é salvo</b>.` },
    ...roteiro,
    { antes: fecharModais, texto: 'Fim da simulação. Agora é a sua vez! Para ver de novo, clique em <b>? Como usar esta tela</b> → <b>Ver simulação</b>.' },
  ];

  const camada = document.createElement('div');
  camada.id = 'sim';
  camada.innerHTML = `
    <div class="sim-bloqueio"></div>
    <div class="sim-foco"></div>
    <div class="sim-cursor"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 3l14 8-6.5 1.5L10 19z" fill="#0f172a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div>
    <div class="sim-legenda" role="status" aria-live="polite">
      <div class="sim-legenda-hd">
        <span class="sim-rec">● Simulação</span>
        <span class="sim-contador"></span>
      </div>
      <div class="sim-texto"></div>
      <div class="sim-barra"><div class="sim-barra-fill"></div></div>
      <div class="sim-controles">
        <button type="button" data-acao="pausar">⏸ Pausar</button>
        <button type="button" data-acao="proximo">Próximo ⏭</button>
        <button type="button" data-acao="recomecar">↺ Recomeçar</button>
        <button type="button" data-acao="sair" class="sim-sair">✕ Sair</button>
      </div>
    </div>`;
  document.body.appendChild(camada);
  document.body.classList.add('sim-ativa');

  const foco    = camada.querySelector('.sim-foco');
  const cursor  = camada.querySelector('.sim-cursor');
  const texto   = camada.querySelector('.sim-texto');
  const contador = camada.querySelector('.sim-contador');
  const fill    = camada.querySelector('.sim-barra-fill');
  const btnPausa = camada.querySelector('[data-acao="pausar"]');

  // Cursor começa no meio da tela
  cursor.style.left = (innerWidth / 2) + 'px';
  cursor.style.top  = (innerHeight / 2) + 'px';

  sim = { i: 0, pausado: false, timer: null, geracao: 0, desfazer: [], fantasma: null };

  const esperar = ms => new Promise(res => {
    const g = sim.geracao;
    let restante = ms, inicio = Date.now();
    const tick = () => {
      if (!sim || sim.geracao !== g) return;           // passo trocado/saiu: abandona
      if (sim.pausado) { inicio = Date.now(); sim.timer = setTimeout(tick, 120); return; }
      restante -= Date.now() - inicio; inicio = Date.now();
      if (restante <= 0) res(); else sim.timer = setTimeout(tick, Math.min(restante, 120));
    };
    sim.timer = setTimeout(tick, 0);
  });

  const acharAlvo = alvo => {
    if (!alvo) return null;
    const el = typeof alvo === 'function' ? alvo() : $(alvo);
    return visivel(el) ? el : null;
  };

  const posicionarFoco = el => {
    if (!el) { foco.classList.remove('on'); camada.classList.add('sem-alvo'); return null; }
    const r = el.getBoundingClientRect(), pad = 6;
    Object.assign(foco.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
    foco.classList.add('on'); camada.classList.remove('sem-alvo');
    // Legenda vai para o topo quando cobriria o destaque
    const legenda = camada.querySelector('.sim-legenda');
    const alturaLeg = legenda.offsetHeight + 30;
    legenda.classList.toggle('topo', r.bottom > innerHeight - alturaLeg && r.top > alturaLeg);
    return r;
  };

  const tirarFantasma = () => { sim?.fantasma?.remove(); if (sim) sim.fantasma = null; };

  // Preenche um campo com o exemplo, guardando como estava para desfazer no fim
  const preencher = async (el, valor) => {
    const tag = el.tagName;
    if (tag === 'SELECT') {
      let opt = [...el.options].find(o => o.value === valor || o.textContent.trim().includes(valor));
      let criada = null;
      if (!opt) { opt = criada = new Option(valor, '__sim__'); el.add(opt); }
      sim.desfazer.push({ el, valor: el.value, criada });
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    sim.desfazer.push({ el, valor: el.value });
    const digitavel = !['date', 'time', 'month', 'week'].includes(el.type);
    if (!digitavel) { el.value = valor; el.dispatchEvent(new Event('input', { bubbles: true })); return; }
    el.value = '';
    for (const ch of valor) {
      if (!sim) return;
      el.value += ch;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await esperar(70);
    }
  };

  const rodarPasso = async () => {
    const g = ++sim.geracao;
    clearTimeout(sim.timer);
    tirarFantasma();
    const passo = passos[sim.i];
    contador.textContent = `${sim.i + 1} de ${passos.length}`;
    fill.style.width = ((sim.i + 1) / passos.length * 100) + '%';
    texto.innerHTML = passo.texto;

    passo.antes?.();
    sim.cliquePendente = passo.clicar ? passo : null;
    let el = acharAlvo(passo.alvo);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await esperar(450);
      if (!sim || sim.geracao !== g) return;
      el = acharAlvo(passo.alvo);
    }
    const r = posicionarFoco(el);
    if (r) {
      cursor.style.left = (r.left + Math.min(r.width / 2, 40)) + 'px';
      cursor.style.top  = (r.top + r.height / 2) + 'px';
      cursor.classList.add('on');
      await esperar(750);
      if (!sim || sim.geracao !== g) return;

      if (passo.clicar) {
        cursor.classList.add('clique');
        await esperar(350);
        if (!sim || sim.geracao !== g) return;
        cursor.classList.remove('clique');
        sim.cliquePendente = null;
        el.click();
        await esperar(300);
      }
      // Só preenche campo de verdade (se caiu no container de reserva, apenas destaca)
      if (passo.digitar != null && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) await preencher(el, String(passo.digitar));
      if (passo.fantasma && r.height < 80) {
        const f = document.createElement('div');
        f.className = 'sim-fantasma';
        f.textContent = passo.fantasma;
        Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
        document.body.appendChild(f);
        sim.fantasma = f;
      }
    } else {
      cursor.classList.remove('on');
    }

    const leitura = Math.max(2600, passo.texto.replace(/<[^>]+>/g, '').length * 55);
    await esperar(leitura);
    if (!sim || sim.geracao !== g) return;
    avancar();
  };

  const avancar = () => {
    if (!sim) return;
    if (sim.i >= passos.length - 1) { sair(); return; }
    // Pulou um passo antes do clique? Clica mesmo assim, senão os próximos ficam sem a janela aberta
    if (sim.cliquePendente) { const p = sim.cliquePendente; sim.cliquePendente = null; (typeof p.alvo === 'function' ? p.alvo() : $(p.alvo))?.click(); }
    sim.i++;
    rodarPasso();
  };

  const desfazerTudo = () => {
    tirarFantasma();
    fecharModais();
    for (const d of sim.desfazer.reverse()) {
      d.el.value = d.valor;
      d.criada?.remove();
      d.el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    sim.desfazer = [];
    window.fecharTarefa?.();
    document.querySelector('.prod-tab[data-tab="prensagem"]')?.click();
  };

  const sair = () => {
    if (!sim) return;
    clearTimeout(sim.timer);
    sim.geracao++;
    desfazerTudo();
    camada.remove();
    document.body.classList.remove('sim-ativa');
    document.removeEventListener('keydown', teclas);
    sim = null;
  };

  const teclas = e => {
    if (e.key === 'Escape') sair();
    else if (e.key === ' ') { e.preventDefault(); btnPausa.click(); }
    else if (e.key === 'ArrowRight') avancar();
  };
  document.addEventListener('keydown', teclas);

  camada.querySelector('.sim-controles').addEventListener('click', e => {
    const acao = e.target.closest('button')?.dataset.acao;
    if (acao === 'pausar') {
      sim.pausado = !sim.pausado;
      btnPausa.textContent = sim.pausado ? '▶ Continuar' : '⏸ Pausar';
    } else if (acao === 'proximo') {
      avancar();
    } else if (acao === 'recomecar') {
      sim.geracao++;
      desfazerTudo();
      sim.i = 0; sim.pausado = false; btnPausa.textContent = '⏸ Pausar';
      rodarPasso();
    } else if (acao === 'sair') {
      sair();
    }
  });

  rodarPasso();
}
