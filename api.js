/* ==========================================================================
   api.js — REST API client
   Talks to FakeStoreAPI (https://fakestoreapi.com). All network access is
   isolated here so app.js never touches fetch() directly.
   ========================================================================== */

const API_BASE = "https://fakestoreapi.com";

/**
 * Generic fetch wrapper: adds a timeout, checks response.ok, and
 * normalizes errors into a single shape the UI layer can render.
 */
async function request(path, { signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  // Let an external signal (e.g. a cancelled search) abort us too.
  if (signal) signal.addEventListener("abort", () => controller.abort());

  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw new Error(err.message || "Network error. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetch every product. */
export async function fetchProducts(signal) {
  return request("/products", { signal });
}

/** Fetch the list of product categories. */
export async function fetchCategories(signal) {
  return request("/products/categories", { signal });
}

/** Fetch products for a single category ("all" bypasses filtering here). */
export async function fetchProductsByCategory(category, signal) {
  if (!category || category === "all") return fetchProducts(signal);
  return request(`/products/category/${encodeURIComponent(category)}`, { signal });
}
