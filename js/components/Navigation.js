/**
 * Economarket - Navigation.js
 * Componente da barra de navegação no topo, controle de rotas ativas
 * e notificações rápidas (Toast).
 */

(function (window) {
  'use strict';

  const Navigation = {
    init: function () {
      const self = this;

      // Botão Nova Oferta no topo
      const btnNewOffer = document.getElementById('btn-navbar-new-offer');
      if (btnNewOffer) {
        btnNewOffer.addEventListener('click', function () {
          // Se não estiver na home, navega para a home primeiro
          if (window.EconomarketRouter.getCurrentRoute() !== 'home') {
            window.EconomarketRouter.navigate('home');
          }
          // Abre o modal de nova oferta
          if (window.HomeComponent && typeof window.HomeComponent.openNewOfferModal === 'function') {
            window.HomeComponent.openNewOfferModal();
          }
        });
      }

      // Atalho de reset de dados de exemplo se existir no topo ou rodapé
      const btnReset = document.getElementById('btn-reset-data');
      if (btnReset) {
        btnReset.addEventListener('click', function () {
          if (confirm('Deseja restaurar as ofertas de demonstração originais com produtos populares?')) {
            window.EconomarketStorage.resetToMockData();
            if (window.HomeComponent && typeof window.HomeComponent.refresh === 'function') {
              window.HomeComponent.refresh();
            }
            if (window.BudgetCalculatorComponent && typeof window.BudgetCalculatorComponent.render === 'function') {
              window.BudgetCalculatorComponent.render();
            }
            self.showToast('Dados de demonstração restaurados com sucesso!', 'success');
          }
        });
      }
    },

    showToast: function (message, type) {
      type = type || 'success';
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;

      const icon = type === 'success' ? '✓' : 'ℹ';
      toast.innerHTML = '<span>' + icon + '</span> <span>' + message + '</span>';

      container.appendChild(toast);

      setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, 3500);
    },
  };

  window.NavigationComponent = Navigation;
})(window);

