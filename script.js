// ==========================
// TMDB API
// ==========================

const API_KEY = "cd8f38a3f299ded9ea7510dd0ccaae20";
const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const movieRow = document.getElementById("movieRow");
const search = document.getElementById("search");
const moviesTitle = document.querySelector(".movies h2");

async function fetchMovies(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`TMDB request failed: ${response.status}`);
    return response.json();
}

async function getTrendingMovies() {
    try {
        showLoading();
        const data = await fetchMovies(`/trending/movie/week?api_key=${API_KEY}`);
        moviesTitle.textContent = "Trending Movies";
        displayMovies(data.results || []);
    } catch (error) {
        console.error(error);
        showMessage("Unable to load movies. Please try again.");
    }
}

let searchTimer;

async function searchMovies(query) {
    try {
        showLoading();
        const data = await fetchMovies(
            `/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`
        );
        moviesTitle.textContent = `Search results for "${query}"`;
        displayMovies(data.results || []);
    } catch (error) {
        console.error(error);
        showMessage("Something went wrong while searching. Please try again.");
    }
}

search.addEventListener("input", function (event) {
    const query = event.target.value.trim();
    clearTimeout(searchTimer);

    if (!query) {
        getTrendingMovies();
        return;
    }

    searchTimer = setTimeout(() => searchMovies(query), 350);
});

search.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        clearTimeout(searchTimer);
        const query = search.value.trim();
        if (query) searchMovies(query);
    }
});

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

function showLoading() {
    movieRow.innerHTML = '<p class="statusMessage">Searching for movies...</p>';
}

function showMessage(message) {
    movieRow.innerHTML = `<p class="statusMessage">${escapeHtml(message)}</p>`;
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
        alert("Unable to load movie details right now.");
    }
}

getTrendingMovies();
