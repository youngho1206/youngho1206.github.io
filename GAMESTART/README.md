# Retro Archive — Browser PC Game Library

A static-site starter for a personal classic PC game library. The catalog and player run on GitHub Pages or another static host; no separate server is required for normal playback.

## Included files

- `index.html` — game library and platform filters
- `player.html` — browser player
- `assets/style.css` — site styling
- `assets/app.js` — catalog loading, search, filters, and launch links
- `games/games.json` — editable game catalog

## Add a game

1. Add a game bundle you are legally allowed to use to the `games/` folder.
2. Add an entry to `games/games.json` and set `bundle` to its relative path.
3. Commit and publish the folder. Open the site over HTTPS; do not test with a `file://` URL.

Example:

```json
{
  "id": "my-game",
  "title": "My Game",
  "platform": "dos",
  "year": "1994",
  "description": "A short game description.",
  "symbol": "94",
  "bundle": "games/my-game.jsdos"
}
```

Supported `platform` values are `dos`, `win95`, and `win98`.

## Player compatibility

- **MS-DOS:** uses js-dos with the DOSBox backend.
- **Windows 95 / 98:** uses js-dos with the DOSBox-X backend. The bundle must already contain a prepared, compatible Windows 9x environment and the game. Merely changing the catalog platform to `win95` or `win98` does not convert a DOS bundle into a Windows game.
- Compatibility depends on each game's graphics, sound, drivers, memory requirements, and bundle configuration. Some titles may need individual testing and configuration.

The player uses the js-dos v8 CDN, so an internet connection is required. The site itself is static; it does not upload, convert, or host game files on a server for you.

## Important file and rights notes

- This starter does not include game files, Windows installation media, BIOS/firmware, or disk images.
- Only add games and system files that you have the right to use and distribute from your site.
- Large bundles may exceed the file-size limits of your hosting provider. Check the provider's current limits before adding them.

## Publish in an existing GitHub Pages repository

Copy the contents of this `GAMESTART` folder into a `GAMESTART/` subfolder in your repository, then commit and push. The page will usually be available at `https://YOUR-USERNAME.github.io/GAMESTART/` once GitHub Pages has deployed it.

## Current catalog

The included catalog contains three demonstration entries. They are intentionally disabled until you add valid game bundles and set each `bundle` path.
