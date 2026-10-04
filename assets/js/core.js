/* Shared code for every page: language, header, footer, data loading, cards.
   Page scripts (home.js, game.js) call S.boot(render) to start. */
(function () {
  "use strict";

  const S = (window.S = {});
  const STATUSES = ["complete", "in-progress", "coming-soon"];
  S.STATUSES = STATUSES;

  /* ---------- Language ---------- */
  S.lang = document.documentElement.lang === "en" ? "en" : "ar";

  S.t = (key) => {
    const entry = window.I18N[key];
    return entry ? entry[S.lang] || entry.ar : key;
  };

  // Read a game field in the current language: uses "field_en" in English if it exists.
  S.f = (game, field) => {
    if (S.lang === "en" && game[field + "_en"] != null) return game[field + "_en"];
    return game[field];
  };
  // Game name in the current language (main title) and the "other" name (small label)
  S.mainName = (g) => (S.lang === "en" ? g.name_en : g.name_ar) || g.name_en;
  S.subName = (g) => (S.lang === "en" ? g.name_ar : g.name_en);

  function setLang(lang) {
    S.lang = lang;
    try { localStorage.setItem("lang", lang); } catch (e) { /* storage blocked: still works for this page */ }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    applyI18n(document);
    renderChrome();
    if (S._render && S.data) S._render(S.data);
  }

  function applyI18n(root) {
    root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = S.t(el.dataset.i18n); });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = S.t(el.dataset.i18nPlaceholder); });
    root.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", S.t(el.dataset.i18nAria)); });
  }
  S.applyI18n = applyI18n;

  /* ---------- Small helpers ---------- */
  S.esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  S.$ = (sel, root = document) => root.querySelector(sel);
  S.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  S.formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    return new Intl.DateTimeFormat(S.lang === "en" ? "en-GB" : "ar-u-nu-latn", { year: "numeric", month: "long", day: "numeric" }).format(d);
  };
  S.shortDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    return new Intl.DateTimeFormat(S.lang === "en" ? "en-GB" : "ar-u-nu-latn", { year: "numeric", month: "long" }).format(d);
  };

  // A game counts as "new" for 45 days after its release date.
  S.isNew = (g) => g.release_date && g.status !== "coming-soon" && (Date.now() - new Date(g.release_date)) / 864e5 < 45;

  S.gameUrl = (g) => "game/" + encodeURIComponent(g.slug) + "/";
  S.downloadUrl = (g) => {
    if (!g.download) return "";
    if (g.download.includes("{repo}")) {
      if (!S.site.github_repo) return "";
      return g.download.replace("{repo}", S.site.github_repo);
    }
    return g.download;
  };

  /* ---------- Images: WebP first, original JPG/PNG if WebP is missing ---------- */
  S.webp = (path, thumb) => path.replace(/\.(jpe?g|png)$/i, thumb ? "-thumb.webp" : ".webp");
  S.img = (path, alt, opts = {}) => {
    if (!path) return "";
    const lazy = opts.eager ? 'fetchpriority="high"' : 'loading="lazy"';
    return `<img src="${S.esc(S.webp(path, opts.thumb))}" data-fallback="${S.esc(path)}" alt="${S.esc(alt || "")}" ${lazy} decoding="async"` +
      (opts.w ? ` width="${opts.w}" height="${opts.h}"` : "") + ` onerror="S.imgFallback(this)">`;
  };
  S.imgFallback = (img) => {
    const fb = img.dataset.fallback;
    if (fb && img.getAttribute("src") !== fb) img.src = fb;
  };
  S.coverOf = (g) => g.cover || `images/${g.slug}/cover.jpg`;
  S.shotsOf = (g) => (Array.isArray(g.screenshots) ? g.screenshots : []);

  /* ---------- Icons (inline SVG) ---------- */
  const ic = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  S.icons = {
    search: ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    menu: ic('<path d="M4 7h16M4 12h16M4 17h10"/>'),
    close: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
    globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>'),
    download: ic('<path d="M12 3v12m0 0 5-5m-5 5-5-5M4 19h16"/>'),
    left: ic('<path d="m15 18-6-6 6-6"/>'),
    right: ic('<path d="m9 18 6-6-6-6"/>'),
    arrow: ic('<path d="M5 12h14m-6-6 6 6-6 6"/>', 'class="flip-rtl"'),
    info: ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    alert: ic('<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>'),
    book: ic('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>'),
    ghost: ic('<path d="M5 21V10a7 7 0 0 1 14 0v11l-2.5-2-2.3 2-2.2-2-2.2 2-2.3-2L5 21z"/><path d="M9.5 10h.01M14.5 10h.01"/>'),
    discord: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.32 4.37A19.8 19.8 0 0 0 15.4 2.85a13.7 13.7 0 0 0-.63 1.29 18.4 18.4 0 0 0-5.53 0 12.7 12.7 0 0 0-.64-1.29 19.7 19.7 0 0 0-4.92 1.52C.57 9.05-.27 13.6.15 18.1a19.9 19.9 0 0 0 6.03 3.05c.49-.66.92-1.36 1.29-2.1a12.9 12.9 0 0 1-2.03-.97c.17-.13.34-.26.5-.39a14.2 14.2 0 0 0 12.12 0l.5.39c-.65.38-1.33.71-2.04.97.37.74.8 1.44 1.29 2.1a19.8 19.8 0 0 0 6.04-3.05c.5-5.22-.84-9.74-3.53-13.73zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42c1.2 0 2.18 1.09 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z"/></svg>'
  };

  /* ---------- Header, mobile menu, footer ---------- */
  const NAV = [
    { key: "nav.home", href: "index.html", page: "home", en: "HOME" },
    { key: "nav.games", href: "index.html#all", page: "games", en: "GAMES" },
    { key: "nav.install", href: "install.html", page: "install", en: "INSTALL" },
    { key: "nav.faq", href: "faq.html", page: "faq", en: "FAQ" },
    { key: "nav.request", href: "request.html", page: "request", en: "REQUEST" },
    { key: "nav.about", href: "about.html", page: "about", en: "ABOUT" }
  ];

  function renderChrome() {
    const page = document.body.dataset.page;
    const cur = (n) => (n.page === page ? ' aria-current="page"' : "");
    const site = S.site || {};
    const name = S.lang === "en" ? site.name_en || "Sohatshy" : site.name_ar || "سوهاتشي";
    const other = S.lang === "en" ? site.name_ar || "سوهاتشي" : site.name_en || "Sohatshy";

    const header = S.$("#site-header");
    if (header) {
      header.className = "site-header" + (window.scrollY > 10 ? " scrolled" : "");
      header.innerHTML = `
        <a class="skip-link" href="${location.pathname}#main">${S.t("nav.skip")}</a>
        <div class="container header-inner">
          <a class="brand" href="index.html" aria-label="${S.esc(name)}">
            <img src="assets/img/logo.svg" alt="" width="40" height="40">
            <span class="brand-text"><span class="brand-name">${S.esc(name)}</span><span class="brand-sub">${S.esc(S.lang === "en" ? "Arabic translations" : other)}</span></span>
          </a>
          <nav class="nav" aria-label="Main">${NAV.map((n) => `<a href="${n.href}"${cur(n)}>${S.t(n.key)}</a>`).join("")}</nav>
          <div class="header-tools">
            <button class="icon-btn lang-btn" type="button" id="lang-toggle" lang="${S.lang === "en" ? "ar" : "en"}">${S.icons.globe}<span>${S.t("lang.switch")}</span></button>
            <button class="icon-btn menu-btn" type="button" id="menu-open" aria-label="${S.t("nav.menu")}" aria-expanded="false" aria-controls="drawer">${S.icons.menu}</button>
          </div>
        </div>`;
    }

    let drawer = S.$("#drawer");
    if (!drawer) {
      document.body.insertAdjacentHTML("beforeend", '<div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer" id="drawer" aria-hidden="true"></aside>');
      drawer = S.$("#drawer");
    }
    drawer.innerHTML = `
      <div class="drawer-head">
        <a class="brand" href="index.html"><img src="assets/img/logo.svg" alt="" width="36" height="36"><span class="brand-name">${S.esc(name)}</span></a>
        <button class="icon-btn" type="button" id="menu-close" aria-label="${S.t("nav.close")}">${S.icons.close}</button>
      </div>
      ${NAV.map((n, i) => `<a href="${n.href}"${cur(n)} style="transition-delay:${0.05 + i * 0.04}s">${S.t(n.key)}<small>${n.en}</small></a>`).join("")}`;

    const footer = S.$("#site-footer");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = `
        <div class="container footer-top">
          <div class="footer-about">
            <a class="brand" href="index.html"><img src="assets/img/logo.svg" alt="" width="40" height="40"><span class="brand-text"><span class="brand-name">${S.esc(name)}</span><span class="brand-sub">${S.esc(other)}</span></span></a>
            <p>${S.t("footer.about")}</p>
          </div>
          <div><h4>${S.t("footer.explore")}</h4><ul>
            ${NAV.slice(0, 2).concat(NAV[5]).map((n) => `<li><a href="${n.href}">${S.t(n.key)}</a></li>`).join("")}
          </ul></div>
          <div><h4>${S.t("footer.help")}</h4><ul>
            ${NAV.slice(2, 5).map((n) => `<li><a href="${n.href}">${S.t(n.key)}</a></li>`).join("")}
          </ul></div>
        </div>
        <div class="container footer-bottom">
          <span class="disclaimer">${S.t("footer.disclaimer")}</span>
          <span>${S.t("footer.art")}</span>
          <span>${S.t("footer.font")} <a href="https://openfontlicense.org" target="_blank" rel="noopener">OFL</a> · <a href="https://github.com/Gue3bara/Cairo" target="_blank" rel="noopener">Cairo</a></span>
          <span>© ${new Date().getFullYear()} ${S.esc(name)} · ${S.t("footer.made")}</span>
        </div>`;
    }

    S.$("#lang-toggle").onclick = () => setLang(S.lang === "en" ? "ar" : "en");
    S.$("#menu-open").onclick = () => toggleMenu(true);
    S.$("#menu-close").onclick = () => toggleMenu(false);
    S.$("#drawer-backdrop").onclick = () => toggleMenu(false);
    S.$$("#drawer a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  }

  function toggleMenu(open) {
    document.body.classList.toggle("menu-open", open);
    S.$("#drawer").setAttribute("aria-hidden", String(!open));
    const btn = S.$("#menu-open");
    if (btn) btn.setAttribute("aria-expanded", String(open));
    if (open) S.$("#menu-close").focus();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) toggleMenu(false);
  });
  window.addEventListener("scroll", () => {
    const h = S.$("#site-header");
    if (h) h.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  /* ---------- Reveal-on-scroll + progress bar fill ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          en.target.querySelectorAll(".progress span[data-w]").forEach((s) => (s.style.width = s.dataset.w + "%"));
          io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;
  S.observe = (root = document) => {
    S.$$(".reveal:not(.in)", root).forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
    if (!io) S.$$(".progress span[data-w]", root).forEach((s) => (s.style.width = s.dataset.w + "%"));
  };

  /* ---------- Shared building blocks ---------- */
  S.badge = (status) => `<span class="badge ${S.esc(status)}">${S.t("status." + status)}</span>`;

  S.progress = (pct, withLabel) => {
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    return (withLabel ? `<div class="progress-label"><span>${S.t("game.translated")}</span><b class="ltr">${p}%</b></div>` : "") +
      `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="${S.t("game.translated")}"><span data-w="${p}"></span></div>`;
  };

  // Tall poster card (used in "Most popular" and "Other translations")
  S.posterCard = (g, rank) => `
    <a class="poster cut" href="${S.gameUrl(g)}" aria-label="${S.esc(S.mainName(g))}">
      <div class="poster-inner cut">
        ${S.img(S.coverOf(g), "", { w: 400, h: 600 })}
        ${rank ? "" : S.badge(g.status)}
        <div class="poster-info"><span class="en">${S.esc(S.subName(g))}</span><span class="ar">${S.esc(S.mainName(g))}</span></div>
      </div>
      ${rank ? `<span class="rank-tag cut">#${rank}</span>` : ""}
    </a>`;

  // Wide card (used in the "All translations" grid)
  S.gridCard = (g) => {
    const shot = S.shotsOf(g)[0];
    return `
    <a class="card cut reveal" href="${S.gameUrl(g)}">
      <div class="card-inner cut">
        <div class="card-media">
          ${S.img(shot || S.coverOf(g), "", { thumb: !!shot, w: 640, h: 360 })}
          ${S.badge(g.status)}
          ${S.isNew(g) ? `<span class="badge new">${S.t("badge.new")}</span>` : ""}
        </div>
        <div class="card-body">
          <span class="en">${S.esc(S.subName(g))}</span>
          <h3>${S.esc(S.mainName(g))}</h3>
          <p>${S.esc(S.f(g, "description"))}</p>
        </div>
        <div class="card-progress">${S.progress(g.percent, true)}</div>
        <div class="card-foot"><span>${S.esc(S.f(g, "platform") || "PC")}</span><span>${S.esc(S.shortDate(g.release_date))}</span></div>
      </div>
    </a>`;
  };

  /* ---------- Data ---------- */
  async function getJSON(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  }

  S.boot = async (render) => {
    S._render = render;
    applyI18n(document);
    renderChrome();
    S.observe();
    try {
      const [site, games] = await Promise.all([getJSON("site.json").catch(() => ({})), getJSON("games.json")]);
      S.site = site;
      S.data = { games: (games.games || []).filter((g) => g && g.slug) };
      renderChrome(); // now with the site name from site.json
      if (render) render(S.data);
    } catch (err) {
      console.error(err);
      const main = S.$("[data-needs-data]");
      if (main) main.innerHTML = `<div class="container section"><div class="empty cut"><p>${S.t("error.load")}</p></div></div>`;
    }
    S.observe();
  };

  // Pages without game data (FAQ, About…) still need site.json (site name, Discord link)
  S.bootStatic = async (after) => {
    applyI18n(document);
    renderChrome();
    S.observe();
    try { S.site = await getJSON("site.json"); } catch (e) { S.site = {}; }
    renderChrome();
    if (after) after();
    S._render = after ? () => after() : null;
    S.data = S.data || {};
  };
})();
