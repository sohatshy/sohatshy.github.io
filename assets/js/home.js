/* Home page: hero, most popular row, searchable grid, coming soon. */
(function () {
  "use strict";
  const state = { filter: "all", query: "" };

  // Make Arabic search forgiving: ignore diacritics and different forms of alef/ya/ta marbuta.
  const norm = (s) => String(s || "").toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();

  function renderHero(games) {
    const h1 = S.$(".hero h1");
    h1.innerHTML = S.lang === "en" ? 'Sohatshy<span class="latin">سوهاتشي</span>' : 'سوهاتشي<span class="latin">SOHATSHY</span>';
    const released = games.filter((g) => g.status !== "coming-soon").length;
    const soon = games.length - released;
    S.$("#hero-stats").innerHTML = `
      <div class="hero-stat"><strong class="ltr">${released}</strong><span>${S.t("hero.stat.games")}</span></div>
      <div class="hero-stat"><strong class="ltr">100%</strong><span>${S.t("hero.stat.free")}</span></div>
      ${soon ? `<div class="hero-stat"><strong class="ltr">${soon}</strong><span>${S.t("hero.stat.soon")}</span></div>` : ""}`;
  }

  function renderPopular(games) {
    const list = games
      .filter((g) => g.status !== "coming-soon")
      .sort((a, b) => (a.popularity ?? 999) - (b.popularity ?? 999) || String(b.release_date).localeCompare(String(a.release_date)))
      .slice(0, 10);
    const section = S.$("#popular-section");
    section.hidden = !list.length;
    const rail = S.$("#popular-rail");
    rail.innerHTML = list.map((g, i) => `<div class="rank-item"><span class="rank-num" aria-hidden="true">${i + 1}</span>${S.posterCard(g, i + 1)}</div>`).join("");

    const prev = S.$("#rail-prev"), next = S.$("#rail-next");
    prev.innerHTML = S.lang === "en" ? S.icons.left : S.icons.right;
    next.innerHTML = S.lang === "en" ? S.icons.right : S.icons.left;
    const step = () => rail.clientWidth * 0.8 * (S.lang === "en" ? 1 : -1);
    prev.onclick = () => rail.scrollBy({ left: -step(), behavior: "smooth" });
    next.onclick = () => rail.scrollBy({ left: step(), behavior: "smooth" });
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const pos = Math.abs(rail.scrollLeft);
      prev.disabled = pos < 4;
      next.disabled = pos > max - 4;
      S.$(".rail-arrows").style.visibility = max > 4 ? "visible" : "hidden";
    };
    rail.onscroll = update;
    window.addEventListener("resize", update, { passive: true });
    requestAnimationFrame(update);
  }

  function renderFilters(games) {
    const count = (s) => (s === "all" ? games.length : games.filter((g) => g.status === s).length);
    S.$("#filters").innerHTML = ["all"].concat(S.STATUSES).map((s) =>
      `<button type="button" class="chip" data-filter="${s}" aria-pressed="${state.filter === s}">${S.t("status." + s)}<span class="count ltr">${count(s)}</span></button>`
    ).join("");
    S.$$("#filters .chip").forEach((b) => (b.onclick = () => {
      state.filter = b.dataset.filter;
      S.$$("#filters .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      renderGrid(games);
    }));
  }

  function renderGrid(games) {
    const q = norm(state.query);
    const order = { complete: 0, "in-progress": 1, "coming-soon": 2 };
    const list = games
      .filter((g) => state.filter === "all" || g.status === state.filter)
      .filter((g) => !q || norm([g.name_ar, g.name_en, g.slug.replace(/-/g, " ")].join(" ")).includes(q))
      .sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3) || String(b.release_date).localeCompare(String(a.release_date)));
    const grid = S.$("#grid");
    grid.innerHTML = list.length ? list.map(S.gridCard).join("") : `
      <div class="empty cut" style="grid-column:1/-1">
        <div class="empty-icon">${S.icons.ghost}</div>
        <h3>${S.t("all.empty.t")}</h3><p>${S.t("all.empty.p")}</p>
        <a class="btn btn-gold cut" href="request.html">${S.t("soon.empty.cta")}</a>
      </div>`;
    S.observe(grid);
  }

  function renderSoon(games) {
    const list = games.filter((g) => g.status === "coming-soon");
    S.$("#soon-list").innerHTML = list.length
      ? `<div class="rail">${list.map((g) => S.posterCard(g)).join("")}</div>`
      : `<div class="empty cut reveal">
          <div class="empty-icon">${S.icons.ghost}</div>
          <h3>${S.t("soon.empty.t")}</h3><p>${S.t("soon.empty.p")}</p>
          <a class="btn btn-gold cut" href="request.html">${S.t("soon.empty.cta")}</a>
        </div>`;
  }

  S.boot((data) => {
    const games = data.games;
    renderHero(games);
    renderPopular(games);
    renderFilters(games);
    renderGrid(games);
    renderSoon(games);
    const input = S.$("#search");
    input.value = state.query;
    input.oninput = () => { state.query = input.value; renderGrid(games); };
  });
})();
