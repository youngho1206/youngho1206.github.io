let games = [], active = "all";
const grid = document.querySelector("#game-grid");
const search = document.querySelector("#search");
const empty = document.querySelector("#empty");
const labels = { dos: "MS-DOS", win95: "WINDOWS 95", win98: "WINDOWS 98" };

async function init() {
  try {
    const response = await fetch("games/games.json");
    if (!response.ok) throw new Error("Catalog could not be loaded");
    games = await response.json();
    if (!Array.isArray(games)) games = [];
  } catch (error) {
    games = [];
    empty.textContent = "The game catalog could not be loaded. Please refresh the page.";
  }
  updateCounts();
  render();
}

function updateCounts() {
  for (const key of ["all", "dos", "win95", "win98"]) {
    const count = key === "all" ? games.length : games.filter(game => game.platform === key).length;
    const target = document.querySelector(`#count-${key}`);
    if (target) target.textContent = count;
  }
  const total = document.querySelector(".stats > div:first-child strong");
  const libraryTotal = document.querySelector(".stats > div:nth-child(2) strong");
  if (total) total.textContent = new Set(games.map(game => game.platform)).size.toString().padStart(2, "0");
  if (libraryTotal) libraryTotal.textContent = games.length.toString().padStart(2, "0");
}

function render() {
  const query = search.value.trim().toLowerCase();
  const list = games.filter(game =>
    (active === "all" || game.platform === active) &&
    (`${game.title} ${game.description || ""} ${game.year || ""}`.toLowerCase().includes(query))
  );

  grid.innerHTML = list.map(game => {
    const enabled = typeof game.bundle === "string" && game.bundle.trim().length > 0;
    const safeId = encodeURIComponent(String(game.id));
    return `<article class="game-card">
      <div class="game-cover" style="background:${safeColor(game.color)}">
        <span class="platform-tag">${esc(labels[game.platform] || game.platform || "PC")}</span>
        <span class="cover-symbol">${esc(game.symbol || "PC")}</span>
      </div>
      <div class="game-info">
        <h3>${esc(game.title || "Untitled game")}</h3>
        <p>${esc(game.description || "Classic PC game")}</p>
        <div class="card-bottom">
          <span class="year">${esc(game.year || "YEAR UNKNOWN")}</span>
          <button class="play-link" ${enabled ? `onclick="launch('${safeId}')"` : "disabled"}>${enabled ? "PLAY NOW ↗" : "COMING SOON"}</button>
        </div>
      </div>
    </article>`;
  }).join("");
  empty.classList.toggle("hidden", list.length > 0);
}

function safeColor(value) {
  // Catalog colors are optional. Restrict inline styling to simple CSS gradients/colors.
  if (typeof value === "string" && /^(#[0-9a-f]{3,8}|linear-gradient\([#\w\s.,%()-]+\))$/i.test(value)) return value;
  return "linear-gradient(135deg,#284a65,#17273e)";
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

document.querySelector("#filters").addEventListener("click", event => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  active = button.dataset.filter;
  document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === button));
  render();
});
search.addEventListener("input", render);

function launch(encodedId) {
  const id = decodeURIComponent(encodedId);
  const game = games.find(item => String(item.id) === id);
  if (!game || !game.bundle) return;
  location.href = `player.html?game=${encodeURIComponent(game.id)}`;
}
window.launch = launch;
init();
