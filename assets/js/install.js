/* Install guide: one entry per game from games.json, each linking to that game's own install steps. */
(function () {
  "use strict";

  function render(data) {
    // Only games you can install (they have steps); most popular first
    const games = data.games
      .filter((g) => g.status !== "coming-soon" && (S.f(g, "install_steps") || []).length)
      .sort((a, b) => (a.popularity ?? 999) - (b.popularity ?? 999));

    const list = S.$("#install-list");
    if (!games.length) {
      list.innerHTML = `<div class="empty cut"><div class="empty-icon">${S.icons.ghost}</div><h3>${S.t("soon.empty.t")}</h3></div>`;
      return;
    }

    list.innerHTML = games.map((g) => {
      const summary = S.f(g, "install_summary");
      return `
      <a class="install-item cut reveal" href="${S.gameUrl(g)}#install">
        <div class="install-cover cut">${S.img(S.coverOf(g), "", { w: 400, h: 600 })}</div>
        <div class="install-body">
          <span class="en">${S.esc(S.subName(g))}</span>
          <h2>${S.esc(S.mainName(g))}</h2>
          ${summary ? `<p>${summary}</p>` : ""}
          <span class="install-go">${S.t("install.see")}${S.icons.arrow}</span>
        </div>
      </a>`;
    }).join("");
    S.observe();
  }

  S.boot(render);
})();
