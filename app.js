/* ==========================================================================
   app.js — DOM logic & client state
   Owns rendering, search/filter/sort, localStorage caching, and error/
   loading UI. All network calls are delegated to api.js.
   ========================================================================== */

import { fetchProducts, fetchCategories } from "./api.js";

const CACHE_KEY = "storefront:cache:v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const els = {
  grid: document.getElementById("product-grid"),
  search: document.getElementById("search-input"),
  tabs: document.getElementById("category-tabs"),
  sort: document.getElementById("sort-select"),
  errorBanner: document.getElementById("error-banner"),
  resultCount: document.getElementById("result-count"),
};

/** In-memory client state. Filtering/sorting never re-hits the network. */
const state = {
  allProducts: [],
  categories: ["all"],
  activeCategory: "all",
  searchTerm: "",
  sortBy: "default",
};

let activeController = null;

/* ---------------------------------- */
/* Local cache helpers                */
/* ---------------------------------- */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null; // corrupted cache is treated as a miss, never a crash
  }
}

function writeCache(products, categories) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ products, categories, savedAt: Date.now() })
    );
  } catch {
    // Storage full or unavailable (private browsing) — fail silently,
    // the app still works without caching.
  }
}

/* ---------------------------------- */
/* Error / loading UI                 */
/* ---------------------------------- */
function showError(message) {
  els.errorBanner.textContent = message;
  els.errorBanner.hidden = false;
}

function clearError() {
  els.errorBanner.hidden = true;
  els.errorBanner.textContent = "";
}

function renderSkeleton(count = 8) {
  els.grid.innerHTML = Array.from({ length: count })
    .map(() => `<div class="product-card skeleton" aria-hidden="true"></div>`)
    .join("");
}

/* ---------------------------------- */
/* Rendering                          */
/* ---------------------------------- */
function renderTabs() {
  els.tabs.innerHTML = state.categories
    .map(
      (cat) => `
      <button
        class="tab ${cat === state.activeCategory ? "tab--active" : ""}"
        data-category="${cat}"
        aria-pressed="${cat === state.activeCategory}"
      >${cat}</button>`
    )
    .join("");
}

function getVisibleProducts() {
  let list = state.allProducts;

  if (state.activeCategory !== "all") {
    list = list.filter((p) => p.category === state.activeCategory);
  }

  if (state.searchTerm.trim()) {
    const term = state.searchTerm.trim().toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(term));
  }

  const sorted = [...list];
  if (state.sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
  if (state.sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
  if (state.sortBy === "rating-desc") {
    sorted.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0));
  }

  return sorted;
}

function renderProducts() {
  const visible = getVisibleProducts();
  els.resultCount.textContent = `${visible.length} item${visible.length === 1 ? "" : "s"}`;

  if (visible.length === 0) {
    els.grid.innerHTML = `<p class="empty-state">No products match your search.</p>`;
    return;
  }

  els.grid.innerHTML = visible
    .map(
      (p) => `
      <article class="product-card">
        <img src="${p.image}" alt="${p.title}" loading="lazy" />
        <h3>${p.title}</h3>
        <p class="price">$${p.price.toFixed(2)}</p>
        <p class="rating">★ ${p.rating?.rate ?? "—"} (${p.rating?.count ?? 0})</p>
      </article>`
    )
    .join("");
}

function render() {
  renderTabs();
  renderProducts();
}

/* ---------------------------------- */
/* Data loading                       */
/* ---------------------------------- */
async function loadData() {
  clearError();

  const cached = readCache();
  if (cached) {
    state.allProducts = cached.products;
    state.categories = ["all", ...cached.categories];
    render();
    return; // Cache hit: skip the network entirely.
  }

  renderSkeleton();

  if (activeController) activeController.abort();
  activeController = new AbortController();

  try {
    const [products, categories] = await Promise.all([
      fetchProducts(activeController.signal),
      fetchCategories(activeController.signal),
    ]);

    state.allProducts = products;
    state.categories = ["all", ...categories];
    writeCache(products, categories);
    render();
  } catch (err) {
    showError(err.message || "Something went wrong loading products.");
    els.grid.innerHTML = "";
  }
}

/* ---------------------------------- */
/* Event wiring (no full-page reload) */
/* ---------------------------------- */
function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

els.search.addEventListener(
  "input",
  debounce((e) => {
    state.searchTerm = e.target.value;
    renderProducts();
  })
);

els.tabs.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  state.activeCategory = btn.dataset.category;
  render();
});

els.sort.addEventListener("change", (e) => {
  state.sortBy = e.target.value;
  renderProducts();
});

document.addEventListener("DOMContentLoaded", loadData);
