/**
 * Economarket - TodoList.js
 * Componente da Lista de Compras Rápida (To-Do List - Desafio 3 da Imersão).
 * Adiciona itens, alterna status para 'No Carrinho / Concluído' com fundo verde suave e tachado,
 * botão de lixeira para remoção e salvamento no localStorage.
 */

(function (window) {
  'use strict';

  const TodoList = {
    currentFilter: 'all', // 'all' | 'pending' | 'completed'

    init: function () {
      this.bindEvents();
      this.render();
    },

    bindEvents: function () {
      const self = this;

      // Formulário de adição de item
      const form = document.getElementById('todo-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          self.handleAddItem();
        });
      }

      // Filtros (Todos, Pendentes, No Carrinho)
      document.querySelectorAll('.todo-filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const filter = this.getAttribute('data-todo-filter');
          self.setFilter(filter);
        });
      });

      // Botão Limpar Carrinho
      const btnClearCart = document.getElementById('btn-clear-cart-items');
      if (btnClearCart) {
        btnClearCart.addEventListener('click', function () {
          window.EconomarketStorage.clearCompletedShoppingItems();
          self.render();
          if (window.NavigationComponent) {
            window.NavigationComponent.showToast('Itens do carrinho removidos!', 'info');
          }
        });
      }

      // Botão Copiar Lista
      const btnCopyList = document.getElementById('btn-copy-shopping-list');
      if (btnCopyList) {
        btnCopyList.addEventListener('click', function () {
          self.copyListToClipboard();
        });
      }
    },

    handleAddItem: function () {
      const input = document.getElementById('todo-input-name');
      if (!input) return;

      const name = input.value.trim();
      if (!name) return;

      window.EconomarketStorage.addShoppingItem(name);
      input.value = '';
      this.render();

      if (window.NavigationComponent) {
        window.NavigationComponent.showToast('Item adicionado à lista!', 'success');
      }
    },

    toggleItem: function (id) {
      window.EconomarketStorage.toggleShoppingItem(id);
      this.render();
    },

    deleteItem: function (id) {
      window.EconomarketStorage.deleteShoppingItem(id);
      this.render();
      if (window.NavigationComponent) {
        window.NavigationComponent.showToast('Item removido da lista!', 'info');
      }
    },

    setFilter: function (filter) {
      this.currentFilter = filter;

      document.querySelectorAll('.todo-filter-btn').forEach(function (btn) {
        if (btn.getAttribute('data-todo-filter') === filter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      this.render();
    },

    findMatchingOffer: function (name) {
      const offers = window.EconomarketStorage.getOffers();
      const products = window.EconomarketStorage.groupOffersByProduct(offers);
      const lower = String(name || '').toLowerCase().trim();

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const pLower = p.productName.toLowerCase();
        if (pLower.indexOf(lower) !== -1 || lower.indexOf(pLower) !== -1) {
          return p;
        }
      }
      return null;
    },

    render: function () {
      const self = this;
      const container = document.getElementById('todo-items-container');
      const counterEl = document.getElementById('todo-counter-text');
      const countPendingEl = document.getElementById('todo-pending-count');
      const countCartEl = document.getElementById('todo-cart-count');
      if (!container) return;

      const allItems = window.EconomarketStorage.getShoppingList();
      const completedCount = allItems.filter(function (i) { return i.completed; }).length;
      const pendingCount = allItems.length - completedCount;

      if (counterEl) counterEl.textContent = completedCount + ' de ' + allItems.length + ' no carrinho';
      if (countPendingEl) countPendingEl.textContent = pendingCount + ' pendentes';
      if (countCartEl) countCartEl.textContent = completedCount + ' no carrinho';

      // Filtra de acordo com a aba selecionada
      let visibleItems = allItems;
      if (self.currentFilter === 'pending') {
        visibleItems = allItems.filter(function (i) { return !i.completed; });
      } else if (self.currentFilter === 'completed') {
        visibleItems = allItems.filter(function (i) { return i.completed; });
      }

      if (visibleItems.length === 0) {
        let msg = 'Sua lista de compras está vazia.';
        if (self.currentFilter === 'pending') msg = 'Nenhum item pendente no momento! Tudo no carrinho.';
        if (self.currentFilter === 'completed') msg = 'Nenhum item marcado no carrinho ainda.';

        container.innerHTML =
          '<div class="todo-empty-state">' +
            '<div class="todo-empty-icon">🛒</div>' +
            '<p style="font-weight:700;color:var(--slate-800);margin-bottom:0.25rem;">' + msg + '</p>' +
            '<p style="font-size:0.8125rem;color:var(--slate-400);">Digite os itens acima para planejar suas compras no supermercado.</p>' +
          '</div>';
        return;
      }

      let html = '';
      visibleItems.forEach(function (item) {
        const matched = self.findMatchingOffer(item.name);
        const isDone = item.completed;

        html += '<div class="todo-item-row ' + (isDone ? 'completed' : '') + '" onclick="window.TodoListComponent.toggleItem(\'' + item.id + '\')" title="' + (isDone ? 'Clique para desmarcar e voltar para pendente' : 'Clique para marcar como No Carrinho / Concluído') + '">';

        // Esquerda: Círculo de check + Nome + Tag
        html += '<div class="todo-item-left">' +
          '<div class="todo-check-circle">' + (isDone ? '✓' : '') + '</div>' +
          '<span class="todo-item-name">' + item.name + '</span>' +
          (isDone ? '<span class="cart-badge-pill">🛒 No Carrinho</span>' : '');

        if (matched && !isDone) {
          html += '<span class="todo-matched-offer">' +
            '<span>✨ Menor: ' + window.EconomarketStorage.formatCurrency(matched.lowestPrice) + ' no ' + matched.cheapestSupermarket + '</span>' +
          '</span>';
        }

        html += '</div>';

        // Direita: Botão de Lixeira
        html += '<div class="todo-item-actions">' +
          '<button type="button" class="todo-trash-btn" onclick="event.stopPropagation(); window.TodoListComponent.deleteItem(\'' + item.id + '\')" title="Remover item da lista">' +
            '🗑️' +
          '</button>' +
        '</div>';

        html += '</div>';
      });

      container.innerHTML = html;
    },

    copyListToClipboard: function () {
      const items = window.EconomarketStorage.getShoppingList();
      if (items.length === 0) {
        alert('A lista está vazia!');
        return;
      }

      const text = '📝 MINHA LISTA DE COMPRAS - ECONOMARKET\n\n' +
        items.map(function (i) {
          return (i.completed ? '[X] ' : '[ ] ') + i.name;
        }).join('\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          window.NavigationComponent.showToast('Lista copiada para a área de transferência!', 'success');
        });
      } else {
        prompt('Copie sua lista abaixo:', text);
      }
    },
  };

  window.TodoListComponent = TodoList;
})(window);

