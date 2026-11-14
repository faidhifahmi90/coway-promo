# Coway sales page

Static, dependency-free sales page for Coway products (Bahasa Melayu), grouped by category, sub-type and monthly price.

- `index.html` – layout and static sections
- `data.js` – all products, rental plans, outright prices and promos (edit prices here); `offer` holds the site-wide RM20 × 3/5/7-month terms, `contact` the consultant's details and photo
- `app.js` – header (scroll state, scroll-spy, mobile menu), filtering, sorting, search, product modal, poster lightbox, parallax
- `assets/` – product cut-outs, lifestyle banners, promo posters and the consultant portrait (`fendi*.webp`), all WebP

Prices come from the Coway Complete Product Catalogue, 10th edition (Nov–Dec 2026, VER01). Every model gets RM20/month for the first 3, 5 or 7 months depending on model and contract tenure (`offer` in `data.js`); models with a poster carry their exact terms in `promo`.
Deep link to a product with `#p-<id>`, e.g. `index.html#p-sennoplus`.

Run locally: `python3 -m http.server` in this folder and open http://localhost:8000. Deploy by uploading the folder to any static host.
