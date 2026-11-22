# Retro Archive — Classic PC Game Library

A static GitHub Pages game catalog with a browser-based game registration panel.

## Included
- DOS / Windows 95 / Windows 98 platform filters
- Game title, description, year, title-art image, multi-file folder registration, and ZIP archive upload/extraction
- GitHub REST API publishing from `admin.html`
- External HTTPS game-file URL mode for large files (stores the URL in the catalog instead of uploading the binary)
- Title image can be uploaded or referenced by an HTTPS image URL
- Library cards show a `GET GAME FILE` link for externally hosted files
- Folder-relative file paths and ZIP-internal folder paths are retained under `games/files/<platform>/<game-id>/` - ZIP archives are extracted in the browser before upload; the original ZIP is not stored as one archive - If an uploaded archive contains a `.jsdos` file, it is automatically selected as the DOS player bundle - The player page lists and links extracted files when no runnable `.jsdos` bundle is available
- Catalog metadata is written to `games/games.json`
- Existing JS-DOS player path remains available for games with a prepared `.jsdos` bundle

## Publish a game
1. Open `admin.html` on your published site.
2. Enter GitHub repository owner, repository name, branch, and a fine-grained personal access token.
3. Grant the selected repository **Contents: Read and write** permission only.
4. Test the connection.
5. Enter the game title and platform. Choose local file/folder upload, one or more **ZIP archives** (the archive contents are extracted and uploaded as ordinary files), or **External server file URL**. For large files, paste a public, direct HTTPS download URL. Choose a title image file or enter an HTTPS image URL.
6. Click **Save and publish to GitHub**. Local files/images are uploaded, while external game URLs are saved as metadata in `games/games.json`. The library card displays a **GET GAME FILE** link for external files.

The token is kept only in the current page's JavaScript memory and is not saved to localStorage or cookies. Do not share it or enter it on an untrusted copy of this page. Revoke the token in GitHub when it is no longer needed.

## Important execution limits
- Uploading files and registering catalog metadata does not automatically make a game playable.
- DOS games need a compatible JS-DOS bundle (`.jsdos`) and a configured `bundle` URL in `games/games.json`.
- Windows 95/98 games require a separately prepared Windows 9x virtual-machine disk image/runtime and game compatibility setup. This registration tool stores the raw game folder but does not create a Windows 9x disk image or bootable VM.
- Use only game files and images that you own or are authorized to distribute.
- GitHub's Contents API has per-file size limits; this UI intentionally blocks files or a selection total above 90 MB. Large game libraries should use suitable external file hosting or release assets instead of committing every binary to the website repository.

## GitHub Pages
Keep the site files at the repository's published root (or configure Pages to use the correct folder). After upload, allow GitHub Pages a short time to rebuild, then refresh the site.

## DOS games run directly (no Windows)
When a game is registered with platform MS-DOS and no `.jsdos` file, admin.js automatically builds a `.jsdos` bundle in the browser (all files + a generated `dosbox.conf` that launches the chosen EXE/COM/BAT) and the library card shows PLAY NOW. Windows 95/98 games still need a Windows 9x environment.
