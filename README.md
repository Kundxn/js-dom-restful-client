# Dynamic JavaScript DOM Logic & RESTful API Client

A vanilla ES6+ storefront that fetches live product data, filters and sorts
it entirely on the client, and manages state without any full-page reloads.

## Files

- `api.js` — isolates all network access: async/await `fetch` calls to
  [FakeStoreAPI](https://fakestoreapi.com), with request timeouts and
  normalized error messages
- `app.js` — DOM rendering, search/category/sort state, localStorage
  caching, loading skeletons, and error banners
- `index.html` / `style.css` — a minimal demo page to run and screenshot
  the client in the browser

## What's implemented

- **Async/await fetch**: `fetchProducts()` and `fetchCategories()` in
  `api.js` hit FakeStoreAPI in parallel with `Promise.all`, each guarded
  by an 8s timeout via `AbortController`
- **Real-time filtering, tabs, sorting**: search input (debounced),
  category tabs, and a sort dropdown all re-render from the in-memory
  `state.allProducts` array — no network call and no page reload
- **Client-side state caching**: results are cached in `localStorage`
  for 5 minutes (`CACHE_KEY`/`CACHE_TTL_MS`); a cache hit skips the
  network entirely on repeat visits
- **Error handling & loading states**: a dismissible-style error banner
  (`#error-banner`) surfaces network/timeout failures in plain language,
  and `renderSkeleton()` shows shimmering placeholder cards while data
  loads

## Run locally

Because `app.js` uses ES modules, serve the folder rather than opening
`index.html` directly (module imports are blocked on `file://`):

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed local URL in a browser.

## Notes

- Swap `API_BASE` in `api.js` to point at any other REST API — the rest
  of the app only depends on the product shape (`title`, `price`,
  `category`, `image`, `rating`).
- To simulate an error state for screenshots, temporarily set
  `API_BASE` to an invalid host.
