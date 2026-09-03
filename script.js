// ==========================
// OMDb API
// ==========================

const API_KEY = "2bb6471e";
const API_BASE = "https://www.omdbapi.com/";
const IMAGE_FALLBACK = "https://via.placeholder.com/220x330?text=No+Image";

const movieRow = document.getElementById("movieRow");
const search = document.getElementById("search");
const moviesTitle = document.querySelector(".movies h2");
const searchIcon = document.querySelector(".searchBox i");
const banner = document.querySelector(".banner");

async function fetchMovies(params) {
    const url = new URL(API_BASE);
    url.searchParams.set("apikey", API_KEY);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: { accept: "application/json" }
    });

    if (!response.ok) throw new Error(`OMDb request failed (${response.status})`);

    const data = await response.json();
    if (data.Response === "False") throw new Error(data.Error || "OMDb request failed");
    return data;
}

/* Build a sharper Netflix-style hero from several movie posters.
   A single portrait poster stretched across a 16:9 hero becomes blurry,
   so the posters are kept close to their natural proportions instead. */
async function loadHeroMovies() {
    if (!banner) return;

    try {
        const currentYear = new Date().getFullYear();
        const searches = ["the", "a", "love", "man", "night"];
        const allMovies = [];

        for (const term of searches) {
            for (const year of [currentYear, currentYear - 1]) {
                try {
                    const data = await fetchMovies({ s: term, type: "movie", y: year, page: 1 });
                    if (data.Search) allMovies.push(...data.Search);
                } catch (_) {}
            }
        }

        const unique = [...new Map(allMovies.map(movie => [movie.imdbID, movie])).values()]
            .filter(movie => movie.Poster && movie.Poster !== "N/A");

        if (!unique.length) return;

        // Shuffle so the hero does not always start with the same artwork.
        unique.sort(() => Math.random() - 0.5);

        let index = 0;
        const setHero = () => {
            const selected = [];
            for (let i = 0; i < 5; i++) {
                selected.push(unique[(index + i) % unique.length].Poster);
            }

            selected.forEach((poster, i) => {
                banner.style.setProperty(`--hero-image-${i + 1}`, `url("${poster}")`);
            });

            index = (index + 5) % unique.length;
        };

        setHero();
        setInterval(setHero, 7000);
    } catch (error) {
        console.error("Hero artwork error:", error);
    }
}

async function getPopularMovies() {
    try {
        showLoading("Loading movies...");
        const data = await fetchMovies({ s: "Avengers", type: "movie", page: 1 });
        moviesTitle.textContent = "Popular Movies";
        displayMovies(data.Search || []);
    } catch (error) {
        console.error("OMDb error:", error);
        moviesTitle.textContent = "Movies";
        showApiError(error);
    }
}

let searchTimer;
let lastSearch = "";

async function searchMovies(query) {
    query = query.trim();
    if (!query) {
        lastSearch = "";
        getPopularMovies();
        return;
    }

    lastSearch = query;

    try {
        showLoading(`Searching for "${query}"...`);
        const data = await fetchMovies({ s: query, type: "movie", page: 1 });
        if (query !== lastSearch) return;
        moviesTitle.textContent = `Search results for "${query}"`;
        displayMovies(data.Search || []);
    } catch (error) {
        console.error("OMDb search error:", error);
        if (query === lastSearch) {
            moviesTitle.textContent = `Search: ${query}`;
            showApiError(error);
        }
    }
}

function runSearch() {
    clearTimeout(searchTimer);
    searchMovies(search.value);
}

search.addEventListener("input", function () {
    const query = search.value.trim();
    clearTimeout(searchTimer);
    if (!query) {
        lastSearch = "";
        getPopularMovies();
        return;
    }
    searchTimer = setTimeout(() => searchMovies(query), 350);
});

search.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        runSearch();
    }
});

if (searchIcon) {
    searchIcon.style.cursor = "pointer";
    searchIcon.addEventListener("click", runSearch);
}

function displayMovies(movies) {
    movieRow.innerHTML = "";
    if (!movies.length) {
        showMessage("No movies found. Try another title.");
        return;
    }

    movies.forEach(movie => {
        const title = movie.Title || "Untitled";
        const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : IMAGE_FALLBACK;
        const year = movie.Year || "Unknown";
        const imdbId = movie.imdbID;

        const card = document.createElement("div");
        card.className = "movie";
        card.innerHTML = `
            <img src="${escapeHtml(poster)}" alt="${escapeHtml(title)}" loading="lazy">
            <div class="overlay">
                <h3>${escapeHtml(title)}</h3>
                <p>📅 ${escapeHtml(year)}</p>
                ${imdbId ? `<button type="button" onclick="showMovie('${escapeHtml(imdbId)}')">More Info</button>` : ""}
            </div>
        `;
        movieRow.appendChild(card);
    });
}

function showLoading(message = "Loading...") {
    movieRow.innerHTML = `<p class="statusMessage">${escapeHtml(message)}</p>`;
}

function showMessage(message) {
    movieRow.innerHTML = `<p class="statusMessage">${escapeHtml(message)}</p>`;
}

function showApiError(error) {
    const message = error?.message || "Unknown API error";
    const lower = message.toLowerCase();
    if (lower.includes("invalid api key") || lower.includes("api key") || lower.includes("not allowed")) {
        showMessage("OMDb API key is invalid or not activated yet. Check your OMDb email and API key.");
        return;
    }
    if (lower.includes("too many results")) {
        showMessage("Too many results. Please search for a more specific movie title.");
        return;
    }
    if (lower.includes("not found")) {
        showMessage("No movies found. Try another title.");
        return;
    }
    showMessage(`OMDb error: ${message}`);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function showMovie(imdbId) {
    try {
        const movie = await fetchMovies({ i: imdbId, plot: "full" });
        alert(
            `🎬 ${movie.Title}\n\n` +
            `⭐ IMDb Rating: ${movie.imdbRating || "N/A"}\n\n` +
            `📅 Release: ${movie.Released || movie.Year || "Unknown"}\n\n` +
            `🎭 Genre: ${movie.Genre || "Unknown"}\n\n` +
            `📝 ${movie.Plot || "No description available."}`
        );
    } catch (error) {
        console.error("OMDb details error:", error);
        alert(`Unable to load movie details: ${error.message}`);
    }
}

getPopularMovies();
loadHeroMovies();
