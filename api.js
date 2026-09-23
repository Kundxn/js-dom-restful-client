const API_BASE = "https://fakestoreapi.com";
async function request(path, { signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

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

export async function fetchProducts(signal) {
  return request("/products", { signal });
}

export async function fetchCategories(signal) {
  return request("/products/categories", { signal });
}

export async function fetchProductsByCategory(category, signal) {
  if (!category || category === "all") return fetchProducts(signal);
  return request(`/products/category/${encodeURIComponent(category)}`, { signal });
}
