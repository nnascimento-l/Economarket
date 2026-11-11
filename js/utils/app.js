/**
 * Economarket - app.js
 * Ponto de entrada e inicialização de todos os módulos e componentes da aplicação estática pura.
 */

(function (window) {
  'use strict';

  function initApp() {
    console.log('🚀 Inicializando Economarket (Arquitetura Estática Modular Pura)...');

    // 1. Inicializa o Router
    if (window.EconomarketRouter) {
      window.EconomarketRouter.init();
    }

    // 2. Inicializa a Barra de Navegação
    if (window.NavigationComponent) {
      window.NavigationComponent.init();
    }

    // 3. Inicializa os Componentes das Telas
    if (window.HomeComponent) {
      window.HomeComponent.init();
    }

    if (window.SimpleCalculatorComponent) {
      window.SimpleCalculatorComponent.init();
    }

    if (window.AdvancedCalculatorComponent) {
      window.AdvancedCalculatorComponent.init();
    }

    if (window.TodoListComponent) {
      window.TodoListComponent.init();
    }

    if (window.LessonsComponent) {
      window.LessonsComponent.init();
    }

    if (window.BudgetCalculatorComponent) {
      window.BudgetCalculatorComponent.init();
    }

    // 4. Conecta o roteador para atualizar os componentes ao trocar de aba
    if (window.EconomarketRouter) {
      window.EconomarketRouter.onRouteChange(function (route) {
        if (route === 'home' && window.HomeComponent) {
          window.HomeComponent.refresh();
        } else if (route === 'todo-list' && window.TodoListComponent) {
          window.TodoListComponent.render();
        } else if (route === 'calculator-simple' && window.SimpleCalculatorComponent) {
          window.SimpleCalculatorComponent.renderHistoryTape();
        } else if ((route === 'view-lessons' || route === 'lessons') && window.LessonsComponent) {
          window.LessonsComponent.render();
        } else if ((route === 'view-budget' || route === 'budget') && window.BudgetCalculatorComponent) {
          window.BudgetCalculatorComponent.render();
        }
      });
    }

    console.log('✅ Economarket pronto para uso! Rota ativa:', window.EconomarketRouter.getCurrentRoute());
  }

  // Executa após o carregamento completo do DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})(window);

