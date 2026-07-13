// ==========================
// TMDB API
// ==========================

const API_KEY = "cd8f38a3f299ded9ea7510dd0ccaae20";

const movieRow = document.getElementById("movieRow");

// ==========================
// FETCH TRENDING MOVIES
// ==========================

async function getTrendingMovies() {

    try {

        const response = await fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`
        );

        const data = await response.json();

        displayMovies(data.results);

    } catch (error) {

        console.error("Error loading movies:", error);

    }

}

// ==========================
// DISPLAY MOVIES
// ==========================

function displayMovies(movies) {

    movieRow.innerHTML = "";

    movies.forEach(movie => {

        const poster = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "https://via.placeholder.com/220x330?text=No+Image";

        const card = document.createElement("div");

        card.className = "movie";

        card.innerHTML = `
            <img src="${poster}" alt="${movie.title}">

            <div class="overlay">
                <h3>${movie.title}</h3>
                <p>⭐ ${movie.vote_average.toFixed(1)}</p>

                <button onclick="showMovie(${movie.id})">
                    More Info
                </button>
            </div>
        `;

        movieRow.appendChild(card);

    });

}

// ==========================
// MOVIE DETAILS
// ==========================

async function showMovie(id) {

    try {

        const response = await fetch(
            `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`
        );

        const movie = await response.json();

        alert(
`🎬 ${movie.title}

⭐ Rating: ${movie.vote_average}

📅 Release: ${movie.release_date}

📝 ${movie.overview}`
        );

    } catch (error) {

        console.error(error);

    }

}

// ==========================
// START
// ==========================

getTrendingMovies();
// ==========================
// SEARCH MOVIES
// ==========================

const search = document.getElementById("search");

search.addEventListener("keyup", async function (e) {

    const query = e.target.value.trim();

    if (query === "") {

        getTrendingMovies();

        return;

    }

    const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );

    const data = await response.json();

    displayMovies(data.results);

});