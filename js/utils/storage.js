/**
 * Economarket - storage.js
 * Utilitário modular de persistência em localStorage para ofertas,
 * lista de compras e histórico de cálculos.
 */

(function (window) {
  'use strict';

  const STORAGE_OFFERS_KEY = 'economarket_offers_v1';
  const STORAGE_TODO_KEY = 'economarket_shopping_list_v1';
  const STORAGE_CALC_KEY = 'economarket_calc_history_v1';
  const STORAGE_BUDGET_LIMIT_KEY = 'economarket_budget_limit_v1';
  const STORAGE_BUDGET_ITEMS_KEY = 'economarket_budget_items_v1';
  const STORAGE_VERSION_KEY = 'economarket_db_version_v2';
  const CURRENT_DB_VERSION = 'v2_47_products_expanded';

  const DEFAULT_BUDGET_LIMIT = 200.0;

  // Itens padrão de demonstração para a Sacola Controlada
  const INITIAL_BUDGET_ITEMS = [
    { id: 'bitem-1', name: 'Café Torrado e Moído Tradicional 500g', quantity: 1, unitPrice: 18.90, createdAt: Date.now() - 3000 },
    { id: 'bitem-2', name: 'Leite Integral UHT 1L', quantity: 2, unitPrice: 4.59, createdAt: Date.now() - 2000 },
    { id: 'bitem-3', name: 'Arroz Branco Tipo 1 5kg', quantity: 1, unitPrice: 26.89, createdAt: Date.now() - 1000 },
  ];

  // Base expandida de produtos do dia a dia com cotações realistas em Atacadão, Assaí, Extra e Carrefour
  const RAW_PRODUCTS_DATA = [
    // === 1. MERCEARIA & GRÃOS ===
    {
      name: 'Arroz Branco Tipo 1 5kg',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Atacadão', price: 26.89, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 27.90, date: '2026-11-05', notes: 'Preço a partir de 2 un.' },
        { market: 'Supermercado Extra', price: 31.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 32.50, date: '2026-11-06', notes: 'Clube Carrefour' },
      ],
    },
    {
      name: 'Feijão Carioca 1kg',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Assaí Atacadista', price: 6.49, date: '2026-11-05' },
        { market: 'Atacadão', price: 6.79, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 7.99, date: '2026-11-06' },
        { market: 'Carrefour', price: 8.49, date: '2026-11-06' },
      ],
    },
    {
      name: 'Feijão Preto Tipo 1 1kg',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Atacadão', price: 7.29, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 7.49, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 8.89, date: '2026-11-06' },
        { market: 'Carrefour', price: 9.19, date: '2026-11-06' },
      ],
    },
    {
      name: 'Açúcar Refinado 1kg',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Assaí Atacadista', price: 4.29, date: '2026-11-05' },
        { market: 'Atacadão', price: 4.49, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 5.19, date: '2026-11-06' },
        { market: 'Carrefour', price: 5.49, date: '2026-11-06' },
      ],
    },
    {
      name: 'Café Torrado e Moído Tradicional 500g',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Assaí Atacadista', price: 18.90, date: '2026-11-04', notes: 'Preço de atacado a partir de 3 un.' },
        { market: 'Atacadão', price: 19.49, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 23.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 24.99, date: '2026-11-06', notes: 'Clube Carrefour' },
      ],
    },
    {
      name: 'Óleo de Soja Refinado 900ml',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Atacadão', price: 5.99, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 6.19, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 6.99, date: '2026-11-06' },
        { market: 'Carrefour', price: 7.29, date: '2026-11-06' },
      ],
    },
    {
      name: 'Azeite de Oliva Extra Virgem 500ml',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Atacadão', price: 35.50, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 36.90, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 42.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 43.90, date: '2026-11-06' },
      ],
    },
    {
      name: 'Farinha de Trigo Especial 1kg',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Atacadão', price: 4.39, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 4.69, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 5.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 5.79, date: '2026-11-06' },
      ],
    },
    {
      name: 'Farinha de Mandioca Torrada 500g',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Assaí Atacadista', price: 3.89, date: '2026-11-05' },
        { market: 'Atacadão', price: 4.19, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 4.99, date: '2026-11-06' },
        { market: 'Carrefour', price: 5.29, date: '2026-11-06' },
      ],
    },
    {
      name: 'Fermento Químico em Pó 100g',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Atacadão', price: 3.49, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 3.79, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 4.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 4.69, date: '2026-11-06' },
      ],
    },
    {
      name: 'Macarrão Espaguete nº 8 500g',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Assaí Atacadista', price: 3.29, date: '2026-11-05' },
        { market: 'Atacadão', price: 3.49, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 4.19, date: '2026-11-06' },
        { market: 'Carrefour', price: 4.49, date: '2026-11-06' },
      ],
    },
    {
      name: 'Molho de Tomate Tradicional 300g',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Atacadão', price: 1.69, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 1.89, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 2.39, date: '2026-11-06' },
        { market: 'Carrefour', price: 2.59, date: '2026-11-06' },
      ],
    },
    {
      name: 'Sal Refinado Iodado 1kg',
      category: 'Mercearia & Grãos',
      offers: [
        { market: 'Assaí Atacadista', price: 2.19, date: '2026-11-05' },
        { market: 'Atacadão', price: 2.29, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 2.89, date: '2026-11-06' },
        { market: 'Carrefour', price: 2.99, date: '2026-11-06' },
      ],
    },

    // === 2. BISCOITOS, PÃES & MATINAIS ===
    {
      name: 'Biscoito Recheado Chocolate 130g',
      category: 'Biscoitos, Pães & Matinais',
      offers: [
        { market: 'Atacadão', price: 2.29, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 2.49, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 3.19, date: '2026-11-06' },
        { market: 'Carrefour', price: 3.49, date: '2026-11-06' },
      ],
    },
    {
      name: 'Bolacha Cream Cracker 350g',
      category: 'Biscoitos, Pães & Matinais',
      offers: [
        { market: 'Assaí Atacadista', price: 4.59, date: '2026-11-05' },
        { market: 'Atacadão', price: 4.89, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 5.79, date: '2026-11-06' },
        { market: 'Carrefour', price: 5.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Biscoito Maizena Tradicional 350g',
      category: 'Biscoitos, Pães & Matinais',
      offers: [
        { market: 'Atacadão', price: 4.69, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 4.99, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 5.89, date: '2026-11-06' },
        { market: 'Carrefour', price: 6.19, date: '2026-11-06' },
      ],
    },
    {
      name: 'Pão de Forma Tradicional 480g',
      category: 'Biscoitos, Pães & Matinais',
      offers: [
        { market: 'Assaí Atacadista', price: 6.49, date: '2026-11-05' },
        { market: 'Atacadão', price: 6.79, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 7.99, date: '2026-11-06' },
        { market: 'Carrefour', price: 8.49, date: '2026-11-06' },
      ],
    },
    {
      name: 'Achocolatado em Pó 370g',
      category: 'Biscoitos, Pães & Matinais',
      offers: [
        { market: 'Atacadão', price: 6.89, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 7.19, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 8.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 8.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Torradas Tradicionais 140g',
      category: 'Biscoitos, Pães & Matinais',
      offers: [
        { market: 'Assaí Atacadista', price: 4.39, date: '2026-11-05' },
        { market: 'Atacadão', price: 4.69, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 5.39, date: '2026-11-06' },
        { market: 'Carrefour', price: 5.69, date: '2026-11-06' },
      ],
    },

    // === 3. LATICÍNIOS & FRIOS ===
    {
      name: 'Leite Integral UHT 1L',
      category: 'Laticínios & Frios',
      offers: [
        { market: 'Atacadão', price: 4.59, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 4.69, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 5.29, date: '2026-11-06' },
        { market: 'Carrefour', price: 5.49, date: '2026-11-06' },
      ],
    },
    {
      name: 'Iogurte Danone (Bandeja c/ 6 un)',
      category: 'Laticínios & Frios',
      offers: [
        { market: 'Assaí Atacadista', price: 7.89, date: '2026-11-05' },
        { market: 'Atacadão', price: 8.29, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 9.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 9.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Iogurte de Garrafa Morango 800g',
      category: 'Laticínios & Frios',
      offers: [
        { market: 'Atacadão', price: 6.99, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 7.39, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 8.79, date: '2026-11-06' },
        { market: 'Carrefour', price: 8.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Queijo Mussarela Fatiado 150g',
      category: 'Laticínios & Frios',
      offers: [
        { market: 'Assaí Atacadista', price: 8.49, date: '2026-11-05' },
        { market: 'Atacadão', price: 8.89, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 10.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 10.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Presunto Cozido Fatiado 150g',
      category: 'Laticínios & Frios',
      offers: [
        { market: 'Atacadão', price: 5.49, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 5.79, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 6.89, date: '2026-11-06' },
        { market: 'Carrefour', price: 7.19, date: '2026-11-06' },
      ],
    },
    {
      name: 'Requeijão Cremoso Tradicional 200g',
      category: 'Laticínios & Frios',
      offers: [
        { market: 'Assaí Atacadista', price: 6.99, date: '2026-11-05' },
        { market: 'Atacadão', price: 7.39, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 8.69, date: '2026-11-06' },
        { market: 'Carrefour', price: 8.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Manteiga com Sal Pote 200g',
      category: 'Laticínios & Frios',
      offers: [
        { market: 'Atacadão', price: 10.89, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 11.29, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 12.99, date: '2026-11-06' },
        { market: 'Carrefour', price: 13.49, date: '2026-11-06' },
      ],
    },
    {
      name: 'Margarina Cremosa com Sal 500g',
      category: 'Laticínios & Frios',
      offers: [
        { market: 'Assaí Atacadista', price: 6.29, date: '2026-11-05' },
        { market: 'Atacadão', price: 6.59, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 7.89, date: '2026-11-06' },
        { market: 'Carrefour', price: 8.19, date: '2026-11-06' },
      ],
    },

    // === 4. CARNES & AVES ===
    {
      name: 'Contrafilé Bovino (kg)',
      category: 'Carnes & Aves',
      offers: [
        { market: 'Atacadão', price: 41.90, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 43.50, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 49.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 52.90, date: '2026-11-06' },
      ],
    },
    {
      name: 'Alcatra Bovina Bife (kg)',
      category: 'Carnes & Aves',
      offers: [
        { market: 'Assaí Atacadista', price: 38.90, date: '2026-11-05' },
        { market: 'Atacadão', price: 39.90, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 46.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 48.90, date: '2026-11-06' },
      ],
    },
    {
      name: 'Picanha Bovina Peça/Fatiada (kg)',
      category: 'Carnes & Aves',
      offers: [
        { market: 'Atacadão', price: 64.90, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 67.90, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 79.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 84.90, date: '2026-11-06' },
      ],
    },
    {
      name: 'Peito de Frango Filé Congelado 1kg',
      category: 'Carnes & Aves',
      offers: [
        { market: 'Assaí Atacadista', price: 16.90, date: '2026-11-05' },
        { market: 'Atacadão', price: 17.49, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 20.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 21.90, date: '2026-11-06' },
      ],
    },
    {
      name: 'Linguiça Toscana Churrasco (kg)',
      category: 'Carnes & Aves',
      offers: [
        { market: 'Atacadão', price: 17.89, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 18.49, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 22.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 23.90, date: '2026-11-06' },
      ],
    },
    {
      name: 'Carne Moída Patinho Resfriado 500g',
      category: 'Carnes & Aves',
      offers: [
        { market: 'Assaí Atacadista', price: 19.90, date: '2026-11-05' },
        { market: 'Atacadão', price: 20.90, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 24.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 26.50, date: '2026-11-06' },
      ],
    },
    {
      name: 'Salsicha Hot Dog Granel (kg)',
      category: 'Carnes & Aves',
      offers: [
        { market: 'Atacadão', price: 9.89, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 10.49, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 12.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 13.50, date: '2026-11-06' },
      ],
    },

    // === 5. SOBREMESAS & DOCES ===
    {
      name: 'Leite Condensado Semidesnatado 395g',
      category: 'Sobremesas & Doces',
      offers: [
        { market: 'Assaí Atacadista', price: 5.49, date: '2026-11-05' },
        { market: 'Atacadão', price: 5.69, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 6.79, date: '2026-11-06' },
        { market: 'Carrefour', price: 6.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Creme de Leite Tradicional 200g',
      category: 'Sobremesas & Doces',
      offers: [
        { market: 'Atacadão', price: 2.89, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 2.99, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 3.79, date: '2026-11-06' },
        { market: 'Carrefour', price: 3.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Chocolate em Barra ao Leite 90g',
      category: 'Sobremesas & Doces',
      offers: [
        { market: 'Assaí Atacadista', price: 4.99, date: '2026-11-05' },
        { market: 'Atacadão', price: 5.29, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 6.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 6.79, date: '2026-11-06' },
      ],
    },
    {
      name: 'Gelatina em Pó Sabores 20g',
      category: 'Sobremesas & Doces',
      offers: [
        { market: 'Atacadão', price: 1.39, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 1.49, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 1.99, date: '2026-11-06' },
        { market: 'Carrefour', price: 2.19, date: '2026-11-06' },
      ],
    },
    {
      name: 'Mistura para Bolo Tradicional 400g',
      category: 'Sobremesas & Doces',
      offers: [
        { market: 'Assaí Atacadista', price: 4.19, date: '2026-11-05' },
        { market: 'Atacadão', price: 4.49, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 5.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 5.79, date: '2026-11-06' },
      ],
    },

    // === 6. HORTIFRUTI & LIMPEZA ===
    {
      name: 'Batata Inglesa Lavada (kg)',
      category: 'Hortifruti & Limpeza',
      offers: [
        { market: 'Atacadão', price: 4.89, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 5.19, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 6.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 6.99, date: '2026-11-06', notes: 'Quarta do Hortifruti' },
      ],
    },
    {
      name: 'Cebola Nacional Amarela (kg)',
      category: 'Hortifruti & Limpeza',
      offers: [
        { market: 'Assaí Atacadista', price: 3.99, date: '2026-11-05' },
        { market: 'Atacadão', price: 4.29, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 5.29, date: '2026-11-06' },
        { market: 'Carrefour', price: 5.69, date: '2026-11-06' },
      ],
    },
    {
      name: 'Tomate Italiano Longa Vida (kg)',
      category: 'Hortifruti & Limpeza',
      offers: [
        { market: 'Atacadão', price: 6.49, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 6.89, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 8.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 8.99, date: '2026-11-06' },
      ],
    },
    {
      name: 'Banana Prata Selecionada (kg)',
      category: 'Hortifruti & Limpeza',
      offers: [
        { market: 'Assaí Atacadista', price: 6.49, date: '2026-11-05' },
        { market: 'Atacadão', price: 6.89, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 7.99, date: '2026-11-06' },
        { market: 'Carrefour', price: 8.49, date: '2026-11-06' },
      ],
    },
    {
      name: 'Sabão em Pó Concentrado 1.6kg',
      category: 'Hortifruti & Limpeza',
      offers: [
        { market: 'Atacadão', price: 16.90, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 17.20, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 21.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 22.50, date: '2026-11-06' },
      ],
    },
    {
      name: 'Detergente Líquido Lava-Louças 500ml',
      category: 'Hortifruti & Limpeza',
      offers: [
        { market: 'Assaí Atacadista', price: 1.89, date: '2026-11-05' },
        { market: 'Atacadão', price: 1.99, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 2.49, date: '2026-11-06' },
        { market: 'Carrefour', price: 2.69, date: '2026-11-06' },
      ],
    },
    {
      name: 'Amaciante Concentrado para Roupas 2L',
      category: 'Hortifruti & Limpeza',
      offers: [
        { market: 'Atacadão', price: 8.90, date: '2026-11-04' },
        { market: 'Assaí Atacadista', price: 9.30, date: '2026-11-05' },
        { market: 'Supermercado Extra', price: 11.50, date: '2026-11-06' },
        { market: 'Carrefour', price: 11.90, date: '2026-11-06' },
      ],
    },
    {
      name: 'Papel Higiênico Folha Dupla (12 rolos)',
      category: 'Hortifruti & Limpeza',
      offers: [
        { market: 'Assaí Atacadista', price: 14.90, date: '2026-11-05' },
        { market: 'Atacadão', price: 15.49, date: '2026-11-04' },
        { market: 'Supermercado Extra', price: 18.90, date: '2026-11-06' },
        { market: 'Carrefour', price: 19.90, date: '2026-11-06' },
      ],
    },
  ];

  // Gera lista indexada de ofertas com IDs únicos
  const INITIAL_MOCK_OFFERS = [];
  let offerIndex = 1;
  RAW_PRODUCTS_DATA.forEach(function (prod) {
    prod.offers.forEach(function (off) {
      INITIAL_MOCK_OFFERS.push({
        id: 'mock-' + (offerIndex++),
        productName: prod.name,
        category: prod.category,
        supermarketName: off.market,
        price: off.price,
        date: off.date || '2026-11-05',
        notes: off.notes || '',
      });
    });
  });

  // Itens padrão da Lista de Compras
  const INITIAL_SHOPPING_ITEMS = [
    { id: 'item-1', name: 'Café Torrado e Moído 500g', completed: false, createdAt: Date.now() - 3000 },
    { id: 'item-2', name: 'Leite Integral UHT 1L', completed: false, createdAt: Date.now() - 2000 },
    { id: 'item-3', name: 'Arroz Branco Tipo 1 5kg', completed: true, createdAt: Date.now() - 1000 },
  ];

  const Storage = {
    // === OFERTAS DO COMPARADOR ===
    getOffers: function () {
      try {
        const dbVersion = localStorage.getItem(STORAGE_VERSION_KEY);
        const raw = localStorage.getItem(STORAGE_OFFERS_KEY);

        // Se for a primeira vez ou estiver na versão antiga com poucos produtos
        if (!raw || dbVersion !== CURRENT_DB_VERSION) {
          this.saveOffers(INITIAL_MOCK_OFFERS);
          localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_DB_VERSION);
          return INITIAL_MOCK_OFFERS;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length < 30) {
          this.saveOffers(INITIAL_MOCK_OFFERS);
          localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_DB_VERSION);
          return INITIAL_MOCK_OFFERS;
        }
        return parsed;
      } catch (e) {
        console.error('Erro ao ler ofertas do localStorage:', e);
        return INITIAL_MOCK_OFFERS;
      }
    },

    saveOffers: function (offers) {
      try {
        localStorage.setItem(STORAGE_OFFERS_KEY, JSON.stringify(offers));
      } catch (e) {
        console.error('Erro ao salvar ofertas no localStorage:', e);
      }
    },

    addOffer: function (offerData) {
      const offers = this.getOffers();
      const newOffer = Object.assign({}, offerData, {
        id: 'offer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        productName: String(offerData.productName || '').trim(),
        supermarketName: String(offerData.supermarketName || '').trim(),
      });
      offers.push(newOffer);
      this.saveOffers(offers);
      return newOffer;
    },

    updateOffer: function (id, updatedData) {
      const offers = this.getOffers();
      const index = offers.findIndex(function (o) { return o.id === id; });
      if (index === -1) return null;

      offers[index] = Object.assign({}, offers[index], updatedData, {
        productName: (updatedData.productName !== undefined ? updatedData.productName : offers[index].productName).trim(),
        supermarketName: (updatedData.supermarketName !== undefined ? updatedData.supermarketName : offers[index].supermarketName).trim(),
      });
      this.saveOffers(offers);
      return offers[index];
    },

    deleteOffer: function (id) {
      const offers = this.getOffers();
      const filtered = offers.filter(function (o) { return o.id !== id; });
      if (filtered.length !== offers.length) {
        this.saveOffers(filtered);
        return true;
      }
      return false;
    },

    deleteProductGroup: function (productName) {
      const offers = this.getOffers();
      const target = String(productName || '').trim().toLowerCase();
      const filtered = offers.filter(function (o) {
        return o.productName.trim().toLowerCase() !== target;
      });
      if (filtered.length !== offers.length) {
        this.saveOffers(filtered);
        return true;
      }
      return false;
    },

    resetToMockData: function () {
      this.saveOffers(INITIAL_MOCK_OFFERS);
      this.saveBudgetLimit(DEFAULT_BUDGET_LIMIT);
      this.saveBudgetItems(INITIAL_BUDGET_ITEMS);
      try {
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_DB_VERSION);
      } catch (e) {}
      return INITIAL_MOCK_OFFERS;
    },

    // === LISTA DE COMPRAS (TO-DO) ===
    getShoppingList: function () {
      try {
        const raw = localStorage.getItem(STORAGE_TODO_KEY);
        if (!raw) {
          this.saveShoppingList(INITIAL_SHOPPING_ITEMS);
          return INITIAL_SHOPPING_ITEMS;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Erro ao ler lista do localStorage:', e);
        return [];
      }
    },

    saveShoppingList: function (items) {
      try {
        localStorage.setItem(STORAGE_TODO_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Erro ao salvar lista no localStorage:', e);
      }
    },

    addShoppingItem: function (name) {
      const items = this.getShoppingList();
      const newItem = {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        name: String(name || '').trim(),
        completed: false,
        createdAt: Date.now(),
      };
      items.unshift(newItem);
      this.saveShoppingList(items);
      return newItem;
    },

    toggleShoppingItem: function (id) {
      const items = this.getShoppingList().map(function (it) {
        if (it.id === id) {
          return Object.assign({}, it, { completed: !it.completed });
        }
        return it;
      });
      this.saveShoppingList(items);
      return items;
    },

    deleteShoppingItem: function (id) {
      const items = this.getShoppingList().filter(function (it) { return it.id !== id; });
      this.saveShoppingList(items);
      return items;
    },

    clearCompletedShoppingItems: function () {
      const items = this.getShoppingList().filter(function (it) { return !it.completed; });
      this.saveShoppingList(items);
      return items;
    },

    // === HISTÓRICO DA CALCULADORA ===
    getCalcHistory: function () {
      try {
        const raw = localStorage.getItem(STORAGE_CALC_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    addCalcHistory: function (entry) {
      try {
        const list = this.getCalcHistory();
        list.unshift(entry);
        if (list.length > 20) list.pop();
        localStorage.setItem(STORAGE_CALC_KEY, JSON.stringify(list));
      } catch (e) {}
    },

    clearCalcHistory: function () {
      try {
        localStorage.removeItem(STORAGE_CALC_KEY);
      } catch (e) {}
    },

    // === CALCULADORA DE ORÇAMENTO LIMITE (SACOLA CONTROLADA) ===
    getBudgetLimit: function () {
      try {
        const raw = localStorage.getItem(STORAGE_BUDGET_LIMIT_KEY);
        if (raw === null || raw === undefined) {
          this.saveBudgetLimit(DEFAULT_BUDGET_LIMIT);
          return DEFAULT_BUDGET_LIMIT;
        }
        const val = parseFloat(raw);
        return isNaN(val) ? DEFAULT_BUDGET_LIMIT : val;
      } catch (e) {
        console.error('Erro ao ler limite de orçamento:', e);
        return DEFAULT_BUDGET_LIMIT;
      }
    },

    saveBudgetLimit: function (amount) {
      try {
        const val = Math.max(0, parseFloat(amount) || 0);
        localStorage.setItem(STORAGE_BUDGET_LIMIT_KEY, val.toString());
        return val;
      } catch (e) {
        console.error('Erro ao salvar limite de orçamento:', e);
        return DEFAULT_BUDGET_LIMIT;
      }
    },

    getBudgetItems: function () {
      try {
        const raw = localStorage.getItem(STORAGE_BUDGET_ITEMS_KEY);
        if (!raw) {
          this.saveBudgetItems(INITIAL_BUDGET_ITEMS);
          return INITIAL_BUDGET_ITEMS;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Erro ao ler itens da sacola:', e);
        return INITIAL_BUDGET_ITEMS;
      }
    },

    saveBudgetItems: function (items) {
      try {
        localStorage.setItem(STORAGE_BUDGET_ITEMS_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Erro ao salvar itens da sacola:', e);
      }
    },

    addBudgetItem: function (itemData) {
      const items = this.getBudgetItems();
      const qty = Math.max(1, parseInt(itemData.quantity, 10) || 1);
      const price = Math.max(0, parseFloat(itemData.unitPrice) || 0);
      const newItem = {
        id: 'bitem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        name: String(itemData.name || '').trim(),
        quantity: qty,
        unitPrice: price,
        subtotal: qty * price,
        createdAt: Date.now(),
      };
      items.unshift(newItem);
      this.saveBudgetItems(items);
      return newItem;
    },

    deleteBudgetItem: function (id) {
      const items = this.getBudgetItems().filter(function (it) { return it.id !== id; });
      this.saveBudgetItems(items);
      return items;
    },

    clearBudgetItems: function () {
      this.saveBudgetItems([]);
      return [];
    },

    // === HELPERS DE CÁLCULO E FORMATAÇÃO ===
    formatCurrency: function (value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(Number(value) || 0);
    },

    formatDateBR: function (dateStr) {
      if (!dateStr) return '';
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return parts[2] + '/' + parts[1] + '/' + parts[0];
        }
        return new Date(dateStr).toLocaleDateString('pt-BR');
      } catch (e) {
        return dateStr;
      }
    },

    groupOffersByProduct: function (offers) {
      const map = new Map();

      for (let i = 0; i < offers.length; i++) {
        const o = offers[i];
        const key = o.productName.trim().toLowerCase();
        if (map.has(key)) {
          map.get(key).offers.push(o);
        } else {
          map.set(key, {
            name: o.productName.trim(),
            category: o.category || 'Outros',
            offers: [o],
          });
        }
      }

      const comparisons = [];
      map.forEach(function (item) {
        const sorted = item.offers.slice().sort(function (a, b) {
          return a.price - b.price;
        });

        const lowest = sorted[0].price;
        const highest = sorted[sorted.length - 1].price;
        const diff = Math.max(0, highest - lowest);
        const percent = highest > 0 ? ((highest - lowest) / highest) * 100 : 0;
        const total = sorted.reduce(function (sum, cur) { return sum + cur.price; }, 0);

        comparisons.push({
          productName: item.name,
          category: item.category,
          offers: sorted,
          lowestPrice: lowest,
          highestPrice: highest,
          cheapestSupermarket: sorted[0].supermarketName,
          mostExpensiveSupermarket: sorted[sorted.length - 1].supermarketName,
          priceDifference: diff,
          percentageSavings: percent,
          averagePrice: total / sorted.length,
        });
      });

      return comparisons.sort(function (a, b) {
        return b.percentageSavings - a.percentageSavings;
      });
    },

    calculateStats: function (products, offers) {
      const totalProducts = products.length;
      const totalOffers = offers.length;

      if (totalProducts === 0) {
        return {
          totalProducts: 0,
          totalOffers: 0,
          avgVariationPercentage: 0,
          totalPotentialSavings: 0,
          bestOverallMarket: '—',
        };
      }

      const multi = products.filter(function (p) { return p.offers.length > 1; });
      const avgVar = multi.length > 0
        ? multi.reduce(function (sum, p) { return sum + p.percentageSavings; }, 0) / multi.length
        : 0;

      const totalSavings = multi.reduce(function (sum, p) {
        return sum + p.priceDifference;
      }, 0);

      const winsMap = {};
      products.forEach(function (p) {
        winsMap[p.cheapestSupermarket] = (winsMap[p.cheapestSupermarket] || 0) + 1;
      });

      let bestMarket = '—';
      let maxWins = 0;
      Object.keys(winsMap).forEach(function (m) {
        if (winsMap[m] > maxWins) {
          maxWins = winsMap[m];
          bestMarket = m;
        }
      });

      return {
        totalProducts: totalProducts,
        totalOffers: totalOffers,
        avgVariationPercentage: avgVar,
        totalPotentialSavings: totalSavings,
        bestOverallMarket: bestMarket,
      };
    },
  };

  window.EconomarketStorage = Storage;
})(window);

