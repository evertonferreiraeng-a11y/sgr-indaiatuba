// ── Ajuda por tela ────────────────────────────────────────────────────────────
// Botão "? Ajuda" fixo em todas as páginas. Abre um painel lateral explicando
// para que serve a tela, quando usar e o passo a passo do que fazer nela.

export const AJUDA = {
  'dashboard.html': {
    titulo: 'Dashboard (Relatório do Comitê)',
    resumo: 'Visão geral da unidade no mês ou no ano: volumes recebidos, produção, vendas e pontos críticos. Os números vêm sozinhos das outras telas, então aqui não se digita nada.',
    quando: 'Para consultar como a unidade está indo e para levar na reunião com a diretoria.',
    passos: [
      'No topo, escolha <b>Mês</b> ou <b>Ano</b> e o período que quer ver.',
      'Use <b>Todos</b>, <b>♻ Recicláveis</b> ou <b>🚫 Não Recicláveis</b> para filtrar o balanço.',
      'Para imprimir ou mandar por e-mail, clique em <b>Gerar PDF</b>.',
    ],
    dicas: [
      'Se algum número parecer errado, o problema está na tela de origem (Entradas, Produção ou Comercial). Corrija lá e volte aqui.',
    ],
  },
  'indicadores.html': {
    titulo: 'Indicadores',
    resumo: 'Compara dois períodos (meses ou semanas) e mostra a evolução dos volumes e do faturamento em relação à meta.',
    quando: 'Quando precisar responder "estamos melhor ou pior que o mês passado?".',
    passos: [
      'Escolha <b>Mensal</b> ou <b>Semanal</b>.',
      'Selecione os dois períodos que quer comparar.',
      'Para guardar ou enviar, use <b>Imprimir / PDF</b>.',
    ],
    dicas: ['Esta tela só mostra dados. Nada aqui altera o sistema.'],
  },
  'entradas.html': {
    titulo: 'Entradas',
    resumo: 'Registro de tudo o que chega na unidade: cada pesagem de caminhão, com fornecedor, material e peso.',
    quando: '<b>Todo início de mês</b>, lançando as pesagens do mês anterior.',
    passos: [
      'Nos primeiros dias do mês, peça para a balança a <b>planilha de pesagens do mês anterior</b>.',
      'Com a planilha salva no computador, clique em <b>Importar CSV</b> e escolha o arquivo.',
      'Confira na lista se as entradas do mês anterior apareceram e se os totais fazem sentido.',
    ],
    dicas: [
      'Se faltar alguma pesagem, lance à mão em <b>Nova Entrada</b>: Data, Fornecedor, Material, <b>Pesagem 1</b> (caminhão cheio) e <b>Pesagem 2 / Tara</b> (vazio). O peso líquido é calculado sozinho.',
      'Para corrigir uma entrada, use o ícone de lápis na linha dela. A lixeira apaga.',
      'Não use <b>Excluir Mês</b> sem combinar antes: ele apaga todas as entradas do mês.',
    ],
  },
  'producao.html': {
    titulo: 'Produção',
    resumo: 'Registro do que foi produzido: os fardos feitos nas prensas (aba <b>Prensagem</b>) e o material separado na triagem (aba <b>Triagem de Cargas</b>).',
    quando: '<b>Todo dia, no fim do dia</b>, com a produção de cada prensa e de cada operador.',
    passos: [
      'Na aba <b>Prensagem</b>, clique em <b>+ Novo Registro</b>.',
      'Informe <b>Data</b>, <b>Equipamento</b> e <b>Operador</b>. Em <b>Material</b>, escolha <b>Aparas de Papelão</b> ou <b>Aparas de Plástico</b>.',
      'Preencha o <b>Peso Produzido (kg)</b> e a <b>Quantidade de Fardos</b>.',
      'Clique em <b>Salvar</b>. Repita para cada prensa ou operador do dia.',
      'Se houve triagem, abra a aba <b>Triagem de Cargas</b> e clique em <b>+ Nova Triagem</b>. Preencha cliente, horário de início e fim, pausa e peso triado.',
    ],
    dicas: [
      'O quadro <b>Capacidade dos Equipamentos — Hoje</b> usa o status salvo na tela de Equipamentos.',
      'Para ver só um mês ou uma prensa, use os filtros e clique em <b>Filtrar</b>.',
    ],
  },
  'estoque.html': {
    titulo: 'Estoque',
    resumo: 'Quantos kg de cada material estão em estoque na unidade.',
    quando: '<b>Todo dia, no fim da tarde</b>, depois que a produção do dia terminou.',
    passos: [
      'Em <b>Materiais em Estoque</b>, clique no campo <b>Kg em Estoque</b> de cada material.',
      'Digite a quantidade atual e clique fora do campo. O valor é salvo sozinho.',
      'Se mudou o preço ou a observação, edite esses campos do mesmo jeito.',
    ],
    dicas: [
      '<b>+ Adicionar Material</b> só é usado quando aparece um material que ainda não está na lista.',
      'A lixeira tira o material da lista. Não é preciso usar no dia a dia.',
    ],
  },
  'equipamentos.html': {
    titulo: 'Equipamentos',
    resumo: 'Cadastro das máquinas e situação de cada uma no dia: operando, com restrição ou parada.',
    quando: '<b>Todo dia, no início do dia</b>. A Produção e a Apresentação do Comitê usam esse status.',
    passos: [
      'Vá até o quadro <b>Disponibilidade do Dia</b> (a data já vem em <b>Hoje</b>).',
      'Em cada equipamento, escolha o <b>Status</b>: Operando, Com restrição ou Parado.',
      'Se estiver parado ou com restrição, escreva o motivo em <b>Observações</b>.',
      'Clique em <b>Salvar dia</b>.',
    ],
    dicas: [
      '<b>+ Novo Equipamento</b> só serve para cadastrar uma máquina nova. Não é preciso usar no dia a dia.',
    ],
  },
  'comercial.html': {
    titulo: 'Comercial',
    resumo: 'Registro das vendas de material (o que saiu, para quem e por quanto) e acompanhamento da meta de faturamento.',
    quando: '<b>A cada venda de recicláveis.</b>',
    passos: [
      'Clique em <b>+ Nova Venda</b>.',
      'Preencha <b>Data</b>, <b>Cliente</b>, <b>Tipo de Material</b>, <b>Quantidade</b> e o preço. Se tiver, informe a <b>NF</b>.',
      'Clique em <b>Salvar</b>.',
      'Para ver se a meta está sendo atingida, confira <b>Acompanhamento de Meta Semanal</b>.',
    ],
    dicas: [
      '<b>Pedido de venda no Protheus:</b> abra o último pedido do mesmo comprador, faça uma cópia e altere o volume (e o valor, se mudou).',
      'Se o cliente não aparecer na lista, cadastre em <b>Novo Cliente</b>.',
      '<b>⬇ Exportar Excel</b> gera uma planilha com as vendas filtradas.',
    ],
  },
  'notas-fiscais.html': {
    titulo: 'Notas Fiscais',
    resumo: 'Acompanhamento das compras: pedido, nota fiscal e em que etapa cada uma está.',
    quando: 'Quando sair um pedido de compra, chegar uma nota ou uma etapa andar.',
    passos: [
      'Para uma compra nova, clique em <b>+ Novo Registro</b> e preencha fornecedor, nº do pedido e descrição.',
      'Em <b>Etapas</b>, marque o que já aconteceu (a ordem não importa).',
      'Quando a nota chegar, abra o registro e preencha <b>Nº da Nota Fiscal</b> e <b>Data de Emissão</b>.',
      'Clique em <b>Salvar</b>.',
    ],
    dicas: [
      'Para achar um registro, digite o nº do pedido ou da NF no campo <b>Buscar</b>.',
      'Se a compra não vai mais acontecer, use <b>Marcar como Cancelado</b> em vez de apagar.',
    ],
  },
  'cargas.html': {
    titulo: 'Estudo de Cargas',
    resumo: 'Avaliação da qualidade das cargas que cada fornecedor entrega, com fotos e observações.',
    quando: 'Quando uma carga for avaliada (por exemplo, uma carga com muito rejeito).',
    passos: [
      'Clique em <b>+ Novo Estudo</b>.',
      'Informe <b>Data</b>, fornecedor e <b>Avaliação</b>. Se tiver fotos, anexe.',
      'Clique em <b>Salvar</b>.',
    ],
    dicas: ['O quadro <b>Volumes de Entrada por Fornecedor</b> usa os dados lançados em Entradas.'],
  },
  'rh.html': {
    titulo: 'RH',
    resumo: 'Colaboradores, presença, faltas, avaliações e ocorrências da equipe.',
    quando: '<b>Todo dia, no início do dia</b> para lançar as faltas, e <b>à tarde</b> para revisar. As outras funções só quando acontecer algo.',
    passos: [
      'De manhã, clique em <b>Lançar Faltas</b> e marque quem faltou no dia. Depois salve.',
      'À tarde, abra <b>Lançar Faltas</b> de novo e confira se mudou algo (alguém chegou atrasado ou saiu mais cedo, por exemplo).',
      'Para registrar um atraso, advertência ou atestado, clique em <b>+ Ocorrência</b>.',
      'Avaliação de experiência (45 e 90 dias) é feita em <b>+ Avaliação</b>.',
    ],
    dicas: [
      'Para ver o histórico de uma pessoa, clique no nome dela na lista.',
    ],
  },
  'colaborador-ocorrencias.html': {
    titulo: 'Ocorrências do Colaborador',
    resumo: 'Histórico de ocorrências (faltas, atrasos, advertências e outras) de um colaborador.',
    quando: 'Para consultar ou registrar algo sobre uma pessoa específica.',
    passos: [
      'Use <b>Este mês</b>, <b>Mês passado</b>, <b>Este ano</b> ou <b>Tudo</b> para escolher o período.',
      'Para registrar uma ocorrência nova, clique em <b>+ Ocorrência</b> e salve.',
    ],
    dicas: [],
  },
  'tarefas.html': {
    titulo: 'Tarefas',
    resumo: 'Quadro com as pendências da unidade: o que precisa ser feito, por quem e até quando.',
    quando: '<b>Todo dia</b>, para ver o que vence e marcar o que foi feito.',
    passos: [
      'Olhe primeiro as tarefas com vencimento hoje ou já atrasadas.',
      'Quando terminar uma, clique em <b>⋯</b> no cartão e escolha <b>Concluída</b>.',
      'Para criar uma tarefa nova, preencha <b>Título</b>, <b>Responsável</b> e <b>Data de Vencimento</b>, depois clique em <b>Salvar Tarefa</b>.',
    ],
    dicas: ['Se uma tarefa não for mais necessária, marque como <b>Cancelada</b> em vez de excluir.'],
  },
  'apresentacao.html': {
    titulo: 'Apresentação do Comitê',
    resumo: 'Gera os slides (.pptx) da reunião do comitê com a diretoria a partir dos dados do sistema.',
    quando: '<b>Toda quinta-feira, no fim do dia</b>, depois que a operação terminou.',
    passos: [
      'Siga as etapas na ordem: <b>1. Período</b> → <b>Carregar dados</b>.',
      '<b>2. Conferência dos números</b>: confira se os valores batem.',
      '<b>3 a 5</b>: revise as frases, a equipe e os equipamentos e o plano de ação. Veja se algo precisa ser mudado desde a semana passada.',
      '<b>6. Gerar</b>: clique em <b>Gerar apresentação (.pptx)</b>.',
    ],
    dicas: ['Se um número estiver errado, corrija na tela de origem e clique em <b>Carregar dados</b> de novo.'],
  },
  'rnc.html': {
    titulo: 'Não Conformidade (RNC)',
    resumo: 'Registro de problemas de qualidade (reclamação de cliente, material fora do padrão etc.) e do plano de ação para resolver.',
    quando: 'Quando surgir uma não conformidade, ou para atualizar uma que está aberta.',
    passos: [
      'Clique em <b>+ Nova RNC</b>.',
      'Preencha cliente, <b>Data da Ocorrência</b>, <b>Tipo de NC</b>, <b>Detalhamento</b> e <b>Causa</b>.',
      'Descreva o plano de ação, com <b>Responsável</b> e <b>Prazo</b>.',
      'Clique em <b>Salvar</b>. Quando o problema for resolvido, abra a RNC e mude o <b>Status</b>.',
    ],
    dicas: [],
  },
  'financeiro.html': {
    titulo: 'Financeiro',
    resumo: 'Lançamentos de receitas e despesas.',
    quando: 'Quando houver um lançamento financeiro.',
    passos: ['Clique em <b>+ Novo Lançamento</b>, preencha e clique em <b>Salvar</b>.'],
    dicas: [],
  },
  'relatorio.html': {
    titulo: 'Relatório de Reunião',
    resumo: 'Relatório consolidado do mês ou do ano para reunião.',
    quando: 'Antes de reuniões de acompanhamento.',
    passos: ['Escolha <b>Mês</b> ou <b>Ano</b> e o período. Depois imprima ou gere o PDF.'],
    dicas: [],
  },
};

export const ROTINA_DIA = [
  '<b>Início do dia:</b> Equipamentos (status → Salvar dia) e RH (Lançar Faltas)',
  '<b>Durante o dia:</b> Tarefas (ver o que vence hoje)',
  '<b>À tarde:</b> RH, revisar as faltas',
  '<b>Fim do dia:</b> Produção (prensagem e triagem) e Estoque (atualizar os kg)',
];

export const ROTINA_PERIODICA = [
  '<b>Início do mês:</b> Entradas, importar a planilha da balança do mês anterior',
  '<b>Quinta, fim do dia:</b> Apresentação do Comitê, gerar e revisar',
  '<b>A cada venda de recicláveis:</b> Comercial + pedido no Protheus',
];

function paginaAtual() { return location.pathname.split('/').pop() || 'dashboard.html'; }

function foiRecarregada() {
  try { return performance.getEntriesByType('navigation')[0]?.type === 'reload'; } catch { return false; }
}

export function initAjuda(perfilPromise) {
  const pagina = paginaAtual();
  const info = AJUDA[pagina];
  if (!info) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'ajuda-btn';
  btn.className = 'ajuda-btn';
  btn.innerHTML = '<span class="ajuda-btn-q">?</span><span class="ajuda-btn-txt">Como usar esta tela</span>';
  btn.title = 'Como usar esta tela';
  document.body.appendChild(btn);

  const lista = arr => arr.map(t => `<li>${t}</li>`).join('');
  const painel = document.createElement('div');
  painel.id = 'ajuda-painel';
  painel.innerHTML = `
    <div class="ajuda-backdrop" data-fechar></div>
    <div class="ajuda-modal" role="dialog" aria-modal="true" aria-labelledby="ajuda-titulo">
      <div class="ajuda-hd">
        <div>
          <div class="ajuda-kicker">Como usar esta tela</div>
          <h3 id="ajuda-titulo">${info.titulo}</h3>
        </div>
        <button type="button" class="ajuda-fechar" data-fechar aria-label="Fechar">✕</button>
      </div>
      <div class="ajuda-body">
        <div class="ajuda-aviso" id="ajuda-aviso-visitante" hidden>
          Seu usuário está como <b>Visitante</b>, então alguns botões citados aqui (como <b>Lançar Faltas</b>) não aparecem. Se precisar lançar dados, peça acesso de <b>Administrador</b>.
        </div>
        <p class="ajuda-resumo">${info.resumo}</p>
        <div class="ajuda-quando"><span>Quando usar</span>${info.quando}</div>
        <div class="ajuda-sec">Como lançar</div>
        <ol class="ajuda-passos">${lista(info.passos)}</ol>
        ${info.dicas.length ? `<div class="ajuda-sec">Dicas</div><ul class="ajuda-dicas">${lista(info.dicas)}</ul>` : ''}
        <p class="ajuda-rodape">A rotina completa e todas as telas estão no <a href="manual.html">Manual do Sistema</a>. Para rever esta explicação, clique em <b>? Como usar esta tela</b> no canto da tela.</p>
      </div>
      <div class="ajuda-ft">
        <button type="button" class="btn btn-primary ajuda-btn-fechar" data-fechar>Fechar</button>
      </div>
    </div>`;
  document.body.appendChild(painel);

  const abrir = () => {
    painel.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const fechar = () => {
    if (!painel.classList.contains('open')) return;
    painel.classList.remove('open');
    if (!document.getElementById('rotina-overlay')) document.body.style.overflow = '';
  };

  btn.addEventListener('click', abrir);
  painel.querySelectorAll('[data-fechar]').forEach(el => el.addEventListener('click', fechar));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });

  window._abrirAjuda = abrir;

  // Abre sozinha ao entrar na tela (não ao recarregar), depois que a Rotina Diária
  // decidiu se mostra a tela de seleção — nesse caso a seleção vem primeiro.
  setTimeout(() => {
    if (document.getElementById('rotina-overlay') || foiRecarregada()) return;
    abrir();
  }, 0);

  Promise.resolve(perfilPromise).then(p => {
    if (p && p.role !== 'admin') document.getElementById('ajuda-aviso-visitante').hidden = false;
  }).catch(() => {});
}
