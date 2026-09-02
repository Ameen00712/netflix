// ==========================
// TMDB API
// ==========================

const API_KEY = "cd8f38a3f299ded9ea7510dd0ccaae20";
const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const movieRow = document.getElementById("movieRow");
const search = document.getElementById("search");
const moviesTitle = document.querySelector(".movies h2");
const searchIcon = document.querySelector(".searchBox i");

async function fetchMovies(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "GET",
        headers: {
            accept: "application/json"
        }
    });

    let data = null;
    try {
        data = await response.json();
    } catch (_) {
        // Keep the original HTTP error if TMDB did not return JSON.
    }

    if (!response.ok) {
        const message = data?.status_message || `TMDB request failed (${response.status})`;
        throw new Error(message);
    }

    return data;
}

async function getTrendingMovies() {
    try {
        showLoading("Loading movies...");
        const data = await fetchMovies(`/trending/movie/week?api_key=${API_KEY}`);
        moviesTitle.textContent = "Trending Movies";
        displayMovies(data.results || []);
    } catch (error) {
        console.error("TMDB error:", error);
        moviesTitle.textContent = "Movies";
        showApiError(error);
    }
}

let searchTimer;
let lastSearch = "";

async function searchMovies(query) {
    query = query.trim();
    if (!query) {
        getTrendingMovies();
        return;
    }

    lastSearch = query;

    try {
        showLoading(`Searching for "${query}"...`);
        const data = await fetchMovies(
            `/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`
        );

        // Ignore an older request if the user has already searched for something else.
        if (query !== lastSearch) return;

        moviesTitle.textContent = `Search results for "${query}"`;
        displayMovies(data.results || []);
    } catch (error) {
        console.error("TMDB search error:", error);
        moviesTitle.textContent = `Search: ${query}`;
        showApiError(error);
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
        getTrendingMovies();
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

// Make the magnifying-glass icon work as a search button too.
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
        const title = movie.title || movie.original_title || "Untitled";
        const poster = movie.poster_path
            ? `${IMAGE_BASE}${movie.poster_path}`
            : "https://via.placeholder.com/220x330?text=No+Image";
        const rating = Number(movie.vote_average || 0).toFixed(1);

        const card = document.createElement("div");
        card.className = "movie";
        card.innerHTML = `
            <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy">
            <div class="overlay">
                <h3>${escapeHtml(title)}</h3>
                <p>⭐ ${rating}</p>
                <button type="button" onclick="showMovie(${movie.id})">More Info</button>
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

    if (message.toLowerCase().includes("invalid api key") || message.toLowerCase().includes("authentication failed")) {
        showMessage("TMDB API key is invalid or expired. Please update the API key in script.js.");
        return;
    }

    showMessage(`TMDB error: ${message}`);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function showMovie(id) {
    try {
        const movie = await fetchMovies(`/movie/${id}?api_key=${API_KEY}&language=en-US`);
        alert(`🎬 ${movie.title}\n\n⭐ Rating: ${Number(movie.vote_average || 0).toFixed(1)}\n\n📅 Release: ${movie.release_date || "Unknown"}\n\n📝 ${movie.overview || "No description available."}`);
    } catch (error) {
        console.error(error);
        alert(`Unable to load movie details: ${error.message}`);
    }
}

getTrendingMovies();
