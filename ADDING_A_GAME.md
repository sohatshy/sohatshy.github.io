# How to add a new game to the site

This guide assumes you have never done this before. Follow the steps in order.
Adding a game takes about 15 minutes.

You only ever touch **two things**:

1. **One image folder** for the game
2. **One entry** in `games.json`

The site builds everything else for you: the home page cards, the game page,
the search, the filters, and the Discord preview.

---

## Step 1: Pick a "slug" for the game

A **slug** is the game's short web name. It appears in the address, like
`.../game/hollow-knight/`.

Rules:
- lowercase English letters, numbers and dashes only
- no spaces, no Arabic, no capital letters

| Game | Good slug | Bad slug |
|---|---|---|
| Hollow Knight | `hollow-knight` | `Hollow Knight` |
| Hades II | `hades-2` | `hades_II` |
| Stardew Valley | `stardew-valley` | `ستاردو` |

Write your slug down. You'll use it in every step below.

---

## Step 2: Add the images

1. Open the `images` folder inside the website folder.
2. Make a new folder named **exactly** like your slug, for example `images/hollow-knight`.
3. Put these files inside it:

| File name | What it is | Best size |
|---|---|---|
| `cover.jpg` | Tall poster image (portrait) | 600 × 900 pixels (2:3 shape) |
| `screenshot-1.jpg` | A screenshot of the game **in Arabic** | 1280 × 720 or bigger |
| `screenshot-2.jpg`, `screenshot-3.jpg`… | More screenshots (optional) | same |

Tips:
- `.png` files work too (for example `screenshot-1.png`). Just use the same name in `games.json`.
- **Capital letters matter** on the web: `Cover.JPG` is *not* the same as `cover.jpg`. Keep everything lowercase.
- Don't worry about file size. The build makes small, fast WebP copies automatically.
- Use **your own screenshots**. Don't use the official box art or images from other websites.
- To take a screenshot in Steam, press **F12** in game. Steam saves it, and you can find it under
  *View → Screenshots → Show on disk*.

---

## Step 3: Add the game to `games.json`

1. Open `games.json` in a text editor. **Notepad works**, but the free
   [Visual Studio Code](https://code.visualstudio.com/) is nicer: it colors the text and shows mistakes.
2. You'll see one `{ … }` block for each game, inside `"games": [ … ]`.
3. Copy the template below and paste it **after** the last game's closing `}`.
4. **Put a comma** between the previous game's `}` and your new `{`. This is the #1 beginner mistake!

```
    },        <- the end of the previous game: note the comma!
    {         <- your new game starts here
```

### The template (copy this)

```json
{
  "slug": "hollow-knight",
  "name_ar": "هولو نايت",
  "name_en": "Hollow Knight",
  "cover": "images/hollow-knight/cover.jpg",
  "screenshots": [
    "images/hollow-knight/screenshot-1.jpg",
    "images/hollow-knight/screenshot-2.jpg"
  ],
  "description": "وصف قصير بالعربية: ماذا تترجم هذه الترجمة؟",
  "description_en": "A short English description (optional).",
  "status": "in-progress",
  "percent": 40,
  "popularity": 2,
  "platform": "PC (Steam)",
  "mod_version": "0.1.0",
  "game_version": "v1.5.78",
  "file_size": "2.1 MB",
  "release_date": "2026-11-15",
  "download": "https://github.com/{repo}/releases/download/hollow-knight-v0.1.0/HollowKnightArabic-v0.1.0.zip",
  "install_summary": "ضع المجلد في <code>mods</code>، ثم اختر <b>العربية</b> من الإعدادات.",
  "install_summary_en": "Put the folder in <code>mods</code>, then pick <b>العربية</b> in Settings.",
  "install_steps": [
    "أغلق اللعبة.",
    "فك ضغط الملف.",
    "انسخ المجلد إلى <code>mods</code>.",
    "لإلغاء التثبيت: احذف المجلد من <code>mods</code>."
  ],
  "install_steps_en": [
    "Close the game.",
    "Unzip the file.",
    "Copy the folder into <code>mods</code>.",
    "To uninstall: delete the folder from <code>mods</code>."
  ],
  "changelog": [
    {
      "version": "0.1.0",
      "date": "2026-11-15",
      "changes": ["أول إصدار."],
      "changes_en": ["First release."]
    }
  ],
  "known_issues": ["بعض القوائم ما زالت بالإنجليزية."],
  "known_issues_en": ["Some menus are still in English."]
}
```

### What each line means

| Field | What to write | Example |
|---|---|---|
| `slug` | Your slug from Step 1 | `"hollow-knight"` |
| `name_ar` | Game name in Arabic | `"هولو نايت"` |
| `name_en` | Game name in English | `"Hollow Knight"` |
| `cover` | Path to the poster image | `"images/hollow-knight/cover.jpg"` |
| `screenshots` | List of screenshot paths, in order | see template |
| `description` | 1–2 sentences in Arabic | |
| `description_en` | Same in English (optional) | |
| `status` | One of: `"complete"`, `"in-progress"`, `"coming-soon"` | `"in-progress"` |
| `percent` | How much is translated, 0 to 100, **no quotes** | `40` |
| `popularity` | Position in the "Most popular" row: `1` is first. **No quotes.** Optional. | `2` |
| `platform` | Where the game runs | `"PC (Steam)"` |
| `mod_version` | Your translation's version | `"0.1.0"` |
| `game_version` | The game version you tested with | `"v1.5.78"` |
| `file_size` | Size of the zip | `"2.1 MB"` |
| `release_date` | Date as **year-month-day** | `"2026-11-15"` |
| `download` | Link to the zip on GitHub Releases (see Step 4) | |
| `install_summary` | One sentence for the Install guide page: where the files go and which language to pick. Optional. | see template |
| `install_steps` | This game's own steps, in Arabic. End with how to uninstall. Shown only on this game's page. | |
| `notes` | Extra tips for this game only (troubleshooting, saves…). Optional. | |
| `changelog` | List of versions, **newest first** | |
| `known_issues` | List of problems (can be empty: `[]`) | |

Notes:
- **Every game installs differently.** There is no shared install method: the Install guide page lists
  each game (with its `install_summary`) and links to that game's own `install_steps`. A new game appears
  there automatically.
- Every field ending in `_en` is **optional**. If it's missing, English visitors see the Arabic text.
- In steps and issues you can use `<b>bold</b>` and `<code>file names</code>`.
- A **"coming soon"** game only needs: `slug`, `name_ar`, `name_en`, `cover`, `description`,
  `status`. It shows in the "Coming soon" section, with no download button.
- Inside text, don't use straight double quotes (`"`). Use Arabic quotes `« »` instead.
- To write a backslash in a path (like `mods\ArabicTranslation`), type it twice: `mods\\ArabicTranslation`.

---

## Step 4: Upload the zip as a GitHub Release

The download button points to GitHub Releases, **never** to a file inside the website.

1. Go to your repository on GitHub → **Releases** (right side) → **Draft a new release**.
2. **Choose a tag** → type a new tag: `<slug>-v<version>`, for example `hollow-knight-v0.1.0`
   → click **Create new tag**.
3. **Release title**: for example `Hollow Knight Arabic v0.1.0`.
4. Drag your `.zip` file into the box at the bottom.
5. Click **Publish release**.
6. Right-click the zip file in the release → **Copy link address**. Paste it into `"download"`.

> **Shortcut:** in the link, `{repo}` is filled in automatically with your GitHub name and repository.
> So `https://github.com/{repo}/releases/download/hollow-knight-v0.1.0/HollowKnightArabic-v0.1.0.zip`
> works if the tag and file name match exactly.

---

## Step 5: Check it on your computer

Open a terminal in the website folder and run:

```bash
python tools/build.py --serve
```

- If you see **✅ games.json looks good**, open <http://localhost:8000> and check the new game.
- If you see **❌**, read the message. It tells you the line number and what's wrong.
  Fix it, save, and run the command again.
- Press **Ctrl + C** in the terminal to stop the preview.

---

## Step 6: Publish

Save your work with Git and upload it:

```bash
git add .
git commit -m "Add Hollow Knight"
git push
```

GitHub rebuilds the site automatically. After **1–2 minutes** the new game is live.
To watch it happen, open the **Actions** tab of your repository: a green ✅ means it's online.
A red ❌ means something went wrong. Click it to read the same error message you'd see locally.

---

## Updating an existing game (new version)

1. Upload the new zip as a new Release (tag like `slay-the-spire-2-v0.2.0`).
2. In `games.json`, update: `mod_version`, `game_version`, `file_size`, `percent`, `download`.
3. Add the new version at the **top** of `changelog`.
4. Build, check, commit, push (Steps 5 and 6).

## Undo a mistake

Git saved every version. If something breaks, ask Claude to roll back to the previous commit,
or run `git log --oneline` to see your history.
