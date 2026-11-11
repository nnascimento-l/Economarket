/**
 * Economarket - mathEvaluator.js
 * Avaliador matemático seguro para a calculadora e utilitários
 * de cálculo financeiro e comparador de embalagens da imersão.
 */

(function (window) {
  'use strict';

  const MathEvaluator = {
    /**
     * Avalia uma expressão matemática de forma segura (sem usar eval).
     * Suporta números decimais, parênteses e operadores +, -, *, /, %
     */
    evaluateExpression: function (expr) {
      if (!expr || typeof expr !== 'string') return 0;
      // Limpa caracteres estranhos mantendo apenas dígitos, operadores e pontos
      const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');

      // Validação de segurança básica: apenas dígitos, operadores, parênteses e pontos
      if (!/^[\d\s+\-*/%.()]+$/.test(sanitized)) {
        throw new Error('Expressão contém caracteres inválidos');
      }

      try {
        // Tokenizer simples
        const tokens = sanitized.match(/\d+(\.\d+)?|[+\-*/%()]/g);
        if (!tokens) return 0;

        // Algoritmo Shunting-yard simplificado para notação RPN
        const outputQueue = [];
        const operatorStack = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];

          if (!isNaN(parseFloat(token))) {
            outputQueue.push(parseFloat(token));
          } else if ('+-*/%'.indexOf(token) !== -1) {
            // Suporte para sinal negativo unário no início ou após outro operador
            if (token === '-' && (i === 0 || '+-*/%('.indexOf(tokens[i - 1]) !== -1)) {
              tokens[i + 1] = '-' + tokens[i + 1];
              continue;
            }

            while (
              operatorStack.length > 0 &&
              operatorStack[operatorStack.length - 1] !== '(' &&
              precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
            ) {
              outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
          } else if (token === '(') {
            operatorStack.push(token);
          } else if (token === ')') {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
              outputQueue.push(operatorStack.pop());
            }
            operatorStack.pop(); // remove '('
          }
        }

        while (operatorStack.length > 0) {
          outputQueue.push(operatorStack.pop());
        }

        // Execução do RPN
        const evalStack = [];
        for (let j = 0; j < outputQueue.length; j++) {
          const item = outputQueue[j];
          if (typeof item === 'number') {
            evalStack.push(item);
          } else {
            const b = evalStack.pop();
            const a = evalStack.pop();
            if (a === undefined || b === undefined) throw new Error('Sintaxe incorreta');

            switch (item) {
              case '+': evalStack.push(a + b); break;
              case '-': evalStack.push(a - b); break;
              case '*': evalStack.push(a * b); break;
              case '/':
                if (b === 0) throw new Error('Divisão por zero');
                evalStack.push(a / b);
                break;
              case '%': evalStack.push((a * b) / 100); break;
              default: throw new Error('Operador desconhecido');
            }
          }
        }

        if (evalStack.length !== 1 || isNaN(evalStack[0])) {
          throw new Error('Resultado inválido');
        }

        return evalStack[0];
      } catch (err) {
        console.warn('Erro ao avaliar expressão:', expr, err.message);
        throw err;
      }
    },

    /**
     * Normaliza quantidade para unidade base padrão (kg ou Litro).
     */
    normalizeAmount: function (amount, unit) {
      const num = parseFloat(amount) || 0;
      const u = String(unit || '').toLowerCase();
      if (u === 'g' || u === 'ml') return num / 1000;
      if (u === 'kg' || u === 'l' || u === 'litro' || u === 'litros') return num;
      return num;
    },

    /**
     * Calcula preço unitário por kg ou por Litro.
     */
    calculateUnitPrice: function (price, amount, unit) {
      const p = parseFloat(price) || 0;
      const normalized = this.normalizeAmount(amount, unit);
      if (normalized <= 0) return 0;
      return p / normalized;
    },

    /**
     * Calcula promoção "Leve X Pague Y"
     */
    calculateBuyXPayY: function (unitPrice, buyQty, payQty, totalPurchased) {
      const p = parseFloat(unitPrice) || 0;
      const buy = parseInt(buyQty, 10) || 1;
      const pay = parseInt(payQty, 10) || 1;
      const total = parseInt(totalPurchased, 10) || buy;

      const regularTotal = total * p;
      const sets = Math.floor(total / buy);
      const remainder = total % buy;
      const promoTotal = (sets * pay * p) + (remainder * p);
      const savings = Math.max(0, regularTotal - promoTotal);
      const effectiveUnitPrice = total > 0 ? promoTotal / total : p;
      const percentSavings = regularTotal > 0 ? (savings / regularTotal) * 100 : 0;

      return {
        regularTotal: regularTotal,
        promoTotal: promoTotal,
        savings: savings,
        percentSavings: percentSavings,
        effectiveUnitPrice: effectiveUnitPrice,
      };
    },

    /**
     * Calcula desconto percentual simples
     */
    calculateDiscount: function (originalPrice, discountPercent) {
      const p = parseFloat(originalPrice) || 0;
      const d = parseFloat(discountPercent) || 0;
      const discountVal = (p * d) / 100;
      const finalPrice = Math.max(0, p - discountVal);
      return {
        originalPrice: p,
        discountPercent: d,
        discountValue: discountVal,
        finalPrice: finalPrice,
      };
    },
  };

  window.MathEvaluator = MathEvaluator;
})(window);

