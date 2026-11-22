# Retro Archive — GitHub Pages starter

This is an add-on starter for a browser-based PC game archive. It is intentionally separate from your existing site so existing folders and pages are not overwritten.

## Files
- `index.html` — modern retro game library
- `player.html` — browser player page
- `assets/style.css` — design
- `assets/app.js` — catalog filtering and search
- `games/games.json` — game catalog

## Deploy as a new GitHub Pages subfolder
1. Extract this ZIP.
2. Copy the `GAMESTART` folder contents into a new folder in your existing repository, for example `GAMESTART/`.
3. Commit and push.
4. Open `https://YOUR-USERNAME.github.io/GAMESTART/`.

## Add a DOS game
1. Prepare a `.jsdos` bundle for a game you are legally allowed to use.
2. Put it in `GAMESTART/games/`, for example `games/my-game.jsdos`.
3. Edit `games/games.json` and set that game's `bundle` to `games/my-game.jsdos`.
4. Set `platform` to `dos`, `win95`, or `win98`.

Example:
```json
{
  "id": "my-game",
  "title": "My Game",
  "platform": "dos",
  "year": "1994",
  "description": "Short description",
  "symbol": "94",
  "bundle": "games/my-game.jsdos"
}
```

## Important compatibility notes
- DOS games use js-dos in the browser. The player loads a `.jsdos` bundle.
- Windows 95/98 games are not ordinary DOS executables. They need a prepared Windows 9x-compatible environment/game bundle, and compatibility varies by title and graphics/audio requirements.
- This starter does not include copyrighted games, Windows installation media, BIOS/firmware, or disk images. Add only files you have the rights to distribute/use.
- Large game bundles may exceed GitHub's normal file-size limits. GitHub Pages is static hosting and has no server-side game conversion or upload service.
- The js-dos player loads its library from the js-dos CDN, so the browser needs an internet connection.

## Current state
This is a functional catalog/player shell, not a pre-populated game archive. Sample entries are disabled until you add valid bundles. It does not alter your existing ROMS, OS, MAME, or console pages.
