/**
 * Economarket - Home.js
 * Página inicial: Resumo, Grid de Categorias, Top 4 Maiores Economias da Semana
 * e lista filtrada de produtos (cartões) com cotações por supermercado.
 */

(function (window) {
  'use strict';

  const POPULAR_SUPERMARKETS = [
    'Assaí Atacadista',
    'Atacadão',
    'Carrefour',
    'Pão de Açúcar',
    'Supermercado Extra',
    'Sam\'s Club',
    'Supermercado Dia',
    'Supermercado Local / Bairro',
  ];

  // Cartões do Grid de Categorias: cada um sabe quais produtos pertencem a ele
  const CLEANING_REGEX = /sab[ãa]o|detergente|amaciante|papel higi/i;

  const HOME_CATEGORIES = [
    { id: 'mercearia', icon: '🛒', label: 'Mercearia',
      match: function (p) { return p.category === 'Mercearia & Grãos'; } },
    { id: 'carnes', icon: '🥩', label: 'Carnes & Aves',
      match: function (p) { return p.category === 'Carnes & Aves'; } },
    { id: 'laticinios', icon: '🥛', label: 'Laticínios & Frios',
      match: function (p) { return p.category === 'Laticínios & Frios'; } },
    { id: 'matinais', icon: '🍪', label: 'Matinais & Biscoitos',
      match: function (p) { return p.category === 'Biscoitos, Pães & Matinais'; } },
    { id: 'sobremesas', icon: '🍫', label: 'Sobremesas',
      match: function (p) { return p.category === 'Sobremesas & Doces'; } },
    { id: 'limpeza', icon: '🧼', label: 'Limpeza & Higiene',
      match: function (p) {
        return p.category === 'Limpeza' ||
          p.category === 'Higiene & Cuidados' ||
          (p.category === 'Hortifruti & Limpeza' && CLEANING_REGEX.test(p.productName));
      } },
  ];

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pct(n) {
    return n.toFixed(1).replace('.', ',');
  }

  function money(v) {
    return window.EconomarketStorage.formatCurrency(v);
  }

  function setHidden(id, hidden) {
    const el = document.getElementById(id);
    if (el) el.hidden = hidden;
  }

  const Home = {
    searchTerm: '',
    selectedCategory: null, // null = visão geral | id do cartão | 'all'
    selectedSupermarket: 'Todos',
    sortBy: 'savings_desc',
    expanded: {}, // { [nomeDoProduto]: true } -> cotações abertas
    editingOfferId: null,

    init: function () {
      this.bindEvents();
      this.refresh();
    },

    refresh: function () {
      this.renderSummary();
      this.renderSupermarketOptions();
      this.renderView();
      this.populateDatalists();
    },

    // ---------- Eventos ----------
    bindEvents: function () {
      const self = this;

      const searchInput = document.getElementById('home-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', function (e) {
          self.searchTerm = e.target.value;
          self.renderView();
        });
      }

      const marketSelect = document.getElementById('home-supermarket-select');
      if (marketSelect) {
        marketSelect.addEventListener('change', function (e) {
          self.selectedSupermarket = e.target.value;
          self.renderProducts();
        });
      }

      const sortSelect = document.getElementById('home-sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', function (e) {
          self.sortBy = e.target.value;
          self.renderProducts();
        });
      }

      const offerForm = document.getElementById('offer-modal-form');
      if (offerForm) {
        offerForm.addEventListener('submit', function (e) {
          e.preventDefault();
          self.handleSaveOffer();
        });
      }

      document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.closeAllModais();
        });
      });

      // Um único listener para todos os botões da Home (data-home-action)
      document.addEventListener('click', function (e) {
        const el = e.target.closest('[data-home-action]');
        if (!el) return;
        const action = el.getAttribute('data-home-action');
        const id = el.getAttribute('data-id');
        const product = el.getAttribute('data-product');

        switch (action) {
          case 'select-category': self.selectCategory(id); break;
          case 'back': self.clearFilters(); break;
          case 'toggle-offers': self.toggleOffers(product, el); break;
          case 'focus-product': self.focusProduct(product); break;
          case 'edit-offer': self.openEditOfferModal(id); break;
          case 'delete-offer': self.deleteOffer(id); break;
          case 'add-offer': self.openNewOfferModal(product, el.getAttribute('data-category')); break;
          default: break;
        }
      });
    },

    // ---------- Navegação interna da Home ----------
    selectCategory: function (id) {
      this.selectedCategory = id;
      this.renderView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    focusProduct: function (encodedName) {
      const name = decodeURIComponent(encodedName);
      this.selectedCategory = null;
      this.searchTerm = name;
      this.expanded[name] = true;
      const input = document.getElementById('home-search-input');
      if (input) input.value = name;
      this.renderView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // "Ver cotações" abre os cartões da mesma fileira (grade alinhada).
    // "Ocultar cotações" fecha apenas o cartão clicado.
    toggleOffers: function (encodedName, btn) {
      const self = this;
      const name = decodeURIComponent(encodedName);

      if (this.expanded[name]) {
        this.expanded[name] = false;
        this.renderProducts();
        return;
      }

      // Descobre quais cartões estão na mesma linha da grade (mesmo topo)
      let names = [name];
      const tile = btn && btn.closest ? btn.closest('.product-tile') : null;
      if (tile && tile.parentElement) {
        const top = tile.offsetTop;
        names = Array.prototype.slice.call(tile.parentElement.children)
          .filter(function (t) { return Math.abs(t.offsetTop - top) < 4; })
          .map(function (t) {
            const b = t.querySelector('[data-home-action="toggle-offers"]');
            return b ? decodeURIComponent(b.getAttribute('data-product')) : null;
          })
          .filter(Boolean);
      }

      names.forEach(function (n) { self.expanded[n] = true; });
      this.renderProducts();
    },

    clearFilters: function () {
      this.searchTerm = '';
      this.selectedCategory = null;
      this.selectedSupermarket = 'Todos';
      const input = document.getElementById('home-search-input');
      if (input) input.value = '';
      const sel = document.getElementById('home-supermarket-select');
      if (sel) sel.value = 'Todos';
      this.renderView();
    },

    // Alterna entre "visão geral" (categorias + top 4) e "lista filtrada"
    renderView: function () {
      const inList = this.selectedCategory !== null || this.searchTerm.trim() !== '';
      setHidden('home-overview', inList);
      setHidden('home-list-view', !inList);
      setHidden('home-list-toolbar', !inList);
      if (inList) {
        this.renderProducts();
      } else {
        this.renderCategoryGrid();
        this.renderTopSavings();
      }
    },

    // ---------- Dados ----------
    getAllProducts: function () {
      return window.EconomarketStorage.groupOffersByProduct(window.EconomarketStorage.getOffers());
    },

    getFilteredProducts: function () {
      const self = this;
      let products = this.getAllProducts();

      if (self.selectedCategory && self.selectedCategory !== 'all') {
        const def = HOME_CATEGORIES.find(function (c) { return c.id === self.selectedCategory; });
        if (def) products = products.filter(def.match);
      }

      if (self.searchTerm.trim()) {
        const term = self.searchTerm.trim().toLowerCase();
        products = products.filter(function (p) {
          return p.productName.toLowerCase().indexOf(term) !== -1;
        });
      }

      if (self.selectedSupermarket !== 'Todos') {
        products = products.filter(function (p) {
          return p.offers.some(function (o) {
            return o.supermarketName.toLowerCase() === self.selectedSupermarket.toLowerCase();
          });
        });
      }

      products.sort(function (a, b) {
        switch (self.sortBy) {
          case 'savings_desc': return b.percentageSavings - a.percentageSavings;
          case 'price_asc': return a.lowestPrice - b.lowestPrice;
          case 'name_asc': return a.productName.localeCompare(b.productName, 'pt-BR');
          case 'offers_desc': return b.offers.length - a.offers.length;
          default: return 0;
        }
      });

      return products;
    },

    // ---------- Renderização ----------
    renderSummary: function () {
      const offers = window.EconomarketStorage.getOffers();
      const products = window.EconomarketStorage.groupOffersByProduct(offers);
      const stats = window.EconomarketStorage.calculateStats(products, offers);

      const set = function (id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      };
      set('stat-total-products', stats.totalProducts);
      set('stat-total-offers', stats.totalOffers + ' cotações cadastradas');
      set('stat-avg-variation', stats.avgVariationPercentage.toFixed(1) + '%');
      set('stat-potential-savings', money(stats.totalPotentialSavings));
      set('stat-best-market', stats.bestOverallMarket || '—');
    },

    renderSupermarketOptions: function () {
      const sel = document.getElementById('home-supermarket-select');
      if (!sel) return;
      const offers = window.EconomarketStorage.getOffers();
      const markets = Array.from(new Set(offers.map(function (o) { return o.supermarketName; }))).sort();
      sel.innerHTML = '<option value="Todos">Todos os Supermercados</option>' +
        markets.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + '</option>'; }).join('');
      sel.value = markets.indexOf(this.selectedSupermarket) !== -1 ? this.selectedSupermarket : 'Todos';
    },

    // Seção 1: Grid de Categorias Principais
    renderCategoryGrid: function () {
      const container = document.getElementById('home-category-grid');
      if (!container) return;
      const products = this.getAllProducts();

      let html = HOME_CATEGORIES.map(function (def) {
        const items = products.filter(def.match);
        const best = items.reduce(function (m, p) { return Math.max(m, p.percentageSavings); }, 0);
        return '<button type="button" class="category-card" data-home-action="select-category" data-id="' + def.id + '">' +
          '<span class="category-card-icon">' + def.icon + '</span>' +
          '<span class="category-card-body">' +
            '<span class="category-card-name">' + def.label + '</span>' +
            '<span class="category-card-meta">' + items.length + (items.length === 1 ? ' produto' : ' produtos') +
              (best > 0 ? ' · até ' + best.toFixed(0) + '% de economia' : '') + '</span>' +
          '</span>' +
          '<span class="category-card-arrow">›</span>' +
        '</button>';
      }).join('');

      html += '<button type="button" class="category-card category-card-all" data-home-action="select-category" data-id="all">' +
        '<span class="category-card-icon">📋</span>' +
        '<span class="category-card-body">' +
          '<span class="category-card-name">Ver todos os produtos</span>' +
          '<span class="category-card-meta">' + products.length + ' itens comparados</span>' +
        '</span>' +
        '<span class="category-card-arrow">›</span>' +
      '</button>';

      container.innerHTML = html;
    },

    // Seção 2: Top 4 Maiores Economias da Semana
    renderTopSavings: function () {
      const container = document.getElementById('home-top-savings');
      if (!container) return;
      const self = this;

      const top = this.getAllProducts()
        .filter(function (p) { return p.offers.length > 1; })
        .sort(function (a, b) { return b.percentageSavings - a.percentageSavings; })
        .slice(0, 4);

      if (top.length === 0) {
        container.innerHTML = '<p class="empty-hint">Cadastre cotações em mais de um mercado para ver as maiores economias.</p>';
        return;
      }

      container.innerHTML = top.map(function (p, i) {
        return '<article class="top-card">' +
          '<div class="top-card-head">' +
            '<span class="top-rank">#' + (i + 1) + '</span>' +
            '<span class="savings-pill">-' + pct(p.percentageSavings) + '%</span>' +
          '</div>' +
          '<span class="category-badge ' + self.getCategoryClass(p.category) + '">' + esc(p.category) + '</span>' +
          '<h3 class="top-card-title">' + esc(p.productName) + '</h3>' +
          '<div class="top-card-price">' + money(p.lowestPrice) + '</div>' +
          '<div class="top-card-market">🏆 ' + esc(p.cheapestSupermarket) + '</div>' +
          '<div class="top-card-compare">Mais caro: ' + money(p.highestPrice) + ' (' + esc(p.mostExpensiveSupermarket) + ')</div>' +
          '<div class="top-card-diff">Você economiza ' + money(p.priceDifference) + '</div>' +
          '<button type="button" class="btn btn-secondary btn-block" data-home-action="focus-product" data-product="' +
            encodeURIComponent(p.productName) + '">Ver cotações</button>' +
        '</article>';
      }).join('');
    },

    // Lista filtrada (aparece ao escolher uma categoria ou buscar)
    renderProducts: function () {
      const self = this;
      const container = document.getElementById('home-products-list');
      const counterEl = document.getElementById('home-results-count');
      const titleEl = document.getElementById('home-list-title');
      if (!container) return;

      const products = this.getFilteredProducts();

      if (counterEl) {
        counterEl.textContent = products.length + (products.length === 1 ? ' produto comparado' : ' produtos comparados');
      }
      if (titleEl) {
        const def = HOME_CATEGORIES.find(function (c) { return c.id === self.selectedCategory; });
        titleEl.textContent = def ? def.icon + ' ' + def.label
          : (self.selectedCategory === 'all' ? '📋 Todos os produtos' : '🔍 Resultados da busca');
      }

      if (products.length === 0) {
        container.innerHTML =
          '<div class="empty-state">' +
            '<div class="empty-state-icon">🔍</div>' +
            '<h3>Nenhum produto encontrado</h3>' +
            '<p>Nenhum item corresponde aos filtros selecionados.</p>' +
            '<button type="button" class="btn btn-secondary" data-home-action="back">Limpar filtros</button>' +
          '</div>';
        return;
      }

      container.innerHTML = '<div class="product-grid">' + products.map(function (p) {
        const enc = encodeURIComponent(p.productName);
        const open = !!self.expanded[p.productName];
        return '<article class="product-tile">' +
          '<div class="product-tile-top">' +
            '<span class="category-badge ' + self.getCategoryClass(p.category) + '">' + esc(p.category) + '</span>' +
            (p.offers.length > 1 ? '<span class="savings-pill">-' + pct(p.percentageSavings) + '%</span>' : '') +
          '</div>' +
          '<h3 class="product-tile-title">' + esc(p.productName) + '</h3>' +
          '<div class="product-tile-price">' + money(p.lowestPrice) + '</div>' +
          '<div class="product-tile-market">🏆 ' + esc(p.cheapestSupermarket) + ' · ' + p.offers.length + ' redes</div>' +
          '<button type="button" class="btn btn-secondary btn-block" data-home-action="toggle-offers" data-product="' + enc + '">' +
            (open ? 'Ocultar cotações' : 'Ver cotações') + '</button>' +
          (open ? self.renderOffersList(p) : '') +
        '</article>';
      }).join('') + '</div>';
    },

    renderOffersList: function (product) {
      const enc = encodeURIComponent(product.productName);
      let html = '<div class="offers-list">';
      product.offers.forEach(function (offer, idx) {
        const diff = offer.price - product.lowestPrice;
        html += '<div class="offer-row' + (idx === 0 ? ' cheapest' : '') + '">' +
          '<div class="offer-row-info">' +
            '<strong>' + esc(offer.supermarketName) + '</strong>' +
            '<span class="offer-row-meta">📅 ' + window.EconomarketStorage.formatDateBR(offer.date) +
              (offer.notes ? ' · ℹ️ ' + esc(offer.notes) : '') + '</span>' +
          '</div>' +
          '<div class="offer-row-price">' + money(offer.price) +
            (idx !== 0 && diff > 0 ? '<small>+' + money(diff) + '</small>' : '') + '</div>' +
          '<div class="offer-row-actions">' +
            '<button type="button" class="icon-btn" title="Editar cotação" data-home-action="edit-offer" data-id="' + esc(offer.id) + '">✏️</button>' +
            '<button type="button" class="icon-btn" title="Excluir cotação" data-home-action="delete-offer" data-id="' + esc(offer.id) + '">🗑️</button>' +
          '</div>' +
        '</div>';
      });
      html += '<button type="button" class="btn btn-secondary btn-block" data-home-action="add-offer" data-product="' + enc +
        '" data-category="' + esc(product.category) + '">＋ Cotar em outro mercado</button>';
      html += '</div>';
      return html;
    },

    getCategoryClass: function (cat) {
      if (!cat) return 'cat-outros';
      if (cat.indexOf('Mercearia') !== -1 || cat.indexOf('Grãos') !== -1) return 'cat-mercearia';
      if (cat.indexOf('Biscoito') !== -1 || cat.indexOf('Pães') !== -1 || cat.indexOf('Padaria') !== -1) return 'cat-biscoitos';
      if (cat.indexOf('Laticínios') !== -1 || cat.indexOf('Frios') !== -1) return 'cat-laticinios';
      if (cat.indexOf('Carne') !== -1 || cat.indexOf('Aves') !== -1) return 'cat-carnes';
      if (cat.indexOf('Sobremesa') !== -1 || cat.indexOf('Doce') !== -1) return 'cat-sobremesas';
      if (cat.indexOf('Hortifruti') !== -1) return 'cat-hortifruti';
      if (cat.indexOf('Limpeza') !== -1) return 'cat-limpeza';
      if (cat.indexOf('Bebida') !== -1) return 'cat-bebidas';
      return 'cat-outros';
    },

    // ---------- Modal de Oferta (cadastro / edição) ----------
    openNewOfferModal: function (encodedInitialName, initialCat) {
      this.editingOfferId = null;
      document.getElementById('modal-offer-title').textContent = 'Cadastrar Nova Oferta';
      const pName = encodedInitialName ? decodeURIComponent(encodedInitialName) : '';
      document.getElementById('offer-input-product').value = pName;
      document.getElementById('offer-select-category').value = initialCat || 'Mercearia & Grãos';
      document.getElementById('offer-input-market').value = '';
      document.getElementById('offer-input-price').value = '';
      document.getElementById('offer-input-date').value = new Date().toISOString().split('T')[0];
      document.getElementById('offer-input-notes').value = '';
      this.populateDatalists();
      this.openModal('modal-offer');
    },

    openEditOfferModal: function (offerId) {
      const offers = window.EconomarketStorage.getOffers();
      const offer = offers.find(function (o) { return o.id === offerId; });
      if (!offer) return;
      this.editingOfferId = offerId;
      document.getElementById('modal-offer-title').textContent = 'Editar Oferta';
      document.getElementById('offer-input-product').value = offer.productName;
      document.getElementById('offer-select-category').value = offer.category || 'Mercearia & Grãos';
      document.getElementById('offer-input-market').value = offer.supermarketName;
      document.getElementById('offer-input-price').value = offer.price.toFixed(2).replace('.', ',');
      document.getElementById('offer-input-date').value = offer.date || new Date().toISOString().split('T')[0];
      document.getElementById('offer-input-notes').value = offer.notes || '';
      this.populateDatalists();
      this.openModal('modal-offer');
    },

    populateDatalists: function () {
      const offers = window.EconomarketStorage.getOffers();
      const pList = document.getElementById('list-existing-products');
      const mList = document.getElementById('list-existing-markets');
      if (pList) {
        const names = Array.from(new Set(offers.map(function (o) { return o.productName; }))).sort();
        pList.innerHTML = names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('');
      }
      if (mList) {
        mList.innerHTML = POPULAR_SUPERMARKETS.map(function (m) { return '<option value="' + esc(m) + '">'; }).join('');
      }
    },

    handleSaveOffer: function () {
      const pName = document.getElementById('offer-input-product').value.trim();
      const cat = document.getElementById('offer-select-category').value;
      const mName = document.getElementById('offer-input-market').value.trim();
      const priceStr = document.getElementById('offer-input-price').value.replace(',', '.');
      const date = document.getElementById('offer-input-date').value;
      const notes = document.getElementById('offer-input-notes').value.trim();
      const price = parseFloat(priceStr);

      if (!pName || !mName || isNaN(price) || price <= 0 || !date) {
        alert('Por favor, preencha todos os campos obrigatórios com valores válidos.');
        return;
      }

      const offerData = {
        productName: pName,
        category: cat,
        supermarketName: mName,
        price: price,
        date: date,
        notes: notes || undefined,
      };

      if (this.editingOfferId) {
        window.EconomarketStorage.updateOffer(this.editingOfferId, offerData);
        window.NavigationComponent.showToast('Oferta atualizada com sucesso!', 'success');
      } else {
        window.EconomarketStorage.addOffer(offerData);
        window.NavigationComponent.showToast('Nova oferta cadastrada com sucesso!', 'success');
      }
      this.closeAllModais();
      this.refresh();
    },

    deleteOffer: function (offerId) {
      if (confirm('Deseja realmente remover esta cotação de preço?')) {
        window.EconomarketStorage.deleteOffer(offerId);
        window.NavigationComponent.showToast('Cotação removida!', 'info');
        this.refresh();
      }
    },

    deleteProductGroup: function (encodedName) {
      const pName = decodeURIComponent(encodedName);
      if (confirm('Deseja realmente excluir o produto "' + pName + '" e todas as suas cotações?')) {
        window.EconomarketStorage.deleteProductGroup(pName);
        window.NavigationComponent.showToast('Produto removido!', 'info');
        this.refresh();
      }
    },

    openModal: function (id) {
      const modal = document.getElementById(id);
      if (modal) modal.classList.add('open');
    },

    closeAllModais: function () {
      document.querySelectorAll('.modal-overlay').forEach(function (m) {
        m.classList.remove('open');
      });
    },
  };

  window.HomeComponent = Home;
})(window);
