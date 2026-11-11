/**
 * Economarket - SimpleCalculator.js
 * Componente da Calculadora Comercial Rápida (Desafio 1 da Imersão).
 * Visor digital, botões de toque, histórico de fitas e suporte a teclado.
 */

(function (window) {
  'use strict';

  const SimpleCalculator = {
    currentExpression: '0',
    historyExpression: '',
    shouldResetDisplay: false,

    init: function () {
      this.bindEvents();
      this.renderHistoryTape();
    },

    bindEvents: function () {
      const self = this;
      const keypad = document.getElementById('simple-calc-keypad');
      if (keypad) {
        keypad.addEventListener('click', function (e) {
          const btn = e.target.closest('button[data-calc-action]');
          if (!btn) return;

          const action = btn.getAttribute('data-calc-action');
          const val = btn.getAttribute('data-calc-val');
          self.handleAction(action, val);
        });
      }

      // Suporte a teclado físico quando na aba da calculadora
      window.addEventListener('keydown', function (e) {
        if (window.EconomarketRouter && window.EconomarketRouter.getCurrentRoute() !== 'calculator-simple') {
          return;
        }

        // Não intercepta se o foco estiver num input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const key = e.key;
        if (/^[0-9]$/.test(key)) {
          self.appendNumber(key);
        } else if (key === '.' || key === ',') {
          self.appendDecimal();
        } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '%') {
          self.appendOperator(key);
        } else if (key === 'Enter' || key === '=') {
          e.preventDefault();
          self.calculate();
        } else if (key === 'Backspace') {
          self.backspace();
        } else if (key === 'Escape') {
          self.clear();
        }
      });

      // Botão de limpar histórico de fitas
      const btnClearTape = document.getElementById('btn-clear-calc-tape');
      if (btnClearTape) {
        btnClearTape.addEventListener('click', function () {
          window.EconomarketStorage.clearCalcHistory();
          self.renderHistoryTape();
        });
      }
    },

    handleAction: function (action, val) {
      switch (action) {
        case 'num': this.appendNumber(val); break;
        case 'op': this.appendOperator(val); break;
        case 'decimal': this.appendDecimal(); break;
        case 'clear': this.clear(); break;
        case 'del': this.backspace(); break;
        case 'equals': this.calculate(); break;
      }
    },

    appendNumber: function (num) {
      if (this.currentExpression === '0' || this.shouldResetDisplay) {
        this.currentExpression = num;
        this.shouldResetDisplay = false;
      } else {
        this.currentExpression += num;
      }
      this.updateDisplay();
    },

    appendDecimal: function () {
      if (this.shouldResetDisplay) {
        this.currentExpression = '0.';
        this.shouldResetDisplay = false;
      } else {
        // Encontra o último número da expressão
        const parts = this.currentExpression.split(/[+\-*/%]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.indexOf('.') === -1) {
          this.currentExpression += '.';
        }
      }
      this.updateDisplay();
    },

    appendOperator: function (op) {
      this.shouldResetDisplay = false;
      const lastChar = this.currentExpression.slice(-1);

      if ('+-*/%'.indexOf(lastChar) !== -1) {
        this.currentExpression = this.currentExpression.slice(0, -1) + op;
      } else {
        this.currentExpression += op;
      }
      this.updateDisplay();
    },

    backspace: function () {
      if (this.shouldResetDisplay) {
        this.clear();
        return;
      }
      if (this.currentExpression.length > 1) {
        this.currentExpression = this.currentExpression.slice(0, -1);
      } else {
        this.currentExpression = '0';
      }
      this.updateDisplay();
    },

    clear: function () {
      this.currentExpression = '0';
      this.historyExpression = '';
      this.shouldResetDisplay = false;
      this.updateDisplay();
    },

    calculate: function () {
      try {
        const rawExpr = this.currentExpression;
        const result = window.MathEvaluator.evaluateExpression(rawExpr);

        // Formata o número (arredonda dízimas)
        const formatted = Number.isInteger(result) ? String(result) : String(Math.round(result * 10000) / 10000);

        this.historyExpression = rawExpr + ' =';
        this.currentExpression = formatted;
        this.shouldResetDisplay = true;

        // Salva na fita de histórico
        window.EconomarketStorage.addCalcHistory({
          expr: rawExpr,
          result: formatted,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        });

        this.updateDisplay();
        this.renderHistoryTape();
      } catch (err) {
        this.historyExpression = this.currentExpression + ' =';
        this.currentExpression = 'Erro';
        this.shouldResetDisplay = true;
        this.updateDisplay();
      }
    },

    updateDisplay: function () {
      const curEl = document.getElementById('calc-current-display');
      const histEl = document.getElementById('calc-history-display');

      if (curEl) {
        // Substitui * por × e / por ÷ visualmente
        curEl.textContent = this.currentExpression.replace(/\*/g, '×').replace(/\//g, '÷');
      }
      if (histEl) {
        histEl.textContent = this.historyExpression.replace(/\*/g, '×').replace(/\//g, '÷');
      }
    },

    renderHistoryTape: function () {
      const tapeEl = document.getElementById('calc-tape-items');
      if (!tapeEl) return;

      const history = window.EconomarketStorage.getCalcHistory();
      if (history.length === 0) {
        tapeEl.innerHTML = '<div style="color:var(--slate-500);font-size:0.75rem;text-align:center;padding:0.5rem;">Nenhum cálculo recente</div>';
        return;
      }

      tapeEl.innerHTML = history.map(function (item) {
        return (
          '<div class="tape-item">' +
            '<span>' + item.expr.replace(/\*/g, '×').replace(/\//g, '÷') + '</span>' +
            '<span class="tape-result">= ' + item.result + '</span>' +
          '</div>'
        );
      }).join('');
    },
  };

  window.SimpleCalculatorComponent = SimpleCalculator;
})(window);

