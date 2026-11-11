/**
 * Economarket - Lessons.js
 * Componente responsável por renderizar a visão de documentação das aulas:
 * Trajetória da imersão e os 3 cartões visuais das entregas (Aulas 1, 2 e 3).
 */

(function (window) {
  'use strict';

  const LESSONS_DATA = [
    {
      id: 'aula-1',
      className: 'aula-1',
      number: 'Aula 1',
      icon: '🧮',
      title: 'Aula 1 — Fundamentos & Lógica',
      challengeTag: 'Desafio 1',
      description: 'Criação da calculadora básica de 4 operações, entendendo variáveis, funções e entradas do usuário.',
      deliverables: [
        'Estruturação de lógica com funções e operadores matemáticos (+, −, ×, ÷).',
        'Criação de visor digital interativo e captura de eventos numéricos.',
        'Desenvolvimento de motor de avaliação de expressões sem vulnerabilidades.',
        'Implementação de fita de histórico de cálculos recentes.'
      ],
      actionLabel: 'Ver Calculadora',
      targetRoute: 'calculator-simple'
    },
    {
      id: 'aula-2',
      className: 'aula-2',
      number: 'Aula 2',
      icon: '💲',
      title: 'Aula 2 — Orquestração & Evolução com IA',
      challengeTag: 'Desafio 2',
      description: 'Leitura e modificação de código existente, adicionando cálculo de porcentagem, simulação de desconto em lote e regras no AGENTS.md.',
      deliverables: [
        'Leitura e refatoração arquitetural guiada por inteligência artificial.',
        'Cálculo de porcentagem e Comparador de Embalagens por Peso/Volume (R$/kg e R$/L).',
        'Desenvolvimento do Simulador de Economia em Lote (Quantidade) na matriz de produtos.',
        'Definição de regras de conduta, contexto e engenharia de software no AGENTS.md.'
      ],
      actionLabel: 'Ver Calc Aprimorada',
      targetRoute: 'calculator-advanced'
    },
    {
      id: 'aula-3',
      className: 'aula-3',
      number: 'Aula 3',
      icon: '☑️',
      title: 'Aula 3 — Aplicação Web & Lista de Compras',
      challengeTag: 'Desafio 3',
      description: 'Construção da Lista de Compras (To-Do List) integrada ao localStorage com alteração visual de itens concluídos.',
      deliverables: [
        'Construção de interface web interativa orientada a listas dinâmicas.',
        'Marcação reativa de item "No Carrinho / Concluído" (fundo verde suave e texto riscado).',
        'Alternância bidirecional (pendente ⇄ concluído) com clique em toda a linha.',
        'Botão de lixeira com stopPropagation e persistência contínua no localStorage.'
      ],
      actionLabel: 'Ver Lista de Compras',
      targetRoute: 'todo-list'
    }
  ];

  const Lessons = {
    init: function () {
      this.render();
    },

    render: function () {
      const container = document.getElementById('lessons-cards-container');
      if (!container) return;

      let html = '';
      LESSONS_DATA.forEach(function (lesson) {
        html += '<div class="lesson-card ' + lesson.className + '">' +
          '<div>' +
            '<div class="lesson-card-header">' +
              '<div class="lesson-top-meta">' +
                '<span class="lesson-number-pill">' + lesson.number + '</span>' +
                '<span class="lesson-badge-tag">' + lesson.challengeTag + '</span>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">' +
                '<div class="lesson-icon-circle">' + lesson.icon + '</div>' +
                '<h3 class="lesson-card-title">' + lesson.title + '</h3>' +
              '</div>' +
              '<p class="lesson-card-desc">' + lesson.description + '</p>' +
            '</div>' +

            '<div class="lesson-deliverables-title">Entregas & Habilidades:</div>' +
            '<ul class="lesson-deliverables-list">';

        lesson.deliverables.forEach(function (d) {
          html += '<li class="lesson-deliverable-item">' +
            '<span class="lesson-check-icon">✓</span>' +
            '<span>' + d + '</span>' +
          '</li>';
        });

        html += '</ul>' +
          '</div>' +

          '<div class="lesson-card-footer">' +
            '<span style="font-size:0.75rem;color:var(--slate-400);font-weight:600;">Concluído na Imersão</span>' +
            '<button type="button" class="lesson-action-btn" data-route="' + lesson.targetRoute + '">' +
              '<span>' + lesson.actionLabel + '</span>' +
              '<span>→</span>' +
            '</button>' +
          '</div>' +
        '</div>';
      });

      container.innerHTML = html;
    }
  };

  window.LessonsComponent = Lessons;
})(window);

