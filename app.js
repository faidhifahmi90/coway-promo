(() => {
  const { contact, offer, categories, products } = window.COWAY;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  const rm = (n) => "RM" + (Number.isInteger(n) ? n.toLocaleString("en-MY") : n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const icon = (id) => `<svg class="icon"><use href="#i-${id}"/></svg>`;
  const wa = (text) => `https://wa.me/${contact.wa}?text=${encodeURIComponent(text)}`;
  const waFor = (p) => wa(`Hi ${contact.name}, saya berminat dengan Coway ${p.name} (${p.model}), dari ${rm(p.from)}/bulan. Boleh sahkan tempoh promosi RM20 & maklumat terkini?`);
  const offerMonths = offer.months.join("/");

  // ---------- global contact links ----------
  $$("[data-wa]").forEach((a) => (a.href = wa(`Hi ${contact.name}, saya berminat dengan produk Coway. Boleh terangkan promosi RM20 untuk ${offerMonths} bulan pertama?`)));
  $$("[data-tel]").forEach((a) => (a.href = "tel:+" + contact.wa));
  $("#stat-models").textContent = products.length;

  // ---------- header ----------
  const header = $("#header"), nav = $("#nav"), menuToggle = $("#menuToggle");
  const setMenu = (open) => {
    header.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", open);
    menuToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  };
  menuToggle.addEventListener("click", () => setMenu(!header.classList.contains("menu-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", (e) => { if (!e.target.closest("#header")) setMenu(false); });

  const navLinks = $$("a[href^='#']", nav);
  const spyTargets = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  function spy() {
    const line = scrollY + innerHeight * 0.35;
    let current = null;
    for (const sec of spyTargets) if (sec.offsetTop <= line) current = sec;
    navLinks.forEach((a) => a.classList.toggle("is-active", !!current && a.getAttribute("href") === "#" + current.id));
  }

  // ---------- promo track ----------
  const promoOrder = ["sennoplus", "primelite", "wd129", "fridge715", "pseries", "neon", "storm2"];
  $("#promoTrack").innerHTML =
    promoOrder.map((id) => {
      const p = byId[id];
      const { intro, months, after, afterAlt } = p.promo;
      return `
      <article class="promo-card">
        <span class="tag">${esc(catById[p.cat].name)}${p.isNew ? " · Baharu" : ""}</span>
        <h3>${esc(p.name)}</h3>
        <span class="model">${esc(p.model)}</span>
        <div class="pimg"><img src="${p.img}" alt="Coway ${esc(p.name)}" loading="lazy"></div>
        <div class="deal">
          <div class="now"><b>${rm(intro)}</b><span>/bulan untuk ${months} bulan pertama</span></div>
          <div class="then">Selepas ${months} bulan: <strong>${afterAlt ? esc(afterAlt) : rm(after) + "/bulan"}</strong></div>
        </div>
        <div class="row">
          <button class="btn btn-gold" data-open="${p.id}">Butiran</button>
          <button class="btn btn-light" data-poster="${p.poster}" aria-label="Lihat poster ${esc(p.name)}">Poster</button>
        </div>
      </article>`;
    }).join("") +
    `<button class="promo-card promo-anniv" data-poster="assets/promo/anniversary.webp" aria-label="Lihat poster promosi ulang tahun ke-20">
      <img src="assets/promo/anniversary.webp" alt="Dapatkan semua produk Coway pada harga RM20 sahaja" loading="lazy">
    </button>`;

  // ---------- state & controls ----------
  const budgets = [
    { id: "all", label: "Semua bajet", test: () => true },
    { id: "lt60", label: "Bawah RM60", test: (p) => p.from < 60 },
    { id: "60-100", label: "RM60–RM100", test: (p) => p.from >= 60 && p.from <= 100 },
    { id: "100-200", label: "RM100–RM200", test: (p) => p.from > 100 && p.from <= 200 },
    { id: "gt200", label: "RM200 ke atas", test: (p) => p.from > 200 },
  ];
  const state = { cat: "all", budget: "all", sort: "asc", q: "" };

  const chip = (attr, id, label, pressed, count, ic) =>
    `<button class="chip" ${attr}="${id}" aria-pressed="${pressed}">${ic ? icon(ic) : ""}${label}${count != null ? `<span class="count">${count}</span>` : ""}</button>`;

  function renderChips() {
    $("#catChips").innerHTML =
      chip("data-cat", "all", "Semua", state.cat === "all", products.length) +
      categories.map((c) => chip("data-cat", c.id, c.name, state.cat === c.id, products.filter((p) => p.cat === c.id).length, c.icon)).join("");
    $("#budgetChips").innerHTML = budgets.map((b) => chip("data-budget", b.id, b.label, state.budget === b.id)).join("");
  }

  const matches = (p) => {
    if (state.cat !== "all" && p.cat !== state.cat) return false;
    if (!budgets.find((b) => b.id === state.budget).test(p)) return false;
    if (state.q) {
      const hay = `${p.name} ${p.model} ${catById[p.cat].name} ${catById[p.cat].en} ${p.bullets.join(" ")}`.toLowerCase();
      if (!state.q.toLowerCase().split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    return true;
  };
  const sorter = {
    asc: (a, b) => a.from - b.from || a.name.localeCompare(b.name),
    desc: (a, b) => b.from - a.from || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name),
  };

  function card(p) {
    const badges = [
      `<span class="badge gold">${p.promo ? `RM20 × ${p.promo.months} bulan` : "Promo RM20"}</span>`,
      p.isNew ? `<span class="badge blue">Baharu</span>` : "",
    ].join("");
    const sw = p.colors ? `<div class="swatches" title="${p.colors.length} warna">${p.colors.map(([n, c]) => `<i style="background:${c}" title="${esc(n)}"></i>`).join("")}</div>` : "";
    const cash = p.outright ? `<div class="cash">Tunai dari<b>${rm(Math.min(...p.outright.map((o) => o[1])))}</b></div>` : `<div class="cash">Sewaan<b>sahaja</b></div>`;
    const promo = p.promo
      ? `<div class="promo-strip"><span><b>${rm(p.promo.intro)}</b> × ${p.promo.months} bulan pertama</span><span>kemudian ${p.promo.afterAlt ? esc(p.promo.afterAlt) : rm(p.promo.after)}</span></div>`
      : `<div class="promo-strip"><span><b>${rm(offer.intro)}</b> × ${offerMonths} bulan pertama</span><span class="hint">${esc(offer.detail)}</span></div>`;
    return `
      <article class="card reveal" data-id="${p.id}">
        <button class="stage" data-open="${p.id}" aria-label="Butiran ${esc(p.name)}">
          <div class="badges">${badges}</div>
          <img src="${p.img}" alt="Coway ${esc(p.name)} ${esc(p.model)}" loading="lazy" decoding="async">
          ${sw}
        </button>
        <div class="card-body">
          <span class="model">${esc(p.model)}</span>
          <h4>${esc(p.name)}</h4>
          <ul>${p.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
          <div class="price">
            <div><span class="from">Sewa dari</span><strong>${rm(p.from)}<small>/bulan</small></strong></div>
            ${cash}
          </div>
          ${promo}
          <div class="actions">
            <button class="btn btn-ghost" data-open="${p.id}">Butiran</button>
            <a class="btn btn-wa" href="${waFor(p)}" target="_blank" rel="noopener">${icon("wa")}WhatsApp</a>
          </div>
        </div>
      </article>`;
  }

  function renderCatalog() {
    const list = products.filter(matches);
    $("#resultCount").textContent = `${list.length} produk`;
    syncToggle();
    const html = categories
      .map((c) => {
        const items = list.filter((p) => p.cat === c.id);
        if (!items.length) return "";
        const all = products.filter((p) => p.cat === c.id);
        const minFrom = Math.min(...all.map((p) => p.from));
        const groups = Object.entries(c.groups)
          .map(([gid, gname]) => {
            const gi = items.filter((p) => p.group === gid).sort(sorter[state.sort]);
            if (!gi.length) return "";
            const lo = Math.min(...gi.map((p) => p.from)), hi = Math.max(...gi.map((p) => p.from));
            return `
              <div class="subgroup">
                <h3>${esc(gname)} <span>${gi.length} model · ${lo === hi ? rm(lo) : `${rm(lo)}–${rm(hi)}`}/bulan</span></h3>
                <div class="grid">${gi.map(card).join("")}</div>
              </div>`;
          })
          .join("");
        return `
          <section class="cat" id="cat-${c.id}">
            <div class="cat-banner reveal">
              <div class="bg"><img src="${c.image}" alt="" loading="lazy" decoding="async"></div>
              <div class="inner">
                <span class="kicker">${icon(c.icon)}${esc(c.en)}</span>
                <h2>${esc(c.name)}</h2>
                <p>${esc(c.tagline)} ${esc(c.blurb)}</p>
                <div class="meta">
                  <span class="pill gold">Dari ${rm(minFrom)}/bulan</span>
                  <span class="pill">${all.length} model</span>
                  <span class="pill">RM20 · ${offerMonths} bulan pertama</span>
                </div>
              </div>
            </div>
            ${groups}
          </section>`;
      })
      .join("");
    $("#catalog").innerHTML =
      html ||
      `<div class="empty"><b>Tiada padanan.</b>Tiada produk untuk "${esc(state.q || "pilihan ini")}". Cuba kategori atau bajet lain.</div>`;
    observeReveals();
    collectParallax();
    bindTilt();
    onScroll();
  }

  function scrollToCatalog() {
    const top = $("#toolbar").getBoundingClientRect().top + scrollY - 68;
    if (scrollY > top + 10 || scrollY < top - 400) window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) { state.cat = c.dataset.cat; renderChips(); renderCatalog(); scrollToCatalog(); return; }
    const b = e.target.closest("[data-budget]");
    if (b) { state.budget = b.dataset.budget; renderChips(); renderCatalog(); return; }
    const o = e.target.closest("[data-open]");
    if (o) { openProduct(o.dataset.open); return; }
    const ps = e.target.closest("[data-poster]");
    if (ps) { openPoster(ps.dataset.poster); return; }
  });
  const toolbar = $("#toolbar"), toggle = $("#filterToggle");
  toggle.addEventListener("click", () => {
    const open = toolbar.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  const syncToggle = () => toggle.classList.toggle("active", state.budget !== "all" || !!state.q);
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderCatalog(); });
  let qT;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(qT);
    qT = setTimeout(() => { state.q = e.target.value.trim(); renderCatalog(); }, 160);
  });

  // ---------- product modal ----------
  const modal = $("#modal");
  function openProduct(id) {
    const p = byId[id];
    if (!p) return;
    const c = catById[p.cat];
    let calc = "";
    if (p.promo) {
      const { intro, months, after, afterAlt } = p.promo;
      const first = intro * months + after * (12 - months);
      const save = after * 12 - first;
      calc = `
        <div class="calc">
          <div class="top"><b>${rm(intro)}</b><span>/bulan untuk ${months} bulan pertama, kemudian ${afterAlt ? esc(afterAlt) : rm(after) + "/bulan"}</span></div>
          <div class="bar"><i style="flex:${months}"></i><i style="flex:${12 - months}"></i></div>
          <div class="legend"><span>Bulan 1–${months}: ${rm(intro)}</span><span>Bulan ${months + 1}–12: ${rm(after)}</span></div>
          <div class="save">Anggaran 12 bulan pertama ${rm(first)}, jimat ${rm(save)} berbanding harga biasa.</div>
        </div>`;
    } else {
      calc = `
        <div class="calc">
          <div class="top"><b>${rm(offer.intro)}</b><span>/bulan untuk bulan-bulan pertama, ${esc(offer.detail)}</span></div>
          <div class="months">${offer.months.map((m) => `<span><b>${m}</b>bulan</span>`).join("")}</div>
          <div class="legend"><span>Tempoh promosi bergantung pada pelan 3+2, 5+0 atau 7+0.</span></div>
          <div class="save">${esc(contact.name)} akan sahkan tempoh RM20 yang tepat untuk model ini.</div>
        </div>`;
    }
    const plans = p.plans || [];
    const tabs = plans.length > 1
      ? `<div class="tabs" role="tablist">${plans.map(([t], i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${i}">${esc(t)}</button>`).join("")}</div>`
      : plans.length ? `<div class="h5" style="margin-top:0">${esc(plans[0][0])}</div>` : "";
    const tables = plans.map(([, rows], i) => {
      const min = Math.min(...rows.map((r) => r[2]));
      return `
        <table class="plans" data-panel="${i}" ${i ? "hidden" : ""}>
          <thead><tr><th>Pelan</th><th>Servis</th><th class="num">Bulanan</th><th class="num">Ex-Trade</th></tr></thead>
          <tbody>${rows.map((r) => `<tr class="${r[2] === min ? "best" : ""}"><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="num">${rm(r[2])}</td><td class="num">${r[3] != null ? rm(r[3]) : "-"}</td></tr>`).join("")}</tbody>
        </table>`;
    }).join("");
    const specs = Object.entries(p.specs || {}).map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("");
    const outright = p.outright ? `<div class="h5">Harga tunai</div><div class="outright">${p.outright.map(([k, v]) => `<div><small>${esc(k)}</small><b>${rm(v)}</b></div>`).join("")}</div>` : "";
    const sw = p.colors ? `<div class="swatch-row">${p.colors.map(([n, col]) => `<button type="button" tabindex="-1"><i style="background:${col}"></i>${esc(n)}</button>`).join("")}</div>` : "";

    modal.innerHTML = `
      <button class="close" data-close aria-label="Tutup">${icon("x")}</button>
      <div class="modal">
        <div class="modal-media">
          <img src="${p.img}" alt="Coway ${esc(p.name)}">
          ${sw}
        </div>
        <div class="modal-body">
          <span class="model">${esc(c.name)} · ${esc(p.model)}</span>
          <h3 id="mTitle">${esc(p.name)}</h3>
          <p class="lead">${p.bullets.map(esc).join(" · ")}</p>
          ${calc}
          ${plans.length ? `<div class="h5">Pelan sewaan</div>${tabs}${tables}` : `<p class="note">Pelan sewaan penuh untuk model baharu ini boleh disahkan dengan ${esc(contact.name)}.</p>`}
          ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
          ${outright}
          ${specs ? `<div class="h5">Spesifikasi</div><div class="specs">${specs}</div>` : ""}
          ${p.awards ? `<p class="note">Anugerah: ${esc(p.awards)}</p>` : ""}
          <div class="modal-cta">
            <a class="btn btn-wa" href="${waFor(p)}" target="_blank" rel="noopener">${icon("wa")}WhatsApp ${esc(contact.name)}</a>
            ${p.poster ? `<button class="btn btn-ghost" data-poster="${p.poster}">Lihat poster</button>` : `<a class="btn btn-ghost" href="tel:+${contact.wa}">Telefon</a>`}
          </div>
        </div>
      </div>`;
    if (!modal.open) modal.showModal();
    modal.querySelector(".modal-body").scrollTop = 0;
    history.replaceState(null, "", "#p-" + p.id);
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close]")) modal.close();
    const t = e.target.closest("[data-tab]");
    if (t) {
      $$("[data-tab]", modal).forEach((b) => b.setAttribute("aria-selected", b === t));
      $$("[data-panel]", modal).forEach((tb) => (tb.hidden = tb.dataset.panel !== t.dataset.tab));
    }
  });
  modal.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));

  const lightbox = $("#lightbox");
  function openPoster(src) {
    lightbox.innerHTML = `<button class="close" data-close aria-label="Tutup">${icon("x")}</button><img src="${src}" alt="Poster promosi Coway">`;
    lightbox.showModal();
  }
  lightbox.addEventListener("click", () => lightbox.close());

  // ---------- reveal ----------
  const io = "IntersectionObserver" in window && !reduceMotion
    ? new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { const t = en.target; t.classList.add("in"); io.unobserve(t); setTimeout(() => (t.style.transitionDelay = ""), 1000); } }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  function observeReveals() {
    $$(".reveal:not(.in)").forEach((el, i) => {
      if (!io) return el.classList.add("in");
      if (el.classList.contains("card")) el.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });
  }

  // ---------- hero slider (coway.com.my home-slider behaviour: autoplay, arrows, dots, swipe, keys) ----------
  const hero = $("#hero"), slides = $$(".slide", hero), dotsWrap = $("#heroDots");
  const HERO_INTERVAL = 6500;
  hero.style.setProperty("--hero-interval", HERO_INTERVAL + "ms");
  let cur = 0, timer = null;
  dotsWrap.innerHTML = slides.map((s, i) => `<button type="button" role="tab" aria-label="Slaid ${i + 1}: ${esc(s.dataset.slide)}" aria-selected="${i === 0}"></button>`).join("");
  const dots = $$("button", dotsWrap);
  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("is-active", k === cur); s.setAttribute("aria-hidden", k !== cur); });
    dots.forEach((d, k) => d.setAttribute("aria-selected", k === cur));
    hero.classList.toggle("on-dark", slides[cur].classList.contains("dark"));
    restart();
  }
  function restart() {
    clearInterval(timer);
    if (reduceMotion) return;
    timer = setInterval(() => { if (!hero.classList.contains("is-paused") && !document.hidden) show(cur + 1); }, HERO_INTERVAL);
  }
  $("#heroPrev").addEventListener("click", () => show(cur - 1));
  $("#heroNext").addEventListener("click", () => show(cur + 1));
  dots.forEach((d, k) => d.addEventListener("click", () => show(k)));
  hero.addEventListener("pointerenter", () => hero.classList.add("is-paused"));
  hero.addEventListener("pointerleave", () => hero.classList.remove("is-paused"));
  hero.addEventListener("focusin", () => hero.classList.add("is-paused"));
  hero.addEventListener("focusout", () => hero.classList.remove("is-paused"));
  hero.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
  let sx = 0, sy = 0, swiping = false;
  hero.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true; }, { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (!swiping) return; swiping = false;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) restart(); });
  show(0);

  // ---------- parallax ----------
  let banners = [], texts = [];
  const heroLayers = $$("#heroStage [data-depth]");
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  function collectParallax() {
    banners = $$(".cat-banner .bg");
    texts = $$("[data-parallax]");
  }
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    $("#progress").style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    header.classList.toggle("is-scrolled", scrollY > 8);
    spy();
    if (reduceMotion) return;
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;
    if (scrollY < vh * 1.2 && slides[cur].contains(heroLayers[0])) {
      heroLayers.forEach((el) => {
        const d = parseFloat(el.dataset.depth);
        el.style.transform = `translate3d(${pointer.x * d * 26}px, ${pointer.y * d * 18 - scrollY * d * 0.25}px, 0)`;
      });
    }
    banners.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const prog = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
      el.style.transform = `translate3d(0, ${(prog * -110).toFixed(1)}px, 0) scale(1.04)`;
    });
    texts.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      el.style.transform = `translate3d(${(r.top * parseFloat(el.dataset.parallax)).toFixed(1)}px, 0, 0)`;
    });
    if (Math.abs(pointer.tx - pointer.x) > 0.002 || Math.abs(pointer.ty - pointer.y) > 0.002) request();
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  const onScroll = request;
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  if (finePointer && !reduceMotion) {
    $(".hero").addEventListener("pointermove", (e) => {
      pointer.tx = e.clientX / innerWidth - 0.5;
      pointer.ty = e.clientY / innerHeight - 0.5;
      request();
    });
  }

  // ---------- card tilt ----------
  function bindTilt() {
    if (!finePointer || reduceMotion) return;
    $$(".card:not([data-tilt])").forEach((el) => {
      el.dataset.tilt = "1";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  // ---------- init ----------
  renderChips();
  renderCatalog();
  observeReveals();
  spy();
  const deep = location.hash.match(/^#p-([\w-]+)/);
  if (deep && byId[deep[1]]) openProduct(deep[1]);
})();
