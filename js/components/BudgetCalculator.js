/**
 * Economarket - BudgetCalculator.js
 * Componente da Calculadora de Orçamento Limite — Sacola Controlada.
 * Permite definir um teto financeiro de compras, adicionar itens à sacola,
 * calcular saldo restante em tempo real e emitir alertas dinâmicos
 * (Verde < 80%, Amarelo 80%–99.9%, Vermelho >= 100%).
 */

(function (window) {
  'use strict';

  const BudgetCalculator = {
    init: function () {
      this.bindEvents();
      this.render();
    },

    bindEvents: function () {
      const self = this;

      // 1. Edição do Orçamento Total (Input em tempo real)
      const limitInput = document.getElementById('budget-limit-input');
      if (limitInput) {
        limitInput.addEventListener('input', function () {
          const val = self.parseCurrencyInput(this.value);
          window.EconomarketStorage.saveBudgetLimit(val);
          self.renderMetricsAndProgress();
        });

        limitInput.addEventListener('blur', function () {
          const val = window.EconomarketStorage.getBudgetLimit();
          this.value = val.toFixed(2).replace('.', ',');
          self.renderMetricsAndProgress();
        });
      }

      // 2. Chips rápidos de orçamento pré-definido (R$ 100, R$ 150, R$ 200, R$ 300, R$ 500)
      const chips = document.querySelectorAll('.budget-preset-chip');
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          const presetValue = parseFloat(this.getAttribute('data-preset')) || 0;
          window.EconomarketStorage.saveBudgetLimit(presetValue);
          if (limitInput) {
            limitInput.value = presetValue.toFixed(2).replace('.', ',');
          }
          self.renderMetricsAndProgress();
          if (window.NavigationComponent) {
            window.NavigationComponent.showToast(
              'Teto de orçamento atualizado para ' + window.EconomarketStorage.formatCurrency(presetValue),
              'info'
            );
          }
        });
      });

      // 3. Pré-visualização do Subtotal em tempo real no formulário
      const qtyInput = document.getElementById('budget-item-qty');
      const priceInput = document.getElementById('budget-item-price');
      if (qtyInput && priceInput) {
        const updateSubtotalPreview = function () {
          const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
          const price = self.parseCurrencyInput(priceInput.value);
          const subtotal = qty * price;
          const previewEl = document.getElementById('budget-subtotal-preview-val');
          if (previewEl) {
            previewEl.textContent = window.EconomarketStorage.formatCurrency(subtotal);
          }
        };

        qtyInput.addEventListener('input', updateSubtotalPreview);
        priceInput.addEventListener('input', updateSubtotalPreview);

        const nameInput = document.getElementById('budget-item-name');
        if (nameInput) {
          nameInput.addEventListener('change', function () {
            if (!priceInput.value || parseFloat(priceInput.value) === 0) {
              const val = this.value.trim().toLowerCase();
              const offers = window.EconomarketStorage.getOffers();
              const matching = offers.filter(function (o) { return o.productName.toLowerCase() === val; });
              if (matching.length > 0) {
                const lowest = Math.min.apply(null, matching.map(function (o) { return o.price; }));
                priceInput.value = lowest.toFixed(2).replace('.', ',');
                updateSubtotalPreview();
              }
            }
          });
        }
      }

      // 4. Submissão do Formulário de Adicionar Produto à Sacola
      const form = document.getElementById('budget-item-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          self.handleAddItem();
        });
      }

      // 5. Botão de Esvaziar Sacola
      const btnClearBag = document.getElementById('btn-clear-budget-bag');
      if (btnClearBag) {
        btnClearBag.addEventListener('click', function () {
          const items = window.EconomarketStorage.getBudgetItems();
          if (items.length === 0) return;

          if (confirm('Deseja realmente esvaziar todos os itens da Sacola Controlada?')) {
            window.EconomarketStorage.clearBudgetItems();
            self.render();
            if (window.NavigationComponent) {
              window.NavigationComponent.showToast('Sacola controlada esvaziada com sucesso!', 'info');
            }
          }
        });
      }

      // 6. Delegação de exclusão de item individual na tabela
      const tbody = document.getElementById('budget-items-tbody');
      if (tbody) {
        tbody.addEventListener('click', function (e) {
          const deleteBtn = e.target.closest('.cart-delete-btn');
          if (deleteBtn) {
            const itemId = deleteBtn.getAttribute('data-item-id');
            const itemName = deleteBtn.getAttribute('data-item-name') || 'Item';
            if (itemId) {
              window.EconomarketStorage.deleteBudgetItem(itemId);
              self.render();
              if (window.NavigationComponent) {
                window.NavigationComponent.showToast(itemName + ' removido da sacola.', 'info');
              }
            }
          }
        });
      }
    },

    parseCurrencyInput: function (str) {
      if (!str) return 0;
      let clean = String(str).trim();
      // Se contiver ponto E vírgula (ex: 1.250,50 ou 1,250.50)
      if (clean.includes('.') && clean.includes(',')) {
        if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
          // Padrão brasileiro: 1.250,50 -> remove os pontos de milhar e substitui vírgula por ponto
          clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
          // Padrão americano: 1,250.50 -> remove as vírgulas de milhar
          clean = clean.replace(/,/g, '');
        }
      } else if (clean.includes(',')) {
        // Apenas vírgula decimal: 150,50 -> 150.50
        clean = clean.replace(',', '.');
      }
      // Remove caracteres residuais indesejados
      clean = clean.replace(/[^\d.]/g, '');
      const val = parseFloat(clean);
      return isNaN(val) ? 0 : Math.max(0, val);
    },

    handleAddItem: function () {
      const nameInput = document.getElementById('budget-item-name');
      const qtyInput = document.getElementById('budget-item-qty');
      const priceInput = document.getElementById('budget-item-price');

      if (!nameInput || !qtyInput || !priceInput) return;

      const name = nameInput.value.trim();
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      const price = this.parseCurrencyInput(priceInput.value);

      if (!name) {
        if (window.NavigationComponent) {
          window.NavigationComponent.showToast('Informe o nome do produto.', 'info');
        }
        nameInput.focus();
        return;
      }

      if (price <= 0) {
        if (window.NavigationComponent) {
          window.NavigationComponent.showToast('Informe um preço unitário válido.', 'info');
        }
        priceInput.focus();
        return;
      }

      window.EconomarketStorage.addBudgetItem({
        name: name,
        quantity: qty,
        unitPrice: price,
      });

      // Limpa formulário
      nameInput.value = '';
      qtyInput.value = '1';
      priceInput.value = '';
      const previewEl = document.getElementById('budget-subtotal-preview-val');
      if (previewEl) previewEl.textContent = 'R$ 0,00';

      this.render();
      nameInput.focus();

      if (window.NavigationComponent) {
        window.NavigationComponent.showToast('🛒 ' + name + ' adicionado à sacola!', 'success');
      }
    },

    render: function () {
      const limit = window.EconomarketStorage.getBudgetLimit();
      const limitInput = document.getElementById('budget-limit-input');
      if (limitInput && document.activeElement !== limitInput) {
        limitInput.value = limit.toFixed(2).replace('.', ',');
      }

      this.renderItemsList();
      this.renderMetricsAndProgress();
    },

    renderMetricsAndProgress: function () {
      const limit = window.EconomarketStorage.getBudgetLimit();
      const items = window.EconomarketStorage.getBudgetItems();

      // Cálculos em tempo real
      const totalBag = items.reduce(function (sum, item) {
        const subtotal = (item.quantity || 1) * (item.unitPrice || 0);
        return sum + subtotal;
      }, 0);

      const balance = limit - totalBag;
      const percentUsed = limit > 0 ? (totalBag / limit) * 100 : 0;
      const totalUnits = items.reduce(function (sum, item) { return sum + (item.quantity || 1); }, 0);

      // 1. Atualiza Métricas dos Cards
      const metricLimitEl = document.getElementById('budget-metric-limit-display');
      if (metricLimitEl) {
        metricLimitEl.textContent = window.EconomarketStorage.formatCurrency(limit);
      }

      const metricSpentEl = document.getElementById('budget-metric-spent');
      if (metricSpentEl) {
        metricSpentEl.textContent = window.EconomarketStorage.formatCurrency(totalBag);
      }

      const metricCountEl = document.getElementById('budget-metric-count');
      if (metricCountEl) {
        metricCountEl.textContent = items.length + ' ' + (items.length === 1 ? 'item' : 'itens') + ' (' + totalUnits + ' un)';
      }

      const metricBalanceEl = document.getElementById('budget-metric-balance');
      const balanceCardSub = document.getElementById('budget-balance-sub');

      // Limpa classes anteriores de cor
      if (metricBalanceEl) {
        metricBalanceEl.classList.remove('saldo-verde', 'saldo-amarelo', 'saldo-vermelho');
        metricBalanceEl.textContent = window.EconomarketStorage.formatCurrency(balance);
      }

      // 2. Elementos da Barra de Progresso e Alertas
      const progressBarFill = document.getElementById('budget-progress-fill');
      const percentText = document.getElementById('budget-progress-percent');
      const statusBadge = document.getElementById('budget-status-badge');
      const alertContainer = document.getElementById('budget-alert-container');

      const visualPercent = Math.min(Math.max(percentUsed, 0), 100);
      if (progressBarFill) {
        progressBarFill.style.width = visualPercent + '%';
        progressBarFill.classList.remove('bar-green', 'bar-yellow', 'bar-red');
      }

      if (percentText) {
        percentText.textContent = percentUsed.toFixed(1) + '%';
      }

      if (statusBadge) {
        statusBadge.classList.remove('status-badge-green', 'status-badge-yellow', 'status-badge-red');
      }

      // 3. Regras de Transição de Cores e Alertas
      // - Verde: Saldo confortável (menos de 80% utilizado)
      // - Amarelo: Alerta de atenção (entre 80% e 99.9% utilizado)
      // - Vermelho: Orçamento estourado (100% ou mais utilizado)
      if (percentUsed >= 100) {
        // ESTADO VERMELHO (ESTOURADO)
        if (progressBarFill) progressBarFill.classList.add('bar-red');
        if (metricBalanceEl) metricBalanceEl.classList.add('saldo-vermelho');
        if (balanceCardSub) {
          balanceCardSub.textContent = 'Excedeu em ' + window.EconomarketStorage.formatCurrency(Math.abs(balance));
          balanceCardSub.style.color = 'var(--rose-600)';
        }
        if (statusBadge) {
          statusBadge.classList.add('status-badge-red');
          statusBadge.innerHTML = '<span>🚨</span> <span>Orçamento Estourado</span>';
        }
        if (alertContainer) {
          alertContainer.innerHTML = `
            <div class="budget-alert-banner alert-red">
              <span style="font-size: 1.35rem;">⚠️</span>
              <div>
                <strong>Atenção! Orçamento Estourado em ${window.EconomarketStorage.formatCurrency(Math.abs(balance))}.</strong>
                <div>Você consumiu ${percentUsed.toFixed(1)}% do limite planejado (${window.EconomarketStorage.formatCurrency(totalBag)} de ${window.EconomarketStorage.formatCurrency(limit)}). Considere remover itens ou aumentar seu teto.</div>
              </div>
            </div>
          `;
        }
      } else if (percentUsed >= 80) {
        // ESTADO AMARELO (ALERTA DE ATENÇÃO)
        if (progressBarFill) progressBarFill.classList.add('bar-yellow');
        if (metricBalanceEl) metricBalanceEl.classList.add('saldo-amarelo');
        if (balanceCardSub) {
          balanceCardSub.textContent = 'Restam apenas ' + window.EconomarketStorage.formatCurrency(balance);
          balanceCardSub.style.color = 'var(--amber-600)';
        }
        if (statusBadge) {
          statusBadge.classList.add('status-badge-yellow');
          statusBadge.innerHTML = '<span>⚡</span> <span>Alerta de Atenção</span>';
        }
        if (alertContainer) {
          alertContainer.innerHTML = `
            <div class="budget-alert-banner alert-yellow">
              <span style="font-size: 1.35rem;">🔔</span>
              <div>
                <strong>Alerta de Atenção: ${percentUsed.toFixed(1)}% do orçamento utilizado!</strong>
                <div>Restam ${window.EconomarketStorage.formatCurrency(balance)} disponíveis para não ultrapassar sua meta.</div>
              </div>
            </div>
          `;
        }
      } else {
        // ESTADO VERDE (CONFORTÁVEL)
        if (progressBarFill) progressBarFill.classList.add('bar-green');
        if (metricBalanceEl) metricBalanceEl.classList.add('saldo-verde');
        if (balanceCardSub) {
          balanceCardSub.textContent = 'Disponível para gastar';
          balanceCardSub.style.color = 'var(--green-600)';
        }
        if (statusBadge) {
          statusBadge.classList.add('status-badge-green');
          statusBadge.innerHTML = '<span>✅</span> <span>Saldo Confortável</span>';
        }
        if (alertContainer) {
          alertContainer.innerHTML = '';
        }
      }

      // 4. Rodapé da tabela
      const cartFooterTotal = document.getElementById('budget-cart-total');
      if (cartFooterTotal) {
        cartFooterTotal.textContent = window.EconomarketStorage.formatCurrency(totalBag);
      }

      const cartFooterCount = document.getElementById('budget-cart-count');
      if (cartFooterCount) {
        cartFooterCount.textContent = items.length + ' ' + (items.length === 1 ? 'item' : 'itens');
      }
    },

    renderItemsList: function () {
      const items = window.EconomarketStorage.getBudgetItems();
      const tbody = document.getElementById('budget-items-tbody');
      const emptyState = document.getElementById('budget-empty-bag');
      const tableWrapper = document.getElementById('budget-table-wrapper');
      const tableFooter = document.getElementById('budget-table-footer');

      if (!tbody) return;

      if (items.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (tableFooter) tableFooter.style.display = 'none';
        tbody.innerHTML = '';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (tableWrapper) tableWrapper.style.display = 'block';
      if (tableFooter) tableFooter.style.display = 'flex';

      let html = '';
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const qty = item.quantity || 1;
        const price = item.unitPrice || 0;
        const subtotal = qty * price;

        html += `
          <tr class="cart-item-row">
            <td>
              <div class="cart-item-name">
                <span style="color: var(--blue-600); font-size: 1.1rem;">🛍️</span>
                <span>${this.escapeHtml(item.name)}</span>
              </div>
            </td>
            <td>
              <span class="badge badge-blue">${qty} ${qty === 1 ? 'un' : 'unidades'}</span>
            </td>
            <td>
              <span>${window.EconomarketStorage.formatCurrency(price)}</span>
            </td>
            <td class="text-right">
              <span class="cart-item-subtotal">${window.EconomarketStorage.formatCurrency(subtotal)}</span>
            </td>
            <td class="text-right">
              <button
                type="button"
                class="cart-delete-btn"
                data-item-id="${item.id}"
                data-item-name="${this.escapeHtml(item.name)}"
                title="Remover item da sacola"
                aria-label="Remover ${this.escapeHtml(item.name)}"
              >
                🗑️
              </button>
            </td>
          </tr>
        `;
      }

      tbody.innerHTML = html;
    },

    escapeHtml: function (str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
  };

  window.BudgetCalculatorComponent = BudgetCalculator;
})(window);
