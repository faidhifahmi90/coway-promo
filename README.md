# Coway sales page

Static, dependency-free sales page for Coway products (Bahasa Melayu), grouped by category, sub-type and monthly price.

- `index.html` – layout and static sections
- `data.js` – all products, rental plans, outright prices and promos (edit prices here)
- `app.js` – filtering, sorting, search, product modal, poster lightbox, parallax
- `assets/` – product cut-outs, lifestyle banners and promo posters (WebP)

Prices come from the Coway Complete Product Catalogue (Sep–Oct 2026); RM20 promo terms come from the promo posters.
Deep link to a product with `#p-<id>`, e.g. `index.html#p-sennoplus`.

Run locally: `python3 -m http.server` in this folder and open http://localhost:8000. Deploy by uploading the folder to any static host.
