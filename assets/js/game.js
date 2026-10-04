/* Game page: built from the games.json entry whose slug matches this page. */
(function () {
  "use strict";
  const state = { tab: "install" };

  function currentSlug() {
    const fromPage = document.body.dataset.slug || "";
    if (fromPage && !fromPage.includes("{{")) return fromPage;
    return new URLSearchParams(location.search).get("g") || "";
  }

  const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  function notFound() {
    S.$("#game").innerHTML = `
      <section class="notfound"><div>
        <div class="empty-icon" style="width:80px;height:80px;margin:0 auto 10px;color:var(--gold)">${S.icons.ghost}</div>
        <h1>${S.t("game.notFound")}</h1>
        <a class="btn btn-gold cut" href="index.html">${S.t("game.back")}</a>
      </div></section>`;
  }

  function render(data) {
    const games = data.games;
    const g = games.find((x) => x.slug === currentSlug());
    if (!g) return notFound();

    const shots = S.shotsOf(g);
    const backdrop = shots[0] || S.coverOf(g);
    const dl = S.downloadUrl(g);
    const soon = g.status === "coming-soon";
    const steps = asList(S.f(g, "install_steps"));
    const issues = asList(S.f(g, "known_issues"));
    const changelog = asList(g.changelog);
    // Optional extras (only shown when the games.json entry has them)
    const important = S.f(g, "important");
    const about = asList(S.f(g, "about"));
    const info = [["game.requirements", asList(S.f(g, "requirements"))], ["game.compat", asList(S.f(g, "compatibility"))],
      ["game.credits", asList(S.f(g, "credits"))], ["game.notes", asList(S.f(g, "notes"))]].filter(([, list]) => list.length);
    const pending = Math.max(0, Number(g.screenshots_pending) || 0);
    const others = games.filter((x) => x.slug !== g.slug)
      .sort((a, b) => (a.popularity ?? 999) - (b.popularity ?? 999));

    const stat = (k, v) => (v ? `<div class="stat cut"><span class="k">${S.t(k)}</span><span class="v"><span class="ltr">${S.esc(v)}</span></span></div>` : "");

    S.$("#game").innerHTML = `
      <section class="game-hero">
        <div class="game-hero-bg" data-bg="${S.esc(backdrop)}"></div>
        <div class="container">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="index.html">${S.t("nav.home")}</a><span aria-hidden="true">/</span>
            <a href="index.html#all">${S.t("nav.games")}</a><span aria-hidden="true">/</span>
            <span aria-current="page">${S.esc(S.mainName(g))}</span>
          </nav>
          <div class="game-layout">
            <div class="game-cover cut"><div class="inner cut">${S.img(S.coverOf(g), S.mainName(g), { eager: true, w: 600, h: 900 })}</div></div>
            <div class="game-title">
              <span class="en rise">${S.esc(S.subName(g))}</span>
              <h1 class="rise">${S.esc(S.mainName(g))}</h1>
              <div class="game-badges rise">${S.badge(g.status)}${S.isNew(g) ? `<span class="badge new">${S.t("badge.new")}</span>` : ""}</div>
              <p class="game-desc rise">${S.esc(S.f(g, "description"))}</p>
              ${important ? `<div class="callout warn cut rise" role="note">${S.icons.alert}<p><strong>${S.t("game.important")}</strong> ${important}</p></div>` : ""}
              <div class="game-progress reveal">${S.progress(g.percent, true)}</div>
              <div class="stats reveal">
                ${stat("game.modVersion", g.mod_version && "v" + String(g.mod_version).replace(/^v/i, ""))}
                ${stat("game.gameVersion", g.game_version)}
                ${stat("game.size", g.file_size)}
                ${stat("game.released", S.formatDate(g.release_date))}
                ${stat("game.platform", S.f(g, "platform"))}
                ${stat("game.language", S.f(g, "language"))}
              </div>
              <div class="download-row reveal">
                ${soon || !dl
                  ? `<span class="btn btn-gold btn-lg cut" aria-disabled="true">${S.icons.download}${soon ? S.t("game.soon") : S.t("game.download")}</span>`
                  : `<a class="btn btn-gold btn-lg cut" href="${S.esc(dl)}" rel="noopener">${S.icons.download}${S.t("game.download")}${g.file_size ? ` <small class="ltr" style="opacity:.7;font-weight:700">(${S.esc(g.file_size)})</small>` : ""}</a>`}
                <a class="btn btn-ghost cut" href="install.html">${S.icons.book}${S.t("game.guide")}</a>
              </div>
              <p class="download-note">${S.t("game.dlNote")}</p>
            </div>
          </div>
        </div>
      </section>

      ${shots.length || pending ? `
      <section class="section" style="padding-top:24px">
        <div class="container">
          <div class="section-head reveal"><div><span class="eyebrow">Gallery</span><h2 class="section-title">${S.t("game.shots")}</h2></div></div>
          <div class="gallery reveal">
            ${shots.map((p, i) => `<button type="button" class="shot cut" data-i="${i}" aria-label="${S.t("game.shots")} ${i + 1}">${S.img(p, "", { thumb: true, w: 640, h: 360 })}</button>`).join("")}
            ${Array.from({ length: pending }, () => `<div class="shot shot-placeholder cut" aria-hidden="true"><span>${S.t("game.shotSoon")}</span></div>`).join("")}
          </div>
        </div>
      </section>` : ""}

      ${about.length || info.length ? `
      <section class="section" style="padding-top:24px">
        <div class="container">
          ${about.length ? `<div class="section-head reveal"><div><span class="eyebrow">About</span><h2 class="section-title">${S.t("game.about")}</h2></div></div>
          <div class="prose reveal" style="max-width:900px">${about.map((p) => `<p>${p}</p>`).join("")}</div>` : ""}
          ${info.length ? `<div class="info-grid reveal">${info.map(([key, list]) => `
            <div class="info-card cut"><h3>${S.t(key)}</h3><ul>${list.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("")}
          </div>` : ""}
        </div>
      </section>` : ""}

      <section class="section" style="padding-top:24px">
        <div class="container">
          <div class="section-head reveal"><div><span class="eyebrow">Details</span><h2 class="section-title">${S.t("game.details")}</h2></div></div>
          <div class="tabs reveal" role="tablist">
            ${[["install", "game.tab.install"], ["changes", "game.tab.changes"], ["issues", "game.tab.issues"]].map(([id, key]) =>
              `<button class="tab" role="tab" type="button" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${state.tab === id}" data-tab="${id}">${S.t(key)}</button>`).join("")}
          </div>
          <div class="prose" style="max-width:900px">
            <div class="tab-panel" role="tabpanel" id="panel-install" aria-labelledby="tab-install" ${state.tab === "install" ? "" : "hidden"}>
              <ol class="steps">${steps.map((s) => `<li class="cut">${s}</li>`).join("")}</ol>
              <div class="callout info cut">${S.icons.info}<p><a href="install.html">${S.t("game.guide")}</a></p></div>
            </div>
            <div class="tab-panel" role="tabpanel" id="panel-changes" aria-labelledby="tab-changes" ${state.tab === "changes" ? "" : "hidden"}>
              <div class="timeline">
                ${changelog.map((r) => `
                  <div class="release">
                    <h3><span class="ltr">v${S.esc(String(r.version || "").replace(/^v/i, ""))}</span><time datetime="${S.esc(r.date)}">${S.esc(S.formatDate(r.date))}</time></h3>
                    <ul>${asList(S.f(r, "changes")).map((c) => `<li>${c}</li>`).join("")}</ul>
                  </div>`).join("")}
              </div>
            </div>
            <div class="tab-panel" role="tabpanel" id="panel-issues" aria-labelledby="tab-issues" ${state.tab === "issues" ? "" : "hidden"}>
              ${issues.length ? `<ul class="issues">${issues.map((s) => `<li class="cut">${s}</li>`).join("")}</ul>` : `<p>${S.t("game.noIssues")}</p>`}
              <p style="margin-top:18px"><a class="gh-link" href="${S.esc(S.issuesUrl({ title: "[" + g.name_en + "] " }))}" target="_blank" rel="noopener">${S.icons.github}${S.t("game.reportIssue")}</a></p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head reveal"><div><span class="eyebrow">More games</span><h2 class="section-title">${S.t("game.others")}</h2><p class="section-sub">${S.t("game.othersSub")}</p></div></div>
          ${others.length
            ? `<div class="rail reveal">${others.map((x) => S.posterCard(x)).join("")}</div>`
            : `<div class="empty cut reveal"><div class="empty-icon">${S.icons.ghost}</div><h3>${S.t("soon.empty.t")}</h3><p>${S.t("soon.empty.p")}</p><a class="btn btn-gold cut" href="request.html">${S.t("soon.empty.cta")}</a></div>`}
        </div>
      </section>`;

    // Blurred backdrop (WebP with fallback)
    const bg = S.$(".game-hero-bg");
    const probe = new Image();
    probe.onload = () => (bg.style.backgroundImage = `url("${probe.src}")`);
    probe.onerror = () => (bg.style.backgroundImage = `url("${backdrop}")`);
    probe.src = S.webp(backdrop, shots.length > 0);

    // Tabs
    S.$$(".tab").forEach((btn) => (btn.onclick = () => selectTab(btn.dataset.tab)));
    S.$(".tabs").onkeydown = (e) => {
      const ids = ["install", "changes", "issues"];
      let i = ids.indexOf(state.tab);
      const fwd = S.lang === "en" ? "ArrowRight" : "ArrowLeft";
      const back = S.lang === "en" ? "ArrowLeft" : "ArrowRight";
      if (e.key === fwd) i = (i + 1) % ids.length; else if (e.key === back) i = (i + ids.length - 1) % ids.length; else return;
      selectTab(ids[i]);
      S.$("#tab-" + ids[i]).focus();
    };

    // Gallery
    S.$$(".shot[data-i]").forEach((b) => (b.onclick = () => openLightbox(shots, Number(b.dataset.i))));
    S.observe();
  }

  function selectTab(id) {
    state.tab = id;
    S.$$(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === id)));
    S.$$(".tab-panel").forEach((p) => (p.hidden = p.id !== "panel-" + id));
  }

  /* ---------- Lightbox ---------- */
  const lb = { list: [], i: 0, lastFocus: null };
  function showImage() {
    const box = S.$("#lightbox"), img = S.$("img", box), src = lb.list[lb.i];
    img.dataset.fallback = src;
    img.onerror = () => S.imgFallback(img);
    img.src = S.webp(src);
    S.$(".lb-count", box).textContent = lb.list.length > 1 ? `${lb.i + 1} / ${lb.list.length}` : "";
    S.$(".lb-prev", box).hidden = S.$(".lb-next", box).hidden = lb.list.length < 2;
  }
  function openLightbox(list, i) {
    const box = S.$("#lightbox");
    lb.list = list; lb.i = i; lb.lastFocus = document.activeElement;
    S.$(".lb-close", box).innerHTML = S.icons.close;
    S.$(".lb-prev", box).innerHTML = S.icons.left;
    S.$(".lb-next", box).innerHTML = S.icons.right;
    showImage();
    box.classList.add("open");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    S.$(".lb-close", box).focus();
  }
  function closeLightbox() {
    const box = S.$("#lightbox");
    box.classList.remove("open");
    box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lb.lastFocus) lb.lastFocus.focus();
  }
  const go = (d) => { lb.i = (lb.i + d + lb.list.length) % lb.list.length; showImage(); };

  document.addEventListener("DOMContentLoaded", () => {
    const box = S.$("#lightbox");
    S.$(".lb-close", box).onclick = closeLightbox;
    // "Previous" sits on the right in Arabic, so it moves backwards in reading order
    S.$(".lb-prev", box).onclick = () => go(-1);
    S.$(".lb-next", box).onclick = () => go(1);
    box.onclick = (e) => { if (e.target === box) closeLightbox(); };
    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") go(S.lang === "en" ? 1 : -1);
      if (e.key === "ArrowLeft") go(S.lang === "en" ? -1 : 1);
    });
    let x0 = null;
    box.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    box.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go((dx < 0 ? 1 : -1) * (S.lang === "en" ? 1 : -1));
      x0 = null;
    });
  });

  S.boot(render);
})();
