"""
Build the Sohatshy website into the _site folder.

What it does:
  1. Checks games.json for mistakes and explains them in plain words.
  2. Copies the site into _site/.
  3. Makes small WebP copies of every image (needs Pillow: pip install pillow).
  4. Makes one page per game (game/<slug>/index.html) with its own title and
     preview image, so links look good on Discord, WhatsApp, X…
  5. Optionally starts a local preview server.

Usage (from the website folder):
  python tools/build.py            build only
  python tools/build.py --serve    build, then preview at http://localhost:8000

GitHub Actions runs this automatically on every push (see .github/workflows/pages.yml).
"""

import argparse
import html
import json
import os
import re
import shutil
import sys
from datetime import date
from pathlib import Path

try:  # Windows terminals may not print Arabic/emoji without this
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"
SKIP = {".git", ".github", "_site", "tools", ".gitignore", ".gitattributes", ".claude"}
STATUSES = {"complete", "in-progress", "coming-soon"}
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

COVER_WIDTH = 600       # poster images
SHOT_MAX_WIDTH = 1920   # full-size screenshots (lightbox)
THUMB_WIDTH = 640       # screenshot thumbnails (cards, gallery)
WEBP_QUALITY = 80

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None


def say(icon, msg):
    print(f"{icon} {msg}")


# ---------------------------------------------------------------- checking
def load_games():
    path = ROOT / "games.json"
    try:
        text = path.read_text(encoding="utf-8-sig")
    except FileNotFoundError:
        sys.exit("❌ games.json is missing.")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        line = text.splitlines()[e.lineno - 1] if e.lineno - 1 < len(text.splitlines()) else ""
        sys.exit(
            f"❌ games.json has a typing mistake on line {e.lineno}, column {e.colno}: {e.msg}\n"
            f"   {line.strip()}\n"
            "   Common causes: a missing comma between entries, an extra comma after the last item,\n"
            "   or a quote (\") inside a text. Use \\\" for quotes inside text, or use « » instead."
        )
    games = data.get("games") if isinstance(data, dict) else None
    if not isinstance(games, list):
        sys.exit('❌ games.json must look like: { "games": [ ... ] }')
    return games


def check_games(games):
    errors, warnings, seen = [], [], set()
    for i, g in enumerate(games, 1):
        label = f'Game #{i} ({g.get("slug") or g.get("name_en") or "no slug"})'
        if not isinstance(g, dict):
            errors.append(f"Game #{i} is not a {{ ... }} block.")
            continue
        for key in ("slug", "name_ar", "name_en", "status"):
            if not g.get(key):
                errors.append(f'{label}: "{key}" is missing or empty.')
        slug = g.get("slug", "")
        if slug and not SLUG_RE.match(slug):
            errors.append(f'{label}: slug "{slug}" may only use lowercase English letters, numbers and dashes (like "hollow-knight").')
        if slug in seen:
            errors.append(f'{label}: slug "{slug}" is used twice. Every game needs its own slug.')
        seen.add(slug)
        if g.get("status") and g["status"] not in STATUSES:
            errors.append(f'{label}: status "{g["status"]}" must be one of: complete, in-progress, coming-soon.')
        pct = g.get("percent", 0)
        if not isinstance(pct, (int, float)) or not 0 <= pct <= 100:
            errors.append(f'{label}: "percent" must be a number from 0 to 100, without quotes (like 75).')
        if g.get("release_date") and not DATE_RE.match(str(g["release_date"])):
            errors.append(f'{label}: release_date must look like 2026-10-31 (year-month-day).')
        for c in g.get("changelog") or []:
            if c.get("date") and not DATE_RE.match(str(c["date"])):
                errors.append(f'{label}: changelog date "{c["date"]}" must look like 2026-10-31.')

        images = ([g["cover"]] if g.get("cover") else []) + list(g.get("screenshots") or [])
        for p in images:
            if not (ROOT / p).is_file():
                errors.append(f'{label}: image "{p}" was not found. Check the file name and folder (capital letters matter on the web!).')
        if not g.get("cover"):
            warnings.append(f"{label}: no cover image.")
        if not g.get("screenshots"):
            warnings.append(f"{label}: no screenshots.")
        if g.get("status") != "coming-soon" and not g.get("download"):
            warnings.append(f"{label}: no download link yet, so the download button will be disabled.")
        if not g.get("description"):
            warnings.append(f"{label}: no description.")
    return errors, warnings


# ---------------------------------------------------------------- images
def make_webp(src: Path, dest: Path, width: int):
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)


def make_og(src: Path, dest: Path):
    """1200x630 preview image for link cards (Discord, WhatsApp…)."""
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        im = ImageOps.fit(im, (1200, 630), Image.LANCZOS, centering=(0.5, 0.4))
        im.save(dest, "JPEG", quality=85, optimize=True, progressive=True)


def process_images(games):
    if Image is None:
        say("⚠️ ", "Pillow is not installed, so images were NOT converted to WebP (the site still works, just slower).")
        say("  ", "To fix it, run:  python -m pip install pillow")
        return
    count = 0
    for src in sorted((OUT / "images").rglob("*")):
        if src.suffix.lower() not in (".jpg", ".jpeg", ".png") or src.stem == "og":
            continue
        if src.stem.lower().startswith("cover"):
            make_webp(src, src.with_suffix(".webp"), COVER_WIDTH)
        else:
            make_webp(src, src.with_suffix(".webp"), SHOT_MAX_WIDTH)
            make_webp(src, src.with_name(src.stem + "-thumb.webp"), THUMB_WIDTH)
        count += 1
    for g in games:
        source = (g.get("screenshots") or [None])[0] or g.get("cover")
        if source and (OUT / source).is_file():
            make_og(OUT / source, OUT / "images" / g["slug"] / "og.jpg")
    say("🖼️ ", f"Converted {count} images to WebP and made link previews.")


# ---------------------------------------------------------------- pages
def fill(template: str, values: dict) -> str:
    for key, val in values.items():
        template = template.replace("{{" + key + "}}", val)
    return template


def shorten(text: str, limit=190) -> str:
    text = re.sub(r"<[^>]+>", "", text or "").strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def build_game_pages(games, base_url):
    template = (ROOT / "game.html").read_text(encoding="utf-8")
    esc = lambda s: html.escape(s, quote=True)
    for g in games:
        slug = g["slug"]
        og = f"images/{slug}/og.jpg"
        if not (OUT / og).is_file():
            og = ((g.get("screenshots") or [None])[0]) or g.get("cover") or "assets/img/og-default.jpg"
        title = f'{g["name_ar"]} بالعربية · {g["name_en"]} Arabic translation — سوهاتشي'
        desc = shorten(f'{g.get("description", "")} {g.get("description_en", "")}')
        page = fill(template, {
            "BASE_HREF": "../../",
            "TITLE": esc(title),
            "DESCRIPTION": esc(desc),
            "PAGE_URL": esc(f"{base_url}game/{slug}/"),
            "OG_IMAGE": esc(base_url + og),
            "SLUG": esc(slug),
        })
        dest = OUT / "game" / slug / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(page, encoding="utf-8")

    # game.html itself stays usable as game.html?g=<slug>
    generic = fill(template, {
        "BASE_HREF": "./",
        "TITLE": "ترجمة عربية · Arabic translation — سوهاتشي",
        "DESCRIPTION": "ترجمات عربية مجانية للألعاب. Free Arabic game translations.",
        "PAGE_URL": base_url + "game.html",
        "OG_IMAGE": base_url + "assets/img/og-default.jpg",
        "SLUG": "",
    })
    (OUT / "game.html").write_text(generic, encoding="utf-8")


def write_extras(games, base_url, base_path, repo):
    # Fill {{BASE_URL}} / {{BASE_PATH}} in the other pages
    for page in OUT.glob("*.html"):
        text = page.read_text(encoding="utf-8")
        page.write_text(fill(text, {"BASE_URL": base_url, "BASE_PATH": base_path}), encoding="utf-8")

    site = json.loads((ROOT / "site.json").read_text(encoding="utf-8-sig"))
    if repo:
        site["github_repo"] = repo
    site["base_url"] = base_url
    (OUT / "site.json").write_text(json.dumps(site, ensure_ascii=False, indent=2), encoding="utf-8")

    today = date.today().isoformat()
    urls = ["", "install.html", "faq.html", "request.html", "about.html"] + [f"game/{g['slug']}/" for g in games]
    sitemap = "\n".join(f"  <url><loc>{html.escape(base_url + u)}</loc><lastmod>{today}</lastmod></url>" for u in urls)
    (OUT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{sitemap}\n</urlset>\n',
        encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base_url}sitemap.xml\n", encoding="utf-8")


def copy_site():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for item in ROOT.iterdir():
        if item.name in SKIP or item.suffix.lower() == ".md":
            continue
        if item.is_dir():
            shutil.copytree(item, OUT / item.name, ignore=shutil.ignore_patterns("*.webp", "og.jpg", "__pycache__"))
        else:
            shutil.copy2(item, OUT / item.name)


# ---------------------------------------------------------------- preview server
def serve(port):
    import functools
    import http.server

    class Handler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            super().end_headers()

        def send_error(self, code, message=None, explain=None):
            if code == 404 and (OUT / "404.html").is_file():   # same as GitHub Pages
                body = (OUT / "404.html").read_bytes()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                super().send_error(code, message, explain)

        def log_message(self, fmt, *args):
            pass

    handler = functools.partial(Handler, directory=str(OUT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        say("🌐", f"Preview running at http://localhost:{port}/   (press Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="Build the Sohatshy website into _site/")
    ap.add_argument("--serve", action="store_true", help="start a local preview after building")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--base-url", help="full address of the live site, e.g. https://name.github.io/repo/")
    ap.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", ""), help="GitHub repository, e.g. name/repo")
    args = ap.parse_args()

    base_url = (args.base_url or f"http://localhost:{args.port}/").rstrip("/") + "/"
    base_path = "/" + base_url.split("://", 1)[-1].split("/", 1)[-1] if "/" in base_url.split("://", 1)[-1] else "/"
    base_path = base_path if base_path.endswith("/") else base_path + "/"

    games = load_games()
    errors, warnings = check_games(games)
    for w in warnings:
        say("⚠️ ", w)
    if errors:
        for e in errors:
            say("❌", e)
        sys.exit(f"\nFound {len(errors)} problem(s) in games.json. Fix them and run the build again.")
    say("✅", f"games.json looks good ({len(games)} game{'s' if len(games) != 1 else ''}).")

    copy_site()
    process_images(games)
    build_game_pages(games, base_url)
    write_extras(games, base_url, base_path, args.repo)
    say("📦", f"Site built in {OUT.relative_to(ROOT)}{os.sep}  (address: {base_url})")

    if args.serve:
        serve(args.port)


if __name__ == "__main__":
    main()
