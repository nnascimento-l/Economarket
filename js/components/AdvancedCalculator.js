/**
 * Economarket - AdvancedCalculator.js
 * Componente da Calculadora Aprimorada (Desafio 2 da Imersão).
 * 1. Comparador de Embalagens (Peso / Volume: R$/kg ou R$/Litro).
 * 2. Simulador de Promoções ("Leve X Pague Y" / Descontos Especiais).
 * 3. Simulador de Desconto Clube e Margem de Economia.
 */

(function (window) {
  'use strict';

  const AdvancedCalculator = {
    activeTool: 'packaging', // 'packaging' | 'promo' | 'discount'

    init: function () {
      this.bindEvents();
      this.calculatePackagingComparison();
      this.calculatePromo();
      this.calculateSimpleDiscount();
    },

    bindEvents: function () {
      const self = this;

      // Alternância de abas de ferramentas
      document.querySelectorAll('.adv-tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const tool = this.getAttribute('data-adv-tool');
          self.switchTool(tool);
        });
      });

      // Inputs do Comparador de Embalagens
      const packInputs = [
        'pack-a-price', 'pack-a-amount', 'pack-a-unit',
        'pack-b-price', 'pack-b-amount', 'pack-b-unit'
      ];
      packInputs.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', function () { self.calculatePackagingComparison(); });
          el.addEventListener('change', function () { self.calculatePackagingComparison(); });
        }
      });

      // Inputs de Promoção "Leve Mais por Menos"
      const promoInputs = ['promo-unit-price', 'promo-buy-qty', 'promo-pay-qty', 'promo-total-qty'];
      promoInputs.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', function () { self.calculatePromo(); });
        }
      });

      // Inputs de Desconto Clube
      const discInputs = ['disc-price', 'disc-percent'];
      discInputs.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', function () { self.calculateSimpleDiscount(); });
        }
      });
    },

    switchTool: function (toolName) {
      this.activeTool = toolName;

      // Abas
      document.querySelectorAll('.adv-tab-btn').forEach(function (btn) {
        if (btn.getAttribute('data-adv-tool') === toolName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Painéis
      document.querySelectorAll('.adv-tool-panel').forEach(function (panel) {
        if (panel.getAttribute('data-tool-panel') === toolName) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    },

    // 1. CÁLCULO COMPARATIVO DE EMBALAGENS (R$/kg ou R$/L)
    calculatePackagingComparison: function () {
      const pA = parseFloat(document.getElementById('pack-a-price')?.value) || 0;
      const aA = parseFloat(document.getElementById('pack-a-amount')?.value) || 0;
      const uA = document.getElementById('pack-a-unit')?.value || 'g';

      const pB = parseFloat(document.getElementById('pack-b-price')?.value) || 0;
      const aB = parseFloat(document.getElementById('pack-b-amount')?.value) || 0;
      const uB = document.getElementById('pack-b-unit')?.value || 'kg';

      const unitPriceA = window.MathEvaluator.calculateUnitPrice(pA, aA, uA);
      const unitPriceB = window.MathEvaluator.calculateUnitPrice(pB, aB, uB);

      const baseUnit = (uA === 'ml' || uA === 'l' || uB === 'ml' || uB === 'l') ? 'L' : 'kg';

      const resAEl = document.getElementById('pack-a-unit-result');
      const resBEl = document.getElementById('pack-b-unit-result');
      const cardA = document.getElementById('card-pack-a');
      const cardB = document.getElementById('card-pack-b');
      const verdictEl = document.getElementById('packaging-verdict');

      if (resAEl) resAEl.textContent = window.EconomarketStorage.formatCurrency(unitPriceA) + ' / ' + baseUnit;
      if (resBEl) resBEl.textContent = window.EconomarketStorage.formatCurrency(unitPriceB) + ' / ' + baseUnit;

      if (!cardA || !cardB || !verdictEl) return;

      cardA.classList.remove('winner');
      cardB.classList.remove('winner');

      if (unitPriceA > 0 && unitPriceB > 0) {
        if (unitPriceA < unitPriceB) {
          cardA.classList.add('winner');
          const diff = unitPriceB - unitPriceA;
          const pct = ((unitPriceB - unitPriceA) / unitPriceB) * 100;
          verdictEl.innerHTML =
            '<div class="verdict-text-group">' +
              '<h4>🏆 Embalagem A é a Mais Vantajosa!</h4>' +
              '<p>Você economiza <strong style="color:var(--green-400);">' + window.EconomarketStorage.formatCurrency(diff) + '</strong> por ' + baseUnit + ' comprando a Opção A em vez da B.</p>' +
            '</div>' +
            '<div class="verdict-savings-badge">-' + pct.toFixed(1) + '%</div>';
        } else if (unitPriceB < unitPriceA) {
          cardB.classList.add('winner');
          const diff = unitPriceA - unitPriceB;
          const pct = ((unitPriceA - unitPriceB) / unitPriceA) * 100;
          verdictEl.innerHTML =
            '<div class="verdict-text-group">' +
              '<h4>🏆 Embalagem B é a Mais Vantajosa!</h4>' +
              '<p>Você economiza <strong style="color:var(--green-400);">' + window.EconomarketStorage.formatCurrency(diff) + '</strong> por ' + baseUnit + ' comprando a Opção B em vez da A.</p>' +
            '</div>' +
            '<div class="verdict-savings-badge">-' + pct.toFixed(1) + '%</div>';
        } else {
          verdictEl.innerHTML =
            '<div class="verdict-text-group">' +
              '<h4>⚖️ Preços Equivalentes</h4>' +
              '<p>Ambas as embalagens possuem exatamente o mesmo custo por ' + baseUnit + '!</p>' +
            '</div>' +
            '<div class="verdict-savings-badge">0%</div>';
        }
      } else {
        verdictEl.innerHTML =
          '<div class="verdict-text-group">' +
            '<h4>Preencha os valores de ambas as embalagens</h4>' +
            '<p>Descubra instantaneamente qual tamanho compensa mais comprar.</p>' +
          '</div>';
      }
    },

    // 2. CÁLCULO DE PROMOÇÕES (LEVE X PAGUE Y)
    calculatePromo: function () {
      const price = parseFloat(document.getElementById('promo-unit-price')?.value) || 0;
      const buy = parseInt(document.getElementById('promo-buy-qty')?.value, 10) || 3;
      const pay = parseInt(document.getElementById('promo-pay-qty')?.value, 10) || 2;
      const total = parseInt(document.getElementById('promo-total-qty')?.value, 10) || 3;

      const res = window.MathEvaluator.calculateBuyXPayY(price, buy, pay, total);

      const elRegular = document.getElementById('promo-regular-total');
      const elPromo = document.getElementById('promo-final-total');
      const elSavings = document.getElementById('promo-savings-total');
      const elEffective = document.getElementById('promo-effective-price');

      if (elRegular) elRegular.textContent = window.EconomarketStorage.formatCurrency(res.regularTotal);
      if (elPromo) elPromo.textContent = window.EconomarketStorage.formatCurrency(res.promoTotal);
      if (elSavings) elSavings.textContent = window.EconomarketStorage.formatCurrency(res.savings) + ' (' + res.percentSavings.toFixed(1) + '%)';
      if (elEffective) elEffective.textContent = window.EconomarketStorage.formatCurrency(res.effectiveUnitPrice) + ' / un';
    },

    // 3. CÁLCULO DE DESCONTO CLUBE / %
    calculateSimpleDiscount: function () {
      const price = parseFloat(document.getElementById('disc-price')?.value) || 0;
      const percent = parseFloat(document.getElementById('disc-percent')?.value) || 0;

      const res = window.MathEvaluator.calculateDiscount(price, percent);

      const elOriginal = document.getElementById('disc-res-original');
      const elSavings = document.getElementById('disc-res-savings');
      const elFinal = document.getElementById('disc-res-final');

      if (elOriginal) elOriginal.textContent = window.EconomarketStorage.formatCurrency(res.originalPrice);
      if (elSavings) elSavings.textContent = '-' + window.EconomarketStorage.formatCurrency(res.discountValue) + ' (' + res.discountPercent + '%)';
      if (elFinal) elFinal.textContent = window.EconomarketStorage.formatCurrency(res.finalPrice);
    },
  };

  window.AdvancedCalculatorComponent = AdvancedCalculator;
})(window);

