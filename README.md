# Class Manager

A classroom seating planner for teachers. Open `index.html` in a browser (or GitHub Pages); there is nothing to install. Everything is saved automatically, and **Save / Open** writes and reads a `.cm.json` file (older `.ppz.json` files from Seat Manager still open) so you can keep one file per class.

## Pages

- `index.html`: the class view. It shows the finished result of the management steps (desks, groups, seats and roles) and can be printed. Click a student's desk to give points; the sidebar shows the leaderboard, group ranking, totals per point item and the latest awards (with undo).
  Beside the front of the class there is a lucky draw (whole class, boys or girls; everyone is picked once before anyone repeats, and the picked desk is highlighted) and a countdown timer that beeps when time is up.
- `readingcheckin.html`: reading check-in, linked from the class view. It uses the same class list; tick a book for each one read, and every 10 books makes a round 🏅. Reading is counted separately from points, with class stats (this week, this month) and a reading ranking.
- `admin.html`: the management tabs (Layout, Class list, Seating, Roles, Points). You need to sign in first.
- `login.html`: Sign in with Google.

## Google sign-in and Google Drive

Each teacher signs in with their own Google account. Their classes are saved in **their own Google Drive**, one JSON file per class in a folder called `Class Manager`. The site asks only for the `drive.file` permission, so it can see the files it created and nothing else in the Drive. Changes are saved automatically about a second after each edit. If the same class was changed in another tab or on another computer in the meantime, the newer version on Drive is loaded instead of being overwritten.

Settings are in `js/config.js`: the OAuth Client ID, and `useDrive` (set it to `false` to keep data only in the browser). The Google Cloud project needs the Google Drive API enabled, and `https://mrwengkb.github.io` as an authorized JavaScript origin.

## Features

1. **Layout** (`js/layout.js`): place desks on an empty floor. Add single desks or ready-made groups of 4 or 6, drag them around, box-select, duplicate (Ctrl+D), delete and nudge with the arrow keys. You can also generate rows (single desks or in pairs). Select desks and click **Make a group** to form groups, and double-click a group label to rename it.
2. **Four languages**: English, 中文, Bahasa Melayu and தமிழ் (`js/i18n.js`).
3. **Class list import**: paste text or choose a `.txt`, `.csv` or `.xlsx` file, with one student per line. Names can be in any language. Gender is optional and can go after a comma or tab (`M/F`, `男/女`, `L/P`, `ஆண்/பெண்`, `boy/girl` …). For Excel, put the name in the first column and the gender in the second. Click the ♂/♀ button next to a name to change gender later.
4. **Seating**: assign randomly or balance boys and girls (by group and between neighbours). You can add conditions such as *A must not sit next to B* or *A must not be in the same group as B*. Arranging by hand also works: drag a name onto a desk, or click a name and then click a desk. Drag one desk onto another to swap the two students, and drag a name back to the list to take them off their seat.
5. **Roles**: click a student's name to give them roles. Group leader and class monitor are built in, and you can add, rename or delete your own roles.

To use it offline, click **Download for offline use** (top right) to get the zip, unzip it, and open `index.html`.

Print the plan with **Print**. It fits the classroom onto one landscape page.

SheetJS (`js/vendor/xlsx.full.min.js`, Apache-2.0) is bundled so that Excel import also works offline.
