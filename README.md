# سوهاتشي · Sohatshy

Free, unofficial Arabic translations for games, with step-by-step install guides.

ترجمات عربية مجانية وغير رسمية للألعاب، مع شرح التثبيت خطوة بخطوة.

## How this site works

- Plain HTML, CSS and JavaScript. No framework, hosted free on GitHub Pages.
- Every game lives in **`games.json`**, and its images live in **`images/<slug>/`**.
  The home page and game pages are built from that file automatically.
- **`tools/build.py`** checks `games.json`, converts images to WebP, and makes one page
  per game (with Discord/WhatsApp link previews) in the `_site/` folder.
- **`.github/workflows/pages.yml`** runs the build and publishes the site on every push to `main`.
- Downloads are hosted on **GitHub Releases**, never inside the site.

➡️ **To add a game, read [ADDING_A_GAME.md](ADDING_A_GAME.md).**

## Preview on your computer

```bash
python -m pip install pillow
python tools/build.py --serve
```

Then open <http://localhost:8000>.

## Folder map

| Path | What it is |
|---|---|
| `games.json` | All games (the only file you edit to add a game) |
| `site.json` | Site name (the GitHub repository is filled in automatically) |
| `images/<slug>/` | Cover and screenshots of each game |
| `index.html`, `game.html`, `install.html`, `faq.html`, `request.html`, `about.html`, `404.html` | Pages |
| `assets/css/style.css` | Design: colors, fonts, animations |
| `assets/js/i18n.js` | Interface text in Arabic and English |
| `assets/js/core.js`, `home.js`, `game.js` | Page logic |
| `assets/img/` | Logo, favicons, default link preview |
| `tools/build.py` | Build and preview script |

## Credits

- **Cairo font** © The Cairo Project Authors, [SIL Open Font License 1.1](https://openfontlicense.org).
- Made with help from **Claude** (Anthropic).
- Unofficial fan translations. Not affiliated with the game developers.
  This repository contains no game files or decompiled code.
