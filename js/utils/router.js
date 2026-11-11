/**
 * Economarket - router.js
 * Roteamento dinâmico sem recarregar a página (Single Page Application estática pura).
 * Alterna a visibilidade das seções (<section class="route-section">) com base na rota ativa.
 */

(function (window) {
  'use strict';

  const VALID_ROUTES = ['home', 'calculator-simple', 'calculator-advanced', 'todo-list', 'view-lessons', 'lessons', 'view-budget', 'budget'];
  const DEFAULT_ROUTE = 'home';

  const listeners = [];

  const Router = {
    currentRoute: DEFAULT_ROUTE,

    init: function () {
      const self = this;

      // Evento de mudança de hash na URL
      window.addEventListener('hashchange', function () {
        self.handleHashChange();
      });

      // Captura cliques em links com atributo data-route ou data-target
      document.addEventListener('click', function (e) {
        const link = e.target.closest('[data-route], [data-target]');
        if (link) {
          e.preventDefault();
          const targetRoute = link.getAttribute('data-route') || link.getAttribute('data-target');
          self.navigate(targetRoute);
        }
      });

      // Inicializa com a rota atual da URL ou a padrão
      this.handleHashChange();
    },

    handleHashChange: function () {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const route = VALID_ROUTES.indexOf(hash) !== -1 ? hash : DEFAULT_ROUTE;
      this.setActiveRoute(route);
    },

    navigate: function (route) {
      if (VALID_ROUTES.indexOf(route) === -1) {
        route = DEFAULT_ROUTE;
      }
      window.location.hash = '#' + route;
    },

    setActiveRoute: function (route) {
      // Normaliza aliases para manter consistência
      if (route === 'lessons') route = 'view-lessons';
      if (route === 'budget') route = 'view-budget';
      this.currentRoute = route;

      // 1. Alterna as seções visíveis
      const sections = document.querySelectorAll('.route-section');
      sections.forEach(function (sec) {
        const secRoute = sec.getAttribute('data-section') || sec.id;
        const matches = (secRoute === route) || (sec.id === route) ||
          (route === 'view-lessons' && (secRoute === 'view-lessons' || secRoute === 'lessons' || sec.id === 'view-lessons')) ||
          (route === 'view-budget' && (secRoute === 'view-budget' || secRoute === 'budget' || sec.id === 'view-budget'));

        if (matches) {
          sec.classList.add('active');
          sec.classList.add('animate-fade-in');
        } else {
          sec.classList.remove('active');
          sec.classList.remove('animate-fade-in');
        }
      });

      // 2. Atualiza botões da Navbar
      const navButtons = document.querySelectorAll('.nav-link-btn, .nav-btn');
      navButtons.forEach(function (btn) {
        const btnRoute = btn.getAttribute('data-route') || btn.getAttribute('data-target');
        const matches = (btnRoute === route) ||
          (route === 'view-lessons' && (btnRoute === 'view-lessons' || btnRoute === 'lessons')) ||
          (route === 'view-budget' && (btnRoute === 'view-budget' || btnRoute === 'budget'));

        if (matches) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // 3. Rola a página suavemente para o topo ao trocar de aba
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 4. Notifica observadores inscritos
      listeners.forEach(function (callback) {
        try {
          callback(route);
        } catch (err) {
          console.error('Erro no listener de rota:', err);
        }
      });
    },

    getCurrentRoute: function () {
      return this.currentRoute;
    },

    onRouteChange: function (callback) {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
    },
  };

  window.EconomarketRouter = Router;
})(window);

