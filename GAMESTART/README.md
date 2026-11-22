# Retro Archive — Classic PC Game Library

A static GitHub Pages game catalog with a browser-based game registration panel.

## Included
- DOS / Windows 95 / Windows 98 platform filters
- Game title, description, year, title-art image, and multi-file folder registration
- GitHub REST API publishing from `admin.html`
- Folder-relative file paths are retained under `games/files/<platform>/<game-id>/`
- Catalog metadata is written to `games/games.json`
- Existing JS-DOS player path remains available for games with a prepared `.jsdos` bundle

## Publish a game
1. Open `admin.html` on your published site.
2. Enter GitHub repository owner, repository name, branch, and a fine-grained personal access token.
3. Grant the selected repository **Contents: Read and write** permission only.
4. Test the connection.
5. Enter the game title, platform, optional year and description, choose a title image, and select the game folder/files.
6. Click **Save and publish to GitHub**. Files are uploaded one by one, then `games/games.json` is updated.

The token is kept only in the current page's JavaScript memory and is not saved to localStorage or cookies. Do not share it or enter it on an untrusted copy of this page. Revoke the token in GitHub when it is no longer needed.

## Important execution limits
- Uploading files and registering catalog metadata does not automatically make a game playable.
- DOS games need a compatible JS-DOS bundle (`.jsdos`) and a configured `bundle` URL in `games/games.json`.
- Windows 95/98 games require a separately prepared Windows 9x virtual-machine disk image/runtime and game compatibility setup. This registration tool stores the raw game folder but does not create a Windows 9x disk image or bootable VM.
- Use only game files and images that you own or are authorized to distribute.
- GitHub's Contents API has per-file size limits; this UI intentionally blocks files or a selection total above 90 MB. Large game libraries should use suitable external file hosting or release assets instead of committing every binary to the website repository.

## GitHub Pages
Keep the site files at the repository's published root (or configure Pages to use the correct folder). After upload, allow GitHub Pages a short time to rebuild, then refresh the site.
