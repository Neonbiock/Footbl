# The Football Ledger

A world football rankings site, built entirely from match history — like
FIFA's rankings, but you control every result that goes into it. It's a
static site (plain HTML/CSS/JS, no build step, no dependencies), so it's a
good fit for free GitHub Pages hosting.

- **Rankings aren't hand-typed.** They're calculated from `data/matches.js`
  with an Elo-style formula (`js/elo.js`): every match moves a team's rating
  up or down depending on the result, the opponent's rating, how big the win
  was, and how important the competition was.
- **"As of" snapshots**, like FIFA's monthly rankings — pick a year from the
  dropdown on the home page and see what the table looked like at the end of
  that year. The list of years fills in automatically from whatever's in
  `data/matches.js`.
- **Confederation tabs** (UEFA, CONMEBOL, CONCACAF, AFC, CAF, OFC) filter the
  table, and there's a search box too.
- **Team pages** (click any row) show a rating-over-time chart and the full
  match log for that nation.
- **Team crests and match photos** — optional, just drop an image file in
  and point to it.
- **An "Add entry" page** (`admin.html`) with plain forms for adding a
  nation or a match, so you never have to hand-edit the data files if you'd
  rather not.
- Currently loaded with **337 nations and 49,547 matches**, spanning the
  first-ever international in 1872 through mid-2026 — including full
  qualifying campaigns, continental championships, and a long tail of
  regional/historic competitions. About 100 of those 337 entries are
  historical, disputed, or unofficial sides (Czechoslovakia, Yugoslavia,
  CONIFA-style teams like Kabylia or Sápmi, and so on) that don't map onto
  a current FIFA confederation — they sit in a seventh **Other** tab rather
  than being guessed into the wrong one.

## The easiest way to add things: `data/teams.js` and `data/matches.js`

These are just plain JavaScript arrays, not JSON — which means you can add
comments, leave trailing commas, and there's no strict quoting to trip over.
Open either file and you'll see a comment block at the top explaining every
field. To add something, copy an existing entry and change the values:

```js
// data/teams.js
{ id: "SWE", name: "Sweden", confederation: "UEFA", flagCode: "se" },
```

```js
// data/matches.js
{ date: "1958-06-29", home: "BRA", away: "SWE", homeScore: 5, awayScore: 2,
  tournament: "world_cup", neutral: false, note: "1958 World Cup Final, Stockholm." },
```

Save the file, refresh the page — **that's it.** Every rating, every "as of"
snapshot, every team page recalculates automatically from whatever's in
these two arrays. There's no build step, no database, nothing else to run.
Matches don't need to be in date order in the file either; the engine sorts
them by date before replaying history, so you can drop in an 1890s result
and a result from last week in any order.

> **Note on file size:** `data/matches.js` now holds ~49,500 matches on one
> line to keep the file small, so it won't look like neat multi-line JSON if
> you open it — most code editors (VS Code, Sublime, etc.) handle a long
> line fine, but a bare text editor might struggle. The simplest way to add
> a handful of new results by hand is to use your editor's find function to
> jump to the very end of the file, then insert your new `{ ... },` entries
> right before the closing `];`. For anything bigger than a few results,
> `admin.html` or sending me a CSV/list to convert is easier.

### Fields, quickly

**A team** needs `id`, `name`, and `confederation`
(`UEFA`/`CONMEBOL`/`CONCACAF`/`AFC`/`CAF`/`OFC`). Optional: `flagCode` (a
2-letter country code for the flag emoji), `logo` (see Images below), and
`founded`.

**A match** needs `date`, `home`, `away`, `homeScore`, `awayScore`, and
`tournament` (`friendly`/`qualifier`/`continental`/`world_cup` — this
controls how much the result moves the rating; see `K_WEIGHTS` in
`js/elo.js` to retune it or add your own category). Optional: `neutral`
(true/false — skips the home-advantage bonus), `note`, and `photo`.

## Or: use the Add Entry page instead of editing files

Open `admin.html` and you'll find two forms — one for a nation, one for a
match. Fill one in and hit **Add**: the ranking table right below updates
instantly, using the exact same rating engine as the live site, so you can
see the effect of a result before committing to it. When you're happy,
click **Download** to get a ready-to-use `teams.js` or `matches.js` — drop
it into your repo's `/data` folder (dragging it onto the file in GitHub's
web UI works fine) and commit.

That download-and-commit step is the one bit that can't be fully automatic:
GitHub Pages serves static files, so a page a visitor opens in their browser
has no way to write back into your repository by itself. This is as close
to "just add an entry" as a free, static, no-backend site can get.

## Adding images

Two optional fields, both work the same way:

- A team's `logo` — put an image in `images/teams/` (e.g. `sweden.png`) and
  set `logo: "sweden.png"` on that team. Shown instead of the flag emoji
  everywhere the team appears.
- A match's `photo` — put an image in `images/matches/` and set
  `photo: "1958-final.jpg"` on that match. Shown under the match in that
  team's match log.

Either field also accepts a full `https://` URL instead of a filename, if
you'd rather link to an image hosted elsewhere. If an image is missing or
fails to load, the site quietly falls back to the flag emoji (for team
crests) or just hides the photo (for match photos) — nothing breaks.

## Running it locally

Because the data now lives in plain `<script>` files instead of JSON, you
can just double-click `index.html` and it'll work straight from disk — no
local server required. If you'd rather run one anyway (some browsers are
stricter about local files than others):

```bash
cd football-ledger
python3 -m http.server 8000
# then open http://localhost:8000
```

## Hosting on GitHub Pages

1. Create a new repository on GitHub (public repos get free Pages hosting).
2. Push this folder's contents to the repository root:

   ```bash
   cd football-ledger
   git init
   git add .
   git commit -m "Initial commit: The Football Ledger"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

3. On GitHub, go to the repo's **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   pick the **main** branch and the **/ (root)** folder, then **Save**.
5. After a minute or two your site will be live at:
   `https://<your-username>.github.io/<your-repo>/`

From then on, every time you edit `data/teams.js` or `data/matches.js` (by
hand, or via a download from `admin.html`) and push — or just edit them
directly in the GitHub web UI and commit — the live site updates
automatically. No rebuild step.

## File map

```
index.html            rankings home page (tabs, search, year snapshot, table)
team.html             per-nation page (chart + match log)
admin.html            plain forms for adding a nation or match, no file editing needed
css/styles.css        all styling (design tokens at the top)
js/elo.js             the rating engine — replays matches chronologically
js/util.js            small shared helpers (flags/logos, dates, form strings)
js/main.js            home page logic
js/team.js            team page logic + the SVG rating chart
js/admin.js           add-entry page logic
data/teams.js         every nation on the ledger (plain JS array — edit freely)
data/matches.js       every match on the ledger (plain JS array — edit freely)
images/teams/         team crest images you add (referenced by "logo")
images/matches/       match photos you add (referenced by "photo")
```

## Tuning the rating system

Open `js/elo.js`:

- `STARTING_RATING` — the rating a brand-new nation with no history starts at.
- `HOME_ADVANTAGE` — ratings bonus applied to the home side (ignored for
  neutral-venue matches).
- `K_WEIGHTS` — how much each tournament type moves ratings. Bigger number =
  bigger swings. Add your own key (e.g. `friendly_minor: 10`) and reference
  it from a match's `tournament` field to introduce a new category.
- `calculateElo()` is the actual per-match formula (expected score → actual
  result → goal-difference multiplier → points exchanged) if you want to
  change the math itself.
