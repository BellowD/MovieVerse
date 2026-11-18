// MovieVerse - External API Integration (OMDb API) Module
// Requirement 7: Public API, fetch() & async/await, loading state, error handling, search history.
// Authors: Nurkhat Assan, Daurenbek Anuar

window.MovieVerse = window.MovieVerse || {};

(function () {
    const MV = window.MovieVerse;
    const OMDB_API_KEY = "7e7c63b6";
    const BASE_URL = "https://www.omdbapi.com/";

    const searchForm = document.getElementById("movie-search-form");
    if (!searchForm) return;

    const searchInput = document.getElementById("movie-search-input");
    const suggestionsDropdown = document.getElementById("search-suggestions");
    const statusContainer = document.getElementById("search-status");
    const resultsContainer = document.getElementById("search-results-list");
    const queryDisplay = document.getElementById("search-query-display");
    const countDisplay = document.getElementById("search-count-display");
    const loadMoreBtn = document.getElementById("load-more-btn");
    const historyContainer = document.getElementById("search-history-chips");

    // Modal elements
    const modalOverlay = document.getElementById("movie-modal");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const modalContent = document.getElementById("modal-details-content");

    let currentQuery = "";
    let currentType = "";
    let currentPage = 1;
    let totalResults = 0;
    let isFetching = false;
    let abortController = null;
    let debounceTimer = null;

    const detailsCache = new Map();

    // ==========================================
    // 1. API REQUEST WITH ASYNC / AWAIT
    // ==========================================
    async function fetchOmdb(params) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        const url = new URL(BASE_URL);
        url.searchParams.set("apikey", OMDB_API_KEY);
        Object.keys(params).forEach(k => {
            if (params[k]) url.searchParams.set(k, params[k]);
        });

        try {
            const response = await fetch(url.toString(), { signal: abortController.signal });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (err) {
            if (err.name === "AbortError") {
                return null; // Cancelled silently
            }
            throw err;
        }
    }

    // ==========================================
    // 2. SEARCH EXECUTION & UI STATES
    // ==========================================
    async function executeSearch(query, page = 1, append = false) {
        if (!query || query.trim().length < 2) return;

        currentQuery = query.trim();
        currentPage = page;
        isFetching = true;

        if (!append) {
            resultsContainer.innerHTML = "";
            renderLoadingState(true);
            addToHistory(currentQuery);
        } else if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = `<span class="spinner"></span> Loading more...`;
        }

        try {
            const params = {
                s: currentQuery,
                page: currentPage
            };
            if (currentType) params.type = currentType;

            const data = await fetchOmdb(params);
            if (!data) return; // Aborted

            renderLoadingState(false);
            isFetching = false;

            if (data.Response === "True") {
                totalResults = parseInt(data.totalResults, 10) || 0;
                renderResults(data.Search, append);
                updateSummary(currentQuery, totalResults);
            } else {
                totalResults = 0;
                updateSummary(currentQuery, 0);
                if (!append) {
                    renderEmptyState(data.Error || "No movies found matching your query.");
                }
            }
        } catch (err) {
            renderLoadingState(false);
            isFetching = false;
            console.error("OMDb API Error:", err);
            renderErrorState("Failed to connect to the movie database. Please check your internet connection.");
        }
    }

    function renderLoadingState(loading) {
        if (statusContainer) {
            if (loading) {
                statusContainer.innerHTML = `
                    <div class="state-box">
                        <span class="spinner" style="width: 36px; height: 36px; border-width: 4px;"></span>
                        <h3 style="margin-top: 1rem;">Searching Movie Database...</h3>
                        <p>Fetching movies, cast, and ratings from OMDb API</p>
                    </div>
                `;
                statusContainer.style.display = "block";
            } else {
                statusContainer.innerHTML = "";
                statusContainer.style.display = "none";
            }
        }
    }

    function renderEmptyState(message) {
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="state-box">
                    <p style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎬</p>
                    <h3>No Matches Found</h3>
                    <p>${message}</p>
                    <button type="button" class="btn btn-secondary" id="retry-search-btn">Try Another Search</button>
                </div>
            `;
            statusContainer.style.display = "block";
            const retryBtn = document.getElementById("retry-search-btn");
            if (retryBtn) {
                retryBtn.addEventListener("click", () => {
                    searchInput.value = "";
                    searchInput.focus();
                });
            }
        }
        if (loadMoreBtn) loadMoreBtn.style.display = "none";
    }

    function renderErrorState(message) {
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="state-box is-error">
                    <p style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠️</p>
                    <h3>Network Error</h3>
                    <p>${message}</p>
                    <button type="button" class="btn" id="retry-fetch-btn">Retry Request</button>
                </div>
            `;
            statusContainer.style.display = "block";
            const retryBtn = document.getElementById("retry-fetch-btn");
            if (retryBtn) {
                retryBtn.addEventListener("click", () => executeSearch(currentQuery, currentPage));
            }
        }
        if (loadMoreBtn) loadMoreBtn.style.display = "none";
    }

    function updateSummary(query, count) {
        if (queryDisplay) queryDisplay.textContent = `"${query}"`;
        if (countDisplay) countDisplay.textContent = `(Found ${count} match${count === 1 ? "" : "es"})`;

        if (loadMoreBtn) {
            const loadedCount = resultsContainer.querySelectorAll(".movie-card").length;
            if (loadedCount < totalResults) {
                loadMoreBtn.style.display = "inline-flex";
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = `Load More Movies (${loadedCount} of ${totalResults})`;
            } else {
                loadMoreBtn.style.display = "none";
            }
        }
    }

    // ==========================================
    // 3. RENDER RESULTS & CARDS
    // ==========================================
    function renderResults(movies, append) {
        if (!append) resultsContainer.innerHTML = "";

        const defaultPoster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450' fill='%231f2937'%3E%3Ctext x='50%25' y='50%25' fill='%2394a3b8' font-size='20' text-anchor='middle' dominant-baseline='middle'%3ENo Poster%3C/text%3E%3C/svg%3E";

        movies.forEach(m => {
            const poster = m.Poster && m.Poster !== "N/A" ? m.Poster : defaultPoster;
            const card = document.createElement("div");
            card.className = "movie-card";
            card.dataset.id = m.imdbID;
            card.dataset.year = m.Year;
            card.dataset.genre = m.Type ? m.Type.toUpperCase() : "MOVIE";

            const isFav = MV.favorites ? MV.favorites.has(m.imdbID) : false;

            card.innerHTML = `
                <div class="card-poster-wrap">
                    <button type="button" class="fav-btn ${isFav ? "active" : ""}" title="Add to favorites">★</button>
                    <img src="${poster}" alt="${m.Title}" loading="lazy">
                </div>
                <div class="movie-info">
                    <div>
                        <h3>${m.Title}</h3>
                        <p>${m.Type ? m.Type.charAt(0).toUpperCase() + m.Type.slice(1) : "Movie"} • ${m.Year}</p>
                    </div>
                    <div class="movie-meta-tags">
                        <span class="badge">${m.Type ? m.Type.toUpperCase() : "CINEMA"}</span>
                        <button type="button" class="btn btn-secondary view-details-btn" style="padding: 4px 10px; font-size: 0.8rem;">Details</button>
                    </div>
                </div>
            `;

            // Open modal on click
            card.querySelector(".view-details-btn").addEventListener("click", () => openMovieDetails(m.imdbID));
            card.querySelector(".card-poster-wrap img").addEventListener("click", () => openMovieDetails(m.imdbID));

            resultsContainer.appendChild(card);
        });

        if (MV.favorites && MV.favorites.updateAllFavButtons) {
            MV.favorites.updateAllFavButtons();
        }
    }

    // ==========================================
    // 4. MOVIE DETAILS MODAL
    // ==========================================
    async function openMovieDetails(imdbID) {
        if (!modalOverlay || !imdbID) return;

        modalOverlay.classList.add("is-active");
        modalContent.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <span class="spinner" style="width: 40px; height: 40px; border-width: 4px;"></span>
                <p style="margin-top: 1rem; color: var(--text-muted);">Loading full movie details...</p>
            </div>
        `;

        try {
            let details = detailsCache.get(imdbID);
            if (!details) {
                const url = `${BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`;
                const resp = await fetch(url);
                details = await resp.json();
                if (details && details.Response === "True") {
                    detailsCache.set(imdbID, details);
                }
            }

            renderModalContent(details);
        } catch (err) {
            modalContent.innerHTML = `
                <div class="state-box is-error">
                    <h3>Error loading details</h3>
                    <p>Unable to retrieve full movie information.</p>
                </div>
            `;
        }
    }

    function renderModalContent(movie) {
        const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "images/avatar.jpg";
        const currentRating = MV.favorites ? MV.favorites.getRating(movie.imdbID) : 0;
        const isFav = MV.favorites ? MV.favorites.has(movie.imdbID) : false;

        modalContent.innerHTML = `
            <div class="modal-body">
                <div>
                    <img src="${poster}" alt="${movie.Title}" class="modal-poster">
                    <button type="button" class="btn modal-fav-toggle-btn" style="width: 100%; margin-top: 1rem;">
                        ${isFav ? "★ In Favorites" : "☆ Add to Favorites"}
                    </button>
                </div>
                <div class="modal-details">
                    <h2>${movie.Title} <span style="color: var(--text-muted); font-size: 1.2rem;">(${movie.Year})</span></h2>
                    <div class="modal-badges">
                        <span class="badge">${movie.Rated || "NR"}</span>
                        <span class="badge">${movie.Runtime || "N/A"}</span>
                        <span class="badge">${movie.Genre || "Drama"}</span>
                        <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">IMDb: ${movie.imdbRating || "N/A"}</span>
                    </div>

                    <p class="modal-plot">${movie.Plot || "No plot summary available."}</p>

                    <div class="modal-meta-row"><strong>Director:</strong> ${movie.Director || "N/A"}</div>
                    <div class="modal-meta-row"><strong>Writers:</strong> ${movie.Writer || "N/A"}</div>
                    <div class="modal-meta-row"><strong>Stars:</strong> ${movie.Actors || "N/A"}</div>
                    <div class="modal-meta-row"><strong>Awards:</strong> ${movie.Awards || "N/A"}</div>
                    <div class="modal-meta-row"><strong>Box Office:</strong> ${movie.BoxOffice || "N/A"}</div>

                    <div class="rating-selector">
                        <strong style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">Your Personal Rating:</strong>
                        <div class="stars-interactive" id="modal-star-rating">
                            <span data-star="1">★</span>
                            <span data-star="2">★</span>
                            <span data-star="3">★</span>
                            <span data-star="4">★</span>
                            <span data-star="5">★</span>
                        </div>
                        <span id="rating-label" style="margin-left: 10px; font-size: 0.9rem; color: var(--text-muted);">${currentRating ? currentRating + " of 5 stars" : "Not rated yet"}</span>
                    </div>
                </div>
            </div>
        `;

        // Fav toggle in modal
        const favBtn = modalContent.querySelector(".modal-fav-toggle-btn");
        favBtn.addEventListener("click", () => {
            if (!MV.favorites) return;
            const updated = MV.favorites.toggle({
                id: movie.imdbID,
                title: movie.Title,
                year: movie.Year,
                genre: movie.Genre,
                poster: movie.Poster
            });
            favBtn.textContent = updated ? "★ In Favorites" : "☆ Add to Favorites";
        });

        // Interactive star rating
        const starsContainer = modalContent.querySelector("#modal-star-rating");
        const ratingLabel = modalContent.querySelector("#rating-label");
        const stars = starsContainer.querySelectorAll("span");

        function updateStarsView(score) {
            stars.forEach((s, idx) => {
                if (idx < score) {
                    s.classList.add("active");
                } else {
                    s.classList.remove("active");
                }
            });
        }
        updateStarsView(currentRating);

        stars.forEach(star => {
            const score = parseInt(star.dataset.star, 10);
            star.addEventListener("mouseenter", () => {
                stars.forEach((s, idx) => s.classList.toggle("hovered", idx < score));
            });
            star.addEventListener("mouseleave", () => {
                stars.forEach(s => s.classList.remove("hovered"));
            });
            star.addEventListener("click", () => {
                if (MV.favorites) {
                    MV.favorites.rate(movie.imdbID, score, {
                        title: movie.Title,
                        year: movie.Year,
                        genre: movie.Genre
                    });
                    updateStarsView(score);
                    ratingLabel.textContent = `${score} of 5 stars (saved)`;
                }
            });
        });
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", () => modalOverlay.classList.remove("is-active"));
    }
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.remove("is-active");
        });
    }

    // ==========================================
    // 5. AUTOCOMPLETE & SEARCH HISTORY
    // ==========================================
    function getHistory() {
        return MV.readJSON("movieverse_search_history", ["Batman", "Interstellar", "Inception", "Dune", "Avatar"]);
    }

    function addToHistory(query) {
        const history = getHistory().filter(q => q.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        MV.writeJSON("movieverse_search_history", history.slice(0, 8));
        renderHistory();
    }

    function renderHistory() {
        if (!historyContainer) return;
        const history = getHistory();
        historyContainer.innerHTML = "";
        history.forEach(q => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "search-chip";
            chip.textContent = q;
            chip.addEventListener("click", () => {
                searchInput.value = q;
                executeSearch(q, 1);
            });
            historyContainer.appendChild(chip);
        });
    }

    // Live search debouncing & autocomplete
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const val = this.value.trim();
            clearTimeout(debounceTimer);

            if (val.length < 2) {
                if (suggestionsDropdown) suggestionsDropdown.style.display = "none";
                return;
            }

            debounceTimer = setTimeout(async function () {
                // Fetch autocomplete suggestions
                try {
                    const data = await fetchOmdb({ s: val, page: 1 });
                    if (data && data.Response === "True" && suggestionsDropdown) {
                        suggestionsDropdown.innerHTML = "";
                        data.Search.slice(0, 5).forEach(item => {
                            const li = document.createElement("li");
                            li.innerHTML = `<span><strong>${item.Title}</strong> (${item.Year})</span> <span style="font-size:0.8rem; color:var(--text-muted);">${item.Type}</span>`;
                            li.addEventListener("click", () => {
                                searchInput.value = item.Title;
                                suggestionsDropdown.style.display = "none";
                                executeSearch(item.Title, 1);
                            });
                            suggestionsDropdown.appendChild(li);
                        });
                        suggestionsDropdown.style.display = "block";
                    } else if (suggestionsDropdown) {
                        suggestionsDropdown.style.display = "none";
                    }
                } catch (e) {}
            }, 350);
        });

        // Hide dropdown on click outside
        document.addEventListener("click", function (e) {
            if (suggestionsDropdown && !searchInput.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
                suggestionsDropdown.style.display = "none";
            }
        });
    }

    // Search submit
    searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (suggestionsDropdown) suggestionsDropdown.style.display = "none";
        const q = searchInput.value.trim();
        if (q.length >= 2) {
            executeSearch(q, 1);
        }
    });

    // Load More pagination
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", function () {
            if (!isFetching) {
                executeSearch(currentQuery, currentPage + 1, true);
            }
        });
    }

    // Type filter buttons
    document.querySelectorAll("[data-search-type]").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll("[data-search-type]").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentType = this.dataset.searchType;
            if (currentQuery) {
                executeSearch(currentQuery, 1);
            }
        });
    });

    // Initial load: render history and run default query
    renderHistory();
    const initialQuery = new URLSearchParams(window.location.search).get("q") || "Interstellar";
    searchInput.value = initialQuery;
    executeSearch(initialQuery, 1);
})();
